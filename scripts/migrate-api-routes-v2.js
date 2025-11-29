#!/usr/bin/env node
/**
 * Improved API route migration script v2
 * Better pattern matching for handler migration
 * 
 * Usage: 
 *   node scripts/migrate-api-routes-v2.js --dry-run
 *   node scripts/migrate-api-routes-v2.js --limit 10
 *   node scripts/migrate-api-routes-v2.js
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

console.log(`🚀 Starting API route migration v2${DRY_RUN ? ' (DRY RUN)' : ''}...\n`)

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
 * Find the end of a function by matching braces
 */
function findFunctionEnd(content, startPos) {
  let depth = 0
  let inString = false
  let stringChar = null
  let i = startPos
  
  while (i < content.length) {
    const char = content[i]
    const prevChar = i > 0 ? content[i - 1] : ''
    
    // Handle strings
    if (!inString && (char === '"' || char === "'" || char === '`')) {
      inString = true
      stringChar = char
    } else if (inString && char === stringChar && prevChar !== '\\') {
      inString = false
      stringChar = null
    }
    
    if (!inString) {
      if (char === '{') {
        depth++
      } else if (char === '}') {
        depth--
        if (depth === 0) {
          return i + 1
        }
      }
    }
    
    i++
  }
  
  return -1
}

/**
 * Migrate a single handler function - improved version
 */
function migrateHandler(content, method, filePath) {
  let newContent = content
  let handlersMigrated = 0
  
  // Find all export async function METHOD patterns OR async function METHODHandler patterns
  const functionPattern = new RegExp(
    `(export\\s+async\\s+function\\s+${method}|async\\s+function\\s+${method.toLowerCase()}Handler)\\s*\\([^)]*\\)`,
    'g'
  )
  
  let match
  const matches = []
  while ((match = functionPattern.exec(content)) !== null) {
    matches.push({
      start: match.index,
      fullMatch: match[0],
      isHandler: match[0].includes('Handler')
    })
  }
  
  // Process matches in reverse order to maintain positions
  for (let i = matches.length - 1; i >= 0; i--) {
    const { start } = matches[i]
    
    // Find the function body start
    const bodyStart = content.indexOf('{', start)
    if (bodyStart === -1) continue
    
    // Find the function end
    const functionEnd = findFunctionEnd(content, bodyStart)
    if (functionEnd === -1) continue
    
    const fullFunction = content.substring(start, functionEnd)
    const handlerBody = content.substring(bodyStart + 1, functionEnd - 1)
    
    // Skip if already migrated (has withErrorHandling and no getServerSession)
    if (fullFunction.includes('withErrorHandling') && !fullFunction.includes('getServerSession')) {
      continue
    }
    
    // Skip if no getServerSession in this function
    if (!fullFunction.includes('getServerSession')) {
      continue
    }
    
    // Determine auth function
    const { authFunc, needsSpaceAccess } = determineAuthFunction(handlerBody)
    
    // Create handler name
    const handlerName = method.toLowerCase() + 'Handler'
    
    // Replace function signature (handle both export async function and async function Handler)
    let newFunction = fullFunction
    if (fullFunction.includes('export async function')) {
      newFunction = newFunction.replace(
        new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(`),
        `async function ${handlerName}(`
      )
    } else if (fullFunction.includes('async function') && !fullFunction.includes(handlerName)) {
      // Already a handler function but wrong name
      newFunction = newFunction.replace(
        new RegExp(`async\\s+function\\s+\\w+\\s*\\(`),
        `async function ${handlerName}(`
      )
    }
    
    // Replace getServerSession patterns - multiple variations
    let newHandlerBody = handlerBody
    
    // Pattern 1: try { const session = await getServerSession(authOptions) ... if (!session?.user) ...
    newHandlerBody = newHandlerBody.replace(
      /try\s*\{[\s\S]*?const\s+session\s*=\s*await\s+getServerSession\(authOptions\)[\s\S]*?if\s*\(!session\?\.user\)\s*\{[\s\S]*?return\s+NextResponse\.json\(\s*\{\s*error:\s*['"]Unauthorized['"]\s*\},\s*\{\s*status:\s*401\s*\}\s*\)[\s\S]*?\}[\s\S]*?/,
      () => {
        let replacement = `const authResult = await ${authFunc}()\n    if (!authResult.success) return authResult.response\n    const { session } = authResult`
        if (needsSpaceAccess) {
          replacement += `\n    // TODO: Add requireSpaceAccess check if spaceId is available`
        }
        return replacement
      }
    )
    
    // Pattern 2: const session = await getServerSession(authOptions) without try-catch
    newHandlerBody = newHandlerBody.replace(
      /const\s+session\s*=\s*await\s+getServerSession\(authOptions\)[\s\S]*?if\s*\(!session\?\.user\)\s*\{[\s\S]*?return\s+NextResponse\.json\(\s*\{\s*error:\s*['"]Unauthorized['"]\s*\},\s*\{\s*status:\s*401\s*\}\s*\)[\s\S]*?\}/,
      () => {
        let replacement = `const authResult = await ${authFunc}()\n    if (!authResult.success) return authResult.response\n    const { session } = authResult`
        if (needsSpaceAccess) {
          replacement += `\n    // TODO: Add requireSpaceAccess check if spaceId is available`
        }
        return replacement
      }
    )
    
    // Pattern 3: if (!session?.user?.id) variant
    newHandlerBody = newHandlerBody.replace(
      /const\s+session\s*=\s*await\s+getServerSession\(authOptions\)[\s\S]*?if\s*\(!session\?\.user\?\.id\)\s*\{[\s\S]*?return\s+NextResponse\.json\(\s*\{\s*error:\s*['"]Unauthorized['"]\s*\},\s*\{\s*status:\s*401\s*\}\s*\)[\s\S]*?\}/,
      () => {
        let replacement = `const authResult = await ${authFunc}()\n    if (!authResult.success) return authResult.response\n    const { session } = authResult`
        if (needsSpaceAccess) {
          replacement += `\n    // TODO: Add requireSpaceAccess check if spaceId is available`
        }
        return replacement
      }
    )
    
    // Remove outer try-catch wrapper if present
    newHandlerBody = newHandlerBody.replace(
      /^(\s*)try\s*\{([\s\S]*)\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?console\.error[^}]*\}/m,
      '$1$2'
    )
    
    // Build new function
    newFunction = `async function ${handlerName}(${fullFunction.match(/\(([^)]*)\)/)?.[1] || ''}) {\n    ${newHandlerBody.trim()}\n}`
    
    // Replace in content
    newContent = newContent.substring(0, start) + newFunction + newContent.substring(functionEnd)
    
    // Add export statement
    const relativePath = path.relative(
      path.join(process.cwd(), 'src/app/api'), 
      filePath
    ).replace(/\\/g, '/')
    
    const exportLine = `\n\nexport const ${method} = withErrorHandling(${handlerName}, '${method} /api/${relativePath}')`
    
    // Find where to insert export (after the function)
    const newFunctionEnd = start + newFunction.length
    const afterFunction = newContent.substring(newFunctionEnd)
    const nextExport = afterFunction.match(/^(export\s+(const|async\s+function)|async\s+function\s+\w+)/m)
    
    if (nextExport) {
      const insertPos = newFunctionEnd + afterFunction.indexOf(nextExport[0])
      newContent = newContent.slice(0, insertPos) + exportLine + '\n' + newContent.slice(insertPos)
    } else {
      // Append at end of function
      newContent = newContent.substring(0, newFunctionEnd) + exportLine + newContent.substring(newFunctionEnd)
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
    
    // Skip if already fully migrated (no getServerSession and has withErrorHandling)
    if (!content.includes('getServerSession') && content.includes('withErrorHandling')) {
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
    
    // Also remove standalone authOptions import if present
    content = content.replace(
      /import\s*{\s*authOptions\s*}\s*from\s*['"]@\/lib\/auth['"]\s*\n?/g,
      ''
    )
    
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
      const result = migrateHandler(content, method, filePath)
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

