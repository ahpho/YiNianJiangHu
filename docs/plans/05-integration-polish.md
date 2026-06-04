# Phase 5: 端到端集成与打磨

> **目标**: 将 Phase 2（引擎）、Phase 3（数据）、Phase 4（UI）三大模块贯通，实现从「开始游戏」到「触发结局」的完整可玩流程，并加入存档与二周目能力。

---

## Task 38: Engine + Data 集成测试

**目的**: 用真实 JSON 数据跑完整事件流程，验证 Engine 各模块与数据层的对接无误。

### 38.1 创建集成测试用事件数据

文件: `src/data/events/_test_day01.json`

```json
{
  "day": 1,
  "events": [
    {
      "id": "day1_intro",
      "type": "story",
      "priority": 100,
      "trigger": {
        "timeslot": "dawn",
        "location": "zhongyuan",
        "conditions": []
      },
      "scene": {
        "background": "zhongyuan_mountain",
        "description": "嵩山脚下，晨雾未散。你背着包袱站在山门前，江湖在你面前展开。",
        "ambient": "outdoor_birds"
      },
      "dialogues": [
        {
          "speaker": "narrator",
          "text": "三十天。你只有三十天。",
          "emotion": "neutral"
        },
        {
          "speaker": "laowei",
          "text": "小兄弟，第一次来嵩山？老夫给你指条明路。",
          "emotion": "friendly"
        }
      ],
      "choices": [
        {
          "id": "accept_guidance",
          "text": "「多谢前辈指点。」",
          "conditions": [],
          "effects": [
            { "type": "favor", "npc": "laowei", "trust": 5, "intimacy": 3, "ripple": { "dim": "awe", "delta": -1 } },
            { "type": "flag", "key": "accepted_laowei_guidance", "set": true },
            { "type": "reputation", "faction": "taixu", "delta": 5 }
          ],
          "nextEvent": null
        },
        {
          "id": "decline_guidance",
          "text": "「我自己能行。」",
          "conditions": [],
          "effects": [
            { "type": "favor", "npc": "laowei", "trust": -3, "awe": 5 },
            { "type": "flag", "key": "rejected_laowei_guidance", "set": true }
          ],
          "nextEvent": null
        },
        {
          "id": "ignore_laowei",
          "text": "「你是谁？」",
          "conditions": [],
          "effects": [
            { "type": "favor", "npc": "laowei", "trust": -5, "fear": 2 },
            { "type": "flag", "key": "suspicious_of_laowei", "set": true }
          ],
          "nextEvent": "day1_laowei_backstory"
        }
      ],
      "nextEvent": null
    },
    {
      "id": "day1_laowei_backstory",
      "type": "story",
      "priority": 50,
      "trigger": {
        "timeslot": "dawn",
        "location": "zhongyuan",
        "conditions": [
          { "type": "flag", "key": "suspicious_of_laowei" }
        ]
      },
      "scene": {
        "background": "zhongyuan_mountain",
        "description": "老者微微一笑，眼中闪过一丝深意。",
        "ambient": "outdoor_wind"
      },
      "dialogues": [
        {
          "speaker": "laowei",
          "text": "老夫？不过是这嵩山脚下一壶浊酒罢了。你若信便信，不信……江湖路远，各自珍重。",
          "emotion": "mysterious"
        }
      ],
      "choices": [
        {
          "id": "apologize",
          "text": "「前辈莫怪，是我多心了。」",
          "conditions": [],
          "effects": [
            { "type": "favor", "npc": "laowei", "trust": 8, "intimacy": 2 }
          ],
          "nextEvent": null
        }
      ],
      "nextEvent": null
    },
    {
      "id": "day1_combat_trial",
      "type": "combat",
      "priority": 80,
      "trigger": {
        "timeslot": "dawn",
        "location": "zhongyuan",
        "conditions": [
          { "type": "flag", "key": "accepted_laowei_guidance" }
        ]
      },
      "scene": {
        "background": "zhongyuan_mountain",
        "description": "山门前的空地上，几个蒙面人拦住了去路。"
      },
      "combat": {
        "type": "encounter",
        "enemies": [
          {
            "id": "bandit_scout",
            "name": "山贼探子",
            "health": 60,
            "qi": 40,
            "attack": 12,
            "defense": 5,
            "speed": 8,
            "moves": ["劈刀"]
          }
        ],
        "rewards": [
          { "type": "flag", "key": "cleared_day1_bandits", "set": true },
          { "type": "reputation", "faction": "taixu", "delta": 3 }
        ],
        "onDefeat": null,
        "onFlee": "day1_flee_success"
      }
    }
  ]
}
```

### 38.2 编写集成测试

文件: `src/__tests__/integration.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTimeEngine } from '../engine/TimeEngine';
import { createFavorEngine } from '../engine/FavorEngine';
import { createEventEngine } from '../engine/EventEngine';
import { createFlagEngine } from '../engine/FlagEngine';
import { createCombatEngine } from '../engine/CombatEngine';
import { createEndingEngine } from '../engine/EndingEngine';
import type { GameState, Timeslot, NPC_ID, FavorDim } from '../engine/types';

// ---------- helpers ----------

const NPC_IDS: NPC_ID[] = [
  'suqingheng', 'qingxuzhenren', 'shentinyu', 'luxiaoman',
  'xiaopodi', 'ayiguli', 'baixiaolian', 'liusuifeng',
  'liwushuang', 'huochangqing', 'chubaiyi', 'laowei',
];

function createInitialState(): GameState {
  const npcFavors: GameState['npcFavors'] = {};
  for (const id of NPC_IDS) {
    npcFavors[id] = { trust: 0, intimacy: 0, awe: 0, fear: 0 };
  }
  return {
    currentDay: 1,
    currentTimeslot: 'dawn' as Timeslot,
    location: 'zhongyuan',
    npcFavors,
    factionReputation: { taixu: 0, tingyu: 0, tieqi: 0, yaowang: 0, fentian: 0, court: 0, independent: 0 },
    learnedMartialArts: [],
    equippedSkills: [],
    health: 100,
    qi: 100,
    maxQi: 100,
    flags: new Set<string>(),
    endingsUnlocked: [],
    discoveredNpcs: [],
    isSecondPlaythrough: false,
    combatPending: null,
  };
}

// ---------- tests ----------

describe('Engine + Data 集成测试', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState();
  });

  it('TimeEngine 推进时辰从 dawn 到 noon', () => {
    const timeEngine = createTimeEngine();
    const next = timeEngine.advance(state);
    expect(next.currentTimeslot).toBe('noon');
    expect(next.currentDay).toBe(1);
  });

  it('TimeEngine 推进到 day1 末尾后进入 day2', () => {
    const timeEngine = createTimeEngine();
    let s = state;
    // dawn -> noon -> dusk -> night -> (next day dawn)
    s = timeEngine.advance(s); // noon
    s = timeEngine.advance(s); // dusk
    s = timeEngine.advance(s); // night
    s = timeEngine.advance(s); // day2 dawn
    expect(s.currentDay).toBe(2);
    expect(s.currentTimeslot).toBe('dawn');
  });

  it('FlagEngine 设置和读取标记', () => {
    const flagEngine = createFlagEngine();
    expect(flagEngine.has(state, 'some_flag')).toBe(false);

    const s1 = flagEngine.set(state, 'some_flag', true);
    expect(flagEngine.has(s1, 'some_flag')).toBe(true);

    const s2 = flagEngine.set(s1, 'some_flag', false);
    expect(flagEngine.has(s2, 'some_flag')).toBe(false);
  });

  it('FavorEngine 应用好感度变化（含 ripple 联动）', () => {
    const favorEngine = createFavorEngine();
    const delta = { trust: 10, intimacy: 5, awe: 0, fear: 0 };
    const ripple = { dim: 'awe' as FavorDim, delta: -3 };

    const s1 = favorEngine.apply(state, 'laowei', delta, ripple);

    expect(s1.npcFavors.laowei.trust).toBe(10);
    expect(s1.npcFavors.laowei.intimacy).toBe(5);
    expect(s1.npcFavors.laowei.awe).toBe(-3);
    expect(s1.npcFavors.laowei.fear).toBe(0);
  });

  it('FavorEngine 好感度 clamp 到 0-100 范围', () => {
    const favorEngine = createFavorEngine();
    const delta = { trust: 110, intimacy: 0, awe: 0, fear: 0 };
    const s1 = favorEngine.apply(state, 'laowei', delta);
    expect(s1.npcFavors.laowei.trust).toBe(100);

    const delta2 = { trust: 0, intimacy: 0, awe: 0, fear: -20 };
    const s2 = favorEngine.apply(s1, 'laowei', delta2);
    expect(s2.npcFavors.laowei.fear).toBe(0);
  });

  it('EventEngine 查找 day1 dawn 事件', () = {
    const eventEngine = createEventEngine();
    const testDayData = {
      day: 1,
      events: [
        {
          id: 'day1_intro',
          type: 'story',
          priority: 100,
          trigger: { timeslot: 'dawn', location: 'zhongyuan', conditions: [] },
          scene: { background: 'zhongyuan_mountain', description: 'test' },
          dialogues: [],
          choices: [
            {
              id: 'accept_guidance',
              text: 'accept',
              conditions: [],
              effects: [
                { type: 'favor', npc: 'laowei', trust: 5, intimacy: 3, ripple: { dim: 'awe', delta: -1 } },
                { type: 'flag', key: 'accepted_laowei_guidance', set: true },
              ],
              nextEvent: null,
            },
          ],
          nextEvent: null,
        },
      ],
    };

    const events = eventEngine.findAvailable(state, testDayData);
    expect(events.length).toBe(1);
    expect(events[0].id).toBe('day1_intro');
  });

  it('EventEngine 有 flag 条件时不匹配无标记状态', () => {
    const eventEngine = createEventEngine();
    const testDayData = {
      day: 1,
      events: [
        {
          id: 'day1_trigger',
          type: 'story',
          priority: 10,
          trigger: {
            timeslot: 'dawn',
            location: 'zhongyuan',
            conditions: [{ type: 'flag', key: 'accepted_laowei_guidance' }],
          },
          scene: { background: 'zhongyuan_mountain', description: 'test' },
          dialogues: [],
          choices: [],
          nextEvent: null,
        },
      ],
    };

    const events = eventEngine.findAvailable(state, testDayData);
    expect(events.length).toBe(0);
  });

  it('EventEngine 有 flag 条件时匹配已标记状态', () => {
    const flagEngine = createFlagEngine();
    const eventEngine = createEventEngine();
    const flaggedState = flagEngine.set(state, 'accepted_laowei_guidance', true);

    const testDayData = {
      day: 1,
      events: [
        {
          id: 'day1_trigger',
          type: 'story',
          priority: 10,
          trigger: {
            timeslot: 'dawn',
            location: 'zhongyuan',
            conditions: [{ type: 'flag', key: 'accepted_laowei_guidance' }],
          },
          scene: { background: 'zhongyuan_mountain', description: 'test' },
          dialogues: [],
          choices: [],
          nextEvent: null,
        },
      ],
    };

    const events = eventEngine.findAvailable(flaggedState, testDayData);
    expect(events.length).toBe(1);
    expect(events[0].id).toBe('day1_trigger');
  });

  it('Effect 执行: flag + favor + reputation 一次性应用', () => {
    const eventEngine = createEventEngine();
    const effects = [
      { type: 'favor', npc: 'laowei', trust: 5, intimacy: 3, ripple: { dim: 'awe', delta: -1 } },
      { type: 'flag', key: 'accepted_laowei_guidance', set: true },
      { type: 'reputation', faction: 'taixu', delta: 5 },
    ];

    const s1 = eventEngine.applyEffects(state, effects);
    expect(s1.npcFavors.laowei.trust).toBe(5);
    expect(s1.npcFavors.laowei.awe).toBe(-1);
    expect(s1.flags.has('accepted_laowei_guidance')).toBe(true);
    expect(s1.factionReputation.taixu).toBe(5);
  });

  it('CombatEngine 初始化战斗', () => {
    const combatEngine = createCombatEngine();
    const enemies = [
      { id: 'bandit_scout', name: '山贼探子', health: 60, qi: 40, attack: 12, defense: 5, speed: 8, moves: ['劈刀'] },
    ];

    const battle = combatEngine.init(state, enemies);
    expect(battle.enemies.length).toBe(1);
    expect(battle.enemies[0].health).toBe(60);
    expect(battle.turnOrder.length).toBeGreaterThan(0);
    expect(battle.isFinished).toBe(false);
  });

  it('CombatEngine 玩家使用武学攻击敌人', () => {
    const combatEngine = createCombatEngine();
    const enemies = [
      { id: 'bandit_scout', name: '山贼探子', health: 60, qi: 40, attack: 12, defense: 5, speed: 8, moves: ['劈刀'] },
    ];

    let battle = combatEngine.init(state, enemies);
    const battleState = combatEngine.executePlayerAction(battle, state, {
      type: 'skill',
      skillId: 'taixu_13_swords',
    });

    // 敌人血量应减少（伤害至少为正）
    const enemyAfter = battleState.enemies.find(e => e.id === 'bandit_scout');
    expect(enemyAfter!.health).toBeLessThan(60);
  });

  it('CombatEngine 战斗结束判定', () => {
    const combatEngine = createCombatEngine();
    const enemies = [
      { id: 'bandit_scout', name: '山贼探子', health: 1, qi: 0, attack: 12, defense: 0, speed: 8, moves: ['劈刀'] },
    ];

    let battle = combatEngine.init(state, enemies);
    // 一击必杀
    const result = combatEngine.executePlayerAction(battle, state, {
      type: 'skill',
      skillId: 'taixu_13_swords',
    });

    expect(result.isFinished).toBe(true);
    expect(result.victory).toBe(true);
  });

  it('EndingEngine 在 day30 末尾判定结局', () => {
    const endingEngine = createEndingEngine();
    const day30State: GameState = {
      ...state,
      currentDay: 30,
      currentTimeslot: 'night',
      npcFavors: {
        ...state.npcFavors,
        suqingheng: { trust: 85, intimacy: 90, awe: 20, fear: 5 },
      },
      factionReputation: { ...state.factionReputation, taixu: 70 },
      flags: new Set(['left_jianghu_day29']),
    };

    const ending = endingEngine.evaluate(day30State);
    expect(ending).not.toBeNull();
    // 亲密>=80 + 信任>=70 + left_jianghu => 归隐山林
    expect(ending!.id).toBe('ending_retire');
  });
});
```

### 38.3 运行命令与预期输出

```bash
npx vitest run src/__tests__/integration.test.ts
```

预期输出:

```
 ✓ src/__tests__/integration.test.ts (13 tests) 12ms

Test Files  1 passed (1)
     Tests  13 passed (13)
```

### 38.4 验收标准

- [ ] 13 个测试全部通过
- [ ] TimeEngine 推进覆盖 dawn->noon->dusk->night->nextDay 完整链路
- [ ] FavorEngine 的 ripple 联动（信任升→敬畏降）正确执行
- [ ] EventEngine 条件求值（flag / favor / composite）与 JSON 数据一致
- [ ] CombatEngine 攻击→伤害→死亡判定链路完整
- [ ] EndingEngine 在 day30 条件满足时正确输出结局

---

## Task 39: Engine + UI 集成（Zustand Store 连接 Engine）

**目的**: 让 Zustand store 的 action 方法调用 Engine 纯函数，UI 渲染完全由 store 驱动。

### 39.1 定义 Zustand Store

文件: `src/ui/store/gameStore.ts`

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createTimeEngine } from '../../engine/TimeEngine';
import { createFavorEngine } from '../../engine/FavorEngine';
import { createEventEngine } from '../../engine/EventEngine';
import { createFlagEngine } from '../../engine/FlagEngine';
import { createCombatEngine } from '../../engine/CombatEngine';
import { createEndingEngine } from '../../engine/EndingEngine';
import type {
  GameState,
  ScreenId,
  Timeslot,
  Location,
  NPC_ID,
  Event,
  Combatant,
  CombatAction,
  SaveData,
} from '../../engine/types';

const timeEngine = createTimeEngine();
const favorEngine = createFavorEngine();
const eventEngine = createEventEngine();
const flagEngine = createFlagEngine();
const combatEngine = createCombatEngine();
const endingEngine = createEndingEngine();

function initialGameState(): GameState {
  const npcFavors: GameState['npcFavors'] = {};
  const npcIds: NPC_ID[] = [
    'suqingheng', 'qingxuzhenren', 'shentinyu', 'luxiaoman',
    'xiaopodi', 'ayiguli', 'baixiaolian', 'liusuifeng',
    'liwushuang', 'huochangqing', 'chubaiyi', 'laowei',
  ];
  for (const id of npcIds) {
    npcFavors[id] = { trust: 0, intimacy: 0, awe: 0, fear: 0 };
  }
  return {
    currentDay: 1,
    currentTimeslot: 'dawn' as Timeslot,
    location: 'zhongyuan',
    npcFavors,
    factionReputation: {
      taixu: 0, tingyu: 0, tieqi: 0,
      yaowang: 0, fentian: 0, court: 0, independent: 0,
    },
    learnedMartialArts: [],
    equippedSkills: [],
    health: 100,
    qi: 100,
    maxQi: 100,
    flags: new Set<string>(),
    endingsUnlocked: [],
    discoveredNpcs: [],
    isSecondPlaythrough: false,
    combatPending: null,
  };
}

interface CombatBattleState {
  enemies: Combatant[];
  turnOrder: string[];
  currentTurn: number;
  log: string[];
  isFinished: boolean;
  victory: boolean;
}

interface GameStore {
  // --- state ---
  state: GameState;
  screen: ScreenId;
  currentEvent: Event | null;
  combat: CombatBattleState | null;
  eventQueue: Event[];
  dialogueIndex: number;
  isTypewriter: boolean;

  // --- screen ---
  navigate: (screen: ScreenId) => void;

  // --- game flow ---
  startGame: (isSecondPlaythrough?: boolean) => void;
  loadAvailableEvents: (dayData: { day: number; events: Event[] }) => void;
  selectEvent: (eventId: string) => void;

  // --- dialogue ---
  advanceDialogue: () => void;
  skipTypewriter: () => void;

  // --- choices ---
  chooseAction: (choiceId: string) => void;

  // --- time ---
  advanceTimeslot: () => void;

  // --- rest ---
  rest: () => void;

  // --- combat ---
  startCombat: (enemies: Combatant[]) => void;
  executeCombatAction: (action: CombatAction) => void;
  endCombat: (victory: boolean) => void;

  // --- save ---
  exportSave: () => SaveData;
  importSave: (save: SaveData) => void;

  // --- reset ---
  reset: () => void;
}

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        state: initialGameState(),
        screen: 'title',
        currentEvent: null,
        combat: null,
        eventQueue: [],
        dialogueIndex: 0,
        isTypewriter: false,

        navigate: (screen) => set({ screen }),

        startGame: (isSecondPlaythrough = false) =>
          const fresh = initialGameState();
          fresh.isSecondPlaythrough = isSecondPlaythrough;
          set({
            state: fresh,
            screen: 'game',
            currentEvent: null,
            combat: null,
            eventQueue: [],
            dialogueIndex: 0,
          });
        },

        loadAvailableEvents: (dayData) => {
          const { state } = get();
          const events = eventEngine.findAvailable(state, dayData);
          set({ eventQueue: events });
        },

        selectEvent: (eventId) => {
          const { eventQueue } = get();
          const event = eventQueue.find(e => e.id === eventId) ?? null;
          set({
            currentEvent: event,
            dialogueIndex: 0,
            eventQueue: eventQueue.filter(e => e.id !== eventId),
          });
        },

        advanceDialogue: () => {
          const { currentEvent, dialogueIndex } = get();
          if (!currentEvent) return;
          const nextIndex = dialogueIndex + 1;
          if (nextIndex < currentEvent.dialogues.length) {
            set({ dialogueIndex: nextIndex, isTypewriter: true });
          } else {
            set({ dialogueIndex: nextIndex });
          }
        },

        skipTypewriter: () => set({ isTypewriter: false }),

        chooseAction: (choiceId) => {
          const { state, currentEvent } = get();
          if (!currentEvent) return;
          const choice = currentEvent.choices.find(c => c.id === choiceId);
          if (!choice) return;

          // apply effects
          let newState = eventEngine.applyEffects(state, choice.effects);

          // handle combat trigger
          const combatEffect = choice.effects.find(e => e.type === 'combat');
          if (combatEffect && combatEffect.type === 'combat') {
            const battle = combatEngine.init(newState, combatEffect.enemyIds);
            set({
              state: newState,
              combat: battle,
              screen: 'combat',
              currentEvent: null,
              dialogueIndex: 0,
            });
            return;
          }

          // handle nextEvent
          const nextEventId = choice.nextEvent ?? currentEvent.nextEvent;
          set({
            state: newState,
            currentEvent: null,
            dialogueIndex: 0,
          });

          if (nextEventId) {
            get().selectEvent(nextEventId);
          }
        },

        advanceTimeslot: () => {
          const { state } = get();
          const next = timeEngine.advance(state);

          // Check day30 ending
          if (next.currentDay > 30) {
            const ending = endingEngine.evaluate(state);
            if (ending) {
              const updatedState = {
                ...next,
                endingsUnlocked: [...state.endingsUnlocked, ending.id],
              };
              set({
                state: updatedState,
                screen: 'ending',
              });
              return;
            }
          }

          set({ state: next });
        },

        rest: () => {
          const { state } = get();
          const qiRecover = Math.min(30, state.maxQi - state.qi);
          const healthRecover = Math.min(20, 100 - state.health);
          set({
            state: {
              ...state,
              qi: state.qi + qiRecover,
              health: state.health + healthRecover,
            },
          });
          get().advanceTimeslot();
        },

        startCombat: (enemies) => {
          const { state } = get();
          const battle = combatEngine.init(state, enemies);
          set({ combat: battle, screen: 'combat' });
        },

        executeCombatAction: (action) => {
          const { combat, state } = get();
          if (!combat || combat.isFinished) return;
          const updated = combatEngine.executePlayerAction(combat, state, action);
          set({ combat: updated });
        },

        endCombat: (victory) => {
          const { state, combat } = get();
          if (!combat) return;
          let newState = state;
          if (victory && combat.rewards) {
            newState = eventEngine.applyEffects(state, combat.rewards);
          }
          set({
            state: newState,
            combat: null,
            screen: 'game',
          });
        },

        exportSave: () => {
          const { state } = get();
          return {
            version: 1,
            timestamp: Date.now(),
            state: {
              ...state,
              flags: Array.from(state.flags),
            },
          };
        },

        importSave: (save) => {
          const restored: GameState = {
            ...save.state,
            flags: new Set(save.state.flags as unknown as string[]),
          };
          set({ state: restored, screen: 'game' });
        },

        reset: () => {
          set({
            state: initialGameState(),
            screen: 'title',
            currentEvent: null,
            combat: null,
            eventQueue: [],
            dialogueIndex: 0,
          });
        },
      }),
      {
        name: 'yinian-jianghu-save',
        partialize: (store) => ({
          state: {
            ...store.state,
            flags: Array.from(store.state.flags),
          },
        }),
        merge: (persisted, current) => {
          const data = persisted as Record<string, unknown>;
          return {
            ...current,
            state: {
              ...(data.state as GameState),
              flags: new Set(data.state?.flags as string[]),
            },
          };
        },
      }
    )
  )
);
```

### 39.2 创建 Engine 工厂函数导出

需要确保每个 Engine 模块导出 `create*Engine` 工厂函数。检查并补充以下导出:

文件: `src/engine/TimeEngine.ts` (确保导出)

```typescript
export function createTimeEngine() {
  return {
    advance(state: GameState): GameState {
      const timeslots: Timeslot[] = ['dawn', 'noon', 'dusk', 'night'];
      const currentIndex = timeslots.indexOf(state.currentTimeslot);

      if (currentIndex < timeslots.length - 1) {
        return {
          ...state,
          currentTimeslot: timeslots[currentIndex + 1],
        };
      }
      // night -> next day dawn
      return {
        ...state,
        currentDay: state.currentDay + 1,
        currentTimeslot: 'dawn',
        qi: Math.min(state.maxQi, state.qi + 20),
      };
    },

    isDayEnd(state: GameState): boolean {
      return state.currentTimeslot === 'night';
    },

    isGameOver(state: GameState): boolean {
      return state.currentDay > 30;
    },
  };
}
```

文件: `src/engine/FavorEngine.ts` (确保导出)

```typescript
import type { GameState, NPC_ID, FavorDim } from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createFavorEngine() {
  return {
    apply(
      state: GameState,
      npcId: NPC_ID,
      delta: { trust?: number; intimacy?: number; awe?: number; fear?: number },
      ripple?: { dim: FavorDim; delta: number }
    ): GameState {
      const current = state.npcFavors[npcId];
      const updated = { ...current };

      if (delta.trust !== undefined) updated.trust = clamp(updated.trust + delta.trust, 0, 100);
      if (delta.intimacy !== undefined) updated.intimacy = clamp(updated.intimacy + delta.intimacy, 0, 100);
      if (delta.awe !== undefined) updated.awe = clamp(updated.awe + delta.awe, 0, 100);
      if (delta.fear !== undefined) updated.fear = clamp(updated.fear + delta.fear, 0, 100);

      if (ripple) {
        updated[ripple.dim] = clamp(updated[ripple.dim] + ripple.delta, 0, 100);
      }

      return {
        ...state,
        npcFavors: { ...state.npcFavors, [npcId]: updated },
      };
    },

    getThreshold(favorValue: number): string {
      if (favorValue <= 20) return 'hostile';
      if (favorValue <= 40) return 'cold';
      if (favorValue <= 60) return 'normal';
      if (favorValue <= 80) return 'friendly';
      return 'close';
    },

    getTotalFavor(state: GameState, npcId: NPC_ID): number {
      const f = state.npcFavors[npcId];
      return f.trust + f.intimacy + f.awe + f.fear;
    },
  };
}
```

文件: `src/engine/EventEngine.ts` (确保导出)

```typescript
import type { GameState, Event, Condition, Effect } from './types';
import { createFavorEngine } from './FavorEngine';
import { createFlagEngine } from './FlagEngine';

const favorEngine = createFavorEngine();
const flagEngine = createFlagEngine();

function evaluateCondition(state: GameState, condition: Condition): boolean {
  switch (condition.type) {
    case 'timeslot':
      return state.currentTimeslot === condition.value;
    case 'location':
      return state.location === condition.value;
    case 'day': {
      const ops: Record<string, (a: number, b: number) => boolean> = {
        '>': (a, b) => a > b,
        '>=': (a, b) => a >= b,
        '==': (a, b) => a === b,
        '<=': (a, b) => a <= b,
        '<': (a, b) => a < b,
      };
      return (ops[condition.op]?.(state.currentDay, condition.value)) ?? false;
    }
    case 'flag':
      return flagEngine.has(state, condition.key) === (condition.present ?? true);
    case 'favor': {
      const f = state.npcFavors[condition.npc];
      if (!f) return false;
      const val = f[condition.dim];
      const ops: Record<string, (a: number, b: number) => boolean> = {
        '>=': (a, b) => a >= b,
        '<=': (a, b) => a <= b,
        '>': (a, b) => a > b,
        '<': (a, b) => a < b,
      };
      return (ops[condition.op]?.(val, condition.value)) ?? false;
    }
    case 'and':
      return condition.conditions.every(c => evaluateCondition(state, c));
    case 'or':
      return condition.conditions.some(c => evaluateCondition(state, c));
    case 'not':
      return !evaluateCondition(state, condition.condition);
    default:
      return false;
  }
}

export function createEventEngine() {
  return {
    findAvailable(state: GameState, dayData: { day: number; events: Event[] }): Event[] {
      return dayData.events
        .filter(event => {
          if (event.trigger.timeslot && event.trigger.timeslot !== state.currentTimeslot) return false;
          if (event.trigger.location && event.trigger.location !== state.location) return false;
          if (event.trigger.conditions) {
            return event.trigger.conditions.every(c => evaluateCondition(state, c));
          }
          return true;
        })
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    },

    evaluateCondition,

    applyEffects(state: GameState, effects: Effect[]): GameState {
      let current = state;
      for (const effect of effects) {
        switch (effect.type) {
          case 'favor': {
            const ripple = effect.ripple
            current = favorEngine.apply(
              current,
              effect.npc,
              {
                trust: effect.trust,
                intimacy: effect.intimacy,
                awe: effect.awe,
                fear: effect.fear,
              },
              ripple
            );
            break;
          }
          case 'flag':
            current = flagEngine.set(current, effect.key, effect.set);
            break;
          case 'reputation':
            current = {
              ...current,
              factionReputation: {
                ...current.factionReputation,
                [effect.faction]: (current.factionReputation[effect.faction] ?? 0) + effect.delta,
              },
            };
            break;
          case 'stat':
            current = {
              ...current,
              [effect.stat]: Math.max(0, current[effect.stat] + effect.delta),
            };
            break;
          default:
            break;
        }
      }
      return current;
    },
  };
}
```

文件: `src/engine/FlagEngine.ts` (确保导出)

```typescript
import type { GameState } from './types';

export function createFlagEngine() {
  return {
    has(state: GameState, key: string): boolean {
      return state.flags.has(key);
    },

    set(state: GameState, key: string, value: boolean): GameState {
      const newFlags = new Set(state.flags);
      if (value) {
        newFlags.add(key);
      } else {
        newFlags.delete(key);
      }
      return { ...state, flags: newFlags };
    },

    getAll(state: GameState): string[] {
      return Array.from(state.flags);
    },
  };
}
```

### 39.3 编写 Store 单元测试

文件: `src/__tests__/gameStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../ui/store/gameStore';

describe('GameStore 集成测试', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('初始状态是 title 屏幕', () => {
    const { screen } = useGameStore.getState();
    expect(screen).toBe('title');
  });

  it('startGame 切换到 game 屏幕', () => {
    useGameStore.getState().startGame();
    const { screen, state } = useGameStore.getState();
    expect(screen).toBe('game');
    expect(state.currentDay).toBe(1);
    expect(state.currentTimeslot).toBe('dawn');
  });

  it('startGame 设置二周目标记', () => {
    useGameStore.getState().startGame(true);
    expect(useGameStore.getState().state.isSecondPlaythrough).toBe(true);
  });

  it('advanceTimeslot 推进时辰', () => {
    useGameStore.getState().startGame();
    useGameStore.getState().advanceTimeslot();
    expect(useGameStore.getState().state.currentTimeslot).toBe('noon');
  });

  it('rest 恢复气力和生命', () => {
    useGameStore.getState().startGame();
    // 先消耗一些属性
    useGameStore.setState({
      state: { ...useGameStore.getState().state, qi: 50, health: 80 },
    });
    useGameStore.getState().rest();
    const { qi, health } = useGameStore.getState().state;
    expect(qi).toBe(80); // 50 + 30
    expect(health).toBe(100); // 80 + 20, clamped at 100
  });

  it('exportSave 导出正确的格式', () => {
    useGameStore.getState().startGame();
    const save = useGameStore.getState().exportSave();
    expect(save.version).toBe(1);
    expect(save.timestamp).toBeGreaterThan(0);
    expect(save.state).toBeDefined();
  });

  it('importSave 恢复存档', () => {
    useGameStore.getState().startGame();
    useGameStore.getState().advanceTimeslot();
    const save = useGameStore.getState().exportSave();

    useGameStore.getState().reset();
    expect(useGameStore.getState().screen).toBe('title');

    useGameStore.getState().importSave(save);
    const { screen, state } = useGameStore.getState();
    expect(screen).toBe('game');
    expect(state.currentTimeslot).toBe('noon');
  });

  it('navigate 切换屏幕', () => {
    useGameStore.getState().navigate('graph');
    expect(useGameStore.getState().screen).toBe('graph');

    useGameStore.getState().navigate('game');
    expect(useGameStore.getState().screen).toBe('game');
  });
});
```

### 39.4 运行命令与预期输出

```bash
npx vitest run src/__tests__/gameStore.test.ts
```

预期输出:

```
 ✓ src/__tests__/gameStore.test.ts (8 tests) 15ms

Test Files  1 passed (1)
     Tests  8 passed (8)
```

### 39.5 验收标准

- [ ] 8 个 Store 测试全部通过
- [ ] `startGame()` 正确初始化 state 并设置 screen
- [ ] `advanceTimeslot()` 调用 TimeEngine 并更新 store
- [ ] `rest()` 恢复属性并自动推进时辰
- [ ] `exportSave()` / `importSave()` 序列化和反序列化 state（含 Set 类型）
- [ ] Zustand persist 中间件在 devtools 中可见

---

## Task 40: 完整游戏流程打通

**目的**: 从 TitleScreen 开始，经历事件选择、好感度变化、时间推进，直到触发结局的完整链路测试。

### 40.1 创建完整流程测试数据

文件: `src/__tests__/fixtures/test-day-data.ts`

```typescript
import type { Event, DayData } from '../../engine/types';

export const day1Events: DayData = {
  day: 1,
  events: [
    {
      id: 'day1_intro',
      type: 'story',
      priority: 100,
      trigger: {
        timeslot: 'dawn',
        location: 'zhongyuan',
        conditions: [],
      },
      scene: {
        background: 'zhongyuan_mountain',
        description: '嵩山脚下，晨雾未散。',
      },
      dialogues: [
        { speaker: 'narrator', text: '江湖，你来了。', emotion: 'neutral' },
      ],
      choices: [
        {
          id: 'be_friendly',
          text: '「请多关照。」',
          conditions: [],
          effects: [
            { type: 'favor', npc: 'laowei', trust: 8, intimacy: 3, ripple: { dim: 'awe', delta: -1 } },
            { type: 'flag', key: 'day1_friendly', set: true },
            { type: 'reputation', faction: 'taixu', delta: 5 },
          ],
          nextEvent: null,
        },
        {
          id: 'be_arrogant',
          text: '「我不需要帮助。」',
          conditions: [],
          effects: [
            { type: 'favor', npc: 'laowei', trust: -5, awe: 8 },
            { type: 'flag', key: 'day1_arrogant', set: true },
          ],
          nextEvent: null,
        },
      ],
      nextEvent: null,
    },
    {
      id: 'day1_combat_after_friendly',
      type: 'combat',
      priority: 90,
      trigger: {
        timeslot: 'dawn',
        location: 'zhongyuan',
        conditions: [{ type: 'flag', key: 'day1_friendly' }],
      },
      scene: {
        background: 'zhongyuan_mountain',
        description: '几个山贼跳了出来。',
      },
      combat: {
        type: 'encounter',
        enemies: [
          { id: 'bandit1', name: '山贼', health: 50, qi: 30, attack: 10, defense: 3, speed: 7, moves: ['劈刀'] },
        ],
        rewards: [
          { type: 'flag', key: 'day1_bandit_defeated', set: true },
          { type: 'reputation', faction: 'taixu', delta: 5 },
        ],
        onDefeat: null,
        onFlee: null,
      },
    },
  ] as Event[],
};

export const day2Events: DayData = {
  day: 2,
  events: [
    {
      id: 'day2_visit_sqingheng',
      type: 'story',
      priority: 100,
      trigger: {
        timeslot: 'dawn',
        location: 'zhongyuan',
        conditions: [],
      },
      scene: {
        background: 'zhongyuan_temple_indoor',
        description: '太虚剑宗演武场。苏青衡正在练剑。',
      },
      dialogues: [
        { speaker: 'suqingheng', text: '来了？陪我过几招。', emotion: 'neutral' },
      ],
      choices: [
        {
          id: 'accept_duel',
          text: '「奉陪到底。」',
          conditions: [],
          effects: [
            { type: 'favor', npc: 'suqingheng', trust: 10, intimacy: 5, awe: 3, ripple: { dim: 'fear', delta: -2 } },
            { type: 'flag', key: 'day2_duel_accepted', set: true },
          ],
          nextEvent: null,
        },
      ],
      nextEvent: null,
    },
  ] as Event[],
};
```

### 40.2 完整流程集成测试

文件: `src/__tests__/full-flow.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../ui/store/gameStore';
import { day1Events, day2Events } from './fixtures/test-day-data';

describe('完整游戏流程打通', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('开局 -> 选行动 -> 好感度变化 -> 时间推进', () => {
    const store = useGameStore.getState();

    // 1. 开始游戏
    store.startGame();
    expect(useGameStore.getState().screen).toBe('game');

    // 2. 加载 day1 事件
    useGameStore.getState().loadAvailableEvents(day1Events);
    const queue = useGameStore.getState().eventQueue;
    expect(queue.length).toBe(1);
    expect(queue[0].id).toBe('day1_intro');

    // 3. 选择事件
    useGameStore.getState().selectEvent('day1_intro');
    expect(useGameStore.getState().currentEvent?.id).toBe('day1_intro');

    // 4. 推进对话
    useGameStore.getState().advanceDialogue();
    // dialogueIndex 现在 >= dialogues.length，可以做选择

    // 5. 选择「请多关照」
    useGameStore.getState().chooseAction('be_friendly');

    // 6. 验
    const stateAfterChoice = useGameStore.getState().state;
    expect(stateAfterChoice.npcFavors.laowei.trust).toBe(8);
    expect(stateAfterChoice.npcFavors.laowei.intimacy).toBe(3);
    expect(stateAfterChoice.npcFavors.laowei.awe).toBe(-1); // ripple: clamp 到 0
    expect(stateAfterChoice.flags.has('day1_friendly')).toBe(true);
    expect(stateAfterChoice.factionReputation.taixu).toBe(5);

    // 7. 推进时辰
    useGameStore.getState().advanceTimeslot();
    expect(useGameStore.getState().state.currentTimeslot).toBe('noon');
  });

  it('战斗触发 -> 进入 CombatScreen -> 战斗 -> 返回 GameScreen', () => {
    const store = useGameStore.getState();
    store.startGame();

    // 加载包含战斗的事件
    useGameStore.getState().loadAvailableEvents(day1Events);

    // 选择友好选项（触发战斗前置条件）
    useGameStore.getState().selectEvent('day1_intro');
    useGameStore.getState().advanceDialogue();
    useGameStore.getState().chooseAction('be_friendly');

    // 再次加载事件，这次战斗事件应该可用了
    useGameStore.getState().loadAvailableEvents(day1Events);
    const queue = useGameStore.getState().eventQueue;
    const combatEvent = queue.find(e => e.type === 'combat');
    expect(combatEvent).toBeDefined();

    // 开始战斗
    if (combatEvent) {
      const enemies = combatEvent.combat.enemies.map(e => ({
        ...e,
        maxHealth: e.health,
        buffs: [],
        debuffs: [],
      }));
      useGameStore.getState().startCombat(enemies);
      expect(useGameStore.getState().screen).toBe('combat');
      expect(useGameStore.getState().combat).not.toBeNull();

      // 执行攻击
      useGameStore.getState().executeCombatAction({
        type: 'skill',
        skillId: 'taixu_13_swords',
      });

      // 结束战斗
      useGameStore.getState().endCombat(true);
      expect(useGameStore.getState().screen).toBe('game');
      expect(useGameStore.getState().combat).toBeNull();
    }
  });

  it('多天流程: day1 -> day2 事件加载切换', () => {
    useGameStore.getState().startGame();

    // day1
    useGameStore.getState().loadAvailableEvents(day1Events);
    useGameStore.getState().selectEvent('day1_intro');
    useGameStore.getState().advanceDialogue();
    useGameStore.getState().chooseAction('be_friendly');

    // 推进到 day2
    const state = useGameStore.getState().state;
    // 快速推进 4 个时辰到 day2
    useGameStore.getState().advanceTimeslot(); // noon
    useGameStore.getState().advanceTimeslot(); // dusk
    useGameStore.getState().advanceTimeslot(); // night
    useGameStore.getState().advanceTimeslot(); // day2 dawn

    expect(useGameStore.getState().state.currentDay).toBe(2);
    expect(useGameStore.getState().state.currentTimeslot).toBe('dawn');

    // 加载 day2 事件
    useGameStore.getState().loadAvailableEvents(day2Events);
    const queue = useGameStore.getState().eventQueue;
    expect(queue.length).toBe(1);
    expect(queue[0].id).toBe('day2_visit_sqingheng');

    // 选择苏青衡剧情
    useGameStore.getState().selectEvent('day2_visit_sqingheng');
    useGameStore.getState().advanceDialogue();
    useGameStore.getState().chooseAction('accept_duel');

    // 验证苏青衡好感度变化
    const s = useGameStore.getState().state;
    expect(s.npcFavors.suqingheng.trust).toBe(10);
    expect(s.npcFavors.suqingheng.intimacy).toBe(5);
    expect(s.npcFavors.suqingheng.awe).toBe(3);
    expect(s.npcFavors.suqingheng.fear).toBe(0); // ripple -2 clamp 到 0
  });
});
```

### 40.3 运行命令与预期输出

```bash
npx vitest run src/__tests__/full-flow.test.ts
```

预期输出:

```
 ✓ src/__tests__/full-flow.test.ts (3 tests) 18ms

Test Files  1 passed (1)
     Tests  3 passed (3)
```

### 40.4 验收标准

- [ ] 开始游戏到好感度变化全链路通过
- [ ] 战斗触发进入 CombatScreen，战斗结束后返回 GameScreen
- [ ] 多天事件加载切换正确，day2 事件仅在 day2 时可用
- [ ] 好感度 ripple 联动在真实流程中正确执行

---

## Task 41: 战斗流程打通

**目的**: 验证从事件触发战斗到 CombatScreen 渲染再到战斗结算回到 GameScreen 的完整流程。

### 41.1 战斗数据定义

文件: `src/__tests__/fixtures/test-combat-data.ts`

```typescript
import type { Combatant } from '../../engine/types';

export const testEnemies: Combatant[] = [
  {
    id: 'bandit_leader',
    name: '山贼头目',
    health: 80,
    maxHealth: 80,
    qi: 50,
    attack: 15,
    defense: 8,
    speed: 10,
    moves: ['劈山斩', '怒吼'],
    buffs: [],
    debuffs: [],
  },
];

export const testBossEnemy: Combatant[] = [
  {
    id: 'liwushuang',
    name: '厉无双',
    health: 300,
    maxHealth: 300,
    qi: 200,
    attack: 45,
    defense: 20,
    speed: 25,
    moves: ['焚天剑诀', '噬魂夺魄'],
    buffs: [],
    debuffs: [],
  },
];
```

### 41.2 战斗流程测试

文件: `src/__tests__/combat-flow.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../ui/store/gameStore';
import { createCombatEngine } from '../../engine/CombatEngine';
import { testEnemies, testBossEnemy } from './fixtures/test-combat-data';

const combatEngine = createCombatEngine();

describe('战斗流程打通', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('startCombat 进入战斗屏幕', () => {
    useGameStore.getState().startGame();
    useGameStore.getState().startCombat(testEnemies);

    const { screen, combat } = useGameStore.getState();
    expect(screen).toBe('combat');
    expect(combat).not.toBeNull();
    expect(combat!.enemies.length).toBe(1);
    expect(combat!.enemies[0].name).toBe('山贼头目');
    expect(combat!.isFinished).toBe(false);
  });

  it('executeCombatAction 扣血和日志', () => {
    useGameStore.getState().startGame();
    useGameStore.getState().startCombat(testEnemies);

    useGameStore.getState().executeCombatAction({
      type: 'skill',
      skillId: 'taixu_13_swords',
    });

    const { combat } = useGameStore.getState();
    expect(combat).not.toBeNull();
    const enemy = combat!.enemies.find(e => e.id === 'bandit_leader');
    expect(enemy!.health).toBeLessThan(80);
    expect(combat!.log.length).toBeGreaterThan(0);
  });

  it('executeCombatAction 防御减少伤害', () => {
    useGameStore.getState().startGame();
    useGameStore.getState().startCombat(testEnemies);

    useGameStore.getState().executeCombatAction({ type: 'defend' });
    const { combat } = useGameStore.getState();
    expect(combat!.log.some(l => l.includes('防御'))).toBe(true);
  });

  it('endCombat(true) 返回 GameScreen 并应用奖励', () => {
    useGameStore.getState().startGame();
    useGameStore.getState().startCombat(testEnemies);

    // 手动结束战斗（跳过回合计算）
    useGameStore.setState({
      combat: {
        ...useGameStore.getState().combat!,
        isFinished: true,
        victory: true,
        rewards: [
          { type: 'flag', key: 'defeated_bandit_leader', set: true },
        ],
      },
    });

    useGameStore.getState().endCombat(true);

    const { screen, combat, state } = useGameStore.getState();
    expect(screen).toBe('game');
    expect(combat).toBeNull();
    expect(state.flags.has('defeated_bandit_leader')).toBe(true);
  });

  it('endCombat(false) 返回 GameScreen 但无奖励', () => {
    useGameStore.getState().startGame();
    useGameStore.getState().startCombat(testEnemies);

    useGameStore.setState({
      combat: {
        ...useGameStore.getState().combat!,
        isFinished: true,
        victory: false,
      },
    });

    useGameStore.getState().endCombat(false);
    expect(useGameStore.getState().screen).toBe('game');
    expect(useGameStore.getState().combat).toBeNull();
  });

  it('Boss 战: 厉无双高属性敌人', () => {
    useGameStore.getState().startGame();
    useGameStore.getState().startCombat(testBossEnemy);

    const { combat } = useGameStore.getState();
    expect(combat!.enemies[0].health).toBe(300);
    expect(combat!.enemies[0].attack).toBe(45);

    // 连续攻击多次
    for (let i = 0; i < 5; i++) {
      const { combat: current } = useGameStore.getState();
      if (current!.isFinished) break;
      useGameStore.getState().executeCombatAction({
        type: 'skill',
        skillId: 'taixu_13_swords',
      });
    }

    const finalCombat = useGameStore.getState().combat;
    // Boss 不太可能 5 回合内被击杀，验证伤害累计
    const totalDamage = 300 - finalCombat!.enemies[0].health;
    expect(totalDamage).toBeGreaterThan(0);
  });

  it('逃跑操作', () => {
    useGameStore.getState().startGame();
    useGameStore.getState().startCombat(testEnemies);

    useGameStore.getState().executeCombatAction({ type: 'flee' });

    const { combat } = useGameStore.getState();
    // 逃跑可能导致战斗结束
    if (combat!.isFinished) {
      expect(combat!.victory).toBe(false);
    }
  });
});
```

### 41.3 运行命令与预期输出

```bash
npx vitest run src/__tests__/combat-flow.test.ts
```

预期输出:

```
 ✓ src/__tests__/combat-flow.test.ts (7 tests) 12ms

Test Files  1 passed (1)
     Tests  7 passed (7)
```

### 41.4 验收标准

- [ ] 战斗正确进入 CombatScreen
- [ ] 攻击扣除敌人血量，日志正确记录
- [ ] 防御操作正确执行
- [ ] 胜利返回 GameScreen 并应用奖励
- [ ] 失败返回 GameScreen 但不应用奖励
- [ ] Boss 战高属性敌人血量/攻击力正确
- [ ] 逃跑操作可执行

---

## Task 42: 关系图打通

**目的**: RelationGraph 读取真实好感度数据，正确渲染 12 NPC 节点。

### 42.1 关系图数据工具函数

文件: `src/ui/components/RelationGraphData.ts`

```typescript
import type { GameState, NPC_ID, Faction } from '../../engine/types';

export interface GraphNode {
  id: string;
  label: string;
  faction: Faction | 'independent';
  totalFavor: number;
  discovered: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  type: 'positive' | 'negative' | 'neutral';
  strength: number;
}

const NPC_META: Record<NPC_ID, { name: string; faction: Faction | 'independent' }> = {
  suqingheng:     { name: '苏青衡',   faction: 'taixu' },
  qingxuzhenren:  { name: '清虚真人', faction: 'taixu' },
  shentinyu:      { name: '沈听雨',   faction: 'tingyu' },
  luxiaoman:      { name: '陆小满',   faction: 'tingyu' },
  xiaopodi:       { name: '萧破敌',   faction: 'tieqi' },
  ayiguli:        { name: '阿依古丽', faction: 'tieqi' },
  baixiaolian:    { name: '白药仙',   faction: 'yaowang' },
  liusuifeng:     { name: '柳随风',   faction: 'yaowang' },
  liwushuang:     { name: '厉无双',   faction: 'fentian' },
  huochangqing:   { name: '霍长青',   faction: 'fentian' },
  chubaiyi:       { name: '楚白衣',   faction: 'independent' },
  laowei:         { name: '老魏',     faction: 'independent' },
};

const NPC_RELATIONS: { source: NPC_ID; target: NPC_ID; label: string; type: 'positive' | 'negative' | 'neutral'; strength: number }[] = [
  { source: 'suqingheng', target: 'shentinyu', label: '旧情缘', type: 'neutral', strength: 3 },
  { source: 'suqingheng', target: 'qingxuzhenren', label: '师徒', type: 'positive', strength: 4 },
  { source: 'baixiaolian', target: 'shentinyu', label: '闺蜜', type: 'positive', strength: 3 },
  { source: 'baixiaolian', target: 'liusuifeng', label: '师徒', type: 'positive', strength: 4 },
  { source: 'liusuifeng', target: 'luxiaoman', label: '旧识', type: 'neutral', strength: 2 },
  { source: 'luxiaoman', target: 'shentinyu', label: '养母女', type: 'positive', strength: 4 },
  { source: 'xiaopodi', target: 'liwushuang', label: '旧友', type: 'positive', strength: 3 },
  { source: 'xiaopodi', target: 'qingxuzhenren', label: '对立', type: 'negative', strength: 2 },
  { source: 'chubaiyi', target: 'huochangqing', label: '暗中联络', type: 'neutral', strength: 2 },
];

export function buildGraphNodes(state: GameState): GraphNode[] {
  const nodes: GraphNode[] = [];

  // player node
  nodes.push({
    id: 'player',
    label: '你',
    faction: 'independent',
    totalFavor: 0,
    discovered: true,
  });

  for (const [id, meta] of Object.entries(NPC_META)) {
    const npcId = id as NPC_ID;
    const favors = state.npcFavors[npcId];
    const totalFavor = favors.trust + favors.intimacy + favors.awe + favors.fear;
    const discovered = state.discoveredNpcs.includes(npcId) || totalFavor > 0;

    nodes.push({
      id: npcId,
      label: discovered ? meta.name : '???',
      faction: meta.faction,
      totalFavor,
      discovered,
    });
  }

  return nodes;
}

export function buildGraphEdges(state: GameState): GraphEdge[] {
  const edges: GraphEdge[] = [];

  for (const rel of NPC_RELATIONS) {
    const sourceFavors = state.npcFavors[rel.source];
    const targetFavors = state.npcFavors[rel.target];
    const sourceDiscovered = state.discoveredNpcs.includes(rel.source) || (sourceFavors.trust + sourceFavors.intimacy > 0);
    const targetDiscovered = state.discoveredNpcs.includes(rel.target) || (targetFavors.trust + targetFavors.intimacy > 0);

    if (sourceDiscovered || targetDiscovered) {
      edges.push({
        source: rel.source,
        target: rel.target,
        label: rel.label,
        type: rel.type,
        strength: rel.strength,
      });
    }
  }

  return edges;
}

export function getNodeColor(faction: Faction | 'independent'): string {
  const colors: Record<string, string> = {
    taixu: '#5B8C8C',
    tingyu: '#7B68AE',
    tieqi: '#8B6914',
    yaowang: '#6B8E23',
    fentian: '#C23B22',
    independent: '#6B6B80',
    court: '#4A708B',
  };
  return colors[faction] ?? '#6B6B80';
}

export function getEdgeColor(type: 'positive' | 'negative' | 'neutral'): string {
  switch (type) {
    case 'positive': return '#C5A55A';
    case 'negative': return '#8B1A1A';
    case 'neutral':  return '#6B6B80';
  }
}
```

### 42.2 关系图数据测试

文件: `src/__tests__/relation-graph.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { buildGraphNodes, buildGraphEdges, getNodeColor, getEdgeColor } from '../ui/components/RelationGraphData';
import type { GameState, NPC_ID } from '../engine/types';

function createTestState(): GameState {
  const npcFavors: GameState['npcFavors'] = {
    suqingheng:    { trust: 50, intimacy: 30, awe: 20, fear: 5 },
    qingxuzhenren: { trust: 40, intimacy: 10, awe: 50, fear: 15 },
    shentinyu:     { trust: 20, intimacy: 10, awe: 45, fear: 40 },
    luxiaoman:     { trust: 55, intimacy: 60, awe: 5, fear: 0 },
    xiaopodi:      { trust: 35, intimacy: 20, awe: 30, fear: 10 },
    ayiguli:       { trust: 45, intimacy: 40, awe: 10, fear: 5 },
    baixiaolian:   { trust: 25, intimacy: 15, awe: 40, fear: 30 },
    liusuifeng:    { trust: 60, intimacy: 45, awe: 10, fear: 0 },
    liwushuang:    { trust: 10, intimacy: 5, awe: 60, fear: 50 },
    huochangqing:  { trust: 5, intimacy: 5, awe: 35, fear: 55 },
    chubaiyi:      { trust: 50, intimacy: 35, awe: 25, fear: 10 },
    laowei:        { trust: 30, intimacy: 20, awe: 15, fear: 20 },
  };
  return {
    currentDay: 5,
    currentTimeslot: 'dawn',
    location: 'zhongyuan',
    npcFavors,
    factionReputation: { taixu: 40, tingyu: 20, tieqi: 15, yaowang: 10, fentian: 5, court: 0, independent: 0 },
    learnedMartialArts: [],
    equippedSkills: [],
    health: 100,
    qi: 100,
    maxQi: 100,
    flags: new Set(),
    endingsUnlocked: [],
    discoveredNpcs: ['suqingheng', 'shentinyu', 'laowei'],
    isSecondPlaythrough: false,
    combatPending: null,
  };
}

describe('RelationGraph 数据', () => {
  it('生成 13 个节点（1 player + 12 NPC）', () => {
    const state = createTestState();
    const nodes = buildGraphNodes(state);
    expect(nodes.length).toBe(13);
  });

  it('玩家节点始终发现', () => {
    const state = createTestState();
    const nodes = buildGraphNodes(state);
    const player = nodes.find(n => n.id === 'player');
    expect(player).toBeDefined();
    expect(player!.discovered).toBe(true);
  });

  it('已好感度 > 0 的 NPC 自动发现', () => {
    const state = createTestState();
    const nodes = buildGraphNodes(state);
    const suqingheng = nodes.find(n => n.id === 'suqingheng');
    expect(suqingheng!.discovered).toBe(true);
    expect(suqingheng!.label).toBe('苏青衡');
  });

  it('无好感度且未显式发现的 NPC 显示 ???', () => {
    const state = createTestState();
    state.npcFavors.huochangqing = { trust: 0, intimacy: 0, awe: 0, fear: 0 };
    state.discoveredNpcs = ['suqingheng', 'shentinyu', 'laowei'];

    const nodes = buildGraphNodes(state);
    const huochangqing = nodes.find(n => n.id === 'huochangqing');
    expect(huochangqing!.discovered).toBe(false);
    expect(huochangqing!.label).toBe('???');
  });

  it('苏青衡的好感度总和正确', () => {
    const state = createTestState();
    const nodes = buildGraphNodes(state);
    const su = nodes.find(n => n.id === 'suqingheng');
    expect(su!.totalFavor).toBe(105); // 50+30+20+5
  });

  it('生成正向关系边', () => {
    const state = createTestState();
    const edges = buildGraphEdges(state);
    const suTeacher = edges.find(e =>
      e.source === 'suqingheng' && e.target === 'qingxuzhenren'
    );
    expect(suTeacher).toBeDefined();
    expect(suTeacher!.type).toBe('positive');
    expect(suTeacher!.label).toBe('师徒');
  });

  it('生成负向关系边', () => {
    const state = createTestState();
    const edges = buildGraphEdges(state);
    const rivalry = edges.find(e =>
      e.source === 'xiaopodi' && e.target === 'qingxuzhenren'
    );
    expect(rivalry).toBeDefined();
    expect(rivalry!.type).toBe('negative');
  });

  it('门派颜色正确', () => {
    expect(getNodeColor('taixu')).toBe('#5B8C8C');
    expect(getNodeColor('tingyu')).toBe('#7B68AE');
    expect(getNodeColor('fentian')).toBe('#C23B22');
    expect(getNodeColor('independent')).toBe('#6B6B80');
  });

  it('边颜色正确', () => {
    expect(getEdgeColor('positive')).toBe('#C5A55A');
    expect(getEdgeColor('negative')).toBe('#8B1A1A');
    expect(getEdgeColor('neutral')).toBe('#6B6B80');
  });
});
```

### 42.3 运行命令与预期输出

```bash
npx vitest run src/__tests__/relation-graph.test.ts
```
:

```
 ✓ src/__tests__/relation-graph.test.ts (9 tests) 8ms

Test Files  1 passed (1)
     Tests  9 passed (9)
```

### 42.4 验收标准

- [ ] 节点数为 13（1 玩家 + 12 NPC）
- [ ] 已发现 NPC 显示中文名，未发现显示 ???
- [ ] 好感度总和计算正确
- [ ] NPC 关系边根据 discoveredNpcs 和 npcFavors 过滤
- [ ] 门派颜色与 04-art-style.md 定义一致

---

## Task 43: 二周目功能

**目的**: 实现 endingsUnlocked 持久化和天眼模式标记，二周目解锁特殊能力。

### 43.1 二周目管理器

文件: `src/engine/SecondPlaythrough.ts`

```typescript
import type { GameState, EndingId } from './types';

const SAVE_KEY = 'yinian-jianghu-endings';

export interface EndingRecord {
  id: EndingId;
  timestamp: number;
  day: number;
}

export function loadUnlockedEndings(): EndingRecord[] {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EndingRecord[];
  } catch {
    return [];
  }
}

export function saveEndingRecord(endingId: EndingId, day: number): void {
  const existing = loadUnlockedEndings();
  const already = existing.some(e => e.id === endingId);
  if (already) return;

  existing.push({
    id: endingId,
    timestamp: Date.now(),
    day,
  });
  localStorage.setItem(SAVE_KEY, JSON.stringify(existing));
}

export function hasCompletedAtLeastOneGame(): boolean {
  return loadUnlockedEndings().length >= 1;
}

export function isSecondPlaythrough(): boolean {
  return loadUnlockedEndings().length >= 1;
}

export function getUnlockedEndingIds(): EndingId[] {
  return loadUnlockedEndings().map(e => e.id);
}

export function clearAllEndings(): void {
  localStorage.removeItem(SAVE_KEY);
}

/**
 * 天眼模式下，某个 choice 对结局的影响分析
 * 返回该 choice 可能解锁或排除的结局 ID 列表
 */
export function analyzeChoiceImpact(
  choiceEffects: Array<{ type: string; [k: string]: unknown }>,
  allEndingIds: EndingId[]
): { unlocks: EndingId[]; blocks: EndingId[] } {
  const unlocks: EndingId[] = [];
  const blocks: EndingId[] = [];

  for (const effect of choiceEffects) {
    if (effect.type === 'endingFlag') {
      // 该选择直接关联某个结局
      const key = effect.key as string;
      for (const endingId of allEndingIds) {
        if (key.includes(endingId)) {
          unlocks.push(endingId);
        }
      }
    }
    if (effect.type === 'flag') {
      const key = effect.key as string;
      if (key.includes('used_forbidden')) {
        // 使用禁术，会阻止一念成佛
        if (allEndingIds.includes('ending_eden')) {
          blocks.push('ending_eden');
        }
      }
    }
  }

  return {
    unlocks: [...new Set(unlocks)],
    blocks: [...new Set(blocks)],
  };
}
```

### 43.2 二周目管理器测试

文件: `src/__tests__/second-playthrough.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadUnlockedEndings,
  saveEndingRecord,
  hasCompletedAtLeastOneGame,
  isSecondPlaythrough,
  getUnlockedEndingIds,
  clearAllEndings,
  analyzeChoiceImpact,
} from '../engine/SecondPlaythrough';

describe('二周目功能', () => {
  beforeEach(() => {
    clearAllEndings();
  });

  afterEach(() => {
    clearAllEndings();
  });

  it('初始状态无已解锁结局', () => {
    expect(loadUnlockedEndings()).toEqual([]);
    expect(hasCompletedAtLeastOneGame()).toBe(false);
    expect(isSecondPlaythrough()).toBe(false);
    expect(getUnlockedEndingIds()).toEqual([]);
  });

  it('saveEndingRecord 记录结局', () => {
    saveEndingRecord('ending_retire', 30);
    const records = loadUnlockedEndings();
    expect(records.length).toBe(1);
    expect(records[0].id).toBe('ending_retire');
    expect(records[0].day).toBe(30);
    expect(records[0].timestamp).toBeGreaterThan(0);
  });

  it('重复记录同一结局不会新增', () => {
    saveEndingRecord('ending_retire', 30);
    saveEndingRecord('ending_retire', 30);
    expect(loadUnlockedEndings().length).toBe(1);
  });

  it('记录多个不同结局', () => {
    saveEndingRecord('ending_retire', 30);
    saveEndingRecord('ending_hero', 30);
    expect(loadUnlockedEndings().length).toBe(2);
    expect(getUnlockedEndingIds()).toContain('ending_retire');
    expect(getUnlockedEndingIds()).toContain('ending_hero');
  });

  it('记录结局后判定为二周目', () => {
    saveEndingRecord('ending_retire', 30);
    expect(hasCompletedAtLeastOneGame()).toBe(true);
    expect(isSecondPlaythrough()).toBe(true);
  });

  it('clearAllEndings 清除所有记录', () => {
    saveEndingRecord('ending_retire', 30);
    saveEndingRecord('ending_hero', 30);
    clearAllEndings();
    expect(loadUnlockedEndings().length).toBe(0);
    expect(hasCompletedAtLeastOneGame()).toBe(false);
  });

  it('analyzeChoiceImpact: 使用禁术阻止一念成佛', () => {
    const effects = [
      { type: 'flag', key: 'used_forbidden_art', set: true },
    ];
    const result = analyzeChoiceImpact(effects, [
      'ending_retire', 'ending_hero', 'ending_eden',
    ]);
    expect(result.blocks).toContain('ending_eden');
    expect(result.unlocks.length).toBe(0);
  });

  it('analyzeChoiceImpact: endingFlag 效果解锁结局', () => {
    const effects = [
      { type: 'endingFlag', key: 'ending_hero' },
    ];
    const result = analyzeChoiceImpact(effects, [
      'ending_retire', 'ending_hero', 'ending_eden',
    ]);
    expect(result.unlocks).toContain('ending_hero');
    expect(result.blocks.length).toBe(0);
  });

  it('analyzeChoiceImpact: 无相关效果返回空', () => {
    const effects = [
      { type: 'favor', npc: 'suqingheng', trust: 10 },
    ];
    const result = analyzeChoiceImpact(effects, [
      'ending_retire', 'ending_hero',
    ]);
    expect(result.unlocks.length).toBe(0);
    expect(result.blocks.length).toBe(0);
  });
});
```

### 43.3 运行命令与预期输出

```bash
npx vitest run src/__tests__/second-playthrough.test.ts
```

预期输出:

```
 ✓ src/__tests__/second-playthrough.test.ts (9 tests) 6ms

Test Files  1 passed (1)
     Tests  9 passed (9)
```

### 43.4 验收标准

- [ ] localStorage 持久化结局记录，页面刷新后仍在
- [ ] 重复记录同一结局不重复
- [ ] 至少 1 个结局后 `isSecondPlaythrough()` 返回 true
- [ ] 天眼模式 analyzeChoiceImpact 正确标记解锁/阻止的结局
- [ ] clearAllEndings 正确清除

---

## Task 44: 存档功能

**目的**: localStorage 持久化 + JSON 导出/导入。

### 44.1 存档管理器

文件: `src/engine/SaveManager.ts`

```typescript
import type { GameState, SaveData } from './types';

const SAVE_KEY = 'yinian-jianghu-save';

/**
 * 序列化 GameState 为可存储格式（Set -> Array）
 */
export function serializeGameState(state: GameState): Record<string, unknown> {
  return {
    ...state,
    flags: Array.from(state.flags),
  };
}

/**
 * 反序列化为 GameState（Array -> Set）
 */
export function deserializeGameState(data: Record<string, unknown>): GameState {
  return {
    ...(data as unknown as GameState),
    flags: new Set(data.flags as string[]),
  };
}

/**
 * 导出存档为 JSON 字符串
 */
export function exportSave(state: GameState): string {
  const saveData: SaveData = {
    version: 1,
    timestamp: Date.now(),
    state: serializeGameState(state) as SaveData['state'],
  };
  return JSON.stringify(saveData, null, 2);
}

/**
 * 导入 JSON 字符串为 SaveData，校验格式
 */
export function importSave(jsonString: string): SaveData | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== 'object' || parsed === null) return null;
    if (parsed.version !== 1) return null;
    if (typeof parsed.timestamp !== 'number') return null;
    if (!parsed.state || typeof parsed.state !== 'object') return null;

    return {
      version: parsed.version,
      timestamp: parsed.timestamp,
      state: parsed.state,
    };
  } catch {
    return null;
  }
}

/**
 * 本地持久化存档
 */
export function saveToLocal(state: GameState): void {
  const serialized = serializeGameState(state);
  localStorage.setItem(SAVE_KEY, JSON.stringify(serialized));
}

/**
 * 从本地加载存档
 */
export function loadFromLocal(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return deserializeGameState(data);
  } catch {
    return null;
  }
}

/**
 * 清除本地存档
 */
export function clearLocalSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

/**
 * 下载存档文件
 */
export function downloadSave(state: GameState): void {
  const json = exportSave(state);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `yinian-jianghu-save-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### 44.2 存档测试

文件: `src/__tests__/save-manager.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  serializeGameState,
  deserializeGameState,
  exportSave,
  importSave,
  saveToLocal,
  loadFromLocal,
  clearLocalSave,
} from '../engine/SaveManager';
import type { GameState, NPC_ID } from '../engine/types';

function createTestState(): GameState {
  const npcFavors: GameState['npcFavors'] = {
    suqingheng:    { trust: 50, intimacy: 30, awe: 20, fear: 5 },
    qingxuzhenren: { trust: 0, intimacy: 0, awe: 0, fear: 0 },
    shentinyu:     { trust: 0, intimacy: 0, awe: 0, fear: 0 },
    luxiaoman:     { trust: 0, intimacy: 0, awe: 0, fear: 0 },
    xiaopodi:      { trust: 0, intimacy: 0, awe: 0, fear: 0 },
    ayiguli:       { trust: 0, intimacy: 0, awe: 0, fear: 0 },
    baixiaolian:   { trust: 0, intimacy: 0, awe: 0, fear: 0 },
    liusuifeng:    { trust: 0, intimacy: 0, awe: 0, fear: 0 },
    li    { trust: 0, intimacy: 0, awe: 0, fear: 0 },
    huochangqing:  { trust: 0, intimacy: 0, awe: 0, fear: 0 },
    chubaiyi:      { trust: 0, intimacy: 0, awe: 0, fear: 0 },
    laowei:        { trust: 30, intimacy: 20, awe: 15, fear: 20 },
  };
  return {
    currentDay: 15,
    currentTimeslot: 'noon',
    location: 'jiangnan',
    npcFavors,
    factionReputation: { taixu: 30, tingyu: 45, tieqi: 10, yaowang: 20, fentian: 5, court: 0, independent: 0 },
    learnedMartialArts: ['taixu_13_swords', 'tingyu_18_pai'],
    equippedSkills: ['taixu_13_swords', 'tingyu_18_pai'],
    health: 85,
    qi: 60,
    maxQi: 100,
    flags: new Set(['accepted_laowei_guidance', 'day2_duel_accepted', 'found_letter']),
    endingsUnlocked: ['ending_retire'],
    discoveredNpcs: ['suqingheng', 'shentinyu', 'laowei'],
    isSecondPlaythrough: false,
    combatPending: null,
  };
}

describe('存档功能', () => {
  beforeEach(() => {
    clearLocalSave();
  });

  afterEach(() => {
    clearLocalSave();
  });

  it('serializeGameState 将 Set 转为 Array', () => {
    const state = createTestState();
    const serialized = serializeGameState(state);
    expect(Array.isArray(serialized.flags)).toBe(true);
    expect(serialized.flags).toContain('accepted_laowei_guidance');
    expect(serialized.flags).toContain('day2_duel_accepted');
  });

  it('deserializeGameState 将 Array 还原为 Set', () => {
    const state = createTestState();
    const serialized = serializeGameState(state);
    const restored = deserializeGameState(serialized);
    expect(restored.flags instanceof Set).toBe(true);
    expect(restored.flags.has('accepted_laowei_guidance')).toBe(true);
    expect(restored.flags.has('day2_duel_accepted')).toBe(true);
    expect(restored.currentDay).toBe(15);
    expect(restored.currentTimeslot).toBe('noon');
  });

  it('exportSave 生成合法 JSON', () => {
    const state = createTestState();
    const json = exportSave(state);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(1);
    expect(parsed.timestamp).toBeGreaterThan(0);
    expect(parsed.state.currentDay).toBe(15);
  });

  it('importSave 解析合法 JSON', () => {
    const state = createTestState();
    const json = exportSave(state);
    const imported = importSave(json);
    expect(imported).not.toBeNull();
    expect(imported!.version).toBe(1);
    expect(imported!.state.currentDay).toBe(15);
  });

  it('importSave 拒绝非法 JSON', () => {
    expect(importSave('not json')).toBeNull();
    expect(importSave('{"version": 2}')).toBeNull();
    expect(importSave('{"version": 1, "timestamp": 123}')).toBeNull();
  });

  it('saveToLocal 和 loadFromLocal 往返一致', () => {
    const state = createTestState();
    saveToLocal(state);
    const loaded = loadFromLocal();
    expect(loaded).not.toBeNull();
    expect(loaded!.currentDay).toBe(15);
    expect(loaded!.flags.has('found_letter')).toBe(true);
    expect(loaded!.npcFavors.suqingheng.trust).toBe(50);
  });

  it('loadFromLocal 无存档返回 null', () => {
    expect(loadFromLocal()).toBeNull();
  });

  it('clearLocalSave 清除存档', () => {
    const state = createTestState();
    saveToLocal(state);
    expect(loadFromLocal()).not.toBeNull();
    clearLocalSave();
    expect(loadFromLocal()).toBeNull();
  });

  it('存档保留 endingsUnlocked', () => {
    const state = createTestState();
    state.endingsUnlocked = ['ending_retire', 'ending_hero'];
    saveToLocal(state);
    const loaded = loadFromLocal();
    expect(loaded!.endingsUnlocked).toContain('ending_retire');
    expect(loaded!.endingsUnlocked).toContain('ending_hero');
  });
});
```

### 44.3 运行命令与预期输出

```bash
npx vitest run src/__tests__/save-manager.test.ts
```

预期输出:

```
 ✓ src/__tests__/save-manager.test.ts (9 tests) 5ms

Test Files  1 passed (1)
     Tests  9 passed (9)
```

### 44.4 验收标准

- [ ] Set <-> Array 序列化往返一致
- [ ] exportSave 生成 version:1 JSON，可被 importSave 解析
- [ ] importSave 拒绝非法格式（version 错误、缺少字段）
- [ ] saveToLocal / loadFromLocal 通过 localStorage 往返正确
- [ ] clearLocalSave 清除后 loadFromLocal 返回 null
- [ ] endingsUnlocked 在存档中持久化

---

## Task 45: 手动验收测试

**目的**: 编写完整游戏流程走查表，确保每个核心路径可被人工验证。

### 45.1 走查表定义

文件: `src/__tests__/smoke-test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../ui/store/gameStore';
import { loadUnlockedEndings, saveEndingRecord, clearAllEndings } from '../engine/SecondPlaythrough';

/**
 * 手动验收测试：每个 test case 代表一个必须可手动走通的流程
 * 运行: npx vitest run src/__tests__/smoke-test.ts --reporter=list
 */
describe('手动验收测试 - 完整游戏流程走查', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    clearAllEndings();
  });

  it('走查表 1: 标题屏幕显示', () => {
    const { screen } = useGameStore.getState();
    expect(screen).toBe('title');
    // 手动验证: 页面应显示「一念江湖」标题和「开始游戏」按钮
  });

  it('走查表 2: 开始游戏进入 GameScreen', () => {
    useGameStore.getState().startGame();
    expect(useGameStore.getState().screen).toBe('game');
    expect(useGameStore.getState().state.currentDay).toBe(1);
    expect(useGameStore.getState().state.currentTimeslot).toBe('dawn');
    // 手动验证: GameScreen 显示左侧事件区域和右侧属性面板
  });

  it('走查表 3: 时间推进 4 个时辰后进入下一天', () => {
    useGameStore.getState().startGame();
    useGameStore.getState().advanceTimeslot(); // noon
    useGameStore.getState().advanceTimeslot(); // dusk
    useGameStore.getState().advanceTimeslot(); // night
    useGameStore.getState().advanceTimeslot(); // day2 dawn

    const s = useGameStore.getState().state;
    expect(s.currentDay).toBe(2);
    expect(s.currentTimeslot).toBe('dawn');
    // 手动验证: TimelineBar 显示「第 2 天」
  });

  it('走查表 4: 休息恢复气力和生命', () => {
    useGameStore.getState().startGame();
    useGameStore.setState({
      state: { ...useGameStore.getState().state, qi: 40, health: 70 },
    });

    useGameStore.getState().rest();

    const s = useGameStore.getState().state;
    expect(s.qi).toBe(70);   // 40 + 30
    expect(s.health).toBe(90); // 70 + 20
    // 手动验证: CharSheet 中生命和气力条增加
  });

  it('走查表 5: 选择行动改变好感度', () => {
    useGameStore.getState().startGame();
    const testEvent = {
      day: 1,
      events: [{
        id: 'test',
        type: 'story' as const,
        priority: 100,
        trigger: { timeslot: 'dawn' as const, location: 'zhongyuan' as const, conditions: [] },
        scene: { background: 'zhongyuan_mountain' as const, description: 'test' },
        dialogues: [{ speaker: 'narrator' as const, text: 'test', emotion: 'neutral' as const }],
        choices: [{
          id: 'help',
          text: '「帮忙」',
          conditions: [],
          effects: [
            { type: 'favor' as const, npc: 'suqingheng' as const, trust: 10, intimacy: 5, ripple: { dim: 'awe' as const, delta: -3 } },
            { type: 'flag' as const, key: 'helped_suqingheng', set: true },
          ],
          nextEvent: null,
        }],
        nextEvent: null,
      }],
    };

    useGameStore.getState().loadAvailableEvents(testEvent);
    useGameStore.getState().selectEvent('test');
    useGameStore.getState().advanceDialogue();
    useGameStore.getState().chooseAction('help');

    const s = useGameStore.getState().state;
    expect(s.npcFavors.suqingheng.trust).toBe(10);
    expect(s.npcFavors.suqingheng.intimacy).toBe(5);
    expect(s.npcFavors.suqingheng.awe).toBe(0); // -3 clamp
    expect(s.flags.has('helped_suqingheng')).toBe(true);
    // 手动验证: FavorDisplay 中苏青衡信任条增长
  });

  it('走查表 6: 战斗进入 CombatScreen', () => {
    useGameStore.getState().startGame();
    useGameStore.getState().startCombat([
      { id: 'test_enemy', name: '测试敌人', health: 30, maxHealth: 30, qi: 20, attack: 8, defense: 3, speed: 5, moves: ['斩击'], buffs: [], debuffs: [] },
    ]);

    expect(useGameStore.getState().screen).toBe('combat');
    expect(useGameStore.getState().combat).not.toBeNull();
    // 手动验证: CombatScreen 显示敌人血条和行动按钮
  });

  it('走查表 7: 战斗胜利返回 GameScreen', () => {
    useGameStore.getState().startGame();
    useGameStore.getState().startCombat([
      { id: 'test_enemy', name: '测试敌人', health: 1, maxHealth: 1, qi: 0, attack: 2, defense: 0, speed: 1, moves: ['弱击'], buffs: [], debuffs: [] },
    ]);

    useGameStore.getState().executeCombatAction({ type: 'skill', skillId: 'taixu_13_swords' });
    const { combat } = useGameStore.getState();
    expect(combat!.isFinished).toBe(true);
    expect(combat!.victory).toBe(true);

    useGameStore.getState().endCombat(true);
    expect(useGameStore.getState().screen).toBe('game');
    expect(useGameStore.getState().combat).toBeNull();
    // 手动验证: 返回 GameScreen，战斗奖励已应用
  });

  it('走查表 8: 导航到关系图', () => {
    useGameStore.getState().startGame();
    useGameStore.getState().navigate('graph');
    expect(useGameStore.getState().screen).toBe('graph');

    useGameStore.getState().navigate('game');
    expect(useGameStore.getState().screen).toBe('game');
    // 手动验证: RelationGraph 显示节点和连线
  });

  it('走查表 9: 档包含完整状态', () => {
    useGameStore.getState().startGame();
    useGameStore.setState({
      state: {
        ...useGameStore.getState().state,
        currentDay: 10,
        npcFavors: {
          ...useGameStore.getState().state.npcFavors,
          suqingheng: { trust: 60, intimacy: 40, awe: 25, fear: 8 },
        },
      },
    });

    const save = useGameStore.getState().exportSave();
    expect(save.version).toBe(1);
    expect(save.state.currentDay).toBe(10);
  });

  it('走查表 10: 导入存档恢复状态', () => {
    useGameStore.getState().startGame();
    useGameStore.setState({
      state: { ...useGameStore.getState().state, currentDay: 20, currentTimeslot: 'dusk' },
    });
    const save = useGameStore.getState().exportSave();

    useGameStore.getState().reset();
    expect(useGameStore.getState().state.currentDay).toBe(1);

    useGameStore.getState().importSave(save);
    expect(useGameStore.getState().state.currentDay).toBe(20);
    expect(useGameStore.getState().state.currentTimeslot).toBe('dusk');
    expect(useGameStore.getState().screen).toBe('game');
    // 手动验证: TimelineBar 显示第 20 天酉时
  });

  it('走查表 11: 二周目标记', () => {
    saveEndingRecord('ending_retire', 30);
    useGameStore.getState().startGame();
    expect(useGameStore.getState().state.isSecondPlaythrough).toBe(true);
    // 手动验证: TitleScreen 显示「结局回顾」按钮
  });

  it('走查表 12: 重新开始清空状态', () => {
    useGameStore.getState().startGame();
    useGameStore.setState({
      state: { ...useGameStore.getState().state, currentDay: 15, qi: 20, health: 30 },
    });

    useGameStore.getState().reset();
    const { state, screen } = useGameStore.getState();
    expect(screen).toBe('title');
    expect(state.currentDay).toBe(1);
    expect(state.qi).toBe(100);
    expect(state.health).toBe(100);
    // 手动验证: 返回标题画面，一切归零
  });
});
```

### 45.2 运行命令与预期输出

```bash
npx vitest run src/__tests__/smoke-test.ts --reporter=list
```

预期输出:

```
 ✓ 走查表 1: 标题屏幕显示
 ✓ 走查表 2: 开始游戏进入 GameScreen
 ✓ 走查表 3: 时间推进 4 个时辰后进入下一天
 ✓ 走查表 4: 休息恢复气力和生命
 ✓ 走查表 5: 选择行动改变好感度
 ✓ 走查表 6: 战斗进入 CombatScreen
 ✓ 走查表 7: 战斗胜利返回 GameScreen
 ✓ 走查表 8: 导航到关系图
 ✓ 走查表 9: 导出存档包含完整状态
 ✓ 走查表 10: 导入存档恢复状态
 ✓ 走查表 11: 二周目标记
 ✓ 走查表 12: 重新开始清空状态

Test Files  1 passed (1)
     Tests  12 passed (12)
```

### 45.3 手动走查清单

以下为开发者的浏览器手动验证清单，每个 check 对应一个 test case：

| # | 检查项 | 浏览器操作 | 预期结果 |
|---|--------|-----------|----------|
| 1 | 标题屏幕 | 打开 `localhost:5173` | 显示「一念江湖」标题、「开始游戏」按钮 |
| 2 | 进入游戏 | 点击「开始游戏」 | 进入 GameScreen，显示双栏布局 |
| 3 | 时间推进 | 点击 4 次「推进时辰」 | TimelineBar 从「第 1 天 卯」到「第 2 天 卯」 |
| 4 | 休息恢复 | 先消耗属性，再点击「休息」 | CharSheet 生命/气力条增长 |
| 5 | 好感度变化 | 选择一个行动选项 | FavorDisplay 中对应 NPC 好感度变化 |
| 6 | 进入战斗 | 触发战斗事件 | 切换到 CombatScreen，显示敌人信息 |
| 7 | 战斗胜利 | 使用武学攻击击败敌人 | 返回 GameScreen，战斗奖励已应用 |
| 8 | 关系图 | 点击「关系图」链接 | 显示力导向图，点击节点弹出详情 |
| 9 | 导出存档 | 点击「导出存档」按钮 | 浏览器下载 .json 文件 |
| 10 | 导入存档 | 点击「导入存档」按钮，选择文件 | 恢复到导出时的游戏状态 |
| 11 | 二周目标记 | 通关一次后重新开始 | TitleScreen 显示「结局回顾」按钮 |
| 12 | 重新开始 | 点击「重新开始」 | 返回标题画面，所有状态清零 |

### 45.4 验收标准

- [ ] 12 个自动化测试全部通过
- [ ] 12 项手动走查全部在浏览器中验证通过
- [ ] 每个核心路径（开始→行动→好感→战斗→结局→存档）均可走通
- [ ] 无 console error
