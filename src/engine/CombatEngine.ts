import type { Combatant, Element } from './types';

const ADVANTAGE_MAP: Record<Element, Element> = {
  sword: 'fist',
  fist: 'poison',
  poison: 'qi',
  qi: 'sword',
};

export const CombatEngine = {
  calculateDamage(params: {
    baseDamage: number;
    attackerQi: number;
    attackerMaxQi: number;
    elementMultiplier: number;
    isDefending: boolean;
    randomSeed: number;
  }): number {
    const qiMultiplier = params.attackerMaxQi > 0
      ? (params.attackerQi / params.attackerMaxQi) * 1.2
      : 0;
    const defenseMultiplier = params.isDefending ? 0.5 : 1.0;
    const randomFloat = 0.9 + params.randomSeed * 0.2;
    return Math.floor(
      params.baseDamage * params.elementMultiplier * qiMultiplier * defenseMultiplier * randomFloat,
    );
  },

  getElementMultiplier(attackerElement: Element, defenderElement: Element): number {
    if (ADVANTAGE_MAP[attackerElement] === defenderElement) return 1.3;
    if (ADVANTAGE_MAP[defenderElement] === attackerElement) return 0.7;
    return 1.0;
  },

  sortBySpeed(combatants: Combatant[]): Combatant[] {
    return [...combatants].sort((a, b) => b.speed - a.speed);
  },

  applyQiCost(combatant: Combatant, cost: number): Combatant {
    return { ...combatant, qi: Math.max(0, combatant.qi - cost) };
  },

  checkBattleEnd(player: Combatant, enemies: Combatant[]): { ended: boolean; victory: boolean } {
    if (player.health <= 0) return { ended: true, victory: false };
    if (enemies.every((e) => e.health <= 0)) return { ended: true, victory: true };
    return { ended: false, victory: false };
  },

  applyDamage(combatant: Combatant, damage: number): Combatant {
    return { ...combatant, health: Math.max(0, combatant.health - damage) };
  },

  processDefending(combatant: Combatant): Combatant {
    return { ...combatant, isDefending: true };
  },

  clearDefending(combatants: Combatant[]): Combatant[] {
    return combatants.map((c) => ({ ...c, isDefending: false }));
  },
};
