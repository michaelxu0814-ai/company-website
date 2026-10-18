export const meta = {
  name: 'audit-fix',
  description: 'Haiku 只读逐文件扫描 → JS 过滤 → 独立验证 → Sonnet 在 worktree 修复（两轮无进展即停）→ 交叉检查 diff',
  whenToUse: '审计并修复代码缺陷；可传 args: { files: [...] } 指定文件',
  phases: [
    { title: 'Scan', model: 'claude-haiku-5-5' },
    { title: 'Verify', model: 'claude-sonnet-5-5' },
    { title: 'Fix', model: 'claude-sonnet-5-5' },
    { title: 'Check', model: 'claude-sonnet-5-5' },
  ],
}

const FILES = { type: 'object', properties: { files: { type: 'array', items: { type: 'string' } } }, required: ['files'] }
const FINDINGS = { type: 'object', required: ['findings'], properties: { findings: { type: 'array', items: {
  type: 'object', required: ['file', 'title', 'evidence', 'confidence'],
  properties: { file: { type: 'string' }, line: { type: 'integer' }, title: { type: 'string' }, evidence: { type: 'string' }, confidence: { type: 'number' } } } } } }
const VERDICT = { type: 'object', properties: { confirmed: { type: 'boolean' }, reason: { type: 'string' } }, required: ['confirmed', 'reason'] }
const FIX = { type: 'object', properties: { fixed: { type: 'boolean' }, branch: { type: 'string' }, summary: { type: 'string' } }, required: ['fixed', 'summary'] }
const SCAN = { agentType: 'readonly-scanner', model: 'claude-haiku-5-5' }
const CHECK = { agentType: 'readonly-scanner', model: 'claude-sonnet-5-5', schema: VERDICT }

phase('Scan')
const files = Array.isArray(args?.files) ? args.files
  : (await agent('列出要审计的源文件：git diff 相对默认分支改动的文件；没有改动则取仓库内全部手写源文件（排除依赖、构建产物、生成文件）。', { ...SCAN, schema: FILES }))?.files ?? []
log(`审计 ${files.length} 个文件`)

// 每个文件一个新的 Haiku 代理；第二阶段是纯 JS 确定性过滤，不调模型
const scanned = await pipeline(files,
  f => agent(`审计 ${f} 的正确性缺陷。`, { ...SCAN, schema: FINDINGS, label: `scan:${f}`, phase: 'Scan' }),
  r => (r?.findings ?? []).filter(x => x.confidence >= 0.5 && x.evidence.trim() !== ''))
const seen = new Set()
const candidates = scanned.filter(Boolean).flat().filter(x => {
  const k = `${x.file}:${x.line}:${x.title}`
  return seen.has(k) ? false : (seen.add(k), true)
})
if (!candidates.length) return { passed: [], unresolved: [], rejected: 0 }

// 每条发现报告前都过一个独立的新验证代理
const verified = (await parallel(candidates.map(f => () =>
  agent(`独立验证并尽力反驳这条发现；只有能从真实调用路径复现才 confirmed=true，不确定则 false。\n${JSON.stringify(f)}`,
    { ...CHECK, phase: 'Verify', label: `verify:${f.file}` })
    .then(v => (v?.confirmed ? { ...f, verifyNote: v.reason } : null))))).filter(Boolean)
log(`验证通过 ${verified.length}/${candidates.length}`)

// 修复循环：每轮一个新的隔离 worktree；连续两轮无进展即停（确定性分叉写在 JS 里）
async function fixLoop(f) {
  let lastFailure = ''
  for (let round = 1; round <= 2; round++) {
    const r = await agent(
      `最小改动修复这条已验证的发现，并跑相关测试。${lastFailure && `上一轮失败原因：${lastFailure}`}\n${JSON.stringify(f)}`,
      { model: 'claude-sonnet-5-5', isolation: 'worktree', schema: FIX, phase: 'Fix', label: `fix:${f.file}#${round}` })
    if (r?.fixed) return { ...f, ...r }
    lastFailure = r?.summary ?? '代理无结果'
  }
  return { ...f, fixed: false, summary: `两轮无进展，停止：${lastFailure}` }
}

// 修复与交叉检查走 pipeline：每条修好就立刻检查它的 diff；主会话只拿到通过检查的结果
const done = await pipeline(verified,
  f => fixLoop(f),
  x => !x.fixed ? x : agent(`交叉检查分支 ${x.branch} 的 diff：是否真修复了该发现、是否引入新问题、测试是否通过。`,
    { ...CHECK, phase: 'Check', label: `check:${x.file}` })
    .then(v => ({ ...x, diffOk: v?.confirmed === true, diffNote: v?.reason })))

return {
  passed: done.filter(x => x?.diffOk),
  unresolved: done.filter(x => x && !x.diffOk).map(x => ({ file: x.file, title: x.title, summary: x.diffNote ?? x.summary })),
  rejected: candidates.length - verified.length,
}
