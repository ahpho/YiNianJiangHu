import { describe, it, expect } from 'vitest';
import { EventEngine } from '../EventEngine';
import type { GameState, NPC_ID } from '../types';
import type { Condition } from '../../utils/condition-parser';

interface TestEvent {
  id: string;
  type: string;
  priority: number;
  trigger: { conditions: Condition[] };
}

const ALL_NPCS: NPC_ID[] = [
  'suqingheng', 'qingxuzhenren', 'shentingyu', 'luxiaoman',
  'xiaopodi', 'ayiguli', 'baiyaoxian', 'liusuifeng',
  'liwushuang', 'huochangqing', 'chubaiyi', 'laowei',
];

const makeGameState = (overrides: Partial<GameState> = {}): GameState => {
  const favors = {} as Record<NPC_ID, { trust: number; intimacy: number; awe: number; fear: number }>;
  for (const npc of ALL_NPCS) {
    favors[npc] = { trust: 50, intimacy: 30, awe: 20, fear: 5 };
  }
  return {
    currentDay: 10,
    currentTimeslot: 'noon',
    currentLocation: 'zhongyuan',
    playerStats: { health: 100, maxHealth: 100, qi: 80, maxQi: 100, attack: 15, defense: 12, speed: 10, level: 2 },
    npcFavors: favors,
    factionReputation: { taixu: 50, tingyu: 30, tieqi: 40, yaowang: 20, fentian: 10 },
    learnedMartialArts: ['taixu_13_swords'],
    equippedSkills: ['taixu_13_swords'],
    flags: new Set(['found_letter']),
    endingsUnlocked: [],
    unlockedArcs: new Set(),
    ...overrides,
  };
};

describe('EventEngine', () => {
  describe('filterByConditions', () => {
    it('返回满足所有条件的事件', () => {
      const state = makeGameState();
      const events: TestEvent[] = [
        { id: 'a', type: 'story', priority: 10, trigger: { conditions: [{ type: 'flag', key: 'found_letter' }] } },
        { id: 'b', type: 'story', priority: 5, trigger: { conditions: [{ type: 'flag', key: 'nonexistent' }] } },
      ];
      const result = EventEngine.filterByConditions(state, events);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('a');
    });

    it('空条件列表时所有事件都通过', () => {
      const state = makeGameState();
      const events: TestEvent[] = [
        { id: 'a', type: 'story', priority: 10, trigger: { conditions: [] } },
      ];
      expect(EventEngine.filterByConditions(state, events)).toHaveLength(1);
    });
  });

  describe('sortByPriority', () => {
    it('按 priority 降序排列', () => {
      const events: TestEvent[] = [
        { id: 'low', type: 'story', priority: 1, trigger: { conditions: [] } },
        { id: 'high', type: 'story', priority: 100, trigger: { conditions: [] } },
        { id: 'mid', type: 'story', priority: 50, trigger: { conditions: [] } },
      ];
      const result = EventEngine.sortByPriority(events);
      expect(result.map((e) => e.id)).toEqual(['high', 'mid', 'low']);
    });

    it('相同 priority 保持原始顺序（稳定排序）', () => {
      const events: TestEvent[] = [
        { id: 'first', type: 'story', priority: 10, trigger: { conditions: [] } },
        { id: 'second', type: 'story', priority: 10, trigger: { conditions: [] } },
      ];
      const result = EventEngine.sortByPriority(events);
      expect(result.map((e) => e.id)).toEqual(['first', 'second']);
    });
  });

  describe('getTriggeredEvents', () => {
    it('返回满足条件且按优先级排序的事件', () => {
      const state = makeGameState();
      const events: TestEvent[] = [
        { id: 'low_priority', type: 'story', priority: 5, trigger: { conditions: [{ type: 'flag', key: 'found_letter' }] } },
        { id: 'high_priority', type: 'story', priority: 50, trigger: { conditions: [{ type: 'flag', key: 'found_letter' }] } },
        { id: 'not_triggered', type: 'story', priority: 100, trigger: { conditions: [{ type: 'flag', key: 'no_such_flag' }] } },
      ];
      const result = EventEngine.getTriggeredEvents(state, events);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('high_priority');
      expect(result[1].id).toBe('low_priority');
    });
  });
});
