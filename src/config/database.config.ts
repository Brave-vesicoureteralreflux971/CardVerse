type DatabaseEnv = Partial<
  Record<'DB_HOST' | 'DB_PORT' | 'DB_USER' | 'DB_PASSWORD' | 'DB_NAME', string>
>

export function resolveDatabaseUrl(env: DatabaseEnv): string | undefined {
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

  return `mysql://${encodeURIComponent(user!)}:${encodeURIComponent(password!)}@${host}:${port}/${database}`
}
