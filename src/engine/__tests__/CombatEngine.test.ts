import { describe, it, expect } from 'vitest';
import { CombatEngine } from '../CombatEngine';
import type { Combatant } from '../types';

const makeCombatant = (overrides: Partial<Combatant> = {}): Combatant => ({
  id: 'player',
  name: '玩家',
  health: 100,
  maxHealth: 100,
  qi: 80,
  maxQi: 100,
  attack: 15,
  defense: 10,
  speed: 10,
  moves: ['太虚十三剑'],
  isDefending: false,
  buffs: [],
  debuffs: [],
  ...overrides,
});

describe('CombatEngine', () => {
  describe('calculateDamage', () => {
    it('基础伤害 × 元素克制 1.3', () => {
      const dmg = CombatEngine.calculateDamage({
        baseDamage: 25,
        attackerQi: 80,
        attackerMaxQi: 100,
        elementMultiplier: 1.3,
        isDefending: false,
        randomSeed: 0.5,
      });
      expect(dmg).toBeGreaterThanOrEqual(20);
      expect(dmg).toBeLessThanOrEqual(40);
    });

    it('防御时伤害减半', () => {
      const normal = CombatEngine.calculateDamage({
        baseDamage: 25, attackerQi: 100, attackerMaxQi: 100,
        elementMultiplier: 1.0, isDefending: false, randomSeed: 0.5,
      });
      const defending = CombatEngine.calculateDamage({
        baseDamage: 25, attackerQi: 100, attackerMaxQi: 100,
        elementMultiplier: 1.0, isDefending: true, randomSeed: 0.5,
      });
      expect(defending).toBeLessThan(normal);
    });
  });

  describe('getElementMultiplier', () => {
    it('剑克拳 → 1.3', () => { expect(CombatEngine.getElementMultiplier('sword', 'fist')).toBe(1.3); });
    it('拳克毒 → 1.3', () => { expect(CombatEngine.getElementMultiplier('fist', 'poison')).toBe(1.3); });
    it('毒克气 → 1.3', () => { expect(CombatEngine.getElementMultiplier('poison', 'qi')).toBe(1.3); });
    it('气克剑 → 1.3', () => { expect(CombatEngine.getElementMultiplier('qi', 'sword')).toBe(1.3); });
    it('拳被剑克 → 0.7', () => { expect(CombatEngine.getElementMultiplier('fist', 'sword')).toBe(0.7); });
    it('同属性 → 1.0', () => { expect(CombatEngine.getElementMultiplier('sword', 'sword')).toBe(1.0); });
  });

  describe('sortBySpeed', () => {
    it('按速度降序排列', () => {
      const a = makeCombatant({ id: 'slow', speed: 5 });
      const b = makeCombatant({ id: 'fast', speed: 20 });
      const result = CombatEngine.sortBySpeed([a, b]);
      expect(result[0].id).toBe('fast');
    });
  });

  describe('applyQiCost', () => {
    it('扣减气力', () => {
      const c = makeCombatant({ qi: 80 });
      const result = CombatEngine.applyQiCost(c, 30);
      expect(result.qi).toBe(50);
    });

    it('气力不低于 0', () => {
      const c = makeCombatant({ qi: 10 });
      const result = CombatEngine.applyQiCost(c, 30);
      expect(result.qi).toBe(0);
    });
  });

  describe('checkBattleEnd', () => {
    it('玩家生命为 0 → 败北', () => {
      const player = makeCombatant({ health: 0 });
      const enemy = makeCombatant({ id: 'enemy', health: 50 });
      const result = CombatEngine.checkBattleEnd(player, [enemy]);
      expect(result.ended).toBe(true);
      expect(result.victory).toBe(false);
    });

    it('全部敌人生命为 0 → 胜利', () => {
      const player = makeCombatant({ health: 50 });
      const enemies = [
        makeCombatant({ id: 'e1', health: 0 }),
        makeCombatant({ id: 'e2', health: 0 }),
      ];
      const result = CombatEngine.checkBattleEnd(player, enemies);
      expect(result.ended).toBe(true);
      expect(result.victory).toBe(true);
    });

    it('双方存活 → 战斗未结束', () => {
      const player = makeCombatant({ health: 50 });
      const enemies = [makeCombatant({ id: 'e', health: 30 })];
      const result = CombatEngine.checkBattleEnd(player, enemies);
      expect(result.ended).toBe(false);
    });
  });

  describe('applyDamage', () => {
    it('扣减生命值', () => {
      const c = makeCombatant({ health: 100 });
      const result = CombatEngine.applyDamage(c, 30);
      expect(result.health).toBe(70);
    });

    it('生命值不低于 0', () => {
      const c = makeCombatant({ health: 20 });
      const result = CombatEngine.applyDamage(c, 50);
      expect(result.health).toBe(0);
    });
  });

  describe('processDefending / clearDefending', () => {
    it('设置防御状态', () => {
      const c = makeCombatant({ isDefending: false });
      expect(CombatEngine.processDefending(c).isDefending).toBe(true);
    });

    it('清除所有角色防御状态', () => {
      const combatants = [
        makeCombatant({ id: 'a', isDefending: true }),
        makeCombatant({ id: 'b', isDefending: true }),
      ];
      const result = CombatEngine.clearDefending(combatants);
      expect(result.every((c) => c.isDefending === false)).toBe(true);
    });
  });
});
