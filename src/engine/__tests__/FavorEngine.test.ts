import { describe, it, expect } from 'vitest';
import { FavorEngine } from '../FavorEngine';
import type { NPC_Favor, NPC_ID } from '../types';

const makeFavor = (overrides: Partial<NPC_Favor> = {}): NPC_Favor => ({
  trust: 50,
  intimacy: 30,
  awe: 20,
  fear: 5,
  ...overrides,
});

const ALL_NPCS: NPC_ID[] = [
  'suqingheng', 'qingxuzhenren', 'shentingyu', 'luxiaoman',
  'xiaopodi', 'ayiguli', 'baiyaoxian', 'liusuifeng',
  'liwushuang', 'huochangqing', 'chubaiyi', 'laowei',
];

const makeFavors = (id: NPC_ID, favor: NPC_Favor): Record<NPC_ID, NPC_Favor> => {
  const favors: Record<string, NPC_Favor> = {};
  for (const npc of ALL_NPCS) {
    favors[npc] = npc === id ? favor : makeFavor();
  }
  return favors as Record<NPC_ID, NPC_Favor>;
};

describe('FavorEngine', () => {
  describe('applyFavorChange', () => {
    it('增加信任维度', () => {
      const favors = makeFavors('suqingheng', makeFavor({ trust: 50 }));
      const result = FavorEngine.applyFavorChange(favors, 'suqingheng', { trust: 10 });
      expect(result.suqingheng.trust).toBe(60);
    });

    it('减少信任维度', () => {
      const favors = makeFavors('suqingheng', makeFavor({ trust: 50 }));
      const result = FavorEngine.applyFavorChange(favors, 'suqingheng', { trust: -15 });
      expect(result.suqingheng.trust).toBe(35);
    });

    it('好感度限制在 0-100 范围内', () => {
      const favors = makeFavors('suqingheng', makeFavor({ trust: 95 }));
      const result = FavorEngine.applyFavorChange(favors, 'suqingheng', { trust: 20 });
      expect(result.suqingheng.trust).toBe(100);
    });

    it('好感度不低于 0', () => {
      const favors = makeFavors('suqingheng', makeFavor({ trust: 5 }));
      const result = FavorEngine.applyFavorChange(favors, 'suqingheng', { trust: -20 });
      expect(result.suqingheng.trust).toBe(0);
    });

    it('同时变化多个维度', () => {
      const favors = makeFavors('suqingheng', makeFavor());
      const result = FavorEngine.applyFavorChange(favors, 'suqingheng', {
        trust: 10, intimacy: -5, awe: 8, fear: -3,
      });
      expect(result.suqingheng.trust).toBe(60);
      expect(result.suqingheng.intimacy).toBe(25);
      expect(result.suqingheng.awe).toBe(28);
      expect(result.suqingheng.fear).toBe(2);
    });
  });

  describe('applyRipple（一念联动）', () => {
    it('ripple 字段触发联动变化', () => {
      const favors = makeFavors('suqingheng', makeFavor({ awe: 30 }));
      const result = FavorEngine.applyFavorChange(favors, 'suqingheng', { trust: 15 }, { dim: 'awe', delta: -5 });
      expect(result.suqingheng.trust).toBe(65);
      expect(result.suqingheng.awe).toBe(25);
    });

    it('ripple 联动同样受 0-100 限制', () => {
      const favors = makeFavors('suqingheng', makeFavor({ awe: 3 }));
      const result = FavorEngine.applyFavorChange(favors, 'suqingheng', { trust: 10 }, { dim: 'awe', delta: -10 });
      expect(result.suqingheng.awe).toBe(0);
    });

    it('不设 ripple 时仅变化指定维度', () => {
      const favors = makeFavors('suqingheng', makeFavor({ awe: 30 }));
      const result = FavorEngine.applyFavorChange(favors, 'suqingheng', { trust: 10 });
      expect(result.suqingheng.awe).toBe(30);
    });
  });

  describe('getFavorThreshold', () => {
    it('0-20 返回 enemy', () => { expect(FavorEngine.getFavorThreshold(10)).toBe('enemy'); });
    it('21-40 返回 cold', () => { expect(FavorEngine.getFavorThreshold(30)).toBe('cold'); });
    it('41-60 返回 normal', () => { expect(FavorEngine.getFavorThreshold(50)).toBe('normal'); });
    it('61-80 返回 friendly', () => { expect(FavorEngine.getFavorThreshold(70)).toBe('friendly'); });
    it('81-100 返回 intimate', () => { expect(FavorEngine.getFavorThreshold(90)).toBe('intimate'); });
    it('边界值 0 返回 enemy', () => { expect(FavorEngine.getFavorThreshold(0)).toBe('enemy'); });
    it('边界值 100 返回 intimate', () => { expect(FavorEngine.getFavorThreshold(100)).toBe('intimate'); });
  });
});
