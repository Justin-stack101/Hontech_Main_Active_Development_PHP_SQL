# ⌨️ Cross-Platform Terminal Diagnostic Cheat Sheet

Fast, copy-pasteable terminal commands for diagnosing port conflicts, killing stuck processes, tracing network/SSL handshakes, running git bisection, and inspecting memory.

---

## 1. 🔌 Port & Process Triage (Find & Kill Blocked Ports)

### Windows (PowerShell)

```powershell
# 1. Find process ID (PID) using port 3000 (or 5173, 8080)
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object LocalAddress, LocalPort, OwningProcess, State

# Alternative using netstat:
netstat -ano | findstr :3000

# 2. Kill the process by PID
Stop-Process -Id <PID> -Force

# Or using taskkill:
taskkill /PID <PID> /F
```

### macOS / Linux (Bash / Zsh)

```bash
# 1. Find process using port 3000
lsof -i :3000
# Or using ss:
ss -tulpn | grep :3000

# 2. Kill the process by PID
kill -9 <PID>

# 3. Kill process directly by port in one command
npx kill-port 3000
# Or:
fuser -k 3000/tcp
```

---

## 2. 🔍 Git Bisection (Find the Exact Regression Commit in 60s)

Automate binary search across commits to pinpoint what broke:

```bash
# 1. Start bisection
git bisect start

# 2. Mark current commit as broken (bad)
git bisect bad

# 3. Mark a known-working commit or tag as good
git bisect good v1.0.0 # or commit SHA: abc1234

# 4. Automate testing across all commits:
git bisect run npm test
# (Git will automatically test commits in binary search until it prints the exact broken commit!)

# 5. When finished, return to normal branch
git bisect reset
```

---

## 3. 🌐 Network & SSL Handshake Diagnostics

```bash
# Detailed HTTP timing (DNS, TLS, TTFB, Total Time)
curl -Iv -w "\nTime DNS: %{time_namelookup}s\nTime Connect: %{time_connect}s\nTime TLS: %{time_appconnect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" https://api.example.com/health

# Test TCP port connectivity without curl
# Windows PowerShell:
Test-NetConnection -ComputerName api.example.com -Port 443

# Linux/macOS:
nc -zv api.example.com 443

# Check SSL Certificate Expiry & Chain
openssl s_client -connect api.example.com:443 -servername api.example.com
```

---

## 4. 🧠 Node.js & Memory Profiling

```bash
# Run Node.js with heap snapshot generation on Out-Of-Memory (OOM)
node --heapsnapshot-on-uncaught-exception --max-old-space-size=4096 app.js

# Inspect active Node.js event loop & handles
node --inspect app.js
# Then open chrome://inspect in Google Chrome to inspect CPU Flamegraphs and Heap Snapshots.
```

---

## 5. 🐳 Docker & Container Network Triage

```bash
# Inspect container IP and network attachments
docker inspect <container_name> --format '{{json .NetworkSettings.Networks}}'

# Test connectivity from inside a running container
docker exec -it <container_name> curl -Iv http://host.docker.internal:3000

# View real-time container CPU / Memory usage
docker stats
```

---

## 6. 🐘 PHP Diagnostic & Tooling Commands

```bash
# 1. Fast PHP syntax linting across codebase
php -l path/to/file.php
find . -name "*.php" -not -path "./vendor/*" -exec php -l {} +

# 2. Strict static analysis (PHPStan / Psalm)
./vendor/bin/phpstan analyse --level=8 src/
# Or using Psalm:
./vendor/bin/psalm --show-info=true

# 3. Running unit and integration tests (Pest / PHPUnit)
./vendor/bin/pest
# Or using standard PHPUnit:
./vendor/bin/phpunit --testdox

# 4. Composer dependency & platform health check
composer validate --strict
composer check-platform-reqs
composer dump-autoload -o

# 5. Quick local PHP built-in server with routing
php -S localhost:8000 -t public/
```

---

## 7. 🧹 Dead Code & Redundancy Detection Across Languages

```bash
# TypeScript / JavaScript (Dead code, unused exports & dependencies)
npx tsc --noEmit                          # Strict noUnusedLocals / noUnusedParameters
npx knip                                  # Find unused files, exports, and dependencies
npx ts-prune                              # Find unused TypeScript exports

# Python (Unused imports, dead variables & unreachable code)
ruff check --select F401,F841,B018 .     # Find unused imports, variables & dead expressions
vulture .                                 # Find dead code and unreachable functions

# Go (Dead code & unused logic)
go vet ./...                              # Standard compiler analysis
golangci-lint run --enable unused ./...   # Deep unused analysis

# Rust (Unused code, functions & dependencies)
cargo clippy -- -D dead_code -D unused_variables -D unused_imports

# PHP (Dead code analysis)
./vendor/bin/phpstan analyse --level=8   # PHPStan strict dead-code detection
./vendor/bin/psalm --find-dead-code      # Psalm dead code detection
```
