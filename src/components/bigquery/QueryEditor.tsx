'use client'

import { useThemeSafe } from '@/hooks/use-theme-safe'
import { useEffect, useState } from 'react'
import { CodeEditor } from '@/components/ui/code-editor'

interface QueryEditorProps {
  query: string
  onChange: (query: string) => void
  placeholder?: string
}

export function QueryEditor({ query, onChange, placeholder }: QueryEditorProps) {
  const { resolvedTheme, mounted } = useThemeSafe()
  const currentTheme = mounted ? (resolvedTheme === 'dark' ? 'dark' : 'light') : 'light'

  const defaultPlaceholder = `-- Enter your SQL query here
SELECT 
  name,
  email,
  created_at
FROM users 
WHERE created_at >= '2024-01-01'
ORDER BY created_at DESC
LIMIT 100;`

  return (
    <div className="flex-1">
      <CodeEditor
        value={query}
        onChange={onChange}
        language="sql"
        height="100%"
        placeholder={placeholder || defaultPlaceholder}
        theme={mounted ? currentTheme : 'light'}
        options={{
          fontSize: 14,
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          tabSize: 2,
          wordWrap: true,
          showLineNumbers: true,
          showGutter: true,
          enableBracketMatching: true,
          enableAutoIndent: true,
          enableFindReplace: true,
          enableCodeFolding: true,
          enableMinimap: false,
          enableAutoComplete: true,
          enableSyntaxValidation: true,
          enableErrorHighlighting: true,
          enableIntelliSense: true,
          enableSnippets: true,
          enableBracketPairColorization: true,
          enableIndentGuides: true,
          enableWordHighlight: true,
          enableCurrentLineHighlight: true,
          enableSelectionHighlight: true
        }}
      />
    </div>
  )
}
