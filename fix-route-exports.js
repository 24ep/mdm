const fs = require('fs');
const path = require('path');

// Find all route.ts files recursively
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

// Fix malformed export paths
function fixExportPaths(content) {
  // Fix paths like 'GET /api/src\app\api\...' to 'GET /api/...'
  // Also handle paths with forward slashes
  let fixed = content.replace(
    /(['"])([A-Z]+)\s+\/api\/src\\app\\api\\(.+?)(['"])/g,
    (match, quote1, method, rest, quote2) => {
      // Convert backslashes to forward slashes and remove the src\app\api part
      const cleanPath = rest.replace(/\\/g, '/');
      return `${quote1}${method} /api/${cleanPath}${quote2}`;
    }
  );
  
  // Also handle forward slash version
  fixed = fixed.replace(
    /(['"])([A-Z]+)\s+\/api\/src\/app\/api\/(.+?)(['"])/g,
    (match, quote1, method, rest, quote2) => {
      return `${quote1}${method} /api/${rest}${quote2}`;
    }
  );
  
  return fixed;
}

// Fix exports that appear in the middle of functions
function fixExportPlacement(content) {
  // Remove exports that appear right after incomplete if statements or in the middle of code
  // Pattern: if (!session?.user) { return ... )\n\nexport const GET = ...
  let fixed = content;
  
  // Fix: if statement without closing brace, followed by export
  fixed = fixed.replace(
    /(if\s*\([^)]+\)\s*\{\s*return\s+NextResponse\.json\(\{[^}]*error[^}]*\}\)\s*\)\s*)\n\s*\n\s*(export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=\s*withErrorHandling\([^,]+,\s*['"][^'"]+['"]\))/g,
    (match, ifBlock, exportLine) => {
      if (!ifBlock.includes('}')) {
        return `${ifBlock}\n  }\n\n  ${exportLine.replace(/export\s+const/, '// Export moved to end of file')}`;
      }
      return match;
    }
  );
  
  return fixed;
}

// Fix missing closing braces in if statements
function fixMissingBraces(content) {
  let fixed = content;
  
  // Fix: if (!session?.user) { return NextResponse.json({ error: 'Unauthorized'  )\n\n    const { ...
  // Should be: if (!session?.user) { return NextResponse.json({ error: 'Unauthorized' }) }\n\n    const { ...
  fixed = fixed.replace(
    /(if\s*\([^)]+\)\s*\{\s*return\s+NextResponse\.json\(\{[^}]*error[^}]*\}\)\s*\)\s*)\n\s*\n\s*(const\s+\{|export\s+const|async\s+function|const\s+\{)/g,
    (match, ifBlock, next) => {
      if (!ifBlock.includes('}')) {
        // Determine indentation from the next line
        const indentMatch = match.match(/\n(\s+)(const|export|async)/);
        const indent = indentMatch ? indentMatch[1] : '  ';
        return `${ifBlock}\n${indent}}\n\n${indent}${next}`;
      }
      return match;
    }
  );
  
  // Fix: if statement followed by export in the middle
  fixed = fixed.replace(
    /(if\s*\([^)]+\)\s*\{\s*return\s+NextResponse\.json\(\{[^}]*error[^}]*\}\)\s*\)\s*)\n\s*\n\s*(export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=\s*withErrorHandling\([^,]+,\s*['"][^'"]+['"]\))\s*\n\s*\n\s*(const\s+\{|export\s+const|async\s+function)/g,
    (match, ifBlock, exportLine, method, next) => {
      if (!ifBlock.includes('}')) {
        const indentMatch = match.match(/\n(\s+)(const|export|async)/);
        const indent = indentMatch ? indentMatch[1] : '  ';
        // Remove the misplaced export, add closing brace, keep the next statement
        return `${ifBlock}\n${indent}}\n\n${indent}${next}`;
      }
      return match;
    }
  );
  
  return fixed;
}

// Main function to fix a file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply fixes in order
    content = fixExportPaths(content);
    content = fixMissingBraces(content);
    content = fixExportPlacement(content);
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
const apiDir = path.join(__dirname, 'src', 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

console.log(`Found ${routeFiles.length} route.ts files`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} files`);

