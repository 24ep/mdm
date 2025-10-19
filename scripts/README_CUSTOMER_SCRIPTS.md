# Customer Data Model Scripts

This directory contains scripts for creating and managing customer data models with comprehensive attribute types.

## Scripts Overview

### 1. `create-customer-attributes.js`
Creates a customer data model with all available attribute types as examples.

**Purpose**: Demonstrates all attribute types available in the system by creating a comprehensive customer data model.

**Features**:
- Creates customer data model if it doesn't exist
- Adds 31 attributes covering all attribute types:
  - TEXT (3 attributes)
  - NUMBER (3 attributes) 
  - BOOLEAN (3 attributes)
  - DATE (3 attributes)
  - EMAIL (2 attributes)
  - PHONE (2 attributes)
  - URL (2 attributes)
  - SELECT (3 attributes)
  - MULTI_SELECT (2 attributes)
  - TEXTAREA (3 attributes)
  - JSON (3 attributes)
- Includes validation rules and options where appropriate
- Sets proper ordering and requirements

### 2. `create-customer-data-model.js`
Creates a complete customer data setup including space, model, and attributes.

**Purpose**: Sets up a complete customer data management environment.

**Features**:
- Creates "Customer Data" space
- Creates customer data model
- Associates model with space
- Adds all attribute types with examples
- Handles admin user requirements

### 3. `test-customer-scripts.js`
Verifies that the customer data setup was created correctly.

**Purpose**: Validates the customer data model and space creation.

**Features**:
- Checks if Customer Data space exists
- Verifies customer model exists
- Confirms model-space association
- Validates all attribute types are present
- Reports missing components

## Usage

### Prerequisites
1. Ensure you have a database connection configured in your `.env` file
2. Make sure you have admin users in the system
3. Run database migrations to ensure all required tables exist

### Running the Scripts

#### Option 1: Create attributes only
```bash
node scripts/create-customer-attributes.js
```

#### Option 2: Create complete customer data setup
```bash
node scripts/create-customer-data-model.js
```

#### Option 3: Test the setup
```bash
node scripts/test-customer-scripts.js
```

### Complete Setup Process
```bash
# 1. Create the complete customer data setup
node scripts/create-customer-data-model.js

# 2. Test that everything was created correctly
node scripts/test-customer-scripts.js
```

## Attribute Types Covered

The scripts create examples of all available attribute types:

| Type | Description | Examples Created |
|------|-------------|------------------|
| TEXT | Single-line text | first_name, last_name, middle_name |
| NUMBER | Numeric values | age, credit_score, annual_income |
| BOOLEAN | True/false values | is_vip, has_newsletter, is_active |
| DATE | Date values | birth_date, registration_date, last_login |
| EMAIL | Email addresses | email, secondary_email |
| PHONE | Phone numbers | phone, mobile |
| URL | Web URLs | website, linkedin_profile |
| SELECT | Single choice from options | gender, customer_type, status |
| MULTI_SELECT | Multiple choices | interests, communication_preferences |
| TEXTAREA | Multi-line text | address, notes, description |
| JSON | JSON data | preferences, metadata, custom_fields |

## Validation and Options

The scripts include proper validation rules and options:

- **Text fields**: Min/max length validation
- **Number fields**: Min/max value validation  
- **Select fields**: Predefined option lists
- **Required fields**: Email and name fields are required
- **Unique fields**: Email field is unique
- **Default values**: Appropriate defaults for boolean and select fields

## Database Schema

The scripts work with these main tables:
- `spaces` - Data spaces/workspaces
- `data_models` - Data model definitions
- `data_model_spaces` - Junction table for model-space associations
- `data_model_attributes` - Attribute definitions
- `users` - User management (for admin user requirements)

## Error Handling

All scripts include comprehensive error handling:
- Database connection errors
- Missing admin users
- Duplicate creation attempts
- Validation failures
- Transaction rollback on errors

## Output

The scripts provide detailed console output:
- ✅ Success indicators
- ❌ Error indicators  
- 📊 Progress information
- 📋 Summary statistics
- 🎉 Completion messages

## Troubleshooting

### Common Issues

1. **No admin users found**
   - Create an admin user first using `create-admin-user.js`

2. **Database connection errors**
   - Check your `.env` file for correct `DATABASE_URL`
   - Ensure database is running and accessible

3. **Permission errors**
   - Ensure the database user has proper permissions
   - Check that all required tables exist

4. **Duplicate creation errors**
   - Scripts are idempotent and skip existing items
   - Check console output for skip messages

### Verification

After running the scripts, you can verify the setup by:
1. Running the test script: `node scripts/test-customer-scripts.js`
2. Checking the database directly
3. Using the application UI to view the customer data model

## Next Steps

After running these scripts, you can:
1. View the customer data model in the application
2. Create customer data records
3. Set up data import/export
4. Configure dashboards and analytics
5. Set up workflows and automation
