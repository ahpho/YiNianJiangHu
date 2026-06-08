import { create } from 'zustand';
import type { GameState, NPC_ID, Faction_ID, Timeslot, Location, NPC_Favor, FavorDim } from '../../engine/types';
import { FavorEngine } from '../../engine/FavorEngine';
import { FlagEngine } from '../../engine/FlagEngine';
import { TimeEngine } from '../../engine/TimeEngine';
import { EndingEngine } from '../../engine/EndingEngine';

// ==================== Screen State ====================

interface ScreenState {
  screen: 'title' | 'game' | 'combat' | 'relation' | 'ending';
  /** ID of the ending being displayed */
  endingId: string | null;
}

// ==================== Actions ====================

interface GameActions {
  // Navigation
  setScreen: (screen: ScreenState['screen'], endingId?: string | null) => void;

  // Time
  advanceTime: () => void;

  // Location
  changeLocation: (location: Location) => void;

  // Flags
  setFlag: (key: string) => void;
  setFlags: (keys: string[]) => void;

  // Favor
  changeFavor: (npcId: NPC_ID, dim: FavorDim, delta: number, ripple?: { dim: FavorDim; delta: number }) => void;
  changeFavorBatch: (npcId: NPC_ID, changes: Partial<Record<FavorDim, number>>, ripple?: { dim: FavorDim; delta: number }) => void;

  // Reputation
  changeReputation: (factionId: Faction_ID, delta: number) => void;

  // Martial arts
  learnMartialArt: (artId: string) => void;
  equipSkill: (artId: string) => void;
  unequipSkill: (artId: string) => void;

  // Player stats
  updatePlayerStats: (partial: Partial<GameState['playerStats']>) => void;

  // Endings
  unlockEnding: (endingId: string) => void;
  evaluateAndUnlockEnding: (endings: Array<{ id: string; mutuallyExclusive: string[] }>) => void;

  // Reset
  resetGame: () => void;

  // Init
  initState: (state: GameState) => void;
}

// ==================== Computed Getters ====================

interface GameComputed {
  currentNPCFavor: (npcId: NPC_ID) => NPC_Favor;
  totalNPCFavor: (npcId: NPC_ID) => number;
  dominantDim: (npcId: NPC_ID) => FavorDim;
  hasFlag: (key: string) => boolean;
  currentTimeslotLabel: () => string;
  currentLocationLabel: () => string;
  progressPercent: () => number;
}

// ==================== Combined Store Type ====================

type GameStore = ScreenState & GameState & GameActions & GameComputed;

// ==================== Initial Data ====================

const INITIAL_PLAYER_STATS = {
  health: 100,
  maxHealth: 100,
  qi: 60,
  maxQi: 60,
  attack: 12,
  defense: 8,
  speed: 10,
  level: 1,
};

function createInitialFavors(): Record<NPC_ID, NPC_Favor> {
  return {
    suqingheng:     { trust: 50, intimacy: 30, awe: 20, fear: 5 },
    qingxuzhenren:  { trust: 40, intimacy: 20, awe: 35, fear: 10 },
    shentingyu:     { trust: 30, intimacy: 15, awe: 50, fear: 30 },
    luxiaoman:      { trust: 25, intimacy: 40, awe: 15, fear: 10 },
    xiaopodi:       { trust: 20, intimacy: 25, awe: 10, fear: 15 },
    ayiguli:        { trust: 15, intimacy: 10, awe: 20, fear: 25 },
    baiyaoxian:     { trust: 35, intimacy: 30, awe: 15, fear: 20 },
    liusuifeng:     { trust: 45, intimacy: 20, awe: 25, fear: 5 },
    liwushuang:     { trust: 10, intimacy: 15, awe: 60, fear: 50 },
    huochangqing:   { trust: 30, intimacy: 25, awe: 30, fear: 15 },
    chubaiyi:       { trust: 40, intimacy: 35, awe: 10, fear: 5 },
    laowei:         { trust: 20, intimacy: 10, awe: 30, fear: 20 },
  };
}

function createInitialFactionRep(): Record<Faction_ID, number> {
  return { taixu: 0, tingyu: 0, tieqi: 0, yaowang: 0, fentian: 0 };
}

function createFreshGameState(): GameState {
  return {
    currentDay: 1,
    currentTimeslot: 'dawn',
    currentLocation: 'zhongyuan',
    playerStats: { ...INITIAL_PLAYER_STATS },
    npcFavors: createInitialFavors(),
    factionReputation: createInitialFactionRep(),
    learnedMartialArts: [],
    equippedSkills: [],
    flags: new Set<string>(),
    endingsUnlocked: [],
    unlockedArcs: new Set<string>(),
  };
}

// ==================== Timeslot & Location Labels ====================

const TIMESLOT_LABELS: Record<Timeslot, string> = {
  dawn: '卯时',
  noon: '午时',
  dusk: '酉时',
  night: '子时',
};

const LOCATION_LABELS: Record<Location, string> = {
  zhongyuan: '中原',
  jiangnan: '江南',
  saibei: '塞北',
  shuzhong: '蜀中',
  xiyu: '西域',
};

// ==================== Store ====================

export const useGameStore = create<GameStore>()((set, get) => ({
  // --- Screen state ---
  screen: 'title' as ScreenState['screen'],
  endingId: null as string | null,

  // --- Game state (spread from initial) ---
  ...createFreshGameState(),

  // --- Screen actions ---
  setScreen: (screen, endingId = null) => set({ screen, endingId }),

  // --- Time actions ---
  advanceTime: () => set((state) => {
    // Build a GameState snapshot for the engine
    const engineState: GameState = {
      currentDay: state.currentDay,
      currentTimeslot: state.currentTimeslot,
      currentLocation: state.currentLocation,
      playerStats: { ...state.playerStats },
      npcFavors: state.npcFavors,
      factionReputation: state.factionReputation,
      learnedMartialArts: state.learnedMartialArts,
      equippedSkills: state.equippedSkills,
      flags: state.flags,
      endingsUnlocked: state.endingsUnlocked,
      unlockedArcs: state.unlockedArcs,
    };

    const next = TimeEngine.advanceTimeslot(engineState);

    // Apply dawn recovery if we crossed into a new day
    let finalStats = next.playerStats;
    if (next.currentTimeslot === 'dawn' && state.currentTimeslot === 'night') {
      const recoveryState = TimeEngine.dawnRecovery(next);
      finalStats = recoveryState.playerStats;
    }

    return {
      currentTimeslot: next.currentTimeslot,
      currentDay: next.currentDay,
      playerStats: finalStats,
    };
  }),

  // --- Location actions ---
  changeLocation: (location) => set({ currentLocation: location }),

  // --- Flag actions ---
  setFlag: (key) => set((state) => ({
    flags: FlagEngine.setFlag(state.flags, key),
  })),

  setFlags: (keys) => set((state) => ({
    flags: FlagEngine.setFlags(state.flags, keys),
  })),

  // --- Favor actions ---
  changeFavor: (npcId, dim, delta, ripple) => set((state) => ({
    npcFavors: FavorEngine.applyFavorChange(
      state.npcFavors,
      npcId,
      { [dim]: delta } as Partial<NPC_Favor>,
      ripple,
    ),
  })),

  changeFavorBatch: (npcId, changes, ripple) => set((state) => ({
    npcFavors: FavorEngine.applyFavorChange(
      state.npcFavors,
      npcId,
      changes as Partial<NPC_Favor>,
      ripple,
    ),
  })),

  // --- Reputation actions ---
  changeReputation: (factionId, delta) => set((state) => ({
    factionReputation: {
      ...state.factionReputation,
      [factionId]: (state.factionReputation[factionId] ?? 0) + delta,
    },
  })),

  // --- Martial arts actions ---
  learnMartialArt: (artId) => set((state) => ({
    learnedMartialArts: state.learnedMartialArts.includes(artId)
      ? state.learnedMartialArts
      : [...state.learnedMartialArts, artId],
  })),

  equipSkill: (artId) => set((state) => ({
    equippedSkills:
      state.equippedSkills.length < 4 && !state.equippedSkills.includes(artId)
        ? [...state.equippedSkills, artId]
        : state.equippedSkills,
  })),

  unequipSkill: (artId) => set((state) => ({
    equippedSkills: state.equippedSkills.filter((id) => id !== artId),
  })),

  // --- Player stats ---
  updatePlayerStats: (partial) => set((state) => ({
    playerStats: { ...state.playerStats, ...partial },
  })),

  // --- Ending actions ---
  unlockEnding: (endingId) => set((state) => ({
    endingsUnlocked: state.endingsUnlocked.includes(endingId)
      ? state.endingsUnlocked
      : [...state.endingsUnlocked, endingId],
    unlockedArcs: new Set([...state.unlockedArcs, endingId]),
  })),

  evaluateAndUnlockEnding: (endings) => set((state) => {
    const engineState: GameState = {
      currentDay: state.currentDay,
      currentTimeslot: state.currentTimeslot,
      currentLocation: state.currentLocation,
      playerStats: state.playerStats,
      npcFavors: state.npcFavors,
      factionReputation: state.factionReputation,
      learnedMartialArts: state.learnedMartialArts,
      equippedSkills: state.equippedSkills,
      flags: state.flags,
      endingsUnlocked: state.endingsUnlocked,
      unlockedArcs: state.unlockedArcs,
    };
    const result = EndingEngine.evaluateEnding(engineState, endings);
    if (result && !state.endingsUnlocked.includes(result)) {
      return {
        endingsUnlocked: [...state.endingsUnlocked, result],
        unlockedArcs: new Set([...state.unlockedArcs, result]),
      };
    }
    return {};
  }),

  // --- Reset ---
  resetGame: () => {
    const fresh = createFreshGameState();
    set({
      screen: 'title' as ScreenState['screen'],
      endingId: null,
      ...fresh,
    });
  },

  // --- Init from save data (Phase 5) ---
  initState: (state) => set({
    ...state,
    flags: new Set(state.flags),
    unlockedArcs: new Set(state.unlockedArcs),
  }),

  // ==================== Computed Getters ====================

  currentNPCFavor: (npcId) => {
    const state = get();
    return state.npcFavors[npcId] ?? { trust: 0, intimacy: 0, awe: 0, fear: 0 };
  },

  totalNPCFavor: (npcId) => {
    const state = get();
    const favor = state.npcFavors[npcId] ?? { trust: 0, intimacy: 0, awe: 0, fear: 0 };
    return FavorEngine.getTotalFavor(favor);
  },

  dominantDim: (npcId) => {
    const state = get();
    const favor = state.npcFavors[npcId] ?? { trust: 0, intimacy: 0, awe: 0, fear: 0 };
    return FavorEngine.getDominantDim(favor);
  },

  hasFlag: (key) => {
    const state = get();
    return FlagEngine.hasFlag(state.flags, key);
  },

  currentTimeslotLabel: () => {
    const state = get();
    return TIMESLOT_LABELS[state.currentTimeslot];
  },

  currentLocationLabel: () => {
    const state = get();
    return LOCATION_LABELS[state.currentLocation];
  },

  progressPercent: () => {
    const state = get();
    return TimeEngine.getProgressPercent(state);
  },
}));
