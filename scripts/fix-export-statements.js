const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function fixExports() {
  const files = await glob('src/app/api/**/route.ts');
  let fixed = 0;

  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const original = content;

      // Fix exports with /route.ts in the path
      content = content.replace(
        /export const (GET|POST|PUT|DELETE|PATCH) = withErrorHandling\((\w+), '([^']*)\/route\.ts'\)/g,
        (match, method, handler, routePath) => {
          // Remove /route.ts and clean up the path
          const cleanPath = routePath.replace(/\/route\.ts$/, '').trim();
          return `export const ${method} = withErrorHandling(${handler}, '${method} ${cleanPath}')`;
        }
      );

      // Fix exports with '/api/...' placeholder
      content = content.replace(
        /export const (GET|POST|PUT|DELETE|PATCH) = withErrorHandling\((\w+), '([^']*)\/api\/\.\.\.'\)/g,
        (match, method, handler) => {
          // Extract the actual route path from the file path
          const relativePath = file.replace(/src\/app\/api\//, '').replace(/\/route\.ts$/, '');
          const routePath = `/api/${relativePath}`;
          return `export const ${method} = withErrorHandling(${handler}, '${method} ${routePath}')`;
        }
      );

      if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        fixed++;
        console.log(`✅ Fixed: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing ${file}:`, error.message);
    }
  }

  console.log(`\n📊 Fixed ${fixed} files`);
}

fixExports().catch(console.error);

