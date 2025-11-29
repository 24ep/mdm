const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Files to skip (already migrated or special cases)
const SKIP_FILES = new Set([
  // Add any files that should be skipped
]);

async function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let originalContent = content;

    // Skip if already migrated (has requireAuthWithId and withErrorHandling)
    if (content.includes('requireAuthWithId') && content.includes('withErrorHandling')) {
      // Check if still has getServerSession
      if (content.includes('getServerSession(authOptions)')) {
        // Still needs migration
      } else {
        return { file: filePath, status: 'already_migrated', changes: 0 };
      }
    }

    // Pattern 1: Replace getServerSession with requireAuthWithId
    const getServerSessionPattern = /const\s+session\s*=\s*await\s+getServerSession\(authOptions\)/g;
    if (getServerSessionPattern.test(content)) {
      content = content.replace(
        /const\s+session\s*=\s*await\s+getServerSession\(authOptions\)/g,
        `const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult`
      );
      modified = true;
    }

    // Pattern 2: Remove try-catch blocks (if wrapped by withErrorHandling)
    // Only remove if the function is already wrapped with withErrorHandling
    if (content.includes('withErrorHandling')) {
      // Remove try-catch blocks that just wrap the entire function
      const tryCatchPattern = /(\s+)(try\s*\{[\s\S]*?)(\s+)\} catch \(error[^)]*\) \{[\s\S]*?return\s+NextResponse\.json\([^)]*error[^)]*Internal server error[^)]*\)[\s\S]*?\}\s*\}/g;
      if (tryCatchPattern.test(content)) {
        content = content.replace(tryCatchPattern, (match, indent, tryBlock) => {
          // Remove try and catch, keep the content
          let cleaned = tryBlock.replace(/^\s*try\s*\{/, '').trim();
          // Remove the last closing brace
          cleaned = cleaned.replace(/\}\s*$/, '').trim();
          return indent + cleaned;
        });
        modified = true;
      }
    }

    // Pattern 3: Fix broken export statements
    // Remove duplicate exports
    const exportPattern = /export const (GET|POST|PUT|DELETE|PATCH) = withErrorHandling\([^)]+\)[\s\n]*/g;
    const exports = content.match(exportPattern);
    if (exports && exports.length > 1) {
      // Keep only the first occurrence of each method
      const seen = new Set();
      content = content.replace(exportPattern, (match) => {
        const method = match.match(/export const (GET|POST|PUT|DELETE|PATCH)/)?.[1];
        const key = method;
        if (seen.has(key)) {
          return '';
        }
        seen.add(key);
        return match;
      });
      modified = true;
    }

    // Pattern 4: Fix broken syntax like "= body /api/..." or ", { status: 500 })"
    content = content.replace(/= body \/api\/[^\n]*/g, '');
    content = content.replace(/,\s*\{\s*status:\s*\d+\s*\}\)\s*\}/g, '}');
    content = content.replace(/export const = body = withErrorHandling/g, 'export const POST = withErrorHandling');
    content = content.replace(/method:\s*['"]= body['"]/g, "method: 'POST'");
    if (content !== originalContent) {
      modified = true;
    }

    // Pattern 5: Ensure requireAuthWithId is imported
    if (content.includes('requireAuthWithId') && !content.includes("import { requireAuthWithId")) {
      // Check if api-middleware is imported
      if (content.includes("from '@/lib/api-middleware'")) {
        content = content.replace(
          /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/lib\/api-middleware['"]/,
          (match, imports) => {
            if (!imports.includes('requireAuthWithId')) {
              return match.replace(imports, imports.trim() + ', requireAuthWithId');
            }
            return match;
          }
        );
        modified = true;
      } else {
        // Add import
        const importLine = "import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'";
        const lines = content.split('\n');
        let insertIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            insertIndex = i + 1;
          }
        }
        lines.splice(insertIndex, 0, importLine);
        content = lines.join('\n');
        modified = true;
      }
    }

    // Pattern 6: Fix broken handler exports
    // Ensure handlers are properly exported with withErrorHandling
    const handlerPattern = /(async function\s+(\w+Handler)\([^)]*\)\s*\{[\s\S]*?\})\s*(?!export const)/g;
    content = content.replace(handlerPattern, (match, handlerBody, handlerName) => {
      // Extract method from handler name
      let method = 'GET';
      if (handlerName.includes('post') || handlerName.includes('Post')) method = 'POST';
      if (handlerName.includes('put') || handlerName.includes('Put')) method = 'PUT';
      if (handlerName.includes('delete') || handlerName.includes('Delete')) method = 'DELETE';
      if (handlerName.includes('patch') || handlerName.includes('Patch')) method = 'PATCH';
      
      // Check if export already exists
      const afterHandler = content.substring(content.indexOf(match) + match.length);
      if (!afterHandler.includes(`export const ${method}`)) {
        return match + `\n\nexport const ${method} = withErrorHandling(${handlerName}, '${method} /api/...')`;
      }
      return match;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return { file: filePath, status: 'migrated', changes: 1 };
    }

    return { file: filePath, status: 'no_changes', changes: 0 };
  } catch (error) {
    return { file: filePath, status: 'error', error: error.message, changes: 0 };
  }
}

async function main() {
  const apiDir = path.join(process.cwd(), 'src/app/api');
  const routeFiles = await glob('**/route.ts', { cwd: apiDir, absolute: true });

  console.log(`Found ${routeFiles.length} route files to check\n`);

  const results = [];
  let migrated = 0;
  let errors = 0;
  let skipped = 0;

  for (const file of routeFiles) {
    if (SKIP_FILES.has(path.relative(apiDir, file))) {
      skipped++;
      continue;
    }

    const result = await migrateFile(file);
    results.push(result);

    if (result.status === 'migrated') {
      migrated++;
      console.log(`✅ ${path.relative(apiDir, result.file)}`);
    } else if (result.status === 'error') {
      errors++;
      console.log(`❌ ${path.relative(apiDir, result.file)}: ${result.error}`);
    } else if (result.status === 'already_migrated') {
      skipped++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Migrated: ${migrated}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${routeFiles.length}`);
}

main().catch(console.error);

