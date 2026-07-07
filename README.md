# 宝宝喂养助手 BabyHub

移动端优先的网页应用,帮新生儿家长快速记录喂奶、亲喂与换尿布。

## 功能

- 🥛 **瓶喂奶粉 / 瓶喂母乳** —— 步进器调奶量,带 60/90/120/150 ml 快捷标签
- 🤱 **亲喂计时器** —— 大号 mm:ss 计时,左/右侧切换,刷新后自动恢复
- 💩 **换尿布** —— 尿尿 / 便便可同时勾选,便便量分偏少 / 中等 / 偏多
- 📋 **历史时间线** —— 按天分组,可编辑、删除
- 📊 **统计图表** —— 近 7 / 30 天:瓶喂总量、亲喂分钟、尿布次数
- 🔐 **访问码登录** —— httpOnly cookie,30 天有效
- 📱 **PWA** —— iOS / Android 可「添加到主屏幕」全屏运行
- 🌙 **深色模式** —— 跟随系统,深夜喂奶友好

## 技术栈

- Next.js 14 (App Router) + TypeScript
- better-sqlite3(本地文件 `data/baby.db`)
- Tailwind CSS + lucide-react
- recharts(图表)
- zod(API 校验)
- dayjs(中文时间)

## 启动

```bash
# 1. 安装依赖
npm install

# 2. 配置访问码与会话密钥
cp .env.example .env.local
# 编辑 .env.local,设置 ACCESS_CODE 和 SESSION_SECRET(任意长字符串)

# 3. 开发模式
npm run dev
# 浏览器打开 http://localhost:3000

# 4. 生产构建
npm run build && npm start
```

数据库文件位于 `data/baby.db`,首次启动会自动创建。

## 部署到家庭服务器

```bash
npm run build
PORT=3000 npm start
```

或用 PM2:

```bash
npm install -g pm2
pm2 start npm --name babyhub -- start
pm2 save
```

更新流程

```bash
git pull
npm install
npm run build
pm2 restart babyhub
```


家人手机连家庭 Wi-Fi 后通过服务器 IP 访问;若要外网访问推荐用 Cloudflare Tunnel / Tailscale。

## Docker 部署

镜像通过 GitHub Actions 自动构建并同时推送到 **GitHub Container Registry(ghcr.io)** 与 **Docker Hub**,支持 `linux/amd64` 与 `linux/arm64`。每次推送到 `main`/`master` 或打 `v*` tag 时都会触发构建,workflow 定义在 `.github/workflows/docker.yml`。

镜像地址:

- `ghcr.io/karllao/babyhub:latest`
- `docker.io/karllao/babyhub:latest`

### 方式一:docker run

```bash
mkdir -p ./data
docker run -d \
  --name babyhub \
  --restart unless-stopped \
  -p 3000:3000 \
  -e ACCESS_CODE=baby2026 \
  -e SESSION_SECRET=please-change-this-to-a-long-random-string \
  -e DB_PATH=/data/baby.db \
  -v $(pwd)/data:/data \
  karllao/babyhub:latest
```

### 方式二:docker compose

仓库根目录已提供 `docker-compose.yml`:

```bash
# 建议在同目录创建 .env 写入 ACCESS_CODE / SESSION_SECRET
docker compose pull
docker compose up -d
```

更新到最新镜像:

```bash
docker compose pull && docker compose up -d
```

### 本地自行构建

```bash
docker build -t babyhub:local .
# 或使用 compose 中被注释掉的 build: . 段
```

数据持久化在宿主机 `./data` 目录(挂载到容器 `/data`),备份该目录即可。首次访问前请务必修改 `ACCESS_CODE` 与 `SESSION_SECRET`。

### 常见问题

**登录成功后进不了首页 / `./data` 目录一直是空的**

一般是宿主机挂载目录权限不对导致容器无法写 SQLite。容器内使用 uid/gid `1001` 运行,启动脚本已自动 `chown /data`,如仍失败请在宿主执行:

```bash
sudo chown -R 1001:1001 ./data
docker compose restart   # 或 docker restart babyhub
```

首次成功启动后 `./data/baby.db`(以及 `baby.db-wal` / `baby.db-shm`)会出现。

## 数据备份

直接备份 `data/baby.db` 文件即可,SQLite 单文件 + WAL 模式安全。

## 目录结构

```
app/
  (app)/        # 受保护路由组(首页、记录、历史、统计、设置)
  api/          # API Routes(feeds / diapers / stats / today / auth)
  login/        # 登录页
components/     # 业务组件
lib/            # db / auth / time 工具
middleware.ts   # 全局鉴权
data/           # SQLite 文件(运行时生成,已 gitignore)
```
