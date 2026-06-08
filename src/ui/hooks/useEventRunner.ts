import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getDayEvents } from '../../data';
import { ConditionParser } from '../../utils/condition-parser';
import type { GameState, NPC_ID, Faction_ID, FavorDim } from '../../engine/types';

// ==================== Internal Types ====================

interface DialogueLine {
  speaker: string;
  text: string;
}

export interface ChoiceOption {
  id: string;
  text: string;
  effects: Array<{ type: string; key?: string; set?: any; faction?: string; delta?: number; npcId?: string; dim?: string }>;
  nextEvent: string | null;
}

interface EventState {
  eventId: string;
  description: string;
  dialogues: DialogueLine[];
  choices: ChoiceOption[];
  scene: { background?: string; description: string };
}

interface DayData {
  day: number;
  events: any[];
}

// ==================== Hook ====================

export function useEventRunner() {
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [currentEventState, setCurrentEventState] = useState<EventState | null>(null);
  const [pendingCombat, setPendingCombat] = useState<any>(null);

  const currentDay = useGameStore((s) => s.currentDay);
  const currentTimeslot = useGameStore((s) => s.currentTimeslot);
  const currentLocation = useGameStore((s) => s.currentLocation);
  const flags = useGameStore((s) => s.flags);
  const setFlag = useGameStore((s) => s.setFlag);
  const changeFavor = useGameStore((s) => s.changeFavor);
  const changeReputation = useGameStore((s) => s.changeReputation);
  const learnMartialArt = useGameStore((s) => s.learnMartialArt);
  const setScreen = useGameStore((s) => s.setScreen);

  // Build GameState snapshot for condition evaluation
  const gameStateSnapshot = useMemo<GameState>(() => ({
    currentDay,
    currentTimeslot,
    currentLocation,
    playerStats: useGameStore.getState().playerStats,
    npcFavors: useGameStore.getState().npcFavors,
    factionReputation: useGameStore.getState().factionReputation,
    learnedMartialArts: useGameStore.getState().learnedMartialArts,
    equippedSkills: useGameStore.getState().equippedSkills,
    flags,
    endingsUnlocked: useGameStore.getState().endingsUnlocked,
    unlockedArcs: useGameStore.getState().unlockedArcs,
  }), [currentDay, currentTimeslot, currentLocation, flags]);

  // Load and filter events for current day/timeslot
  const activeEvent = useMemo(() => {
    const dayData = getDayEvents(currentDay) as DayData | undefined;
    if (!dayData?.events) return null;

    const eligible = dayData.events.filter((e: any) => {
      const matchTimeslot = !e.trigger?.timeslot || e.trigger.timeslot === currentTimeslot;
      const matchLocation = !e.trigger?.location || e.trigger.location === currentLocation;
      const matchConditions = !e.trigger?.conditions?.length || e.trigger.conditions.every((c: any) => ConditionParser.evaluate(gameStateSnapshot, c));
      return matchTimeslot && matchLocation && matchConditions;
    });

    if (eligible.length === 0) return null;
    eligible.sort((a: any, b: any) => (b.priority ?? 0) - (a.priority ?? 0));
    return eligible[0];
  }, [currentDay, currentTimeslot, currentLocation, gameStateSnapshot]);

  // Start event when activeEvent changes
  useEffect(() => {
    if (!activeEvent) {
      setCurrentEventState(null);
      return;
    }

    // Handle combat events
    if (activeEvent.type === 'combat' && activeEvent.combat) {
      setPendingCombat(activeEvent.combat);
      setScreen('combat');
      return;
    }

    setCurrentEventState({
      eventId: activeEvent.id,
      description: activeEvent.scene?.description ?? '',
      dialogues: activeEvent.dialogues ?? [],
      choices: activeEvent.choices ?? [],
      scene: activeEvent.scene ?? { description: '' },
    });
    setDialogueIndex(0);
    setIsTyping(true);
  }, [activeEvent, setScreen]);

  const currentDialogue: DialogueLine | null = useMemo(() => {
    if (!currentEventState?.dialogues?.length) return null;
    return currentEventState.dialogues[dialogueIndex] ?? null;
  }, [currentEventState, dialogueIndex]);

  const hasMoreDialogues = currentEventState !== null && currentEventState.dialogues.length > 0 && dialogueIndex < currentEventState.dialogues.length;

  const showChoices = currentEventState !== null && (
    currentEventState.dialogues.length === 0 || dialogueIndex >= currentEventState.dialogues.length
  );

  const advanceDialogue = useCallback(() => {
    if (!currentEventState) return;
    if (isTyping) {
      setIsTyping(false);
      return;
    }
    if (dialogueIndex < currentEventState.dialogues.length - 1) {
      setDialogueIndex((i) => i + 1);
      setIsTyping(true);
    }
  }, [currentEventState, dialogueIndex, isTyping]);

  const applyEffects = useCallback((effects: ChoiceOption['effects']) => {
    for (const effect of effects) {
      switch (effect.type) {
        case 'flag':
          if (effect.key) setFlag(effect.key);
          break;
        case 'favor':
          if (effect.npcId && effect.dim) {
            changeFavor(effect.npcId as NPC_ID, effect.dim as FavorDim, effect.delta ?? 0);
          }
          break;
        case 'reputation':
          if (effect.faction) {
            changeReputation(effect.faction as Faction_ID, effect.delta ?? 0);
          }
          break;
        case 'martial_art':
          if (effect.key) learnMartialArt(effect.key);
          break;
      }
    }
  }, [setFlag, changeFavor, changeReputation, learnMartialArt]);

  const selectChoice = useCallback((choice: ChoiceOption) => {
    applyEffects(choice.effects);
    if (choice.nextEvent) {
      // TODO: load nextEvent by ID (future enhancement)
    }
    setCurrentEventState(null);
    setDialogueIndex(0);
  }, [applyEffects]);

  const skipDialogue = useCallback(() => {
    if (!currentEventState) return;
    setDialogueIndex(currentEventState.dialogues.length);
    setIsTyping(false);
  }, [currentEventState]);

  return {
    currentEventState,
    currentDialogue,
    hasMoreDialogues,
    showChoices,
    isTyping,
    advanceDialogue,
    selectChoice,
    skipDialogue,
    pendingCombat,
  };
}
