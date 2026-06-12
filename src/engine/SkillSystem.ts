import type { Element } from './types';

/**
 * 技能系统
 * 管理技能的配置、消耗、伤害计算、冷却和学习机制
 */
export interface Skill {
  id: string;
  name: string;
  description: string;
  element: Element;
  type: 'attack' | 'defend' | 'heal' | 'buff';
  damageMultiplier: number;  // 伤害倍率（相对于基础攻击）
  qiCost: number;            // 内力消耗
  cooldown: number;          // 冷却回合数
  unlockCondition?: string;  // 解锁条件
  effects?: SkillEffect[];   // 附加效果
}

export interface SkillEffect {
  type: 'burn' | 'poison' | 'stun' | 'heal' | 'buff';
  value: number;
  duration: number;
  chance: number;  // 触发概率 0-1
}

export interface SkillState {
  skill: Skill;
  currentCooldown: number;  // 当前剩余冷却回合
  unlocked: boolean;         // 是否已解锁
}

// ==================== 技能数据 ====================

/**
 * 预定义技能库
 * 玩家可以学习和装备这些技能
 */
export const SKILL_LIBRARY: Record<string, Skill> = {
  // 太虚剑宗 - 剑法系
  taixu_sword_basic: {
    id: 'taixu_sword_basic',
    name: '太虚十三剑',
    description: '太虚剑宗入门剑法，剑势轻盈',
    element: 'sword',
    type: 'attack',
    damageMultiplier: 1.3,
    qiCost: 15,
    cooldown: 0,
  },
  taixu_sword_advanced: {
    id: 'taixu_sword_advanced',
    name: '剑气如虹',
    description: '太虚剑法进阶，剑气凌厉',
    element: 'sword',
    type: 'attack',
    damageMultiplier: 1.8,
    qiCost: 30,
    cooldown: 2,
    unlockCondition: 'trust_suqingheng_50',
    effects: [
      { type: 'burn', value: 5, duration: 2, chance: 0.3 },
    ],
  },
  taixu_sword_ultimate: {
    id: 'taixu_sword_ultimate',
    name: '万剑归宗',
    description: '太虚剑法终极奥义，万剑齐发',
    element: 'sword',
    type: 'attack',
    damageMultiplier: 2.5,
    qiCost: 60,
    cooldown: 5,
    unlockCondition: 'favor_suqingheng_80',
  },

  // 听雨楼 - 内功系
  tingyu_qi_basic: {
    id: 'tingyu_qi_basic',
    name: '听雨心法',
    description: '听雨楼入门内功，调息养气',
    element: 'qi',
    type: 'heal',
    damageMultiplier: 0,
    qiCost: 20,
    cooldown: 3,
    effects: [
      { type: 'heal', value: 30, duration: 0, chance: 1.0 },
    ],
  },
  tingyu_qi_advanced: {
    id: 'tingyu_qi_advanced',
    name: '雨打芭蕉',
    description: '听雨楼进阶内功，以气化力',
    element: 'qi',
    type: 'attack',
    damageMultiplier: 1.5,
    qiCost: 25,
    cooldown: 1,
    unlockCondition: 'trust_shentingyu_50',
  },

  // 铁骑门 - 拳法系
  tieqi_fist_basic: {
    id: 'tieqi_fist_basic',
    name: '铁骑拳',
    description: '铁骑门入门拳法，刚猛有力',
    element: 'fist',
    type: 'attack',
    damageMultiplier: 1.2,
    qiCost: 10,
    cooldown: 0,
  },
  tieqi_fist_advanced: {
    id: 'tieqi_fist_advanced',
    name: '霸王举鼎',
    description: '铁骑门进阶拳法，力拔山兮',
    element: 'fist',
    type: 'attack',
    damageMultiplier: 1.7,
    qiCost: 25,
    cooldown: 2,
    unlockCondition: 'favor_liwushuang_50',
    effects: [
      { type: 'stun', value: 1, duration: 1, chance: 0.25 },
    ],
  },

  // 药王谷 - 毒系
  yaowang_poison_basic: {
    id: 'yaowang_poison_basic',
    name: '七虫七草',
    description: '药王谷入门毒功，淬毒于掌',
    element: 'poison',
    type: 'attack',
    damageMultiplier: 1.0,
    qiCost: 15,
    cooldown: 1,
    effects: [
      { type: 'poison', value: 3, duration: 3, chance: 0.5 },
    ],
  },
  yaowang_poison_advanced: {
    id: 'yaowang_poison_advanced',
    name: '万毒噬心',
    description: '药王谷进阶毒功，剧毒攻心',
    element: 'poison',
    type: 'attack',
    damageMultiplier: 1.6,
    qiCost: 35,
    cooldown: 3,
    unlockCondition: 'favor_baiyaoxian_60',
    effects: [
      { type: 'poison', value: 8, duration: 4, chance: 0.8 },
    ],
  },

  // 焚天教 - 火焰系（用气系代替）
  fentian_fire_basic: {
    id: 'fentian_fire_basic',
    name: '烈焰掌',
    description: '焚天教入门功法，掌含烈焰',
    element: 'qi',
    type: 'attack',
    damageMultiplier: 1.4,
    qiCost: 20,
    cooldown: 1,
    effects: [
      { type: 'burn', value: 8, duration: 2, chance: 0.4 },
    ],
  },
  fentian_fire_advanced: {
    id: 'fentian_fire_advanced',
    name: '焚天灭世',
    description: '焚天教终极奥义，焚尽一切',
    element: 'qi',
    type: 'attack',
    damageMultiplier: 2.2,
    qiCost: 50,
    cooldown: 4,
    unlockCondition: 'favor_huochangqing_70',
    effects: [
      { type: 'burn', value: 15, duration: 3, chance: 0.7 },
    ],
  },

  // 通用防御技能
  common_defend: {
    id: 'common_defend',
    name: '金钟罩',
    description: '运气于体，减免伤害',
    element: 'qi',
    type: 'defend',
    damageMultiplier: 0,
    qiCost: 15,
    cooldown: 2,
  },
};

// ==================== 技能系统引擎 ====================

export const SkillSystem = {
  /**
   * 获取所有技能
   */
  getAllSkills(): Skill[] {
    return Object.values(SKILL_LIBRARY);
  },

  /**
   * 根据ID获取技能
   */
  getSkill(id: string): Skill | undefined {
    return SKILL_LIBRARY[id];
  },

  /**
   * 根据解锁条件检查技能是否可学习
   * @param skill 技能
   * @param context 上下文（好感度、等级等）
   */
  canUnlock(skill: Skill, context: UnlockContext): boolean {
    if (!skill.unlockCondition) return true;

    const condition = skill.unlockCondition;
    // 解析条件
    if (condition.startsWith('trust_')) {
      const npcId = condition.split('_')[1];
      const required = parseInt(condition.split('_')[2]);
      return (context.favors?.[npcId] ?? 0) >= required;
    }
    if (condition.startsWith('favor_')) {
      const npcId = condition.split('_')[1];
      const required = parseInt(condition.split('_')[2]);
      return (context.favors?.[npcId] ?? 0) >= required;
    }
    if (condition.startsWith('level_')) {
      const required = parseInt(condition.split('_')[1]);
      return (context.level ?? 1) >= required;
    }
    return false;
  },

  /**
   * 计算技能伤害
   * @param skill 技能
   * @param attacker 攻击者
   * @param defender 防御者
   */
  calculateSkillDamage(
    skill: Skill,
    attacker: { attack: number; qi: number; maxQi: number },
    defender: { defense: number; isDefending: boolean },
  ): number {
    if (skill.type !== 'attack') return 0;

    const baseDamage = attacker.attack * skill.damageMultiplier;
    const qiMultiplier = attacker.maxQi > 0
      ? (attacker.qi / attacker.maxQi) * 1.2
      : 0;
    const defenseMultiplier = defender.isDefending ? 0.5 : 1.0;
    const randomFloat = 0.9 + Math.random() * 0.2;

    return Math.floor(baseDamage * qiMultiplier * defenseMultiplier * randomFloat);
  },

  /**
   * 检查内力是否足够释放技能
   */
  hasEnoughQi(skill: Skill, currentQi: number): boolean {
    return currentQi >= skill.qiCost;
  },

  /**
   * 检查技能是否在冷却中
   */
  isOnCooldown(skillState: SkillState | undefined): boolean {
    return (skillState?.currentCooldown ?? 0) > 0;
  },

  /**
   * 减少所有技能冷却（回合结束时调用）
   */
  reduceCooldowns(skillStates: Record<string, SkillState>): Record<string, SkillState> {
    const updated: Record<string, SkillState> = {};
    for (const [id, state] of Object.entries(skillStates)) {
      updated[id] = {
        ...state,
        currentCooldown: Math.max(0, state.currentCooldown - 1),
      };
    }
    return updated;
  },

  /**
   * 使用技能后更新冷却
   */
  applyCooldown(skillState: SkillState): SkillState {
    return {
      ...skillState,
      currentCooldown: skillState.skill.cooldown,
    };
  },

  /**
   * 获取技能的所有解锁条件描述
   */
  getUnlockDescription(skill: Skill): string {
    if (!skill.unlockCondition) return '无需解锁';

    const condition = skill.unlockCondition;
    if (condition.startsWith('trust_') || condition.startsWith('favor_')) {
      const parts = condition.split('_');
      return `需要 ${parts[1]} 好感度 ${parts[2]}`;
    }
    if (condition.startsWith('level_')) {
      return `需要等级 ${condition.split('_')[1]}`;
    }
    return '特殊条件';
  },
};

// ==================== 类型 ====================

export interface UnlockContext {
  favors?: Record<string, number>;
  level?: number;
  flags?: string[];
}
