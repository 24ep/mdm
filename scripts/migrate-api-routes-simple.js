#!/usr/bin/env node
/**
 * Simplified migration script using Node.js (no TypeScript compilation needed)
 * 
 * Usage: node scripts/migrate-api-routes-simple.js [--dry-run] [--limit N]
 */

const fs = require('fs')
const path = require('path')

const DRY_RUN = process.argv.includes('--dry-run')
const LIMIT = process.argv.includes('--limit') 
  ? parseInt(process.argv[process.argv.indexOf('--limit') + 1])
  : null

const stats = {
  filesProcessed: 0,
  filesMigrated: 0,
  handlersMigrated: 0,
  errors: []
}

console.log(`🚀 Starting API route migration${DRY_RUN ? ' (DRY RUN)' : ''}...\n`)

/**
 * Find all route.ts files
 */
function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList)
    } else if (file === 'route.ts') {
      fileList.push(filePath)
    }
  }
  
  return fileList
}

/**
 * Migrate a single file
 */
function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8')
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
    
    // 1. Remove old imports
    if (content.includes("import { getServerSession } from 'next-auth'")) {
      content = content.replace(
        /import\s*{\s*getServerSession\s*}\s*from\s*['"]next-auth['"]\s*\n\s*import\s*{\s*authOptions\s*}\s*from\s*['"]@\/lib\/auth['"]\s*\n?/g,
        ''
      )
      migrated = true
    }
    
    // 2. Add new imports if not present
    if (!content.includes('from \'@/lib/api-middleware\'')) {
      const firstImport = content.match(/^import\s+.*from\s+['"]/m)
      if (firstImport) {
        const insertPos = content.indexOf(firstImport[0])
        const newImports = 
          "import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'\n" +
          "import { requireSpaceAccess } from '@/lib/space-access'\n"
        content = content.slice(0, insertPos) + newImports + content.slice(insertPos)
        migrated = true
      }
    }
    
    // 3. Migrate each handler function
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    
    for (const method of methods) {
      const handlerRegex = new RegExp(
        `export\\s+async\\s+function\\s+${method}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\s*\\}`,
        'g'
      )
      
      let match
      while ((match = handlerRegex.exec(content)) !== null) {
        const fullMatch = match[0]
        const handlerBody = match[1]
        
        // Skip if already migrated
        if (fullMatch.includes('withErrorHandling') || !fullMatch.includes('getServerSession')) {
          continue
        }
        
        // Determine auth function
        let authFunc = 'requireAuth'
        let needsSpaceAccess = false
        
        if (handlerBody.includes('session.user.id')) {
          authFunc = 'requireAuthWithId'
        }
        if (handlerBody.includes('session.user.role') && handlerBody.includes('ADMIN')) {
          authFunc = 'requireAdmin'
        }
        if (handlerBody.includes('space_id') || handlerBody.includes('spaceId') || 
            handlerBody.includes('space_members')) {
          needsSpaceAccess = true
        }
        
        // Create new handler name
        const handlerName = method.toLowerCase() + 'Handler'
        
        // Replace function signature
        let newHandler = fullMatch.replace(
          new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`),
          `async function ${handlerName}(`
        )
        
        // Replace getServerSession check
        newHandler = newHandler.replace(
          /try\s*\{[\s\S]*?const\s+session\s*=\s*await\s+getServerSession\(authOptions\)[\s\S]*?if\s*\(!session\?\.user\)\s*\{[\s\S]*?return\s+NextResponse\.json\(\s*\{\s*error:\s*['"]Unauthorized['"]\s*\},\s*\{\s*status:\s*401\s*\}\s*\)[\s\S]*?\}[\s\S]*?/,
          `const authResult = await ${authFunc}()\n    if (!authResult.success) return authResult.response\n    const { session } = authResult\n    `
        )
        
        // Remove try-catch wrapper (simplified - just remove outer try-catch)
        newHandler = newHandler.replace(
          /try\s*\{([\s\S]*)\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?console\.error[^}]*\}/,
          '$1'
        )
        
        // Replace in content
        content = content.replace(fullMatch, newHandler)
        
        // Add export statement after handler
        const relativePath = path.relative(path.join(process.cwd(), 'src/app/api'), filePath)
          .replace(/\\/g, '/')
        const exportLine = `\n\nexport const ${method} = withErrorHandling(${handlerName}, '${method} ${relativePath}')`
        
        // Insert export after handler
        const handlerIndex = content.indexOf(newHandler)
        if (handlerIndex !== -1) {
          const afterHandler = content.substring(handlerIndex + newHandler.length)
          const nextFunction = afterHandler.match(/^(export\s+(const|async\s+function)|async\s+function)/m)
          
          if (nextFunction) {
            const insertPos = handlerIndex + newHandler.length + afterHandler.indexOf(nextFunction[0])
            content = content.slice(0, insertPos) + exportLine + '\n' + content.slice(insertPos)
          } else {
            content = content.replace(newHandler, newHandler + exportLine)
          }
        }
        
        handlersCount++
        migrated = true
      }
    }
    
    if (migrated && content !== originalContent) {
      if (!DRY_RUN) {
        fs.writeFileSync(filePath, content, 'utf-8')
      }
      stats.handlersMigrated += handlersCount
      return true
    }
    
    return false
  } catch (error) {
    stats.errors.push(`${filePath}: ${error.message}`)
    return false
  }
}

/**
 * Main execution
 */
function main() {
  const apiDir = path.join(process.cwd(), 'src/app/api')
  let files = findRouteFiles(apiDir)
  
  if (LIMIT) {
    files = files.slice(0, LIMIT)
  }
  
  console.log(`Found ${files.length} route files to check\n`)
  
  for (const file of files) {
    stats.filesProcessed++
    const relativePath = path.relative(process.cwd(), file)
    
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

