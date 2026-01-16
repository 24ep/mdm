
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPlatformMenu() {
    console.log('🌱 Seeding Clean Platform Menu...')

    const groups = [
        {
            name: 'Platform Overview',
            slug: 'platform-overview',
            icon: 'Monitor',
            priority: 10,
            isVisible: true,
            items: [
                { name: 'Dashboard', slug: 'dashboard', href: '/dashboard', icon: 'BarChart3', priority: 10, requiredRoles: ['USER'] },
                { name: 'Spaces', slug: 'spaces', href: '/spaces', icon: 'Layout', priority: 20, requiredRoles: ['USER'] }
            ]
        },
        {
            name: 'Data Workspace',
            slug: 'data-workspace',
            icon: 'Database',
            priority: 20,
            isVisible: true,
            items: [
                { name: 'Data Models', slug: 'data-models', href: '/admin/data', icon: 'FileText', priority: 10, requiredRoles: ['USER'], section: 'Definition' },
                { name: 'Import/Export', slug: 'import-export', href: '/admin/import-export', icon: 'UploadCloud', priority: 20, requiredRoles: ['MANAGER'], section: 'Tools' },
                { name: 'Data Explorer', slug: 'data-explorer', href: '/admin/data-explorer', icon: 'Search', priority: 30, requiredRoles: ['USER'], section: 'Tools' }
            ]
        },
        {
            name: 'Infrastructure',
            slug: 'infrastructure',
            icon: 'Network',
            priority: 30,
            isVisible: true,
            items: [
                { name: 'Instances', slug: 'infra-instances', href: '/infrastructure/instances', icon: 'Server', priority: 10, requiredRoles: ['ADMIN'], section: 'Compute' },
                { name: 'Monitoring', slug: 'infra-monitoring', href: '/infrastructure/monitoring', icon: 'Activity', priority: 20, requiredRoles: ['ADMIN'], section: 'Compute' },
                { name: 'Storage', slug: 'storage', href: '/admin/storage', icon: 'HardDrive', priority: 30, requiredRoles: ['ADMIN'], section: 'Storage' },
                { name: 'Database', slug: 'database', href: '/admin/database', icon: 'Database', priority: 40, requiredRoles: ['ADMIN'], section: 'Storage' }
            ]
        },
        {
            name: 'System Administration',
            slug: 'system-administration',
            icon: 'Settings',
            priority: 40,
            isVisible: true,
            items: [
                { name: 'Users', slug: 'users', href: '/admin/users', icon: 'Users', priority: 10, requiredRoles: ['ADMIN'], section: 'Access' },
                { name: 'Roles', slug: 'roles', href: '/admin/roles', icon: 'ShieldCheck', priority: 20, requiredRoles: ['ADMIN'], section: 'Access' },
                { name: 'Settings', slug: 'settings', href: '/admin/settings', icon: 'Settings', priority: 30, requiredRoles: ['ADMIN'], section: 'Config' },
                { name: 'Audit Logs', slug: 'audit', href: '/admin/audit', icon: 'FileText', priority: 40, requiredRoles: ['ADMIN'], section: 'Security' },
                { name: 'Security', slug: 'security', href: '/admin/security', icon: 'Shield', priority: 50, requiredRoles: ['ADMIN'], section: 'Security' }
            ]
        },
        {
            name: 'Apps & Tools',
            slug: 'apps-tools',
            icon: 'Grid',
            priority: 50,
            isVisible: true,
            items: [
                { name: 'Marketplace', slug: 'marketplace', href: '/marketplace', icon: 'Store', priority: 10, requiredRoles: ['USER'], section: 'Extensions' },
                { name: 'Knowledge', slug: 'knowledge', href: '/knowledge', icon: 'BookOpen', priority: 20, requiredRoles: ['USER'], section: 'Extensions' },
                { name: 'PWA Builder', slug: 'pwa-builder', href: '/tools/pwa', icon: 'Smartphone', priority: 30, requiredRoles: ['ADMIN'], section: 'Developer' }
            ]
        }
    ]

    // Clear existing menu to ensure clean state if requested, 
    // but here we use upsert logic for safety and continuity.

    for (const group of groups) {
        // Upsert Group
        const groupRecord = await prisma.menuGroup.upsert({
            where: { slug: group.slug },
            update: {
                name: group.name,
                icon: group.icon,
                priority: group.priority,
                isVisible: group.isVisible
            },
            create: {
                name: group.name,
                slug: group.slug,
                icon: group.icon,
                priority: group.priority,
                isVisible: group.isVisible
            }
        })

        const groupId = groupRecord.id

        // Upsert Items
        for (const item of group.items) {
            await prisma.menuItem.upsert({
                where: { slug: item.slug },
                update: {
                    groupId: groupId,
                    name: item.name,
                    icon: item.icon,
                    href: item.href,
                    section: item.section || null,
                    priority: item.priority,
                    requiredRoles: item.requiredRoles,
                    isVisible: true
                },
                create: {
                    groupId: groupId,
                    name: item.name,
                    slug: item.slug,
                    icon: item.icon,
                    href: item.href,
                    section: item.section || null,
                    priority: item.priority,
                    requiredRoles: item.requiredRoles,
                    isVisible: true,
                    isBuiltin: true
                }
            })
        }
    }

    // Optional: Hide groups/items that are no longer in our seed list but were previously seeded
    const groupSlugs = groups.map(g => g.slug)
    const itemSlugs = groups.flatMap(g => g.items.map(i => i.slug))

    await prisma.menuGroup.updateMany({
        where: { slug: { notIn: groupSlugs } },
        data: { isVisible: false }
    })

    await prisma.menuItem.updateMany({
        where: { slug: { notIn: itemSlugs } },
        data: { isVisible: false }
    })

    console.log('✅ Platform Menu Seeded Successfully')
    await prisma.$disconnect()
}

seedPlatformMenu()
    .catch((e) => {
        console.error(e)
        prisma.$disconnect()
        process.exit(1)
    })
