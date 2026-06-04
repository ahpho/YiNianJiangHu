# 一念江湖 — 实现计划索引

> **目标**: 从零实现"一念江湖"武侠 RPG 单页游戏（30 天时间循环 + 12 NPC × 4 维好感度 + 5 门派 × 20 武学 + 7 结局 + 朱砂红古卷风 UI），并部署到 Vercel。

**架构**: 数据驱动（JSON）→ 纯逻辑引擎（零 UI 依赖）→ Zustand 状态层 → React 组件层。所有游戏规则可在 Node 环境下独立单元测试。

**技术栈**: Vite + React 18 + TypeScript strict + Zustand + zod + 纯 CSS（朱砂红色板） + d3-force + Vitest

---

## 阶段总览

| 阶段 | 内容 | Tasks | 测试 | 文档 |
|------|------|-------|------|------|
| **Phase 1** | 项目初始化与脚手架 | 6 | — | [phase-1-2-implementation.md §Phase 1](./superpowers/plans/phase-1-2-implementation.md#phase-1-项目初始化与脚手架搭建) |
| **Phase 2** | 游戏引擎核心 | 7 | 109 | [phase-1-2-implementation.md §Phase 2](./superpowers/plans/phase-1-2-implementation.md#phase-2-游戏引擎核心) |
| **Phase 3** | 数据层 + JSON Schema | 11 | 130+ | [phase-3-4-implementation.md §Phase 3](./superpowers/plans/phase-3-4-implementation.md#phase-3-数据层与-json-schema) |
| **Phase 4** | UI 层 + 全部屏幕 | 13 | 50+ | [phase-3-4-implementation.md §Phase 4](./superpowers/plans/phase-3-4-implementation.md#phase-4-ui-层与全部屏幕) |
| **Phase 5** | 端到端集成与打磨 | 8 | 60 | [05-integration-polish.md](./plans/05-integration-polish.md) |
| **Phase 6** | 部署与上线 | 4 | 19 | [06-deploy-launch.md](./plans/06-deploy-launch.md) |

**合计**: 49 Tasks / 370+ 单元测试

---

## 文档清单

### 设计文档（已确认）
- [00-worldbuilding.md](./design/00-worldbuilding.md) — 世界观
- [01-factions.md](./design/01-factions.md) — 5 门派 + 20 武学
- [02-npcs.md](./design/02-npcs.md) — 12 NPC + 好感度
- [03-endings.md](./design/03-endings.md) — 7 结局
- [04-art-style.md](./design/04-art-style.md) — 朱砂红古卷风
- [05-system-overview.md](./design/05-system-overview.md) — 系统规则
- [06-tech-architecture.md](./design/06-tech-architecture.md) — 技术架构
- [07-ui-design.md](./design/07-ui-design.md) — 界面设计
- [08-event-data-schema.md](./design/08-event-data-schema.md) — 事件数据结构
- [design-preview.html](./design/design-preview.html) — 浏览器可视化预览（双击打开）

### 实现计划（按阶段）
1. **Phase 1-2**：项目初始化 + 引擎核心
   → [phase-1-2-implementation.md](./superpowers/plans/phase-1-2-implementation.md)
2. **Phase 3-4**：数据层 + UI 层
   → [phase-3-4-implementation.md](./superpowers/plans/phase-3-4-implementation.md)
3. **Phase 5**：端到端集成与打磨
   → [05-integration-polish.md](./plans/05-integration-polish.md)
4. **Phase 6**：部署与上线
   → [06-deploy-launch.md](./plans/06-deploy-launch.md)

---

## 执行规则

1. **TDD 严格**：每个 Task 遵循 红 → 绿 → 重构 流程。先写失败测试，确认失败（必须看到报错），再写实现，确认通过
2. **零占位符**：禁止"TODO"、"类似任务N"、"待定"等模糊表达。每个步骤都要有完整代码
3. **频繁 commit**：每个 Task 完成后立即 `git commit`（按 Conventional Commits 格式：`feat:` / `fix:` / `test:` / `docs:` / `chore:`）
4. **DRY**：重复 3 次以上再抽象；同类型用统一函数/工具
5. **YAGNI**：当前 Task 范围外的不做；标记为"后续可扩展"
6. **strict TypeScript**：所有代码通过 `tsc --noEmit`，禁止 `any`（受控泛型场景除外）

---

## 推荐执行顺序

**方式 1：子代理驱动（推荐）** — 每个 Task 调度一个新子代理 + 两阶段审查
- 适用：人手紧、需要快速迭代
- 详细：[subagent-driven-development](../.claude/skills/subagent-driven-development/SKILL.md)

**方式 2：内联执行** — 当前会话内批量执行 + 检查点
- 适用：想深度参与每一步
- 详细：[executing-plans](../.claude/skills/executing-plans/SKILL.md)

**建议从 Phase 1 开始**：

```bash
# 阶段验收命令（每完成一个 Phase 跑一次）
npm run lint
npx tsc -b --noEmit
npm run build
npx vitest run
```

任何阶段未通过验收则不能进入下一阶段。
