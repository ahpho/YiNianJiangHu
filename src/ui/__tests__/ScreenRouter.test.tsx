import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScreenRouter, useScreenStore } from '../ScreenRouter';

beforeEach(() => {
  useScreenStore.setState({ screen: 'title' });
});

describe('ScreenRouter', () => {
  it('默认显示 TitleScreen', () => {
    render(<ScreenRouter />);
    expect(screen.getByText('一念江湖')).toBeInTheDocument();
  });

  it('切换到 game 屏幕后显示 GameScreen', () => {
    useScreenStore.setState({ screen: 'game' });
    render(<ScreenRouter />);
    expect(screen.getByText(/游戏主界面/)).toBeInTheDocument();
  });

  it('切换到 combat 屏幕后显示 CombatScreen', () => {
    useScreenStore.setState({ screen: 'combat' });
    render(<ScreenRouter />);
    expect(screen.getByText(/战斗界面/)).toBeInTheDocument();
  });

  it('切换到 graph 屏幕后显示 RelationGraph', () => {
    useScreenStore.setState({ screen: 'graph' });
    render(<ScreenRouter />);
    expect(screen.getByText(/关系图/)).toBeInTheDocument();
  });

  it('切换到 ending 屏幕后显示 EndingScreen', () => {
    useScreenStore.setState({ screen: 'ending' });
    render(<ScreenRouter />);
    expect(screen.getByText(/结局画面/)).toBeInTheDocument();
  });
});
