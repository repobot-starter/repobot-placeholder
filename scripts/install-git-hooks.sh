#!/usr/bin/env bash
# Install the repo git hooks (runs automatically via npm prepare).
set -euo pipefail
cd "$(dirname "$0")/.."
[ -d .git ] || exit 0
mkdir -p .git/hooks
cat > .git/hooks/pre-commit <<'HOOK'
#!/usr/bin/env bash
# Format staged files with prettier before committing.
set -euo pipefail
staged=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|mjs|json|md|gql|css)$' || true)
[ -z "$staged" ] && exit 0
echo "$staged" | xargs npx prettier --ignore-unknown --write
echo "$staged" | xargs git add
HOOK
chmod +x .git/hooks/pre-commit
