#!/usr/bin/env bash
# Prepare the repository for pushing to GitHub, then wire it up.
#
#   ./scripts/init-git.sh https://github.com/USERNAME/abzaro.git
#
# Safe to re-run: it skips steps that are already done.
set -euo pipefail

REMOTE_URL="${1:-}"

if [ ! -d .git ]; then
  echo "→ init"
  git init -q
else
  echo "→ git repo already initialised"
fi

git add -A
if git diff --cached --quiet; then
  echo "→ nothing new to commit"
else
  echo "→ commit"
  git -c user.name="Abzaro" -c user.email="dev@abzaro.ir" \
      commit -q -m "ابزارو: ۱۰ ابزار آنلاین فارسی با آماده‌سازی دیپلوی Netlify"
fi

git branch -M main 2>/dev/null || true

if [ -n "$REMOTE_URL" ]; then
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$REMOTE_URL"
  else
    git remote add origin "$REMOTE_URL"
  fi
  echo "→ remote: $REMOTE_URL"
  echo
  echo "حالا اجرا کنید:"
  echo "  git push -u origin main"
else
  echo
  echo "حالا repo را در GitHub بسازید و سپس:"
  echo "  git remote add origin https://github.com/USERNAME/abzaro.git"
  echo "  git push -u origin main"
fi
