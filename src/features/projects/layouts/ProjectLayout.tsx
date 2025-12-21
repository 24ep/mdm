'use client'

import { ProjectSidebar } from '../components/ProjectSidebar'

interface ProjectLayoutProps {
    children: React.ReactNode
    projectId: string
    projectName?: string
}

export function ProjectLayout({ children, projectId, projectName }: ProjectLayoutProps) {
    return (
        <div className="flex h-full w-full">
            <ProjectSidebar projectId={projectId} projectName={projectName} />
            <main className="flex-1 overflow-auto bg-background">
                {children}
            </main>
        </div>
    )
}
