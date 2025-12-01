import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import * as XLSX from 'xlsx'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // Get dashboard with elements and datasources
    const { rows: dashboards } = await query(`
      SELECT d.*, 
             ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as space_names,
             COUNT(DISTINCT de.id) as element_count,
             COUNT(DISTINCT dds.id) as datasource_count
      FROM public.dashboards d
      LEFT JOIN dashboard_spaces ds ON ds.dashboard_id = d.id
      LEFT JOIN spaces s ON s.id = ds.space_id
      LEFT JOIN dashboard_elements de ON de.dashboard_id = d.id
      LEFT JOIN dashboard_datasources dds ON dds.dashboard_id = d.id
      WHERE d.id = $1 AND d.deleted_at IS NULL
        AND (
          d.created_by = $2 OR
          d.id IN (SELECT dashboard_id FROM dashboard_permissions WHERE user_id = $2) OR
          (ds.space_id IN (SELECT space_id FROM space_members WHERE user_id = $2)) OR
          d.visibility = 'PUBLIC'
        )
      GROUP BY d.id
    `, [id, session.user.id])

    if (dashboards.length === 0) {
      return NextResponse.json({ error: 'Dashboard not found'  })

export const POST = withErrorHandling(postHandler, 'POST /api/src\app\api\dashboards\[id]\export\excel\route.ts')

    const dashboard = dashboards[0]

    // Get dashboard elements
    const { rows: elements } = await query(`
      SELECT * FROM dashboard_elements 
      WHERE dashboard_id = $1 
      ORDER BY z_index ASC, position_y ASC, position_x ASC
    `, [id])

    // Get dashboard datasources
    const { rows: datasources } = await query(`
      SELECT * FROM dashboard_datasources 
      WHERE dashboard_id = $1 AND is_active = true
      ORDER BY created_at ASC
    `, [id])

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Dashboard metadata sheet
    const metadataData = [
      ['Dashboard Name', dashboard.name],
      ['Description', dashboard.description || ''],
      ['Type', dashboard.type],
      ['Visibility', dashboard.visibility],
      ['Spaces', dashboard.space_names?.join(', ') || ''],
      ['Elements Count', dashboard.element_count],
      ['Data Sources Count', dashboard.datasource_count],
      ['Refresh Rate', dashboard.is_realtime ? 'Real-time' : `${dashboard.refresh_rate} seconds`],
      ['Created At', new Date(dashboard.created_at).toLocaleString()],
      ['Updated At', new Date(dashboard.updated_at).toLocaleString()]
    ]

    const metadataSheet = XLSX.utils.aoa_to_sheet(metadataData)
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Dashboard Info')

    // Elements sheet
    if (elements.length > 0) {
      const elementsData = elements.map(element => ({
        'Element Name': element.name,
        'Type': element.type,
        'Chart Type': element.chart_type || '',
        'Position X': element.position_x,
        'Position Y': element.position_y,
        'Width': element.width,
        'Height': element.height,
        'Z Index': element.z_index,
        'Visible': element.is_visible ? 'Yes' : 'No',
        'Configuration': JSON.stringify(element.config, null, 2),
        'Style': JSON.stringify(element.style, null, 2),
        'Data Config': JSON.stringify(element.data_config, null, 2)
      }))

      const elementsSheet = XLSX.utils.json_to_sheet(elementsData)
      XLSX.utils.book_append_sheet(workbook, elementsSheet, 'Elements')
    }

    // Data sources sheet
    if (datasources.length > 0) {
      const datasourcesData = datasources.map(datasource => ({
        'Name': datasource.name,
        'Source Type': datasource.source_type,
        'Source ID': datasource.source_id || '',
        'Active': datasource.is_active ? 'Yes' : 'No',
        'Configuration': JSON.stringify(datasource.config, null, 2),
        'Query Config': JSON.stringify(datasource.query_config, null, 2),
        'Created At': new Date(datasource.created_at).toLocaleString()
      }))

      const datasourcesSheet = XLSX.utils.json_to_sheet(datasourcesData)
      XLSX.utils.book_append_sheet(workbook, datasourcesSheet, 'Data Sources')
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${dashboard.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx"`
      }
    })
