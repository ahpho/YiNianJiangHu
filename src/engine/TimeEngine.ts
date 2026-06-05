import type { Timeslot, GameState, Location } from './types';

const TIMESLOT_ORDER: readonly Timeslot[] = ['dawn', 'noon', 'dusk', 'night'];

const DISTANCE_MATRIX: Record<Location, Record<Location, number>> = {
  zhongyuan: { zhongyuan: 0, jiangnan: 2, saibei: 2, shuzhong: 3, xiyu: 3 },
  jiangnan:  { zhongyuan: 2, jiangnan: 0, saibei: 3, shuzhong: 2, xiyu: 3 },
  saibei:    { zhongyuan: 2, jiangnan: 3, saibei: 0, shuzhong: 3, xiyu: 2 },
  shuzhong:  { zhongyuan: 3, jiangnan: 2, saibei: 3, shuzhong: 0, xiyu: 3 },
  xiyu:      { zhongyuan: 3, jiangnan: 3, saibei: 2, shuzhong: 3, xiyu: 0 },
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const TimeEngine = {
  getNextTimeslot(current: Timeslot): Timeslot {
    const idx = TIMESLOT_ORDER.indexOf(current);
    return TIMESLOT_ORDER[(idx + 1) % 4];
  },

  isDayBoundary(current: Timeslot): boolean {
    return current === 'night';
  },

  advanceTimeslot(state: GameState): GameState {
    const next = this.getNextTimeslot(state.currentTimeslot);
    const dayAdvance = next === 'dawn' && state.currentTimeslot === 'night' ? 1 : 0;
    const newDay = Math.min(30, state.currentDay + dayAdvance);
    return {
      ...state,
      currentDay: newDay,
      currentTimeslot: next,
      playerStats: { ...state.playerStats },
    };
  },

  dawnRecovery(state: GameState): GameState {
    const qi = clamp(state.playerStats.qi + 20, 0, state.playerStats.maxQi);
    const health = clamp(state.playerStats.health + 10, 0, state.playerStats.maxHealth);
    return {
      ...state,
      playerStats: { ...state.playerStats, qi, health },
    };
  },

  travel(state: GameState, destination: Location): GameState {
    const cost = DISTANCE_MATRIX[state.currentLocation][destination];
    return {
      ...state,
      currentLocation: destination,
      playerStats: {
        ...state.playerStats,
        qi: clamp(state.playerStats.qi - cost * 10, 0, state.playerStats.maxQi),
      },
    };
  },

  getTravelCost(from: Location, to: Location): number {
    return DISTANCE_MATRIX[from]?.[to] ?? 99;
  },

  isGameOver(state: GameState): boolean {
    return state.currentDay >= 30 && state.currentTimeslot === 'night';
  },

  getTimeslotIndex(timeslot: Timeslot): number {
    return TIMESLOT_ORDER.indexOf(timeslot);
  },

  getProgressPercent(state: GameState): number {
    const totalSlots = 30 * 4;
    const elapsed = (state.currentDay - 1) * 4 + this.getTimeslotIndex(state.currentTimeslot);
    return Math.round((elapsed / totalSlots) * 100);
  },
};
