const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createDefaultSpace() {
  try {
    console.log('Creating default space...')

    // First, check if a default space already exists
    const { data: existingSpaces, error: checkError } = await supabase
      .from('spaces')
      .select('*')
      .eq('is_default', true)
      .eq('deleted_at', null)

    if (checkError) {
      console.error('Error checking existing spaces:', checkError)
      return
    }

    if (existingSpaces && existingSpaces.length > 0) {
      console.log('Default space already exists:', existingSpaces[0].name)
      return
    }

    // Get the first admin user to be the creator
    const { data: adminUsers, error: userError } = await supabase
      .from('users')
      .select('*')
      .in('role', ['SUPER_ADMIN', 'ADMIN'])
      .eq('is_active', true)
      .limit(1)

    if (userError) {
      console.error('Error fetching admin users:', userError)
      return
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.error('No admin users found. Please create an admin user first.')
      return
    }

    const adminUser = adminUsers[0]

    // Create the default space
    const { data: newSpace, error: createError } = await supabase
      .from('spaces')
      .insert({
        name: 'Default Space',
        description: 'The default workspace for organizing your data',
        is_default: true,
        is_active: true,
        created_by: adminUser.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating default space:', createError)
      return
    }

    console.log('Default space created successfully:', newSpace.name)
    console.log('Space ID:', newSpace.id)
    console.log('Created by:', adminUser.name || adminUser.email)

    // The trigger should automatically add the creator as owner, but let's verify
    const { data: members, error: memberError } = await supabase
      .from('space_members')
      .select('*')
      .eq('space_id', newSpace.id)

    if (memberError) {
      console.error('Error checking space members:', memberError)
    } else {
      console.log('Space members:', members)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the script
createDefaultSpace()
