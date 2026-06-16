import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { CombatEngine } from '../../engine/CombatEngine';
import { SKILL_LIBRARY } from '../../engine/SkillSystem';
import type { Combatant, BattleAction } from '../../engine/types';

interface CombatLogEntry {
  id: number;
  text: string;
  type: 'info' | 'damage' | 'heal' | 'system';
}

export function CombatScreen() {
  const playerStats = useGameStore((s) => s.playerStats);
  const equippedSkills = useGameStore((s) => s.equippedSkills);
  const updatePlayerStats = useGameStore((s) => s.updatePlayerStats);

  // 战斗状态
  const [player, setPlayer] = useState<Combatant>(() => createPlayerCombatant(playerStats, equippedSkills));
  const [enemies, setEnemies] = useState<Combatant[]>(() => createTestEnemies());
  const [turn, setTurn] = useState(1);
  const [log, setLog] = useState<CombatLogEntry[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isDefending, setIsDefending] = useState(false);
  const [skillCooldowns, setSkillCooldowns] = useState<Record<string, number>>({});
  const [showSkillPanel, setShowSkillPanel] = useState(false);
  const [battleEnded, setBattleEnded] = useState<{ victory: boolean } | null>(null);
  const [damageFlash, setDamageFlash] = useState(false);

  // 添加日志
  const addLog = useCallback((text: string, type: CombatLogEntry['type'] = 'info') => {
    setLog((prev) => [...prev, { id: Date.now() + Math.random(), text, type }]);
  }, []);

  // 初始化
  useEffect(() => {
    addLog('战斗开始！', 'system');
    addLog(`遭遇 ${enemies.length} 名敌人`, 'system');
  }, []);

  // 检查战斗结束
  useEffect(() => {
    if (player.health <= 0) {
      setBattleEnded({ victory: false });
      addLog('你倒下了...', 'system');
    } else if (enemies.every((e) => e.health <= 0)) {
      setBattleEnded({ victory: true });
      addLog('胜利！', 'system');
    }
  }, [player.health, enemies]);

  // 执行玩家行动
  const executeAction = useCallback((action: BattleAction) => {
    if (!isPlayerTurn || battleEnded) return;

    let updatedPlayer = { ...player };
    let updatedEnemies = enemies.map((e) => ({ ...e }));

    // 玩家执行行动
    const result = CombatEngine.executeAction(updatedPlayer, action, updatedEnemies);
    updatedPlayer = result.actor;
    updatedEnemies = result.targets;

    // 记录日志
    result.log.forEach((text) => addLog(text, 'damage'));

    if (action.type === 'defend') {
      setIsDefending(true);
    }

    if (action.type === 'skill' && action.skillId) {
      const skill = SKILL_LIBRARY[action.skillId];
      if (skill) {
        setSkillCooldowns((prev) => ({ ...prev, [action.skillId!]: skill.cooldown }));
      }
    }

    // 同步玩家属性到store
    updatePlayerStats({
      health: updatedPlayer.health,
      qi: updatedPlayer.qi,
    });

    setPlayer(updatedPlayer);
    setEnemies(updatedEnemies);

    // 检查战斗结束
    if (updatedPlayer.health <= 0 || updatedEnemies.every((e) => e.health <= 0)) {
      return;
    }

    // 切换到敌人回合
    setIsPlayerTurn(false);
    setTimeout(() => enemyTurn(updatedPlayer, updatedEnemies), 800);
  }, [isPlayerTurn, battleEnded, player, enemies, addLog, updatePlayerStats]);

  // 敌人回合
  const enemyTurn = useCallback((currentPlayer: Combatant, currentEnemies: Combatant[]) => {
    let updatedPlayer = { ...currentPlayer };
    let updatedEnemies = currentEnemies.map((e) => ({ ...e }));
    let playerTookDamage = false;

    updatedEnemies.forEach((enemy) => {
      if (enemy.health <= 0) return;

      const damage = CombatEngine.calculateDamage({
        baseDamage: enemy.attack,
        attackerQi: enemy.qi,
        attackerMaxQi: enemy.maxQi,
        elementMultiplier: 1.0,
        isDefending: updatedPlayer.isDefending,
        randomSeed: Math.random(),
      });

      const damaged = CombatEngine.applyDamage(updatedPlayer, damage);
      updatedPlayer = damaged;
      if (damage > 0) playerTookDamage = true;
      addLog(`${enemy.name} 攻击你，造成 ${damage} 点伤害`, 'damage');
    });

    if (playerTookDamage) {
      setDamageFlash(true);
      setTimeout(() => setDamageFlash(false), 300);
    }

    updatePlayerStats({
      health: updatedPlayer.health,
    });

    setPlayer(updatedPlayer);
    setEnemies(updatedEnemies);
    setIsDefending(false);

    // 减少技能冷却
    setSkillCooldowns((prev) => {
      const next: Record<string, number> = {};
      for (const [id, cd] of Object.entries(prev)) {
        next[id] = Math.max(0, cd - 1);
      }
      return next;
    });

    setTurn((t) => t + 1);
    setIsPlayerTurn(true);
  }, [addLog, updatePlayerStats]);

  // ==================== 渲染 ====================

  if (battleEnded) {
    return (
      <div className="combat-screen">
        <h2 className="text-h2">{battleEnded.victory ? '胜利！' : '失败...'}</h2>
        <div className="combat-log">
          {log.map((entry) => (
            <div key={entry.id} className={`log-entry log-${entry.type}`}>
              {entry.text}
            </div>
          ))}
        </div>
        <button className="btn-seal" onClick={() => {
          useGameStore.getState().setScreen('game');
        }}>
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="combat-screen">
      <h2 className="text-h2">第 {turn} 回合</h2>

      {/* 敌人区域 */}
      <div className="enemies-section">
        {enemies.map((enemy) => (
          <EnemyCard key={enemy.id} enemy={enemy} />
        ))}
      </div>

      {/* 玩家区域 */}
      <PlayerCard player={player} isDefending={isDefending} damageFlash={damageFlash} />

      {/* 战斗日志 */}
      <div className="combat-log">
        {log.slice(-8).map((entry) => (
          <div key={entry.id} className={`log-entry log-${entry.type}`}>
            {entry.text}
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="action-buttons">
        {isPlayerTurn ? (
          <>
            <button className="btn-seal" onClick={() => executeAction({ type: 'attack' })}>
              攻击
            </button>
            <button className="btn-seal" onClick={() => executeAction({ type: 'defend' })}>
              防御
            </button>
            <button
              className="btn-seal"
              onClick={() => setShowSkillPanel(!showSkillPanel)}
              disabled={equippedSkills.length === 0}
            >
              技能 {equippedSkills.length > 0 ? `(${equippedSkills.length})` : ''}
            </button>
            <button
              className="btn-seal btn-flee"
              onClick={() => {
                if (Math.random() < 0.5) {
                  addLog('逃跑成功！', 'system');
                  setTimeout(() => useGameStore.getState().setScreen('game'), 500);
                } else {
                  addLog('逃跑失败！', 'system');
                  setIsPlayerTurn(false);
                  setTimeout(() => enemyTurn(player, enemies), 800);
                }
              }}
            >
              逃跑
            </button>
          </>
        ) : (
          <span className="text-body">敌人行动中...</span>
        )}
      </div>

      {/* 技能选择面板 */}
      {showSkillPanel && (
        <SkillPanel
          equippedSkills={equippedSkills}
          player={player}
          cooldowns={skillCooldowns}
          onSelect={(skillId) => {
            setShowSkillPanel(false);
            executeAction({ type: 'skill', skillId });
          }}
          onClose={() => setShowSkillPanel(false)}
        />
      )}

      <style>{combatStyles}</style>
    </div>
  );
}

// ==================== 子组件 ====================

function EnemyCard({ enemy }: { enemy: Combatant }) {
  const healthPercent = (enemy.health / enemy.maxHealth) * 100;
  return (
    <div className="enemy-card">
      <div className="enemy-name">{enemy.name}</div>
      <div className="hp-bar">
        <div className="hp-fill" style={{ width: `${healthPercent}%` }} />
        <span className="hp-text">{enemy.health} / {enemy.maxHealth}</span>
      </div>
      <div className="enemy-stats">
        <span>攻 {enemy.attack}</span>
        <span>防 {enemy.defense}</span>
        <span>速 {enemy.speed}</span>
      </div>
    </div>
  );
}

function PlayerCard({ player, isDefending, damageFlash }: { player: Combatant; isDefending: boolean; damageFlash: boolean }) {
  const healthPercent = (player.health / player.maxHealth) * 100;
  const qiPercent = (player.qi / player.maxQi) * 100;

  return (
    <div className={`player-card ${isDefending ? 'defending' : ''} ${damageFlash ? 'animate-damage' : ''}`}>
      <div className="player-name">
        少侠 {isDefending && <span className="badge-defending">防御中</span>}
      </div>
      <div className="hp-bar">
        <div className="hp-fill hp-health" style={{ width: `${healthPercent}%` }} />
        <span className="hp-text">气血 {player.health} / {player.maxHealth}</span>
      </div>
      <div className="hp-bar">
        <div className="hp-fill hp-qi" style={{ width: `${qiPercent}%` }} />
        <span className="hp-text">内力 {player.qi} / {player.maxQi}</span>
      </div>
      <div className="player-stats">
        <span>攻 {player.attack}</span>
        <span>防 {player.defense}</span>
        <span>速 {player.speed}</span>
      </div>
    </div>
  );
}

function SkillPanel({
  equippedSkills,
  player,
  cooldowns,
  onSelect,
  onClose,
}: {
  equippedSkills: string[];
  player: Combatant;
  cooldowns: Record<string, number>;
  onSelect: (skillId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="skill-panel">
      <h3>选择技能</h3>
      <div className="skill-list">
        {equippedSkills.map((id) => {
          const skill = SKILL_LIBRARY[id];
          if (!skill) return null;
          const onCd = (cooldowns[id] ?? 0) > 0;
          const noQi = player.qi < skill.qiCost;
          const disabled = onCd || noQi;
          return (
            <button
              key={id}
              className="skill-card"
              disabled={disabled}
              onClick={() => onSelect(id)}
            >
              <div className="skill-name">{skill.name}</div>
              <div className="skill-desc">{skill.description}</div>
              <div className="skill-info">
                <span>内力 {skill.qiCost}</span>
                <span>倍率 ×{skill.damageMultiplier}</span>
                {onCd && <span className="skill-cd">冷却 {cooldowns[id]}</span>}
              </div>
            </button>
          );
        })}
      </div>
      <button className="btn-seal" onClick={onClose}>关闭</button>
    </div>
  );
}

// ==================== 工具函数 ====================

function createPlayerCombatant(stats: any, equippedSkills: string[]): Combatant {
  return {
    id: 'player',
    name: '少侠',
    health: stats.health,
    maxHealth: stats.maxHealth,
    qi: stats.qi,
    maxQi: stats.maxQi,
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed,
    moves: equippedSkills,
    isDefending: false,
    buffs: [],
    debuffs: [],
  };
}

function createTestEnemies(): Combatant[] {
  return [
    {
      id: 'enemy1',
      name: '山贼',
      health: 60,
      maxHealth: 60,
      qi: 40,
      maxQi: 40,
      attack: 10,
      defense: 5,
      speed: 8,
      moves: ['劈砍'],
      isDefending: false,
      buffs: [],
      debuffs: [],
    },
  ];
}

// ==================== 样式 ====================

const combatStyles = `
.combat-screen {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  background: var(--paper-cream);
  min-height: 100vh;
}

.enemies-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.enemy-card {
  background: var(--paper-white);
  border: 2px solid var(--cinnabar);
  padding: 12px;
  flex: 1;
  min-width: 200px;
  border-radius: 4px;
}

.enemy-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--cinnabar-dark);
  margin-bottom: 8px;
}

.player-card {
  background: var(--paper-white);
  border: 2px solid var(--gold);
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 4px;
  transition: all 0.3s;
}

.player-card.defending {
  border-color: var(--info);
  box-shadow: 0 0 12px var(--info);
}

.player-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--gold-dark);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-defending {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--info);
  color: white;
  border-radius: 12px;
}

.hp-bar {
  position: relative;
  height: 24px;
  background: var(--paper-aged);
  border-radius: 4px;
  margin-bottom: 4px;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  background: var(--cinnabar);
  transition: width 0.3s;
}

.hp-fill.hp-health {
  background: linear-gradient(to right, var(--cinnabar), var(--cinnabar-light));
}

.hp-fill.hp-qi {
  background: linear-gradient(to right, var(--info), #6ba3c4);
}

.hp-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: bold;
  color: var(--ink-black);
  text-shadow: 0 0 2px white;
}

.enemy-stats, .player-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--ink-gray);
  margin-top: 4px;
}

.combat-log {
  background: var(--paper-white);
  border: 1px solid var(--paper-aged);
  padding: 8px;
  margin-bottom: 16px;
  min-height: 100px;
  max-height: 150px;
  overflow-y: auto;
  font-size: 13px;
}

.log-entry {
  padding: 2px 0;
  border-bottom: 1px dashed var(--paper-aged);
}

.log-entry:last-child {
  border-bottom: none;
}

.log-damage {
  color: var(--cinnabar-dark);
}

.log-system {
  color: var(--gold-dark);
  font-weight: bold;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.btn-flee {
  background: var(--ink-light);
}

.skill-panel {
  background: var(--paper-white);
  border: 2px solid var(--gold);
  padding: 16px;
  border-radius: 4px;
}

.skill-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.skill-card {
  background: var(--paper-cream);
  border: 1px solid var(--paper-aged);
  padding: 12px;
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.skill-card:hover:not(:disabled) {
  border-color: var(--gold);
  transform: translateY(-2px);
}

.skill-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skill-name {
  font-weight: bold;
  color: var(--gold-dark);
  margin-bottom: 4px;
}

.skill-desc {
  font-size: 12px;
  color: var(--ink-gray);
  margin-bottom: 4px;
}

.skill-info {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--ink-light);
}

.skill-cd {
  color: var(--cinnabar);
  font-weight: bold;
}
`;
