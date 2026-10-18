# CLAUDE.md — company-website

tku.ltd 葡萄酒公司静态网站（HTML/CSS/JS）。

## 代理工作流

- 主会话：Opus 5.5 + ultracode（`.claude/settings.json`）
- 只读扫描阶段用 Haiku 5.5（`readonly-scanner`，工具限 Read/Grep/Glob，每个文件一个新代理）；
  编辑阶段用 Sonnet 5.5，每次编辑 `isolation: "worktree"`。现成流程：`.claude/workflows/audit-fix.js`
- **每个发现报告前必须经过一个独立的验证代理**：未参与发现的新代理，尝试反驳，不能复现即丢弃
- **修复循环连续两轮无进展即停止**：把未解决项和两轮失败原因交给人，不再重试
- 工具选择、路径选择、重试这类确定性分叉写成工作流里的普通 JS 判断，不交给模型
