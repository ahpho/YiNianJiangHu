import { describe, it, expect } from 'vitest';
import { validateData, validateAll } from '../validate';
import { NpcDataSchema, MartialArtDataSchema, FactionDataSchema, EndingDataSchema, DayEventsSchema, RandomEventSchema } from '../../engine/schemas';
import npcsJson from '../npcs.json';
import martialArtsJson from '../martial-arts.json';
import factionsJson from '../factions.json';
import endingsJson from '../endings.json';
import day01Json from '../events/day01.json';
import randomEventsJson from '../random-events.json';

describe('NPC 数据校验', () => {
  it('包含 12 个 NPC', () => {
    expect(Object.keys(npcsJson).length).toBe(12);
  });

  it('所有 NPC 通过 schema 校验', () => {
    const entries = Object.entries(npcsJson).map(([k, v]) => ({ filename: `npcs.json:${k}`, data: v }));
    const result = validateAll(NpcDataSchema, entries);
    expect(result.success).toBe(true);
  });

  it('苏青衡初始好感度正确', () => {
    const npc = npcsJson.suqingheng;
    expect(npc.initialFavor.trust).toBe(50);
    expect(npc.initialFavor.intimacy).toBe(30);
  });

  it('厉无双初始好感度正确', () => {
    const npc = npcsJson.liwushuang;
    expect(npc.initialFavor.awe).toBe(60);
    expect(npc.initialFavor.fear).toBe(50);
  });
});

describe('武学数据校验', () => {
  it('包含 20 招武学', () => {
    expect(Object.keys(martialArtsJson).length).toBe(20);
  });

  it('所有武学通过 schema 校验', () => {
    const entries = Object.entries(martialArtsJson).map(([k, v]) => ({ filename: `martial-arts.json:${k}`, data: v }));
    const result = validateAll(MartialArtDataSchema, entries);
    expect(result.success).toBe(true);
  });

  it('太虚十三剑数据正确', () => {
    const art = martialArtsJson.taixu_13_swords;
    expect(art.name).toBe('太虚十三剑');
    expect(art.faction).toBe('taixu');
    expect(art.element).toBe('sword');
    expect(art.baseDamage).toBe(25);
  });
});

describe('门派数据校验', () => {
  it('包含 5 个门派', () => {
    expect(Object.keys(factionsJson).length).toBe(5);
  });

  it('所有门派通过 schema 校验', () => {
    const entries = Object.entries(factionsJson).map(([k, v]) => ({ filename: `factions.json:${k}`, data: v }));
    const result = validateAll(FactionDataSchema, entries);
    expect(result.success).toBe(true);
  });
});

describe('结局数据校验', () => {
  it('包含 7 个结局', () => {
    expect(endingsJson.length).toBe(7);
  });

  it('所有结局通过 schema 校验', () => {
    const entries = endingsJson.map((e) => ({ filename: `endings.json:${e.id}`, data: e }));
    const result = validateAll(EndingDataSchema, entries);
    expect(result.success).toBe(true);
  });

  it('优先级从 1 到 7', () => {
    const priorities = endingsJson.map((e) => e.priority).sort((a, b) => a - b);
    expect(priorities).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('day01 事件数据校验', () => {
  it('通过 DayEventsSchema 校验', () => {
    const result = validateData(DayEventsSchema, day01Json, 'day01.json');
    expect(result.success).toBe(true);
  });

  it('day 等于 1', () => {
    expect(day01Json.day).toBe(1);
  });

  it('包含多个事件', () => {
    expect(day01Json.events.length).toBeGreaterThanOrEqual(6);
  });

  it('intro 事件在 dawn 触发', () => {
    const intro = day01Json.events.find((e) => e.id === 'day1_intro');
    expect(intro?.trigger.timeslot).toBe('dawn');
  });

  it('所有事件 ID 以 day1_ 开头', () => {
    for (const event of day01Json.events) {
      expect(event.id).toMatch(/^day1_/);
    }
  });
});

describe('随机事件数据校验', () => {
  it('所有随机事件通过 schema 校验', () => {
    const entries = randomEventsJson.map((e) => ({ filename: `random-events.json:${e.id}`, data: e }));
    const result = validateAll(RandomEventSchema, entries);
    expect(result.success).toBe(true);
  });

  it('至少 3 个随机事件', () => {
    expect(randomEventsJson.length).toBeGreaterThanOrEqual(3);
  });

  it('每个随机事件有权重', () => {
    for (const event of randomEventsJson) {
      expect(event.weight).toBeGreaterThan(0);
    }
  });
});
