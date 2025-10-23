#!/usr/bin/env node

/**
 * Create example data for EAV system
 * This script populates the EAV system with sample data for testing and demonstration
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createExampleData() {
  console.log('🚀 Creating EAV example data...');

  try {
    // Step 1: Create sample entity types if they don't exist
    console.log('📋 Creating entity types...');
    
    const entityTypes = [
      {
        name: 'customer',
        displayName: 'Customer',
        description: 'Customer information and details',
        metadata: {
          icon: 'user',
          color: 'blue',
          category: 'business'
        }
      },
      {
        name: 'product',
        displayName: 'Product',
        description: 'Product catalog items',
        metadata: {
          icon: 'package',
          color: 'green',
          category: 'inventory'
        }
      },
      {
        name: 'order',
        displayName: 'Order',
        description: 'Customer orders and transactions',
        metadata: {
          icon: 'shopping-cart',
          color: 'purple',
          category: 'sales'
        }
      }
    ];

    for (const entityTypeData of entityTypes) {
      const existing = await prisma.entityType.findUnique({
        where: { name: entityTypeData.name }
      });

      if (!existing) {
        await prisma.entityType.create({
          data: entityTypeData
        });
        console.log(`✅ Created entity type: ${entityTypeData.name}`);
      } else {
        console.log(`ℹ️  Entity type already exists: ${entityTypeData.name}`);
      }
    }

    // Step 2: Create attributes for each entity type
    console.log('🔧 Creating attributes...');

    // Customer attributes
    const customerEntityType = await prisma.entityType.findUnique({
      where: { name: 'customer' }
    });

    if (customerEntityType) {
      const customerAttributes = [
        {
          name: 'first_name',
          displayName: 'First Name',
          dataType: 'TEXT',
          isRequired: true,
          isUnique: false,
          isIndexed: true,
          isSearchable: true,
          sortOrder: 1
        },
        {
          name: 'last_name',
          displayName: 'Last Name',
          dataType: 'TEXT',
          isRequired: true,
          isUnique: false,
          isIndexed: true,
          isSearchable: true,
          sortOrder: 2
        },
        {
          name: 'email',
          displayName: 'Email Address',
          dataType: 'TEXT',
          isRequired: true,
          isUnique: true,
          isIndexed: true,
          isSearchable: true,
          sortOrder: 3
        },
        {
          name: 'phone',
          displayName: 'Phone Number',
          dataType: 'TEXT',
          isRequired: false,
          isUnique: false,
          isIndexed: false,
          isSearchable: true,
          sortOrder: 4
        },
        {
          name: 'date_of_birth',
          displayName: 'Date of Birth',
          dataType: 'DATE',
          isRequired: false,
          isUnique: false,
          isIndexed: false,
          isSearchable: false,
          sortOrder: 5
        },
        {
          name: 'is_vip',
          displayName: 'VIP Customer',
          dataType: 'BOOLEAN',
          isRequired: false,
          isUnique: false,
          isIndexed: false,
          isSearchable: true,
          sortOrder: 6
        },
        {
          name: 'credit_limit',
          displayName: 'Credit Limit',
          dataType: 'DECIMAL',
          isRequired: false,
          isUnique: false,
          isIndexed: false,
          isSearchable: false,
          sortOrder: 7
        }
      ];

      for (const attrData of customerAttributes) {
        const existing = await prisma.eavAttribute.findFirst({
          where: {
            entityTypeId: customerEntityType.id,
            name: attrData.name
          }
        });

        if (!existing) {
          await prisma.eavAttribute.create({
            data: {
              ...attrData,
              entityTypeId: customerEntityType.id
            }
          });
          console.log(`✅ Created customer attribute: ${attrData.name}`);
        }
      }
    }

    // Product attributes
    const productEntityType = await prisma.entityType.findUnique({
      where: { name: 'product' }
    });

    if (productEntityType) {
      const productAttributes = [
        {
          name: 'name',
          displayName: 'Product Name',
          dataType: 'TEXT',
          isRequired: true,
          isUnique: true,
          isIndexed: true,
          isSearchable: true,
          sortOrder: 1
        },
        {
          name: 'description',
          displayName: 'Description',
          dataType: 'TEXTAREA',
          isRequired: false,
          isUnique: false,
          isIndexed: false,
          isSearchable: true,
          sortOrder: 2
        },
        {
          name: 'price',
          displayName: 'Price',
          dataType: 'DECIMAL',
          isRequired: true,
          isUnique: false,
          isIndexed: false,
          isSearchable: false,
          sortOrder: 3
        },
        {
          name: 'category',
          displayName: 'Category',
          dataType: 'TEXT',
          isRequired: true,
          isUnique: false,
          isIndexed: true,
          isSearchable: true,
          sortOrder: 4
        },
        {
          name: 'in_stock',
          displayName: 'In Stock',
          dataType: 'BOOLEAN',
          isRequired: false,
          isUnique: false,
          isIndexed: false,
          isSearchable: true,
          sortOrder: 5
        },
        {
          name: 'stock_quantity',
          displayName: 'Stock Quantity',
          dataType: 'INTEGER',
          isRequired: false,
          isUnique: false,
          isIndexed: false,
          isSearchable: false,
          sortOrder: 6
        }
      ];

      for (const attrData of productAttributes) {
        const existing = await prisma.eavAttribute.findFirst({
          where: {
            entityTypeId: productEntityType.id,
            name: attrData.name
          }
        });

        if (!existing) {
          await prisma.eavAttribute.create({
            data: {
              ...attrData,
              entityTypeId: productEntityType.id
            }
          });
          console.log(`✅ Created product attribute: ${attrData.name}`);
        }
      }
    }

    // Order attributes
    const orderEntityType = await prisma.entityType.findUnique({
      where: { name: 'order' }
    });

    if (orderEntityType) {
      const orderAttributes = [
        {
          name: 'order_number',
          displayName: 'Order Number',
          dataType: 'TEXT',
          isRequired: true,
          isUnique: true,
          isIndexed: true,
          isSearchable: true,
          sortOrder: 1
        },
        {
          name: 'order_date',
          displayName: 'Order Date',
          dataType: 'DATE',
          isRequired: true,
          isUnique: false,
          isIndexed: true,
          isSearchable: false,
          sortOrder: 2
        },
        {
          name: 'total_amount',
          displayName: 'Total Amount',
          dataType: 'DECIMAL',
          isRequired: true,
          isUnique: false,
          isIndexed: false,
          isSearchable: false,
          sortOrder: 3
        },
        {
          name: 'status',
          displayName: 'Order Status',
          dataType: 'TEXT',
          isRequired: true,
          isUnique: false,
          isIndexed: true,
          isSearchable: true,
          sortOrder: 4
        },
        {
          name: 'shipping_address',
          displayName: 'Shipping Address',
          dataType: 'TEXTAREA',
          isRequired: false,
          isUnique: false,
          isIndexed: false,
          isSearchable: true,
          sortOrder: 5
        }
      ];

      for (const attrData of orderAttributes) {
        const existing = await prisma.eavAttribute.findFirst({
          where: {
            entityTypeId: orderEntityType.id,
            name: attrData.name
          }
        });

        if (!existing) {
          await prisma.eavAttribute.create({
            data: {
              ...attrData,
              entityTypeId: orderEntityType.id
            }
          });
          console.log(`✅ Created order attribute: ${attrData.name}`);
        }
      }
    }

    // Step 3: Create sample entities
    console.log('👥 Creating sample entities...');

    // Create sample customers
    const sampleCustomers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123',
        dateOfBirth: '1985-03-15',
        isVip: true,
        creditLimit: 10000.00
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-0124',
        dateOfBirth: '1990-07-22',
        isVip: false,
        creditLimit: 5000.00
      },
      {
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@example.com',
        phone: '+1-555-0125',
        dateOfBirth: '1978-11-08',
        isVip: true,
        creditLimit: 15000.00
      }
    ];

    for (const customerData of sampleCustomers) {
      const existingCustomer = await prisma.eavEntity.findFirst({
        where: {
          entityTypeId: customerEntityType.id,
          metadata: {
            path: ['email'],
            equals: customerData.email
          }
        }
      });

      if (!existingCustomer) {
        const customer = await prisma.eavEntity.create({
          data: {
            entityTypeId: customerEntityType.id,
            isActive: true,
            metadata: {
              email: customerData.email,
              source: 'example_data'
            }
          }
        });

        // Create values for customer attributes
        const attributes = await prisma.eavAttribute.findMany({
          where: { entityTypeId: customerEntityType.id }
        });

        for (const attr of attributes) {
          let value = null;
          switch (attr.name) {
            case 'first_name':
              value = { textValue: customerData.firstName };
              break;
            case 'last_name':
              value = { textValue: customerData.lastName };
              break;
            case 'email':
              value = { textValue: customerData.email };
              break;
            case 'phone':
              value = { textValue: customerData.phone };
              break;
            case 'date_of_birth':
              value = { dateValue: new Date(customerData.dateOfBirth) };
              break;
            case 'is_vip':
              value = { booleanValue: customerData.isVip };
              break;
            case 'credit_limit':
              value = { numberValue: customerData.creditLimit };
              break;
          }

          if (value) {
            await prisma.eavValue.create({
              data: {
                entityId: customer.id,
                attributeId: attr.id,
                ...value
              }
            });
          }
        }

        console.log(`✅ Created customer: ${customerData.firstName} ${customerData.lastName}`);
      }
    }

    // Create sample products
    const sampleProducts = [
      {
        name: 'Laptop Pro 15"',
        description: 'High-performance laptop with 16GB RAM and 512GB SSD',
        price: 1299.99,
        category: 'Electronics',
        inStock: true,
        stockQuantity: 25
      },
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with USB receiver',
        price: 29.99,
        category: 'Accessories',
        inStock: true,
        stockQuantity: 150
      },
      {
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical keyboard with blue switches',
        price: 89.99,
        category: 'Accessories',
        inStock: false,
        stockQuantity: 0
      }
    ];

    for (const productData of sampleProducts) {
      const existingProduct = await prisma.eavEntity.findFirst({
        where: {
          entityTypeId: productEntityType.id,
          metadata: {
            path: ['name'],
            equals: productData.name
          }
        }
      });

      if (!existingProduct) {
        const product = await prisma.eavEntity.create({
          data: {
            entityTypeId: productEntityType.id,
            isActive: true,
            metadata: {
              name: productData.name,
              source: 'example_data'
            }
          }
        });

        // Create values for product attributes
        const attributes = await prisma.eavAttribute.findMany({
          where: { entityTypeId: productEntityType.id }
        });

        for (const attr of attributes) {
          let value = null;
          switch (attr.name) {
            case 'name':
              value = { textValue: productData.name };
              break;
            case 'description':
              value = { textValue: productData.description };
              break;
            case 'price':
              value = { numberValue: productData.price };
              break;
            case 'category':
              value = { textValue: productData.category };
              break;
            case 'in_stock':
              value = { booleanValue: productData.inStock };
              break;
            case 'stock_quantity':
              value = { numberValue: productData.stockQuantity };
              break;
          }

          if (value) {
            await prisma.eavValue.create({
              data: {
                entityId: product.id,
                attributeId: attr.id,
                ...value
              }
            });
          }
        }

        console.log(`✅ Created product: ${productData.name}`);
      }
    }

    // Create sample orders
    const sampleOrders = [
      {
        orderNumber: 'ORD-001',
        orderDate: '2024-01-15',
        totalAmount: 1329.98,
        status: 'completed',
        shippingAddress: '123 Main St, Anytown, USA 12345'
      },
      {
        orderNumber: 'ORD-002',
        orderDate: '2024-01-16',
        totalAmount: 29.99,
        status: 'shipped',
        shippingAddress: '456 Oak Ave, Somewhere, USA 67890'
      },
      {
        orderNumber: 'ORD-003',
        orderDate: '2024-01-17',
        totalAmount: 89.99,
        status: 'pending',
        shippingAddress: '789 Pine Rd, Elsewhere, USA 54321'
      }
    ];

    for (const orderData of sampleOrders) {
      const existingOrder = await prisma.eavEntity.findFirst({
        where: {
          entityTypeId: orderEntityType.id,
          metadata: {
            path: ['order_number'],
            equals: orderData.orderNumber
          }
        }
      });

      if (!existingOrder) {
        const order = await prisma.eavEntity.create({
          data: {
            entityTypeId: orderEntityType.id,
            isActive: true,
            metadata: {
              orderNumber: orderData.orderNumber,
              source: 'example_data'
            }
          }
        });

        // Create values for order attributes
        const attributes = await prisma.eavAttribute.findMany({
          where: { entityTypeId: orderEntityType.id }
        });

        for (const attr of attributes) {
          let value = null;
          switch (attr.name) {
            case 'order_number':
              value = { textValue: orderData.orderNumber };
              break;
            case 'order_date':
              value = { dateValue: new Date(orderData.orderDate) };
              break;
            case 'total_amount':
              value = { numberValue: orderData.totalAmount };
              break;
            case 'status':
              value = { textValue: orderData.status };
              break;
            case 'shipping_address':
              value = { textValue: orderData.shippingAddress };
              break;
          }

          if (value) {
            await prisma.eavValue.create({
              data: {
                entityId: order.id,
                attributeId: attr.id,
                ...value
              }
            });
          }
        }

        console.log(`✅ Created order: ${orderData.orderNumber}`);
      }
    }

    console.log('🎉 EAV example data creation completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Entity Types: Customer, Product, Order');
    console.log('- Sample Customers: 3');
    console.log('- Sample Products: 3');
    console.log('- Sample Orders: 3');
    console.log('- All with proper attributes and values');

  } catch (error) {
    console.error('❌ Error creating example data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createExampleData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createExampleData };
