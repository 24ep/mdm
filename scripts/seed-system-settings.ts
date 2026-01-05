import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding system settings...')

  const settings = [
    {
      key: 'sessionTimeout',
      value: '24', // Default to 24 hours
    },
  ]

  for (const setting of settings) {
    const existing = await prisma.systemSetting.findUnique({
      where: { key: setting.key },
    })

    if (!existing) {
      console.log(`Creating setting: ${setting.key} = ${setting.value}`)
      await prisma.systemSetting.create({
        data: setting,
      })
    } else {
      console.log(`Setting already exists: ${setting.key}, skipping or valid.`)
      // Optional: Update if we want to enforce defaults, but usually seeding respects existing data
      // await prisma.systemSetting.update({
      //   where: { key: setting.key },
      //   data: { value: setting.value },
      // })
    }
  }

  console.log('System settings seeded successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
