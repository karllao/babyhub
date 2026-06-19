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
