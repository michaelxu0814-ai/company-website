# 运营值守手册（Claude Code 值守用）

> 目的：让 Claude Code 以“定时例行任务 + 外部告警触发”的方式承担日常运维，并清楚知道哪些事必须交给老板。
> Claude 不是 24 小时在线的：实时告警靠外部监控（Sentry、Better Stack/UptimeRobot），Claude 负责定时巡检、排查、修复与汇报。

## 1. 值守机制

| 机制 | 频率 | 做什么 |
|---|---|---|
| 外部可用性监控 | 每 1 分钟 | 探测 `/api/health`；失败时推送给老板手机/邮箱 |
| Sentry 错误告警 | 实时 | 新错误类型或错误激增时通知老板 |
| Claude 每日巡检（Routine） | 每天 08:45 AEST/AEDT | 执行 §3 清单，输出日报；有问题开 GitHub Issue 或修复 PR |
| Claude 每周报告（Routine） | 每周一 08:45 | 业务指标周报 + 待办建议 |
| Claude 事件处理 | 老板转发告警时 | 按 §4 分级处理 |

设置方法：在 Claude Code 中用 Routine（定时任务），每次运行开一个全新会话、指向本仓库。提示词使用 §6 的模板。所需凭证以只读方式提供（见 §5）。

## 2. 健康检查端点 `/api/health`

返回 JSON（不含敏感数据）：

```json
{
  "ok": true,
  "db": "ok",
  "queue": { "due_unsent": 0, "oldest_due_minutes": 0 },
  "last_dispatch_run": "2026-10-12T22:01:00Z",
  "providers": { "twilio": "ok", "resend": "ok", "stripe": "ok" }
}
```

以下任一条件成立时 `ok=false`（HTTP 503）：数据库不可达；`last_dispatch_run` 超过 5 分钟；`oldest_due_minutes` > 15。

## 3. 每日巡检清单

逐项检查，结果写入日报（`ops/reports/YYYY-MM-DD.md`，提交到 `ops-reports` 分支，不污染主分支）：

1. **可用性**：`/api/health` 结果；过去 24 小时的宕机记录。
2. **发送管道**：
   - 过去 24 小时 queued/sent/delivered/failed/skipped 数量与失败率（> 2% 视为异常）。
   - 失败原因 Top 5（Twilio/Resend 错误码）。
   - 调度延迟 p95。
3. **合规（必查）**：
   - 发给已退订地址的消息数，必须为 0，否则按 SEV-1 处理。
   - 在发送窗口以外发出的消息数，必须为 0。
   - 入站 STOP 是否都已处理（`inbound_messages.action_taken` 非空）。
4. **数据库**：Supabase advisors（安全/性能）新增项；慢查询；存储增长。
5. **计费**：Stripe 付款失败、即将到期的试用、额度用尽的商家。
6. **错误**：Sentry 新问题 Top 5，附初步判断。
7. **依赖与安全**：`npm audit` 高危项；即将过期的证书/令牌（Google OAuth、ServiceM8、Xero）。
8. **集成**：各集成 `last_error` 非空或同步超过 24 小时未更新的商家。

日报格式：先给结论（绿/黄/红），再列异常与已采取的行动，最后列需要老板决定的事。

## 4. 事件分级与处理

| 级别 | 定义 | Claude 的动作 | 是否需要老板 |
|---|---|---|---|
| SEV-1 | 发给已退订者；疑似数据泄露；大面积误发（错误内容/错误对象/深夜发送）；全站宕机 > 15 分钟 | **立即全局暂停发送**（`system_settings.sending_enabled=false`），保全证据（日志导出），写事件报告，通知老板 | 是，立即 |
| SEV-2 | 发送失败率 > 10%；调度停摆；支付 Webhook 失败；单个集成全量失败 | 排查根因，提交修复 PR（带测试），暂停受影响的商家或集成 | 合并生产修复前通知 |
| SEV-3 | 个别商家报错、非关键 UI 缺陷、依赖告警 | 开 Issue 或提交 PR，写入日报 | 否 |

事件报告模板（`ops/incidents/YYYY-MM-DD-简述.md`）：时间线、影响范围（商家数/消息数）、根因、修复、防止复发的措施、是否涉及 NDB 上报评估。

## 5. 权限边界

**Claude 可以自主做的事：**
- 读取日志、数据库（只读角色）、Sentry、Stripe（只读密钥）、Twilio 消息日志。
- 开 Issue、开 PR、在预发布环境部署与测试。
- SEV-1 时打开全局“暂停发送”开关（唯一允许的生产写操作）。
- 生成日报、周报与事件报告。

**必须老板批准的事：**
- 合并到 `main` 并部署生产（紧急修复也要老板在 PR 上确认，或老板事先书面授权某类修复）。
- 任何花钱的变更：升级套餐、购买号码、投放广告。
- 修改价格、退款、给商家延期或补偿。
- 以公司名义对外发送任何消息（给商家或给终端客户）。
- 删除生产数据、修改数据库结构（迁移须走 PR + 审阅）。
- 恢复全局发送（SEV-1 之后）。
- 对外答复监管机构或媒体。

**Claude 永远不做的事：**
- 在聊天、Issue、日志或代码中输出密钥。
- 绕过退订、发送窗口或频控逻辑“临时处理”。
- 代商家撰写顾客评价。

## 6. 定时任务提示词模板

每日巡检：

```
你是 ReviewLoop 的值守工程师。阅读仓库中的 CLAUDE.md 与 docs/OPS-RUNBOOK.md，
按第 3 节的每日巡检清单逐项检查生产环境，把日报写到 ops-reports 分支的
ops/reports/<今天日期>.md 并推送。发现 SEV-1 立即按第 4 节处理并在日报顶部标红；
SEV-2/3 开 Issue 或修复 PR（不要合并到 main）。最后用三行中文总结发给老板：
状态（绿/黄/红）、最重要的问题、需要老板决定的事。
```

每周报告：

```
阅读 CLAUDE.md 与 docs/PRD.md 第 9 节指标定义，生成上周业务周报：付费商家数、
新增/流失、发送量、点击率、退订率、试用转化、短信成本与毛利估算、Top 3 风险与
Top 3 建议。写入 ops-reports 分支的 ops/reports/weekly-<年-周>.md，并给老板发
五行中文摘要。
```

## 7. 例行维护（每月）

- 依赖升级 PR（小版本），跑完整测试。
- 审计日志抽样 20 条，人工核对同意来源与退订是否合规。
- 数据保留任务：清理已注销账号的到期数据。
- 检查 Supabase 备份/时间点恢复（PITR）是否可用，每季度做一次恢复演练到预发布库。
- 复核合规清单是否有法规更新（ACMA、ACCC、OAIC 官网）。

## 8. 凭证清单（只列变量名，值存放在 Vercel/Supabase 环境变量）

```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_MESSAGING_SERVICE_SID
RESEND_API_KEY, EMAIL_FROM_DOMAIN
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_STARTER, STRIPE_PRICE_GROWTH, STRIPE_PRICE_PRO
GOOGLE_PLACES_API_KEY
GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET        # 阶段 3
ANTHROPIC_API_KEY, ANTHROPIC_MODEL                         # 阶段 3
CREDENTIALS_ENCRYPTION_KEY
SENTRY_DSN
# 值守只读凭证（单独创建，最小权限）
OPS_DB_READONLY_URL, OPS_STRIPE_RESTRICTED_KEY, OPS_SENTRY_TOKEN
```
