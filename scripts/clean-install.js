#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Cleaning up for fresh install...');

// Try to remove node_modules using rimraf if available, otherwise use native commands
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
const lockPath = path.join(process.cwd(), 'package-lock.json');

try {
  if (fs.existsSync(nodeModulesPath)) {
    console.log('Removing node_modules...');
    if (process.platform === 'win32') {
      // Use cmd /c rmdir which handles locked files better on Windows
      try {
        execSync(`cmd /c "rmdir /s /q "${nodeModulesPath}" 2>nul"`, { stdio: 'inherit', shell: true });
        // If that fails, try PowerShell with more aggressive flags
        if (fs.existsSync(nodeModulesPath)) {
          execSync(`powershell -Command "$ErrorActionPreference='Stop'; Get-ChildItem -Path '${nodeModulesPath}' -Force -Recurse | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue; Remove-Item -Path '${nodeModulesPath}' -Force -Recurse -ErrorAction SilentlyContinue"`, { stdio: 'inherit' });
        }
      } catch (e) {
        console.warn('Some files could not be removed. You may need to close Node processes and try again.');
      }
    } else {
      execSync(`rm -rf ${nodeModulesPath}`, { stdio: 'inherit' });
    }
  }
} catch (e) {
  console.warn('Could not fully remove node_modules. Continuing...');
}

try {
  if (fs.existsSync(lockPath)) {
    console.log('Removing package-lock.json...');
    fs.unlinkSync(lockPath);
  }
} catch (e) {
  console.warn('Could not remove package-lock.json. Continuing...');
}

console.log('Cleanup complete. Run: npm install');

