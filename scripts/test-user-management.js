const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testUserManagement() {
  console.log('🧪 Testing User Management API Endpoints...\n')

  try {
    // Test 1: Get all users with space associations
    console.log('1. Testing GET /api/users/all-with-spaces')
    const usersResponse = await fetch('http://localhost:3000/api/users/all-with-spaces?limit=5')
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json()
      console.log('✅ Users endpoint working')
      console.log(`   Found ${usersData.users?.length || 0} users`)
      console.log(`   Total: ${usersData.pagination?.total || 0}`)
      
      if (usersData.users?.length > 0) {
        const firstUser = usersData.users[0]
        console.log(`   First user: ${firstUser.name} (${firstUser.email})`)
        console.log(`   Space associations: ${firstUser.spaces?.length || 0}`)
      }
    } else {
      console.log('❌ Users endpoint failed:', usersResponse.status)
    }

    // Test 2: Get spaces
    console.log('\n2. Testing GET /api/spaces')
    const spacesResponse = await fetch('http://localhost:3000/api/spaces')
    
    if (spacesResponse.ok) {
      const spacesData = await spacesResponse.json()
      console.log('✅ Spaces endpoint working')
      console.log(`   Found ${spacesData.spaces?.length || 0} spaces`)
    } else {
      console.log('❌ Spaces endpoint failed:', spacesResponse.status)
    }

    // Test 3: Test database connection
    console.log('\n3. Testing database connection')
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, is_active')
      .limit(3)

    if (error) {
      console.log('❌ Database connection failed:', error.message)
    } else {
      console.log('✅ Database connection working')
      console.log(`   Found ${users?.length || 0} users in database`)
    }

    // Test 4: Test space members table
    console.log('\n4. Testing space members table')
    const { data: spaceMembers, error: membersError } = await supabase
      .from('space_members')
      .select(`
        id,
        role,
        created_at,
        spaces!inner(name, description, is_default),
        users!inner(name, email)
      `)
      .limit(3)

    if (membersError) {
      console.log('❌ Space members query failed:', membersError.message)
    } else {
      console.log('✅ Space members table accessible')
      console.log(`   Found ${spaceMembers?.length || 0} space memberships`)
      
      if (spaceMembers?.length > 0) {
        const firstMember = spaceMembers[0]
        console.log(`   Example: ${firstMember.users?.name} is ${firstMember.role} in ${firstMember.spaces?.name}`)
      }
    }

    console.log('\n🎉 User Management API testing completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testUserManagement()
