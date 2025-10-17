# Workflows Feature Documentation

## Overview

The Workflows feature allows you to automate data model attribute updates based on conditions and schedules. This enables you to:

- Set up automated rules to update data records when certain conditions are met
- Schedule workflows to run at specific times (daily, weekly, monthly, or custom cron)
- Create event-based workflows that trigger on data changes
- Execute workflows manually for testing and one-off updates

## Features

### 1. Workflow Types

#### Manual Workflows
- Triggered manually by users
- Useful for testing and one-off data updates
- Can be executed from the workflows page

#### Scheduled Workflows
- Run automatically based on time schedules
- Support for daily, weekly, monthly, and custom cron expressions
- Managed by a cron job that calls the scheduler API

#### Event-Based Workflows
- Triggered by data changes or other events
- Currently supports manual triggering (event system can be extended)

### 2. Condition Builder

Workflows can have multiple conditions that determine when they should run:

- **Equals**: Exact match
- **Not Equals**: Not matching
- **Contains**: Partial text match
- **Not Contains**: Does not contain text
- **Greater Than**: Numeric comparison
- **Less Than**: Numeric comparison
- **Is Empty**: Check for empty values
- **Is Not Empty**: Check for non-empty values

Conditions can be combined with AND/OR logic.

### 3. Action Types

When conditions are met, workflows can perform various actions:

- **Update Value**: Set a specific value
- **Set Default**: Use the attribute's default value
- **Copy From**: Copy value from another attribute
- **Calculate**: Execute a formula (basic support)

### 4. Scheduling Options

- **Once**: Run only once
- **Daily**: Run every day
- **Weekly**: Run once per week
- **Monthly**: Run once per month
- **Custom Cron**: Use cron expressions for complex schedules

## Database Schema

The workflow system uses several tables:

- `workflows`: Main workflow definitions
- `workflow_conditions`: Conditions that must be met
- `workflow_actions`: Actions to perform when conditions are met
- `workflow_schedules`: Schedule configuration for scheduled workflows
- `workflow_executions`: Execution history and logs
- `workflow_execution_results`: Detailed results for each record processed

## API Endpoints

### Workflows
- `GET /api/workflows` - List workflows with filters
- `POST /api/workflows` - Create new workflow
- `GET /api/workflows/[id]` - Get workflow details
- `PUT /api/workflows/[id]` - Update workflow
- `DELETE /api/workflows/[id]` - Delete workflow

### Execution
- `POST /api/workflows/[id]/execute` - Execute workflow manually
- `GET /api/workflows/executions` - List execution history
- `POST /api/workflows/scheduler` - Run scheduled workflows (cron endpoint)

## Usage

### Creating a Workflow

1. Navigate to the Workflows page
2. Click "New Workflow"
3. Fill in basic information:
   - Name and description
   - Select data model
   - Choose trigger type
4. Configure conditions (when to run)
5. Set up actions (what to do)
6. Configure schedule (if scheduled workflow)
7. Save the workflow

### Example Workflow

**Scenario**: Update customer status to "VIP" when their total purchases exceed $10,000

1. **Basic Info**:
   - Name: "Promote VIP Customers"
   - Data Model: Customer
   - Trigger: Scheduled (daily)

2. **Conditions**:
   - Attribute: "total_purchases"
   - Operator: "Greater Than"
   - Value: "10000"

3. **Actions**:
   - Target Attribute: "customer_status"
   - Action Type: "Update Value"
   - New Value: "VIP"

4. **Schedule**:
   - Type: Daily
   - Time: 2:00 AM

### Manual Execution

1. Go to the Workflows page
2. Find the workflow you want to run
3. Click the "Execute" button
4. Monitor the execution results

## Setup and Configuration

### 1. Database Migration

Run the workflow migration to create the necessary tables:

```sql
-- The migration is in: supabase/migrations/021_workflows_system.sql
```

### 2. Scheduled Workflows

To enable scheduled workflows, set up a cron job:

```bash
# Add to crontab (crontab -e)
# Run every 5 minutes
*/5 * * * * /path/to/node /path/to/scripts/run-scheduled-workflows.js

# Or run every hour
0 * * * * /path/to/node /path/to/scripts/run-scheduled-workflows.js
```

### 3. Environment Variables

Set the API base URL for the cron script:

```bash
export API_BASE_URL=https://your-domain.com
```

## Monitoring and Troubleshooting

### Execution History

- View execution history in the workflow details
- Check success/failure rates
- Review error messages for failed executions

### Common Issues

1. **Workflow not executing**:
   - Check if workflow is active
   - Verify conditions are correctly configured
   - Check execution logs for errors

2. **Scheduled workflows not running**:
   - Verify cron job is set up correctly
   - Check scheduler API endpoint is accessible
   - Review server logs for errors

3. **Conditions not matching**:
   - Verify attribute names and types
   - Check data format in conditions
   - Test with manual execution first

### Performance Considerations

- Workflows process records in batches
- Large datasets may take time to process
- Consider adding indexes on frequently queried attributes
- Monitor execution times and optimize conditions

## Security

- Workflows respect user permissions
- Only authorized users can create/modify workflows
- Execution is logged for audit purposes
- Sensitive data is handled securely

## Future Enhancements

- Advanced formula engine for calculations
- More complex scheduling options
- Workflow templates
- Visual workflow builder
- Integration with external systems
- Real-time event triggers
- Workflow dependencies and chaining
