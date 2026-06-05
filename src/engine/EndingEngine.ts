import type { GameState } from './types';

export const EndingEngine = {
  ENDING_PRIORITY: {
    yinian_chengfo: 1,
    xueran_changkong: 2,
    zouhuo_rumo: 3,
    yitong_jianghu: 4,
    chaoting_yingquan: 5,
    wulin_mengzhu: 6,
    guiyin_shanlin: 7,
  } as Record<string, number>,

  isMutualExclusion(a: string, b: string): boolean {
    if (a === b) return false;
    const pairs: [string, string][] = [
      ['yinian_chengfo', 'zouhuo_rumo'],
      ['yinian_chengfo', 'yitong_jianghu'],
      ['wulin_mengzhu', 'yitong_jianghu'],
      ['chaoting_yingquan', 'guiyin_shanlin'],
    ];
    return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  },

  evaluateEnding(
    state: GameState,
    endings: Array<{ id: string; mutuallyExclusive: string[] }>,
  ): string | null {
    const satisfied = endings.filter((e) => state.unlockedArcs.has(e.id));
    if (satisfied.length === 0) return null;

    satisfied.sort((a, b) => (this.ENDING_PRIORITY[a.id] ?? 99) - (this.ENDING_PRIORITY[b.id] ?? 99));

    for (const candidate of satisfied) {
      const hasConflict = satisfied.some(
        (other) =>
          other.id !== candidate.id &&
          this.isMutualExclusion(candidate.id, other.id) &&
          (this.ENDING_PRIORITY[other.id] ?? 99) < (this.ENDING_PRIORITY[candidate.id] ?? 99),
      );
      if (!hasConflict) return candidate.id;
    }

    return satisfied[0].id;
  },

  getPriority(endingId: string): number {
    return this.ENDING_PRIORITY[endingId] ?? 99;
  },

  getDefaultEnding(): string {
    return 'guiyin_shanlin';
  },
};
