# CLAUDE.md —— ReviewLoop（暂定名）

澳洲上门服务行业的 Google 评价自动化 SaaS。开始任何工作前先读：

1. `docs/PRD.md`：做什么、为什么、分期与验收标准
2. `docs/COMPLIANCE.md`：不可违反的合规底线
3. `docs/OPS-RUNBOOK.md`：值守、事件分级、权限边界

## 技术栈

Next.js（App Router）+ TypeScript（strict）+ Tailwind + shadcn/ui · Supabase（Postgres + Auth + RLS，悉尼区域）· Vercel（syd1）· Twilio · Resend · Stripe Billing · Vitest + Playwright。

## 目录约定

```
src/app/            路由与页面（含 api/ 路由）
src/lib/domain/     纯业务逻辑：调度窗口、频控、状态机、模板渲染、退订关键词（不得依赖 IO）
src/lib/providers/  Twilio/Resend/Stripe/Google 适配层（唯一允许调用外部 API 的地方）
src/lib/db/         数据访问与类型（由 Supabase 生成类型）
supabase/migrations 数据库迁移（只增不改历史迁移）
tests/              单元与 E2E 测试
ops/                值守报告与事件记录（在 ops-reports 分支）
```

## 必须遵守

- **合规优先**：任何涉及发送的改动，必须保持以下测试为绿：退订拦截、发送窗口（含无夏令时的州）、频控、禁止筛选、禁止诱导关键词。不得添加绕过这些检查的开关（唯一例外是全局“暂停发送”）。
- **时区**：一律用 IANA 时区与时区库计算，不得手写 UTC 偏移。数据库存 UTC。
- **多租户**：所有业务表启用 RLS；服务端用 service role 的代码必须显式按 `account_id` 过滤，并有测试证明跨租户不可读。
- **密钥**：只从环境变量读取；不打印、不写入日志、不提交。新增变量要同步更新 `.env.example` 和运营手册 §8。
- **外部调用**：只在 `src/lib/providers/` 中；全部可注入假实现以便测试；生产外的环境默认使用假实现或测试凭证，**禁止向真实手机号发送测试短信**，除非老板指定的测试号码。
- **迁移**：数据库结构变更走迁移文件和 PR；不在生产直接改表。
- **提交**：Conventional Commits（`feat:` `fix:` `chore:` …）；一个 PR 只做一件事；PR 描述写清验收标准对应的编号（如 P1-07）。
- **完成定义**：类型检查、lint、单元测试、相关 E2E 全部通过；更新受影响的文档。

## 常用命令（初始化后补全）

```
npm run dev          # 本地开发
npm run typecheck
npm run lint
npm test             # Vitest
npm run test:e2e     # Playwright
npx supabase db push # 应用迁移（仅预发布/生产按流程执行）
```

## 需要老板决定时

列出选项与推荐，停下来等待，不要自行假设以下事项：价格、品牌文案对外发布、花钱、生产数据删除、合并到 main。
