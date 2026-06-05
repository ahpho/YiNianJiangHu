import type { NPC_Favor, NPC_ID, FavorDim } from './types';

const ALL_NPCS: NPC_ID[] = [
  'suqingheng', 'qingxuzhenren', 'shentingyu', 'luxiaoman',
  'xiaopodi', 'ayiguli', 'baiyaoxian', 'liusuifeng',
  'liwushuang', 'huochangqing', 'chubaiyi', 'laowei',
];

const clamp = (v: number) => Math.max(0, Math.min(100, v));

export interface Ripple {
  dim: FavorDim;
  delta: number;
}

export const FavorEngine = {
  applyFavorChange(
    favors: Record<NPC_ID, NPC_Favor>,
    npcId: NPC_ID,
    changes: Partial<NPC_Favor>,
    ripple?: Ripple,
  ): Record<NPC_ID, NPC_Favor> {
    const prev = favors[npcId];
    const next = { ...prev };
    for (const dim of ['trust', 'intimacy', 'awe', 'fear'] as FavorDim[]) {
      if (changes[dim] !== undefined) {
        next[dim] = clamp(next[dim] + changes[dim]!);
      }
    }
    if (ripple) {
      next[ripple.dim] = clamp(next[ripple.dim] + ripple.delta);
    }
    return { ...favors, [npcId]: next };
  },

  getFavorThreshold(value: number): 'enemy' | 'cold' | 'normal' | 'friendly' | 'intimate' {
    if (value <= 20) return 'enemy';
    if (value <= 40) return 'cold';
    if (value <= 60) return 'normal';
    if (value <= 80) return 'friendly';
    return 'intimate';
  },

  getAllNpcs(): NPC_ID[] {
    return ALL_NPCS;
  },

  getTotalFavor(favor: NPC_Favor): number {
    return favor.trust + favor.intimacy + favor.awe + favor.fear;
  },

  getDominantDim(favor: NPC_Favor): FavorDim {
    const dims: [FavorDim, number][] = [
      ['trust', favor.trust],
      ['intimacy', favor.intimacy],
      ['awe', favor.awe],
      ['fear', favor.fear],
    ];
    dims.sort((a, b) => b[1] - a[1]);
    return dims[0][0];
  },
};
