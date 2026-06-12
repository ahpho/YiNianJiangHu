import { describe, it, expect } from 'vitest';
import { SkillSystem, SKILL_LIBRARY, type Skill, type SkillState } from '../SkillSystem';

describe('SkillSystem', () => {
  describe('getAllSkills', () => {
    it('应该返回所有技能', () => {
      const skills = SkillSystem.getAllSkills();
      expect(skills.length).toBeGreaterThan(0);
      expect(skills.length).toBe(Object.keys(SKILL_LIBRARY).length);
    });
  });

  describe('getSkill', () => {
    it('应该根据ID返回技能', () => {
      const skill = SkillSystem.getSkill('taixu_sword_basic');
      expect(skill).toBeDefined();
      expect(skill?.name).toBe('太虚十三剑');
    });

    it('不存在的技能应该返回undefined', () => {
      const skill = SkillSystem.getSkill('nonexistent');
      expect(skill).toBeUndefined();
    });
  });

  describe('canUnlock', () => {
    it('无解锁条件的技能始终可解锁', () => {
      const skill: Skill = {
        id: 'test',
        name: 'test',
        description: 'test',
        element: 'sword',
        type: 'attack',
        damageMultiplier: 1.0,
        qiCost: 10,
        cooldown: 0,
      };
      expect(SkillSystem.canUnlock(skill, {})).toBe(true);
    });

    it('好感度条件：满足条件时可解锁', () => {
      const skill: Skill = {
        id: 'test',
        name: 'test',
        description: 'test',
        element: 'sword',
        type: 'attack',
        damageMultiplier: 1.0,
        qiCost: 10,
        cooldown: 0,
        unlockCondition: 'trust_npc1_50',
      };
      const context = { favors: { npc1: 60 } };
      expect(SkillSystem.canUnlock(skill, context)).toBe(true);
    });

    it('好感度条件：不满足条件时不可解锁', () => {
      const skill: Skill = {
        id: 'test',
        name: 'test',
        description: 'test',
        element: 'sword',
        type: 'attack',
        damageMultiplier: 1.0,
        qiCost: 10,
        cooldown: 0,
        unlockCondition: 'trust_npc1_50',
      };
      const context = { favors: { npc1: 40 } };
      expect(SkillSystem.canUnlock(skill, context)).toBe(false);
    });

    it('等级条件：满足条件时可解锁', () => {
      const skill: Skill = {
        id: 'test',
        name: 'test',
        description: 'test',
        element: 'sword',
        type: 'attack',
        damageMultiplier: 1.0,
        qiCost: 10,
        cooldown: 0,
        unlockCondition: 'level_10',
      };
      const context = { level: 15 };
      expect(SkillSystem.canUnlock(skill, context)).toBe(true);
    });

    it('等级条件：不满足条件时不可解锁', () => {
      const skill: Skill = {
        id: 'test',
        name: 'test',
        description: 'test',
        element: 'sword',
        type: 'attack',
        damageMultiplier: 1.0,
        qiCost: 10,
        cooldown: 0,
        unlockCondition: 'level_10',
      };
      const context = { level: 5 };
      expect(SkillSystem.canUnlock(skill, context)).toBe(false);
    });
  });

  describe('calculateSkillDamage', () => {
    it('应该根据伤害倍率计算技能伤害', () => {
      const skill = SKILL_LIBRARY['taixu_sword_basic'];
      const attacker = { attack: 20, qi: 80, maxQi: 100 };
      const defender = { defense: 10, isDefending: false };
      const damage = SkillSystem.calculateSkillDamage(skill, attacker, defender);
      expect(damage).toBeGreaterThan(0);
    });

    it('攻击技能应该有伤害，非攻击技能伤害为0', () => {
      const attackSkill = SKILL_LIBRARY['taixu_sword_basic'];
      const healSkill = SKILL_LIBRARY['tingyu_qi_basic'];
      const attacker = { attack: 20, qi: 80, maxQi: 100 };
      const defender = { defense: 10, isDefending: false };

      expect(SkillSystem.calculateSkillDamage(attackSkill, attacker, defender)).toBeGreaterThan(0);
      expect(SkillSystem.calculateSkillDamage(healSkill, attacker, defender)).toBe(0);
    });

    it('防御时伤害应该减半', () => {
      const skill = SKILL_LIBRARY['taixu_sword_basic'];
      const attacker = { attack: 20, qi: 80, maxQi: 100 };
      const normalDmg = SkillSystem.calculateSkillDamage(skill, attacker, { defense: 10, isDefending: false });
      const defendingDmg = SkillSystem.calculateSkillDamage(skill, attacker, { defense: 10, isDefending: true });
      expect(defendingDmg).toBeLessThan(normalDmg);
    });
  });

  describe('hasEnoughQi', () => {
    it('内力足够时返回true', () => {
      const skill = SKILL_LIBRARY['taixu_sword_basic'];
      expect(SkillSystem.hasEnoughQi(skill, 100)).toBe(true);
    });

    it('内力不足时返回false', () => {
      const skill = SKILL_LIBRARY['taixu_sword_basic'];
      expect(SkillSystem.hasEnoughQi(skill, 5)).toBe(false);
    });
  });

  describe('isOnCooldown', () => {
    it('冷却中返回true', () => {
      const state: SkillState = {
        skill: SKILL_LIBRARY['taixu_sword_basic'],
        currentCooldown: 2,
        unlocked: true,
      };
      expect(SkillSystem.isOnCooldown(state)).toBe(true);
    });

    it('冷却结束返回false', () => {
      const state: SkillState = {
        skill: SKILL_LIBRARY['taixu_sword_basic'],
        currentCooldown: 0,
        unlocked: true,
      };
      expect(SkillSystem.isOnCooldown(state)).toBe(false);
    });

    it('未定义状态返回false', () => {
      expect(SkillSystem.isOnCooldown(undefined)).toBe(false);
    });
  });

  describe('reduceCooldowns', () => {
    it('应该减少所有技能冷却', () => {
      const states: Record<string, SkillState> = {
        skill1: {
          skill: SKILL_LIBRARY['taixu_sword_basic'],
          currentCooldown: 3,
          unlocked: true,
        },
        skill2: {
          skill: SKILL_LIBRARY['taixu_sword_advanced'],
          currentCooldown: 1,
          unlocked: true,
        },
      };
      const updated = SkillSystem.reduceCooldowns(states);
      expect(updated.skill1.currentCooldown).toBe(2);
      expect(updated.skill2.currentCooldown).toBe(0);
    });

    it('冷却不低于0', () => {
      const states: Record<string, SkillState> = {
        skill1: {
          skill: SKILL_LIBRARY['taixu_sword_basic'],
          currentCooldown: 0,
          unlocked: true,
        },
      };
      const updated = SkillSystem.reduceCooldowns(states);
      expect(updated.skill1.currentCooldown).toBe(0);
    });
  });

  describe('applyCooldown', () => {
    it('使用技能后应该设置冷却', () => {
      const skill = SKILL_LIBRARY['taixu_sword_advanced'];
      const state: SkillState = {
        skill,
        currentCooldown: 0,
        unlocked: true,
      };
      const updated = SkillSystem.applyCooldown(state);
      expect(updated.currentCooldown).toBe(skill.cooldown);
    });
  });

  describe('getUnlockDescription', () => {
    it('无解锁条件返回"无需解锁"', () => {
      const skill = SKILL_LIBRARY['taixu_sword_basic'];
      expect(SkillSystem.getUnlockDescription(skill)).toBe('无需解锁');
    });

    it('好感度条件返回正确描述', () => {
      const skill = SKILL_LIBRARY['taixu_sword_advanced'];
      const desc = SkillSystem.getUnlockDescription(skill);
      expect(desc).toContain('好感度');
    });
  });
});
