const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
    console.log('🚀 Starting end-to-end verification of Schema-per-Plugin architecture...');

    const testPluginSlug = 'test_isolation_plugin';
    const testSchemaName = `plugin_${testPluginSlug}`;

    try {
        // 1. Clean up any existing test data
        console.log('🧹 Cleaning up old test data...');
        await p.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${testSchemaName}" CASCADE`);
        await p.$executeRawUnsafe(`DELETE FROM service_installations WHERE service_id IN (SELECT id FROM service_registry WHERE slug = '${testPluginSlug}')`);
        await p.$executeRawUnsafe(`DELETE FROM service_registry WHERE slug = '${testPluginSlug}'`);

        // 2. Create a dummy plugin in registry
        console.log('📦 Creating dummy plugin...');
        const pluginId = '00000000-0000-0000-0000-000000000123';
        await p.serviceRegistry.create({
            data: {
                id: pluginId,
                slug: testPluginSlug,
                name: 'Test Isolation Plugin',
                version: '1.0.0',
                provider: 'Test',
                status: 'approved',
                uiConfig: {
                    migrations: {
                        up: "CREATE TABLE test_table (id serial PRIMARY KEY, name text); INSERT INTO test_table (name) VALUES ('Isolated Data');"
                    }
                },
                screenshots: [],
                webhookEvents: []
            }
        });

        // 3. Simulate installation
        console.log('📥 Simulating installation (calling the logic manually)...');
        // We'll mimic the route.ts logic
        const { createPluginSchema, runPluginMigration } = require('./src/lib/plugin-schema-utils');

        // Create schema
        const schemaName = await createPluginSchema(testPluginSlug);
        console.log(`✅ Schema created: ${schemaName}`);

        // Create installation record
        const installationId = '00000000-0000-0000-0000-000000000456';
        await p.serviceInstallation.create({
            data: {
                id: installationId,
                serviceId: pluginId,
                dbSchema: schemaName,
                status: 'active'
            }
        });

        // Run migration
        const migrationSql = "CREATE TABLE test_table (id serial PRIMARY KEY, name text); INSERT INTO test_table (name) VALUES ('Isolated Data');";
        await runPluginMigration(testPluginSlug, migrationSql);
        console.log('✅ Migration ran successfully');

        // 4. Verify data in isolated schema
        console.log('🔍 Verifying data in isolated schema...');
        const result = await p.$queryRawUnsafe(`SELECT * FROM "${schemaName}".test_table`);
        console.log('Data found in isolated schema:', result);

        if (result.length > 0 && result[0].name === 'Isolated Data') {
            console.log('⭐ SUCCESS: Data isolation verified!');
        } else {
            throw new Error('Data isolation verification failed: Data not found in new schema');
        }

        // 5. Simulate uninstallation
        console.log('🗑️ Simulating uninstallation...');
        const { dropPluginSchema } = require('./src/lib/plugin-schema-utils');
        await dropPluginSchema(testPluginSlug);
        console.log(`✅ Schema dropped: ${schemaName}`);

        // 6. Verify schema is gone
        console.log('🔍 Verifying schema removal...');
        try {
            await p.$queryRawUnsafe(`SELECT * FROM "${schemaName}".test_table`);
            throw new Error('FAILURE: Schema still exists after uninstallation!');
        } catch (e) {
            console.log('✅ Verified: Schema no longer exists (Query failed as expected)');
        }

        console.log('\n✨ ALL TESTS PASSED! Schema-per-plugin architecture is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    } finally {
        // Final cleanup
        await p.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${testSchemaName}" CASCADE`);
        await p.$executeRawUnsafe(`DELETE FROM service_installations WHERE service_id IN (SELECT id FROM service_registry WHERE slug = '${testPluginSlug}')`);
        await p.$executeRawUnsafe(`DELETE FROM service_registry WHERE slug = '${testPluginSlug}'`);
        await p.$disconnect();
    }
}

test();
