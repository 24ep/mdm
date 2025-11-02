'use client'

import { useState } from 'react'

export function CSVEditor({ fileName }: { fileName: string }) {
  const [data, setData] = useState<string[][]>([
    ['A1', 'B1', 'C1'],
    ['A2', 'B2', 'C2'],
    ['A3', 'B3', 'C3']
  ])
  const updateCell = (r: number, c: number, val: string) => {
    setData(prev => {
      const next = prev.map(row => [...row])
      next[r][c] = val
      return next
    })
  }
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Spreadsheet header - Google Sheets style: no margin */}
      <div className="absolute top-0 left-0 right-0 h-8 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center px-2 text-xs text-gray-600 dark:text-gray-400 z-10">
        {fileName}
      </div>
      
      {/* Spreadsheet grid - no margin, full screen */}
      <div className="absolute top-8 left-0 right-0 bottom-0 overflow-auto">
        <table className="min-w-full text-xs border-collapse">
          <thead className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="w-12 h-6 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-center text-xs font-medium sticky left-0 z-30"></th>
              {data[0]?.map((_, cIdx) => (
                <th key={cIdx} className="min-w-24 h-6 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-center text-xs font-medium">
                  {String.fromCharCode(65 + cIdx)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rIdx) => (
              <tr key={rIdx}>
                <td className="w-12 h-6 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-center text-xs font-medium sticky left-0 z-20">
                  {rIdx + 1}
                </td>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="min-w-24 h-6 border border-gray-300 dark:border-gray-600 p-0">
                    <input
                      value={cell}
                      onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                      className="w-full h-full px-1 text-xs bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 focus:z-10"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
