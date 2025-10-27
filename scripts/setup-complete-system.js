const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

if (!process.env.DATABASE_URL) {
  console.error('Missing required DATABASE_URL environment variable')
  process.exit(1)
}

async function createCompleteSystemSetup() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Starting complete system setup...')
    console.log('=' .repeat(60))

    // Step 1: Create Admin User
    console.log('\n👤 Step 1: Creating admin user...')
    
    const adminEmail = 'admin@example.com'
    const adminPassword = 'admin123'
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Check if admin user already exists
    const existingUserResult = await client.query(`
      SELECT * FROM public.users WHERE email = $1
    `, [adminEmail])

    let adminUser
    if (existingUserResult.rows.length > 0) {
      adminUser = existingUserResult.rows[0]
      console.log(`  ⏭️  Admin user already exists: ${adminUser.email}`)
    } else {
      const userResult = await client.query(`
        INSERT INTO public.users (email, name, password, role, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `, [adminEmail, 'Admin User', hashedPassword, 'ADMIN', true])

      adminUser = userResult.rows[0]
      console.log(`  ✅ Created admin user: ${adminUser.email}`)
      console.log(`  🔑 Login credentials: ${adminEmail} / ${adminPassword}`)
    }

    // Step 2: Create Customer Data Space
    console.log('\n📁 Step 2: Creating Customer Data space...')
    
    let customerSpace
    const spaceCheckResult = await client.query(`
      SELECT * FROM public.spaces 
      WHERE slug = 'customer-data' OR name = 'Customer Data'
    `)

    if (spaceCheckResult.rows.length > 0) {
      customerSpace = spaceCheckResult.rows[0]
      console.log(`  ⏭️  Customer Data space already exists: ${customerSpace.name}`)
    } else {
      const spaceResult = await client.query(`
        INSERT INTO public.spaces (id, name, slug, description, is_default, is_active, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `, [
        uuidv4(),
        'Customer Data',
        'customer-data',
        'Comprehensive customer and business data management workspace',
        false,
        true,
        adminUser.id
      ])

      customerSpace = spaceResult.rows[0]
      console.log(`  ✅ Created Customer Data space: ${customerSpace.name} (ID: ${customerSpace.id})`)
    }

    // Step 3: Create Comprehensive Data Models
    console.log('\n📋 Step 3: Creating comprehensive data models...')
    
    const dataModels = [
      {
        name: 'customer',
        display_name: 'Customer',
        description: 'Customer information and contact details',
        attributes: [
          // Basic Information
          { name: 'first_name', display_name: 'First Name', type: 'TEXT', required: true, order: 1, validation_rules: { minLength: 2, maxLength: 50 } },
          { name: 'last_name', display_name: 'Last Name', type: 'TEXT', required: true, order: 2, validation_rules: { minLength: 2, maxLength: 50 } },
          { name: 'email', display_name: 'Email Address', type: 'EMAIL', required: true, unique: true, order: 3 },
          { name: 'phone', display_name: 'Phone Number', type: 'PHONE', order: 4 },
          { name: 'company', display_name: 'Company', type: 'TEXT', order: 5 },
          
          // Demographics
          { name: 'age', display_name: 'Age', type: 'NUMBER', order: 6, validation_rules: { min: 18, max: 120 } },
          { name: 'gender', display_name: 'Gender', type: 'SELECT', order: 7, options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
          { name: 'birth_date', display_name: 'Birth Date', type: 'DATE', order: 8 },
          
          // Address Information
          { name: 'address', display_name: 'Address', type: 'TEXTAREA', order: 9 },
          { name: 'city', display_name: 'City', type: 'TEXT', order: 10 },
          { name: 'state', display_name: 'State/Province', type: 'TEXT', order: 11 },
          { name: 'postal_code', display_name: 'Postal Code', type: 'TEXT', order: 12 },
          { name: 'country', display_name: 'Country', type: 'SELECT', order: 13, options: ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 'Japan', 'Other'] },
          
          // Customer Status
          { name: 'customer_type', display_name: 'Customer Type', type: 'SELECT', order: 14, options: ['Individual', 'Business', 'VIP', 'Premium', 'Enterprise'] },
          { name: 'status', display_name: 'Status', type: 'SELECT', order: 15, options: ['Active', 'Inactive', 'Suspended', 'Prospect', 'Churned'] },
          { name: 'is_vip', display_name: 'VIP Customer', type: 'BOOLEAN', order: 16, default_value: false },
          { name: 'registration_date', display_name: 'Registration Date', type: 'DATE', order: 17 },
          
          // Communication Preferences
          { name: 'preferred_contact', display_name: 'Preferred Contact Method', type: 'SELECT', order: 18, options: ['Email', 'Phone', 'SMS', 'Mail', 'WhatsApp'] },
          { name: 'newsletter_subscribed', display_name: 'Newsletter Subscribed', type: 'BOOLEAN', order: 19, default_value: false },
          { name: 'marketing_consent', display_name: 'Marketing Consent', type: 'BOOLEAN', order: 20, default_value: false },
          
          // Additional Information
          { name: 'notes', display_name: 'Notes', type: 'TEXTAREA', order: 21 },
          { name: 'website', display_name: 'Website', type: 'URL', order: 22 },
          { name: 'annual_income', display_name: 'Annual Income', type: 'NUMBER', order: 23, validation_rules: { min: 0, max: 10000000 } },
          { name: 'credit_score', display_name: 'Credit Score', type: 'NUMBER', order: 24, validation_rules: { min: 300, max: 850 } },
          { name: 'last_login', display_name: 'Last Login', type: 'DATE', order: 25 },
          { name: 'interests', display_name: 'Interests', type: 'MULTI_SELECT', order: 26, options: ['Technology', 'Sports', 'Music', 'Travel', 'Food', 'Fashion', 'Books', 'Movies', 'Gaming', 'Fitness'] }
        ],
        sampleData: [
          {
            first_name: 'John', last_name: 'Smith', email: 'john.smith@email.com', phone: '+1-555-0123',
            company: 'Tech Solutions Inc', age: 35, gender: 'Male', birth_date: '1988-05-15',
            address: '123 Main Street\nApt 4B', city: 'New York', state: 'NY', postal_code: '10001',
            country: 'United States', customer_type: 'Premium', status: 'Active', is_vip: true,
            registration_date: '2023-01-15', preferred_contact: 'Email', newsletter_subscribed: true,
            marketing_consent: true, website: 'https://techsolutions.com', annual_income: 85000,
            credit_score: 750, last_login: '2024-01-10', interests: ['Technology', 'Sports', 'Music']
          },
          {
            first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.j@email.com', phone: '+1-555-0456',
            company: 'Marketing Pro', age: 28, gender: 'Female', birth_date: '1995-08-22',
            address: '456 Oak Avenue', city: 'Los Angeles', state: 'CA', postal_code: '90210',
            country: 'United States', customer_type: 'Business', status: 'Active', is_vip: false,
            registration_date: '2023-03-20', preferred_contact: 'Phone', newsletter_subscribed: false,
            marketing_consent: true, website: 'https://marketingpro.com', annual_income: 65000,
            credit_score: 720, last_login: '2024-01-08', interests: ['Marketing', 'Travel', 'Food']
          },
          {
            first_name: 'Michael', last_name: 'Brown', email: 'mike.brown@email.com', phone: '+1-555-0789',
            company: 'Brown Enterprises', age: 42, gender: 'Male', birth_date: '1981-12-03',
            address: '789 Pine Street', city: 'Chicago', state: 'IL', postal_code: '60601',
            country: 'United States', customer_type: 'Enterprise', status: 'Active', is_vip: true,
            registration_date: '2022-11-10', preferred_contact: 'Email', newsletter_subscribed: true,
            marketing_consent: true, website: 'https://brownenterprises.com', annual_income: 120000,
            credit_score: 780, last_login: '2024-01-12', interests: ['Business', 'Technology', 'Fitness']
          }
        ]
      },
      {
        name: 'product',
        display_name: 'Product',
        description: 'Product catalog and inventory management',
        attributes: [
          { name: 'name', display_name: 'Product Name', type: 'TEXT', required: true, order: 1 },
          { name: 'sku', display_name: 'SKU', type: 'TEXT', required: true, unique: true, order: 2 },
          { name: 'description', display_name: 'Description', type: 'TEXTAREA', order: 3 },
          { name: 'category', display_name: 'Category', type: 'SELECT', order: 4, options: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Beauty', 'Automotive', 'Food & Beverage'] },
          { name: 'brand', display_name: 'Brand', type: 'TEXT', order: 5 },
          { name: 'price', display_name: 'Price', type: 'NUMBER', required: true, order: 6, validation_rules: { min: 0 } },
          { name: 'cost', display_name: 'Cost', type: 'NUMBER', order: 7, validation_rules: { min: 0 } },
          { name: 'quantity_in_stock', display_name: 'Quantity in Stock', type: 'NUMBER', order: 8, validation_rules: { min: 0 } },
          { name: 'weight', display_name: 'Weight (kg)', type: 'NUMBER', order: 9, validation_rules: { min: 0 } },
          { name: 'dimensions', display_name: 'Dimensions', type: 'TEXT', order: 10 },
          { name: 'color', display_name: 'Color', type: 'SELECT', order: 11, options: ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Purple', 'Orange', 'Pink', 'Gray'] },
          { name: 'size', display_name: 'Size', type: 'SELECT', order: 12, options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'] },
          { name: 'material', display_name: 'Material', type: 'TEXT', order: 13 },
          { name: 'warranty_period', display_name: 'Warranty Period (months)', type: 'NUMBER', order: 14 },
          { name: 'is_active', display_name: 'Active', type: 'BOOLEAN', order: 15, default_value: true },
          { name: 'is_featured', display_name: 'Featured', type: 'BOOLEAN', order: 16, default_value: false },
          { name: 'launch_date', display_name: 'Launch Date', type: 'DATE', order: 17 },
          { name: 'discontinued_date', display_name: 'Discontinued Date', type: 'DATE', order: 18 },
          { name: 'tags', display_name: 'Tags', type: 'MULTI_SELECT', order: 19, options: ['New', 'Sale', 'Popular', 'Limited Edition', 'Eco-Friendly', 'Premium', 'Budget', 'Trending'] },
          { name: 'image_url', display_name: 'Image URL', type: 'URL', order: 20 }
        ],
        sampleData: [
          {
            name: 'Wireless Bluetooth Headphones', sku: 'WBH-001', description: 'High-quality wireless headphones with noise cancellation',
            category: 'Electronics', brand: 'TechSound', price: 199.99, cost: 120.00, quantity_in_stock: 50,
            weight: 0.3, dimensions: '20x15x8 cm', color: 'Black', size: 'One Size', material: 'Plastic, Metal',
            warranty_period: 24, is_active: true, is_featured: true, launch_date: '2023-06-01',
            tags: ['New', 'Popular', 'Premium'], image_url: 'https://example.com/headphones.jpg'
          },
          {
            name: 'Cotton T-Shirt', sku: 'CTS-002', description: 'Comfortable 100% cotton t-shirt',
            category: 'Clothing', brand: 'ComfortWear', price: 29.99, cost: 15.00, quantity_in_stock: 100,
            weight: 0.2, dimensions: 'S: 70x50 cm', color: 'Blue', size: 'M', material: '100% Cotton',
            warranty_period: 0, is_active: true, is_featured: false, launch_date: '2023-01-15',
            tags: ['Popular', 'Eco-Friendly'], image_url: 'https://example.com/tshirt.jpg'
          },
          {
            name: 'Programming Book', sku: 'PBK-003', description: 'Complete guide to modern web development',
            category: 'Books', brand: 'TechPress', price: 49.99, cost: 25.00, quantity_in_stock: 25,
            weight: 0.8, dimensions: '23x15x3 cm', color: 'Blue', size: 'One Size', material: 'Paper',
            warranty_period: 0, is_active: true, is_featured: true, launch_date: '2023-09-01',
            tags: ['New', 'Trending', 'Premium'], image_url: 'https://example.com/book.jpg'
          }
        ]
      },
      {
        name: 'order',
        display_name: 'Order',
        description: 'Customer orders and transactions',
        attributes: [
          { name: 'order_number', display_name: 'Order Number', type: 'TEXT', required: true, unique: true, order: 1 },
          { name: 'customer_id', display_name: 'Customer ID', type: 'TEXT', required: true, order: 2 },
          { name: 'order_date', display_name: 'Order Date', type: 'DATE', required: true, order: 3 },
          { name: 'status', display_name: 'Status', type: 'SELECT', required: true, order: 4, options: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'] },
          { name: 'total_amount', display_name: 'Total Amount', type: 'NUMBER', required: true, order: 5, validation_rules: { min: 0 } },
          { name: 'tax_amount', display_name: 'Tax Amount', type: 'NUMBER', order: 6, validation_rules: { min: 0 } },
          { name: 'shipping_cost', display_name: 'Shipping Cost', type: 'NUMBER', order: 7, validation_rules: { min: 0 } },
          { name: 'discount_amount', display_name: 'Discount Amount', type: 'NUMBER', order: 8, validation_rules: { min: 0 } },
          { name: 'payment_method', display_name: 'Payment Method', type: 'SELECT', order: 9, options: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Cash', 'Cryptocurrency'] },
          { name: 'payment_status', display_name: 'Payment Status', type: 'SELECT', order: 10, options: ['Pending', 'Paid', 'Failed', 'Refunded', 'Partially Refunded'] },
          { name: 'shipping_address', display_name: 'Shipping Address', type: 'TEXTAREA', order: 11 },
          { name: 'billing_address', display_name: 'Billing Address', type: 'TEXTAREA', order: 12 },
          { name: 'notes', display_name: 'Order Notes', type: 'TEXTAREA', order: 13 },
          { name: 'shipped_date', display_name: 'Shipped Date', type: 'DATE', order: 14 },
          { name: 'delivered_date', display_name: 'Delivered Date', type: 'DATE', order: 15 },
          { name: 'tracking_number', display_name: 'Tracking Number', type: 'TEXT', order: 16 },
          { name: 'priority', display_name: 'Priority', type: 'SELECT', order: 17, options: ['Low', 'Normal', 'High', 'Urgent'] },
          { name: 'is_gift', display_name: 'Is Gift', type: 'BOOLEAN', order: 18, default_value: false },
          { name: 'gift_message', display_name: 'Gift Message', type: 'TEXTAREA', order: 19 }
        ],
        sampleData: [
          {
            order_number: 'ORD-001', customer_id: 'CUST-001', order_date: '2024-01-15', status: 'Delivered',
            total_amount: 229.98, tax_amount: 18.40, shipping_cost: 9.99, discount_amount: 10.00,
            payment_method: 'Credit Card', payment_status: 'Paid', 
            shipping_address: '123 Main Street\nApt 4B\nNew York, NY 10001',
            billing_address: '123 Main Street\nApt 4B\nNew York, NY 10001',
            notes: 'Please deliver after 5 PM', shipped_date: '2024-01-16', delivered_date: '2024-01-18',
            tracking_number: 'TRK123456789', priority: 'Normal', is_gift: false
          },
          {
            order_number: 'ORD-002', customer_id: 'CUST-002', order_date: '2024-01-20', status: 'Shipped',
            total_amount: 59.98, tax_amount: 4.80, shipping_cost: 5.99, discount_amount: 0.00,
            payment_method: 'PayPal', payment_status: 'Paid',
            shipping_address: '456 Oak Avenue\nLos Angeles, CA 90210',
            billing_address: '456 Oak Avenue\nLos Angeles, CA 90210',
            notes: 'Gift wrapping requested', shipped_date: '2024-01-21', delivered_date: null,
            tracking_number: 'TRK987654321', priority: 'High', is_gift: true,
            gift_message: 'Happy Birthday! Hope you love this gift!'
          }
        ]
      },
      {
        name: 'user',
        display_name: 'User',
        description: 'System users and their profiles',
        attributes: [
          { name: 'username', display_name: 'Username', type: 'TEXT', required: true, unique: true, order: 1 },
          { name: 'email', display_name: 'Email', type: 'EMAIL', required: true, unique: true, order: 2 },
          { name: 'first_name', display_name: 'First Name', type: 'TEXT', required: true, order: 3 },
          { name: 'last_name', display_name: 'Last Name', type: 'TEXT', required: true, order: 4 },
          { name: 'role', display_name: 'Role', type: 'SELECT', required: true, order: 5, options: ['Admin', 'Manager', 'Analyst', 'Viewer', 'Developer', 'Data Scientist'] },
          { name: 'department', display_name: 'Department', type: 'SELECT', order: 6, options: ['IT', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations', 'Analytics'] },
          { name: 'status', display_name: 'Status', type: 'SELECT', order: 7, options: ['Active', 'Inactive', 'Suspended', 'Pending'] },
          { name: 'last_login', display_name: 'Last Login', type: 'DATE', order: 8 },
          { name: 'created_date', display_name: 'Created Date', type: 'DATE', order: 9 },
          { name: 'permissions', display_name: 'Permissions', type: 'MULTI_SELECT', order: 10, options: ['Read', 'Write', 'Delete', 'Admin', 'Export', 'Import', 'Query', 'Dashboard'] },
          { name: 'timezone', display_name: 'Timezone', type: 'SELECT', order: 11, options: ['UTC', 'EST', 'PST', 'CST', 'MST', 'GMT', 'CET', 'JST'] },
          { name: 'language', display_name: 'Language', type: 'SELECT', order: 12, options: ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean'] },
          { name: 'avatar_url', display_name: 'Avatar URL', type: 'URL', order: 13 },
          { name: 'phone', display_name: 'Phone', type: 'PHONE', order: 14 },
          { name: 'bio', display_name: 'Bio', type: 'TEXTAREA', order: 15 },
          { name: 'is_verified', display_name: 'Verified', type: 'BOOLEAN', order: 16, default_value: false },
          { name: 'two_factor_enabled', display_name: '2FA Enabled', type: 'BOOLEAN', order: 17, default_value: false },
          { name: 'preferred_theme', display_name: 'Preferred Theme', type: 'SELECT', order: 18, options: ['Light', 'Dark', 'Auto'] },
          { name: 'notification_preferences', display_name: 'Notification Preferences', type: 'JSON', order: 19 },
          { name: 'api_access', display_name: 'API Access', type: 'BOOLEAN', order: 20, default_value: false }
        ],
        sampleData: [
          {
            username: 'admin_user', email: 'admin@company.com', first_name: 'Admin', last_name: 'User',
            role: 'Admin', department: 'IT', status: 'Active', last_login: '2024-01-15',
            created_date: '2023-01-01', permissions: ['Read', 'Write', 'Delete', 'Admin', 'Export', 'Import', 'Query', 'Dashboard'],
            timezone: 'EST', language: 'English', avatar_url: 'https://example.com/avatars/admin.jpg',
            phone: '+1-555-0001', bio: 'System administrator with full access rights',
            is_verified: true, two_factor_enabled: true, preferred_theme: 'Dark',
            notification_preferences: '{"email": true, "sms": false, "push": true}',
            api_access: true
          },
          {
            username: 'data_analyst', email: 'analyst@company.com', first_name: 'Sarah', last_name: 'Johnson',
            role: 'Data Scientist', department: 'Analytics', status: 'Active', last_login: '2024-01-14',
            created_date: '2023-03-15', permissions: ['Read', 'Query', 'Dashboard', 'Export'],
            timezone: 'PST', language: 'English', avatar_url: 'https://example.com/avatars/sarah.jpg',
            phone: '+1-555-0002', bio: 'Senior data scientist specializing in machine learning',
            is_verified: true, two_factor_enabled: false, preferred_theme: 'Light',
            notification_preferences: '{"email": true, "sms": true, "push": true}',
            api_access: true
          },
          {
            username: 'marketing_manager', email: 'marketing@company.com', first_name: 'Mike', last_name: 'Chen',
            role: 'Manager', department: 'Marketing', status: 'Active', last_login: '2024-01-13',
            created_date: '2023-02-20', permissions: ['Read', 'Query', 'Dashboard'],
            timezone: 'CST', language: 'English', avatar_url: 'https://example.com/avatars/mike.jpg',
            phone: '+1-555-0003', bio: 'Marketing manager focused on data-driven campaigns',
            is_verified: true, two_factor_enabled: true, preferred_theme: 'Auto',
            notification_preferences: '{"email": true, "sms": false, "push": false}',
            api_access: false
          }
        ]
      },
      {
        name: 'user_group',
        display_name: 'User Group',
        description: 'User groups and access control',
        attributes: [
          { name: 'group_name', display_name: 'Group Name', type: 'TEXT', required: true, unique: true, order: 1 },
          { name: 'description', display_name: 'Description', type: 'TEXTAREA', order: 2 },
          { name: 'group_type', display_name: 'Group Type', type: 'SELECT', required: true, order: 3, options: ['Department', 'Project', 'Role-based', 'Custom', 'System'] },
          { name: 'status', display_name: 'Status', type: 'SELECT', order: 4, options: ['Active', 'Inactive', 'Archived'] },
          { name: 'created_by', display_name: 'Created By', type: 'TEXT', order: 5 },
          { name: 'created_date', display_name: 'Created Date', type: 'DATE', order: 6 },
          { name: 'member_count', display_name: 'Member Count', type: 'NUMBER', order: 7, validation_rules: { min: 0 } },
          { name: 'permissions', display_name: 'Group Permissions', type: 'MULTI_SELECT', order: 8, options: ['Read', 'Write', 'Delete', 'Admin', 'Export', 'Import', 'Query', 'Dashboard', 'Report'] },
          { name: 'data_access_level', display_name: 'Data Access Level', type: 'SELECT', order: 9, options: ['Public', 'Internal', 'Confidential', 'Restricted'] },
          { name: 'auto_join', display_name: 'Auto Join', type: 'BOOLEAN', order: 10, default_value: false },
          { name: 'approval_required', display_name: 'Approval Required', type: 'BOOLEAN', order: 11, default_value: true },
          { name: 'max_members', display_name: 'Max Members', type: 'NUMBER', order: 12, validation_rules: { min: 1, max: 1000 } },
          { name: 'tags', display_name: 'Tags', type: 'MULTI_SELECT', order: 13, options: ['Analytics', 'Marketing', 'Sales', 'Finance', 'IT', 'Management', 'Temporary', 'Permanent'] },
          { name: 'expiry_date', display_name: 'Expiry Date', type: 'DATE', order: 14 },
          { name: 'notification_settings', display_name: 'Notification Settings', type: 'JSON', order: 15 },
          { name: 'is_system_group', display_name: 'System Group', type: 'BOOLEAN', order: 16, default_value: false },
          { name: 'parent_group_id', display_name: 'Parent Group ID', type: 'TEXT', order: 17 },
          { name: 'group_hierarchy_level', display_name: 'Hierarchy Level', type: 'NUMBER', order: 18, validation_rules: { min: 0, max: 10 } }
        ],
        sampleData: [
          {
            group_name: 'Data Analytics Team', description: 'Core team responsible for data analysis and reporting',
            group_type: 'Department', status: 'Active', created_by: 'admin_user', created_date: '2023-01-01',
            member_count: 8, permissions: ['Read', 'Query', 'Dashboard', 'Export', 'Report'],
            data_access_level: 'Internal', auto_join: false, approval_required: true, max_members: 20,
            tags: ['Analytics', 'Permanent'], expiry_date: null,
            notification_settings: '{"email": true, "weekly_digest": true, "alerts": true}',
            is_system_group: false, parent_group_id: null, group_hierarchy_level: 0
          },
          {
            group_name: 'Marketing Managers', description: 'Senior marketing team members',
            group_type: 'Role-based', status: 'Active', created_by: 'admin_user', created_date: '2023-02-01',
            member_count: 5, permissions: ['Read', 'Query', 'Dashboard', 'Export'],
            data_access_level: 'Confidential', auto_join: false, approval_required: true, max_members: 10,
            tags: ['Marketing', 'Management', 'Permanent'], expiry_date: null,
            notification_settings: '{"email": true, "daily_digest": true, "alerts": true}',
            is_system_group: false, parent_group_id: null, group_hierarchy_level: 0
          },
          {
            group_name: 'Q1 Campaign Team', description: 'Temporary team for Q1 marketing campaign',
            group_type: 'Project', status: 'Active', created_by: 'marketing_manager', created_date: '2024-01-01',
            member_count: 12, permissions: ['Read', 'Query', 'Dashboard'],
            data_access_level: 'Internal', auto_join: true, approval_required: false, max_members: 15,
            tags: ['Marketing', 'Temporary'], expiry_date: '2024-03-31',
            notification_settings: '{"email": true, "weekly_digest": false, "alerts": true}',
            is_system_group: false, parent_group_id: null, group_hierarchy_level: 1
          }
        ]
      },
      {
        name: 'saved_query',
        display_name: 'Saved Query',
        description: 'Saved queries for BigQuery interface',
        attributes: [
          { name: 'query_name', display_name: 'Query Name', type: 'TEXT', required: true, order: 1 },
          { name: 'description', display_name: 'Description', type: 'TEXTAREA', order: 2 },
          { name: 'sql_query', display_name: 'SQL Query', type: 'TEXTAREA', required: true, order: 3 },
          { name: 'query_type', display_name: 'Query Type', type: 'SELECT', order: 4, options: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ANALYZE', 'EXPLAIN'] },
          { name: 'category', display_name: 'Category', type: 'SELECT', order: 5, options: ['Analytics', 'Reporting', 'Data Quality', 'Performance', 'Maintenance', 'Custom'] },
          { name: 'created_by', display_name: 'Created By', type: 'TEXT', order: 6 },
          { name: 'created_date', display_name: 'Created Date', type: 'DATE', order: 7 },
          { name: 'last_modified', display_name: 'Last Modified', type: 'DATE', order: 8 },
          { name: 'last_executed', display_name: 'Last Executed', type: 'DATE', order: 9 },
          { name: 'execution_count', display_name: 'Execution Count', type: 'NUMBER', order: 10, validation_rules: { min: 0 } },
          { name: 'average_execution_time', display_name: 'Avg Execution Time (ms)', type: 'NUMBER', order: 11, validation_rules: { min: 0 } },
          { name: 'is_public', display_name: 'Public Query', type: 'BOOLEAN', order: 12, default_value: false },
          { name: 'is_favorite', display_name: 'Favorite', type: 'BOOLEAN', order: 13, default_value: false },
          { name: 'tags', display_name: 'Tags', type: 'MULTI_SELECT', order: 14, options: ['Customer', 'Sales', 'Marketing', 'Finance', 'Performance', 'Debug', 'Production', 'Test'] },
          { name: 'parameters', display_name: 'Parameters', type: 'JSON', order: 15 },
          { name: 'result_format', display_name: 'Result Format', type: 'SELECT', order: 16, options: ['Table', 'Chart', 'JSON', 'CSV', 'Excel'] },
          { name: 'schedule', display_name: 'Schedule', type: 'SELECT', order: 17, options: ['None', 'Daily', 'Weekly', 'Monthly', 'Custom'] },
          { name: 'status', display_name: 'Status', type: 'SELECT', order: 18, options: ['Active', 'Inactive', 'Draft', 'Archived'] },
          { name: 'version', display_name: 'Version', type: 'TEXT', order: 19 },
          { name: 'notes', display_name: 'Notes', type: 'TEXTAREA', order: 20 }
        ],
        sampleData: [
          {
            query_name: 'Customer Revenue Analysis', description: 'Analyze customer revenue by month and region',
            sql_query: `SELECT 
  c.first_name, 
  c.last_name, 
  c.company,
  SUM(o.total_amount) as total_revenue,
  COUNT(o.id) as order_count,
  AVG(o.total_amount) as avg_order_value
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.order_date >= '2023-01-01'
GROUP BY c.id, c.first_name, c.last_name, c.company
ORDER BY total_revenue DESC`,
            query_type: 'SELECT', category: 'Analytics', created_by: 'data_analyst', created_date: '2023-06-01',
            last_modified: '2024-01-10', last_executed: '2024-01-15', execution_count: 25,
            average_execution_time: 1250, is_public: true, is_favorite: true,
            tags: ['Customer', 'Sales', 'Analytics'], parameters: '{"start_date": "2023-01-01", "end_date": "2024-01-01"}',
            result_format: 'Chart', schedule: 'Weekly', status: 'Active', version: '2.1',
            notes: 'Updated to include company field and improved performance'
          },
          {
            query_name: 'Product Performance Report', description: 'Top performing products by sales volume',
            sql_query: `SELECT 
  p.name,
  p.category,
  p.brand,
  SUM(oi.quantity) as total_sold,
  SUM(oi.quantity * oi.price) as total_revenue,
  COUNT(DISTINCT o.id) as unique_orders
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'Delivered'
  AND o.order_date >= '2023-01-01'
GROUP BY p.id, p.name, p.category, p.brand
ORDER BY total_revenue DESC
LIMIT 50`,
            query_type: 'SELECT', category: 'Reporting', created_by: 'marketing_manager', created_date: '2023-08-15',
            last_modified: '2024-01-05', last_executed: '2024-01-12', execution_count: 18,
            average_execution_time: 2100, is_public: false, is_favorite: false,
            tags: ['Marketing', 'Sales', 'Performance'], parameters: '{"year": "2023"}',
            result_format: 'Table', schedule: 'Monthly', status: 'Active', version: '1.3',
            notes: 'Added brand field and limited to top 50 products'
          },
          {
            query_name: 'User Activity Dashboard', description: 'Daily user activity and engagement metrics',
            sql_query: `SELECT 
  DATE(created_date) as date,
  COUNT(*) as new_users,
  COUNT(CASE WHEN last_login >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as active_users_7d,
  COUNT(CASE WHEN last_login >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as active_users_30d,
  AVG(CASE WHEN last_login IS NOT NULL THEN EXTRACT(EPOCH FROM (last_login - created_date))/86400 END) as avg_days_to_first_login
FROM users
WHERE created_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(created_date)
ORDER BY date DESC`,
            query_type: 'SELECT', category: 'Analytics', created_by: 'admin_user', created_date: '2023-12-01',
            last_modified: '2024-01-08', last_executed: '2024-01-14', execution_count: 42,
            average_execution_time: 850, is_public: true, is_favorite: true,
            tags: ['Analytics', 'Performance'], parameters: '{"days": "90"}',
            result_format: 'Chart', schedule: 'Daily', status: 'Active', version: '1.0',
            notes: 'Core dashboard query for user engagement tracking'
          },
          {
            query_name: 'Data Quality Check', description: 'Check for data quality issues in customer records',
            sql_query: `SELECT 
  'Missing Email' as issue_type,
  COUNT(*) as count
FROM customers 
WHERE email IS NULL OR email = ''

UNION ALL

SELECT 
  'Invalid Phone' as issue_type,
  COUNT(*) as count
FROM customers 
WHERE phone IS NOT NULL AND phone !~ '^[+]?[0-9-() ]+$'

UNION ALL

SELECT 
  'Duplicate Emails' as issue_type,
  COUNT(*) - COUNT(DISTINCT email) as count
FROM customers 
WHERE email IS NOT NULL

ORDER BY count DESC`,
            query_type: 'SELECT', category: 'Data Quality', created_by: 'data_analyst', created_date: '2023-09-20',
            last_modified: '2024-01-03', last_executed: '2024-01-11', execution_count: 8,
            average_execution_time: 450, is_public: false, is_favorite: false,
            tags: ['Data Quality', 'Debug'], parameters: '{}',
            result_format: 'Table', schedule: 'Weekly', status: 'Active', version: '1.1',
            notes: 'Regular data quality monitoring query'
          }
        ]
      }
    ]

    // Create data models and their attributes
    for (const modelData of dataModels) {
      console.log(`\n📋 Creating ${modelData.display_name} model...`)

      // Check if model already exists
      const modelCheckResult = await client.query(`
        SELECT dm.* FROM public.data_models dm
        JOIN public.data_model_spaces dms ON dm.id::text = dms.data_model_id
        WHERE dm.name = $1 AND dms.space_id = $2
      `, [modelData.name, customerSpace.id])

      let model
      if (modelCheckResult.rows.length > 0) {
        model = modelCheckResult.rows[0]
        console.log(`  ⏭️  Model already exists: ${modelData.display_name}`)
      } else {
        const modelResult = await client.query(`
          INSERT INTO public.data_models (id, name, description, created_by, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING *
        `, [
          uuidv4(),
          modelData.name,
          modelData.description,
          adminUser.id
        ])

        model = modelResult.rows[0]
        console.log(`  ✅ Created model: ${modelData.display_name} (ID: ${model.id})`)

        // Link the model to the space
        await client.query(`
          INSERT INTO public.data_model_spaces (id, data_model_id, space_id, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
        `, [uuidv4(), model.id.toString(), customerSpace.id.toString()])
      }

      // Create attributes
      console.log(`  📝 Creating ${modelData.attributes.length} attributes...`)
      for (const attr of modelData.attributes) {
        const attrCheckResult = await client.query(`
          SELECT * FROM public.data_model_attributes 
          WHERE name = $1 AND data_model_id = $2
        `, [attr.name, model.id.toString()])

        if (attrCheckResult.rows.length === 0) {
          const attrResult = await client.query(`
            INSERT INTO public.data_model_attributes (
              id, name, display_name, type, is_required, is_unique, "order", 
              validation_rules, options, default_value, data_model_id, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
            RETURNING *
          `, [
            uuidv4(),
            attr.name,
            attr.display_name,
            attr.type,
            attr.required || false,
            attr.unique || false,
            attr.order,
            attr.validation_rules ? JSON.stringify(attr.validation_rules) : null,
            attr.options ? JSON.stringify(attr.options) : null,
            attr.default_value || null,
            model.id.toString()
          ])

          console.log(`    ✅ Created attribute: ${attr.display_name} (${attr.type})`)
        } else {
          console.log(`    ⏭️  Attribute already exists: ${attr.display_name}`)
        }
      }

      // Create sample data records
      if (modelData.sampleData && modelData.sampleData.length > 0) {
        console.log(`  📊 Creating ${modelData.sampleData.length} sample records...`)
        
        for (const recordData of modelData.sampleData) {
          // Create the main record
          const recordResult = await client.query(`
            INSERT INTO public.data_records (id, data_model_id, created_by, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING *
          `, [uuidv4(), model.id, adminUser.id])

          const record = recordResult.rows[0]
          console.log(`    📄 Created record ID: ${record.id}`)

          // Get all attributes for this model
          const attributesResult = await client.query(`
            SELECT * FROM public.data_model_attributes 
            WHERE data_model_id = $1
            ORDER BY "order"
          `, [model.id])

          // Create attribute values
          for (const attr of attributesResult.rows) {
            const value = recordData[attr.name]
            if (value !== undefined && value !== null) {
              let processedValue = value
              
              // Handle different data types
              if (attr.type === 'MULTI_SELECT' && Array.isArray(value)) {
                processedValue = JSON.stringify(value)
              } else if (attr.type === 'BOOLEAN') {
                processedValue = Boolean(value).toString()
              } else if (attr.type === 'NUMBER') {
                processedValue = Number(value).toString()
              } else if (attr.type === 'DATE') {
                processedValue = new Date(value).toISOString().split('T')[0]
              } else {
                processedValue = String(value)
              }

              await client.query(`
                INSERT INTO public.data_record_values (id, data_record_id, attribute_id, value, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
              `, [uuidv4(), record.id, attr.id, processedValue])
            }
          }
        }
      }
    }

    // Step 4: Summary
    console.log('\n' + '=' .repeat(60))
    console.log('🎉 Complete system setup finished successfully!')
    console.log('=' .repeat(60))
    console.log(`👤 Admin User: ${adminEmail} / ${adminPassword}`)
    console.log(`📁 Space: ${customerSpace.name} (ID: ${customerSpace.id})`)
    console.log(`📋 Models created: ${dataModels.length}`)
    console.log(`📝 Total attributes: ${dataModels.reduce((sum, model) => sum + model.attributes.length, 0)}`)
    console.log(`📊 Total sample records: ${dataModels.reduce((sum, model) => sum + (model.sampleData?.length || 0), 0)}`)
    console.log('\n📋 Data Models Created:')
    dataModels.forEach((model, index) => {
      console.log(`  ${index + 1}. ${model.display_name} (${model.name}) - ${model.attributes.length} attributes, ${model.sampleData?.length || 0} records`)
    })
    console.log('\n🚀 You can now login and start using the system!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    throw error
  } finally {
    client.release()
  }
}

// Run the script
if (require.main === module) {
  createCompleteSystemSetup()
    .then(() => {
      console.log('✅ Complete system setup completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Complete system setup failed:', error)
      process.exit(1)
    })
}

module.exports = { createCompleteSystemSetup }
