import type { Combatant, Element } from './types';

const ADVANTAGE_MAP: Record<Element, Element> = {
  sword: 'fist',
  fist: 'poison',
  poison: 'qi',
  qi: 'sword',
};

// ==================== 类型定义 ====================

/** 战斗行动类型 */
export interface BattleAction {
  type: 'attack' | 'defend' | 'skill' | 'flee';
  skillId?: string;
  targetIndex?: number;
}

/** 战斗状态 */
export interface BattleState {
  turn: number;
  player: Combatant;
  enemies: Combatant[];
  phase: 'start' | 'playerTurn' | 'enemyTurn' | 'end';
  log: string[];
  isPlayerTurn: boolean;
}

/** 战斗结果 */
export interface BattleResult {
  victory: boolean;
  turns: number;
  log: string[];
  player: Combatant;
  enemies: Combatant[];
}

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

  // ==================== 执行战斗行动 ====================

  /**
   * 执行单个战斗行动
   * @param actor 行动者
   * @param action 行动类型
   * @param targets 目标列表
   * @returns 行动结果：伤害值、日志、更新后的行动者和目标
   */
  executeAction(
    actor: Combatant,
    action: BattleAction,
    targets: Combatant[],
  ): { damage: number; log: string[]; actor: Combatant; targets: Combatant[]; fled?: boolean } {
    const log: string[] = [];
    let updatedActor = { ...actor };
    let updatedTargets = targets.map((t) => ({ ...t }));

    switch (action.type) {
      case 'attack': {
        // 找到第一个存活的目标
        const targetIdx = updatedTargets.findIndex((t) => t.health > 0);
        if (targetIdx === -1) {
          log.push(`${actor.name} 没有可攻击的目标`);
          return { damage: 0, log, actor: updatedActor, targets: updatedTargets };
        }
        const target = updatedTargets[targetIdx];
        const damage = this.calculateDamage({
          baseDamage: actor.attack,
          attackerQi: actor.qi,
          attackerMaxQi: actor.maxQi,
          elementMultiplier: 1.0,
          isDefending: false,
          randomSeed: Math.random(),
        });
        updatedTargets[targetIdx] = this.applyDamage(target, damage);
        log.push(`${actor.name} 攻击 ${target.name}，造成 ${damage} 点伤害`);
        break;
      }
      case 'defend': {
        updatedActor = this.processDefending(actor);
        log.push(`${actor.name} 进入防御姿态`);
        break;
      }
      case 'skill': {
        const skillQiCost = 20;
        if (actor.qi < skillQiCost) {
          // 内力不足，降级为普通攻击
          log.push(`${actor.name} 内力不足，无法使用技能`);
          const targetIdx = updatedTargets.findIndex((t) => t.health > 0);
          if (targetIdx !== -1) {
            const target = updatedTargets[targetIdx];
            const damage = this.calculateDamage({
              baseDamage: actor.attack,
              attackerQi: actor.qi,
              attackerMaxQi: actor.maxQi,
              elementMultiplier: 1.0,
              isDefending: false,
              randomSeed: Math.random(),
            });
            updatedTargets[targetIdx] = this.applyDamage(target, damage);
            log.push(`${actor.name} 改为普攻 ${target.name}，造成 ${damage} 点伤害`);
          }
        } else {
          // 消耗内力，使用技能（伤害×1.5）
          updatedActor = this.applyQiCost(actor, skillQiCost);
          const targetIdx = updatedTargets.findIndex((t) => t.health > 0);
          if (targetIdx !== -1) {
            const target = updatedTargets[targetIdx];
            const damage = this.calculateDamage({
              baseDamage: Math.floor(actor.attack * 1.5),
              attackerQi: updatedActor.qi,
              attackerMaxQi: updatedActor.maxQi,
              elementMultiplier: 1.0,
              isDefending: false,
              randomSeed: Math.random(),
            });
            updatedTargets[targetIdx] = this.applyDamage(target, damage);
            log.push(`${actor.name} 使用技能攻击 ${target.name}，造成 ${damage} 点伤害`);
          }
        }
        break;
      }
      case 'flee': {
        log.push(`${actor.name} 试图逃跑`);
        return { damage: 0, log, actor: updatedActor, targets: updatedTargets, fled: true };
      }
    }

    return { damage: 0, log, actor: updatedActor, targets: updatedTargets };
  },

  // ==================== 回合制战斗流程 ====================

  /**
   * 运行完整的回合制战斗
   * @param player 玩家角色
   * @param enemies 敌人列表
   * @param options 战斗选项
   * @returns 战斗结果
   */
  runBattle(
    player: Combatant,
    enemies: Combatant[],
    options?: {
      onTurnStart?: (state: BattleState) => void;
      onTurnEnd?: (state: BattleState) => void;
      onBattleEnd?: (result: BattleResult) => void;
      maxTurns?: number;
    },
  ): BattleResult {
    const maxTurns = options?.maxTurns ?? 20;
    const log: string[] = [];
    let currentPlayer = { ...player };
    let currentEnemies = enemies.map((e) => ({ ...e }));
    let turn = 0;

    log.push('战斗开始！');

    // 回合循环
    while (turn < maxTurns) {
      turn++;

      // 回合开始：清除所有防御状态
      currentPlayer = this.clearDefending([currentPlayer])[0];
      currentEnemies = this.clearDefending(currentEnemies);

      // 触发回合开始回调
      const battleState: BattleState = {
        turn,
        player: currentPlayer,
        enemies: currentEnemies,
        phase: 'start',
        log,
        isPlayerTurn: false,
      };
      options?.onTurnStart?.(battleState);

      // 玩家回合
      battleState.phase = 'playerTurn';
      battleState.isPlayerTurn = true;
      options?.onTurnStart?.(battleState);

      // 玩家默认执行普攻
      const playerResult = this.executeAction(currentPlayer, { type: 'attack' }, currentEnemies);
      currentPlayer = playerResult.actor;
      currentEnemies = playerResult.targets;
      log.push(...playerResult.log);

      // 检查战斗是否结束
      let battleEnd = this.checkBattleEnd(currentPlayer, currentEnemies);
      if (battleEnd.ended) {
        battleState.phase = 'end';
        options?.onTurnEnd?.(battleState);
        break;
      }

      // 敌人回合
      battleState.phase = 'enemyTurn';
      battleState.isPlayerTurn = false;
      options?.onTurnStart?.(battleState);

      for (let i = 0; i < currentEnemies.length; i++) {
        const enemy = currentEnemies[i];
        if (enemy.health <= 0) continue;

        // 敌人攻击玩家
        const enemyResult = this.executeAction(enemy, { type: 'attack' }, [currentPlayer]);
        currentEnemies[i] = enemyResult.actor;  // 更新敌人状态
        currentPlayer = enemyResult.targets[0];  // 更新玩家状态（受到伤害）
        log.push(...enemyResult.log);

        // 检查玩家是否死亡
        battleEnd = this.checkBattleEnd(currentPlayer, currentEnemies);
        if (battleEnd.ended) break;
      }

      // 回合结束
      battleState.phase = 'end';
      battleState.player = currentPlayer;
      battleState.enemies = currentEnemies;
      options?.onTurnEnd?.(battleState);

      if (battleEnd.ended) break;
    }

    // 战斗结束
    const finalBattleState: BattleState = {
      turn,
      player: currentPlayer,
      enemies: currentEnemies,
      phase: 'end',
      log,
      isPlayerTurn: false,
    };

    // 判断胜负
    const allEnemiesDead = currentEnemies.every((e) => e.health <= 0);
    const playerDead = currentPlayer.health <= 0;

    const result: BattleResult = {
      victory: allEnemiesDead && !playerDead,
      turns: turn,
      log,
      player: currentPlayer,
      enemies: currentEnemies,
    };

    options?.onBattleEnd?.(result);
    return result;
  },
};
