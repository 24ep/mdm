#!/usr/bin/env node

/**
 * TypeScript Error Scanner
 * Scans the entire codebase for TypeScript errors and reports them in a readable format
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Parse TypeScript error output
function parseTypeScriptErrors(output) {
  const errors = [];
  const lines = output.split('\n');
  
  let currentError = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Match error line: file.tsx(line,col): error TS####: message
    const errorMatch = line.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
    
    if (errorMatch) {
      // Save previous error if exists
      if (currentError) {
        errors.push(currentError);
      }
      
      currentError = {
        file: errorMatch[1],
        line: parseInt(errorMatch[2]),
        column: parseInt(errorMatch[3]),
        code: errorMatch[4],
        message: errorMatch[5],
        details: []
      };
    } else if (currentError && line) {
      // Additional details for the error
      currentError.details.push(line);
    }
  }
  
  // Don't forget the last error
  if (currentError) {
    errors.push(currentError);
  }
  
  return errors;
}

// Group errors by file
function groupErrorsByFile(errors) {
  const grouped = {};
  
  errors.forEach(error => {
    if (!grouped[error.file]) {
      grouped[error.file] = [];
    }
    grouped[error.file].push(error);
  });
  
  return grouped;
}

// Get file stats
function getFileStats(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      size: stats.size,
      modified: stats.mtime
    };
  } catch {
    return {
      exists: false,
      size: 0,
      modified: null
    };
  }
}

// Scan for common TypeScript issues
function scanCommonIssues() {
  const issues = [];
  const srcDir = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcDir)) {
    return issues;
  }
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and .next
        if (file !== 'node_modules' && file !== '.next' && !file.startsWith('.')) {
          scanDirectory(filePath);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const relativePath = path.relative(process.cwd(), filePath);
          
          // Check for common issues
          
          // 1. Missing return type annotations
          const functionMatches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*{/g);
          for (const match of functionMatches) {
            if (!match[0].includes(':')) {
              issues.push({
                type: 'warning',
                file: relativePath,
                message: `Function "${match[1]}" is missing explicit return type annotation`,
                severity: 'low'
              });
            }
          }
          
          // 2. Any types
          const anyMatches = content.match(/: any\b/g);
          if (anyMatches) {
            issues.push({
              type: 'info',
              file: relativePath,
              message: `Found ${anyMatches.length} usage(s) of 'any' type`,
              severity: 'low'
            });
          }
          
          // 3. @ts-ignore or @ts-expect-error
          const tsIgnoreMatches = content.match(/@ts-(ignore|expect-error)/g);
          if (tsIgnoreMatches) {
            issues.push({
              type: 'info',
              file: relativePath,
              message: `Found ${tsIgnoreMatches.length} TypeScript suppression comment(s)`,
              severity: 'low'
            });
          }
          
          // 4. Unused imports (basic check)
          const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
          const usedImports = new Set();
          
          importLines.forEach(importLine => {
            const importMatch = importLine.match(/import\s+(?:\{([^}]+)\}|(\w+)|(\*))\s+from/);
            if (importMatch) {
              const imports = importMatch[1] || importMatch[2] || '*';
              if (imports !== '*') {
                imports.split(',').forEach(imp => {
                  const name = imp.trim().split(/\s+as\s+/)[0].trim();
                  if (name && !content.includes(name) && !name.includes('type')) {
                    // This is a very basic check and may have false positives
                  }
                });
              }
            }
          });
          
        } catch (error) {
          // Skip files that can't be read
        }
      }
    });
  }
  
  scanDirectory(srcDir);
  return issues;
}

// Main function
function main() {
  console.log(colorize('\n🔍 TypeScript Error Scanner\n', 'cyan'));
  console.log(colorize('='.repeat(60), 'blue'));
  
  const startTime = Date.now();
  
  try {
    // Run TypeScript compiler
    console.log(colorize('\n📋 Running TypeScript compiler...', 'blue'));
    
    const tscOutput = execSync('npx tsc --noEmit --pretty false 2>&1', {
      encoding: 'utf-8',
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    const errors = parseTypeScriptErrors(tscOutput);
    
    if (errors.length === 0) {
      console.log(colorize('\n✅ No TypeScript errors found!', 'green'));
    } else {
      console.log(colorize(`\n❌ Found ${errors.length} TypeScript error(s)\n`, 'red'));
      
      // Group by file
      const grouped = groupErrorsByFile(errors);
      
      // Display errors
      Object.keys(grouped).sort().forEach(file => {
        const fileErrors = grouped[file];
        const fileStats = getFileStats(file);
        
        console.log(colorize(`\n📄 ${file}`, 'bold'));
        if (!fileStats.exists) {
          console.log(colorize('   ⚠️  File not found!', 'yellow'));
        }
        
        fileErrors.forEach((error, index) => {
          console.log(colorize(`\n   Error ${index + 1}:`, 'red'));
          console.log(`   Line: ${error.line}, Column: ${error.column}`);
          console.log(`   Code: ${colorize(error.code, 'yellow')}`);
          console.log(`   Message: ${colorize(error.message, 'red')}`);
          
          if (error.details.length > 0) {
            console.log(`   Details:`);
            error.details.forEach(detail => {
              console.log(`     ${detail}`);
            });
          }
        });
      });
      
      // Summary
      console.log(colorize('\n' + '='.repeat(60), 'blue'));
      console.log(colorize('\n📊 Summary:', 'bold'));
      console.log(`   Total errors: ${colorize(errors.length.toString(), 'red')}`);
      console.log(`   Files with errors: ${colorize(Object.keys(grouped).length.toString(), 'red')}`);
      
      // Error codes breakdown
      const errorCodes = {};
      errors.forEach(error => {
        errorCodes[error.code] = (errorCodes[error.code] || 0) + 1;
      });
      
      console.log(colorize('\n   Error codes:', 'bold'));
      Object.keys(errorCodes).sort().forEach(code => {
        console.log(`     ${code}: ${errorCodes[code]}`);
      });
    }
    
    // Scan for common issues
    console.log(colorize('\n\n🔎 Scanning for common issues...', 'blue'));
    const commonIssues = scanCommonIssues();
    
    if (commonIssues.length > 0) {
      console.log(colorize(`\n⚠️  Found ${commonIssues.length} potential issue(s):\n`, 'yellow'));
      
      const byType = {};
      commonIssues.forEach(issue => {
        if (!byType[issue.type]) {
          byType[issue.type] = [];
        }
        byType[issue.type].push(issue);
      });
      
      Object.keys(byType).forEach(type => {
        console.log(colorize(`\n${type.toUpperCase()}:`, 'yellow'));
        byType[type].slice(0, 10).forEach(issue => {
          console.log(`   ${issue.file}: ${issue.message}`);
        });
        if (byType[type].length > 10) {
          console.log(colorize(`   ... and ${byType[type].length - 10} more`, 'yellow'));
        }
      });
    } else {
      console.log(colorize('✅ No common issues detected', 'green'));
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(colorize(`\n\n⏱️  Scan completed in ${duration}s`, 'cyan'));
    console.log(colorize('='.repeat(60) + '\n', 'blue'));
    
    // Exit with error code if errors found
    process.exit(errors.length > 0 ? 1 : 0);
    
  } catch (error) {
    // Check if it's a TypeScript error (non-zero exit)
    if (error.status !== 0) {
      const stderr = error.stderr?.toString() || error.stdout?.toString() || '';
      const errors = parseTypeScriptErrors(stderr);
      
      if (errors.length > 0) {
        console.log(colorize(`\n❌ Found ${errors.length} TypeScript error(s)\n`, 'red'));
        
        const grouped = groupErrorsByFile(errors);
        Object.keys(grouped).sort().forEach(file => {
          const fileErrors = grouped[file];
          console.log(colorize(`\n📄 ${file}`, 'bold'));
          fileErrors.forEach((error, index) => {
            console.log(colorize(`\n   Error ${index + 1}:`, 'red'));
            console.log(`   Line: ${error.line}, Column: ${error.column}`);
            console.log(`   Code: ${colorize(error.code, 'yellow')}`);
            console.log(`   Message: ${colorize(error.message, 'red')}`);
          });
        });
        
        process.exit(1);
      }
    }
    
    console.error(colorize('\n❌ Error running TypeScript compiler:', 'red'));
    console.error(error.message);
    process.exit(1);
  }
}

// Run the scanner
main();

