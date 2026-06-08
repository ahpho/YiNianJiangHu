import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useEventRunner, type ChoiceOption } from '../hooks/useEventRunner';
import { TIMESLOT_LABELS, type Timeslot } from '../../engine/types';

// ==================== Main GameScreen ====================

export function GameScreen() {
  const day = useGameStore((s) => s.currentDay);
  const timeslot = useGameStore((s) => s.currentTimeslot);
  const locationLabel = useGameStore((s) => s.currentLocationLabel());
  const progress = useGameStore((s) => s.progressPercent());
  const advanceTime = useGameStore((s) => s.advanceTime);

  const {
    currentEventState,
    currentDialogue,
    hasMoreDialogues,
    showChoices,
    isTyping,
    advanceDialogue,
    selectChoice,
  } = useEventRunner();

  // Time advance button label
  const nextTimeslot = getNextTimeslotLabel(timeslot);

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
          flexShrink: 0,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
          <button
            className="btn-seal"
            style={{ fontSize: 13, padding: '4px 14px' }}
            onClick={advanceTime}
          >
            → {nextTimeslot}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel - scene, dialogue, choices */}
        <div style={{ flex: 2, overflow: 'auto', padding: 24 }}>
          <div className="scroll-frame" style={{ minHeight: '100%' }}>
            {currentEventState ? (
              <EventPanel
                event={currentEventState}
                currentDialogue={currentDialogue}
                hasMoreDialogues={hasMoreDialogues}
                showChoices={showChoices}
                isTyping={isTyping}
                onAdvance={advanceDialogue}
                onSelectChoice={selectChoice}
              />
            ) : (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <p className="text-body" style={{ color: 'var(--ink-light)' }}>
                  江湖寂静，无事发生。
                </p>
                <p className="text-caption" style={{ marginTop: 8 }}>
                  点击「{nextTimeslot}」继续
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel - stats, favors, reputation */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24, borderLeft: '1px solid var(--paper-aged)' }}>
          <PlayerStatsPanel />
          <hr className="divider-ink" />
          <ReputationPanel />
        </div>
      </div>
    </div>
  );
}

// ==================== Event Panel ====================

interface EventPanelProps {
  event: { eventId: string; description: string; dialogues: Array<{ speaker: string; text: string }>; choices: ChoiceOption[]; scene: { background?: string; description: string } };
  currentDialogue: { speaker: string; text: string } | null;
  hasMoreDialogues: boolean;
  showChoices: boolean;
  isTyping: boolean;
  onAdvance: () => void;
  onSelectChoice: (choice: ChoiceOption) => void;
}

function EventPanel({ event, currentDialogue, hasMoreDialogues, showChoices, isTyping, onAdvance, onSelectChoice }: EventPanelProps) {
  // Scene description
  const [descRevealed, setDescRevealed] = useState(false);

  useEffect(() => {
    setDescRevealed(false);
    const timer = setTimeout(() => setDescRevealed(true), 300);
    return () => clearTimeout(timer);
  }, [event.eventId]);

  return (
    <div onClick={hasMoreDialogues && !showChoices ? onAdvance : undefined}
      style={{ cursor: hasMoreDialogues && !showChoices ? 'pointer' : 'default' }}
    >
      {/* Scene description */}
      {event.description && (
        <p className="text-body" style={{
          color: 'var(--ink-gray)',
          fontStyle: 'italic',
          marginBottom: 24,
          opacity: descRevealed ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}>
          {event.description}
        </p>
      )}

      {/* Dialogue area */}
      {currentDialogue && (
        <DialogueBubble
          speaker={currentDialogue.speaker}
          text={currentDialogue.text}
          isTyping={isTyping}
        />
      )}

      {/* Choices */}
      {showChoices && event.choices.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <hr className="divider-ink" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {event.choices.map((choice) => (
              <button
                key={choice.id}
                className="btn-seal"
                style={{
                  textAlign: 'left',
                  width: '100%',
                  padding: '12px 20px',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectChoice(choice);
                }}
              >
                {choice.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click hint */}
      {hasMoreDialogues && !showChoices && (
        <p className="text-caption" style={{ textAlign: 'center', marginTop: 24, color: 'var(--ink-light)' }}>
          点击任意处继续...
        </p>
      )}
    </div>
  );
}

// ==================== Dialogue Bubble ====================

function DialogueBubble({ speaker, text, isTyping }: { speaker: string; text: string; isTyping: boolean }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!isTyping) {
      setDisplayedText(text);
      return;
    }
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [text, isTyping]);

  const speakerName = SPEAKER_NAMES[speaker] ?? speaker;
  const speakerColor = SPEAKER_COLORS[speaker] ?? 'var(--ink-gray)';

  return (
    <div style={{ marginBottom: 16 }}>
      <span className="text-h3 font-title-cn" style={{ color: speakerColor, fontSize: 15 }}>
        {speakerName}
      </span>
      <p className="text-body" style={{ marginTop: 4, lineHeight: 1.8 }}>
        {displayedText}
        {isTyping && displayedText.length < text.length && (
          <span className="typewriter-cursor" />
        )}
      </p>
    </div>
  );
}

const SPEAKER_NAMES: Record<string, string> = {
  narrator: '',
  laowei: '老魏',
  suqingheng: '苏青衡',
  qingxuzhenren: '清虚真人',
  shentingyu: '沈听雨',
  luxiaoman: '陆小曼',
  xiaopodi: '小泼弟',
  ayiguli: '阿依古丽',
  baiyaoxian: '白药仙',
  liusuifeng: '柳随风',
  liwushuang: '厉无双',
  huochangqing: '霍长青',
  chubaiyi: '楚白衣',
};

const SPEAKER_COLORS: Record<string, string> = {
  narrator: 'var(--ink-light)',
  laowei: 'var(--gold-dark)',
  suqingheng: 'var(--faction-taixu)',
  qingxuzhenren: 'var(--faction-taixu)',
  shentingyu: 'var(--faction-tingyu)',
  luxiaoman: 'var(--cinnabar-light)',
  liwushuang: 'var(--faction-fentian)',
  chubaiyi: 'var(--ink-black)',
};

// ==================== Player Stats Panel ====================

function PlayerStatsPanel() {
  const stats = useGameStore((s) => s.playerStats);

  const bars = [
    { label: '气血', value: stats.health, max: stats.maxHealth, color: 'var(--cinnabar)' },
    { label: '内力', value: stats.qi, max: stats.maxQi, color: 'var(--info)' },
  ];

  return (
    <div>
      <h3 className="text-h3 font-title-cn" style={{ marginBottom: 12 }}>状态</h3>
      {bars.map(({ label, value, max, color }) => (
        <div key={label} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span className="text-body">{label}</span>
            <span className="text-stat">{value}/{max}</span>
          </div>
          <div className="favor-bar">
            <div className="favor-bar-fill" style={{ width: `${(value / max) * 100}%`, background: color }} />
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <span className="text-caption">攻 {stats.attack}</span>
        <span className="text-caption">防 {stats.defense}</span>
        <span className="text-caption">速 {stats.speed}</span>
        <span className="text-caption">Lv.{stats.level}</span>
      </div>
    </div>
  );
}

// ==================== Reputation Panel ====================

function ReputationPanel() {
  const rep = useGameStore((s) => s.factionReputation);

  const FACTIONS = [
    { id: 'taixu', name: '太虚剑宗', color: 'var(--faction-taixu)' },
    { id: 'tingyu', name: '听雨楼', color: 'var(--faction-tingyu)' },
    { id: 'tieqi', name: '铁骑门', color: 'var(--faction-tieqi)' },
    { id: 'yaowang', name: '药王谷', color: 'var(--faction-yaowang)' },
    { id: 'fentian', name: '焚天教', color: 'var(--faction-fentian)' },
  ];

  return (
    <div>
      <h3 className="text-h3 font-title-cn" style={{ marginBottom: 12 }}>门派声望</h3>
      {FACTIONS.map(({ id, name, color }) => {
        const value = rep[id as keyof typeof rep] ?? 0;
        return (
          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="text-caption" style={{ width: 56 }}>{name}</span>
            <div style={{ flex: 1, height: 6, background: 'var(--paper-aged)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, (value + 100) / 2))}%`,
                  height: '100%',
                  background: color,
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <span className="text-stat" style={{ fontSize: 12, width: 24, textAlign: 'right' }}>{value}</span>
          </div>
        );
      })}
    </div>
  );
}

// ==================== Helpers ====================

function getNextTimeslotLabel(current: Timeslot): string {
  const order: Timeslot[] = ['dawn', 'noon', 'dusk', 'night'];
  const next = order[(order.indexOf(current) + 1) % 4];
  return TIMESLOT_LABELS[next];
}
