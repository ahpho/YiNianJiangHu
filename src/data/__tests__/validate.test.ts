import { describe, it, expect } from 'vitest';
import { validateData, validateAll } from '../validate';
import { NpcDataSchema, DayEventsSchema, MartialArtDataSchema } from '../../engine/schemas';

describe('validateData', () => {
  it('校验通过时返回 success: true', () => {
    const npc = {
      name: '苏青衡', title: '青锋', faction: 'taixu', gender: 'male', age: 22,
      initialFavor: { trust: 50, intimacy: 30, awe: 20, fear: 5 }, portrait: 'suqingheng.png',
    };
    const result = validateData(NpcDataSchema, npc, 'test.json');
    expect(result.success).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('校验失败时返回错误信息', () => {
    const invalid = { name: 'test' };
    const result = validateData(NpcDataSchema, invalid, 'npcs.json');
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('npcs.json');
  });

  it('校验武学数据', () => {
    const art = {
      name: '太虚十三剑', faction: 'taixu', element: 'sword', type: 'attack',
      target: 'single', baseDamage: 25, qiCost: 30, effect: null, unlockCondition: null,
    };
    expect(validateData(MartialArtDataSchema, art, 'test.json').success).toBe(true);
  });

  it('校验无效门派', () => {
    const art = {
      name: 'test', faction: 'invalid', element: 'sword', type: 'attack',
      target: 'single', baseDamage: 25, qiCost: 30, effect: null, unlockCondition: null,
    };
    expect(validateData(MartialArtDataSchema, art, 'test.json').success).toBe(false);
  });
});

describe('validateAll', () => {
  it('全部通过时返回 success', () => {
    const files = [{
      filename: 'valid.json',
      data: {
        day: 1, events: [{
          id: 'test', type: 'story',
          trigger: { conditions: [] },
          dialogues: [{ speaker: 'narrator', text: 'hello' }],
          choices: [],
        }],
      },
    }];
    const result = validateAll(DayEventsSchema, files);
    expect(result.success).toBe(true);
  });

  it('部分失败时返回所有错误', () => {
    const files = [
      { filename: 'good.json', data: { name: 'ok', title: 't', faction: 'taixu', gender: 'male', age: 20, initialFavor: { trust: 50, intimacy: 50, awe: 50, fear: 50 }, portrait: 'p.png' } },
      { filename: 'bad.json', data: { name: 'bad' } },
    ];
    const result = validateAll(NpcDataSchema, files);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('bad.json'))).toBe(true);
  });
});
