# 技术架构

## 技术栈

| 层级 | 选型 | 理由 |
|------|------|------|
| 构建工具 | Vite + React SWC 插件 | 快速 HMR、TypeScript 友好 |
| UI 框架 | React 18 | 生态成熟、组件化适合复杂状态 UI |
| 语言 | TypeScript（strict 模式） | 引擎层有大量状态/事件类型，必须强类型 |
| 状态管理 | Zustand | 轻量、支持中间件（持久化、DevTools）、API 简洁 |
| 样式 | 纯 CSS + CSS Variables + CSS Modules | 古卷风定制，04-art-style.md 已定义完整色板 |
| 关系图 | d3-force | 力导向图事实标准，输出 SVG 便于 React 集成 |
| 数据 | JSON（import as ES modules） | 静态类型 + Vite 编译期校验 + 部署简单 |
| 部署 | Vercel | 与 Vite 零配置集成、CI/CD 自动 |

**不引入**：
- 不用 Tailwind / UI 组件库（古卷风定制样式与通用框架冲突）
- 不用 Redux（Zustand 更适合中小规模状态）
- 不用 React Router（只有 5 个屏幕，状态机切换即可）

---

## 目录结构

```
src/
├── main.tsx                  # 入口
├── App.tsx                    # 根组件，挂载 Zustand store + Screen Router
│
├── engine/                    # 核心游戏引擎（纯逻辑，零 UI 依赖）
│   ├── types.ts               # 全局类型（GameState、NPC、MartialArt 等）
│   ├── TimeEngine.ts          # 时间推进、时辰判定
│   ├── FavorEngine.ts         # 好感度计算（四维模型 + 一念联动）
│   ├── CombatEngine.ts        # 回合制战斗逻辑
│   ├── EventEngine.ts         # 事件触发、条件判定
│   ├── EndingEngine.ts        # 结局判定
│   └── FlagEngine.ts          # 标记管理
│
├── data/                      # 全部游戏数据（JSON 驱动）
│   ├── events/                # 事件脚本（按天数组织）
│   │   ├── day01.json
│   │   ├── day02.json
│   │   ├── ...
│   │   └── day30.json
│   ├── npcs.json              # NPC 基础数据
│   ├── factions.json          # 门派数据
│   ├── martial-arts.json      # 武学数据
│   ├── endings.json           # 结局条件
│   └── random-events.json     # 随机遭遇池
│
├── ui/                        # React 组件
│   ├── screens/               # 全屏场景
│   │   ├── TitleScreen.tsx
│   │   ├── GameScreen.tsx     # 主游戏界面（双栏布局）
│   │   ├── CombatScreen.tsx
│   │   ├── RelationGraph.tsx
│   │   └── EndingScreen.tsx
│   ├── components/            # 可复用组件
│   │   ├── Timeline.tsx       # 时间轴（天数 + 时辰）
│   │   ├── ActionPanel.tsx    # 行动选择面板
│   │   ├── DialogueBox.tsx    # 对话框（逐字打印）
│   │   ├── FavorDisplay.tsx   # 好感度面板
│   │   ├── CharSheet.tsx      # 角色属性面板
│   │   ├── CombatUI.tsx       # 战斗界面组件
│   │   └── NpcDetailModal.tsx # NPC 详情弹窗
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useGameState.ts    # 访问 Zustand store
│   │   └── useEventRunner.ts  # 事件执行副作用
│   └── ScreenRouter.tsx       # 屏幕状态机
│
├── styles/                    # 古卷风 CSS
│   ├── variables.css          # 朱砂红色板（来自设计文档）
│   ├── scroll-frame.css       # 卷轴边框
│   ├── animations.css         # 墨迹动效
│   └── global.css
│
└── utils/
    ├── math.ts                # 伤害公式等
    └── condition-parser.ts    # 事件条件表达式解析
```

---

## 数据流架构

```
┌──────────────────────────────────────────────────────────┐
│                     JSON Data Layer                      │
│  events/*.json  npcs.json  martial-arts.json  endings.json│
└─────────────────────┬────────────────────────────────────┘
                      │ 加载 & 校验（Vite ESM import）
                      ▼
┌──────────────────────────────────────────────────────────┐
│                    Engine Layer (纯逻辑)                  │
│  TimeEngine → EventEngine → FavorEngine → EndingEngine   │
│  CombatEngine（独立战斗循环）                              │
│  FlagEngine（全局标记状态）                                │
└─────────────────────┬────────────────────────────────────┘
                      │ 状态更新（immutable patches）
                      ▼
┌──────────────────────────────────────────────────────────┐
│                    React State (Zustand)                  │
│  GameState { day, timeslot, favors, flags, health, qi... }│
└─────────────────────┬────────────────────────────────────┘
                      │ hooks: useGameState / useEventRunner
                      ▼
┌──────────────────────────────────────────────────────────┐
│                    UI Layer (React)                       │
│  GameScreen (双栏: 左=事件+行动, 右=属性面板)              │
│  CombatScreen / RelationGraph / EndingScreen              │
└──────────────────────────────────────────────────────────┘
```

**关键设计原则**：
- **Engine 零依赖**：所有游戏逻辑可在 Node.js / Vitest 中独立运行测试，UI 渲染是纯函数映射
- **Data 与 Engine 解耦**：策划编辑 JSON，引擎解析执行，UI 通过 store 订阅
- **状态更新 immutable**：Zustand 强制纯函数更新，便于时间旅行调试和结局复算

---

## Zustand Store 结构

```typescript
interface GameStore {
  // ===== 状态 =====
  state: GameState;                // 全部游戏数据
  screen: ScreenId;                // 当前屏幕（'title' | 'game' | 'combat' | 'graph' | 'ending'）
  isSecondPlaythrough: boolean;    // 二周目标记

  // ===== 屏幕路由 =====
  navigate: (screen: ScreenId) => void;

  // ===== 时间推进 =====
  advanceTimeslot: () => void;     // 推进一个时辰
  advanceDay: () => void;          // 推进一天（凌晨触发恢复）

  // ===== 玩家行动 =====
  chooseAction: (eventId: string, choiceId: string) => void;  // 触发事件选项
  rest: () => void;                // 休息恢复
  travel: (location: Location) => void;  // 远行

  // ===== 战斗 =====
  startCombat: (enemies: Combatant[]) => void;
  executeCombatAction: (action: CombatAction) => void;
  endCombat: (victory: boolean) => void;

  // ===== 元操作 =====
  reset: () => void;               // 重新开始
  importSave: (save: SaveData) => void;  // 加载存档
  exportSave: () => SaveData;      // 导出存档
}
```

---

## 关键工程决策

### 1. 事件 JSON 的加载方式
**方案**：用 Vite 的 `import.meta.glob` 把所有 day01-30.json 一次性打包，编译期校验 schema 失败则构建报错。

```typescript
// data/index.ts
const eventFiles = import.meta.glob('./events/day*.json', { eager: true });
export const EVENTS: Record<number, DayEvents> = {};
for (const path in eventFiles) {
  const day = parseInt(path.match(/day(\d+)/)[1], 10);
  EVENTS[day] = eventFiles[path].default;
}
```

**优势**：
- 部署即静态资源，CDN 加速
- 构建期就能发现 JSON 错误
- 引擎层只需 `EVENTS[day]`，无需异步加载

### 2. 事件条件表达式
事件触发条件可能很复杂（如：`day==10 && (flag:found_letter || trust>=60) && npc.favor.awe<50`）。

**方案**：定义受限的条件 DSL（JSON 数组），不引入通用表达式求值库。

```json
{
  "conditions": [
    { "type": "day", "value": 10 },
    { "type": "or", "conditions": [
      { "type": "flag", "key": "found_letter" },
      { "type": "favor", "npc": "qingxu", "dim": "trust", "op": ">=", "value": 60 }
    ]},
    { "type": "favor", "npc": "qingxu", "dim": "awe", "op": "<", "value": 50 }
  ]
}
```

**ConditionParser** 是一个纯函数，递归求值，引擎层可单元测试。

### 3. 一念效应的实现
05-system-overview.md 提到的好感度联动（如"信任↑ 往往伴随 敬畏↓"）有两条实现路径：

| 方案 | 优点 | 缺点 |
|------|------|------|
| **A：硬规则**（FavorEngine 写死联动） | 实现简单、可预测 | 失去设计意图的"弹性" |
| **B：剧本标记**（每个 effect 显式声明） | 灵活、契合"一念"哲学 | 策划成本翻倍 |

**选择方案 B**：每个 effect 可选地声明 `ripple` 字段：
```json
{
  "type": "favor",
  "npc": "suqingheng",
  "trust": +15,
  "ripple": { "dim": "awe", "delta": -5 }  // 一念联动
}
```

这样"打破规律"的事件只需省略 ripple 字段。

### 4. 战斗与剧情的协调
剧情战和遭遇战共用 `CombatEngine`，但 UI 层有差异：
- 剧情战：半屏（不影响主线时间推进）
- 遭遇战：全屏（独立于主时间线）

**方案**：CombatScreen 由 store 决定是覆盖模式（full）还是叠层模式（overlay）。

### 5. 存档策略
05-system-overview.md 定义"结局收集"模式（无 save/load），但实际开发期需要：
- **开发模式**：Zustand 中间件 `persist` 自动写 localStorage
- **生产模式**：每次游戏结束记录结局到 `endingsUnlocked[]` 持久化
- **二周目判定**：localStorage 中存在 `endingsUnlocked.length >= 1`

---

## 部署架构

```
GitHub (private) → Vercel (auto-deploy)
                      ↓
                  Edge Network
                      ↓
                  Static Assets (HTML/JS/CSS/JSON)
```

**环境变量**：无（纯静态站点，所有数据打包到 JSON）

**性能目标**：
- 首次加载 ≤ 2s（5MB JSON 全量打包首屏 < 3s）
- 屏幕切换 ≤ 200ms
- 战斗动画 60fps

**SEO**：不需要（单页应用，对话游戏）

---

## 后续可扩展项

> 以下为 YAGNI 原则下不进入初版实现的特性，留作未来迭代参考：

- 道具系统（消耗品、装备）
- 音乐与音效
- 多语言支持（i18n）
- 移动端触屏优化
- 通关成就系统
- 社区分享（截图导出结局）
