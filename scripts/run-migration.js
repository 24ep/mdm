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

function splitSqlStatements(sql) {
  // Remove comments (careful with this, but works for our schema files)
  const cleanSql = sql.replace(/--.*$/gm, '');

  const statements = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let inDollar = false;
  let dollarTag = '';

  for (let i = 0; i < cleanSql.length; i++) {
    const char = cleanSql[i];

    // Check for Dollar Quote start/end
    if (!inSingle && !inDouble) {
      if (char === '$') {
        let j = i + 1;
        let tag = '';
        while (j < cleanSql.length && cleanSql[j] !== '$') {
          if (!/[a-zA-Z0-9_]/.test(cleanSql[j])) break;
          tag += cleanSql[j];
          j++;
        }
        if (j < cleanSql.length && cleanSql[j] === '$') {
          const fullTag = '$' + tag + '$';
          if (!inDollar) {
            inDollar = true;
            dollarTag = fullTag;
            current += fullTag;
            i = j;
            continue;
          } else if (fullTag === dollarTag) {
            inDollar = false;
            dollarTag = '';
            current += fullTag;
            i = j;
            continue;
          }
        }
      }
    }

    if (!inDollar && !inDouble && char === "'") inSingle = !inSingle;
    else if (!inDollar && !inSingle && char === '"') inDouble = !inDouble;

    if (!inSingle && !inDouble && !inDollar && char === ';') {
      if (current.trim()) statements.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) statements.push(current.trim());
  return statements;
}

async function executeSqlFile(filePath, fileName) {
  console.log(`\nRunning ${fileName} migration...`);
  const sql = fs.readFileSync(filePath, 'utf8');
  if (!sql.trim()) return;

  const statements = splitSqlStatements(sql);
  console.log(`Executing ${statements.length} statements from ${fileName}...`);

  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await prisma.$executeRawUnsafe(statement);
      } catch (e) {
        console.error('---------------------------------------------------');
        console.error(`Error executing statement in ${fileName}:`);
        console.error(statement);
        console.error('---------------------------------------------------');
        console.error('Error details:', e);
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

