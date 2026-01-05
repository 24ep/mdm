import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('Verifying system settings...')

  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'sessionTimeout' },
  })

  if (setting) {
    console.log(`Found sessionTimeout: ${setting.value}`)
    if (setting.value === '24') {
        console.log('VERIFICATION SUCCESS: sessionTimeout is correctly set to 24')
    } else {
        console.log(`VERIFICATION FAILED: sessionTimeout is ${setting.value}, expected 24`)
    }
  } else {
    console.log('VERIFICATION FAILED: sessionTimeout setting not found')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
