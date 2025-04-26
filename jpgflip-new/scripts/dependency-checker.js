#!/usr/bin/env node

/**
 * Dependency Compatibility Checker
 * 
 * This script analyzes the project's dependencies to:
 * 1. Check for outdated packages
 * 2. Identify potential compatibility issues
 * 3. Suggest updates for critical packages
 * 4. Perform security vulnerability scan
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const util = require('util');

// Configuration
const CRITICAL_PACKAGES = [
  '@ffmpeg/core', 
  '@ffmpeg/ffmpeg', 
  'react', 
  'react-dom', 
  'vite',
  'typescript'
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper functions
function printHeader(text) {
  console.log(`\n${colors.bright}${colors.blue}=== ${text} ===${colors.reset}\n`);
}

function printSuccess(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

function printWarning(text) {
  console.log(`${colors.yellow}⚠ ${text}${colors.reset}`);
}

function printError(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

function printInfo(text) {
  console.log(`${colors.cyan}ℹ ${text}${colors.reset}`);
}

// Function to fetch npm package data
function fetchPackageData(packageName) {
  return new Promise((resolve, reject) => {
    const url = `https://registry.npmjs.org/${packageName}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const packageData = JSON.parse(data);
          resolve(packageData);
        } catch (error) {
          reject(new Error(`Failed to parse data for ${packageName}: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Failed to fetch data for ${packageName}: ${error.message}`));
    });
  });
}

// Read package.json
function readPackageJson() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson;
  } catch (error) {
    printError(`Failed to read package.json: ${error.message}`);
    process.exit(1);
  }
}

// Check for outdated packages
async function checkOutdatedPackages() {
  printHeader('Checking for Outdated Packages');
  
  try {
    // Use npm outdated in JSON format
    const stdout = execSync('npm outdated --json', { encoding: 'utf8' });
    
    // If there are no outdated packages, npm outdated returns empty string
    if (!stdout.trim()) {
      printSuccess('All packages are up to date!');
      return { outdated: false, packages: {} };
    }
    
    const outdated = JSON.parse(stdout);
    const outdatedCount = Object.keys(outdated).length;
    
    if (outdatedCount > 0) {
      printWarning(`Found ${outdatedCount} outdated packages`);
      
      // Display critical outdated packages
      const criticalOutdated = Object.keys(outdated).filter(pkg => CRITICAL_PACKAGES.includes(pkg));
      
      if (criticalOutdated.length > 0) {
        printError('Critical packages that need updating:');
        criticalOutdated.forEach(pkg => {
          const info = outdated[pkg];
          console.log(`  ${colors.bright}${pkg}${colors.reset}: ${info.current} → ${colors.green}${info.latest}${colors.reset}`);
        });
      }
      
      // Display other outdated packages
      const otherOutdated = Object.keys(outdated).filter(pkg => !CRITICAL_PACKAGES.includes(pkg));
      
      if (otherOutdated.length > 0) {
        printInfo('Other packages that could be updated:');
        otherOutdated.forEach(pkg => {
          const info = outdated[pkg];
          console.log(`  ${pkg}: ${info.current} → ${info.latest}`);
        });
      }
      
      return { outdated: true, packages: outdated };
    } else {
      printSuccess('All packages are up to date!');
      return { outdated: false, packages: {} };
    }
  } catch (error) {
    if (error.stderr && error.stderr.includes('code EJSONPARSE')) {
      printSuccess('All packages are up to date!');
      return { outdated: false, packages: {} };
    } else {
      printError(`Error checking outdated packages: ${error.message}`);
      return { outdated: false, packages: {}, error: error.message };
    }
  }
}

// Check for peerDependency compatibility issues
async function checkPeerDependencies() {
  printHeader('Checking Peer Dependency Compatibility');
  
  const packageJson = readPackageJson();
  const allDependencies = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {})
  };
  
  const issues = [];
  const installedVersions = {};
  
  // Get installed versions
  Object.keys(allDependencies).forEach(pkg => {
    // Strip version specifier to get actual version
    let version = allDependencies[pkg];
    if (version.startsWith('^') || version.startsWith('~')) {
      version = version.substring(1);
    }
    installedVersions[pkg] = version;
  });
  
  // Check peer dependencies
  for (const pkg of Object.keys(allDependencies)) {
    try {
      const packageData = await fetchPackageData(pkg);
      const peerDeps = packageData.versions[packageData['dist-tags'].latest].peerDependencies;
      
      if (peerDeps) {
        Object.keys(peerDeps).forEach(peerPkg => {
          const requiredVersion = peerDeps[peerPkg];
          
          // If the peer dependency is installed, check version compatibility
          if (installedVersions[peerPkg]) {
            // Simple version check - this could be more sophisticated
            const required = requiredVersion.replace(/[^\d.]/g, '');
            const installed = installedVersions[peerPkg].replace(/[^\d.]/g, '');
            
            // Very basic major version check
            const requiredMajor = required.split('.')[0];
            const installedMajor = installed.split('.')[0];
            
            if (requiredMajor !== installedMajor) {
              issues.push({
                package: pkg,
                peerPackage: peerPkg,
                requiredVersion: requiredVersion,
                installedVersion: installedVersions[peerPkg]
              });
            }
          } else {
            // If the peer dependency is not installed
            issues.push({
              package: pkg,
              peerPackage: peerPkg,
              requiredVersion: requiredVersion,
              installedVersion: 'not installed'
            });
          }
        });
      }
    } catch (error) {
      printWarning(`Could not check peer dependencies for ${pkg}: ${error.message}`);
    }
  }
  
  if (issues.length > 0) {
    printWarning(`Found ${issues.length} potential peer dependency issues`);
    issues.forEach(issue => {
      printError(`${issue.package} requires ${issue.peerPackage}@${issue.requiredVersion}, but ${issue.installedVersion} is installed`);
    });
    return { issues: true, details: issues };
  } else {
    printSuccess('No peer dependency issues found');
    return { issues: false, details: [] };
  }
}

// Check for common compatibility issues
function checkCommonCompatibility() {
  printHeader('Checking for Common Compatibility Issues');
  
  const issues = [];
  const packageJson = readPackageJson();
  const allDependencies = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {})
  };
  
  // Check for React & ReactDOM version mismatch
  if (allDependencies['react'] && allDependencies['react-dom']) {
    if (allDependencies['react'] !== allDependencies['react-dom']) {
      issues.push({
        type: 'mismatch',
        packages: ['react', 'react-dom'],
        versions: [allDependencies['react'], allDependencies['react-dom']]
      });
    }
  }
  
  // Check for TypeScript and tslib
  if (allDependencies['typescript'] && !allDependencies['tslib']) {
    issues.push({
      type: 'missing',
      package: 'tslib',
      reason: 'Required when using TypeScript with importHelpers'
    });
  }
  
  // Check for any package that might have browser compatibility issues
  const browserCompatibilityPackages = Object.keys(allDependencies).filter(pkg => 
    pkg.includes('ffmpeg') || pkg.includes('wasm')
  );
  
  if (browserCompatibilityPackages.length > 0) {
    browserCompatibilityPackages.forEach(pkg => {
      issues.push({
        type: 'browserCompat',
        package: pkg,
        reason: 'May have browser compatibility issues'
      });
    });
  }
  
  if (issues.length > 0) {
    printWarning(`Found ${issues.length} potential compatibility issues`);
    
    issues.forEach(issue => {
      if (issue.type === 'mismatch') {
        printError(`${issue.packages.join(' and ')} should have matching versions, but got ${issue.versions.join(' and ')}`);
      } else if (issue.type === 'missing') {
        printWarning(`${issue.package} is recommended: ${issue.reason}`);
      } else if (issue.type === 'browserCompat') {
        printInfo(`${issue.package}: ${issue.reason} - ensure proper polyfills or fallbacks are in place`);
      }
    });
    
    return { issues: true, details: issues };
  } else {
    printSuccess('No common compatibility issues found');
    return { issues: false, details: [] };
  }
}

// Run security audit
function runSecurityAudit() {
  printHeader('Running Security Vulnerability Scan');
  
  try {
    const stdout = execSync('npm audit --json', { encoding: 'utf8' });
    const auditResults = JSON.parse(stdout);
    
    const vulnerabilities = auditResults.vulnerabilities;
    const totalVulnerabilities = auditResults.metadata.vulnerabilities.total;
    
    if (totalVulnerabilities > 0) {
      printError(`Found ${totalVulnerabilities} security vulnerabilities`);
      
      // Check critical and high vulnerabilities
      const critical = auditResults.metadata.vulnerabilities.critical || 0;
      const high = auditResults.metadata.vulnerabilities.high || 0;
      
      if (critical > 0) {
        printError(`${critical} critical vulnerabilities - immediate attention required!`);
      }
      
      if (high > 0) {
        printError(`${high} high vulnerabilities - attention required`);
      }
      
      // List top 5 vulnerable packages
      const vulnerablePackages = Object.keys(vulnerabilities).slice(0, 5);
      if (vulnerablePackages.length > 0) {
        printInfo('Top vulnerable packages:');
        vulnerablePackages.forEach(pkg => {
          const vuln = vulnerabilities[pkg];
          console.log(`  ${colors.bright}${pkg}${colors.reset}: ${vuln.severity} severity (${vuln.effects.length} effects)`);
        });
      }
      
      // Suggest fix if available
      if (auditResults.metadata.vulnerabilities.total > 0) {
        printInfo('To automatically fix vulnerabilities, run:');
        console.log('  npm audit fix');
        console.log('  # Or for a major version update (may include breaking changes):');
        console.log('  npm audit fix --force');
      }
      
      return { 
        vulnerabilities: true, 
        count: totalVulnerabilities,
        details: {
          critical,
          high,
          moderate: auditResults.metadata.vulnerabilities.moderate || 0,
          low: auditResults.metadata.vulnerabilities.low || 0
        }
      };
    } else {
      printSuccess('No security vulnerabilities found');
      return { vulnerabilities: false, count: 0 };
    }
  } catch (error) {
    // Check if it's just a case of vulnerabilities being found (npm returns non-zero)
    try {
      const stderr = error.stderr.toString();
      if (stderr.includes('found')) {
        const match = stderr.match(/found (\d+) vulnerabilities/i);
        if (match && match[1]) {
          const count = parseInt(match[1], 10);
          printError(`Found ${count} security vulnerabilities. Run 'npm audit' for details`);
          return { vulnerabilities: true, count, details: null };
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
    
    printError(`Error running security audit: ${error.message}`);
    return { vulnerabilities: false, count: 0, error: error.message };
  }
}

// Suggest package updates
function suggestUpdates(outdatedResults) {
  printHeader('Update Recommendations');
  
  const { outdated, packages } = outdatedResults;
  
  if (!outdated || Object.keys(packages).length === 0) {
    printSuccess('No updates needed at this time');
    return;
  }
  
  // Recommend critical packages first
  const criticalOutdated = Object.keys(packages).filter(pkg => CRITICAL_PACKAGES.includes(pkg));
  
  if (criticalOutdated.length > 0) {
    printInfo('Recommended updates (critical packages):');
    console.log(colors.cyan);
    console.log('npm install \\');
    criticalOutdated.forEach((pkg, index) => {
      const info = packages[pkg];
      const isLast = index === criticalOutdated.length - 1;
      console.log(`  ${pkg}@${info.latest}${isLast ? '' : ' \\'}`);
    });
    console.log(colors.reset);
  }
  
  // Other significant updates (major version changes)
  const majorUpdates = Object.keys(packages).filter(pkg => {
    const info = packages[pkg];
    const currentMajor = parseInt(info.current.split('.')[0], 10);
    const latestMajor = parseInt(info.latest.split('.')[0], 10);
    return !CRITICAL_PACKAGES.includes(pkg) && currentMajor < latestMajor;
  });
  
  if (majorUpdates.length > 0) {
    printInfo('Major version updates (may include breaking changes):');
    console.log(colors.yellow);
    console.log('npm install \\');
    majorUpdates.forEach((pkg, index) => {
      const info = packages[pkg];
      const isLast = index === majorUpdates.length - 1;
      console.log(`  ${pkg}@${info.latest}${isLast ? '' : ' \\'}`);
    });
    console.log(colors.reset);
  }
  
  // Routine updates (minor/patch)
  const routineUpdates = Object.keys(packages).filter(pkg => {
    return !CRITICAL_PACKAGES.includes(pkg) && !majorUpdates.includes(pkg);
  });
  
  if (routineUpdates.length > 0) {
    printInfo('Routine updates (minor/patch versions):');
    console.log('npm update');
  }
}

// Generate report summary
function generateSummary(results) {
  printHeader('Dependency Check Summary');
  
  const { outdated, peerIssues, compatIssues, security } = results;
  
  let issueCount = 0;
  let status = 'healthy';
  
  if (outdated.outdated && Object.keys(outdated.packages).some(pkg => CRITICAL_PACKAGES.includes(pkg))) {
    issueCount++;
    status = 'attention';
  }
  
  if (peerIssues.issues) {
    issueCount++;
    status = 'attention';
  }
  
  if (compatIssues.issues) {
    issueCount++;
    status = status === 'attention' ? 'critical' : 'attention';
  }
  
  if (security.vulnerabilities && security.count > 0) {
    issueCount += security.count;
    status = 'critical';
  }
  
  const statusColors = {
    healthy: colors.green,
    attention: colors.yellow,
    critical: colors.red
  };
  
  console.log(`${statusColors[status]}Project dependency status: ${status.toUpperCase()}${colors.reset}`);
  console.log(`Total issues found: ${issueCount}`);
  
  if (status === 'healthy') {
    printSuccess('All dependencies are compatible and up to date');
  } else {
    printWarning('Issues found in dependency configuration');
    
    if (status === 'critical') {
      printError('Critical issues require immediate attention!');
    }
    
    // Simple recommendations
    console.log('\nRecommendations:');
    if (security.vulnerabilities) {
      printInfo('Run npm audit fix to address security vulnerabilities');
    }
    
    if (outdated.outdated) {
      printInfo('Update outdated dependencies, especially critical ones');
    }
    
    if (peerIssues.issues || compatIssues.issues) {
      printInfo('Review compatibility issues and resolve manually');
    }
  }
}

// Main function
async function main() {
  console.log(`${colors.bright}${colors.cyan}🔍 Dependency Compatibility Checker${colors.reset}`);
  
  try {
    // Check for outdated packages
    const outdatedResults = await checkOutdatedPackages();
    
    // Check peer dependencies
    const peerResults = await checkPeerDependencies();
    
    // Check common compatibility issues
    const compatResults = checkCommonCompatibility();
    
    // Run security audit
    const securityResults = runSecurityAudit();
    
    // Suggest updates
    suggestUpdates(outdatedResults);
    
    // Generate report summary
    const results = {
      outdated: outdatedResults,
      peerIssues: peerResults,
      compatIssues: compatResults,
      security: securityResults
    };
    
    generateSummary(results);
  } catch (error) {
    printError(`Dependency check failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();