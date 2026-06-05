import { describe, it, expect, beforeEach } from 'vitest';
import { FlagEngine } from '../FlagEngine';

describe('FlagEngine', () => {
  let flags: Set<string>;

  beforeEach(() => {
    flags = new Set<string>();
  });

  describe('setFlag', () => {
    it('设置一个新标记', () => {
      const result = FlagEngine.setFlag(flags, 'found_letter');
      expect(result).toContain('found_letter');
    });

    it('重复设置同一标记不产生重复', () => {
      const step1 = FlagEngine.setFlag(flags, 'found_letter');
      const step2 = FlagEngine.setFlag(step1, 'found_letter');
      expect(step2.size).toBe(1);
    });

    it('可同时持有多个标记', () => {
      const step1 = FlagEngine.setFlag(flags, 'found_letter');
      const step2 = FlagEngine.setFlag(step1, 'letter_exposed');
      expect(step2.size).toBe(2);
      expect(step2).toContain('found_letter');
      expect(step2).toContain('letter_exposed');
    });
  });

  describe('hasFlag', () => {
    it('存在标记时返回 true', () => {
      const updated = FlagEngine.setFlag(flags, 'found_letter');
      expect(FlagEngine.hasFlag(updated, 'found_letter')).toBe(true);
    });

    it('不存在标记时返回 false', () => {
      expect(FlagEngine.hasFlag(flags, 'nonexistent')).toBe(false);
    });

    it('空集合返回 false', () => {
      expect(FlagEngine.hasFlag(new Set(), 'any')).toBe(false);
    });
  });

  describe('removeFlag', () => {
    it('移除已存在的标记', () => {
      const step1 = FlagEngine.setFlag(flags, 'found_letter');
      const step2 = FlagEngine.removeFlag(step1, 'found_letter');
      expect(step2).not.toContain('found_letter');
      expect(step2.size).toBe(0);
    });

    it('移除不存在的标记不报错', () => {
      const result = FlagEngine.removeFlag(flags, 'nonexistent');
      expect(result.size).toBe(0);
    });

    it('移除一个标记不影响其他标记', () => {
      const step1 = FlagEngine.setFlag(flags, 'a');
      const step2 = FlagEngine.setFlag(step1, 'b');
      const step3 = FlagEngine.removeFlag(step2, 'a');
      expect(step3).toContain('b');
      expect(step3).not.toContain('a');
    });
  });

  describe('clearFlags', () => {
    it('清空所有标记', () => {
      let f = new Set<string>();
      f = FlagEngine.setFlag(f, 'a');
      f = FlagEngine.setFlag(f, 'b');
      f = FlagEngine.setFlag(f, 'c');
      const result = FlagEngine.clearFlags(f);
      expect(result.size).toBe(0);
    });
  });

  describe('setFlags（批量设置）', () => {
    it('批量设置多个标记', () => {
      const result = FlagEngine.setFlags(flags, ['a', 'b', 'c']);
      expect(result.size).toBe(3);
      expect(result).toContain('a');
      expect(result).toContain('b');
      expect(result).toContain('c');
    });

    it('批量设置时自动去重', () => {
      const step1 = FlagEngine.setFlag(flags, 'a');
      const result = FlagEngine.setFlags(step1, ['a', 'b']);
      expect(result.size).toBe(2);
    });
  });
});
