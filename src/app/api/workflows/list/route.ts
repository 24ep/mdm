import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const workflowsDir = join(process.cwd(), 'src', 'lib', 'workflows')
    
    // Read all TypeScript files in the workflows directory
    const files = await readdir(workflowsDir)
    const workflowFiles = files
      .filter(file => file.endsWith('.ts') && !file.endsWith('.d.ts'))
      .map(file => ({
        name: file.replace('.ts', ''),
        filename: file,
        path: `@/lib/workflows/${file.replace('.ts', '')}`
      }))
    
    return NextResponse.json({ workflows: workflowFiles })
  } catch (error) {
    console.error('Error listing workflows:', error)
    return NextResponse.json(
      { error: 'Failed to list workflows', workflows: [] },
      { status: 500 }
    )
  }
}

