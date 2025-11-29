const fs = require('fs')
const path = require('path')

const dryRun = process.argv.includes('--dry-run')

function migrateExportAsyncFunction(content, filePath) {
  let newContent = content
  let migrated = false

  // Pattern: export async function GET/POST/PUT/DELETE/PATCH
  const methodPattern = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g
  
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  
  for (const method of methods) {
    const regex = new RegExp(
      `export\\s+async\\s+function\\s+${method}\\s*\\(([^)]*)\\)\\s*\\{([\\s\\S]*?)(?=\\n\\s*export\\s+async\\s+function|\\n\\s*\\})`,
      'g'
    )
    
    let match
    while ((match = regex.exec(content)) !== null) {
      const fullMatch = match[0]
      const params = match[1]
      const body = match[2]
      
      // Skip if already migrated
      if (fullMatch.includes('withErrorHandling') || !fullMatch.includes('getServerSession')) {
        continue
      }
      
      // Convert to handler function
      const handlerName = method.toLowerCase() + 'Handler'
      const newFunction = `async function ${handlerName}(${params}) {${body}`
      
      // Replace getServerSession pattern
      let newBody = body
      
      // Pattern: try { ... const session = await getServerSession(authOptions) ... }
      const sessionPattern = /try\s*\{[\s\S]*?const\s+session\s*=\s*await\s+getServerSession\(authOptions\)[\s\S]*?if\s*\(!session\?\.user\)\s*\{[\s\S]*?return\s+NextResponse\.json\(\s*\{\s*error:\s*['"]Unauthorized['"]\s*\},\s*\{\s*status:\s*401\s*\}\s*\)[\s\S]*?\}[\s\S]*?/g
      
      newBody = newBody.replace(sessionPattern, (match) => {
        // Determine if we need requireAuthWithId (if session.user.id is used)
        const needsId = match.includes('session.user.id')
        const authFunc = needsId ? 'requireAuthWithId' : 'requireAuth'
        return `const authResult = await ${authFunc}()\n    if (!authResult.success) return authResult.response\n    const { session } = authResult`
      })
      
      // Remove outer try-catch
      newBody = newBody.replace(
        /^(\s*)try\s*\{([\s\S]*)\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?console\.error[^}]*\}/m,
        '$1$2'
      )
      
      // Remove try-catch blocks that wrap the entire function
      newBody = newBody.replace(
        /try\s*\{([\s\S]*)\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?return\s+NextResponse\.json\(\s*\{\s*error:\s*['"]Internal server error['"]\s*\},\s*\{\s*status:\s*500\s*\}\s*\)[\s\S]*?\}/g,
        '$1'
      )
      
      const newHandler = `async function ${handlerName}(${params}) {${newBody}`
      
      // Replace in content
      newContent = newContent.replace(fullMatch, newHandler)
      
      // Add export statement at the end of the function
      const routePath = filePath
        .replace(path.join(process.cwd(), 'src/app/api'), '/api')
        .replace(/\\/g, '/')
        .replace(/\/?route\.ts$/, '')
      
      // Find where to insert export (after the function closing brace)
      const handlerEnd = newContent.indexOf(newHandler) + newHandler.length
      const nextExport = newContent.substring(handlerEnd).match(/^(export\s+(const|async\s+function)|async\s+function\s+\w+)/m)
      
      if (nextExport) {
        const insertPos = handlerEnd + newContent.substring(handlerEnd).indexOf(nextExport[0])
        const exportLine = `\n\nexport const ${method} = withErrorHandling(${handlerName}, '${method} ${routePath}')`
        newContent = newContent.slice(0, insertPos) + exportLine + '\n' + newContent.slice(insertPos)
      } else {
        // Insert at end of file
        const exportLine = `\n\nexport const ${method} = withErrorHandling(${handlerName}, '${method} ${routePath}')`
        newContent = newContent.replace(newHandler, newHandler + exportLine)
      }
      
      migrated = true
    }
  }
  
  return { newContent, migrated }
}

function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8')
    const originalContent = content
    
    // Skip if already migrated
    if (content.includes('withErrorHandling') && !content.includes('export async function')) {
      return false
    }
    
    // Skip if doesn't have export async function pattern
    if (!content.includes('export async function')) {
      return false
    }
    
    const result = migrateExportAsyncFunction(content, filePath)
    
    if (result.migrated) {
      if (!dryRun) {
        fs.writeFileSync(filePath, result.newContent, 'utf-8')
      }
      return true
    }
    
    return false
  } catch (error) {
    console.error(`Error migrating file ${filePath}:`, error)
    return false
  }
}

// Main execution
const apiDir = path.join(process.cwd(), 'src/app/api')
const knowledgeDir = path.join(apiDir, 'knowledge')

function findRouteFiles(dir) {
  const files = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findRouteFiles(fullPath))
    } else if (entry.name === 'route.ts') {
      files.push(fullPath)
    }
  }
  
  return files
}

const routeFiles = findRouteFiles(knowledgeDir)
let migratedCount = 0

console.log(`Found ${routeFiles.length} route files in knowledge directory`)

for (const file of routeFiles) {
  if (migrateFile(file)) {
    migratedCount++
    console.log(`✓ ${file.replace(process.cwd(), '')}`)
  }
}

console.log(`\n Migration Summary:`)
console.log(` Files processed: ${routeFiles.length}`)
console.log(` Files migrated: ${migratedCount}`)
console.log(`\n${dryRun ? 'DRY RUN - No files were modified' : 'Migration complete!'}`)

