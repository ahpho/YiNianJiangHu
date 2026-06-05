import { describe, it, expect } from 'vitest';
import { TimeEngine } from '../TimeEngine';
import type { GameState, NPC_ID } from '../types';

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
    currentDay: 1,
    currentTimeslot: 'dawn',
    currentLocation: 'zhongyuan',
    playerStats: { health: 80, maxHealth: 100, qi: 50, maxQi: 100, attack: 12, defense: 10, speed: 10, level: 1 },
    npcFavors: favors,
    factionReputation: { taixu: 0, tingyu: 0, tieqi: 0, yaowang: 0, fentian: 0 },
    learnedMartialArts: [],
    equippedSkills: [],
    flags: new Set(),
    endingsUnlocked: [],
    unlockedArcs: new Set(),
    ...overrides,
  };
};

describe('TimeEngine', () => {
  describe('getNextTimeslot', () => {
    it('dawn → noon', () => { expect(TimeEngine.getNextTimeslot('dawn')).toBe('noon'); });
    it('noon → dusk', () => { expect(TimeEngine.getNextTimeslot('noon')).toBe('dusk'); });
    it('dusk → night', () => { expect(TimeEngine.getNextTimeslot('dusk')).toBe('night'); });
    it('night → dawn（跨天）', () => { expect(TimeEngine.getNextTimeslot('night')).toBe('dawn'); });
  });

  describe('isDayBoundary', () => {
    it('night 返回 true', () => { expect(TimeEngine.isDayBoundary('night')).toBe(true); });
    it('dawn 返回 false', () => { expect(TimeEngine.isDayBoundary('dawn')).toBe(false); });
  });

  describe('advanceTimeslot', () => {
    it('dawn → noon，天数不变', () => {
      const state = makeGameState({ currentDay: 1, currentTimeslot: 'dawn' });
      const result = TimeEngine.advanceTimeslot(state);
      expect(result.currentTimeslot).toBe('noon');
      expect(result.currentDay).toBe(1);
    });

    it('night → dawn，天数 +1', () => {
      const state = makeGameState({ currentDay: 5, currentTimeslot: 'night' });
      const result = TimeEngine.advanceTimeslot(state);
      expect(result.currentTimeslot).toBe('dawn');
      expect(result.currentDay).toBe(6);
    });

    it('第 30 天 night → dawn，天数不超 30', () => {
      const state = makeGameState({ currentDay: 30, currentTimeslot: 'night' });
      const result = TimeEngine.advanceTimeslot(state);
      expect(result.currentDay).toBe(30);
      expect(result.currentTimeslot).toBe('dawn');
    });
  });

  describe('dawnRecovery', () => {
    it('卯时开始恢复 20 气力', () => {
      const state = makeGameState();
      state.playerStats.qi = 40;
      const result = TimeEngine.dawnRecovery(state);
      expect(result.playerStats.qi).toBe(60);
    });

    it('气力不超过 maxQi', () => {
      const state = makeGameState();
      state.playerStats.qi = 90;
      const result = TimeEngine.dawnRecovery(state);
      expect(result.playerStats.qi).toBe(100);
    });

    it('卯时恢复 10 点生命值', () => {
      const state = makeGameState();
      state.playerStats.health = 60;
      const result = TimeEngine.dawnRecovery(state);
      expect(result.playerStats.health).toBe(70);
    });

    it('生命值不超过 maxHealth', () => {
      const state = makeGameState();
      state.playerStats.health = 95;
      const result = TimeEngine.dawnRecovery(state);
      expect(result.playerStats.health).toBe(100);
    });
  });

  describe('travel', () => {
    it('中原 → 江南消耗 2 个时辰（20 气力）', () => {
      const state = makeGameState({ currentLocation: 'zhongyuan' });
      const result = TimeEngine.travel(state, 'jiangnan');
      expect(result.currentLocation).toBe('jiangnan');
      expect(result.playerStats.qi).toBe(30);
    });

    it('中原 → 中原消耗 0', () => {
      const state = makeGameState({ currentLocation: 'zhongyuan' });
      const result = TimeEngine.travel(state, 'zhongyuan');
      expect(result.playerStats.qi).toBe(50);
    });
  });

  describe('getTravelCost', () => {
    it('中原 → 江南 = 2', () => { expect(TimeEngine.getTravelCost('zhongyuan', 'jiangnan')).toBe(2); });
    it('塞北 → 西域 = 2', () => { expect(TimeEngine.getTravelCost('saibei', 'xiyu')).toBe(2); });
    it('蜀中 → 塞北 = 3', () => { expect(TimeEngine.getTravelCost('shuzhong', 'saibei')).toBe(3); });
  });

  describe('getProgressPercent', () => {
    it('第 1 天 dawn = 0%', () => {
      const state = makeGameState({ currentDay: 1, currentTimeslot: 'dawn' });
      expect(TimeEngine.getProgressPercent(state)).toBe(0);
    });

    it('第 16 天 dawn = 50%', () => {
      const state = makeGameState({ currentDay: 16, currentTimeslot: 'dawn' });
      expect(TimeEngine.getProgressPercent(state)).toBe(50);
    });
  });
});
