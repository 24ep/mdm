
import { query } from '../src/lib/db';

async function main() {
  console.log('--- Fetching a user ID ---');
  let userId;
  try {
    const { rows } = await query('SELECT id FROM users LIMIT 1');
    if (rows.length > 0) {
      userId = rows[0].id;
      console.log('Found user ID:', userId);
    } else {
      console.warn('No users found in database!');
      return;
    }
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return;
  }

  const spaceId = '464ea298-c443-407d-9b42-6d94d8bcb34a'; // ID from user error
  const limit = 200;
  const offset = 0;
  const filters: string[] = ['dm.deleted_at IS NULL', 'dms.space_id::text = $1'];
  
  const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';
  const params = [spaceId];

  // List SQL
  const listSql = `
      SELECT DISTINCT dm.id, dm.name, dm.description, dm.created_at, dm.updated_at, dm.deleted_at,
             dm.is_active, dm.sort_order, dm.created_by,
             ARRAY_AGG(s.slug) as space_slugs,
             ARRAY_AGG(s.name) as space_names
      FROM public.data_models dm
      JOIN public.data_model_spaces dms ON dms.data_model_id = dm.id
      JOIN public.spaces s ON s.id = dms.space_id
      ${where}
      GROUP BY dm.id, dm.name, dm.description, dm.created_at, dm.updated_at, dm.deleted_at,
               dm.is_active, dm.sort_order, dm.created_by
      ORDER BY dm.sort_order ASC, dm.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

  // Count SQL
  const countSql = `
      SELECT COUNT(DISTINCT dm.id)::int AS total 
      FROM public.data_models dm
      JOIN public.data_model_spaces dms ON dms.data_model_id = dm.id
      ${where}
    `;
    
  // Default Space SQL
  const defaultSpaceSql = `SELECT s.id FROM public.spaces s 
         JOIN public.space_members sm ON sm.space_id = s.id AND sm.user_id::text = $1
         WHERE s.is_default = true AND s.deleted_at IS NULL
         ORDER BY s.created_at DESC LIMIT 1`;


  console.log('--- Testing listSql ---');
  try {
    const { rows } = await query(listSql, params);
    console.log('Success! Found rows:', rows.length);
  } catch (error) {
    console.error('listSql failed:', error);
  }

  console.log('--- Testing countSql ---');
  try {
    const { rows } = await query(countSql, params);
    console.log('Success! Count result:', rows[0]);
  } catch (error) {
    console.error('countSql failed:', error);
  }
  
  console.log('--- Testing defaultSpaceSql ---');
   try {
    console.log('Params:', [userId]);
    const { rows } = await query(defaultSpaceSql, [userId]);
    console.log('Success! Default space result:', rows[0]);
  } catch (error) {
    console.error('defaultSpaceSql failed:', error);
  }
}

main().catch(console.error);
