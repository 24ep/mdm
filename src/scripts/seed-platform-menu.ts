
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPlatformMenu() {
    console.log('🌱 Seeding Platform Menu...')

    const groups = [
        {
            name: 'Overview',
            slug: 'overview',
            icon: 'Monitor',
            priority: 10,
            isVisible: true,
            items: [
                { name: 'Dashboard', slug: 'dashboard', href: '/dashboard', icon: 'BarChart3', priority: 10, requiredRoles: ['USER'] },
                { name: 'Spaces', slug: 'spaces', href: '/spaces', icon: 'Layout', priority: 20, requiredRoles: ['USER'] }
            ]
        },
        {
            name: 'Tools',
            slug: 'tools',
            icon: 'FlaskConical',
            priority: 20,
            isVisible: true,
            items: [
                // AI & Automation
                { name: 'Marketplace', slug: 'marketplace', href: '/marketplace', icon: 'Store', priority: 10, requiredRoles: ['USER'], section: 'AI & Automation' },
                { name: 'Knowledge', slug: 'knowledge', href: '/knowledge', icon: 'BookOpen', priority: 20, requiredRoles: ['USER'], section: 'AI & Automation' },
                // Developer Tools
                { name: 'PWA Builder', slug: 'pwa-builder', href: '/tools/pwa', icon: 'Smartphone', priority: 50, requiredRoles: ['ADMIN'], section: 'Developer Tools' },
                // Analytics & BI
                { name: 'BI Dashboard', slug: 'bi-dashboard', href: '/tools/bi', icon: 'BarChart', priority: 60, requiredRoles: ['ADMIN'], section: 'Analytics & BI' },
                // Storage & Governance
                { name: 'Storage Tool', slug: 'storage-tool', href: '/tools/storage', icon: 'HardDrive', priority: 96, requiredRoles: ['ADMIN'], section: 'Storage & Governance' },
                { name: 'Governance Tool', slug: 'governance-tool', href: '/tools/data-governance', icon: 'Shield', priority: 97, requiredRoles: ['ADMIN'], section: 'Storage & Governance' }
            ]
        },
        {
            name: 'Data Management',
            slug: 'data-management',
            icon: 'FolderKanban',
            priority: 40,
            isVisible: true,
            items: [
                { name: 'Data Models', slug: 'data-models', href: '/admin/data', icon: 'Database', priority: 10, requiredRoles: ['USER'], section: 'General' },
                { name: 'Import/Export', slug: 'import-export', href: '/admin/import-export', icon: 'HardDrive', priority: 20, requiredRoles: ['MANAGER'], section: 'General' },
                { name: 'Data Governance', slug: 'data-governance', href: '/admin/data-governance', icon: 'ShieldCheck', priority: 30, requiredRoles: ['ADMIN'], section: 'Advanced' },
                { name: 'Schema Migrations', slug: 'schema-migrations', href: '/admin/schema-migrations', icon: 'GitBranch', priority: 40, requiredRoles: ['ADMIN'], section: 'Advanced' },
                { name: 'SQL Linting', slug: 'sql-linting', href: '/admin/sql-linting', icon: 'Code', priority: 50, requiredRoles: ['ADMIN'], section: 'Advanced' },
                { name: 'Data Masking', slug: 'data-masking', href: '/admin/data-masking', icon: 'EyeOff', priority: 55, requiredRoles: ['ADMIN'], section: 'Advanced' }
            ]
        },
        {
            name: 'Infrastructure',
            slug: 'infrastructure',
            icon: 'Network',
            priority: 30,
            isVisible: true,
            items: [
                { name: 'Instances', slug: 'infra-instances', href: '/infrastructure/instances', icon: 'Server', priority: 10, requiredRoles: ['ADMIN'], section: 'Monitoring & Computing' },
                { name: 'Monitoring', slug: 'infra-monitoring', href: '/infrastructure/monitoring', icon: 'Activity', priority: 20, requiredRoles: ['ADMIN'], section: 'Monitoring & Computing' },
                { name: 'Storage', slug: 'storage', href: '/admin/storage', icon: 'HardDrive', priority: 30, requiredRoles: ['ADMIN'], section: 'Data & Persistence' },
                { name: 'Cache', slug: 'cache', href: '/admin/cache', icon: 'Zap', priority: 40, requiredRoles: ['ADMIN'], section: 'Data & Persistence' },
                { name: 'Database', slug: 'database', href: '/admin/database', icon: 'Database', priority: 50, requiredRoles: ['ADMIN'], section: 'Data & Persistence' },
                { name: 'Backups', slug: 'backup', href: '/admin/backup', icon: 'CheckCircle2', priority: 60, requiredRoles: ['ADMIN'], section: 'Data & Persistence' }
            ]
        },


        {
            name: 'System',
            slug: 'system',
            icon: 'Settings',
            priority: 50,
            isVisible: true,
            items: [
                // Analytics
                { name: 'Analytics', slug: 'analytics-dashboard', href: '/admin/analytics', icon: 'BarChart3', priority: 5, requiredRoles: ['ADMIN'], section: 'Insights' },
                { name: 'System Logs', slug: 'logs', href: '/admin/logs', icon: 'FileText', priority: 6, requiredRoles: ['ADMIN'], section: 'Insights' },

                { name: 'Users', slug: 'users', href: '/admin/users', icon: 'Users', priority: 10, requiredRoles: ['ADMIN'], section: 'Access & Security' },
                { name: 'Roles', slug: 'roles', href: '/admin/roles', icon: 'ShieldCheck', priority: 15, requiredRoles: ['ADMIN'], section: 'Access & Security' },
                { name: 'Security', slug: 'security', href: '/admin/security', icon: 'Shield', priority: 20, requiredRoles: ['ADMIN'], section: 'Access & Security' },
                { name: 'Audit Logs', slug: 'audit', href: '/admin/audit', icon: 'FileText', priority: 25, requiredRoles: ['ADMIN'], section: 'Access & Security' },
                { name: 'Permission Tester', slug: 'permission-tester', href: '/admin/permission-tester', icon: 'Key', priority: 60, requiredRoles: ['ADMIN'], section: 'Access & Security' },

                { name: 'Notifications', slug: 'notifications', href: '/admin/notifications', icon: 'Bell', priority: 28, requiredRoles: ['ADMIN'], section: 'Resources' },
                { name: 'Assets', slug: 'assets', href: '/admin/assets', icon: 'Paperclip', priority: 29, requiredRoles: ['ADMIN'], section: 'Resources' },
                { name: 'Attachments', slug: 'attachments', href: '/admin/attachments', icon: 'Paperclip', priority: 55, requiredRoles: ['ADMIN'], section: 'Resources' },

                { name: 'Settings', slug: 'settings', href: '/admin/settings', icon: 'Settings', priority: 30, requiredRoles: ['ADMIN'], section: 'System Configuration' },
                { name: 'Themes', slug: 'themes', href: '/admin/themes', icon: 'Palette', priority: 35, requiredRoles: ['ADMIN'], section: 'System Configuration' },
                { name: 'Kernels', slug: 'kernels', href: '/admin/kernels', icon: 'Cpu', priority: 40, requiredRoles: ['ADMIN'], section: 'System Configuration' },
                { name: 'Change Requests', slug: 'change-requests', href: '/admin/change-requests', icon: 'GitPullRequest', priority: 45, requiredRoles: ['ADMIN'], section: 'System Configuration' },
                { name: 'Page Templates', slug: 'page-templates', href: '/admin/page-templates', icon: 'LayoutTemplate', priority: 50, requiredRoles: ['ADMIN'], section: 'System Configuration' }
            ]
        }
    ]

    for (const group of groups) {
        // Upsert Group
        const existingGroup = await prisma.menuGroup.findFirst({ where: { slug: group.slug } })
        let groupId = existingGroup?.id

        if (existingGroup) {
            console.log(`Updating group: ${group.name}`)
            await prisma.menuGroup.update({
                where: { id: groupId },
                data: {
                    name: group.name,
                    icon: group.icon,
                    priority: group.priority,
                    isVisible: group.isVisible
                }
            })
        } else {
            console.log(`Creating group: ${group.name}`)
            const newGroup = await prisma.menuGroup.create({
                data: {
                    name: group.name,
                    slug: group.slug,
                    icon: group.icon,
                    priority: group.priority,
                    isVisible: group.isVisible
                }
            })
            groupId = newGroup.id
        }

        // Upsert Items
        for (const item of group.items) {
            // Find item by slug (globally unique)
            const existingItem = await prisma.menuItem.findFirst({ where: { slug: item.slug } })

            if (existingItem) {
                await prisma.menuItem.update({
                    where: { id: existingItem.id },
                    data: {
                        groupId: groupId!, // Update group if it was moved
                        name: item.name,
                        icon: item.icon,
                        href: item.href,
                        section: (item as any).section || null,
                        priority: item.priority,
                        requiredRoles: item.requiredRoles,
                        isVisible: true
                    }
                })
            } else {
                await prisma.menuItem.create({
                    data: {
                        groupId: groupId!,
                        name: item.name,
                        slug: item.slug,
                        icon: item.icon,
                        href: item.href,
                        section: (item as any).section || null,
                        priority: item.priority,
                        requiredRoles: item.requiredRoles,
                        isVisible: true,
                        isBuiltin: true
                    }
                })
            }
        }
    }

    console.log('✅ Platform Menu Seeded Successfully')
    await prisma.$disconnect()
}

seedPlatformMenu()
    .catch((e) => {
        console.error(e)
        prisma.$disconnect()
        process.exit(1)
    })
