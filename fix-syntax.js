const fs = require('fs');
const path = require('path');

// Get files from command line or find problematic files
const files = process.argv.slice(2);

if (files.length === 0) {
  console.log('Usage: node fix-syntax.js <file1> <file2> ...');
  process.exit(1);
}

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix 1: Remove duplicate exports
    const exportPattern = /^export const (\w+) = withErrorHandling\([^)]+\)[^\n]*\n(export const \1 = withErrorHandling\([^)]+\)[^\n]*\n?)+/gm;
    if (exportPattern.test(content)) {
      content = content.replace(exportPattern, (match, name) => {
        const lines = match.trim().split('\n').filter(l => l.trim());
        // Keep only the first valid export
        return lines[0] + '\n';
      });
      modified = true;
    }
    
    // Fix 2: Remove orphaned catch blocks without try
    // Pattern: } catch (error: any) { or } catch (error) { at start of line after }
    const orphanCatchPattern = /\n\s*}\s*catch\s*\([^)]+\)\s*\{[^}]*}\s*\n/g;
    if (orphanCatchPattern.test(content)) {
      content = content.replace(orphanCatchPattern, '\n');
      modified = true;
    }
    
    // Fix 3: Remove orphaned comma-started lines like ", { status: 500 })"
    const orphanCommaPattern = /\n\s*,\s*\{[^}]*\}\s*\)\s*\n/g;
    if (orphanCommaPattern.test(content)) {
      content = content.replace(orphanCommaPattern, '\n');
      modified = true;
    }
    
    // Fix 4: Remove orphaned code fragments that look like error handlers
    const orphanErrorHandler = /\n\s*ipAddress: request\?\.headers\?\.get[^\n]+\n\s*userAgent: request\?\.headers\?\.get[^\n]+\n\s*\}?\)\.catch[^\n]+\n/g;
    if (orphanErrorHandler.test(content)) {
      content = content.replace(orphanErrorHandler, '\n');
      modified = true;
    }
    
    // Fix 5: Remove lines with just "}" that are orphaned
    // This is tricky, so we'll be careful
    
    // Fix 6: Clean up malformed export lines with backslashes
    content = content.replace(/\\([a-z])/g, '/$1');
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    } else {
      console.log(`No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});
