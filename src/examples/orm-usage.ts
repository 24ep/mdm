// Example usage of the ORM system
import { 
  UserORM, 
  SpaceORM, 
  DataModelORM, 
  AttributeORM, 
  DataRecordORM, 
  NotificationORM,
  SystemSettingsORM 
} from '@/lib/orm'

// User Operations
export async function userExamples() {
  // Find user by email
  const user = await UserORM.findByEmail('admin@example.com')
  console.log('User found:', user)

  // Create new user
  const newUser = await UserORM.create({
    email: 'newuser@example.com',
    name: 'New User',
    password: 'hashedpassword',
    role: 'USER'
  })
  console.log('User created:', newUser)

  // Update user
  await UserORM.update(newUser.id, { name: 'Updated Name' })

  // Delete user
  await UserORM.delete(newUser.id)
}

// Space Operations
export async function spaceExamples() {
  // Get all spaces
  const spaces = await SpaceORM.findAll()
  console.log('All spaces:', spaces)

  // Get user spaces
  const userSpaces = await SpaceORM.findUserSpaces('user-id')
  console.log('User spaces:', userSpaces)

  // Create new space
  const newSpace = await SpaceORM.create({
    name: 'New Space',
    description: 'A new workspace',
    slug: 'new-space',
    isDefault: false,
    createdBy: 'user-id',
    features: {
      assignments: true,
      bulk_activity: true,
      workflows: true,
      dashboard: true
    }
  })
  console.log('Space created:', newSpace)

  // Add member to space
  await SpaceORM.addMember(newSpace.id, 'member-user-id', 'MEMBER')

  // Update space
  await SpaceORM.update(newSpace.id, { 
    name: 'Updated Space Name',
    features: { assignments: false }
  })

  // Delete space (soft delete)
  await SpaceORM.delete(newSpace.id)
}

// Data Model Operations
export async function dataModelExamples() {
  // Get all data models
  const dataModels = await DataModelORM.findAll()
  console.log('All data models:', dataModels)

  // Get data models for a space
  const spaceDataModels = await DataModelORM.findBySpace('space-id')
  console.log('Space data models:', spaceDataModels)

  // Create new data model
  const newDataModel = await DataModelORM.create({
    name: 'Customer Data',
    description: 'Customer information model',
    createdBy: 'user-id',
    sortOrder: 1
  })
  console.log('Data model created:', newDataModel)

  // Link data model to space
  await DataModelORM.linkToSpace(newDataModel.id, 'space-id')

  // Update data model
  await DataModelORM.update(newDataModel.id, { 
    name: 'Updated Customer Data',
    sortOrder: 2
  })

  // Delete data model (soft delete)
  await DataModelORM.delete(newDataModel.id)
}

// Attribute Operations
export async function attributeExamples() {
  // Get attributes for a data model
  const attributes = await AttributeORM.findByDataModel('data-model-id')
  console.log('Data model attributes:', attributes)

  // Create new attribute
  const newAttribute = await AttributeORM.create({
    name: 'Email Address',
    type: 'email',
    description: 'Customer email address',
    dataModelId: 'data-model-id'
  })
  console.log('Attribute created:', newAttribute)

  // Update attribute
  await AttributeORM.update(newAttribute.id, { 
    name: 'Primary Email',
    type: 'text'
  })

  // Delete attribute
  await AttributeORM.delete(newAttribute.id)
}

// Data Record Operations
export async function dataRecordExamples() {
  // Get data records for a data model
  const records = await DataRecordORM.findByDataModel('data-model-id')
  console.log('Data records:', records)

  // Create new data record with values
  const newRecord = await DataRecordORM.create({
    dataModelId: 'data-model-id',
    createdBy: 'user-id',
    values: [
      { attributeId: 'attr-1', value: 'John Doe' },
      { attributeId: 'attr-2', value: 'john@example.com' },
      { attributeId: 'attr-3', value: 'TechCorp' }
    ]
  })
  console.log('Data record created:', newRecord)

  // Update data record
  await DataRecordORM.update(newRecord.id, { 
    // Update record metadata
  })

  // Delete data record (soft delete)
  await DataRecordORM.delete(newRecord.id)
}

// Notification Operations
export async function notificationExamples() {
  // Get user notifications
  const notifications = await NotificationORM.findByUser('user-id', {
    status: 'UNREAD',
    limit: 10,
    offset: 0
  })
  console.log('User notifications:', notifications)

  // Create new notification
  const newNotification = await NotificationORM.create({
    userId: 'user-id',
    type: 'INFO',
    title: 'New Data Record',
    message: 'A new customer record has been created',
    priority: 'MEDIUM',
    actionUrl: '/customers/123',
    actionLabel: 'View Record'
  })
  console.log('Notification created:', newNotification)

  // Mark notification as read
  await NotificationORM.markAsRead(newNotification.id)

  // Mark all notifications as read
  await NotificationORM.markAllAsRead('user-id')

  // Delete notification
  await NotificationORM.delete(newNotification.id)
}

// System Settings Operations
export async function systemSettingsExamples() {
  // Get all settings
  const allSettings = await SystemSettingsORM.getAll()
  console.log('All settings:', allSettings)

  // Get specific setting
  const appName = await SystemSettingsORM.get('app_name')
  console.log('App name:', appName)

  // Set single setting
  await SystemSettingsORM.set('app_name', 'Customer Data Management')

  // Set multiple settings
  await SystemSettingsORM.setMultiple({
    'app_name': 'Customer Data Management',
    'app_version': '1.0.0',
    'maintenance_mode': 'false'
  })
}

// Complex Query Examples
export async function complexQueryExamples() {
  // Get space with all related data
  const space = await SpaceORM.findBySlug('customer-data')
  if (space) {
    console.log('Space with members:', space.members)
    console.log('Space with data models:', space.dataModels)
  }

  // Get data model with all attributes and records
  const dataModels = await DataModelORM.findBySpace('space-id')
  for (const dataModel of dataModels) {
    console.log(`Data model: ${dataModel.name}`)
    console.log(`  Attributes: ${dataModel.attributes.length}`)
    console.log(`  Records: ${dataModel.dataRecords.length}`)
  }

  // Get user with all spaces
  const user = await UserORM.findByEmail('admin@example.com')
  if (user) {
    console.log('User spaces:', user.spaceMemberships.map(m => m.space))
  }
}

// Error Handling Examples
export async function errorHandlingExamples() {
  try {
    // This will throw an error if user doesn't exist
    const user = await UserORM.findByEmail('nonexistent@example.com')
    if (!user) {
      console.log('User not found')
    }
  } catch (error) {
    console.error('Error finding user:', error)
  }

  try {
    // This will throw an error if space doesn't exist
    const space = await SpaceORM.findBySlug('nonexistent-space')
    if (!space) {
      console.log('Space not found')
    }
  } catch (error) {
    console.error('Error finding space:', error)
  }
}

// Transaction Examples
export async function transactionExamples() {
  // Create space and add member in a transaction
  const { prisma } = await import('@/lib/prisma')
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create space
      const space = await tx.space.create({
        data: {
          name: 'Transaction Space',
          description: 'Created in transaction',
          slug: 'transaction-space',
          createdBy: 'user-id'
        }
      })

      // Add member
      const member = await tx.spaceMember.create({
        data: {
          spaceId: space.id,
          userId: 'user-id',
          role: 'ADMIN'
        }
      })

      return { space, member }
    })

    console.log('Transaction completed:', result)
  } catch (error) {
    console.error('Transaction failed:', error)
  }
}
