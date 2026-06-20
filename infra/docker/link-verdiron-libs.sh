#!/bin/sh
set -eu

DIST_LIBS="${1:?dist libs path required}"
NODE_MODULES="${2:?node_modules path required}"

for lib in config logger domain messaging persistence tracing; do
  if [ ! -d "${DIST_LIBS}/${lib}" ]; then
    continue
  fi

  mkdir -p "${NODE_MODULES}/@verdiron/${lib}"
  cp -r "${DIST_LIBS}/${lib}/." "${NODE_MODULES}/@verdiron/${lib}/"
done
