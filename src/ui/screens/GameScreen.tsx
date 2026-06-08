import { useGameStore } from '../store/gameStore';
import { TIMESLOT_LABELS } from '../../engine/types';

export function GameScreen() {
  const day = useGameStore((s) => s.currentDay);
  const timeslot = useGameStore((s) => s.currentTimeslot);
  const locationLabel = useGameStore((s) => s.currentLocationLabel());
  const progress = useGameStore((s) => s.progressPercent());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* TopBar */}
      <div
        className="scroll-frame"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 32px',
          borderRadius: 0,
        }}
      >
        <span className="text-h3 font-title-cn" style={{ color: 'var(--cinnabar)' }}>
          第{day}天
        </span>
        <span className="text-body" style={{ color: 'var(--ink-gray)' }}>
          {TIMESLOT_LABELS[timeslot]}
        </span>
        <span className="text-body" style={{ color: 'var(--ink-gray)' }}>
          {locationLabel}
        </span>
        <div style={{ width: 120 }}>
          <div className="favor-bar">
            <div
              className="favor-bar-fill"
              style={{ width: `${progress}%`, background: 'var(--gold)' }}
            />
          </div>
          <span className="text-caption" style={{ textAlign: 'right', display: 'block' }}>
            进度 {progress}%
          </span>
        </div>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel - scene, dialogue, choices */}
        <div style={{ flex: 2, overflow: 'auto', padding: 24 }}>
          <div className="scroll-frame" style={{ minHeight: '100%' }}>
            <p className="text-body" style={{ color: 'var(--ink-light)' }}>
              场景加载中...
            </p>
          </div>
        </div>

        {/* Right panel - stats, favors, reputation */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24, borderLeft: '1px solid var(--paper-aged)' }}>
          <PlayerStatsPanel />
          <hr className="divider-ink" />
          <FavorPanel />
          <hr className="divider-ink" />
          <ReputationPanel />
        </div>
      </div>
    </div>
  );
}

function PlayerStatsPanel() {
  const stats = useGameStore((s) => s.playerStats);

  const items = [
    { label: '气血', value: stats.health, max: stats.maxHealth, color: 'var(--cinnabar)' },
    { label: '内力', value: stats.qi, max: stats.maxQi, color: 'var(--info)' },
  ];

  return (
    <div>
      <h3 className="text-h3 font-title-cn" style={{ marginBottom: 12 }}>
        状态
      </h3>
      {items.map(({ label, value, max, color }) => (
        <div key={label} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span className="text-body">{label}</span>
            <span className="text-stat">{value}/{max}</span>
          </div>
          <div className="favor-bar">
            <div
              className="favor-bar-fill"
              style={{ width: `${(value / max) * 100}%`, background: color }}
            />
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <span className="text-caption">攻 {stats.attack}</span>
        <span className="text-caption">防 {stats.defense}</span>
        <span className="text-caption">速 {stats.speed}</span>
        <span className="text-caption">Lv.{stats.level}</span>
      </div>
    </div>
  );
}

function FavorPanel() {
  const npcFavors = useGameStore((s) => s.npcFavors);
  const entries = Object.entries(npcFavors) as Array<[string, { trust: number; intimacy: number; awe: number; fear: number }]>;

  const dims = [
    { key: 'trust', label: '信赖', color: 'var(--favor-trust)' },
    { key: 'intimacy', label: '亲密', color: 'var(--favor-intimacy)' },
    { key: 'awe', label: '敬畏', color: 'var(--favor-awe)' },
    { key: 'fear', label: '恐惧', color: 'var(--favor-fear)' },
  ] as const;

  return (
    <div>
      <h3 className="text-h3 font-title-cn" style={{ marginBottom: 12 }}>
        好感度
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {entries.map(([npcId, favor]) => {
          const total = favor.trust + favor.intimacy + favor.awe + favor.fear;
          return (
            <div
              key={npcId}
              className="scroll-frame"
              style={{ padding: 8, fontSize: 13, borderRadius: 4 }}
            >
              <div className="text-caption" style={{ marginBottom: 4 }}>
                {npcId}
              </div>
              {dims.map(({ key, label, color }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <span style={{ width: 24, fontSize: 11, color: 'var(--ink-light)' }}>{label}</span>
                  <div style={{ flex: 1, height: 4, background: 'var(--paper-aged)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${favor[key]}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
                  </div>
                  <span className="text-stat" style={{ fontSize: 10, width: 16, textAlign: 'right' }}>{favor[key]}</span>
                </div>
              ))}
              <div className="text-caption" style={{ textAlign: 'right', marginTop: 4 }}>
                总 {total}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReputationPanel() {
  const rep = useGameStore((s) => s.factionReputation);
  const entries = Object.entries(rep) as Array<[string, number]>;

  const factionNames: Record<string, string> = {
    taixu: '太虚剑宗', tingyu: '听雨楼', tieqi: '铁骑门',
    yaowang: '药王谷', fentian: '焚天教',
  };

  const factionColors: Record<string, string> = {
    taixu: 'var(--faction-taixu)', tingyu: 'var(--faction-tingyu)', tieqi: 'var(--faction-tieqi)',
    yaowang: 'var(--faction-yaowang)', fentian: 'var(--faction-fentian)',
  };

  return (
    <div>
      <h3 className="text-h3 font-title-cn" style={{ marginBottom: 12 }}>
        门派声望
      </h3>
      {entries.map(([factionId, value]) => (
        <div key={factionId} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span className="text-caption" style={{ width: 56 }}>{factionNames[factionId] ?? factionId}</span>
          <div style={{ flex: 1, height: 6, background: 'var(--paper-aged)', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, (value + 100) / 2))}%`,
                height: '100%',
                background: factionColors[factionId] ?? 'var(--ink-light)',
                transition: 'width 0.3s',
              }}
            />
          </div>
          <span className="text-stat" style={{ fontSize: 12, width: 24, textAlign: 'right' }}>{value}</span>
        </div>
      ))}
    </div>
  );
}
