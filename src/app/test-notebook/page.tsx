'use client'

import { DeepNoteLayoutRefactored as DeepNoteLayout } from '@/components/datascience'

export default function TestNotebookPage() {
  return (
    <div className="h-screen">
      <DeepNoteLayout
        initialNotebook={{
          id: 'test-notebook-1',
          name: 'Test Notebook',
          description: 'Testing the refactored component',
          cells: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['test'],
          isPublic: false,
          author: 'Test User',
          theme: 'light',
          settings: {
            autoSave: true,
            executionMode: 'sequential',
            showLineNumbers: true,
            fontSize: 14,
            tabSize: 2,
            wordWrap: true
          }
        }}
        enableCollaboration={true}
        enableFileManager={true}
        enableExport={true}
        enableVersionControl={true}
      />
    </div>
  )
}
