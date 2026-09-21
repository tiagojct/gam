#!/bin/sh
# Shallow-clone the four family repositories into vendor/. The site is built
# from their canonical token files and never modifies them.
#
#   sh scripts/vendor.sh                 # current default branch of each
#   sh scripts/vendor.sh pequod=619982d  # pin one or more to a commit
#
# Pins are name=ref pairs; unpinned families follow their default branch.
set -eu
cd "$(dirname "$0")/.."
mkdir -p vendor

for fam in pequod glauca try-works ambergris; do
  ref=""
  for arg in "$@"; do
    case "$arg" in
      "$fam"=*) ref="${arg#*=}" ;;
    esac
  done
  dir="vendor/$fam"
  if [ ! -d "$dir/.git" ]; then
    git clone --quiet --depth 1 "https://github.com/tiagojct/$fam" "$dir"
  else
    git -C "$dir" fetch --quiet --depth 1 origin
    git -C "$dir" checkout --quiet --force FETCH_HEAD
  fi
  if [ -n "$ref" ]; then
    git -C "$dir" fetch --quiet --depth 1 origin "$ref"
    git -C "$dir" checkout --quiet --force FETCH_HEAD
  fi
  printf '%s %s\n' "$fam" "$(git -C "$dir" rev-parse --short HEAD)"
done
