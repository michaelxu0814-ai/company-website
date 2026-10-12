# ReviewLoop（暂定名）—— 项目启动包

澳洲上门服务行业 Google 评价自动化 SaaS 的规划文档，供 Claude Code 开发与运营值守使用。

| 文件 | 内容 |
|---|---|
| `docs/PRD.md` | 产品规划：定位、流程、功能分期与验收标准、架构、数据模型、定价、里程碑、老板待决事项 |
| `docs/COMPLIANCE.md` | 澳洲合规清单：Spam Act、ACCC 评价指南、Google 政策、隐私、短信发送方 |
| `docs/OPS-RUNBOOK.md` | 运营值守：巡检清单、事件分级、Claude 权限边界、定时任务提示词 |
| `CLAUDE.md` | 给 Claude Code 的开发规范（放到新仓库根目录） |

## 怎么用

1. 在 GitHub 新建私有仓库（例如 `reviewloop`）。
2. 把本文件夹的全部内容复制到新仓库根目录并提交。
3. 在 Claude Code 新会话中选择这个仓库，发送：
   > 阅读 CLAUDE.md 和 docs/PRD.md，按第 11 节里程碑开始 W1 的开发。先列出 W1 需要我提供的东西（PRD 第 12 节），再开始写代码。
4. 首次上线后，按 `docs/OPS-RUNBOOK.md` 第 1 节和第 6 节设置每日巡检与每周报告的定时任务。
