import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement your authentication system here
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')

    if (!spaceId) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 })
    }

    // Check if user has access to this space
    const memberResult = await query(
      'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
      [spaceId, userId]
    )

    if (memberResult.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 })
    }

    // Get quota information
    const quotaResult = await query(
      `SELECT 
        fq.id,
        fq.space_id,
        fq.max_files,
        fq.max_size,
        fq.allowed_file_types,
        fq.current_files,
        fq.current_size,
        fq.warning_threshold,
        fq.is_enforced,
        fq.created_at,
        fq.updated_at
       FROM file_quotas fq
       WHERE fq.space_id = $1`,
      [spaceId]
    )

    if (quotaResult.rows.length === 0) {
      // Create default quota if it doesn't exist
      const defaultQuotaResult = await query(
        `INSERT INTO file_quotas (space_id, max_files, max_size, allowed_file_types)
         VALUES ($1, 1000, 1073741824, ARRAY['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
         RETURNING *`,
        [spaceId]
      )

      return NextResponse.json({
        quota: defaultQuotaResult.rows[0]
      })
    }

    const quota = quotaResult.rows[0]

    // Calculate usage percentages
    const fileUsagePercentage = quota.max_files > 0 ? Math.round((quota.current_files / quota.max_files) * 100) : 0
    const sizeUsagePercentage = quota.max_size > 0 ? Math.round((quota.current_size / quota.max_size) * 100) : 0

    // Check if warnings should be triggered
    const isFileWarning = fileUsagePercentage >= quota.warning_threshold
    const isSizeWarning = sizeUsagePercentage >= quota.warning_threshold

    return NextResponse.json({
      quota: {
        ...quota,
        usage: {
          files: {
            current: quota.current_files,
            max: quota.max_files,
            percentage: fileUsagePercentage,
            isWarning: isFileWarning
          },
          size: {
            current: quota.current_size,
            max: quota.max_size,
            percentage: sizeUsagePercentage,
            isWarning: isSizeWarning
          }
        }
      }
    })

  } catch (error) {
    console.error('Error fetching quotas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // TODO: Implement your authentication system here
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { spaceId, maxFiles, maxSize, allowedFileTypes, warningThreshold, isEnforced } = await request.json()

    if (!spaceId) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 })
    }

    // Check if user has admin access to this space
    const memberResult = await query(
      'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
      [spaceId, userId]
    )

    if (memberResult.rows.length === 0 || !['owner', 'admin'].includes(memberResult.rows[0].role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate quota values
    if (maxFiles && maxFiles < 0) {
      return NextResponse.json({ error: 'Max files must be positive' }, { status: 400 })
    }

    if (maxSize && maxSize < 0) {
      return NextResponse.json({ error: 'Max size must be positive' }, { status: 400 })
    }

    if (warningThreshold && (warningThreshold < 1 || warningThreshold > 100)) {
      return NextResponse.json({ error: 'Warning threshold must be between 1 and 100' }, { status: 400 })
    }

    // Update quota
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    if (maxFiles !== undefined) {
      updateFields.push(`max_files = $${paramIndex}`)
      updateValues.push(maxFiles)
      paramIndex++
    }

    if (maxSize !== undefined) {
      updateFields.push(`max_size = $${paramIndex}`)
      updateValues.push(maxSize)
      paramIndex++
    }

    if (allowedFileTypes !== undefined) {
      updateFields.push(`allowed_file_types = $${paramIndex}`)
      updateValues.push(allowedFileTypes)
      paramIndex++
    }

    if (warningThreshold !== undefined) {
      updateFields.push(`warning_threshold = $${paramIndex}`)
      updateValues.push(warningThreshold)
      paramIndex++
    }

    if (isEnforced !== undefined) {
      updateFields.push(`is_enforced = $${paramIndex}`)
      updateValues.push(isEnforced)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updateFields.push(`updated_at = NOW()`)
    updateValues.push(spaceId)

    const updateResult = await query(
      `UPDATE file_quotas 
       SET ${updateFields.join(', ')}
       WHERE space_id = $${paramIndex}
       RETURNING *`,
      [...updateValues]
    )

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Quota not found' }, { status: 404 })
    }

    return NextResponse.json({
      quota: updateResult.rows[0]
    })

  } catch (error) {
    console.error('Error updating quotas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
