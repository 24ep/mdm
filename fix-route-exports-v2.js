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
  let fixed = content;
  
  // Fix paths like 'GET /api/src\app\api\...' to 'GET /api/...'
  fixed = fixed.replace(
    /(['"])([A-Z]+)\s+\/api\/src\\app\\api\\(.+?)(['"])/g,
    (match, quote1, method, rest, quote2) => {
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

// Fix structural issues: exports in middle of functions, missing braces, etc.
function fixStructuralIssues(content) {
  const lines = content.split('\n');
  const fixed = [];
  const exportsToMove = [];
  let i = 0;
  let braceDepth = 0;
  let inFunction = false;
  let functionStartLine = -1;
  
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const indent = line.match(/^(\s*)/)[1];
    
    // Track brace depth
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    braceDepth += openBraces - closeBraces;
    
    // Detect function start
    if (trimmed.match(/^(async\s+)?function\s+\w+\(/)) {
      inFunction = true;
      functionStartLine = i;
      braceDepth = 0; // Reset for function scope
    }
    
    // Check if this is an export statement
    if (trimmed.match(/^export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=\s*withErrorHandling/)) {
      // Check if we're inside a function (braceDepth > 0 or inFunction)
      if (braceDepth > 0 || inFunction) {
        // This export is misplaced - save it to move later
        exportsToMove.push({ line, method: trimmed.match(/(GET|POST|PUT|DELETE|PATCH)/)[1] });
        i++;
        continue; // Skip this line
      }
    }
    
    // Check for incomplete if statements before exports
    if (i > 0 && trimmed.match(/^export\s+const/)) {
      const prevLine = lines[i - 1];
      const prevTrimmed = prevLine.trim();
      
      // If previous line is an if statement without closing brace
      if (prevTrimmed.match(/^if\s*\(.+\)\s*\{/) && !prevTrimmed.includes('}')) {
        // Add closing brace
        fixed.push(`${indent}}`);
        fixed.push(''); // Empty line
      }
    }
    
    // Check for incomplete if statements before next code
    if (trimmed.match(/^(const\s+\{|export\s+const|async\s+function)/) && i > 0) {
      const prevLine = lines[i - 1];
      const prevTrimmed = prevLine.trim();
      
      // If previous line is an if statement without closing brace
      if (prevTrimmed.match(/^if\s*\(.+\)\s*\{/) && !prevTrimmed.includes('}')) {
        // Check if the line before that is a return statement
        if (i > 1) {
          const prevPrevLine = lines[i - 2];
          const prevPrevTrimmed = prevPrevLine.trim();
          if (prevPrevTrimmed.match(/return\s+NextResponse\.json/)) {
            // Add closing brace before this line
            fixed.push(`${indent}}`);
            fixed.push(''); // Empty line
          }
        }
      }
    }
    
    // Detect function end
    if (inFunction && braceDepth === 0 && trimmed.match(/^}/)) {
      inFunction = false;
      functionStartLine = -1;
    }
    
    fixed.push(line);
    i++;
  }
  
  // Add exports at the end if we moved any
  if (exportsToMove.length > 0) {
    // Remove duplicates and group by method
    const uniqueExports = new Map();
    exportsToMove.forEach(({ line, method }) => {
      if (!uniqueExports.has(method)) {
        uniqueExports.set(method, line);
      }
    });
    
    // Add exports at the end
    fixed.push('');
    fixed.push('// Exports moved from middle of functions');
    uniqueExports.forEach(line => {
      fixed.push(line);
    });
  }
  
  return fixed.join('\n');
}

// More aggressive fix for common patterns
function fixCommonPatterns(content) {
  let fixed = content;
  
  // Pattern 1: if (!session?.user) { return NextResponse.json({ error: 'Unauthorized'  )\n\nexport const GET = ...
  fixed = fixed.replace(
    /(if\s*\([^)]+\)\s*\{\s*return\s+NextResponse\.json\(\{[^}]*error[^}]*\}\)\s*\)\s*)\n\s*\n\s*(export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=\s*withErrorHandling\([^,]+,\s*['"][^'"]+['"]\))\s*\n\s*\n\s*(const\s+\{|export\s+const|async\s+function)/g,
    (match, ifBlock, exportLine, method, next) => {
      if (!ifBlock.includes('}')) {
        const indentMatch = match.match(/\n(\s+)(const|export|async)/);
        const indent = indentMatch ? indentMatch[1] : '  ';
        return `${ifBlock}\n${indent}}\n\n${indent}${next}`;
      }
      return match;
    }
  );
  
  // Pattern 2: if statement without brace, followed by export, then code
  fixed = fixed.replace(
    /(if\s*\([^)]+\)\s*\{\s*return\s+NextResponse\.json\(\{[^}]*error[^}]*\}\)\s*\)\s*)\n\s*\n\s*(export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=\s*withErrorHandling\([^,]+,\s*['"][^'"]+['"]\))\s*\n\s*\n\s*(const\s+\{|export\s+const|async\s+function)/g,
    (match, ifBlock, exportLine, method, next) => {
      if (!ifBlock.includes('}')) {
        const indentMatch = match.match(/\n(\s+)(const|export|async)/);
        const indent = indentMatch ? indentMatch[1] : '  ';
        return `${ifBlock}\n${indent}}\n\n${indent}${next}`;
      }
      return match;
    }
  );
  
  // Pattern 3: const { session } = authResult\n\nexport const GET = ...\n\n    const { ...
  fixed = fixed.replace(
    /(const\s+\{\s*session\s*\}\s*=\s*authResult)\s*\n\s*\n\s*(export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=\s*withErrorHandling\([^,]+,\s*['"][^'"]+['"]\))\s*\n\s*\n\s*(const\s+\{|export\s+const|async\s+function|if\s*\()/g,
    (match, sessionLine, exportLine, method, next) => {
      const indentMatch = match.match(/\n(\s+)(const|export|async|if)/);
      const indent = indentMatch ? indentMatch[1] : '  ';
      return `${sessionLine}\n\n${indent}${next}`;
    }
  );
  
  // Pattern 4: if (!session?.user) { return NextResponse.json({ error: 'Unauthorized'  )\n\n    const { ...
  fixed = fixed.replace(
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
  
  return fixed;
}

// Main function to fix a file
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply fixes in order
    content = fixExportPaths(content);
    content = fixCommonPatterns(content);
    content = fixStructuralIssues(content);
    
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

