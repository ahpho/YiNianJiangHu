import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScreenRouter } from '../ScreenRouter';
import { useGameStore } from '../store/gameStore';

beforeEach(() => {
  useGameStore.getState().resetGame();
});

describe('ScreenRouter', () => {
  it('默认显示 TitleScreen', () => {
    render(<ScreenRouter />);
    expect(screen.getByText('一念江湖')).toBeInTheDocument();
  });

  it('切换到 game 屏幕后显示 GameScreen', () => {
    useGameStore.setState({ screen: 'game' });
    render(<ScreenRouter />);
    expect(screen.getByText(/第1天/)).toBeInTheDocument();
  });

  it('切换到 combat 屏幕后显示 CombatScreen', () => {
    useGameStore.setState({ screen: 'combat' });
    render(<ScreenRouter />);
    expect(screen.getByText(/战斗开始/)).toBeInTheDocument();
  });

  it('切换到 relation 屏幕后显示 RelationGraph', () => {
    useGameStore.setState({ screen: 'relation' });
    render(<ScreenRouter />);
    expect(screen.getByText('江湖关系')).toBeInTheDocument();
  });

  it('切换到 ending 屏幕后显示 EndingScreen', () => {
    useGameStore.setState({ screen: 'ending' });
    render(<ScreenRouter />);
    expect(screen.getByText('结局画面（待实现）')).toBeInTheDocument();
  });
});
