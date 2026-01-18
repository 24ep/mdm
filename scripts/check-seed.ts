
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
  const users = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } })
  console.log('Super Admins:', users)
  
  const menuItems = await prisma.menuItem.findMany()
  console.log('Menu Items Count:', menuItems.length)
  console.log('Menu Items Sample:', menuItems.slice(0, 3))
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
