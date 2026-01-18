
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
  console.log('Starting Studio Permissions Verification...');

  try {
    // 1. Setup Test Data
    const email = `test_owner_${Date.now()}@example.com`;
    const userA = await prisma.user.create({ data: { email, password_hash: 'hash', role: 'user' } });
    const userB = await prisma.user.create({ data: { email: `test_member_in_${Date.now()}@example.com`, password_hash: 'hash', role: 'user' } }); // In group
    const userC = await prisma.user.create({ data: { email: `test_member_out_${Date.now()}@example.com`, password_hash: 'hash', role: 'user' } }); // Out of group

    const space = await prisma.space.create({
      data: {
        name: 'Test Space Permissions',
        slug: `test-space-${Date.now()}`,
        created_by: userA.id,
        owner_id: userA.id,
        members: {
          create: [
            { user_id: userA.id, role: 'owner' },
            { user_id: userB.id, role: 'member' },
            { user_id: userC.id, role: 'member' }
          ]
        }
      }
    });

    const group = await prisma.userGroup.create({
      data: {
        name: 'Test Permission Group',
        created_by: userA.id,
        members: {
          create: [{ user_id: userB.id }]
        }
      }
    });

    // 2. Mock Page Data with Permissions
    const pages = [
      { id: 'page1', name: 'Public Page', permissions: null }, // Visible to all
      { id: 'page2', name: 'Group Page', permissions: { groupIds: [group.id] } }, // Visible to User B
      { id: 'page3', name: 'User Page', permissions: { userIds: [userC.id] } } // Visible to User C
    ];

    console.log('Test Data Created.');

    // 3. Simulate Filtering Logic for User B (In Group)
    console.log('\n--- Testing User B (In Group) ---');
    const userBGroups = await prisma.userGroup.findMany({
      where: { members: { some: { user_id: userB.id } } },
      select: { id: true }
    });
    const userBGroupIds = userBGroups.map(g => g.id);
    
    const visiblePagesB = pages.filter(page => {
      const perms = page.permissions;
      if (!perms) return true;
      const hasGroup = perms.groupIds?.some(gid => userBGroupIds.includes(gid));
      const hasUser = perms.userIds?.includes(userB.id);
      return hasGroup || hasUser;
    });

    console.log('User B should see Page 1 and Page 2.');
    console.log('Visible Pages:', visiblePagesB.map(p => p.name).join(', '));
    if (visiblePagesB.find(p => p.id === 'page2') && !visiblePagesB.find(p => p.id === 'page3')) {
      console.log('PASS: User B sees correct pages.');
    } else {
      console.error('FAIL: User B visibility incorrect.');
    }

    // 4. Simulate Filtering Logic for User C (Out of Group, explicit User Permission)
    console.log('\n--- Testing User C (Out of Group, Has User Perm) ---');
    const userCGroups = await prisma.userGroup.findMany({
      where: { members: { some: { user_id: userC.id } } },
      select: { id: true }
    });
    const userCGroupIds = userCGroups.map(g => g.id);

    const visiblePagesC = pages.filter(page => {
      const perms = page.permissions;
      if (!perms) return true;
      const hasGroup = perms.groupIds?.some(gid => userCGroupIds.includes(gid));
      const hasUser = perms.userIds?.includes(userC.id);
      return hasGroup || hasUser;
    });

    console.log('User C should see Page 1 and Page 3.');
    console.log('Visible Pages:', visiblePagesC.map(p => p.name).join(', '));
    if (visiblePagesC.find(p => p.id === 'page3') && !visiblePagesC.find(p => p.id === 'page2')) {
      console.log('PASS: User C sees correct pages.');
    } else {
      console.error('FAIL: User C visibility incorrect.');
    }

    // Cleanup
    await prisma.space.delete({ where: { id: space.id } });
    await prisma.userGroup.delete({ where: { id: group.id } });
    await prisma.user.delete({ where: { id: userA.id } });
    await prisma.user.delete({ where: { id: userB.id } });
    await prisma.user.delete({ where: { id: userC.id } });

  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
