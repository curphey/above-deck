#!/bin/bash
# check-plugins.sh — Ensures required plugin marketplaces are registered.
# Runs on SessionStart. stdout is injected into Claude's context.
# Project-level settings.json handles plugin enablement; this script ensures
# the marketplaces are available so those plugins can actually load.

KNOWN_MARKETPLACES_FILE="$HOME/.claude/plugins/known_marketplaces.json"

MISSING=()
AUTO_INSTALLED=()

check_marketplace() {
  local name="$1"
  local repo="$2"

  if [ -f "$KNOWN_MARKETPLACES_FILE" ] && grep -q "\"$name\"" "$KNOWN_MARKETPLACES_FILE" 2>/dev/null; then
    return 0
  fi

  # Try to auto-register
  if command -v claude &>/dev/null; then
    if claude plugin marketplace add "$repo" 2>/dev/null; then
      AUTO_INSTALLED+=("$name")
      return 0
    fi
  fi

  MISSING+=("$name — run: claude plugin marketplace add $repo")
  return 1
}

check_marketplace "voltagent-subagents" "VoltAgent/awesome-claude-code-subagents"
check_marketplace "superpowers-marketplace" "obra/superpowers-marketplace"

# --- Output (stdout → injected into Claude context) ---

if [ ${#AUTO_INSTALLED[@]} -gt 0 ]; then
  echo "SessionStart: Auto-registered plugin marketplaces: ${AUTO_INSTALLED[*]}"
fi

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "SessionStart: WARNING — Missing required plugin marketplaces for this project."
  echo "Please run the following commands and restart your session:"
  echo ""
  for m in "${MISSING[@]}"; do
    echo "  $m"
  done
fi

exit 0
