const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'src/app/api');

// Functions that should be imported from @/lib/api-middleware
const apiMiddlewareFunctions = [
  'requireAuth',
  'requireAuthWithId',
  'requireAdmin',
  'withErrorHandling',
  'handleApiError',
];

// Functions that should be imported from @/lib/space-access
const spaceAccessFunctions = [
  'requireSpaceAccess',
  'requireAnySpaceAccess',
];

// Functions that should be imported from @/lib/security-headers
const securityHeadersFunctions = [
  'addSecurityHeaders',
];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else if (f.endsWith('.ts')) {
      callback(dirPath);
    }
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check for api-middleware functions
  const usedApiMiddleware = apiMiddlewareFunctions.filter(fn => {
    const regex = new RegExp(`\\b${fn}\\b`, 'g');
    return regex.test(content);
  });

  if (usedApiMiddleware.length > 0) {
    // Check if import exists
    const importRegex = /import\s*{([^}]+)}\s*from\s*['"]@\/lib\/api-middleware['"]/;
    const match = content.match(importRegex);
    
    if (match) {
      const currentImports = match[1].split(',').map(s => s.trim()).filter(s => s);
      const missingImports = usedApiMiddleware.filter(fn => !currentImports.includes(fn));
      
      if (missingImports.length > 0) {
        const newImports = [...new Set([...currentImports, ...missingImports])].join(', ');
        content = content.replace(importRegex, `import { ${newImports} } from '@/lib/api-middleware'`);
        modified = true;
      }
    } else {
      // Add import at top of file after other imports
      const importStatement = `import { ${usedApiMiddleware.join(', ')} } from '@/lib/api-middleware'\n`;
      const firstImportIdx = content.indexOf("import ");
      if (firstImportIdx !== -1) {
        // Find the end of imports
        const lines = content.split('\n');
        let lastImportIdx = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            lastImportIdx = i;
          }
        }
        lines.splice(lastImportIdx + 1, 0, importStatement.trim());
        content = lines.join('\n');
        modified = true;
      }
    }
  }

  // Check for space-access functions
  const usedSpaceAccess = spaceAccessFunctions.filter(fn => {
    const regex = new RegExp(`\\b${fn}\\b`, 'g');
    return regex.test(content);
  });

  if (usedSpaceAccess.length > 0) {
    const importRegex = /import\s*{([^}]+)}\s*from\s*['"]@\/lib\/space-access['"]/;
    const match = content.match(importRegex);
    
    if (match) {
      const currentImports = match[1].split(',').map(s => s.trim()).filter(s => s);
      const missingImports = usedSpaceAccess.filter(fn => !currentImports.includes(fn));
      
      if (missingImports.length > 0) {
        const newImports = [...new Set([...currentImports, ...missingImports])].join(', ');
        content = content.replace(importRegex, `import { ${newImports} } from '@/lib/space-access'`);
        modified = true;
      }
    } else {
      const importStatement = `import { ${usedSpaceAccess.join(', ')} } from '@/lib/space-access'\n`;
      const lines = content.split('\n');
      let lastImportIdx = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIdx = i;
        }
      }
      lines.splice(lastImportIdx + 1, 0, importStatement.trim());
      content = lines.join('\n');
      modified = true;
    }
  }

  // Check for security-headers functions
  const usedSecurityHeaders = securityHeadersFunctions.filter(fn => {
    const regex = new RegExp(`\\b${fn}\\b`, 'g');
    return regex.test(content);
  });

  if (usedSecurityHeaders.length > 0) {
    const importRegex = /import\s*{([^}]+)}\s*from\s*['"]@\/lib\/security-headers['"]/;
    const match = content.match(importRegex);
    
    if (match) {
      const currentImports = match[1].split(',').map(s => s.trim()).filter(s => s);
      const missingImports = usedSecurityHeaders.filter(fn => !currentImports.includes(fn));
      
      if (missingImports.length > 0) {
        const newImports = [...new Set([...currentImports, ...missingImports])].join(', ');
        content = content.replace(importRegex, `import { ${newImports} } from '@/lib/security-headers'`);
        modified = true;
      }
    } else {
      const importStatement = `import { ${usedSecurityHeaders.join(', ')} } from '@/lib/security-headers'\n`;
      const lines = content.split('\n');
      let lastImportIdx = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIdx = i;
        }
      }
      lines.splice(lastImportIdx + 1, 0, importStatement.trim());
      content = lines.join('\n');
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed imports in:', filePath);
  }
}

walkDir(apiDir, processFile);
console.log('Done!');
