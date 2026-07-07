#!/bin/sh
set -e

# 挂载卷首次启动时,宿主机 ./data 可能属于 root,
# 这里以 root 启动 → 修好权限 → 降权到 nextjs 运行。
DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR"
chown -R nextjs:nodejs "$DATA_DIR" 2>/dev/null || true

exec su-exec nextjs:nodejs "$@"
