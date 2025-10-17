#!/usr/bin/env node

/**
 * Scheduled Workflow Runner
 * 
 * This script should be run as a cron job to execute scheduled workflows.
 * 
 * Example cron entries:
 * - Run every 5 minutes: */5 * * * * /path/to/node /path/to/scripts/run-scheduled-workflows.js
 * - Run every hour: 0 * * * * /path/to/node /path/to/scripts/run-scheduled-workflows.js
 * - Run daily at 2 AM: 0 2 * * * /path/to/node /path/to/scripts/run-scheduled-workflows.js
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_ENDPOINT = '/api/workflows/scheduler';

async function runScheduledWorkflows() {
  try {
    console.log(`[${new Date().toISOString()}] Starting scheduled workflow execution...`);
    
    const url = new URL(API_ENDPOINT, API_BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Workflow-Scheduler/1.0'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log(`[${new Date().toISOString()}] Scheduled workflows completed successfully`);
            console.log(`Executed ${result.executed_count} workflows`);
            
            if (result.results && result.results.length > 0) {
              result.results.forEach(workflow => {
                if (workflow.success) {
                  console.log(`  ✓ ${workflow.workflow_name}: ${workflow.records_updated} records updated`);
                } else {
                  console.log(`  ✗ ${workflow.workflow_name}: ${workflow.error}`);
                }
              });
            }
          } else {
            console.error(`[${new Date().toISOString()}] Error executing scheduled workflows:`, result.error);
            process.exit(1);
          }
        } catch (parseError) {
          console.error(`[${new Date().toISOString()}] Error parsing response:`, parseError);
          console.error('Response data:', data);
          process.exit(1);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`[${new Date().toISOString()}] Request error:`, error);
      process.exit(1);
    });

    req.setTimeout(300000, () => { // 5 minute timeout
      console.error(`[${new Date().toISOString()}] Request timeout`);
      req.destroy();
      process.exit(1);
    });

    req.end();
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Unexpected error:`, error);
    process.exit(1);
  }
}

// Run the scheduled workflows
runScheduledWorkflows();
