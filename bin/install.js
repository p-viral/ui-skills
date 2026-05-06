#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const SKILLS_SRC = path.join(__dirname, "..", "skills");
const AGENTS_DEST = path.join(os.homedir(), ".agents", "skills");
const CLAUDE_DEST = path.join(os.homedir(), ".claude", "skills");

const args = process.argv.slice(2);
const targetSkill = args[0]; // optional: install only one skill

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copySkill(skillName, srcBase, destBase) {
  const src = path.join(srcBase, skillName);
  const dest = path.join(destBase, skillName);

  if (!fs.existsSync(src)) {
    console.error(`  ✗ Skill not found: ${skillName}`);
    return false;
  }

  ensureDir(dest);

  const files = fs.readdirSync(src, { recursive: true });
  for (const file of files) {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    if (fs.statSync(srcFile).isDirectory()) {
      ensureDir(destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  }

  return true;
}

function installAll() {
  const skills = fs.readdirSync(SKILLS_SRC).filter((s) => {
    return fs.statSync(path.join(SKILLS_SRC, s)).isDirectory();
  });

  const toInstall = targetSkill ? [targetSkill] : skills;

  console.log(`\nui-skills installer\n`);

  for (const skill of toInstall) {
    process.stdout.write(`  Installing ${skill}...`);

    const toAgents = copySkill(skill, SKILLS_SRC, AGENTS_DEST);
    const toClaude = copySkill(skill, SKILLS_SRC, CLAUDE_DEST);

    if (toAgents || toClaude) {
      console.log(` ✓`);
    }
  }

  console.log(`\nDone. Skills installed to:`);
  console.log(`  ${CLAUDE_DEST}`);
  console.log(`  ${AGENTS_DEST}`);
  console.log(`\nRestart Claude Code to pick up new skills.\n`);
}

installAll();
