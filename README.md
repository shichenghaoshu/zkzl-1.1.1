# 课游AI - AI 互动游戏课件平台 Demo

「课游AI」是一个面向小学老师、教培机构和教育产品评审场景的 AI 互动游戏课件平台 Demo。它展示了从老师输入知识点，到 AI 模拟生成游戏课件，再到老师编辑、快速分享、学生免下载参与、游戏化闯关、班级数据报告，以及后台 API 和码库运营管理的完整产品闭环。

本项目是纯前端 Demo。当前版本不接真实后端、不接真实 AI API、不接真实数据库、不接真实支付。所有登录、邀请码、核销码、用量、API 配置、数据库表和审计日志都通过 mock 数据与浏览器 `localStorage` 模拟。

## 核心价值

- 老师输入知识点，一键生成可玩的互动游戏课件。
- 学生通过链接、二维码或 PIN 码进入课堂，无需下载 App。
- 老师可以在课件编辑器中改题、换关卡、调顺序。
- 课堂中有拖拽分类、竞速答题、地图闯关、星星金币奖励。
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
- CSS / emoji / SVG-like CSS 图形实现可爱教育科技视觉

未使用真实后端服务，方便静态部署、产品演示和快速迭代。

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

### 类型检查

```bash
npm run typecheck
```

### 生产构建

```bash
npm run build
```

### 本地预览构建产物

```bash
npm run preview
```

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
16. 进入 `/backend` 查看后端/API 配置与核销中心
17. 进入 `/ops` 查看模拟数据库、AI API、邀请码和核销码管理

## 页面路由

| 路由 | 页面 | 是否需要老师登录 | 说明 |
| --- | --- | --- | --- |
| `/` | 默认入口 | 是 | 默认进入老师端首页逻辑 |
| `/login` | 邀请码注册登录 | 否 | 使用邀请码注册或登录老师账号 |
| `/teacher-dashboard` | 老师端首页 | 是 | 最近课件、快捷操作、账户权益 |
| `/generate` | AI 生成课件向导 | 是 | 输入知识点并模拟 AI 生成 |
| `/editor` | 课件编辑器 | 是 | 三栏编辑器与互动题预览 |
| `/share` | 快速分享与班级发布 | 是 | 链接、二维码、PIN 码、班级发布 |
| `/student` | 学生端加入页 | 否 | 学生输入昵称和 PIN 码进入课堂 |
| `/play` | 学生端游戏课件页 | 否 | 闯关地图、拖拽分类、竞速答题 |
| `/report` | 班级数据报告 | 是 | 参与人数、完成率、正确率、排行榜 |
| `/backend` | 后端/API 配置中心 | 是 | 租户侧 API 配置、核销、权益查看 |
| `/ops` | Ops 运营后台 | 是 | 平台侧管理 AI API、邀请码、核销码和数据库 |

## Demo 登录与权益

### 内置邀请码

可在 `/login` 使用以下邀请码：

| 邀请码 | 类型 | 初始权益 |
| --- | --- | --- |
| `KEYOU-DEMO-2026` | 试用账户 | 20 次月度生成额度，120 点券 |
| `MONTH-TEACHER-2026` | 月付用户 | 300 次月度生成额度 |
| `POINTS-ORG-2026` | 次付点券 | 1000 点券 |

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

## 功能模块说明

### 1. 老师端首页

入口：`/teacher-dashboard`

功能：

- 展示欢迎卡片：欢迎回来，王老师。
- 展示最近课件：分数闯关、动物分类、单词翻卡。
- 提供快捷操作：生成新课件、导入 PPT / PDF、创建班级、登录 / 核销 / API。
- 展示当前账户权益：套餐类型、月额度、点券余额。
- 引导进入 AI 生成、分享、后台配置。

### 2. AI 生成课件向导

入口：`/generate`

功能：

- 输入课题：默认「三年级数学：认识分数」。
- 选择学段：小学低段、小学中段、小学高段。
- 选择学科：数学、英语、科学、班会。
- 选择玩法：闯关地图、竞速答题、拖拽分类、翻卡记忆、知识配对、转盘挑战。
- 设置班级人数。
- 查看 AI 生成结果预览。
- 点击「一键生成游戏课」后显示生成动画。
- 根据当前账户权益扣减月额度或点券。

模拟生成阶段：

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
- 支持题目、选项数量、时间限制、奖励星星、难度设置。
- 内置拖拽分类题，移动端用「先点分数，再点分类框」模拟拖拽。
- 正确时显示星星奖励。
- 错误时提示「再想一想哦」。

### 4. 快速分享与班级发布

入口：`/share`

功能：

- 展示课堂分享标题：分数闯关挑战。
- 提供三种分享方式：
  - 复制链接
  - 下载二维码
  - 课堂 PIN 码
- 发布到班级：三年级2班。
- 微信群分享卡片预览。
- 展示分享优势：微信群、家长群、扫码进课、投屏同步。

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

- 展示「分数王国大冒险」闯关地图。
- 展示学生状态：头像、昵称、星星、金币。
- 展示进度条：已完成 4/5 关。
- 关卡包括：
  - 初识分数
  - 分数的意义
  - 分数的比较
  - 分数的加减法
  - 分数应用挑战
- 内置两个互动游戏组件：
  - 拖拽分类游戏
  - 竞速答题游戏
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

### 8. 后端/API 配置中心

入口：`/backend`

面向学校或机构管理员。

功能：

- 配置 API 供应商、后端生成接口、默认模型。
- 生成当前机构的模拟 API 凭证。
- 查看当前账户权益：
  - 账户类型
  - 月额度剩余
  - 点券余额
  - 月度使用进度
- 生成邀请码。
- 核销月付码或点券码。
- 查看后端 API 模拟接口。
- 快速进入 Ops 后台。

后端 API 模拟接口：

| Method | Path | 说明 |
| --- | --- | --- |
| POST | `/api/auth/invite-login` | 邀请码注册登录，返回老师账户与用量权益 |
| POST | `/api/tenant/api-keys` | 后台为机构生成 API 凭证和模型配置 |
| POST | `/api/billing/redeem` | 核销月付码或点券码，写入账户权益 |
| POST | `/api/usage/consume` | 生成课件时扣减月额度或点券 |

### 9. Ops 运营后台

入口：`/ops`

面向平台运营和内部管理。

功能：

- AI API 管理：
  - 通道名称
  - 供应商
  - Base URL
  - 默认模型
  - API Key
  - 每日限额
  - 启用 / 停用状态
  - 保存到模拟数据库
  - 测试连接
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
| `keyou-usage-account` | 当前账户权益和 API 配置 |
| `keyou-account-store` | 按邀请码持久化的账户权益，避免重复登录重置额度 |
| `keyou-redeemed-codes` | 当前 Demo 会话已核销码 |
| `keyou-ops-database` | Ops 模拟数据库 |

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
│   │   ├── GameMap.tsx
│   │   ├── Layout.tsx
│   │   ├── Mascot.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── QRCodeMock.tsx
│   │   ├── QuizRaceGame.tsx
│   │   └── Sidebar.tsx
│   ├── data
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
└── README.md
```

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
- 邀请码数据结构。
- 用户数据结构。
- 用量账户数据结构。
- 核销码数据结构。
- 邀请码登录逻辑。
- 生成 API 凭证。
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
- 平台侧生成邀请码。
- 平台侧生成核销码。
- 展示模拟数据库表。
- 展示审计和使用日志。

### BackendConsole.tsx

负责：

- 租户侧配置 API。
- 为当前机构生成 API 凭证。
- 查看当前账户权益。
- 核销月付码或点券码。
- 查看后端 API 模拟接口。

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

当前项目是产品 Demo，不是生产系统。

- 没有真实后端。
- 没有真实数据库。
- 没有真实 AI API。
- 没有真实支付。
- 没有真实短信、邮箱或微信分享。
- 没有真实账号密码系统。
- `localStorage` 中的数据只适合本机演示。
- API Key 仅为模拟字符串，不具备真实权限。

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

核销码会在当前 Demo 会话中标记为已使用，防止重复核销。可以：

- 换一个核销码。
- 在 `/ops` 生成新的核销码。
- 点击「重置模拟数据库」恢复初始数据。

### 为什么 AI 不是真的生成？

这是演示 Demo。生成动画、课件结构和题目都是本地模拟。真实接入时应由后端调用 AI API，再保存结构化课件数据。

### 可以部署到静态网站吗？

可以。因为当前没有真实后端依赖，执行 `npm run build` 后，将 `dist` 部署到任意静态托管平台即可。但刷新深层路由时，需要平台配置 SPA fallback 到 `index.html`。

## 验证记录

当前版本已执行：

```bash
npm run typecheck
npm run build
```

构建通过。浏览器中已验证核心页面可加载，包括：

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

仅用于产品 Demo、教学演示和原型验证。生产使用前需要补充真实后端、权限、安全、日志、数据合规和商业授权。
