
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupMenu() {
    console.log('🧹 Cleaning up menu configuration...');

    // 1. Remove deprecated items
    const itemsToRemove = ['integrations', 'api'];
    try {
        const deleteResult = await prisma.menuItem.deleteMany({
            where: { slug: { in: itemsToRemove } }
        });
        console.log(`✅ Removed ${deleteResult.count} legacy items: ${itemsToRemove.join(', ')}`);
    } catch (e) {
        console.error('❌ Error removing items:', e);
    }

    // 2. Update 'settings' href if it's pointing to the old /settings
    try {
        const updateResult = await prisma.menuItem.updateMany({
            where: { slug: 'settings' },
            data: { href: '/system/settings' }
        });
        console.log(`✅ Updated System Settings link to /system/settings (Count: ${updateResult.count})`);
    } catch (e) {
        console.error('❌ Error updating settings link:', e);
    }

    await prisma.$disconnect();
}

cleanupMenu();
