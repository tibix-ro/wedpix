#!/usr/bin/env bash
# security-scan.sh — run from repo root before pushing to a public GitHub repo
# Usage: ./security-scan.sh
set -uo pipefail

FAIL=0
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo "== Security scan: $(basename "$(pwd)") =="

# 0. Prefer gitleaks if installed (much better detection than grep)
if command -v gitleaks >/dev/null 2>&1; then
  echo -e "\n[gitleaks] scanning full history..."
  if ! gitleaks detect --source . -v; then
    FAIL=1
  fi
else
  echo -e "${YELLOW}[!] gitleaks not installed — falling back to pattern scan.${NC}"
  echo "    Install: brew install gitleaks | scoop install gitleaks | apt/snap varies"
fi

# 1. Grep-based fallback / extra pass over tracked + staged files
echo -e "\n[pattern scan] tracked files..."
PATTERNS='(AKIA[0-9A-Z]{16}|aws_secret_access_key|-----BEGIN (RSA|OPENSSH|EC|DSA|PGP) PRIVATE KEY-----|api[_-]?key\s*[:=]\s*["'\''"][A-Za-z0-9_\-]{16,}|secret\s*[:=]\s*["'\''"][A-Za-z0-9_\-]{16,}|password\s*[:=]\s*["'\''"][^"'\''"]{4,}|Authorization:\s*Bearer\s+[A-Za-z0-9\-_\.]{20,}|mongodb(\+srv)?://[^"'\''"[:space:]]+|postgres(ql)?://[^"'\''"[:space:]]+|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})'

MATCHES=$(git grep -InE "$PATTERNS" -- . ':!*.lock' ':!*lock.json' 2>/dev/null)
if [ -n "$MATCHES" ]; then
  echo -e "${RED}[FAIL] Possible secrets found:${NC}"
  echo "$MATCHES"
  FAIL=1
else
  echo -e "${GREEN}[OK] No obvious secret patterns in tracked files.${NC}"
fi

# 2. Sensitive filenames that should never be committed
echo -e "\n[filenames] checking for risky tracked files..."
RISKY_FILES=$(git ls-files | grep -EiI '(^|/)(\.env(\..*)?|.*\.pem|.*\.key|id_rsa|id_ed25519|credentials\.json|.*service-account.*\.json|.*\.p12|.*\.pfx|.*\.sqlite3?|.*\.db)$' || true)
if [ -n "$RISKY_FILES" ]; then
  echo -e "${RED}[FAIL] Sensitive files are tracked:${NC}"
  echo "$RISKY_FILES"
  FAIL=1
else
  echo -e "${GREEN}[OK] No sensitive filenames tracked.${NC}"
fi

# 3. .gitignore sanity check
echo -e "\n[.gitignore] checking coverage..."
for entry in ".env" "node_modules" "*.log" "dist" "build" ".DS_Store"; do
  if [ -f .gitignore ] && grep -qxF "$entry" .gitignore; then
    : # covered
  else
    echo -e "${YELLOW}[warn] '$entry' not found in .gitignore${NC}"
  fi
done

# 4. Large files (accidental DB dumps, media, node_modules commits)
echo -e "\n[size] checking for files >5MB..."
BIG=$(git ls-files -z | xargs -0 du -h 2>/dev/null | awk '$1 ~ /[0-9]+M/ && $1+0 > 5 {print}')
if [ -n "$BIG" ]; then
  echo -e "${YELLOW}[warn] Large tracked files:${NC}"
  echo "$BIG"
else
  echo -e "${GREEN}[OK] No large files.${NC}"
fi

# 5. Client-identifying info left in configs/comments (common in freelance repos)
echo -e "\n[client data] scanning for leftover client identifiers..."
CLIENT_HITS=$(git grep -InE '(client[_-]?name|customer[_-]?id|invoice|contract[_-]?no)' -- . ':!*.md' 2>/dev/null | head -20)
if [ -n "$CLIENT_HITS" ]; then
  echo -e "${YELLOW}[warn] Possible client-identifying references — review manually:${NC}"
  echo "$CLIENT_HITS"
fi

echo -e "\n=============================="
if [ "$FAIL" -eq 1 ]; then
  echo -e "${RED}RESULT: FAIL — fix the issues above before pushing.${NC}"
  exit 1
else
  echo -e "${GREEN}RESULT: PASS — no blocking issues found.${NC}"
  exit 0
fi
