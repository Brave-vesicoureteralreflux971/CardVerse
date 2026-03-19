import { PrismaClient } from '@prisma/client'
import { hashSync } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const username = process.env.DEFAULT_ADMIN_USERNAME ?? 'admin'
  const password = process.env.DEFAULT_ADMIN_PASSWORD ?? 'Jenkinwoo123!'
  const email = process.env.DEFAULT_ADMIN_EMAIL ?? 'admin@frp.gs'

  await prisma.admin.upsert({
    where: { username },
    update: {
      email,
      passwordHash: hashSync(password, 10),
      status: true,
    },
    create: {
      username,
      nickname: '默认管理员',
      email,
      passwordHash: hashSync(password, 10),
      status: true,
    },
  })

  console.log(`Seeded default admin: ${username}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
