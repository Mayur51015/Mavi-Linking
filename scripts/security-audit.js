/**
 * Automated Security & Dependency Audit Script
 * Audits dependency vulnerability status and scans for committed secrets/keys.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SECRET_PATTERNS = [
  { name: 'Private Key', regex: /-----BEGIN (RSA|EC|DSA|OPENSSH|PRIVATE) KEY-----/ },
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Generic Live Secret Pattern', regex: /api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9]{32,}['"]/i },
  { name: 'Database Connection URI with Creds', regex: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/i },
];

const SCAN_DIRS = ['client/src', 'server/src', 'e2e'];
const ROOT_DIR = path.resolve(__dirname, '..');

function checkGitIgnore() {
  console.log('🔒 [Security Audit] 1. Inspecting .gitignore for environment protection...');
  const gitignorePath = path.join(ROOT_DIR, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    console.warn('⚠️ No .gitignore file found in root!');
    return false;
  }
  const content = fs.readFileSync(gitignorePath, 'utf8');
  const hasEnv = content.split('\n').some((line) => line.trim().startsWith('.env'));
  if (hasEnv) {
    console.log('  ✅ .gitignore properly excludes .env files.');
    return true;
  } else {
    console.warn('  ⚠️ .gitignore does not explicitly exclude .env files!');
    return false;
  }
}

function scanForSecrets() {
  console.log('\n🔒 [Security Audit] 2. Scanning source files for exposed secrets...');
  let findings = [];

  function walk(dir) {
    const fullDir = path.join(ROOT_DIR, dir);
    if (!fs.existsSync(fullDir)) return;

    const files = fs.readdirSync(fullDir, { withFileTypes: true });
    for (const file of files) {
      const relPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        if (file.name !== 'node_modules' && file.name !== '.git' && file.name !== 'dist') {
          walk(relPath);
        }
      } else if (/\.(js|jsx|ts|tsx|json|env)$/i.test(file.name)) {
        if (file.name.endsWith('.env.example')) continue;
        const filePath = path.join(ROOT_DIR, relPath);
        const code = fs.readFileSync(filePath, 'utf8');

        for (const pattern of SECRET_PATTERNS) {
          if (pattern.regex.test(code)) {
            // Exclude test mock secrets
            if (relPath.includes('test') || relPath.includes('setup') || relPath.includes('mock')) {
              continue;
            }
            findings.push({ file: relPath, type: pattern.name });
          }
        }
      }
    }
  }

  for (const d of SCAN_DIRS) {
    walk(d);
  }

  if (findings.length === 0) {
    console.log('  ✅ No exposed secrets or private keys detected in scanned source code.');
  } else {
    console.warn(`  ⚠️ Found ${findings.length} potential secret pattern(s):`);
    findings.forEach((f) => console.warn(`   - ${f.file} (${f.type})`));
  }
  return findings;
}

function auditDependencies() {
  console.log('\n🔒 [Security Audit] 3. Checking dependency vulnerability status...');
  try {
    const output = execSync('npm audit --json', { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const audit = JSON.parse(output);
    const vulns = audit.metadata ? audit.metadata.vulnerabilities : {};
    console.log(`  Dependency Audit Summary:`);
    console.log(`   - Critical : ${vulns.critical || 0}`);
    console.log(`   - High     : ${vulns.high || 0}`);
    console.log(`   - Moderate : ${vulns.moderate || 0}`);
    console.log(`   - Low      : ${vulns.low || 0}`);
    console.log(`   - Total    : ${audit.metadata?.totalDependencies || 'N/A'} dependencies audited`);
    return vulns;
  } catch (err) {
    if (err.stdout) {
      try {
        const audit = JSON.parse(err.stdout);
        const vulns = audit.metadata ? audit.metadata.vulnerabilities : {};
        console.log(`  Dependency Audit Summary:`);
        console.log(`   - Critical : ${vulns.critical || 0}`);
        console.log(`   - High     : ${vulns.high || 0}`);
        console.log(`   - Moderate : ${vulns.moderate || 0}`);
        console.log(`   - Low      : ${vulns.low || 0}`);
        return vulns;
      } catch (parseErr) {
        console.warn('  ⚠️ Could not parse npm audit JSON output.');
      }
    }
    console.warn('  ⚠️ npm audit completed with non-zero exit code (advisories present).');
    return null;
  }
}

async function run() {
  console.log('🛡️  Starting Automated Security Audit...\n');
  checkGitIgnore();
  const secretFindings = scanForSecrets();
  const vulns = auditDependencies();
  console.log('\n✅ Security audit scan completed.');
}

run();
