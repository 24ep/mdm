const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/notebooks/[id]/versions/diff/route.ts',
  'src/app/api/notebooks/[id]/versions/prune/route.ts',
  'src/app/api/notebooks/[id]/versions/route.ts',
  'src/app/api/notebooks/[id]/versions/[versionId]/route.ts',
  'src/app/api/openai-agent-sdk/feedback/route.ts',
  'src/app/api/openai-agent-sdk/threads/route.ts',
  'src/app/api/openai-agent-sdk/threads/[threadId]/messages/route.ts',
  'src/app/api/openai-agent-sdk/threads/[threadId]/route.ts',
  'src/app/api/openai-realtime/health/route.ts',
  'src/app/api/openai-realtime/voice/route.ts',
  'src/app/api/permissions/check-all/route.ts',
  'src/app/api/permissions/check-any/route.ts',
  'src/app/api/permissions/check/route.ts',
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
    
    // Fix 1: Add closing brace after simple if statements with return NextResponse.json that end without a closing brace
    // Pattern: if (...) {\n  return NextResponse.json({ ... }, { status: ... })\n\n (missing })
    const ifReturnPattern = /(if\s*\([^)]+\)\s*\{\s*\n\s*return\s+NextResponse\.json\([^)]+\),?\s*\{\s*status:\s*\d+\s*\}\s*\))\n(\s*)(?!\})/g;
    let newContent = content.replace(ifReturnPattern, (match, before, indent) => {
      modified = true;
      return before + '\n' + indent + '}\n' + indent;
    });
    
    // Fix 2: Remove duplicate exports - keep only the last export statement
    const lines = newContent.split('\n');
    const exportLines = [];
    const exportIndices = [];
    
    lines.forEach((line, index) => {
      if (line.match(/^export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=/)) {
        const method = line.match(/export\s+const\s+(GET|POST|PUT|DELETE|PATCH)/)?.[1];
        if (method) {
          const existing = exportLines.findIndex(e => e.method === method);
          if (existing !== -1) {
            // Mark old one for removal
            exportIndices[existing] = -1;
          }
          exportLines.push({ method, index, line });
          exportIndices.push(index);
        }
      }
    });
    
    // Remove duplicate export lines (keeping the last one of each type)
    const linesToRemove = new Set();
    const seenMethods = new Map();
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (line.match(/^export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=/)) {
        const method = line.match(/export\s+const\s+(GET|POST|PUT|DELETE|PATCH)/)?.[1];
        if (method) {
          if (seenMethods.has(method)) {
            linesToRemove.add(i);
            modified = true;
          } else {
            seenMethods.set(method, i);
          }
        }
      }
    }
    
    if (linesToRemove.size > 0) {
      newContent = lines.filter((_, i) => !linesToRemove.has(i)).join('\n');
    }
    
    // Fix 3: Fix pattern where return NextResponse.json ends with } catch (error) { without proper try
    // Look for orphaned catch blocks and wrap them properly
    newContent = newContent.replace(
      /(\s*return\s+NextResponse\.json\([^}]+\}[^}]*\}[^)]*\)[^}]*)\n(\s*)\} catch \(error/g,
      (match, before, indent) => {
        modified = true;
        return before + '\n' + indent + '} catch (error';
      }
    );
    
    // Fix 4: Fix "}} catch" pattern (double closing brace before catch)
    newContent = newContent.replace(/\}\}\s*catch\s*\(/g, () => {
      modified = true;
      return '} catch (';
    });
    
    // Fix 5: Fix pattern where `  const { session } = authResult` is directly after `if (!authResult.success) return authResult.response`
    // This indicates missing brace for auth check
    newContent = newContent.replace(
      /(if\s*\(!authResult\.success\)\s*return\s*authResult\.response)\n(\s*const\s*\{\s*session\s*\}\s*=\s*authResult)/g,
      (match, p1, p2) => {
        modified = true;
        return p1 + '\n' + p2;
      }
    );
    
    // Fix 6: Fix unterminated strings in withErrorHandling - simplify route names
    newContent = newContent.replace(
      /withErrorHandling\((\w+),\s*'(GET|POST|PUT|DELETE|PATCH)\s+(GET|POST|PUT|DELETE|PATCH)?[^']*'/g,
      (match, handler, method) => {
        modified = true;
        return `withErrorHandling(${handler}, '${method}')`;
      }
    );
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
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
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log(`\nTotal files fixed: ${fixedCount}`);
