import { useGameStore } from './store/gameStore';
import { TitleScreen } from './screens/TitleScreen';
import { GameScreen } from './screens/GameScreen';
import { CombatScreen } from './screens/CombatScreen';
import { RelationGraph } from './screens/RelationGraph';
import { EndingScreen } from './screens/EndingScreen';

const SCREEN_MAP = {
  title: TitleScreen,
  game: GameScreen,
  combat: CombatScreen,
  relation: RelationGraph,
  ending: EndingScreen,
} as const;

export function ScreenRouter() {
  const screen = useGameStore((s) => s.screen);
  const Screen = SCREEN_MAP[screen] ?? TitleScreen;
  return <Screen />;
}
