#!/usr/bin/env bash
# Mirror upstream releases (tag + title + body + assets) to this fork.
# Usage: mirror-releases.sh <upstream_repo> <fork_repo> [max_releases]
# Env: GH_TOKEN (required for asset download/upload)
set -e

UP="$1"
FORK="$2"
# Mirror only the most recent N releases (default 5) to keep runs fast;
# older releases are a one-time history migration, not needed incrementally.
MAX="${3:-5}"

UP_RELEASES=$(gh api "repos/$UP/releases?per_page=$MAX" --jq '.[] | select(.draft==false) | .tag_name')

for TAG in $UP_RELEASES; do
  # skip if fork already has this release
  if gh api "repos/$FORK/releases/tags/$TAG" >/dev/null 2>&1; then
    echo "skip $TAG"
    continue
  fi
  echo "mirror $TAG"

  # ensure tag exists on fork (use git push, gh api refs POST gets 403 with GITHUB_TOKEN)
  if ! gh api "repos/$FORK/git/refs/tags/$TAG" >/dev/null 2>&1; then
    git fetch "https://github.com/$UP.git" "refs/tags/$TAG:refs/tags/$TAG" 2>/dev/null || true
    git push "https://x-access-token:${GH_TOKEN}@github.com/$FORK.git" "refs/tags/$TAG:refs/tags/$TAG" 2>/dev/null || echo "  tag push failed (may exist)"
    echo "  tag ensured"
  fi

  # copy release (title/body/prerelease)
  UP_REL=$(gh api "repos/$UP/releases/tags/$TAG")
  NAME=$(echo "$UP_REL" | jq -r '.name')
  BODY=$(echo "$UP_REL" | jq -r '.body')
  PRE=$(echo "$UP_REL" | jq -r '.prerelease')
  python3 -c "
import json, subprocess, sys
name, body, pre, tag = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
payload = {'tag_name': tag, 'name': name, 'body': body, 'draft': False, 'prerelease': (pre == 'true')}
r = subprocess.run(['gh', 'api', 'repos/$FORK/releases', '-X', 'POST', '--input', '-'],
    input=json.dumps(payload), capture_output=True, text=True)
try:
    d = json.loads(r.stdout)
    print('  release id:', d.get('id', r.stdout[:100]))
except Exception as e:
    print('  release create failed:', r.stdout[:200], r.stderr[:200])
" "$NAME" "$BODY" "$PRE" "$TAG"

  REL_ID=$(gh api "repos/$FORK/releases/tags/$TAG" --jq '.id')

  # mirror assets (download from upstream, upload to fork)
  ASSETS=$(gh api "repos/$UP/releases/tags/$TAG" --jq '.assets[] | .name + "|" + .url')
  if [ -z "$ASSETS" ]; then
    echo "  no assets"
    continue
  fi
  echo "$ASSETS" | while IFS='|' read -r ANAME AURL; do
    echo "  asset: $ANAME"
    curl -sL -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/octet-stream" \
      -o /tmp/mirror-asset "$AURL"
    curl -sL -H "Authorization: Bearer $GH_TOKEN" \
      -H "Content-Type: application/octet-stream" \
      --data-binary @/tmp/mirror-asset \
      "https://uploads.github.com/repos/$FORK/releases/$REL_ID/assets?name=$ANAME" >/dev/null || true
    rm -f /tmp/mirror-asset
  done
done

echo "release mirror done"
