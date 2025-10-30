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
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md overflow-x-auto">
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
        {fileName}
      </div>
      <table className="min-w-full text-xs">
        <tbody>
          {data.map((row, rIdx) => (
            <tr key={rIdx} className="border-b border-gray-100 dark:border-gray-800">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="p-1">
                  <input
                    value={cell}
                    onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                    className="h-7 w-28 px-2 text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-0"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
