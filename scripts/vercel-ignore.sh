#!/bin/bash
# Vercel's Ignored Build Step: exit 0 skips the build, exit 1 builds.
# Every build is kept as a deployment and counts toward the account's deployment storage,
# so only main is built, and only when something the site is built from changed.

if [ "$VERCEL_GIT_COMMIT_REF" != "main" ]; then
  echo "Branch $VERCEL_GIT_COMMIT_REF: no preview build."
  exit 0
fi

# Compare with the last deployed commit, so a push of several commits is judged as a whole.
BASE="$VERCEL_GIT_PREVIOUS_SHA"
if [ -z "$BASE" ] || ! git cat-file -e "$BASE^{commit}" 2>/dev/null; then
  BASE="HEAD^"
fi

# Files the site isn't built from: Claude's skills, docs, Supabase SQL and tests, root notes.
if git diff --quiet "$BASE" HEAD -- . \
  ':(exclude).claude' \
  ':(exclude)docs' \
  ':(exclude)supabase' \
  ':(exclude,glob)*.md' \
  ':(exclude).mcp.json' \
  ':(exclude)skills-lock.json'; then
  echo "Only files outside the site changed: no build."
  exit 0
fi

# Anything else, including a failed diff, builds.
exit 1
