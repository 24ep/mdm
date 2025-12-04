const fs = require('fs');
const path = require('path');

function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts') {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Step 1: Fix export paths - remove /api/src\app\api\ or /api/src/app/api/
    content = content.replace(
      /(['"])([A-Z]+)\s+\/api\/src[\\/]app[\\/]api[\\/](.+?)(['"])/g,
      (match, quote1, method, rest, quote2) => {
        const cleanPath = rest.replace(/[\\/]/g, '/');
        return `${quote1}${method} /api/${cleanPath}${quote2}`;
      }
    );
    
    // Step 2: Fix exports in middle of functions - remove them temporarily
    const lines = content.split('\n');
    const fixedLines = [];
    const exports = [];
    let inFunction = false;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Track braces
      braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      
      // Detect function start
      if (trimmed.match(/^(async\s+)?function\s+\w+\(/)) {
        inFunction = true;
        braceCount = 0;
      }
      
      // Detect function end
      if (inFunction && braceCount === 0 && trimmed === '}') {
        inFunction = false;
      }
      
      // Check if this is an export
      const exportMatch = trimmed.match(/^export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=\s*withErrorHandling\((.+?),\s*['"](.+?)['"]\)/);
      if (exportMatch) {
        // If we're inside a function or right after incomplete code, save it
        if (inFunction || braceCount > 0 || (i > 0 && lines[i-1].trim() && !lines[i-1].trim().match(/[})\];]$/))) {
          exports.push({ method: exportMatch[1], handler: exportMatch[2], path: exportMatch[3] });
          continue; // Skip this line
        }
      }
      
      // Fix incomplete if statements
      if (trimmed.match(/^(const\s+\{|export\s+const|async\s+function)/) && i > 0) {
        const prevLine = lines[i-1].trim();
        if (prevLine.match(/^if\s*\(.+\)\s*\{/) && !prevLine.includes('}')) {
          // Check if line before that is a return statement
          if (i > 1) {
            const prevPrevLine = lines[i-2].trim();
            if (prevPrevLine.match(/return\s+NextResponse\.json/)) {
              const indent = line.match(/^(\s*)/)[1];
              fixedLines.push(`${indent}}`);
              fixedLines.push('');
            }
          }
        }
      }
      
      fixedLines.push(line);
    }
    
    // Add exports at the end
    if (exports.length > 0) {
      // Remove duplicate exports
      const seen = new Set();
      const uniqueExports = exports.filter(exp => {
        const key = `${exp.method}-${exp.handler}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      
      fixedLines.push('');
      uniqueExports.forEach(exp => {
        fixedLines.push(`export const ${exp.method} = withErrorHandling(${exp.handler}, '${exp.method} ${exp.path}')`);
      });
    }
    
    content = fixedLines.join('\n');
    
    // Step 3: Fix common patterns with regex
    // Pattern: if (!session?.user) { return NextResponse.json({ error: 'Unauthorized'  )\n\n    const {
    content = content.replace(
      /(if\s*\([^)]+\)\s*\{\s*return\s+NextResponse\.json\(\{[^}]*error[^}]*\}\)\s*\)\s*)\n\s*\n\s*(const\s+\{|export\s+const|async\s+function)/g,
      (match, ifBlock, next) => {
        if (!ifBlock.includes('}')) {
          const indentMatch = match.match(/\n(\s+)(const|export|async)/);
          const indent = indentMatch ? indentMatch[1] : '  ';
          return `${ifBlock}\n${indent}}\n\n${indent}${next}`;
        }
        return match;
      }
    );
    
    // Pattern: const { session } = authResult\n\nexport const GET = ...\n\n    const {
    content = content.replace(
      /(const\s+\{\s*session\s*\}\s*=\s*authResult)\s*\n\s*\n\s*(export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=\s*withErrorHandling\([^,]+,\s*['"][^'"]+['"]\))\s*\n\s*\n\s*(const\s+\{|export\s+const|async\s+function|if\s*\()/g,
      (match, sessionLine, exportLine, method, next) => {
        const indentMatch = match.match(/\n(\s+)(const|export|async|if)/);
        const indent = indentMatch ? indentMatch[1] : '  ';
        return `${sessionLine}\n\n${indent}${next}`;
      }
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

const apiDir = path.join(__dirname, 'src', 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

console.log(`Found ${routeFiles.length} route.ts files`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\nFixed ${fixedCount} files`);

