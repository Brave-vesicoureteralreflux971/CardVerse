#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const result = {}

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    result[key] = value
  }

  return result
}

function loadEnv() {
  const cwd = process.cwd()
  const fileEnv = {
    ...parseEnvFile(path.join(cwd, '.env')),
    ...parseEnvFile(path.join(cwd, '.env.local')),
  }

  return {
    ...fileEnv,
    ...process.env,
  }
}

function resolveDatabaseUrl(env) {
  const host = env.DB_HOST
  const port = env.DB_PORT || '3306'
  const user = env.DB_USER
  const password = env.DB_PASSWORD
  const database = env.DB_NAME

  const missing = [
    ['DB_HOST', host],
    ['DB_USER', user],
    ['DB_PASSWORD', password],
    ['DB_NAME', database],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing database environment variables: ${missing.join(', ')}`)
  }

  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`
}

function main() {
  const command = process.argv[2]
  const args = process.argv.slice(3)

  if (!command) {
    console.error('Usage: node scripts/with-db-env.js <command> [...args]')
    process.exit(1)
  }

  const env = loadEnv()
  const databaseUrl = resolveDatabaseUrl(env)

  if (databaseUrl) {
    env.DATABASE_URL = databaseUrl
  }

  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    env,
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 1)
  })

  child.on('error', (error) => {
    console.error(error.message)
    process.exit(1)
  })
}

main()
