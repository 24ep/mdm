import { Job } from './job-queue'
import { query } from '@/lib/db'
import XLSX from 'xlsx'
import { downloadJobFile } from './storage-helper'

/**
 * Import worker - processes import jobs
 */
export async function processImportJob(job: Job): Promise<void> {
  try {
    // Get job details from database
    const jobResult = await query(
      `SELECT * FROM import_jobs WHERE id = $1`,
      [job.id]
    )

    if (jobResult.rows.length === 0) {
      throw new Error('Import job not found')
    }

    const importJob = jobResult.rows[0]
    const dataModelId = importJob.data_model_id
    const mapping = typeof importJob.mapping === 'string' 
      ? JSON.parse(importJob.mapping) 
      : importJob.mapping
    const filePath = importJob.file_path || importJob.file_name

    if (!filePath) {
      throw new Error('File path not found in import job')
    }

    // Download file from storage
    const downloadResult = await downloadJobFile(filePath)
    if (!downloadResult.success || !downloadResult.buffer) {
      throw new Error(downloadResult.error || 'Failed to download file from storage')
    }

    const fileBuffer = downloadResult.buffer

    // Parse file based on type
    let rows: any[] = []
    const fileType = importJob.file_type || ''

    if (fileType.includes('csv') || fileType === 'text/csv') {
      // Parse CSV
      const csvText = fileBuffer.toString('utf-8')
      const workbook = XLSX.read(csvText, { type: 'string' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      rows = XLSX.utils.sheet_to_json(worksheet, { raw: false })
    } else if (
      fileType.includes('excel') || 
      fileType.includes('spreadsheet') ||
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'application/vnd.ms-excel'
    ) {
      // Parse Excel
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      rows = XLSX.utils.sheet_to_json(worksheet, { raw: false })
    } else {
      throw new Error(`Unsupported file type: ${fileType}`)
    }

    const totalRows = rows.length
    let processedRows = 0
    let importedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    // Update total rows
    await query(
      `UPDATE import_jobs SET total_rows = $1 WHERE id = $2`,
      [totalRows, job.id]
    )

    // Get data model attributes for mapping
    const attributesResult = await query(
      `SELECT id, name, type FROM data_model_attributes 
       WHERE data_model_id = $1 AND deleted_at IS NULL`,
      [dataModelId]
    )
    const attributes = attributesResult.rows

    // Process in batches
    const batchSize = 100
    while (processedRows < totalRows) {
      const batchEnd = Math.min(processedRows + batchSize, totalRows)
      const batch = rows.slice(processedRows, batchEnd)

      for (const row of batch) {
        try {
          // Map row data according to mapping
          const mappedData: Record<string, any> = {}
          
          if (Object.keys(mapping).length > 0) {
            // Use provided mapping
            for (const [sourceCol, targetAttr] of Object.entries(mapping)) {
              if (row[sourceCol] !== undefined) {
                mappedData[targetAttr as string] = row[sourceCol]
              }
            }
          } else {
            // Auto-map by attribute name
            for (const attr of attributes) {
              if (row[attr.name] !== undefined) {
                mappedData[attr.name] = row[attr.name]
              }
            }
          }

          // Insert data record
          await query(
            `INSERT INTO data_records (
              id, data_model_id, data, created_by, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2::jsonb, $3, NOW(), NOW()
            )`,
            [dataModelId, JSON.stringify(mappedData), importJob.created_by]
          )

          importedCount++
        } catch (error: any) {
          skippedCount++
          errors.push(`Row ${processedRows + 1}: ${error.message}`)
          if (errors.length > 10) {
            errors.shift() // Keep only last 10 errors
          }
        }

        processedRows++
        const progress = Math.floor((processedRows / totalRows) * 100)

        // Update progress every 10 rows
        if (processedRows % 10 === 0) {
          await query(
            `UPDATE import_jobs 
             SET processed_rows = $1, progress = $2, updated_at = NOW()
             WHERE id = $3`,
            [processedRows, progress, job.id]
          )

          job.progress = progress
          job.data = { processedRows, totalRows }
        }
      }
    }

    // Mark as completed
    await query(
      `UPDATE import_jobs 
       SET status = 'COMPLETED', progress = 100, completed_at = NOW(), updated_at = NOW(),
           result = $1
       WHERE id = $2`,
      [
        JSON.stringify({
          importedCount,
          skippedCount,
          errors: errors.slice(0, 10), // Keep only first 10 errors
        }),
        job.id,
      ]
    )

    job.status = 'COMPLETED'
    job.progress = 100
    job.result = {
      importedCount,
      skippedCount,
      errors: errors.slice(0, 10),
    }
  } catch (error: any) {
    console.error('Import job processing error:', error)
    
    // Mark as failed
    await query(
      `UPDATE import_jobs 
       SET status = 'FAILED', error_message = $1, completed_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [error.message, job.id]
    )

    job.status = 'FAILED'
    job.error = error.message
    throw error
  }
}

