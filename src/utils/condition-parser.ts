import type { GameState, NPC_ID, FavorDim, Faction_ID } from '../engine/types';

export type Condition =
  | { type: 'timeslot'; value: string }
  | { type: 'location'; value: string }
  | { type: 'day'; op: '>' | '>=' | '==' | '<=' | '<'; value: number }
  | { type: 'flag'; key: string; present?: boolean }
  | { type: 'favor'; npc: NPC_ID; dim: FavorDim; op: '>=' | '<=' | '>' | '<'; value: number }
  | { type: 'reputation'; faction: Faction_ID; op: '>=' | '<='; value: number }
  | { type: 'and'; conditions: Condition[] }
  | { type: 'or'; conditions: Condition[] }
  | { type: 'not'; condition: Condition };

function evaluateOp(left: number, op: string, right: number): boolean {
  switch (op) {
    case '>':  return left > right;
    case '>=': return left >= right;
    case '==': return left === right;
    case '<=': return left <= right;
    case '<':  return left < right;
    default:   return false;
  }
}

export const ConditionParser = {
  evaluate(state: GameState, condition: Condition): boolean {
    switch (condition.type) {
      case 'timeslot':
        return state.currentTimeslot === condition.value;

      case 'location':
        return state.currentLocation === condition.value;

      case 'day':
        return evaluateOp(state.currentDay, condition.op, condition.value);

      case 'flag': {
        const present = condition.present ?? true;
        const has = state.flags.has(condition.key);
        return present ? has : !has;
      }

      case 'favor': {
        const favor = state.npcFavors[condition.npc];
        if (!favor) return false;
        return evaluateOp(favor[condition.dim], condition.op, condition.value);
      }

      case 'reputation': {
        const rep = state.factionReputation[condition.faction];
        if (rep === undefined) return false;
        return evaluateOp(rep, condition.op, condition.value);
      }

      case 'and':
        return condition.conditions.every((c) => this.evaluate(state, c));

      case 'or':
        return condition.conditions.some((c) => this.evaluate(state, c));

      case 'not':
        return !this.evaluate(state, condition.condition);

      default:
        return false;
    }
  },
};
