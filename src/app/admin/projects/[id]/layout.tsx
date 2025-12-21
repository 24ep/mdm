import { ProjectLayout } from '@/features/projects/layouts/ProjectLayout'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'

interface LayoutProps {
    children: React.ReactNode
    params: Promise<{
        id: string
    }>
}

export default async function Layout({ children, params }: LayoutProps) {
    const { id } = await params
    const project = await prisma.project.findUnique({
        where: { id },
        select: { id: true, name: true }
    })

    if (!project) {
        notFound()
    }

    return (
        <ProjectLayout projectId={project.id} projectName={project.name}>
            {children}
        </ProjectLayout>
    )
}
