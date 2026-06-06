import { NpcDataSchema, MartialArtDataSchema, FactionDataSchema, EndingDataSchema, RandomEventSchema } from '../engine/schemas';
import { validateAll } from './validate';
import npcsJson from './npcs.json';
import martialArtsJson from './martial-arts.json';
import factionsJson from './factions.json';
import endingsJson from './endings.json';
import randomEventsJson from './random-events.json';
import type { NPC_ID, Faction_ID } from '../engine/types';

const eventModules = import.meta.glob('./events/day*.json', { eager: true });

export const EVENTS: Record<number, unknown> = {};
for (const [path, mod] of Object.entries(eventModules)) {
  const match = path.match(/day(\d+)\.json$/);
  if (match) EVENTS[parseInt(match[1])] = (mod as { default: unknown }).default;
}

export const NPCS = npcsJson as Record<NPC_ID, (typeof npcsJson)[NPC_ID]>;
export const MARTIAL_ARTS = martialArtsJson;
export const FACTIONS = factionsJson as Record<Faction_ID, (typeof factionsJson)[Faction_ID]>;
export const ENDINGS = endingsJson;
export const RANDOM_EVENTS = randomEventsJson;

export function validateAllData(): void {
  const npcEntries = Object.entries(NPCS);
  const npcResult = validateAll(NpcDataSchema, npcEntries.map(([k, v]) => ({ filename: `npcs.json:${k}`, data: v })));
  if (!npcResult.success) throw new Error(`NPC validation failed:\n${npcResult.errors.join('\n')}`);

  const maEntries = Object.entries(MARTIAL_ARTS);
  const maResult = validateAll(MartialArtDataSchema, maEntries.map(([k, v]) => ({ filename: `martial-arts.json:${k}`, data: v })));
  if (!maResult.success) throw new Error(`Martial arts validation failed:\n${maResult.errors.join('\n')}`);

  const factionEntries = Object.entries(FACTIONS);
  const factionResult = validateAll(FactionDataSchema, factionEntries.map(([k, v]) => ({ filename: `factions.json:${k}`, data: v })));
  if (!factionResult.success) throw new Error(`Faction validation failed:\n${factionResult.errors.join('\n')}`);

  const endingResult = validateAll(EndingDataSchema, ENDINGS.map((e) => ({ filename: `endings.json:${e.id}`, data: e })));
  if (!endingResult.success) throw new Error(`Ending validation failed:\n${endingResult.errors.join('\n')}`);

  const randomResult = validateAll(RandomEventSchema, RANDOM_EVENTS.map((e) => ({ filename: `random-events.json:${e.id}`, data: e })));
  if (!randomResult.success) throw new Error(`Random events validation failed:\n${randomResult.errors.join('\n')}`);
}

export function getDayEvents(day: number): unknown | undefined {
  return EVENTS[day];
}
