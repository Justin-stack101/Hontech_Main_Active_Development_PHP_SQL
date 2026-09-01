#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const rawCommand = (args[0] || '').toLowerCase();

const ROOT_DIR = path.resolve(__dirname, '..');

function printBanner() {
  console.log('\x1b[36m  ⚡ Antigravity Engineering Framework\x1b[0m');
  console.log('  /debug ➔ Root Cause | /push ➔ Safe Git | /install ➔ UI Suite\n');
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((child) => {
      copyRecursive(path.join(src, child), path.join(dest, child));
    });
  } else {
    const parentDir = path.dirname(dest);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function installUniversal() {
  printBanner();
  console.log('\x1b[33m📦 Installing Antigravity Engineering Framework...\x1b[0m\n');

  const items = ['SKILL.md', 'README.md', 'GEMINI.md', 'AGENTS.md', 'LICENSE', 'commands', 'project-profile', 'references'];

  try {
    // 1. Install to current workspace (if not running inside the source repo itself)
    const isSourceRepo = path.resolve(process.cwd()) === ROOT_DIR;
    if (!isSourceRepo) {
      const workspaceSkillDir = path.join(process.cwd(), '.gemini', 'skills', 'antigravityskill');
      const workspaceCommandsDir = path.join(process.cwd(), '.gemini', 'commands');
      
      if (!fs.existsSync(workspaceSkillDir)) fs.mkdirSync(workspaceSkillDir, { recursive: true });
      items.forEach((item) => {
        const src = path.join(ROOT_DIR, item);
        if (fs.existsSync(src)) copyRecursive(src, path.join(workspaceSkillDir, item));
      });
      const srcCommandsDir = path.join(ROOT_DIR, 'commands');
      if (fs.existsSync(srcCommandsDir)) {
        copyRecursive(srcCommandsDir, workspaceCommandsDir);
      }
      console.log('\x1b[32m✔ Installed to workspace: .gemini/skills/antigravityskill\x1b[0m');
    }

    // 2. Install globally
    const globalSkillDir = path.join(os.homedir(), '.gemini', 'antigravity', 'skills', 'antigravityskill');
    if (!fs.existsSync(globalSkillDir)) fs.mkdirSync(globalSkillDir, { recursive: true });
    items.forEach((item) => {
      const src = path.join(ROOT_DIR, item);
      if (fs.existsSync(src)) copyRecursive(src, path.join(globalSkillDir, item));
    });
    console.log('\x1b[32m✔ Installed globally: ~/.gemini/antigravity/skills/antigravityskill\x1b[0m\n');

    console.log('\x1b[36m🚀 All set! You can now use /debug, /push, and /install in your AI assistant.\x1b[0m\n');
  } catch (err) {
    console.error('\x1b[31m❌ Installation error: ' + err.message + '\x1b[0m\n');
    process.exit(1);
  }
}

function runInstallToolchain() {
  printBanner();
  console.log('\x1b[35m🎨 Installing Dedicated UI / UX Design Suite (/install)...\x1b[0m\n');
  const cmds = [
    { name: 'Impeccable Design Engine', cmd: 'npx -y impeccable install' },
    { name: 'Taste Skill Extension', cmd: 'npx -y skills add Leonxlnx/taste-skill' },
    { name: 'Agentation Component Toolchain', cmd: 'npm install agentation' }
  ];

  cmds.forEach((c) => {
    console.log('▶ Running: ' + c.name + ' (' + c.cmd + ')...');
    try {
      execSync(c.cmd, { stdio: 'inherit', shell: true });
      console.log('\x1b[32m✔ ' + c.name + ' ready.\x1b[0m\n');
    } catch (e) {
      console.warn('\x1b[33m⚠ Notice for ' + c.name + ': ' + e.message + '\x1b[0m\n');
    }
  });
  console.log('\x1b[32m✔ UI/UX Design toolchain ready!\x1b[0m\n');
}

function printHelp() {
  printBanner();
  console.log(`Usage: npx antigravityskill [options]

Just run:
  npx antigravityskill          Universal installation (installs to current project & globally)

Other Options:
  npx antigravityskill install   Install dedicated UI / UX design toolchain
  npx antigravityskill help      Show this help message
`);
}

switch (rawCommand) {
  case '':
  case 'init':
  case 'setup':
  case 'add':
  case 'i':
    installUniversal();
    break;
  case 'install':
  case 'ui':
    runInstallToolchain();
    break;
  case 'help':
  case '--help':
  case '-h':
  case '-v':
  case '--version':
    printHelp();
    break;
  default:
    installUniversal();
    break;
}


