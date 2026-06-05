import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('CSS 变量完整性', () => {
  const cssContent = readFileSync(
    resolve(__dirname, '../variables.css'),
    'utf-8',
  );

  it('定义了主色朱砂红', () => {
    expect(cssContent).toContain('--cinnabar:');
    expect(cssContent).toContain('--cinnabar-light:');
    expect(cssContent).toContain('--cinnabar-dark:');
  });

  it('定义了墨色系三色', () => {
    expect(cssContent).toContain('--ink-black:');
    expect(cssContent).toContain('--ink-gray:');
    expect(cssContent).toContain('--ink-light:');
  });

  it('定义了纸色系三色', () => {
    expect(cssContent).toContain('--paper-white:');
    expect(cssContent).toContain('--paper-cream:');
    expect(cssContent).toContain('--paper-aged:');
  });

  it('定义了鎏金三色', () => {
    expect(cssContent).toContain('--gold:');
    expect(cssContent).toContain('--gold-light:');
    expect(cssContent).toContain('--gold-dark:');
  });

  it('定义了五个门派色', () => {
    expect(cssContent).toContain('--faction-taixu:');
    expect(cssContent).toContain('--faction-tingyu:');
    expect(cssContent).toContain('--faction-tieqi:');
    expect(cssContent).toContain('--faction-yaowang:');
    expect(cssContent).toContain('--faction-fentian:');
  });

  it('定义了好感度四维色', () => {
    expect(cssContent).toContain('--favor-trust:');
    expect(cssContent).toContain('--favor-intimacy:');
    expect(cssContent).toContain('--favor-awe:');
    expect(cssContent).toContain('--favor-fear:');
  });
});
