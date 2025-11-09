const fs = require('fs');
const path = require('path');

const adminPages = [
  'notebook', 'ai-analyst', 'ai-chat-ui', 'knowledge-base', 'projects',
  'storage', 'data-governance', 'users', 'roles', 'permission-tester',
  'space-layouts', 'data', 'attachments', 'kernels', 'health', 'logs',
  'audit', 'database', 'change-requests', 'sql-linting', 'schema-migrations',
  'data-masking', 'cache', 'backup', 'security', 'performance', 'settings',
  'page-templates', 'notifications', 'themes', 'export', 'integrations',
  'api', 'space-selection'
];

adminPages.forEach(page => {
  const filePath = path.join(__dirname, '..', 'app', 'admin', page, 'page.tsx');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('div className="p-6"')) {
      // Extract the component import and name
      const importMatch = content.match(/import\s+(\w+)\s+from/);
      const componentName = importMatch ? importMatch[1] : null;
      
      if (componentName) {
        const newContent = content.replace(
          /return\s+<(\w+)\s*\/?>/,
          `return (
    <div className="p-6">
      <${componentName} />
    </div>
  )`
        );
        fs.writeFileSync(filePath, newContent);
        console.log(`Updated ${filePath}`);
      }
    }
  }
});

