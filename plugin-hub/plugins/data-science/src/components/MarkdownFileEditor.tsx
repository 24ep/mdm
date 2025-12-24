'use client'

import { useState } from 'react'

export function MarkdownFileEditor({ fileName }: { fileName: string }) {
  const [content, setContent] = useState<string>('# New Document')
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
        {fileName}
      </div>
      <div className="grid grid-cols-2 gap-0">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-72 p-2 text-sm bg-transparent border-0 resize-none focus:outline-none"
        />
        <div className="p-2 prose max-w-none dark:prose-invert text-sm">
          <div
            dangerouslySetInnerHTML={{
              __html: (content || '')
                .replace(/\n/g, '<br>')
                .replace(/# (.*)/g, '<h1 class="text-2xl font-bold mb-2">$1</h1>')
                .replace(/## (.*)/g, '<h2 class="text-xl font-semibold mb-2">$1</h2>')
                .replace(/### (.*)/g, '<h3 class="text-lg font-medium mb-1">$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
            }}
          />
        </div>
      </div>
    </div>
  )
}
