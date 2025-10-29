'use client'

import { DeepNoteLayoutRefactored as DeepNoteLayout } from '@/components/datascience'

export default function TestDataSciencePage() {
  return (
    <div className="h-screen">
      <DeepNoteLayout
        initialNotebook={{
          id: 'test-notebook-1',
          name: 'Test Data Science Notebook',
          description: 'Testing the DeepNote layout implementation',
          cells: [
            {
              id: 'cell-1',
              type: 'code',
              content: '# Welcome to the Data Science Notebook!\nprint("Hello, World!")\nprint("This is a test of the DeepNote layout")',
              status: 'idle',
              timestamp: new Date(),
              metadata: {}
            },
            {
              id: 'cell-2',
              type: 'markdown',
              content: '# Test Markdown Cell\n\nThis is a **markdown** cell with some *formatting*.\n\n- List item 1\n- List item 2\n- List item 3',
              status: 'idle',
              timestamp: new Date(),
              metadata: {}
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['test', 'data-science'],
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
