#!/usr/bin/env node

/**
 * Unified Scheduler Runner
 * 
 * This script executes all scheduled tasks:
 * - Workflows
 * - Notebooks
 * - Data Syncs
 * 
 * Example cron entries:
 * - Run every 5 minutes: */5 * * * * /path/to/node /path/to/scripts/run-unified-scheduler.js
 * - Run every hour: 0 * * * * /path/to/node /path/to/scripts/run-unified-scheduler.js
 * - Run daily at 2 AM: 0 2 * * * /path/to/node /path/to/scripts/run-unified-scheduler.js
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_ENDPOINT = '/api/scheduler/unified';

async function runUnifiedScheduler() {
  try {
    console.log(`[${new Date().toISOString()}] Starting unified scheduler execution...`);
    
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
        'User-Agent': 'Unified-Scheduler/1.0'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            console.log(`[${new Date().toISOString()}] Success: Executed ${result.executed_count} task(s)`);
            
            if (result.results) {
              if (result.results.workflows && result.results.workflows.length > 0) {
                console.log(`  Workflows: ${result.results.workflows.length}`);
                result.results.workflows.forEach((w) => {
                  console.log(`    ${w.success ? '✓' : '✗'} ${w.workflow_name}: ${w.success ? 'Success' : w.error}`);
                });
              }
              
              if (result.results.notebooks && result.results.notebooks.length > 0) {
                console.log(`  Notebooks: ${result.results.notebooks.length}`);
                result.results.notebooks.forEach((n) => {
                  console.log(`    ${n.success ? '✓' : '✗'} ${n.schedule_name}: ${n.success ? 'Success' : n.error}`);
                });
              }
              
              if (result.results.dataSyncs && result.results.dataSyncs.length > 0) {
                console.log(`  Data Syncs: ${result.results.dataSyncs.length}`);
                result.results.dataSyncs.forEach((d) => {
                  console.log(`    ${d.success ? '✓' : '✗'} ${d.schedule_name}: ${d.success ? 'Success' : d.error}`);
                });
              }
            }
            
            process.exit(0);
          } catch (parseError) {
            console.error(`[${new Date().toISOString()}] Error parsing response:`, parseError);
            process.exit(1);
          }
        } else {
          console.error(`[${new Date().toISOString()}] Error: HTTP ${res.statusCode}`);
          console.error(`Response: ${data}`);
          process.exit(1);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`[${new Date().toISOString()}] Request error:`, error.message);
      process.exit(1);
    });

    req.end();
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Fatal error:`, error.message);
    process.exit(1);
  }
}

runUnifiedScheduler();

