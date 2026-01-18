
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
    const settings = await prisma.$queryRaw`SELECT key, value FROM system_settings WHERE key LIKE 'spaces_editor_config_%'`
    console.log(JSON.stringify(settings, null, 2))
}

check().finally(() => prisma.$disconnect())
