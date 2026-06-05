// ==================== 枚举 / 联合类型 ====================

export type Timeslot = 'dawn' | 'noon' | 'dusk' | 'night';

export const TIMESLOTS: readonly Timeslot[] = ['dawn', 'noon', 'dusk', 'night'];

export const TIMESLOT_LABELS: Record<Timeslot, string> = {
  dawn: '卯时',
  noon: '午时',
  dusk: '酉时',
  night: '子时',
};

export type Location = 'zhongyuan' | 'jiangnan' | 'saibei' | 'shuzhong' | 'xiyu';

export const LOCATIONS: readonly Location[] = ['zhongyuan', 'jiangnan', 'saibei', 'shuzhong', 'xiyu'];

export type NPC_ID =
  | 'suqingheng'
  | 'qingxuzhenren'
  | 'shentingyu'
  | 'luxiaoman'
  | 'xiaopodi'
  | 'ayiguli'
  | 'baiyaoxian'
  | 'liusuifeng'
  | 'liwushuang'
  | 'huochangqing'
  | 'chubaiyi'
  | 'laowei';

export type Faction_ID = 'taixu' | 'tingyu' | 'tieqi' | 'yaowang' | 'fentian';

export type FavorDim = 'trust' | 'intimacy' | 'awe' | 'fear';

export type Element = 'sword' | 'qi' | 'fist' | 'poison';

export type CombatType = 'story' | 'encounter' | 'npc_challenge' | 'final';

// ==================== 数据结构 ====================

export interface NPC_Favor {
  trust: number;
  intimacy: number;
  awe: number;
  fear: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  qi: number;
  maxQi: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
}

export interface MartialArt {
  id: string;
  name: string;
  faction: Faction_ID;
  element: Element;
  type: 'attack' | 'defense' | 'support' | 'ultimate';
  target: 'single' | 'all';
  baseDamage: number;
  qiCost: number;
  effect: string | null;
  unlockCondition: string | null;
}

export interface Combatant {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  qi: number;
  maxQi: number;
  attack: number;
  defense: number;
  speed: number;
  moves: string[];
  isDefending: boolean;
  buffs: Buff[];
  debuffs: Debuff[];
}

export interface Buff {
  type: string;
  remainingTurns: number;
  value: number;
}

export interface Debuff {
  type: string;
  remainingTurns: number;
  value: number;
}

export interface GameState {
  currentDay: number;
  currentTimeslot: Timeslot;
  currentLocation: Location;
  playerStats: PlayerStats;
  npcFavors: Record<NPC_ID, NPC_Favor>;
  factionReputation: Record<Faction_ID, number>;
  learnedMartialArts: string[];
  equippedSkills: string[];
  flags: Set<string>;
  endingsUnlocked: string[];
  unlockedArcs: Set<string>;
}

// ==================== 距离矩阵 ====================

export type DistanceMatrix = Record<Location, Record<Location, number>>;

// ==================== 存档 ====================

export interface SaveData {
  version: number;
  timestamp: number;
  state: Omit<GameState, 'flags' | 'unlockedArcs'> & {
    flags: string[];
    unlockedArcs: string[];
  };
}
