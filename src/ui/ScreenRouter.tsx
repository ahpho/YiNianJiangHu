import { create } from 'zustand';
import { TitleScreen } from './screens/TitleScreen';
import { GameScreen } from './screens/GameScreen';
import { CombatScreen } from './screens/CombatScreen';
import { RelationGraph } from './screens/RelationGraph';
import { EndingScreen } from './screens/EndingScreen';

export type ScreenId = 'title' | 'game' | 'combat' | 'graph' | 'ending';

interface ScreenStore {
  screen: ScreenId;
  navigate: (screen: ScreenId) => void;
}

export const useScreenStore = create<ScreenStore>((set) => ({
  screen: 'title',
  navigate: (screen) => set({ screen }),
}));

const SCREEN_MAP: Record<ScreenId, React.FC> = {
  title: TitleScreen,
  game: GameScreen,
  combat: CombatScreen,
  graph: RelationGraph,
  ending: EndingScreen,
};

export function ScreenRouter() {
  const screen = useScreenStore((s) => s.screen);
  const Screen = SCREEN_MAP[screen];
  return <Screen />;
}
