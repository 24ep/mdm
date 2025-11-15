import { Job } from './job-queue'
import { query } from '@/lib/db'
import XLSX from 'xlsx'
import { uploadJobFile } from './storage-helper'

/**
 * Export worker - processes export jobs
 */
export async function processExportJob(job: Job): Promise<void> {
  try {
    // Get job details from database
    const jobResult = await query(
      `SELECT * FROM export_jobs WHERE id = $1`,
      [job.id]
    )

    if (jobResult.rows.length === 0) {
      throw new Error('Export job not found')
    }

    const exportJob = jobResult.rows[0]
    const dataModelId = exportJob.data_model_id
    const format = exportJob.format || 'xlsx'
    const filters = typeof exportJob.filters === 'string'
      ? JSON.parse(exportJob.filters)
      : exportJob.filters
    const columns = typeof exportJob.columns === 'string'
      ? JSON.parse(exportJob.columns)
      : exportJob.columns

    // Build query to fetch data
    let whereConditions = ['dr.deleted_at IS NULL', 'dr.data_model_id = $1']
    const queryParams: any[] = [dataModelId]
    let paramIndex = 2

    // Apply filters
    if (filters.search) {
      whereConditions.push(`dr.data::text ILIKE $${paramIndex}`)
      queryParams.push(`%${filters.search}%`)
      paramIndex++
    }

    if (filters.ids && Array.isArray(filters.ids) && filters.ids.length > 0) {
      whereConditions.push(`dr.id = ANY($${paramIndex}::uuid[])`)
      queryParams.push(filters.ids)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM data_records dr WHERE ${whereClause}`,
      queryParams
    )
    const totalRows = parseInt(countResult.rows[0]?.total || '0')

    // Update total rows
    await query(
      `UPDATE export_jobs SET total_rows = $1 WHERE id = $2`,
      [totalRows, job.id]
    )

    // Fetch data in batches
    const batchSize = 1000
    let processedRows = 0
    const allData: any[] = []

    while (processedRows < totalRows) {
      const batchResult = await query(
        `SELECT dr.id, dr.data, dr.created_at, dr.updated_at
         FROM data_records dr
         WHERE ${whereClause}
         ORDER BY dr.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, batchSize, processedRows]
      )

      const rows = batchResult.rows.map((row: any) => {
        const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
        return {
          id: row.id,
          ...data,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }
      })

      allData.push(...rows)
      processedRows += rows.length

      const progress = Math.floor((processedRows / totalRows) * 100)

      // Update progress
      await query(
        `UPDATE export_jobs 
         SET processed_rows = $1, progress = $2, updated_at = NOW()
         WHERE id = $3`,
        [processedRows, progress, job.id]
      )

      job.progress = progress
      job.data = { processedRows, totalRows }
    }

    // Generate file based on format
    let fileBuffer: Buffer
    let fileName: string
    let mimeType: string

    if (format === 'xlsx') {
      // Create Excel workbook
      const worksheet = XLSX.utils.json_to_sheet(allData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
      fileBuffer = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
      fileName = `export-${job.id}.xlsx`
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } else if (format === 'csv') {
      // Create CSV
      const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(allData))
      fileBuffer = Buffer.from(csv, 'utf-8')
      fileName = `export-${job.id}.csv`
      mimeType = 'text/csv'
    } else if (format === 'json') {
      // Create JSON
      fileBuffer = Buffer.from(JSON.stringify(allData, null, 2), 'utf-8')
      fileName = `export-${job.id}.json`
      mimeType = 'application/json'
    } else {
      throw new Error(`Unsupported format: ${format}`)
    }

    // Upload file to storage
    const uploadResult = await uploadJobFile(fileName, fileBuffer, mimeType, 'export')
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Failed to upload file to storage')
    }

    const fileUrl = uploadResult.url || uploadResult.path || `/api/import-export/jobs/${job.id}/download`

    // Mark as completed
    await query(
      `UPDATE export_jobs 
       SET status = 'COMPLETED', progress = 100, completed_at = NOW(), updated_at = NOW(),
           file_url = $1, file_name = $2, file_size = $3
       WHERE id = $4`,
      [fileUrl, fileName, fileBuffer.length, job.id]
    )

    job.status = 'COMPLETED'
    job.progress = 100
    job.result = {
      fileUrl,
      fileName,
      fileSize: fileBuffer.length,
    }
  } catch (error: any) {
    console.error('Export job processing error:', error)

    // Mark as failed
    await query(
      `UPDATE export_jobs 
       SET status = 'FAILED', error_message = $1, completed_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [error.message, job.id]
    )

    job.status = 'FAILED'
    job.error = error.message
    throw error
  }
}

