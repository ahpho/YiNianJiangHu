# 事件数据结构

## 设计原则

- **数据驱动**：所有事件内容、条件、效果都在 JSON 中定义，引擎层只负责解析执行
- **按天组织**：`events/day01.json` ~ `day30.json`，每天一个文件
- **条件 DSL**：受约束的条件数组（非通用表达式），安全且易于校验
- **效果可组合**：每个行动选项可产生多个效果（好感度/标记/解锁/战斗）

---

## 事件脚本格式

### 顶层结构

```json
{
  "day": 1,
  "events": [
    { /* Event */ }
  ]
}
```

### Event 完整字段

```json
{
  "id": "day10_misu_secret_letter",
  "type": "story",
  "priority": 10,
  "trigger": {
    "timeslot": "noon",
    "location": "zhongyuan",
    "conditions": [
      { "type": "flag", "key": "found_letter" }
    ]
  },
  "scene": {
    "background": "zhongyuan_temple_indoor",
    "description": "嵩山·太虚剑宗密室。烛光摇曳……",
    "ambient": "indoor_candle"
  },
  "dialogues": [
    { "speaker": "suqingheng", "text": "师父他……果然和朝廷有来往。", "emotion": "angry" }
  ],
  "choices": [
    { "id": "expose", "text": "「公开密信，揭露真相。」", "conditions": [], "effects": [] }
  ],
  "nextEvent": null
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✓ | 唯一事件标识（命名规则：`day{DD}_{关键词}`） |
| `type` | Event.Type | ✓ | `"story"` / `"combat"` / `"random"` / `"ending"` |
| `priority` | number | — | 同一时辰多事件时的优先级（越大越优先，默认 0） |
| `trigger` | Trigger | ✓ | 触发条件 |
| `scene` | Scene | — | 场景信息（背景/描述/环境音） |
| `dialogues` | Dialogue[] | — | 对话序列（按顺序播放） |
| `choices` | Choice[] | — | 玩家选择（为空则自动推进） |
| `combat` | CombatDef | — | type="combat" 时必填，定义战斗 |
| `nextEvent` | string \| null | — | 选择后跳转到的事件 ID（如触发连锁剧情） |

---

## Trigger 条件系统

### 可用条件类型

```typescript
type Condition =
  | { type: "timeslot"; value: Timeslot }
  | { type: "location"; value: Location }
  | { type: "day"; op: ">" | ">=" | "==" | "<=" | "<"; value: number }
  | { type: "flag"; key: string; present?: boolean }  // present 默认 true
  | { type: "favor"; npc: NPC_ID; dim: FavorDim; op: ">=" | "<=" | ">" | "<"; value: number }
  | { type: "reputation"; faction: Faction_ID; op: ">=" | "<="; value: number }
  | { type: "martial"; count?: number; faction?: Faction_ID }  // 学习门派武学数
  | { type: "and"; conditions: Condition[] }
  | { type: "or"; conditions: Condition[] }
  | { type: "not"; condition: Condition };
```

### 条件求值规则

- `and` / `or` / `not` 支持任意深度嵌套
- 求值失败（引用不存在的 NPC/标记）视为 `false`（安全降级）
- `ConditionParser` 是纯函数，可完整单元测试

### 示例

```json
// 必须是午时、在中原、且已获得密信标记
{
  "timeslot": "noon",
  "location": "zhongyuan",
  "conditions": [
    { "type": "flag", "key": "found_letter" }
  ]
}

// 二周目 + 苏青衡信任≥60 或 沈听雨亲密≥50
{
  "conditions": [
    { "type": "flag", "key": "second_playthrough" },
    { "type": "or", "conditions": [
      { "type": "favor", "npc": "suqingheng", "dim": "trust", "op": ">=", "value": 60 },
      { "type": "favor", "npc": "shentinyu", "dim": "intimacy", "op": ">=", "value": 50 }
    ]}
  ]
}
```

---

## Choice 选择结构

```json
{
  "id": "expose_truth",
  "text": "「公开密信，揭露真相。」",
  "conditions": [],
  "effects": [
    { "type": "favor", "npc": "suqingheng", "trust": 15 },
    { "type": "favor", "npc": "qingxuzhenren", "awe": -20 },
    { "type": "flag", "key": "letter_exposed", "set": true },
    { "type": "unlock", "what": "taixu_schism_arc" },
    { "type": "reputation", "faction": "taixu", "delta": -10 }
  ],
  "nextEvent": "day10_tai_xu_schism"
}
```

### Choice 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✓ | 唯一选项标识 |
| `text` | string | ✓ | 显示文本（带「」的引语风格） |
| `conditions` | Condition[] | — | 选择的前置条件（如需要某标记才能选择此项） |
| `effects` | Effect[] | ✓ | 选择后的效果列表（按顺序执行） |
| `nextEvent` | string \| null | — | 跳转到的事件 ID |

---

## Effect 效果系统

### 可用效果类型

```typescript
type Effect =
  // 好感度变化
  | { type: "favor"; npc: NPC_ID; trust?: number; intimacy?: number;
      awe?: number; fear?: number;
      ripple?: { dim: FavorDim; delta: number } }  // 一念联动

  // 门派声望变化
  | { type: "reputation"; faction: Faction_ID; delta: number }

  // 状态标记
  | { type: "flag"; key: string; set: boolean }

  // 解锁事件线
  | { type: "unlock"; what: string }

  // 属性变化
  | { type: "stat"; stat: "health" | "qi" | "attack" | "defense"; delta: number }

  // 学习武学
  | { type: "learnMartial"; martial: MartialArt_ID }

  // 触发战斗
  | { type: "combat"; enemyIds: NPC_ID[] | string[]; combatType: CombatType }

  // 解锁结局条件
  | { type: "endingFlag"; key: string }
```

### 一念联动（Ripple）

好感度变化的"一念效应"通过 `ripple` 字段实现：

```json
// 信任↑ 时 敬畏↓（典型的一念联动）
{ "type": "favor", "npc": "suqingheng", "trust": 15, "ripple": { "dim": "awe", "delta": -5 } }

// 打破规律的特殊情况（不设 ripple）
{ "type": "favor", "npc": "suqingheng", "trust": 10, "intimacy": 8 }
```

**设计原则**：大多数 effect 带有 ripple，少数特殊事件故意省略 ripple——这正是"一念"的精妙。

---

## Scene 场景定义

```json
{
  "background": "zhongyuan_temple_indoor",
  "description": "嵩山·太虚剑宗密室。烛光摇曳，墙上的画像在暗处注视着你。",
  "ambient": "indoor_candle"
}
```

### 背景图枚举

| 标识 | 区域 | 描述 |
|------|------|------|
| `zhongyuan_mountain` | 中原 | 远山叠嶂 + 松树剪影 |
| `zhongyuan_temple_indoor` | 中原 | 太虚剑宗室内 |
| `jiangnan_rain` | 江南 | 烟雨楼台 + 柳枝 |
| `jiangnan_tavern` | 江南 | 听雨阁/酒馆 |
| `saibei_desert` | 塞北 | 大漠孤烟 + 城墙 |
| `saibei_camp` | 塞北 | 铁骑营营地 |
| `shuzhong_mountain` | 蜀中 | 云雾缭绕 + 竹林 |
| `shuzhong_herb_garden` | 蜀中 | 药王谷药圃 |
| `xiyu_sand` | 西域 | 沙丘 + 驼铃 |
| `xiyu_flame_temple` | 西域 | 焚天教火焰圣殿 |
| `nightscape` | 通用 | 子时通用夜景 |
| `combat_arena` | 通用 | 战斗场地 |

---

## 战斗事件格式

```json
{
  "id": "day25_li_wushuang_duel",
  "type": "combat",
  "priority": 100,
  "trigger": {
    "timeslot": "noon",
    "conditions": [
      { "type": "flag", "key": "li_wushuang_deal_accepted" }
    ]
  },
  "scene": {
    "background": "xiyu_flame_temple",
    "description": "厉无双站在火焰圣殿前，目光如炬。"
  },
  "combat": {
    "type": "story",
    "enemies": [
      { "id": "li_wushuang", "name": "厉无双", "health": 300, "qi": 200, "attack": 45, "defense": 20, "speed": 25,
        "moves": ["焚天剑诀", "噬魂夺魄"] }
    ],
    "rewards": [
      { "type": "flag", "key": "defeated_li_wushuang", "set": true },
      { "type": "favor", "npc": "liwushuang", "awe": 20, "trust": 5 }
    ],
    "onDefeat": "day25_post_duel_dialogue",
    "onFlee": null
  }
}
```

---

## NPC 与武学数据格式

### npcs.json

```json
{
  "suqingheng": {
    "name": "苏青衡",
    "title": "青锋",
    "faction": "taixu",
    "gender": "male",
    "age": 22,
    "initialFavor": { "trust": 50, "intimacy": 30, "awe": 20, "fear": 5 },
    "portrait": "suqingheng.png"
  }
}
```

### martial-arts.json

```json
{
  "taixu_13_swords": {
    "name": "太虚十三剑",
    "faction": "taixu",
    "element": "sword",
    "type": "attack",
    "target": "single",
    "baseDamage": 25,
    "qiCost": 30,
    "effect": null,
    "unlockCondition": null
  }
}
```

---

## 随机事件池

`random-events.json` 定义各地区可随机触发的事件：

```json
{
  "zhongyuan": [
    {
      "id": "random_teahouse_intel",
      "weight": 30,
      "dialogues": [
        { "speaker": "narrator", "text": "你在茶馆歇脚，听到邻桌谈论武林盟主大会……" }
      ],
      "choices": [
        {
          "id": "listen_carefully",
          "text": "「仔细听听。」",
          "effects": [
            { "type": "flag", "key": "heard_alliance_rumors", "set": true }
          ]
        },
        {
          "id": "ignore",
          "text": "「与我无关。」",
          "effects": []
        }
      ]
    }
  ]
}
```

**权值机制**：同一地区每个随机事件有 `weight`，引擎按权值抽选。权重 = 越容易被选中。

---

## 事件总量估算

| 内容类型 | 数量 | 说明 |
|----------|------|------|
| 剧情事件 | ~120-150 | 每天 4-5 个核心事件，每事件 2-4 个选项 |
| 随机事件池 | ~5-8/地区 | 5 个地区 × 5-8 个随机事件 |
| 战斗事件 | ~30-40 | 含剧情战 + NPC 挑战 |
| 结局事件 | 7 | 第 30 天结尾判定 |

**总 JSON 脚本量**：约 200-300 个事件定义，分摊在 30 个 day 文件中。

---

## JSON Schema 校验

所有 JSON 文件在构建时通过 `zod`（或 `ajv`）校验：

```typescript
// engine/types.ts 中用 zod 定义 schema
import { z } from 'zod';

const FavorEffectSchema = z.object({
  type: z.literal('favor'),
  npc: z.string(),
  trust: z.number().int().min(-100).max(100).optional(),
  intimacy: z.number().int().min(-100).max(100).optional(),
  awe: z.number().int().min(-100).max(100).optional(),
  fear: z.number().int().min(-100).max(100).optional(),
  ripple: z.object({
    dim: z.enum(['trust', 'intimacy', 'awe', 'fear']),
    delta: z.number().int().min(-50).max(50)
  }).optional()
});

// ... 其他 schema 类型
```

构建命令：`vite build` 时自动校验所有 JSON 数据，格式错误则构建失败。
