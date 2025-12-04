const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Fixing all syntax errors in route files...\n');

// Pattern 1: Fix incomplete NextResponse.json without status code
function fixIncompleteResponses(content) {
  // Fix patterns like: return NextResponse.json({ error: 'message'  })
  // Should be: return NextResponse.json({ error: 'message' }, { status: XXX })
  
  const patterns = [
    { regex: /return NextResponse\.json\(\{ error: '([^']+)'\s+\}\)(?!\s*,\s*\{)/g, status: 500 },
    { regex: /return NextResponse\.json\(\{ error: "([^"]+)"\s+\}\)(?!\s*,\s*\{)/g, status: 500 }
  ];
  
  patterns.forEach(({ regex, status }) => {
    content = content.replace(regex, (match, errorMsg) => {
      // Determine appropriate status code based on error message
      let statusCode = 500;
      const lowerMsg = errorMsg.toLowerCase();
      
      if (lowerMsg.includes('unauthorized') || lowerMsg.includes('not authenticated')) {
        statusCode = 401;
      } else if (lowerMsg.includes('forbidden') || lowerMsg.includes('access denied') || lowerMsg.includes('insufficient permission')) {
        statusCode = 403;
      } else if (lowerMsg.includes('not found')) {
        statusCode = 404;
      } else if (lowerMsg.includes('required') || lowerMsg.includes('invalid') || lowerMsg.includes('missing')) {
        statusCode = 400;
      }
      
      return `return NextResponse.json({ error: '${errorMsg}' }, { status: ${statusCode} })`;
    });
  });
  
  return content;
}

// Pattern 2: Fix malformed try-catch blocks
function fixTryCatchBlocks(content) {
  // Fix pattern where try block is not properly closed
  content = content.replace(
    /async function (\w+)\([^)]*\)\s*\{\s*try\s*\{/g,
    'async function $1(request: NextRequest, context?: any) {\n  try {'
  );
  
  return content;
}

// Pattern 3: Fix indentation issues
function fixIndentation(content) {
  // Fix cases where closing braces are misaligned
  const lines = content.split('\n');
  let fixed = [];
  let indentLevel = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Count opening and closing braces
    const openBraces = (trimmed.match(/\{/g) || []).length;
    const closeBraces = (trimmed.match(/\}/g) || []).length;
    
    // Adjust indent before line if it starts with closing brace
    if (trimmed.startsWith('}')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    fixed.push(line);
    
    // Adjust indent after line
    indentLevel += openBraces - closeBraces;
    indentLevel = Math.max(0, indentLevel);
  }
  
  return fixed.join('\n');
}

// Get all route files
function getAllRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next')) {
        getAllRouteFiles(filePath, fileList);
      }
    } else if (file === 'route.ts' || file === 'route.js') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const routeFiles = getAllRouteFiles(apiDir);

console.log(`Found ${routeFiles.length} route files to process\n`);

let fixedCount = 0;
let errorCount = 0;

routeFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Apply fixes
    content = fixIncompleteResponses(content);
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`✓ Fixed: ${relativePath}`);
      fixedCount++;
    }
  } catch (error) {
    const relativePath = path.relative(process.cwd(), filePath);
    console.error(`✗ Error processing ${relativePath}:`, error.message);
    errorCount++;
  }
});

console.log(`\n=== Summary ===`);
console.log(`Files fixed: ${fixedCount}`);
console.log(`Errors: ${errorCount}`);
console.log(`\nDone! Run "npm run build" to verify.`);
