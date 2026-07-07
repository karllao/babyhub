#!/bin/sh
set -e

DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR"

# 启动诊断:确认关键环境变量能被 Node 读到(值不打印,只打印是否设置 + 长度)
node -e "
const keys = ['ACCESS_CODE','SESSION_SECRET','DB_PATH','PORT','HOSTNAME','NODE_ENV'];
console.log('[babyhub] runtime env check:');
for (const k of keys) {
  const v = process.env[k];
  if (k === 'ACCESS_CODE' || k === 'SESSION_SECRET') {
    console.log('  ' + k + ': ' + (v ? 'set (len=' + v.length + ')' : 'MISSING'));
  } else {
    console.log('  ' + k + ': ' + (v ?? 'MISSING'));
  }
}
if (!process.env.ACCESS_CODE || !process.env.SESSION_SECRET) {
  console.error('[babyhub] FATAL: ACCESS_CODE 或 SESSION_SECRET 未设置,登录必然失败。请检查 docker-compose 的 environment 段或 -e 参数。');
  process.exit(1);
}
if (process.env.SESSION_SECRET.length < 8) {
  console.error('[babyhub] FATAL: SESSION_SECRET 长度必须 >= 8。');
  process.exit(1);
}
"

exec "$@"
