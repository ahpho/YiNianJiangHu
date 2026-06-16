import { z } from 'zod';
import type { GameState, SaveData, NPC_ID, Faction_ID, Timeslot, Location, NPC_Favor } from './types';

// ==================== Zod Schema ====================

const SaveDataSchema = z.object({
  version: z.number().int().min(1),
  timestamp: z.number(),
  state: z.object({
    currentDay: z.number().int().min(1).max(30),
    currentTimeslot: z.enum(['dawn', 'noon', 'dusk', 'night']),
    currentLocation: z.enum(['zhongyuan', 'jiangnan', 'saibei', 'shuzhong', 'xiyu']),
    playerStats: z.object({
      health: z.number(),
      maxHealth: z.number(),
      qi: z.number(),
      maxQi: z.number(),
      attack: z.number(),
      defense: z.number(),
      speed: z.number(),
      level: z.number(),
    }),
    npcFavors: z.record(z.string(), z.object({
      trust: z.number(),
      intimacy: z.number(),
      awe: z.number(),
      fear: z.number(),
    })),
    factionReputation: z.record(z.string(), z.number()),
    learnedMartialArts: z.array(z.string()),
    equippedSkills: z.array(z.string()),
    flags: z.array(z.string()),
    endingsUnlocked: z.array(z.string()),
    unlockedArcs: z.array(z.string()),
  }),
});

// ==================== Constants ====================

const SAVE_KEY = 'yinian-jianghu-save';
const SAVE_VERSION = 1;

// ==================== SaveManager ====================

export const SaveManager = {
  /** Serialize GameState to SaveData (Set → array) */
  serialize(state: GameState): SaveData {
    return {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      state: {
        currentDay: state.currentDay,
        currentTimeslot: state.currentTimeslot,
        currentLocation: state.currentLocation,
        playerStats: { ...state.playerStats },
        npcFavors: state.npcFavors,
        factionReputation: { ...state.factionReputation },
        learnedMartialArts: [...state.learnedMartialArts],
        equippedSkills: [...state.equippedSkills],
        flags: [...state.flags],
        endingsUnlocked: [...state.endingsUnlocked],
        unlockedArcs: [...state.unlockedArcs],
      },
    };
  },

  /** Deserialize SaveData to GameState (array → Set) */
  deserialize(saveData: SaveData): GameState {
    return {
      currentDay: saveData.state.currentDay,
      currentTimeslot: saveData.state.currentTimeslot as Timeslot,
      currentLocation: saveData.state.currentLocation as Location,
      playerStats: { ...saveData.state.playerStats },
      npcFavors: saveData.state.npcFavors as Record<NPC_ID, NPC_Favor>,
      factionReputation: saveData.state.factionReputation as Record<Faction_ID, number>,
      learnedMartialArts: [...saveData.state.learnedMartialArts],
      equippedSkills: [...saveData.state.equippedSkills],
      flags: new Set(saveData.state.flags),
      endingsUnlocked: [...saveData.state.endingsUnlocked],
      unlockedArcs: new Set(saveData.state.unlockedArcs),
    };
  },

  /** Save to localStorage */
  save(state: GameState): boolean {
    try {
      const saveData = this.serialize(state);
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch {
      return false;
    }
  },

  /** Load from localStorage. Returns null if no save or invalid. */
  load(): GameState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const result = SaveDataSchema.safeParse(parsed);
      if (!result.success) return null;
      return this.deserialize(result.data as SaveData);
    } catch {
      return null;
    }
  },

  /** Check if a save exists */
  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  },

  /** Delete save */
  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  },

  /** Get save metadata without full load */
  getSaveInfo(): { day: number; timeslot: string; timestamp: number } | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.state || !parsed?.timestamp) return null;
      return {
        day: parsed.state.currentDay,
        timeslot: parsed.state.currentTimeslot,
        timestamp: parsed.timestamp,
      };
    } catch {
      return null;
    }
  },
};
