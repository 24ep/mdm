import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Mock SQL queries data - in a real implementation, this would come from a sql_queries table
    const queries = [
      {
        id: 'query-1',
        name: 'Sales Performance Analysis',
        description: 'Comprehensive sales performance analysis with revenue trends',
        sql: `SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as total_orders,
          SUM(amount) as total_revenue,
          AVG(amount) as avg_order_value
        FROM orders 
        WHERE created_at >= '2024-01-01'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month;`,
        spaceId: 'space-1',
        spaceName: 'Sales Team',
        createdBy: 'user-1',
        createdByName: 'John Doe',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isPublic: true,
        tags: ['analytics', 'sales', 'revenue'],
        permissions: [
          {
            userId: 'user-1',
            userName: 'John Doe',
            userEmail: 'john@company.com',
            permission: 'owner',
            grantedBy: 'user-1',
            grantedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          },
          {
            userId: 'user-2',
            userName: 'Jane Smith',
            userEmail: 'jane@company.com',
            permission: 'edit',
            grantedBy: 'user-1',
            grantedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          }
        ],
        gitIntegration: {
          repository: 'https://github.com/company/analytics-queries',
          branch: 'main',
          filePath: 'queries/sales-performance.sql',
          lastSync: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          autoSync: true,
          provider: 'github'
        },
        version: 3,
        isStarred: true,
        forkCount: 5,
        lastExecuted: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        executionCount: 47
      },
      {
        id: 'query-2',
        name: 'User Engagement Metrics',
        description: 'Track user engagement and activity patterns',
        sql: `SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(la.id) as login_count,
          MAX(la.created_at) as last_login,
          COUNT(dr.id) as data_records_created
        FROM users u
        LEFT JOIN login_activities la ON u.id = la.user_id
        LEFT JOIN data_records dr ON u.id = dr.created_by
        WHERE u.created_at >= '2024-01-01'
        GROUP BY u.id, u.name, u.email
        ORDER BY login_count DESC;`,
        spaceId: 'space-2',
        spaceName: 'Marketing Team',
        createdBy: 'user-3',
        createdByName: 'Mike Johnson',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isPublic: false,
        tags: ['users', 'engagement', 'analytics'],
        permissions: [
          {
            userId: 'user-3',
            userName: 'Mike Johnson',
            userEmail: 'mike@company.com',
            permission: 'owner',
            grantedBy: 'user-3',
            grantedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
          }
        ],
        gitIntegration: {
          repository: 'https://gitlab.com/company/user-analytics',
          branch: 'develop',
          filePath: 'sql/user-engagement.sql',
          lastSync: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          autoSync: false,
          provider: 'gitlab'
        },
        version: 2,
        isStarred: false,
        forkCount: 2,
        lastExecuted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        executionCount: 23
      },
      {
        id: 'query-3',
        name: 'Data Model Usage Statistics',
        description: 'Analyze usage patterns across different data models',
        sql: `SELECT 
          dm.name as data_model_name,
          dm.description,
          COUNT(dr.id) as total_records,
          COUNT(DISTINCT dr.created_by) as unique_users,
          AVG(EXTRACT(EPOCH FROM (dr.updated_at - dr.created_at))/3600) as avg_edit_time_hours
        FROM data_models dm
        LEFT JOIN data_records dr ON dm.id = dr.data_model_id
        WHERE dm.created_at >= '2024-01-01'
        GROUP BY dm.id, dm.name, dm.description
        ORDER BY total_records DESC;`,
        spaceId: 'space-1',
        spaceName: 'Sales Team',
        createdBy: 'user-2',
        createdByName: 'Jane Smith',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isPublic: true,
        tags: ['data-models', 'usage', 'statistics'],
        permissions: [
          {
            userId: 'user-2',
            userName: 'Jane Smith',
            userEmail: 'jane@company.com',
            permission: 'owner',
            grantedBy: 'user-2',
            grantedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          },
          {
            userId: 'user-1',
            userName: 'John Doe',
            userEmail: 'john@company.com',
            permission: 'view',
            grantedBy: 'user-2',
            grantedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          }
        ],
        version: 1,
        isStarred: true,
        forkCount: 8,
        lastExecuted: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        executionCount: 31
      }
    ]

    return NextResponse.json({ queries })
  } catch (error) {
    console.error('Error fetching SQL queries:', error)
    return NextResponse.json({ error: 'Failed to fetch queries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, sql, spaceId, isPublic, tags } = body

    const query = {
      id: `query-${Date.now()}`,
      name,
      description,
      sql,
      spaceId,
      spaceName: 'Space Name', // Would be fetched from space
      createdBy: 'current-user-id',
      createdByName: 'Current User',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: isPublic || false,
      tags: tags || [],
      permissions: [
        {
          userId: 'current-user-id',
          userName: 'Current User',
          userEmail: 'current@company.com',
          permission: 'owner',
          grantedBy: 'current-user-id',
          grantedAt: new Date()
        }
      ],
      version: 1,
      isStarred: false,
      forkCount: 0,
      executionCount: 0
    }

    return NextResponse.json({ query })
  } catch (error) {
    console.error('Error creating SQL query:', error)
    return NextResponse.json({ error: 'Failed to create query' }, { status: 500 })
  }
}
