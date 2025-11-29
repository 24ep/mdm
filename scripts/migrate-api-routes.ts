#!/usr/bin/env tsx
/**
 * Automated script to migrate API routes from getServerSession to centralized middleware
 * 
 * Usage: npx tsx scripts/migrate-api-routes.ts [--dry-run] [--file <path>]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

interface MigrationStats {
  filesProcessed: number
  filesMigrated: number
  handlersMigrated: number
  errors: string[]
}

const stats: MigrationStats = {
  filesProcessed: 0,
  filesMigrated: 0,
  handlersMigrated: 0,
  errors: []
}

const DRY_RUN = process.argv.includes('--dry-run')
const SINGLE_FILE = process.argv.includes('--file') 
  ? process.argv[process.argv.indexOf('--file') + 1]
  : null

console.log(`🚀 Starting API route migration${DRY_RUN ? ' (DRY RUN)' : ''}...\n`)

/**
 * Find all route.ts files in src/app/api
 */
function findRouteFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir)
  
  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)
    
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList)
    } else if (file === 'route.ts') {
      fileList.push(filePath)
    }
  }
  
  return fileList
}

/**
 * Determine which auth function to use based on context
 */
function determineAuthFunction(content: string, handlerName: string): {
  authFunc: string
  needsSpaceAccess: boolean
  needsAdmin: boolean
} {
  // Check if handler accesses session.user.id
  const needsUserId = /session\.user\.id/.test(content)
  
  // Check if it's an admin route
  const needsAdmin = /session\.user\.role.*ADMIN|requireAdmin|checkPermission.*admin/i.test(content) ||
                     /\/admin\//.test(content)
  
  // Check if it needs space access
  const needsSpaceAccess = /space_id|spaceId|space_members|requireSpaceAccess/.test(content) ||
                           /SELECT.*FROM space_members/.test(content)
  
  if (needsAdmin) {
    return { authFunc: 'requireAdmin', needsSpaceAccess: false, needsAdmin: true }
  }
  
  if (needsUserId) {
    return { authFunc: 'requireAuthWithId', needsSpaceAccess, needsAdmin: false }
  }
  
  return { authFunc: 'requireAuth', needsSpaceAccess, needsAdmin: false }
}

/**
 * Migrate a single file
 */
function migrateFile(filePath: string): boolean {
  try {
    let content = readFileSync(filePath, 'utf-8')
    const originalContent = content
    
    // Skip if already migrated
    if (content.includes('from \'@/lib/api-middleware\'') && 
        !content.includes('getServerSession')) {
      return false
    }
    
    // Skip if doesn't have getServerSession
    if (!content.includes('getServerSession')) {
      return false
    }
    
    let migrated = false
    let handlersCount = 0
    
    // 1. Update imports
    if (content.includes("import { getServerSession } from 'next-auth'")) {
      content = content.replace(
        /import { getServerSession } from 'next-auth'\s*\n\s*import { authOptions } from '@\/lib\/auth'/g,
        ''
      )
      
      // Add new imports if not present
      if (!content.includes('from \'@/lib/api-middleware\'')) {
        const importMatch = content.match(/^import.*from.*['"]/m)
        if (importMatch) {
          const insertPos = content.indexOf(importMatch[0])
          content = content.slice(0, insertPos) +
            "import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'\n" +
            (content.includes('requireSpaceAccess') ? '' : "import { requireSpaceAccess } from '@/lib/space-access'\n") +
            content.slice(insertPos)
        }
      }
      
      migrated = true
    }
    
    // 2. Find and migrate each handler
    const handlerPatterns = [
      { method: 'GET', pattern: /export async function GET\(/g },
      { method: 'POST', pattern: /export async function POST\(/g },
      { method: 'PUT', pattern: /export async function PUT\(/g },
      { method: 'PATCH', pattern: /export async function PATCH\(/g },
      { method: 'DELETE', pattern: /export async function DELETE\(/g },
    ]
    
    for (const { method, pattern } of handlerPatterns) {
      if (!pattern.test(content)) continue
      
      // Reset regex
      pattern.lastIndex = 0
      
      // Find handler function
      const handlerMatch = content.match(new RegExp(
        `export async function ${method}\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\s*\\}`,
        'g'
      ))
      
      if (!handlerMatch) continue
      
      for (const handler of handlerMatch) {
        const handlerName = method.toLowerCase() + 'Handler'
        
        // Determine auth function
        const { authFunc, needsSpaceAccess, needsAdmin } = determineAuthFunction(handler, handlerName)
        
        // Replace export async function with async function
        let newHandler = handler.replace(
          new RegExp(`export async function ${method}\\(`),
          `async function ${handlerName}(`
        )
        
        // Replace getServerSession check
        newHandler = newHandler.replace(
          /try\s*\{[\s\S]*?const session = await getServerSession\(authOptions\)[\s\S]*?if\s*\(!session\?\.user\)\s*\{[\s\S]*?return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\)[\s\S]*?\}/,
          (match) => {
            // Extract the auth function call
            let authCall = `const authResult = await ${authFunc}()\n    if (!authResult.success) return authResult.response\n    const { session } = authResult`
            
            // Add space access check if needed
            if (needsSpaceAccess && !newHandler.includes('requireSpaceAccess')) {
              // Try to extract spaceId from the handler
              const spaceIdMatch = newHandler.match(/space[Ii]d|space_id/)
              if (spaceIdMatch) {
                // This is a simplified check - in real migration, we'd need more context
                authCall += `\n\n    // TODO: Add requireSpaceAccess check if spaceId is available`
              }
            }
            
            return authCall
          }
        )
        
        // Remove try-catch wrapper (keep the content)
        newHandler = newHandler.replace(
          /try\s*\{([\s\S]*?)\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?console\.error[^}]*\}/,
          '$1'
        )
        
        // Replace the handler in content
        content = content.replace(handler, newHandler)
        
        // Add export with withErrorHandling
        const exportLine = `export const ${method} = withErrorHandling(${handlerName}, '${method} ${relative('src/app/api', filePath).replace(/\\/g, '/')}')`
        
        // Find where to insert export (after the handler function)
        const handlerEnd = content.indexOf(newHandler) + newHandler.length
        const nextExport = content.substring(handlerEnd).match(/^export (const|async function)/m)
        
        if (nextExport) {
          const insertPos = handlerEnd + content.substring(handlerEnd).indexOf(nextExport[0])
          content = content.slice(0, insertPos) + exportLine + '\n\n' + content.slice(insertPos)
        } else {
          // Append at end of handler
          content = content.replace(newHandler, newHandler + '\n\n' + exportLine)
        }
        
        handlersCount++
        migrated = true
      }
    }
    
    if (migrated && content !== originalContent) {
      if (!DRY_RUN) {
        writeFileSync(filePath, content, 'utf-8')
      }
      stats.handlersMigrated += handlersCount
      return true
    }
    
    return false
  } catch (error) {
    stats.errors.push(`${filePath}: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

/**
 * Main execution
 */
function main() {
  const apiDir = join(process.cwd(), 'src/app/api')
  
  let files: string[] = []
  
  if (SINGLE_FILE) {
    files = [join(process.cwd(), SINGLE_FILE)]
  } else {
    files = findRouteFiles(apiDir)
  }
  
  console.log(`Found ${files.length} route files to check\n`)
  
  for (const file of files) {
    stats.filesProcessed++
    const relativePath = relative(process.cwd(), file)
    
    if (migrateFile(file)) {
      stats.filesMigrated++
      console.log(`✅ ${relativePath}${DRY_RUN ? ' (would migrate)' : ''}`)
    }
  }
  
  // Print summary
  console.log(`\n📊 Migration Summary:`)
  console.log(`   Files processed: ${stats.filesProcessed}`)
  console.log(`   Files migrated: ${stats.filesMigrated}`)
  console.log(`   Handlers migrated: ${stats.handlersMigrated}`)
  
  if (stats.errors.length > 0) {
    console.log(`\n❌ Errors:`)
    stats.errors.forEach(err => console.log(`   ${err}`))
  }
  
  if (DRY_RUN) {
    console.log(`\n⚠️  This was a DRY RUN. No files were modified.`)
  }
}

main()

