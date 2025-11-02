#!/usr/bin/env node

/**
 * Notebook Schedule Runner
 * 
 * This script should be run as a cron job to execute scheduled notebooks.
 * 
 * Example cron entries:
 * - Run every 5 minutes: */5 * * * * /path/to/node /path/to/scripts/run-notebook-schedules.js
 * - Run every hour: 0 * * * * /path/to/node /path/to/scripts/run-notebook-schedules.js
 * - Run daily at 2 AM: 0 2 * * * /path/to/node /path/to/scripts/run-notebook-schedules.js
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_ENDPOINT = '/api/scheduler/unified'; // Use unified scheduler

async function runNotebookSchedules() {
  try {
    console.log(`[${new Date().toISOString()}] Starting notebook schedule execution...`);
    
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
        'User-Agent': 'Notebook-Scheduler/1.0'
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
            console.log(`[${new Date().toISOString()}] Success: Executed ${result.executed_count} schedule(s)`);
            if (result.results && result.results.length > 0) {
              result.results.forEach((r) => {
                if (r.success) {
                  console.log(`  ✓ ${r.schedule_name}: Success`);
                } else {
                  console.log(`  ✗ ${r.schedule_name}: Failed - ${r.error}`);
                }
              });
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

runNotebookSchedules();

