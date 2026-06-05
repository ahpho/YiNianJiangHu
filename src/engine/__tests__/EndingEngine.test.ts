import { describe, it, expect } from 'vitest';
import { EndingEngine } from '../EndingEngine';
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
    currentDay: 30,
    currentTimeslot: 'night',
    currentLocation: 'zhongyuan',
    playerStats: { health: 100, maxHealth: 100, qi: 80, maxQi: 100, attack: 15, defense: 12, speed: 10, level: 2 },
    npcFavors: favors,
    factionReputation: { taixu: 50, tingyu: 30, tieqi: 40, yaowang: 20, fentian: 10 },
    learnedMartialArts: [],
    equippedSkills: [],
    flags: new Set(),
    endingsUnlocked: [],
    unlockedArcs: new Set(),
    ...overrides,
  };
};

describe('EndingEngine', () => {
  describe('ENDING_PRIORITY', () => {
    it('一念成佛优先级最高（1）', () => {
      expect(EndingEngine.ENDING_PRIORITY['yinian_chengfo']).toBe(1);
    });

    it('归隐山林优先级最低（7）', () => {
      expect(EndingEngine.ENDING_PRIORITY['guiyin_shanlin']).toBe(7);
    });

    it('共定义 7 个结局', () => {
      expect(Object.keys(EndingEngine.ENDING_PRIORITY)).toHaveLength(7);
    });
  });

  describe('isMutualExclusion', () => {
    it('一念成佛 与 走火入魔 互斥', () => {
      expect(EndingEngine.isMutualExclusion('yinian_chengfo', 'zouhuo_rumo')).toBe(true);
    });

    it('一念成佛 与 一统江湖 互斥', () => {
      expect(EndingEngine.isMutualExclusion('yinian_chengfo', 'yitong_jianghu')).toBe(true);
    });

    it('武林盟主 与 一统江湖 互斥', () => {
      expect(EndingEngine.isMutualExclusion('wulin_mengzhu', 'yitong_jianghu')).toBe(true);
    });

    it('朝廷鹰犬 与 归隐山林 互斥', () => {
      expect(EndingEngine.isMutualExclusion('chaoting_yingquan', 'guiyin_shanlin')).toBe(true);
    });

    it('血染长空 与任意结局不互斥', () => {
      expect(EndingEngine.isMutualExclusion('xueran_changkong', 'yinian_chengfo')).toBe(false);
      expect(EndingEngine.isMutualExclusion('xueran_changkong', 'chaoting_yingquan')).toBe(false);
    });

    it('相同结局不互斥', () => {
      expect(EndingEngine.isMutualExclusion('yinian_chengfo', 'yinian_chengfo')).toBe(false);
    });
  });

  describe('evaluateEnding', () => {
    it('无解锁结局时返回 null', () => {
      const state = makeGameState();
      const result = EndingEngine.evaluateEnding(state, []);
      expect(result).toBeNull();
    });

    it('返回最高优先级的可触发结局', () => {
      const state = makeGameState({
        unlockedArcs: new Set(['yinian_chengfo', 'guiyin_shanlin']),
      });
      const endings = [
        { id: 'yinian_chengfo', mutuallyExclusive: ['zouhuo_rumo', 'yitong_jianghu'] },
        { id: 'guiyin_shanlin', mutuallyExclusive: ['chaoting_yingquan'] },
      ];
      const result = EndingEngine.evaluateEnding(state, endings);
      expect(result).toBe('yinian_chengfo');
    });

    it('互斥结局中返回优先级更高的', () => {
      const state = makeGameState({
        unlockedArcs: new Set(['yinian_chengfo', 'zouhuo_rumo']),
      });
      const endings = [
        { id: 'yinian_chengfo', mutuallyExclusive: ['zouhuo_rumo'] },
        { id: 'zouhuo_rumo', mutuallyExclusive: ['yinian_chengfo'] },
      ];
      const result = EndingEngine.evaluateEnding(state, endings);
      expect(result).toBe('yinian_chengfo');
    });

    it('只解锁低优先级结局时返回该结局', () => {
      const state = makeGameState({
        unlockedArcs: new Set(['guiyin_shanlin']),
      });
      const endings = [
        { id: 'yinian_chengfo', mutuallyExclusive: [] },
        { id: 'guiyin_shanlin', mutuallyExclusive: [] },
      ];
      const result = EndingEngine.evaluateEnding(state, endings);
      expect(result).toBe('guiyin_shanlin');
    });

    it('默认结局为归隐山林', () => {
      expect(EndingEngine.getDefaultEnding()).toBe('guiyin_shanlin');
    });

    it('getPriority 返回正确优先级', () => {
      expect(EndingEngine.getPriority('yinian_chengfo')).toBe(1);
      expect(EndingEngine.getPriority('guiyin_shanlin')).toBe(7);
      expect(EndingEngine.getPriority('unknown')).toBe(99);
    });
  });
});
