import { notFound } from 'next/navigation'
import { db } from '@/lib/db'

interface EmbedDashboardPageProps {
  params: {
    publicLink: string
  }
}

export default async function EmbedDashboardPage({ params }: EmbedDashboardPageProps) {
  const { publicLink } = params

  // Fetch dashboard by public link using Prisma
  const dashboard = await db.dashboard.findFirst({
    where: {
      publicLink: publicLink,
      embedEnabled: true
    },
    include: {
      elements: true,
      datasources: true
    }
  })

  if (!dashboard) {
    notFound()
  }

  return (
    <div className="w-full h-full bg-white">
      <div className="p-4">
        <div className="grid grid-cols-12 gap-4">
          {dashboard.elements.map((element: any) => (
            <div
              key={element.id}
              className="col-span-12 md:col-span-6 lg:col-span-4"
              style={{
                gridColumn: `span ${element.width || 4}`,
                gridRow: `span ${element.height || 3}`
              }}
            >
              <div className="h-full bg-white border rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-sm mb-2">{element.name}</h3>
                <div className="text-xs text-muted-foreground mb-4">
                  {element.type} - {element.chart_type || 'Chart'}
                </div>
                
                {/* Render chart content based on type */}
                <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
                  <div className="text-center text-gray-500">
                    <div className="text-sm font-medium">{element.chart_type || element.type}</div>
                    <div className="text-xs mt-1">Interactive Chart</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
