# 产品规划文档（PRD）：澳洲上门服务行业 Google 评价自动化 SaaS

> 状态：v0.1 草案 · 2026-10
> 暂定名：**ReviewLoop**（品牌名待定，全文用此占位，确定后统一替换）
> 读者：老板（产品决策）+ Claude Code（开发与运营值守）
> 配套文档：`CLAUDE.md`（开发规范）、`docs/OPS-RUNBOOK.md`（运营值守手册）、`docs/COMPLIANCE.md`（合规清单）

---

## 0. 一句话

工单完成后，自动、合规地请客户去 Google 留评；把评价拉回来，用 AI 起草回复；用数据告诉老板评价涨了多少。目标客户是澳洲中小上门服务商家（清洁、园艺、宠物、虫控、管道、电工等）。

## 1. 背景与依据

- 对标产品：美国 Review Harvest（reviewharvest.com）。其模式：工单软件集成 → 定时发邀评短信/邮件 → 跟进提醒 → 拉取评价 + AI 回复 → 数据看板；月费 US$99–279，按每月邀评量分档。
- 澳洲市场现状（2026-10 调研）：
  - 头部：Podium（墨尔本有亚太总部）、Birdeye、NiceJob，价格高（每月数百美元）或美元计价、北美客服时间。
  - 隐形竞品：ServiceM8 等工单软件自带“工单完成后发评价链接”。**单纯发链接不构成卖点。**
  - 本地小玩家：Starworks、Review Collector、Review Automation AU、GoogleReview.com.au 等，约 A$50–110/月，均无规模、几乎没有第三方评价。
  - 消费者端教育充分；商家端多停留在手动发链接/NFC 卡阶段。
  - ACCC 对虚假、诱导、压制差评的执法活跃 → 合规是卖点。
- 已有资源：公司实体与 ABN、Stripe 账号（沿用 AU ComplainAI 的主体；在同一 Stripe 账号下新建产品与价格）。

## 2. 定位与差异化

| 维度 | 我们的做法 |
|---|---|
| 价格 | 澳元标价含 GST，月付无合约，A$79–249（见 §8） |
| 本地化 | 澳洲各州时区与夏令时、澳洲手机号格式、澳式英语文案、澳洲营业时间内的客服 |
| 合规 | 不筛选、不给奖励、所有客户一视同仁；退订、同意记录与审计日志内建 —— 作为销售话术 |
| 超出“发链接”的价值 | 智能跟进、点击漏斗分析、AI 回复评价、多商家管理、月度报告 |
| 集成 | ServiceM8、Xero 优先（澳洲上门服务行业最常用）；Zapier / Webhook / CSV 兜底 |

**切入行业（待老板拍板，见 §12）**：建议先选 1 个行业，例如家政清洁或园艺，所有文案、模板、案例都围绕它，验证后再扩展。

## 3. 用户与角色

- **商家老板（Owner）**：注册、付费、连 Google、设置模板、看报告。手机端使用为主。
- **商家员工（Staff）**：添加联系人、查看评价。权限受限。
- **商家的客户（Recipient）**：收到短信/邮件、点链接、留评、可退订。**不登录系统。**
- **平台管理员（Admin，即我们）**：查看全局指标、处理异常、合规审计。

## 4. 核心流程

```
[联系人进入] ──> [排队] ──> [合规检查] ──> [按商家当地时间窗口发送]
   CSV/手动/Webhook/       同意? 退订?        Mon–Sat 09:00–19:00
   ServiceM8/Xero          频控? 套餐额度?     (可配置)
                                                   │
                     ┌─────────────────────────────┘
                     ▼
            [短链接 /r/{token}] ──点击──> 302 跳转 Google 写评价页
                     │                   (记录点击, 不追踪个人行为以外的数据)
           未点击 N 天 ▼
            [跟进 1 次] ──> 结束（每个联系人每个工单最多 2 条）

[Google 评价拉取 (阶段3)] ─> [AI 起草回复] ─> [老板审核/编辑] ─> [发布到 Google]
```

关键规则（全部需要单元测试覆盖）：

1. **发送窗口**：按商家所在地 IANA 时区（`Australia/Sydney|Melbourne|Brisbane|Adelaide|Darwin|Perth|Hobart`）计算，默认周一至周六 09:00–19:00；窗口外的任务顺延到下一个窗口起点。昆士兰、北领地、西澳无夏令时，必须用时区库计算，禁止手写偏移。
2. **默认延迟**：工单完成后 2 小时发送（可配置 0–72 小时）。
3. **跟进**：首条未点击，3 天后（可配置）发 1 次跟进；已点击或已退订则不发。
4. **频控**：同一手机号/邮箱 90 天内最多收到 1 轮邀评（跨同一商家）。
5. **退订**：短信回复 STOP/UNSUBSCRIBE 等关键词、邮件退订链接，立即生效且全局（对该商家）永久生效；退订后不得再发任何消息，包括“已退订确认”以外的内容。
6. **不筛选（No gating）**：禁止实现“先问满意度、满意才给 Google 链接”的流程。所有收件人得到的是同一个 Google 评价链接。
7. **不诱导**：模板中禁止出现折扣、礼品、抽奖换评价的内容（模板保存时做关键词校验 + 人工可覆盖记录）。
8. **额度**：超出套餐每月额度后暂停排队并提醒老板升级，不自动超额收费。

## 5. 功能范围与分期

### 阶段 1 —— MVP（目标 4–6 周）：“能收钱、能发、合规”

| 编号 | 功能 | 验收标准 |
|---|---|---|
| P1-01 | 注册/登录 | 邮箱魔法链接或 OTP 登录（Supabase Auth）；一个账号可拥有多个商家 |
| P1-02 | 添加商家 | 用 Google Places Autocomplete 搜索商家 → 保存 `place_id`、名称、地址、时区；自动生成写评价链接 `https://search.google.com/local/writereview?placeid={place_id}`；也允许手动粘贴链接 |
| P1-03 | 订阅付费 | Stripe Checkout + Customer Portal；14 天免费试用（试用期可发 20 条）；Webhook 同步订阅状态；未付费/过期则暂停发送 |
| P1-04 | 联系人 | 手动添加、CSV 导入（字段映射、去重、澳洲手机号规范化为 E.164 `+614…`）；每条记录必须带“同意来源”字段 |
| P1-05 | 通用 Webhook | 每个商家一个带签名密钥的入站 URL，接收 `{name, phone, email, job_id, completed_at}`；可被 Zapier 使用 |
| P1-06 | 消息模板 | 短信 + 邮件各一套默认模板（见 §7），支持变量 `{first_name} {business_name} {review_link}`；预览、字符/分段数提示；发送测试消息给自己 |
| P1-07 | 调度与发送 | §4 全部规则；任务队列 + 每分钟调度；发送结果、失败重试（指数退避，最多 3 次）、送达回执 |
| P1-08 | 短链接与点击 | `/r/{token}` 记录点击并 302 跳转；token 不可枚举 |
| P1-09 | 退订 | 短信 STOP 入站处理、邮件一键退订（含 `List-Unsubscribe` 头）、退订页面 |
| P1-10 | 看板 | 已发送、已送达、点击率、退订数、本月额度用量；按周/月切换 |
| P1-11 | 暂停/恢复 | 商家一键暂停全部发送 |
| P1-12 | 审计日志 | 每条消息：内容快照、发送时间、同意来源、结果；保留 ≥ 2 年；可导出 CSV |
| P1-13 | 法律页面 | 服务条款、隐私政策、可接受使用政策（草稿由 Claude 起草，**上线前须澳洲律师审阅**） |
| P1-14 | 管理后台 | 平台管理员查看所有商家、发送量、失败率、异常；可冻结账号 |

### 阶段 2 —— 集成（第 2 个月）

| 编号 | 功能 | 说明 |
|---|---|---|
| P2-01 | ServiceM8 集成 | 申请 ServiceM8 开发者/插件；OAuth 授权；订阅“工单完成”事件 → 自动加入队列；最终上架插件市场作为获客渠道 |
| P2-02 | Xero 集成 | OAuth；“发票已付款”作为触发；从联系人取电话/邮箱 |
| P2-03 | Zapier 应用 | 基于 P1-05 Webhook 发布官方 Zapier 集成 |
| P2-04 | 多用户 | 邀请员工，Owner/Staff 角色 |
| P2-05 | 月度报告邮件 | 每月 1 日给老板发上月数据摘要 |

### 阶段 3 —— 评价管理（Google Business Profile API 获批后）

| 编号 | 功能 | 说明 |
|---|---|---|
| P3-01 | 连接 Google 商家资料 | OAuth，scope `https://www.googleapis.com/auth/business.manage`；选择 location |
| P3-02 | 评价同步 | 定时拉取评价（增量）；导入历史评价 |
| P3-03 | AI 回复草稿 | 用 Claude API 按商家语气生成回复；差评走更谨慎的模板；**默认需人工确认后发布**，可选“5 星自动发布” |
| P3-04 | 发布回复 | 调用 API 发布/更新回复，记录状态（待审核/已发布/失败） |
| P3-05 | 评分分析 | 星级分布、趋势、“再多 N 个五星评分会变成多少”模拟器 |
| P3-06 | 归因 | 根据时间窗口与姓名匹配，估计“由我们邀请带来的评价”（标注为估算） |

### 暂不做（明确排除）

- 好评引导/筛选、奖励换评价、代写评价、删除差评服务。
- 网站代建、社媒发帖（Review Harvest 有，但偏离核心，后期再评估）。
- 自建短信网关、原生 App（用响应式 Web）。

## 6. 技术架构

| 层 | 选型 | 理由 |
|---|---|---|
| Web 应用 | Next.js（App Router）+ TypeScript + Tailwind + shadcn/ui | 全栈一体、生态成熟、Claude Code 熟练 |
| 部署 | Vercel（区域选悉尼 `syd1`） | 简单、自动预览环境 |
| 数据库/认证/存储 | Supabase（区域 `ap-southeast-2` 悉尼），Postgres + RLS + Auth | 数据留在澳洲；行级权限做多租户隔离；本环境已有 Supabase 连接器 |
| 定时调度 | Supabase `pg_cron` 每分钟调用受签名保护的 `/api/cron/dispatch` | 不依赖 Vercel 付费 cron 粒度 |
| 短信 | Twilio（澳洲号码 + 字母发送方名称） | 文档全、支持入站 STOP；备选 MessageMedia |
| 邮件 | Resend（自定义域，SPF/DKIM/DMARC） | 简单可靠 |
| 支付 | Stripe Billing（沿用现有账号，新建 Product/Price，AUD，含 GST 标价） | 已开通 |
| AI | Anthropic Claude API（模型名放在环境变量 `ANTHROPIC_MODEL`） | 回复草稿生成 |
| 地点搜索 | Google Maps Platform Places API（Autocomplete + Place Details） | 无需 GBP 审批即可拿 place_id |
| 监控 | Sentry（错误）+ Better Stack 或 UptimeRobot（可用性）+ `/api/health` | Claude 不能实时盯盘，需要外部告警 |
| 测试 | Vitest（单元）+ Playwright（关键路径 E2E） | |

### 数据模型（初版，Postgres）

```
accounts(id, owner_user_id, name, stripe_customer_id, plan, plan_status, trial_ends_at, created_at)
account_members(account_id, user_id, role[owner|staff])
businesses(id, account_id, name, place_id, review_url, address, timezone, sms_sender_name,
           send_window jsonb, default_delay_minutes, followup_after_days, paused bool, created_at)
contacts(id, business_id, first_name, last_name, phone_e164, email, consent_source, consent_at,
         external_ref, created_at)                           -- unique(business_id, phone_e164), unique(business_id, email)
suppressions(id, business_id, channel[sms|email], address, reason[stop|unsubscribe|bounce|complaint|manual], created_at)
jobs(id, business_id, contact_id, source[manual|csv|webhook|servicem8|xero|zapier], external_job_id,
     completed_at, created_at)                               -- unique(business_id, source, external_job_id)
review_requests(id, job_id, contact_id, business_id, channel, step[initial|followup], status
                [queued|scheduled|sending|sent|delivered|failed|skipped|clicked], scheduled_for,
                sent_at, provider_message_id, link_token, clicked_at, skip_reason, body_snapshot, attempts)
templates(id, business_id, channel, step, body, subject, updated_by, updated_at)
inbound_messages(id, business_id, from_address, body, received_at, action_taken)
integrations(id, business_id, type, status, encrypted_credentials, last_sync_at, last_error)
webhook_endpoints(id, business_id, secret_hash, created_at, last_used_at)
usage_counters(account_id, period_month, requests_sent)
audit_log(id, actor, account_id, action, entity, entity_id, data jsonb, created_at)
-- 阶段 3
google_connections(id, business_id, google_account_email, location_name, encrypted_tokens, health, last_sync_at)
reviews(id, business_id, google_review_id, rating, author_name, text, created_at_google, reply_text,
        reply_status, ai_draft, ai_generated_at, published_at, attributed_request_id)
```

要求：所有业务表启用 RLS，按 `account_id` 隔离；凭证类字段应用层加密（密钥放环境变量）；`review_requests` 的状态流转写成纯函数并测试。

## 7. 默认消息模板（澳式英语，须含发送方身份与退订方式）

短信·首条：
```
Hi {first_name}, thanks for choosing {business_name}! If you have 30 seconds, we'd really appreciate a Google review: {review_link}
Reply STOP to opt out.
```

短信·跟进：
```
Hi {first_name}, just a quick reminder from {business_name} – your feedback helps other locals find us: {review_link}
Reply STOP to opt out.
```

邮件·首条：主题 `How did we go, {first_name}?`，正文含商家名称、联系方式、评价按钮、退订链接与 `List-Unsubscribe` 头。

> 注意：模板不得承诺任何奖励；不得只发给“满意”的客户。

## 8. 定价（假设，待验证）

| 套餐 | 月费（含 GST） | 每月邀评条数 | 主要功能 |
|---|---|---|---|
| Starter | A$79 | 100 | 1 个商家、短信+邮件、CSV/Webhook |
| Growth | A$149 | 300 | 3 个商家、ServiceM8/Xero、月报 |
| Pro | A$249 | 1,000 | 10 个商家、AI 回复、多用户、优先支持 |

- 14 天免费试用，月付无合约，可随时取消。
- 成本控制：每条短信成本按当时 Twilio 澳洲报价核算，目标毛利 ≥ 75%；单条短信控制在 1 个分段（160 GSM-7 字符）内，模板编辑器实时提示分段数。
- 年付 2 个月免费（阶段 2 再加）。

## 9. 成功指标

- 北极星：**每个付费商家每月新增 Google 评价数**（阶段 3 前用“点击数”近似）。
- MVP 验证（上线后 60 天）：10 个付费商家；邀评点击率 ≥ 20%；月流失 < 5%；零合规投诉。
- 运营：发送成功率 ≥ 98%；调度延迟 p95 < 5 分钟；退订处理 < 1 分钟。

## 10. 风险与对策

| 风险 | 对策 |
|---|---|
| Google GBP API 审批慢或被拒 | 阶段 1–2 完全不依赖它；尽早提交申请 |
| 违反 Spam Act / ACL 被罚 | 合规内建（§4、`COMPLIANCE.md`）；律师审阅；审计日志 |
| 短信发送方名称登记要求 | 上线前确认 ACMA 发送方登记规则与生效日期，以公司名义登记 |
| ServiceM8 自带同类功能 | 卖点放在跟进策略、漏斗分析、AI 回复、多商家与服务 |
| 短信成本吃掉毛利 | 套餐额度上限、单分段模板、邮件优先选项 |
| 单人 + AI 团队的运维风险 | 外部监控告警 + Claude 定时值守 + 明确升级规则（见运营手册） |

## 11. 里程碑

| 周 | 交付 |
|---|---|
| W1 | 仓库初始化、CI、Supabase 表结构与 RLS、登录、商家创建（含 Places 搜索） |
| W2 | 联系人/CSV/Webhook、模板编辑与预览、调度规则纯函数 + 测试 |
| W3 | Twilio/Resend 发送、入站 STOP、短链接、退订页 |
| W4 | Stripe 订阅与额度、看板、审计导出、管理后台 |
| W5 | 法律页面、监控告警、预发布环境自测、5 家试点商家 |
| W6 | 修复与上线；提交 GBP API 申请；开始 ServiceM8 开发者申请 |

## 12. 需要老板决定/提供的事项（阻塞项）

| # | 事项 | 阻塞的阶段 |
|---|---|---|
| D1 | 品牌名与域名 | W1（域名影响邮件与短链接） |
| D2 | 新建 GitHub 仓库（建议私有），并在 Claude Code 会话中选中 | W1 |
| D3 | 首个切入行业 | W2（模板与文案） |
| D4 | Supabase 项目（悉尼区域）—— 可由 Claude 通过连接器创建，需老板确认付费方案 | W1 |
| D5 | Vercel 账号 | W1 |
| D6 | Twilio 账号、澳洲号码、发送方名称登记 | W3 |
| D7 | Resend 账号与域名 DNS 配置 | W3 |
| D8 | Stripe：确认用 AU ComplainAI 同一账号新建产品，或单独账号 | W4 |
| D9 | Google Cloud 项目：Places API Key；GBP API 申请 | W1 / W6 |
| D10 | Anthropic API Key | 阶段 3 |
| D11 | 澳洲律师审阅条款与隐私政策 | 上线前 |
| D12 | 定价确认 | W4 |

所有密钥只放在 Vercel/Supabase 的环境变量中，**不要贴到聊天或提交到仓库**。
