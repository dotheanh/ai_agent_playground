# Everything Claude Code - Reference Guide

**Source:** https://github.com/affaan-m/everything-claude-code  
**Version:** v1.10.0 (Apr 2026)  
**Stats:** 145k+ stars, 22.3k forks, 170+ contributors

---

## Overview

Performance optimization system for AI agent harnesses. Works across **Claude Code, Codex, Cursor, OpenCode, Gemini**, and other AI agent harnesses.

**Components:**
- 38 specialized agents
- 156+ skills (workflow definitions)
- 72 legacy command shims

---

## Core Architecture

### Directory Structure

```
everything-claude-code/
├── agents/           # 36 specialized subagents
├── skills/           # Workflow definitions
├── commands/         # Legacy slash-entry shims
├── rules/            # Always-follow guidelines
├── hooks/            # Session hooks
├── mcp-configs/      # MCP configurations
├── research/         # Research docs
└── scripts/          # Setup utilities
```

---

## Configuration

### Recommended Settings

```json
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50",
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
  }
}
```

| Setting | Default | Recommended | Impact |
|---------|---------|-------------|--------|
| `model` | opus | sonnet | ~60% cost reduction |
| `MAX_THINKING_TOKENS` | 31,999 | 10,000 | ~70% reduction in hidden thinking cost |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | 95 | 50 | Compacts earlier — better quality in long sessions |

### Hook Runtime Controls

```bash
# Hook strictness profile (default: standard)
export ECC_HOOK_PROFILE=standard

# Comma-separated hook IDs to disable
export ECC_DISABLED_HOOKS="pre:bash:tmux-reminder,post:edit:typecheck"

# Disable MCPs
export ECC_DISABLED_MCPS="github,context7,exa,playwright,sequential-thinking,memory"
```

### Package Manager Detection

Priority order:
1. Environment variable: `CLAUDE_PACKAGE_MANAGER`
2. Project config: `.claude/package-manager.json`
3. package.json: `packageManager` field
4. Lock file detection
5. Global config: `~/.claude/package-manager.json`
6. Fallback: First available package manager

---

## Available Agents (38+)

### Core Agents

| Agent | Capability |
|-------|------------|
| `planner` | Feature implementation planning |
| `architect` | System design decisions |
| `tdd-guide` | Test-driven development |
| `code-reviewer` | Quality and security review |
| `security-reviewer` | Vulnerability analysis |
| `build-error-resolver` | Build error fixes |
| `e2e-runner` | Playwright E2E testing |
| `refactor-cleaner` | Dead code cleanup |
| `doc-updater` | Documentation sync |
| `docs-lookup` | Documentation/API lookup |
| `chief-of-staff` | Communication triage and drafts |
| `loop-operator` | Autonomous loop execution |
| `harness-optimizer` | Harness config tuning |
| `database-reviewer` | Database/Supabase review |

### Language-Specific Agents

| Agent | Capability |
|-------|------------|
| `typescript-reviewer` | TypeScript/JavaScript code review |
| `python-reviewer` | Python code review |
| `go-reviewer` | Go code review |
| `go-build-resolver` | Go build error resolution |
| `cpp-reviewer` | C++ code review |
| `cpp-build-resolver` | C++ build error resolution |
| `java-reviewer` | Java/Spring Boot code review |
| `java-build-resolver` | Java/Maven/Gradle build errors |
| `kotlin-reviewer` | Kotlin/Android/KMP code review |
| `kotlin-build-resolver` | Kotlin/Gradle build errors |
| `rust-reviewer` | Rust code review |
| `rust-build-resolver` | Rust build error resolution |
| `pytorch-build-resolver` | PyTorch/CUDA training errors |

### Operator Agents (v1.10+)

| Agent | Capability |
|-------|------------|
| `brand-voice` | Brand voice management |
| `social-graph-ranker` | Social network analysis |
| `connections-optimizer` | Connection optimization |
| `customer-billing-ops` | Customer billing operations |
| `ecc-tools-cost-audit` | Cost audit and optimization |
| `google-workspace-ops` | Google Workspace operations |
| `project-flow-ops` | Project flow operations |
| `workspace-surface-audit` | Workspace surface auditing |

---

## Available Skills (156+)

### Core Workflow Skills

| Skill | Purpose |
|-------|---------|
| `tdd-workflow` | Test-driven development methodology |
| `search-first` | Research-before-coding workflow |
| `continuous-learning-v2` | Instinct-based learning with confidence scoring |
| `iterative-retrieval` | Progressive context refinement for subagents |
| `strategic-compact` | Manual compaction suggestions for context management |
| `verification-loop` | Continuous verification of code quality |
| `eval-harness` | Verification loop evaluation |
| `configure-ecc` | Interactive installation wizard |
| `security-scan` | AgentShield security auditor integration |
| `skill-stocktake` | Audit skills and commands for quality |

### Language-Specific Skills

**TypeScript/JavaScript:**
- `frontend-patterns` - React, Next.js patterns
- `typescript-reviewer` - TypeScript code review agent
- `nextjs-turbopack` - Next.js 16+ and Turbopack incremental bundling
- `bun-runtime` - Bun as runtime and package manager

**Python:**
- `python-patterns` - Python idioms and best practices
- `python-testing` - Python testing with pytest
- `django-patterns` - Django patterns, models, views
- `django-security` - Django security best practices
- `django-tdd` - Django TDD workflow
- `django-verification` - Django verification loops
- `pytorch-patterns` - Deep learning workflows
- `pytorch-build-resolver` - PyTorch/CUDA training error resolution

**Go:**
- `golang-patterns` - Go idioms and best practices
- `golang-testing` - Go testing patterns, TDD, benchmarks

**Java:**
- `java-coding-standards` - Java coding standards
- `jpa-patterns` - JPA/Hibernate patterns
- `springboot-patterns` - Java Spring Boot patterns
- `springboot-security` - Spring Boot security
- `springboot-tdd` - Spring Boot TDD
- `springboot-verification` - Spring Boot verification

**PHP:**
- `laravel-patterns` - Laravel architecture patterns
- `laravel-security` - Laravel security best practices
- `laravel-tdd` - Laravel TDD workflow
- `laravel-verification` - Laravel verification loops

**C++:**
- `cpp-coding-standards` - C++ coding standards from C++ Core Guidelines
- `cpp-testing` - C++ testing with GoogleTest, CMake/CTest

**Kotlin:**
- `kotlin-reviewer` - Kotlin/Android/KMP code review
- `kotlin-build-resolver` - Kotlin/Gradle build errors

**Rust:**
- `rust-reviewer` - Rust code review
- `rust-build-resolver` - Rust build error resolution

**Swift:**
- `swift-actor-persistence` - Thread-safe Swift data persistence with actors
- `swift-protocol-di-testing` - Protocol-based DI for testable Swift code
- `swift-concurrency-6-2` - Swift 6.2 Approachable Concurrency

**Perl:**
- `perl-patterns` - Modern Perl 5.36+ idioms and best practices
- `perl-security` - Perl security patterns, taint mode, safe I/O
- `perl-testing` - Perl TDD with Test2::V0, prove, Devel::Cover

### Business & Content Skills

| Skill | Purpose |
|-------|---------|
| `article-writing` | Long-form writing in a supplied voice without generic AI tone |
| `content-engine` | Multi-platform social content and repurposing workflows |
| `market-research` | Source-attributed market, competitor, and investor research |
| `investor-materials` | Pitch decks, one-pagers, memos, and financial models |
| `investor-outreach` | Personalized fundraising outreach and follow-up |
| `brand-voice` | Source-derived writing style profiles from real content |
| `frontend-slides` | Zero-dependency HTML presentation builder with PPTX conversion |
| `videodb` | Video and audio: ingest, search, edit, generate, stream |
| `x-api` | X/Twitter API integration for posting and analytics |

### Infrastructure & DevOps Skills

| Skill | Purpose |
|-------|---------|
| `database-migrations` | Migration patterns (Prisma, Drizzle, Django, Go) |
| `api-design` | REST API design, pagination, error responses |
| `deployment-patterns` | CI/CD, Docker, health checks, rollbacks |
| `docker-patterns` | Docker Compose, networking, volumes, container security |
| `e2e-testing` | Playwright E2E patterns and Page Object Model |
| `postgres-patterns` | PostgreSQL optimization patterns |
| `clickhouse-io` | ClickHouse analytics, queries, data engineering |
| `backend-patterns` | API, database, caching patterns |

### Advanced Pattern Skills

| Skill | Purpose |
|-------|---------|
| `content-hash-cache-pattern` | SHA-256 content hash caching for file processing |
| `cost-aware-llm-pipeline` | LLM cost optimization, model routing, budget tracking |
| `regex-vs-llm-structured-text` | Decision framework: regex vs LLM for text parsing |
| `autonomous-loops` | Autonomous loop patterns: sequential pipelines, PR loops, DAG orchestration |
| `plankton-code-quality` | Write-time code quality enforcement with Plankton hooks |
| `mcp-server-patterns` | Build MCP servers with Node/TypeScript SDK |
| `documentation-lookup` | API reference research |
| `nutrient-document-processing` | Document processing with Nutrient API |
| `fal-ai-media` | Unified media generation for images, video, and audio |
| `deep-research` | Multi-source research with synthesis and source attribution |
| `crosspost` | Multi-platform content distribution across X, LinkedIn, Threads |
| `dmux-workflows` | Multi-agent orchestration using tmux pane manager |
| `foundation-models-on-device` | Apple on-device LLM with FoundationModels |
| `liquid-glass-design` | iOS 26 Liquid Glass design system |
| `claude-api` | Anthropic Claude API patterns for Python and TypeScript |

---

## Installation

### Method 1: Plugin Installation (Recommended)

```bash
# Add marketplace
/plugin marketplace add https://github.com/affaan-m/everything-claude-code

# Install plugin
/plugin install ecc@ecc
```

Or add to `~/.claude/settings.json`:
```json
{
  "extraKnownMarketplaces": {
    "ecc": {
      "source": {
        "source": "github",
        "repo": "affaan-m/everything-claude-code"
      }
    }
  },
  "enabledPlugins": {
    "ecc@ecc": true
  }
}
```

### Method 2: Manual Installation

```bash
# Clone the repo
git clone https://github.com/affaan-m/everything-claude-code.git
cd everything-claude-code

# Install dependencies
npm install

# macOS/Linux
./install.sh --profile full

# Or install for specific languages only
./install.sh typescript
./install.sh typescript python golang swift php
./install.sh --target cursor typescript
./install.sh --target antigravity typescript
./install.sh --target gemini --profile full
```

**Windows PowerShell:**
```powershell
.\install.ps1 --profile full
.\install.ps1 typescript
.\install.ps1 typescript python golang swift php
.\install.ps1 --target cursor typescript
```

---

## Common Workflows

### Starting a new feature

```
/plan "Add user authentication with OAuth"  → planner creates implementation blueprint
/tdd                                         → tdd-guide enforces write-tests-first
/code-review                                 → code-reviewer checks your work
```

### Fixing a bug

```
/tdd                                         → write a failing test that reproduces it
                                              → implement the fix, verify test passes
/code-review                                 → catch regressions
```

### Preparing for production

```
/security-scan                               → OWASP Top 10 audit
/e2e                                          → critical user flow tests
/test-coverage                               → verify 80%+ coverage
```

---

## Daily Workflow Commands

| Command | When to Use |
|---------|-------------|
| `/model sonnet` | Default for most tasks |
| `/model opus` | Complex architecture, debugging, deep reasoning |
| `/clear` | Between unrelated tasks (free, instant reset) |
| `/compact` | At logical task breakpoints |
| `/cost` | Monitor token spending during session |

---

## Agent Usage Examples

```bash
# Plan a new feature
/plan "Add auth"

# Design system architecture
/plan + architect agent

# Write code with tests first
/tdd

# Review code
/code-review

# Fix a failing build
/build-fix

# Run end-to-end tests
/e2e

# Find security vulnerabilities
/security-scan

# Remove dead code
/refactor-clean

# Update documentation
/update-docs
```

---

## Multi-Agent Commands

```bash
# Multi-agent task decomposition
/multi-plan

# Orchestrated multi-agent workflows
/multi-execute

# Backend multi-service orchestration
/multi-backend

# Frontend multi-service orchestration
/multi-frontend

# General multi-service workflows
/multi-workflow
```

---

## Continuous Learning Commands

```bash
/instinct-status        # Show learned instincts with confidence
/instinct-import <file> # Import instincts from others
/instinct-export        # Export your instincts for sharing
/evolve                 # Cluster related instincts into skills
/prune                  # Delete expired pending instincts
```

---

## Security Scanning (AgentShield)

```bash
# Quick scan (no install needed)
npx ecc-agentshield scan

# Auto-fix safe issues
npx ecc-agentshield scan --fix

# Deep analysis with three Opus 4.6 agents
npx ecc-agentshield scan --opus --stream

# Generate secure config from scratch
npx ecc-agentshield init
```

---

## Hook Architecture Example

```json
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.(ts|tsx|js|jsx)$\"",
  "hooks": [{
    "type": "command",
    "command": "#!/bin/bash\ngrep -n 'console\\.log' \"$file_path\" && echo '[Hook] Remove console.log' >&2"
  }]
}
```

---

## Requirements

- **Claude Code CLI:** Minimum version **v2.1.0** or later
- **Important:** Do NOT add a `"hooks"` field to `.claude-plugin/plugin.json` - Claude Code v2.1+ automatically loads `hooks/hooks.json`

---

## Key Best Practices

1. **TDD workflow** - Always write tests first
2. **Search-first** - Research before coding
3. **Verification loop** - Continuous code quality verification
4. **Security scanning** - Use AgentShield for OWASP Top 10 audit
5. **Package manager detection** - Auto-detect npm/pnpm/yarn/bun
6. **Model selection** - Use sonnet for most tasks, opus for complex reasoning
7. **Context management** - Compact at logical breakpoints, not just when forced
8. **Continuous learning** - Export/import instincts across sessions

---

## Links

- **Repository:** https://github.com/affaan-m/everything-claude-code
- **Documentation:** See repo's README.md for latest updates
