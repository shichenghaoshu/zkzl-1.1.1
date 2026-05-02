# 课游AI - AI 互动游戏课件平台

「课游AI」是一个面向小学老师、教培机构和教育产品评审场景的 AI 互动游戏课件平台体验版。它展示了从老师输入知识点，到调用管理员配置的 AI 通道生成游戏课件，再到老师编辑、快速分享、学生免下载参与、游戏化闯关、班级数据报告，以及后台 API 和码库运营管理的完整产品闭环。

本项目是前端体验版加本地 DeepSeek 代理。当前版本不接真实数据库、不接真实支付；AI 生成会使用 Ops 管理员后台配置的 DeepSeek API，由同源 `/api/ai/*` 本地代理请求 DeepSeek。登录、邀请码、核销码、用量、数据库表和审计日志通过 mock 数据与浏览器 `localStorage` 模拟。

## 核心价值

- 老师输入知识点，一键生成可玩的互动游戏课件。
- 学生通过链接、二维码或 PIN 码进入课堂，无需下载 App。
- 老师可以在课件编辑器中改题、换关卡、调顺序。
- 课堂中有闯关地图、拖拽分类、配对连线、竞速答题、翻卡记忆、排序挑战、星星金币奖励。
- 课后自动沉淀参与率、正确率、排行榜和薄弱知识点。
- 通过邀请码控制老师注册登录。
- 支持月付用户核销月度生成额度。
- 支持次付用户核销点券。
- Ops 后台可管理 AI API 配置、邀请码库、核销码库和模拟数据库。

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- 本地状态与 `localStorage` 模拟数据库
- DeepSeek Chat Completions 生成代理
- CSS / emoji / SVG-like CSS 图形实现可爱教育科技视觉

本地开发和预览时，Vite 会挂载 `/api/ai/*` 代理；生产环境应把这部分迁移到后端或服务端函数中保存密钥。

## 快速开始

### 环境要求

- Node.js 18 或以上
- npm

### 安装依赖

```bash
npm install
```

### 启动开发服务

```bash
npm run dev
```

默认访问：

```text
http://localhost:5173/
```

如需指定端口：

```bash
npm run dev -- --port 5173
```

### 配置 DeepSeek

1. 打开 `/login`，使用管理员账号登录：账号 `admin`，密码 `keyou2026`。
2. 进入 `/ops` 的「AI API管理」。
3. 将 Base URL 设为 `https://api.deepseek.com`，模型可用 `deepseek-chat`。
4. 填入真实 DeepSeek API Key，点击「保存 DeepSeek 配置」。
5. 点击「测试连接」，通过后进入 `/generate` 生成课件。

配置会写入本机 `.keyou-ai-provider.local.json`，该文件已加入 `.gitignore`，不会提交到仓库。也可以用环境变量 `DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`、`DEEPSEEK_BASE_URL` 启动服务。

老师端和生成页不展示 API Key、Base URL 或模型设置；只有 Ops 管理员界面可以保存和测试 DeepSeek。

### 类型检查

```bash
npm run typecheck
```

### 生产构建

```bash
npm run build
```

### 服务器部署启动

```bash
npm run build
PORT=4173 HOST=0.0.0.0 npm run start
```

真实 DeepSeek Key 不提交到 git。生产后端会按优先级读取：

1. 服务器环境变量：`DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`、`DEEPSEEK_BASE_URL`。
2. 服务器本地文件：`.env.production.local`、`.env.local`、`.env`。
3. 服务器本地后端配置：`.keyou-ai-provider.local.json`。

推荐在服务器项目根目录创建 `.env.production.local`，并设置 `600` 权限：

```bash
cat > .env.production.local <<'EOF'
DEEPSEEK_API_KEY=你的真实 DeepSeek Key
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
KEYOU_ADMIN_USERNAME=admin
KEYOU_ADMIN_PASSWORD=请换成强密码
EOF
chmod 600 .env.production.local
```

不要把 `.env.production.local`、`.env` 或 `.keyou-ai-provider.local.json` 上传到 git。当前 `.gitignore` 已覆盖这些文件。

当前仓库的 GitHub Actions 会部署到 `savegpa.online`。需要以下 Secrets：

- `SAVEGPA_SSH_HOST`、`SAVEGPA_SSH_USER`、`SAVEGPA_SSH_KEY`：连接服务器。
- `SAVEGPA_SUDO_PASSWORD`：可选；如果部署用户没有免密 sudo，用它创建 systemd 服务和更新 Nginx。
- `DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`、`DEEPSEEK_BASE_URL`：写入服务器本地 `.env.production.local`。
- `KEYOU_ADMIN_USERNAME`、`KEYOU_ADMIN_PASSWORD`：管理员 `/ops` 登录。

部署流水线会上传完整生产运行包，在服务器创建 `savegpa` systemd 服务，并把 Nginx 的 `/api/ai/*` 代理到 `127.0.0.1:4173`。不要再只部署 `dist` 静态目录。

生产服务由 `server/productionServer.mjs` 提供，会同时处理：

- `/api/ai/*`：DeepSeek 会话、配置、测试连接、生成课件。
- 其他路径：返回 `dist` 静态文件，并对前端路由做 SPA fallback。

如果要使用真实 AI，服务器不能只部署 `dist` 静态目录；必须运行上面的 Node 服务，或把 `/api/ai/*` 反向代理到这个 Node 服务。否则 `/api/ai/session` 会被静态站点 fallback 成 `index.html`，登录页会拿到 HTML 而不是 JSON。

Nginx 反向代理示例：

```nginx
location / {
  proxy_pass http://127.0.0.1:4173;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 本地预览构建产物

```bash
npm run preview
```

`npm run preview` 适合本机检查构建产物；服务器长期运行建议用 `npm run start`。

## 推荐演示路径

评委或老师可以按以下路径在 1 分钟内理解产品闭环。

1. 打开首页 `/teacher-dashboard`
2. 未登录时进入邀请码登录页 `/login`
3. 使用邀请码登录
4. 进入老师端首页
5. 点击「新建游戏课件」
6. 在 AI 生成课件向导中点击「一键生成游戏课」
7. 查看生成 loading 动画
8. 进入课件编辑器，体验拖拽分类题
9. 点击「分享」
10. 查看链接、二维码、PIN 码、微信群分享预览
11. 点击「开始上课」
12. 学生端输入昵称并加入课堂
13. 进入学生端游戏地图，体验关卡和答题反馈
14. 点击「完成课堂，查看报告」
15. 查看班级数据报告
16. 进入 `/backend` 免登录生成邀请码，登录后可核销权益
17. 进入 `/ops` 使用管理员账号登录，查看模拟数据库、AI API、邀请码和核销码管理

## 页面路由

| 路由 | 页面 | 是否需要老师登录 | 说明 |
| --- | --- | --- | --- |
| `/` | 默认入口 | 是 | 默认进入老师端首页逻辑 |
| `/login` | 邀请码注册登录 | 否 | 使用邀请码注册或登录老师账号 |
| `/teacher-dashboard` | 老师端首页 | 是 | 最近课件、快捷操作、账户权益 |
| `/generate` | AI 生成课件向导 | 是 | 输入知识点并调用管理员配置的 AI 通道 |
| `/editor` | 课件编辑器 | 是 | 三栏编辑器与互动题预览 |
| `/share` | 快速分享与班级发布 | 是 | 链接、二维码、PIN 码、班级发布 |
| `/student` | 学生端加入页 | 否 | 学生输入昵称和 PIN 码进入课堂 |
| `/play` | 学生端游戏课件页 | 否 | 闯关地图、拖拽分类、竞速答题 |
| `/report` | 班级数据报告 | 是 | 参与人数、完成率、正确率、排行榜 |
| `/backend` | 权益与核销中心 | 否 | 免登录生成邀请码；登录后核销、查看权益 |
| `/ops` | Ops 运营后台 | 否 | 独立管理员登录；登录后管理 AI API、邀请码、核销码和数据库 |

## 体验账号与权益

### 内置邀请码

可在 `/login` 使用以下邀请码：

| 邀请码 | 类型 | 初始权益 |
| --- | --- | --- |
| `KEYOU-DEMO-2026` | 试用账户 | 20 次月度生成额度，120 点券 |
| `MONTH-TEACHER-2026` | 月付用户 | 300 次月度生成额度 |
| `POINTS-ORG-2026` | 次付点券 | 1000 点券 |

### 内置管理员账号

| 账号 | 密码 | 权限 |
| --- | --- | --- |
| `admin` | `keyou2026` | 进入 `/ops` 管理 DeepSeek、用户点数、套餐、邀请码、核销码 |

### 生成课件扣减规则

| 账户类型 | 生成一次课件扣减 |
| --- | --- |
| 试用账户 | 月度生成额度 -1 |
| 月付用户 | 月度生成额度 -1 |
| 次付点券 | 点券 -80 |

如果额度不足，生成页会提示到后端配置中心核销月付码或点券码。

### 内置核销码

可在 `/backend` 的「月付 / 点券核销中心」使用，也可在 `/ops` 生成新核销码。

| 核销码 | 类型 | 效果 |
| --- | --- | --- |
| `MONTH-735921` | 月付核销码 | 开通 31 天月付权益，增加 300 次生成额度 |
| `MONTH-PLUS-888` | 月度加量码 | 增加 800 次生成额度 |
| `POINT-1000-KY` | 点券核销码 | 增加 1000 点券 |
| `POINT-300-DEMO` | 体验点券码 | 增加 300 点券 |

核销成功后会更新当前账户权益，并写入模拟数据库的 `usage_logs` 和 `audit_logs`。

### 套餐计划

| 套餐 | 初始月额度 | 初始点数 | 扣减规则 |
| --- | ---: | ---: | --- |
| 试用套餐 | 20 | 120 | 生成一次扣 1 次月额度 |
| 机构月付 | 300 | 0 | 生成一次扣 1 次月额度 |
| 点数套餐 | 0 | 1000 | 生成一次扣 80 点 |

## 功能模块说明

### 1. 老师端首页

入口：`/teacher-dashboard`

功能：

- 展示欢迎卡片：欢迎回来，王老师。
- 展示最近课件：分数闯关、动物分类、单词翻卡。
- 提供快捷操作：生成新课件、导入 PPT / PDF、创建班级、登录 / 核销。
- 展示当前账户权益：套餐类型、月额度、点券余额。
- 引导进入 AI 生成、分享、权益核销。

### 2. AI 生成课件向导

入口：`/generate`

功能：

- 输入课题：新建课件不预填默认课题，需要老师主动填写。
- 选择学段：小学低段、小学中段、小学高段。
- 选择学科：数学、英语、语文、科学、班会、道法。
- 选择课程类型：数学复习、英语单词、语文识字、科学分类、班会安全、古诗背诵、口算训练、教培体验课、公开展示课。
- 选择游戏形式：闯关地图、竞速答题、拖拽分类、配对连线、翻卡记忆、排序挑战、情景故事、小组抢答。
- 设置班级人数。
- 查看 AI 生成结果预览。
- 点击「一键生成游戏课」后请求本地 DeepSeek 代理，并显示带进度条的生成动画。
- AI 成功返回结构化课件后，再根据当前账户权益扣减月额度或点券。
- DeepSeek 返回的课件会写入当前课件状态，进入编辑器后可继续修改。

生成阶段：

- AI 正在分析知识点
- AI 正在设计关卡
- AI 正在生成题目
- AI 正在匹配游戏模板

### 3. 课件编辑器

入口：`/editor`

功能：

- 左栏：关卡 / 页面列表。
- 中间：实时预览画布。
- 右栏：内容设置。
- 支持切换关卡。
- 支持编辑 AI 生成的关卡标题、关卡描述、题目、选项、正确答案、答案解释、奖励星星、时间限制、难度设置。
- 生成课件会保存到 `localStorage`，编辑后的内容会继续作为当前课件使用。
- 内置拖拽分类题，移动端用「先点分数，再点分类框」模拟拖拽。
- 正确时显示星星奖励。
- 错误时提示「再想一想哦」。

### 4. 快速分享与班级发布

入口：`/share`

功能：

- 展示课堂分享标题：分数闯关挑战。
- 如果已生成或编辑课件，分享页会使用当前课件标题和关卡数量。
- 使用标签页拆分分享方式：
  - 链接
  - 二维码下载
  - 课堂 PIN
  - 班级发布
- 发布到班级：三年级2班。
- 提供微信群、家长群、投屏大屏和 PIN 码通知的复制文案。

### 5. 学生端加入页

入口：`/student`

功能：

- 学生无需登录。
- 输入昵称。
- 输入班级 PIN 码。
- 点击「立即加入」后展示加入成功状态。
- 点击「开始闯关」进入游戏课件页。

### 6. 学生端游戏课件页

入口：`/play`

功能：

- 展示当前课件的闯关地图。
- 展示学生状态：头像、昵称、星星、金币。
- 展示进度条和当前课件关卡。
- 内置多种互动游戏组件：
  - 拖拽分类游戏
  - 配对挑战
  - 竞速答题游戏
  - 翻卡学习
  - 排序挑战
  - 记忆翻牌
- 答对显示闯关成功、获得星星、金币增加。
- 答错显示再试一次和解析。

### 7. 班级数据报告

入口：`/report`

功能：

- 顶部数据卡片：
  - 参与人数：38 人
  - 完成率：92%
  - 平均正确率：84%
  - 最受欢迎关卡：第 2 关
- 中部可视化：
  - 各关卡正确率柱状图
  - 参与状态环形图
  - 课堂之星排行榜
- 底部：
  - 薄弱知识点
  - 老师建议

### 8. 权益与核销中心

入口：`/backend`

面向老师、学校机构账号和未登录访客。

功能：

- 未登录也可以生成邀请码。
- 登录后查看当前账户权益：
  - 账户类型
  - 月额度剩余
  - 点券余额
  - 月度使用进度
- 生成邀请码。
- 登录后核销月付码或点券码。
- 快速进入独立 Ops 管理员入口。

### 9. Ops 运营后台

入口：`/ops`

面向平台运营和内部管理。

功能：

- 独立管理员登录，不复用老师端 `/login`。
- DeepSeek API 管理：
  - 通道名称
  - 供应商
  - Base URL
  - 默认模型
  - API Key
  - 每日限额
  - 启用 / 停用状态
  - 保存到本地 DeepSeek 代理
  - 通过代理测试连接
- 用户点数：
  - 调整租户套餐
  - 调整月度生成额度
  - 调整点数余额
  - 启用 / 暂停租户
- 套餐计划：
  - 查看试用、机构月付、点数套餐
  - 查看每种套餐的额度和扣减规则
- 邀请码库：
  - 生成邀请码
  - 写入 `invite_codes`
  - 启用 / 停用邀请码
- 核销码库：
  - 生成月付核销码
  - 生成点券核销码
  - 写入 `redeem_codes`
  - 启用 / 停用核销码
- 数据库表：
  - 查看表数量
  - 查看完整 JSON 预览
- 日志：
  - `usage_logs`
  - `audit_logs`

## 模拟数据库设计

当前数据库由 `src/data/mockDatabase.ts` 提供，通过 `localStorage` 持久化。

### localStorage keys

| Key | 说明 |
| --- | --- |
| `keyou-auth-user` | 当前登录老师账户 |
| `keyou-usage-account` | 当前账户权益 |
| `keyou-account-store` | 按邀请码持久化的账户权益，避免重复登录重置额度 |
| `keyou-redeemed-codes` | 当前浏览器会话已核销码 |
| `keyou-ops-database` | Ops 模拟数据库 |
| `keyou-generated-lesson` | 当前生成并编辑过的课件 |
| `keyou-ai-session-token` | 本地 AI 代理会话 token |

### 表结构

#### api_providers

AI API 通道配置表。

字段：

- `id`
- `name`
- `provider`
- `baseUrl`
- `model`
- `apiKey`
- `secretStored`
- `enabled`
- `dailyLimit`
- `monthlyCostCap`
- `updatedAt`

#### invite_codes

邀请码表。

字段：

- `code`
- `name`
- `plan`
- `monthlyQuota`
- `points`
- `valid`

#### redeem_codes

核销码表。

字段：

- `code`
- `type`
- `label`
- `monthlyQuota`
- `points`
- `durationDays`
- `active`
- `used`
- `usedAt`
- `tenantName`
- `createdAt`

#### tenants

租户表。

字段：

- `id`
- `name`
- `plan`
- `owner`
- `status`
- `monthlyQuota`
- `points`

#### usage_logs

用量记录表。

字段：

- `id`
- `tenantName`
- `action`
- `cost`
- `status`
- `createdAt`

#### audit_logs

审计日志表。

字段：

- `id`
- `actor`
- `action`
- `target`
- `createdAt`

## 项目结构

```text
.
├── index.html
├── package.json
├── tailwind.config.ts
├── vite.config.ts
├── src
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── DataChart.tsx
│   │   ├── DragClassifyGame.tsx
│   │   ├── FlashcardGame.tsx
│   │   ├── GameMap.tsx
│   │   ├── Layout.tsx
│   │   ├── MatchGame.tsx
│   │   ├── Mascot.tsx
│   │   ├── MemoryGame.tsx
│   │   ├── OrderingGame.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── QRCodeMock.tsx
│   │   ├── QuizRaceGame.tsx
│   │   └── Sidebar.tsx
│   ├── data
│   │   ├── generationOptions.ts
│   │   ├── mockClassData.ts
│   │   ├── mockCommerce.ts
│   │   ├── mockDatabase.ts
│   │   ├── mockLessons.ts
│   │   └── routes.ts
│   ├── pages
│   │   ├── AuthPage.tsx
│   │   ├── BackendConsole.tsx
│   │   ├── ClassReport.tsx
│   │   ├── GenerateLesson.tsx
│   │   ├── LessonEditor.tsx
│   │   ├── OpsConsole.tsx
│   │   ├── ShareLesson.tsx
│   │   ├── StudentJoin.tsx
│   │   ├── StudentPlay.tsx
│   │   └── TeacherDashboard.tsx
│   └── styles
│       └── globals.css
├── server
│   ├── deepseekLessonApi.ts
│   ├── deepseekLessonApi.test.ts
│   ├── lessonPrompt.ts
│   └── productionServer.mjs
├── prompts
│   └── deepseek-lesson-generation.skill.md
└── README.md
```

## 前端主要文件

如果要把前端交给其他 AI 改，优先给这些文件：

- `src/App.tsx`：路由、登录态、权益状态、生成课件状态、页面装配。
- `src/data/routes.ts`：侧边栏和页面路径。
- `src/pages/AuthPage.tsx`：老师邀请码注册 / 登录页。
- `src/pages/BackendConsole.tsx`：公开邀请码生成、登录后权益核销页。
- `src/pages/OpsLoginPage.tsx`：独立管理员登录页。
- `src/pages/OpsConsole.tsx`：管理员后台，管理 DeepSeek、用户点数、套餐、邀请码、核销码。
- `src/pages/GenerateLesson.tsx`：AI 生成课件向导。
- `src/pages/LessonEditor.tsx`：生成后可编辑的课件编辑器。
- `src/pages/ShareLesson.tsx`、`src/pages/StudentPlay.tsx`：分享和学生端使用当前课件。
- `src/components/`：按钮、卡片、布局、游戏组件等通用 UI。
- `src/services/lessonAi.ts`：前端请求 `/api/ai/*` 的 AI 服务封装。

## 关键代码说明

### App.tsx

负责：

- 当前路由状态。
- 登录态状态。
- 权益账户状态。
- 已核销码状态。
- Ops 模拟数据库状态。
- 受保护路由判断。
- 登录、退出登录、生成扣减、核销、生成 API 凭证。
- 将页面组合到统一 Layout。

### mockCommerce.ts

负责：

- 账户套餐类型。
- 套餐计划定义。
- 邀请码数据结构。
- 管理员账号数据结构。
- 用户数据结构。
- 用量账户数据结构。
- 核销码数据结构。
- 邀请码登录逻辑。
- 月额度和点券扣减。
- 核销码核销逻辑。

### mockDatabase.ts

负责：

- 模拟数据库初始化。
- 从 `localStorage` 读取数据库。
- 创建邀请码记录。
- 创建月付 / 点券核销码记录。
- 写入审计日志。
- 写入使用日志。

### OpsConsole.tsx

负责：

- 平台侧管理 AI API。
- 平台侧管理用户点数和套餐。
- 平台侧生成邀请码。
- 平台侧生成核销码。
- 展示模拟数据库表。
- 展示审计和使用日志。

### server/deepseekLessonApi.ts

负责：

- 提供本地 `/api/ai/*` Vite 代理。
- 建立老师和管理员 AI 会话。
- 只允许管理员保存和测试 DeepSeek 配置。
- 从 `.keyou-ai-provider.local.json` 或环境变量读取 DeepSeek Key。
- 调用 DeepSeek Chat Completions 并归一化为可编辑课件 JSON。

### server/productionServer.mjs

负责：

- 服务器部署时运行 `dist` 静态文件和 `/api/ai/*` 代理。
- 避免生产静态部署把 `/api/ai/session` fallback 成 `index.html`。
- 支持 `PORT`、`HOST`、`DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`、`DEEPSEEK_BASE_URL` 环境变量。
- 支持 `KEYOU_ADMIN_USERNAME`、`KEYOU_ADMIN_PASSWORD` 覆盖默认管理员账号。
- 自动读取服务器本地 `.env.production.local` / `.env.local` / `.env`，这些文件只留在服务器。

### server/lessonPrompt.ts 与 prompts/deepseek-lesson-generation.skill.md

负责：

- 维护每次生成使用的 skill 名称、版本和输出合同。
- 维护完整 prompt 结构。
- 约束 DeepSeek 返回 5 个可编辑关卡、题目、选项、答案、讲解和奖励。

### BackendConsole.tsx

负责：

- 查看当前账户权益。
- 核销月付码或点券码。
- 生成邀请码。

## 视觉风格

整体视觉参考了高质量儿童教育科技产品：

- 天空蓝、薄荷绿、阳光黄、珊瑚橙、紫色点缀。
- 圆润卡片和按钮。
- 柔和阴影。
- 云朵、星星、金币、城堡、奖杯等游戏化元素。
- 统一 AI 小熊吉祥物。
- 老师端偏清晰专业。
- 学生端偏可爱游戏化。
- Ops 后台在保持品牌视觉的同时提高信息密度。

## 当前限制

当前项目是产品体验版，不是生产系统。

- 没有生产级后端和真实数据库；当前只有本地 DeepSeek 代理。
- 没有真实数据库。
- 没有真实支付。
- 没有真实短信、邮箱或微信分享。
- 没有真实账号密码系统。
- `localStorage` 中的数据只适合同一浏览器演示；跨设备真实同步需要后端数据库。
- DeepSeek API Key 只保存在服务器环境变量、服务器本地 env 文件或本地代理配置文件中；前端不会保存真实 Key，git 也不会提交真实 Key。生产环境仍建议接入正式密钥管理、租户隔离和审计。

## 接入真实后端的建议

后续如果要生产化，可以按以下方式扩展。

### 后端服务

建议新增：

- Node.js / NestJS / Fastify 后端
- PostgreSQL 数据库
- Redis 缓存和限流
- 对象存储用于课件资源和导出文件
- 队列系统用于 AI 生成任务

### 数据库表

建议落地表：

- `users`
- `tenants`
- `classes`
- `students`
- `lessons`
- `lesson_scenes`
- `questions`
- `sessions`
- `participants`
- `answers`
- `api_providers`
- `api_keys`
- `invite_codes`
- `redeem_codes`
- `usage_accounts`
- `usage_logs`
- `audit_logs`

### API

建议实现：

- `POST /api/auth/invite-login`
- `POST /api/auth/logout`
- `GET /api/me`
- `POST /api/lessons/generate`
- `GET /api/lessons/:id`
- `PATCH /api/lessons/:id`
- `POST /api/lessons/:id/share`
- `POST /api/sessions/join`
- `POST /api/sessions/:id/answer`
- `GET /api/sessions/:id/report`
- `POST /api/billing/redeem`
- `GET /api/ops/api-providers`
- `POST /api/ops/api-providers`
- `PATCH /api/ops/api-providers/:id`
- `POST /api/ops/invite-codes`
- `PATCH /api/ops/invite-codes/:code`
- `POST /api/ops/redeem-codes`
- `PATCH /api/ops/redeem-codes/:code`

### 权限设计

建议拆分角色：

- `teacher`：创建课件、发起课堂、查看自己班级报告。
- `tenant_admin`：管理机构额度、API 凭证、班级和老师。
- `ops_admin`：管理全平台 API 通道、码库、租户、审计日志。
- `student`：免登录或轻登录参与课堂。

### AI 生成链路

建议生成流程：

1. 老师提交知识点、学段、学科、玩法、班级人数。
2. 后端校验登录态和权益余额。
3. 扣减额度或冻结额度。
4. 写入生成任务。
5. 调用 AI API。
6. 生成结构化课件 JSON。
7. 写入 `lessons`、`lesson_scenes`、`questions`。
8. 返回课件编辑器。
9. 如果生成失败，回滚或返还额度。

### 核销链路

建议核销流程：

1. 用户输入核销码。
2. 后端检查码是否存在。
3. 检查是否启用。
4. 检查是否已使用。
5. 检查是否匹配租户或套餐。
6. 更新账户权益。
7. 标记核销码已使用。
8. 写入 `usage_logs` 和 `audit_logs`。

## 常见问题

### 页面跳到登录页怎么办？

老师端、后台和报告页需要登录。使用以下邀请码之一即可：

```text
KEYOU-DEMO-2026
MONTH-TEACHER-2026
POINTS-ORG-2026
```

学生端 `/student` 和 `/play` 不需要登录。

Ops 管理员后台需要管理员账号：

```text
admin / keyou2026
```

### 如何恢复初始数据？

进入 `/ops`，点击「重置模拟数据库」。

也可以在浏览器开发者工具中清除以下 `localStorage`：

```text
keyou-auth-user
keyou-usage-account
keyou-account-store
keyou-redeemed-codes
keyou-ops-database
```

### 为什么核销码提示已使用？

核销码会在当前浏览器会话中标记为已使用，防止重复核销。可以：

- 换一个核销码。
- 在 `/ops` 生成新的核销码。
- 点击「重置模拟数据库」恢复初始数据。

### 为什么默认 AI 不能生成？

默认种子数据使用 `sk-demo-...` 占位密钥，不会伪装成真实生成。请使用管理员账号进入 `/ops`，在 AI API 管理中填入真实 DeepSeek Base URL、模型和 API Key，保存并测试连接通过后再到 `/generate` 生成课件。

### 可以部署到静态网站吗？

纯静态部署只能展示界面，不能保护 DeepSeek Key，也不能调用 `/api/ai/*`。如果要线上真实生成，请在服务器运行：

```bash
npm run build
PORT=4173 HOST=0.0.0.0 npm run start
```

或者让 Nginx/网关把 `/api/ai/*` 代理到这个 Node 服务，不能把 `/api/ai/*` fallback 到 `index.html`。

## 验证记录

当前版本已执行：

```bash
npm test
npm run typecheck
npm run build
```

验证结果：

- 单元测试通过：6 个测试文件，38 个测试用例。
- TypeScript 类型检查通过。
- Vite 生产构建通过。
- `npm run start` 生产服务已验证 `/`、`/login`、`/student`、`/play` 返回前端页面。
- Chrome headless 已验证未登录访问 `/generate` 会进入 `/login`，并保留登录后返回「AI课件生成」的提示。
- Chrome headless 已用移动视口截图检查 `/student`，页面可加载且学生端首屏适配手机。
- Claude Code 只读 code review 已执行两轮，修复了首轮发现的登录后回跳问题，第二轮无阻断问题。

浏览器中已验证核心页面可加载，包括：

- `/teacher-dashboard`
- `/generate`
- `/editor`
- `/share`
- `/student`
- `/play`
- `/report`
- `/backend`
- `/ops`

## License

仅用于产品体验、教学演示和原型验证。生产使用前需要补充真实后端、权限、安全、日志、数据合规和商业授权。
