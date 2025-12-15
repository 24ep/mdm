const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/notebooks/[id]/versions/diff/route.ts',
  'src/app/api/notebooks/[id]/versions/prune/route.ts',
  'src/app/api/notebooks/[id]/versions/[versionId]/route.ts',
  'src/app/api/openai-agent-sdk/feedback/route.ts',
  'src/app/api/openai-agent-sdk/threads/route.ts',
  'src/app/api/openai-agent-sdk/threads/[threadId]/messages/route.ts',
  'src/app/api/openai-agent-sdk/threads/[threadId]/route.ts',
  'src/app/api/openai-realtime/health/route.ts',
  'src/app/api/openai-realtime/voice/route.ts',
  'src/app/api/permissions/check-all/route.ts',
  'src/app/api/permissions/check-any/route.ts',
  'src/app/api/permissions/route.ts',
  'src/app/api/permissions/user/route.ts',
  'src/app/api/plugins/gateway/[slug]/[...path]/route.ts',
  'src/app/api/plugins/[slug]/route.ts',
  'src/app/api/public/spaces/[slug]/route.ts',
  'src/app/api/reports/[id]/permissions/[permissionId]/route.ts',
  'src/app/api/reports/[id]/permissions/route.ts',
  'src/app/api/reports/[id]/share/route.ts',
  'src/app/api/reports/shared/[token]/route.ts',
  'src/app/api/s3/presigned-url/route.ts',
  'src/app/api/scheduler/all/route.ts',
  'src/app/api/schema/migrations/route.ts',
  'src/app/api/spaces-editor/[spaceId]/route.ts',
  'src/app/api/spaces/[id]/attachment-storage-postgresql/route.ts',
  'src/app/api/spaces/[id]/attachment-storage/route.ts',
  'src/app/api/spaces/[id]/attachment-storage/test/route.ts',
  'src/app/api/spaces/[id]/dashboard/route.ts',
  'src/app/api/spaces/[id]/data-models/route.ts',
  'src/app/api/spaces/[id]/default-page/route.ts',
  'src/app/api/spaces/[id]/layout/versions/route.ts',
  'src/app/api/spaces/[id]/layout/versions/[versionId]/restore/route.ts',
  'src/app/api/spaces/[id]/members/bulk/route.ts',
  'src/app/api/spaces-orm/route.ts',
  'src/app/api/sql/explain/route.ts',
  'src/app/api/sql/lint/route.ts',
  'src/app/api/sse/notifications/route.ts',
  'src/app/api/sse/route.ts',
  'src/app/api/themes/[id]/clone/route.ts',
  'src/app/api/upload/emulator-background/route.ts',
  'src/app/api/upload/favicon/route.ts',
  'src/app/api/upload/logo/route.ts',
  'src/app/api/upload/widget-avatar/route.ts',
  'src/app/api/users/search/route.ts',
  'src/app/api/v1/dashboards/[id]/route.ts',
  'src/app/api/v1/reports/[id]/route.ts',
  'src/app/api/v1/tickets/[id]/route.ts',
  'src/app/api/v1/workflows/[id]/route.ts',
  'src/app/api/webhooks/git/route.ts',
  'src/app/api/workflows/executions/route.ts',
  'src/app/api/workflows/scheduler/route.ts',
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    
    // Fix 1: Remove double closing parentheses in exports
    content = content.replace(/withErrorHandling\((\w+),\s*'([^']+)'\)\)/g, (match, handler, name) => {
      modified = true;
      return `withErrorHandling(${handler}, '${name}')`;
    });
    
    // Fix 2: Remove stray ", { status: 500 })" lines followed by "}"
    content = content.replace(/,\s*\{\s*status:\s*500\s*\}\s*\)\s*\n\s*\}\s*\n\s*\}/g, () => {
      modified = true;
      return '';
    });
    
    // Fix 3: Fix pattern where "return NextResponse.json({ ... } catch (error" - missing ")}"
    content = content.replace(
      /return\s+NextResponse\.json\(\{([^}]+)\}\s*\)\s*\}\s*catch\s*\(/g,
      (match, inner) => {
        modified = true;
        return `return NextResponse.json({${inner}})\n  } catch (`;
      }
    );
    
    // Fix 4: Add missing closing brace for if (!session?.user) blocks
    // Pattern: if (!session?.user) {\n  return NextResponse.json(...)\n\n  const
    content = content.replace(
      /(if\s*\(!session\?\.user\)\s*\{\s*\n\s*return\s+NextResponse\.json\([^)]+\),?\s*\{\s*status:\s*\d+\s*\}\s*\))\n(\s*\n?\s*(?:const|let|var|const \{|return|await|\/\/|\n\s*\n\s*async))/g,
      (match, p1, p2) => {
        modified = true;
        return p1 + '\n    }\n' + p2;
      }
    );
    
    // Fix 5: Clean up duplicate/extra closing braces before export
    content = content.replace(/\}\n\s*\}\n\s*\}\n\s*\n*\s*export/g, () => {
      modified = true;
      return '}\n\nexport';
    });
    
    // Fix 6: Fix lines that have `, { status: 500 })\n  }\n}` pattern
    content = content.replace(/,\s*\{\s*status:\s*500\s*\}\s*\)\s*\n\s*\}\n\}/g, () => {
      modified = true;
      return ', { status: 500 })\n  }\n}';
    });
    
    // Fix 7: Fix unclosed try-catch blocks - look for } catch ( without a try
    const lines = content.split('\n');
    let fixedLines = [];
    let braceStack = [];
    let needsTry = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Count braces
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      
      // Check for orphaned catch
      if (line.match(/^\s*\}\s*catch\s*\(/) && braceStack.length === 0) {
        // This is likely an orphaned catch - skip it
        modified = true;
        continue;
      }
      
      fixedLines.push(line);
    }
    
    content = fixedLines.join('\n');
    
    // Fix 8: Remove empty catch blocks that start export statements
    content = content.replace(/\}\s*catch\s*\([^)]+\)\s*\{\s*\n\s*console\.error[^\n]+\n\s*return\s+NextResponse\.json[^\n]+\n\s*\}\s*\n\s*\}\s*\n*\s*export/g, (match) => {
      modified = true;
      return '}\n\nexport';
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
    return false;
  }
}

let fixedCount = 0;
files.forEach(file => {
  const filePath = path.join('/workspace', file);
  if (fs.existsSync(filePath)) {
    if (fixFile(filePath)) {
      fixedCount++;
    }
  }
});

console.log(`\nTotal files fixed: ${fixedCount}`);
