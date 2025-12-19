const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// SQL files to execute in order (dependencies first)
const SQL_FILES = [
  'reports_schema.sql',           // Base reports tables (categories, folders, reports)
  'reports_audit_schema.sql',     // Audit tables that reference reports tables
  'platform_integrations_schema.sql'  // Platform integrations
];

/**
 * Splits SQL string into multiple statements, respecting quoted strings and dollar-quoted strings.
 * This is necessary because Prisma.$executeRawUnsafe does not support multiple statements in one call.
 */
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let i = 0;
  
  let inSingle = false;
  let inDouble = false;
  let inDollar = false;
  let dollarTag = '';

  while (i < sql.length) {
    const char = sql[i];
    
    // Check for Dollar Quote start/end
    if (!inSingle && !inDouble) {
      if (char === '$') {
        // Potential start or end of dollar quote. Scan ahead for matching $
        let j = i + 1;
        let tag = '';
        while (j < sql.length && sql[j] !== '$') {
          // tag can contain letters, numbers, underscores
          if (!/[a-zA-Z0-9_]/.test(sql[j])) {
            break; 
          }
          tag += sql[j];
          j++;
        }
        
        if (j < sql.length && sql[j] === '$') {
          // Found a complete $tag$ sequence
          const fullTag = '$' + tag + '$';
          
          if (!inDollar) {
            // Start of dollar quote
            inDollar = true;
            dollarTag = fullTag;
            current += fullTag;
            i = j + 1;
            continue;
          } else {
            // Check if this matches the opening tag
            if (fullTag === dollarTag) {
              inDollar = false;
              dollarTag = '';
              current += fullTag;
              i = j + 1;
              continue;
            }
          }
        }
      }
    }
    
    // Check for Single/Double quotes
    if (!inDollar && !inDouble && char === "'") {
      inSingle = !inSingle;
    } else if (!inDollar && !inSingle && char === '"') {
      inDouble = !inDouble;
    }
    
    // Check for semicolon
    if (!inSingle && !inDouble && !inDollar && char === ';') {
      if (current.trim()) {
        statements.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
    
    i++;
  }
  
  if (current.trim()) {
    statements.push(current.trim());
  }
  
  return statements;
}

async function executeSqlFile(filePath, fileName) {
  console.log(`\nRunning ${fileName} migration...`);
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  if (!sql.trim()) {
    console.log(`⚠️  ${fileName} is empty`);
    return;
  }

  // Split content into safe statements
  const statements = splitSqlStatements(sql);
  console.log(`Executing ${statements.length} statements from ${fileName}...`);

  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await prisma.$executeRawUnsafe(statement);
      } catch (e) {
        console.error(`Error executing statement: ${statement.substring(0, 50)}...`);
        throw e;
      }
    }
  }
  
  console.log(`✅ ${fileName} completed!`);
}

async function runMigration() {
  try {
    for (const sqlFileName of SQL_FILES) {
      const sqlFile = path.join(__dirname, '../sql', sqlFileName);
      
      // Check if file exists before executing
      if (fs.existsSync(sqlFile)) {
        await executeSqlFile(sqlFile, sqlFileName);
      } else {
        console.log(`⚠️  Skipping ${sqlFileName} (file not found)`);
      }
    }
    
    console.log('\n✅ All migrations completed successfully!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.meta) {
      console.error('Error details:', error.meta);
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

runMigration();

