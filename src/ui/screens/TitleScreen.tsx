import { useGameStore } from '../store/gameStore';

export function TitleScreen() {
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div style={{ padding: '48px', textAlign: 'center' }}>
      <h1 className="font-title-cn text-h1" style={{ color: 'var(--gold)' }}>
        一念江湖
      </h1>
      <p className="text-body" style={{ color: 'var(--ink-light)', marginTop: 16 }}>
        一念成佛，一念成魔。
      </p>
      <button
        className="btn-seal"
        style={{ marginTop: 32 }}
        onClick={() => setScreen('game')}
      >
        踏入江湖
      </button>
    </div>
  );
}
