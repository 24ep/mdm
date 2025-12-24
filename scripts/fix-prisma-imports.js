// Script to fix duplicate PrismaClient instances
// Run with: node scripts/fix-prisma-imports.js

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

// Pattern to match files that need fixing
const PATTERN_TO_FIND = /import\s*{\s*PrismaClient\s*}\s*from\s*['"]@prisma\/client['"]\s*[\r\n]+\s*(?:const|let|var)\s+prisma\s*=\s*new\s+PrismaClient\(\)/g;

// Replacement
const REPLACEMENT = `import { db as prisma } from '@/lib/db'`;

// Alternative pattern (PrismaClient alone on one line)
const ALT_PATTERN = /import\s*{\s*PrismaClient\s*}\s*from\s*['"]@prisma\/client['"]\s*/g;
const PRISMA_INSTANCE_PATTERN = /(?:const|let|var)\s+prisma\s*=\s*new\s+PrismaClient\(\)\s*[\r\n]*/g;

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already using db import
  if (content.includes("from '@/lib/db'") && content.includes('db as prisma')) {
    return { skipped: true, reason: 'already fixed' };
  }
  
  // Skip if no PrismaClient import
  if (!content.includes('PrismaClient')) {
    return { skipped: true, reason: 'no PrismaClient' };
  }
  
  // Skip the db.ts and prisma.ts files themselves
  const fileName = path.basename(filePath);
  if (fileName === 'db.ts' || fileName === 'prisma.ts') {
    return { skipped: true, reason: 'is db singleton file' };
  }
  
  let newContent = content;
  let changed = false;
  
  // First try the combined pattern
  if (PATTERN_TO_FIND.test(content)) {
    newContent = content.replace(PATTERN_TO_FIND, REPLACEMENT);
    changed = true;
  }
  
  // If not matched, try separate patterns
  if (!changed && ALT_PATTERN.test(content) && PRISMA_INSTANCE_PATTERN.test(content)) {
    newContent = content
      .replace(ALT_PATTERN, `import { db as prisma } from '@/lib/db'\n`)
      .replace(PRISMA_INSTANCE_PATTERN, '');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return { fixed: true };
  }
  
  return { skipped: true, reason: 'pattern not matched' };
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next') {
        walkDir(filePath, callback);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      callback(filePath);
    }
  }
}

console.log('Scanning for duplicate PrismaClient instances...\n');

let fixed = 0;
let skipped = 0;
const results = [];

walkDir(srcDir, (filePath) => {
  const result = processFile(filePath);
  const relativePath = path.relative(srcDir, filePath);
  
  if (result.fixed) {
    fixed++;
    results.push(`✓ Fixed: ${relativePath}`);
  } else if (result.reason === 'already fixed') {
    // Don't log already fixed
  } else if (result.reason !== 'no PrismaClient') {
    skipped++;
    results.push(`⊘ Skipped (${result.reason}): ${relativePath}`);
  }
});

console.log(results.join('\n'));
console.log(`\n========================================`);
console.log(`Fixed: ${fixed} files`);
console.log(`Skipped: ${skipped} files`);
console.log(`========================================`);
