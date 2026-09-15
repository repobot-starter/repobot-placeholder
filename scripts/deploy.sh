#!/usr/bin/env bash
# Break-glass manual deploy. The normal path is the GitHub Actions deploy
# workflow (same steps, OIDC auth). Usage: scripts/deploy.sh <dev|prod>
#
# Preconditions:
#   - firebase-tools authenticated (firebase login) with access to the target project
#   - DATABASE_URL for the target environment exported in the shell (for migrations)

source "$(dirname "$0")/lib/common.sh"
cd "$REPO_ROOT"

TARGET="${1:-}"
[ "$TARGET" = "dev" ] || [ "$TARGET" = "prod" ] || fail "Usage: deploy.sh <dev|prod>"
[ -n "${DATABASE_URL:-}" ] || fail "Export DATABASE_URL for the $TARGET database before deploying (used for migrations)."

PROJECT_ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('.firebaserc')).projects['$TARGET'])")
[[ "$PROJECT_ID" != your-* ]] || fail "Set the '$TARGET' project id in .firebaserc first."

log "Deploy plan for '$TARGET' (project $PROJECT_ID):"
log "  1. check:all (codegen, lint, build)"
log "  2. Apply SQL migrations to \$DATABASE_URL"
log "  3. firebase deploy --only functions,hosting"

bash scripts/check-all.sh
npm --workspace firebase/functions run migrate
npx firebase-tools deploy --only functions,hosting --project "$PROJECT_ID" --non-interactive

log "Deployed to $TARGET."
