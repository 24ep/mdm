#!/usr/bin/env node
/**
 * Automated API route migration script
 * Migrates from getServerSession to centralized middleware
 * 
 * Usage: 
 *   node scripts/migrate-api-routes.js --dry-run          # Preview changes
 *   node scripts/migrate-api-routes.js --limit 10         # Migrate first 10 files
 *   node scripts/migrate-api-routes.js                    # Migrate all files
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
  try {
    const files = fs.readdirSync(dir)
    
    for (const file of files) {
      const filePath = path.join(dir, file)
      try {
        const stat = fs.statSync(filePath)
        
        if (stat.isDirectory()) {
          findRouteFiles(filePath, fileList)
        } else if (file === 'route.ts') {
          fileList.push(filePath)
        }
      } catch (err) {
        // Skip files we can't access
      }
    }
  } catch (err) {
    // Skip directories we can't access
  }
  
  return fileList
}

/**
 * Determine auth function based on handler content
 */
function determineAuthFunction(handlerBody) {
  let authFunc = 'requireAuth'
  let needsSpaceAccess = false
  
  // Check for user.id access
  if (handlerBody.includes('session.user.id') || handlerBody.includes('session.user.id!')) {
    authFunc = 'requireAuthWithId'
  }
  
  // Check for admin routes
  if (handlerBody.includes('session.user.role') && 
      (handlerBody.includes('ADMIN') || handlerBody.includes('SUPER_ADMIN'))) {
    authFunc = 'requireAdmin'
  }
  
  // Check for space access needs
  if (handlerBody.includes('space_id') || handlerBody.includes('spaceId') || 
      handlerBody.includes('space_members') || handlerBody.includes('SELECT.*FROM space_members')) {
    needsSpaceAccess = true
  }
  
  return { authFunc, needsSpaceAccess }
}

/**
 * Migrate a single handler function
 */
function migrateHandler(content, method) {
  const handlerPattern = new RegExp(
    `(export\\s+async\\s+function\\s+${method}\\s*\\([^)]*\\)\\s*\\{)([\\s\\S]*?)(\\n\\s*\\})`,
    'g'
  )
  
  let newContent = content
  let handlersMigrated = 0
  
  let match
  while ((match = handlerPattern.exec(content)) !== null) {
    const fullMatch = match[0]
    const functionStart = match[1]
    const handlerBody = match[2]
    const functionEnd = match[3]
    
    // Skip if already migrated
    if (fullMatch.includes('withErrorHandling') || !fullMatch.includes('getServerSession')) {
      continue
    }
    
    // Determine auth function
    const { authFunc, needsSpaceAccess } = determineAuthFunction(handlerBody)
    
    // Create handler name
    const handlerName = method.toLowerCase() + 'Handler'
    
    // Replace function signature
    const newFunctionStart = functionStart.replace(
      new RegExp(`export\\s+async\\s+function\\s+${method}`),
      `async function ${handlerName}`
    )
    
    // Replace getServerSession pattern
    let newHandlerBody = handlerBody
    
    // Pattern 1: Standard getServerSession check
    const sessionCheckPattern = /try\s*\{[\s\S]*?const\s+session\s*=\s*await\s+getServerSession\(authOptions\)[\s\S]*?if\s*\(!session\?\.user\)\s*\{[\s\S]*?return\s+NextResponse\.json\(\s*\{\s*error:\s*['"]Unauthorized['"]\s*\},\s*\{\s*status:\s*401\s*\}\s*\)[\s\S]*?\}[\s\S]*?/g
    
    newHandlerBody = newHandlerBody.replace(sessionCheckPattern, (match) => {
      let replacement = `const authResult = await ${authFunc}()\n    if (!authResult.success) return authResult.response\n    const { session } = authResult`
      
      // Add space access check if needed (simplified - manual review needed)
      if (needsSpaceAccess) {
        replacement += `\n    // TODO: Add requireSpaceAccess check if spaceId is available`
      }
      
      return replacement
    })
    
    // Remove outer try-catch if present
    newHandlerBody = newHandlerBody.replace(
      /^(\s*)try\s*\{([\s\S]*)\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?console\.error[^}]*\}/m,
      '$1$2'
    )
    
    // Build new handler
    const newHandler = newFunctionStart + newHandlerBody + functionEnd
    
    // Replace in content
    newContent = newContent.replace(fullMatch, newHandler)
    
    // Add export statement
    const relativePath = path.relative(
      path.join(process.cwd(), 'src/app/api'), 
      content.match(/\/\/.*route\.ts|from.*route/) ? 
        path.join(process.cwd(), 'src/app/api') : 
        process.cwd()
    ).replace(/\\/g, '/')
    
    const exportLine = `\n\nexport const ${method} = withErrorHandling(${handlerName}, '${method} /api/...')`
    
    // Insert export after handler
    const handlerIndex = newContent.indexOf(newHandler)
    if (handlerIndex !== -1) {
      const afterHandler = newContent.substring(handlerIndex + newHandler.length)
      const nextMatch = afterHandler.match(/^(export\s+(const|async\s+function)|async\s+function\s+\w+)/m)
      
      if (nextMatch) {
        const insertPos = handlerIndex + newHandler.length + afterHandler.indexOf(nextMatch[0])
        newContent = newContent.slice(0, insertPos) + exportLine + '\n' + newContent.slice(insertPos)
      } else {
        newContent = newContent.replace(newHandler, newHandler + exportLine)
      }
    }
    
    handlersMigrated++
  }
  
  return { newContent, handlersMigrated }
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
    let totalHandlers = 0
    
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
    
    // 3. Migrate each handler
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    for (const method of methods) {
      const result = migrateHandler(content, method)
      content = result.newContent
      totalHandlers += result.handlersMigrated
      if (result.handlersMigrated > 0) {
        migrated = true
      }
    }
    
    if (migrated && content !== originalContent) {
      if (!DRY_RUN) {
        fs.writeFileSync(filePath, content, 'utf-8')
      }
      stats.handlersMigrated += totalHandlers
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
  
  if (!fs.existsSync(apiDir)) {
    console.error(`❌ API directory not found: ${apiDir}`)
    process.exit(1)
  }
  
  let files = findRouteFiles(apiDir)
  
  if (LIMIT) {
    files = files.slice(0, LIMIT)
    console.log(`⚠️  Limiting to first ${LIMIT} files\n`)
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
    console.log(`\n❌ Errors (${stats.errors.length}):`)
    stats.errors.slice(0, 10).forEach(err => console.log(`   ${err}`))
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more`)
    }
  }
  
  if (DRY_RUN) {
    console.log(`\n⚠️  This was a DRY RUN. No files were modified.`)
    console.log(`   Run without --dry-run to apply changes.`)
  } else {
    console.log(`\n✅ Migration complete!`)
    console.log(`   Please review the changes and run linting.`)
  }
}

main()

