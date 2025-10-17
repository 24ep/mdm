import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PublicDashboardPageProps {
  params: {
    publicLink: string
  }
}

export default async function PublicDashboardPage({ params }: PublicDashboardPageProps) {
  const { publicLink } = params

  // Fetch dashboard by public link
  const { data: dashboard, error } = await supabase
    .from('dashboards')
    .select(`
      *,
      elements: dashboard_elements(*),
      datasources: data_sources(*)
    `)
    .eq('public_link', publicLink)
    .eq('visibility', 'PUBLIC')
    .single()

  if (error || !dashboard) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{dashboard.name}</h1>
          {dashboard.description && (
            <p className="text-gray-600 mt-2">{dashboard.description}</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
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

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Powered by Dashboard Builder</p>
        </div>
      </div>
    </div>
  )
}
