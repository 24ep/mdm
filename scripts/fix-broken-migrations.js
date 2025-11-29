const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all route files with broken migrations
const routeFiles = glob.sync('src/app/api/**/route.ts');

let fixed = 0;
let errors = 0;

routeFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix: Remove duplicate export statements (keep only the last one)
    const exportPattern = /export const (GET|POST|PUT|DELETE|PATCH) = withErrorHandling\([^,]+,\s*['"](GET|POST|PUT|DELETE|PATCH)\s*\/api\/[^'"]+['"]\)/g;
    const exports = [];
    let match;
    const seen = new Set();
    
    while ((match = exportPattern.exec(content)) !== null) {
      const key = match[1] + match[3];
      if (!seen.has(key)) {
        seen.add(key);
        exports.push({ method: match[1], route: match[3], full: match[0] });
      }
    }

    // Remove all duplicate exports, keep only unique ones
    if (exports.length > 1) {
      const uniqueExports = new Map();
      exports.forEach(exp => {
        const key = exp.method;
        if (!uniqueExports.has(key)) {
          uniqueExports.set(key, exp);
        }
      });

      // Remove all exports
      exports.forEach(exp => {
        content = content.replace(exp.full + '\n', '');
        modified = true;
      });

      // Add back unique exports at the end
      uniqueExports.forEach(exp => {
        const cleanRoute = exp.route.replace(/\/route\.ts$/, '').replace(/\/api\/\.\.\./, '');
        content += `\nexport const ${exp.method} = withErrorHandling(${exp.method.toLowerCase()}Handler, '${exp.method} ${cleanRoute}')`;
      });
    }

    // Fix: Remove broken syntax like "  , { status: 500 })" and "}"
    content = content.replace(/\s+,\s*\{\s*status:\s*500\s*\}\)\s*\n\}/g, '');
    content = content.replace(/\s+,\s*\{\s*status:\s*500\s*\}\)/g, '');
    
    // Fix: Remove broken export statements in the middle of functions
    content = content.replace(/export const (GET|POST|PUT|DELETE|PATCH) = withErrorHandling\([^,]+,\s*['"]GET|POST|PUT|DELETE|PATCH\s*\/api\/\.\.\.['"]\)\s*=\s*body/g, '= body');
    content = content.replace(/export const (GET|POST|PUT|DELETE|PATCH) = withErrorHandling\([^,]+,\s*['"]GET|POST|PUT|DELETE|PATCH\s*\/api\/\.\.\.['"]\)\s*else/g, 'else');
    content = content.replace(/export const (GET|POST|PUT|DELETE|PATCH) = withErrorHandling\([^,]+,\s*['"]GET|POST|PUT|DELETE|PATCH\s*\/api\/\.\.\.['"]\)\s*/g, '');

    // Fix: Replace getServerSession with requireAuthWithId
    if (content.includes('getServerSession(authOptions)')) {
      // Check if requireAuthWithId is already imported
      if (!content.includes('requireAuthWithId')) {
        content = content.replace(
          /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/lib\/api-middleware['"]/,
          (match, imports) => {
            if (!imports.includes('requireAuthWithId')) {
              return match.replace('}', ', requireAuthWithId }');
            }
            return match;
          }
        );
      }

      // Replace getServerSession pattern
      content = content.replace(
        /const\s+session\s*=\s*await\s+getServerSession\(authOptions\)\s*\n\s*if\s*\(\s*!session\?\.user\s*\)\s*return\s+NextResponse\.json\(\{\s*error:\s*['"]Unauthorized['"]\s*\},\s*\{\s*status:\s*401\s*\}\)/g,
        'const authResult = await requireAuthWithId()\n  if (!authResult.success) return authResult.response\n  const { session } = authResult'
      );

      // Also handle try-catch blocks
      content = content.replace(
        /try\s*{\s*const\s+session\s*=\s*await\s+getServerSession\(authOptions\)\s*\n\s*if\s*\(\s*!session\?\.user\s*\)\s*\{[^}]+\}/g,
        'const authResult = await requireAuthWithId()\n  if (!authResult.success) return authResult.response\n  const { session } = authResult'
      );
    }

    if (modified || content.includes('getServerSession(authOptions)')) {
      fs.writeFileSync(filePath, content, 'utf8');
      fixed++;
      console.log(`✓ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    errors++;
  }
});

console.log(`\nFixed ${fixed} files, ${errors} errors`);

