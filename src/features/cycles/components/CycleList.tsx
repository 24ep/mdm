'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Plus, Calendar, CheckCircle2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Cycle {
    id: string
    name: string
    status: string // DRAFT, UPCOMING, ACTIVE, COMPLETED
    startDate?: string
    endDate?: string
    _count?: {
        tickets: number
    }
}

export function CycleList() {
    const params = useParams()
    const projectId = params.id as string
    const [cycles, setCycles] = useState<Cycle[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Fetch cycles
        const fetchCycles = async () => {
            try {
                const response = await fetch(`/api/projects/${projectId}/cycles`)
                if (response.ok) {
                    const data = await response.json()
                    setCycles(data)
                }
            } catch (error) {
                console.error('Failed to fetch cycles', error)
            } finally {
                setLoading(false)
            }
        }

        if (projectId) {
            fetchCycles()
        }
    }, [projectId])

    const activeCycles = cycles.filter(c => c.status === 'ACTIVE')
    const upcomingCycles = cycles.filter(c => c.status === 'UPCOMING' || c.status === 'DRAFT')
    const completedCycles = cycles.filter(c => c.status === 'COMPLETED')

    const CycleCard = ({ cycle }: { cycle: Cycle }) => (
        <Card className="mb-4">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base">{cycle.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                            {cycle.startDate ? new Date(cycle.startDate).toLocaleDateString() : 'No start date'} - {cycle.endDate ? new Date(cycle.endDate).toLocaleDateString() : 'No end date'}
                        </CardDescription>
                    </div>
                    <div className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">
                        {cycle.status}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {cycle._count?.tickets || 0} Issues
                    </div>
                    {/* Progress bar could go here */}
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Cycles</h2>
                    <p className="text-muted-foreground">Manage your sprints and time-boxed work.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Cycle
                </Button>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="mt-4">
                    {activeCycles.length === 0 ? (
                        <div className="text-center py-12 border rounded-lg border-dashed">
                            <p className="text-muted-foreground">No active cycles. Start a new one!</p>
                        </div>
                    ) : (
                        activeCycles.map(cycle => <CycleCard key={cycle.id} cycle={cycle} />)
                    )}
                </TabsContent>
                <TabsContent value="upcoming" className="mt-4">
                    {upcomingCycles.map(cycle => <CycleCard key={cycle.id} cycle={cycle} />)}
                </TabsContent>
                <TabsContent value="completed" className="mt-4">
                    {completedCycles.map(cycle => <CycleCard key={cycle.id} cycle={cycle} />)}
                </TabsContent>
            </Tabs>

        </div>
    )
}
