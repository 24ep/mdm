import * as XLSX from 'xlsx'
import type { Report } from '@/app/reports/page'

export function exportReportsToCSV(reports: Report[], filename: string = 'reports') {
  const headers = ['Name', 'Description', 'Source', 'Owner', 'Workspace', 'Status', 'Created At', 'Updated At']
  const rows = reports.map(report => [
    report.name || '',
    report.description || '',
    report.source,
    report.owner || '',
    report.workspace || '',
    report.is_active ? 'Active' : 'Inactive',
    new Date(report.created_at).toLocaleDateString(),
    new Date(report.updated_at).toLocaleDateString(),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportReportsToExcel(reports: Report[], filename: string = 'reports') {
  const data = reports.map(report => ({
    Name: report.name || '',
    Description: report.description || '',
    Source: report.source,
    Owner: report.owner || '',
    Workspace: report.workspace || '',
    Status: report.is_active ? 'Active' : 'Inactive',
    'Created At': new Date(report.created_at).toLocaleString(),
    'Updated At': new Date(report.updated_at).toLocaleString(),
    Link: report.link || '',
    'Embed URL': report.embed_url || '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports')
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

export function exportReportsToJSON(reports: Report[], filename: string = 'reports') {
  const dataStr = JSON.stringify(reports, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.json`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

