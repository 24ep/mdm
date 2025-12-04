const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'src/app/api/eav/entities/[id]/values/route.ts',
    fixes: [
      {
        search: `  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized'  })

    const { id } = await params`,
        replace: `  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params`
      },
      {
        search: `  if (entity.length === 0) {
    return NextResponse.json({ error: 'Entity not found'  })
  }

    // Insert or update values`,
        replace: `  if (entity.length === 0) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
  }

  // Insert or update values`
      },
      {
        search: `  if (entity.length === 0) {
    return NextResponse.json({ error: 'Entity not found'  })
  }

    // Update values`,
        replace: `  if (entity.length === 0) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
  }

  // Update values`
      }
    ]
  },
  {
    file: 'src/app/api/export-profiles/[id]/execute/route.ts',
    fixes: [
      {
        search: `  const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized'  })

export const POST = withErrorHandling(postHandler, '

    const { id: profileId } = await params`,
        replace: `  const { session } = authResult
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: profileId } = await params`
      },
      {
        search: `    if (profileResult.rows.length === 0) {
      return NextResponse.json({ error: 'Export profile not found'  })

    const profile = profileResult.rows[0]`,
        replace: `    if (profileResult.rows.length === 0) {
      return NextResponse.json({ error: 'Export profile not found' }, { status: 404 })
    }

    const profile = profileResult.rows[0]`
      },
      {
        search: `    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied'  })

    // Get data model attributes`,
        replace: `    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get data model attributes`
      },
      {
        search: `    if (selectedColumns.length === 0) {
      return NextResponse.json({ error: 'No columns selected for export'  })

    // Build the SQL query`,
        replace: `    if (selectedColumns.length === 0) {
      return NextResponse.json({ error: 'No columns selected for export' }, { status: 400 })
    }

    // Build the SQL query`
      },
      {
        search: `    if (exportData.length === 0) {
      return NextResponse.json({ error: 'No data found matching the criteria'  })

    // Generate the file`,
        replace: `    if (exportData.length === 0) {
      return NextResponse.json({ error: 'No data found matching the criteria' }, { status: 404 })
    }

    // Generate the file`
      }
    ]
  },
  {
    file: 'src/app/api/export/csv/route.ts',
    fixes: [
      {
        search: `async function postHandler(request: NextRequest) {
    try {
    const authResult = await requireAuth()`,
        replace: `async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()`
      },
      {
        search: `    return response
}

    console.error('Error exporting to CSV:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export data to CSV' },
      { status: 500 }
    )
  }
}


export const POST = withErrorHandling(postHandler, 'POST POST /api/export\\csv\\route.ts')`,
        replace: `    return response
  } catch (error: any) {
    console.error('Error exporting to CSV:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export data to CSV' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/export/csv/route.ts')`
      }
    ]
  },
  {
    file: 'src/app/api/export/json/route.ts',
    fixes: [
      {
        search: `async function postHandler(request: NextRequest) {
    const authResult = await requireAuth()`,
        replace: `async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()`
      },
      {
        search: `    return response
  ,
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/export/json')


export const POST = withErrorHandling(postHandler, 'POST POST /api/export\\json\\route.ts')`,
        replace: `    return response
  } catch (error: any) {
    console.error('Error exporting to JSON:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export data to JSON' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/export/json/route.ts')`
      }
    ]
  },
  {
    file: 'src/app/api/export/pdf/route.ts',
    fixes: [
      {
        search: `async function postHandler(request: NextRequest) {
    const authResult = await requireAuth()`,
        replace: `async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()`
      },
      {
        search: `      await browser.close()
      throw pdfError
    }
  ,
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/export/pdf')


export const POST = withErrorHandling(postHandler, 'POST POST /api/export\\pdf\\route.ts')`,
        replace: `      await browser.close()
      throw pdfError
    }
  } catch (error: any) {
    console.error('Error exporting to PDF:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export data to PDF' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/export/pdf/route.ts')`
      }
    ]
  }
];

console.log('Starting syntax error fixes...\n');

let totalFixed = 0;
let totalErrors = 0;

fixes.forEach(({ file, fixes: fileFixes }) => {
  const filePath = path.join(process.cwd(), file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileFixed = 0;
    
    fileFixes.forEach((fix, index) => {
      if (content.includes(fix.search)) {
        content = content.replace(fix.search, fix.replace);
        fileFixed++;
        totalFixed++;
        console.log(`✓ Fixed issue ${index + 1} in ${file}`);
      } else {
        console.log(`⚠ Could not find pattern ${index + 1} in ${file}`);
      }
    });
    
    if (fileFixed > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Saved ${file} with ${fileFixed} fix(es)\n`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
    totalErrors++;
  }
});

console.log('\n=== Summary ===');
console.log(`Total fixes applied: ${totalFixed}`);
console.log(`Total errors: ${totalErrors}`);
console.log('\nDone! Run "npm run build" to verify all fixes.');
