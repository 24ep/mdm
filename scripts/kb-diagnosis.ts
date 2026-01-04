
import { query } from '../src/lib/db';

async function diagnose() {
    try {
        console.log('--- Schemas ---');
        const schemas = await query('SELECT schema_name FROM information_schema.schemata');
        console.log(schemas.rows.map(r => r.schema_name).filter(s => s.startsWith('plugin_') || s === 'public'));

        console.log('\n--- Tables in plugin_knowledge_base ---');
        const tables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'plugin_knowledge_base'");
        console.log(tables.rows.map(r => r.table_name));

        console.log('\n--- Recent Documents in plugin_knowledge_base ---');
        const docs = await query('SELECT id, title, collection_id, created_at FROM "plugin_knowledge_base".knowledge_documents ORDER BY created_at DESC LIMIT 10');
        console.log(docs.rows);

        console.log('\n--- Collections in plugin_knowledge_base ---');
        const cols = await query('SELECT id, name, created_by, is_private FROM "plugin_knowledge_base".knowledge_collections');
        console.log(cols.rows);

        console.log('\n--- Collection Members in plugin_knowledge_base ---');
        const members = await query('SELECT * FROM "plugin_knowledge_base".knowledge_collection_members');
        console.log(members.rows);

    } catch (e) {
        console.error('Diagnosis failed:', e.message);
    }
}

diagnose();
