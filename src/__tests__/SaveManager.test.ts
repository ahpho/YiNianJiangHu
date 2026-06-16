/**
 * SaveManager 单元测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SaveManager } from '../engine/SaveManager';
import type { GameState } from '../engine/types';

// ==================== Mock localStorage ====================

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

// ==================== 辅助函数 ====================

function createMockGameState(overrides?: Partial<GameState>): GameState {
  return {
    currentDay: 5,
    currentTimeslot: 'noon',
    currentLocation: 'jiangnan',
    playerStats: {
      health: 80,
      maxHealth: 100,
      qi: 45,
      maxQi: 60,
      attack: 15,
      defense: 10,
      speed: 12,
      level: 3,
    },
    npcFavors: {
      suqingheng: { trust: 50, intimacy: 30, awe: 20, fear: 5 },
      qingxuzhenren: { trust: 40, intimacy: 20, awe: 35, fear: 10 },
      shentingyu: { trust: 30, intimacy: 15, awe: 50, fear: 30 },
      luxiaoman: { trust: 25, intimacy: 40, awe: 15, fear: 10 },
      xiaopodi: { trust: 20, intimacy: 25, awe: 10, fear: 15 },
      ayiguli: { trust: 15, intimacy: 10, awe: 20, fear: 25 },
      baiyaoxian: { trust: 35, intimacy: 30, awe: 15, fear: 20 },
      liusuifeng: { trust: 45, intimacy: 20, awe: 25, fear: 5 },
      liwushuang: { trust: 10, intimacy: 15, awe: 60, fear: 50 },
      huochangqing: { trust: 30, intimacy: 25, awe: 30, fear: 15 },
      chubaiyi: { trust: 40, intimacy: 35, awe: 10, fear: 5 },
      laowei: { trust: 20, intimacy: 10, awe: 30, fear: 20 },
    },
    factionReputation: { taixu: 10, tingyu: -5, tieqi: 0, yaowang: 3, fentian: -2 },
    learnedMartialArts: ['劈砍', '太虚十三剑'],
    equippedSkills: ['劈砍'],
    flags: new Set(['accepted_laowei_guidance', 'met_suqingheng']),
    endingsUnlocked: [],
    unlockedArcs: new Set(['taixu_arc']),
    ...overrides,
  };
}

// ==================== 测试 ====================

describe('SaveManager', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- serialize ---

  describe('serialize', () => {
    it('should serialize GameState to SaveData with version and timestamp', () => {
      const state = createMockGameState();
      const saveData = SaveManager.serialize(state);

      expect(saveData.version).toBe(1);
      expect(saveData.timestamp).toBeTypeOf('number');
      expect(saveData.state.currentDay).toBe(5);
      expect(saveData.state.currentTimeslot).toBe('noon');
      expect(saveData.state.currentLocation).toBe('jiangnan');
    });

    it('should convert Set flags to array', () => {
      const state = createMockGameState({
        flags: new Set(['flag_a', 'flag_b', 'flag_c']),
      });
      const saveData = SaveManager.serialize(state);

      expect(Array.isArray(saveData.state.flags)).toBe(true);
      expect(saveData.state.flags).toContain('flag_a');
      expect(saveData.state.flags).toContain('flag_b');
      expect(saveData.state.flags).toContain('flag_c');
    });

    it('should convert Set unlockedArcs to array', () => {
      const state = createMockGameState({
        unlockedArcs: new Set(['arc_1', 'arc_2']),
      });
      const saveData = SaveManager.serialize(state);

      expect(Array.isArray(saveData.state.unlockedArcs)).toBe(true);
      expect(saveData.state.unlockedArcs).toContain('arc_1');
      expect(saveData.state.unlockedArcs).toContain('arc_2');
    });

    it('should copy arrays (not reference original)', () => {
      const state = createMockGameState();
      const saveData = SaveManager.serialize(state);

      saveData.state.learnedMartialArts.push('extra');
      expect(state.learnedMartialArts).not.toContain('extra');
    });

    it('should copy playerStats (not reference original)', () => {
      const state = createMockGameState();
      const saveData = SaveManager.serialize(state);

      saveData.state.playerStats.health = 1;
      expect(state.playerStats.health).toBe(80);
    });
  });

  // --- deserialize ---

  describe('deserialize', () => {
    it('should deserialize SaveData back to GameState', () => {
      const original = createMockGameState();
      const saveData = SaveManager.serialize(original);
      const restored = SaveManager.deserialize(saveData);

      expect(restored.currentDay).toBe(5);
      expect(restored.currentTimeslot).toBe('noon');
      expect(restored.currentLocation).toBe('jiangnan');
    });

    it('should convert flags array back to Set', () => {
      const original = createMockGameState({
        flags: new Set(['flag_x', 'flag_y']),
      });
      const saveData = SaveManager.serialize(original);
      const restored = SaveManager.deserialize(saveData);

      expect(restored.flags).toBeInstanceOf(Set);
      expect(restored.flags.has('flag_x')).toBe(true);
      expect(restored.flags.has('flag_y')).toBe(true);
    });

    it('should convert unlockedArcs array back to Set', () => {
      const original = createMockGameState({
        unlockedArcs: new Set(['arc_test']),
      });
      const saveData = SaveManager.serialize(original);
      const restored = SaveManager.deserialize(saveData);

      expect(restored.unlockedArcs).toBeInstanceOf(Set);
      expect(restored.unlockedArcs.has('arc_test')).toBe(true);
    });

    it('should preserve playerStats values', () => {
      const original = createMockGameState();
      const saveData = SaveManager.serialize(original);
      const restored = SaveManager.deserialize(saveData);

      expect(restored.playerStats.health).toBe(80);
      expect(restored.playerStats.qi).toBe(45);
      expect(restored.playerStats.attack).toBe(15);
      expect(restored.playerStats.level).toBe(3);
    });

    it('should preserve faction reputation', () => {
      const original = createMockGameState();
      const saveData = SaveManager.serialize(original);
      const restored = SaveManager.deserialize(saveData);

      expect(restored.factionReputation.taixu).toBe(10);
      expect(restored.factionReputation.fentian).toBe(-2);
    });

    it('should round-trip empty sets', () => {
      const original = createMockGameState({
        flags: new Set(),
        unlockedArcs: new Set(),
      });
      const saveData = SaveManager.serialize(original);
      const restored = SaveManager.deserialize(saveData);

      expect(restored.flags.size).toBe(0);
      expect(restored.unlockedArcs.size).toBe(0);
    });
  });

  // --- save / load ---

  describe('save and load', () => {
    it('should save to localStorage and return true', () => {
      const state = createMockGameState();
      const result = SaveManager.save(state);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should load saved state from localStorage', () => {
      const state = createMockGameState();
      SaveManager.save(state);

      const loaded = SaveManager.load();
      expect(loaded).not.toBeNull();
      expect(loaded!.currentDay).toBe(5);
      expect(loaded!.currentTimeslot).toBe('noon');
    });

    it('should load correctly with flags and arcs', () => {
      const state = createMockGameState({
        flags: new Set(['test_flag_1', 'test_flag_2']),
        unlockedArcs: new Set(['test_arc']),
      });
      SaveManager.save(state);

      const loaded = SaveManager.load()!;
      expect(loaded.flags).toBeInstanceOf(Set);
      expect(loaded.flags.has('test_flag_1')).toBe(true);
      expect(loaded.flags.has('test_flag_2')).toBe(true);
      expect(loaded.unlockedArcs).toBeInstanceOf(Set);
      expect(loaded.unlockedArcs.has('test_arc')).toBe(true);
    });
  });

  // --- hasSave ---

  describe('hasSave', () => {
    it('should return false when no save exists', () => {
      expect(SaveManager.hasSave()).toBe(false);
    });

    it('should return true after saving', () => {
      SaveManager.save(createMockGameState());
      expect(SaveManager.hasSave()).toBe(true);
    });
  });

  // --- deleteSave ---

  describe('deleteSave', () => {
    it('should delete the save from localStorage', () => {
      SaveManager.save(createMockGameState());
      expect(SaveManager.hasSave()).toBe(true);

      SaveManager.deleteSave();
      expect(SaveManager.hasSave()).toBe(false);
    });

    it('should be safe to call when no save exists', () => {
      expect(() => SaveManager.deleteSave()).not.toThrow();
    });
  });

  // --- getSaveInfo ---

  describe('getSaveInfo', () => {
    it('should return null when no save exists', () => {
      expect(SaveManager.getSaveInfo()).toBeNull();
    });

    it('should return day, timeslot, and timestamp', () => {
      const before = Date.now();
      SaveManager.save(createMockGameState({
        currentDay: 12,
        currentTimeslot: 'dusk',
      }));
      const after = Date.now();

      const info = SaveManager.getSaveInfo()!;
      expect(info).not.toBeNull();
      expect(info.day).toBe(12);
      expect(info.timeslot).toBe('dusk');
      expect(info.timestamp).toBeGreaterThanOrEqual(before);
      expect(info.timestamp).toBeLessThanOrEqual(after);
    });
  });

  // --- load edge cases ---

  describe('load edge cases', () => {
    it('should return null when localStorage is empty', () => {
      expect(SaveManager.load()).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      localStorageMock.setItem('yinian-jianghu-save', 'not-json');
      expect(SaveManager.load()).toBeNull();
    });

    it('should return null for missing required fields', () => {
      localStorageMock.setItem('yinian-jianghu-save', JSON.stringify({ version: 1 }));
      expect(SaveManager.load()).toBeNull();
    });

    it('should return null for invalid version', () => {
      const invalidSave = {
        version: 999,
        timestamp: Date.now(),
        state: createMockGameState(),
      };
      localStorageMock.setItem('yinian-jianghu-save', JSON.stringify(invalidSave));
      expect(SaveManager.load()).toBeNull();
    });

    it('should return null for invalid timeslot', () => {
      const state = createMockGameState();
      const saveData = SaveManager.serialize(state);
      (saveData.state as any).currentTimeslot = 'invalid';
      localStorageMock.setItem('yinian-jianghu-save', JSON.stringify(saveData));
      expect(SaveManager.load()).toBeNull();
    });
  });
});
