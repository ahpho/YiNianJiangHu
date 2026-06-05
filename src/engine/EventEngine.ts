import type { GameState } from './types';
import type { Condition } from '../utils/condition-parser';
import { ConditionParser } from '../utils/condition-parser';

interface Triggerable {
  id: string;
  type: string;
  priority: number;
  trigger: { conditions: Condition[] };
}

export const EventEngine = {
  filterByConditions<T extends Triggerable>(state: GameState, events: T[]): T[] {
    return events.filter((event) =>
      event.trigger.conditions.every((c) => ConditionParser.evaluate(state, c)),
    );
  },

  sortByPriority<T extends Triggerable>(events: T[]): T[] {
    return [...events].sort((a, b) => b.priority - a.priority);
  },

  getTriggeredEvents<T extends Triggerable>(state: GameState, events: T[]): T[] {
    const filtered = this.filterByConditions(state, events);
    return this.sortByPriority(filtered);
  },

  getTopEvent<T extends Triggerable>(state: GameState, events: T[]): T | null {
    const triggered = this.getTriggeredEvents(state, events);
    return triggered.length > 0 ? triggered[0] : null;
  },
};
