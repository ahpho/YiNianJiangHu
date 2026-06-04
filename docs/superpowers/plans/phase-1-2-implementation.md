# 一念江湖 — 实现计划 Phase 1 & Phase 2

> 技术栈：React 18 + TypeScript strict + Vite + Zustand + 纯 CSS + Vitest
> 约定：每个 Task 遵循红-绿-重构 TDD 流程，禁止占位符/TODO，所有代码可直接运行。

---

## Phase 1: 项目初始化与脚手架搭建

---

### Task 1: Vite 项目初始化

**目标**：使用 Vite 创建 React + TypeScript 项目，安装全部核心依赖。

**步骤 1.1 — 创建 Vite 项目**

```bash
cd "D:/Work/Game/一念江湖"
npm create vite@latest . -- --template react-ts
```

预期输出（末尾）：
```
Done. Now run:
  npm install
  npm run dev
```

**步骤 1.2 — 安装核心依赖**

```bash
npm install
npm install zustand
```

预期输出（末尾）：
```
added 1 package in Xs
```

**步骤 1.3 — 安装开发依赖**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

预期输出（末尾）：
```
added N packages in Xs
```

**步骤 1.4 — 验证 `package.json`**

读取 `package.json`，确认以下字段存在且正确：

```json
{
  "name": "yinian-jianghu",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react-swc": "^4.1.0",
    "@vitest/ui": "N.N.N",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.0",
    "jsdom": "^25.0.0",
    "typescript": "~5.7.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0"
  }
}
```

**步骤 1.5 — 配置 Vitest**

在根目录创建 `vitest.config.ts`：

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
```

**步骤 1.6 — 创建测试 setup 文件**

创建 `src/test-setup.ts`：

```typescript
import '@testing-library/jest-dom/vitest';
```

**步骤 1.7 — 验证构建**

```bash
npm run build
```

预期输出（末尾）：
```
✓ built in X.XXs
```

**步骤 1.8 — 验证测试运行器**

创建 `src/smoke.test.ts`：

```typescript
import { describe, it, expect } from 'vitest';

describe('项目冒烟测试', () => {
  it('Vitest 正常运行', () => {
    expect(1 + 1).toBe(2);
  });
});
```

```bash
npx vitest run src/smoke.test.ts
```

预期输出（末尾）：
```
 ✓ src/smoke.test.ts (1 test) 1ms
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

确认后删除 `src/smoke.test.ts`。

**步骤 1.9 — 首次 Git 提交**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json vitest.config.ts index.html src/test-setup.ts
git commit -m "chore: initialize Vite + React + TypeScript + Vitest project"
```

---

### Task 2: 项目目录结构

**目标**：创建所有业务目录及占位 `index.ts`，确保目录拓扑与设计文档一致。

**步骤 2.1 — 创建目录树**

```bash
cd "D:/Work/Game/一念江湖"
mkdir -p src/engine
mkdir -p src/data/events
mkdir -p src/ui/screens
mkdir -p src/ui/components
mkdir -p src/ui/hooks
mkdir -p src/styles
mkdir -p src/utils
```

**步骤 2.2 — 创建引擎层占位文件**

创建 `src/engine/index.ts`：

```typescript
// 引擎层入口 — 各模块将在 Phase 2 逐步实现
export {};
```

**步骤 2.3 — 创建 UI 层占位文件**

创建 `src/ui/screens/index.ts`：

```typescript
// 屏幕组件将在 Phase 3 逐步实现
export {};
```

创建 `src/ui/components/index.ts`：

```typescript
// 可复用组件将在 Phase 3 逐步实现
export {};
```

创建 `src/ui/hooks/index.ts`：

```typescript
// 自定义 Hooks 将在 Phase 3 逐步实现
export {};
```

**步骤 2.4 — 创建样式层占位文件**

创建 `src/styles/index.css`：

```css
/* 全局样式将在 Task 5 填充 */
```

**步骤 2.5 — 创建工具层占位文件**

创建 `src/utils/index.ts`：

```typescript
// 工具函数将在后续 Task 逐步实现
export {};
```

**步骤 2.6 — 验证构建通过**

```bash
npm run build
```

预期输出：
```
✓ built in X.XXs
```

**步骤 2.7 — Git 提交**

```bash
git add src/engine src/data src/ui src/styles src/utils
git commit -m "chore: create project directory structure with placeholder files"
```

---

### Task 3: TypeScript 配置

**目标**：配置 strict 模式 tsconfig，确保编译器捕获所有潜在问题。

**步骤 3.1 — 更新 `tsconfig.app.json`**

读取 Vite 生成的 `tsconfig.app.json`，替换为以下内容：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": false,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

**步骤 3.2 — 更新 `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["vitest.config.ts"]
}
```

**步骤 3.3 — 验证类型检查**

```bash
npx tsc -b --noEmit
```

预期输出：无错误输出（退出码 0）。

**步骤 3.4 — Git 提交**

```bash
git add tsconfig.app.json tsconfig.node.json
git commit -m "chore: configure TypeScript strict mode with all strict checks enabled"
```

---

### Task 4: ESLint + Prettier 配置

**目标**：统一代码风格，CI 可用的 lint 命令。

**步骤 4.1 — 安装 ESLint**

```bash
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks
```

**步骤 4.2 — 安装 Prettier**

```bash
npm install -D prettier eslint-config-prettier
```

**步骤 4.3 — 创建 ESLint 配置**

创建 `eslint.config.js`（flat config 格式）：

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
);
```

**步骤 4.4 — 创建 Prettier 配置**

创建 `.prettierrc`：

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

创建 `.prettierignore`：

```
dist
node_modules
*.json
```

**步骤 4.5 — 添加 lint 和 format 脚本**

编辑 `package.json` 的 `scripts` 字段，添加：

```json
{
  "scripts": {
    "lint": "eslint src/ --max-warnings 0",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/"
  }
}
```

**步骤 4.6 — 验证 ESLint**

```bash
npm run lint
```

预期输出（末尾）：
```
✖ 0 problems (0 errors, 0 warnings)
```

**步骤 4.7 — 验证 Prettier**

```bash
npx prettier --check "src/**/*.ts" "src/**/*.tsx"
```

预期输出：
```
Checking formatting...
All matched files use Prettier code style!
```

**步骤 4.8 — Git 提交**

```bash
git add eslint.config.js .prettierrc .prettierignore
git commit -m "chore: add ESLint (flat config) and Prettier with strict rules"
```

---

### Task 5: CSS 变量与全局样式

**目标**：从 `04-art-style.md` 提取完整色板、字体、组件样式，写入 `src/styles/`。

**步骤 5.1 — 创建 CSS 变量文件**

创建 `src/styles/variables.css`：

```css
:root {
  /* 主色 — 朱砂红系 */
  --cinnabar: #c23b22;
  --cinnabar-light: #e85d4a;
  --cinnabar-dark: #8b1a1a;

  /* 墨色系 */
  --ink-black: #1a1a2e;
  --ink-gray: #3d3d56;
  --ink-light: #6b6b80;

  /* 纸色系 */
  --paper-white: #f5f0e8;
  --paper-cream: #ede5d8;
  --paper-aged: #d4c9b5;

  /* 金属色 — 鎏金 */
  --gold: #c5a55a;
  --gold-light: #dbc07a;
  --gold-dark: #9a7b3a;

  /* 功能色 */
  --success: #5b8c5a;
  --danger: #8b1a1a;
  --info: #4a708b;

  /* 门派色 */
  --faction-taixu: #5b8c8c;
  --faction-tingyu: #7b68ae;
  --faction-tieqi: #8b6914;
  --faction-yaowang: #6b8e23;
  --faction-fentian: #c23b22;

  /* 阴影 */
  --shadow-ink: rgba(26, 26, 46, 0.15);
  --shadow-gold: rgba(197, 165, 90, 0.2);

  /* 好感度四维色 */
  --favor-trust: var(--gold);
  --favor-intimacy: var(--cinnabar);
  --favor-awe: var(--info);
  --favor-fear: var(--ink-black);
}
```

**步骤 5.2 — 创建字体样式文件**

创建 `src/styles/typography.css`：

```css
/* 中文 — 主标题（宋体） */
.font-title-cn {
  font-family: 'FZQingKeBenYueSongS-R-GB', 'Source Han Serif SC',
    'Noto Serif CJK SC', serif;
}

/* 中文 — 正文（黑体） */
.font-body-cn {
  font-family: 'Source Han Sans SC', 'Noto Sans CJK SC', 'Microsoft YaHei',
    sans-serif;
}

/* 英文/数字 — 标题 */
.font-title-en {
  font-family: 'Cinzel', 'Palatino', serif;
}

/* 英文/数字 — 正文 */
.font-body-en {
  font-family: 'EB Garamond', 'Times New Roman', serif;
}

/* 字体层级 */
.text-h1 {
  font-size: 36px;
  font-weight: bold;
  line-height: 1.3;
  color: var(--ink-black);
}

.text-h2 {
  font-size: 24px;
  font-weight: bold;
  line-height: 1.4;
  color: var(--ink-black);
}

.text-h3 {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--ink-black);
}

.text-body {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  color: var(--ink-gray);
}

.text-caption {
  font-size: 14px;
  color: var(--ink-light);
}

.text-stat {
  font-size: 14px;
  font-family: 'EB Garamond', 'Times New Roman', serif;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
}
```

**步骤 5.3 — 创建组件样式文件**

创建 `src/styles/scroll-frame.css`：

```css
/* 卷轴边框 */
.scroll-frame {
  background: var(--paper-cream);
  border: 2px solid var(--paper-aged);
  border-image: linear-gradient(
      to bottom,
      var(--gold-dark),
      var(--paper-aged) 10%,
      var(--paper-aged) 90%,
      var(--gold-dark)
    )
    1;
  padding: 24px 32px;
  position: relative;
}

.scroll-frame::before {
  content: '';
  position: absolute;
  top: -4px;
  left: 20px;
  right: 20px;
  height: 8px;
  background: linear-gradient(to right, transparent, var(--gold), transparent);
  border-radius: 50%;
}

/* 印章式按钮 */
.btn-seal {
  background: var(--cinnabar);
  color: var(--paper-white);
  font-family: 'FZQingKeBenYueSongS-R-GB', serif;
  font-size: 16px;
  padding: 8px 24px;
  border: 2px solid var(--cinnabar-dark);
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-seal:hover {
  background: var(--cinnabar-light);
  transform: rotate(-1deg);
  box-shadow: var(--shadow-gold);
}

.btn-seal:active {
  transform: rotate(1deg) scale(0.97);
}

/* 墨迹分割线 */
.divider-ink {
  border: none;
  height: 2px;
  background: linear-gradient(
    to right,
    transparent 0%,
    var(--ink-light) 15%,
    var(--ink-gray) 50%,
    var(--ink-light) 85%,
    transparent 100%
  );
  margin: 24px 0;
  opacity: 0.6;
}

/* 好感度进度条 */
.favor-bar {
  height: 8px;
  background: var(--paper-aged);
  border-radius: 4px;
  overflow: hidden;
}

.favor-bar-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.favor-trust .favor-bar-fill {
  background: var(--favor-trust);
}

.favor-intimacy .favor-bar-fill {
  background: var(--favor-intimacy);
}

.favor-awe .favor-bar-fill {
  background: var(--favor-awe);
}

.favor-fear .favor-bar-fill {
  background: var(--favor-fear);
}
```

**步骤 5.4 — 创建动画样式文件**

创建 `src/styles/animations.css`：

```css
/* 页面切换 — 墨水晕染展开 */
@keyframes ink-spread {
  from {
    clip-path: circle(0% at 50% 50%);
    opacity: 0;
  }
  to {
    clip-path: circle(100% at 50% 50%);
    opacity: 1;
  }
}

.animate-ink-spread {
  animation: ink-spread 0.4s ease-out forwards;
}

/* 好感度变化 — 数值闪烁 */
@keyframes favor-flash {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.animate-favor-flash {
  animation: favor-flash 0.3s ease-in-out;
}

/* 结局画面 — 水墨渐隐至白 */
@keyframes ink-fade-to-white {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
    filter: brightness(2);
  }
}

.animate-ink-fade {
  animation: ink-fade-to-white 2s ease-in forwards;
}

/* 逐字打印容器 */
.typewriter-container {
  display: inline;
}

.typewriter-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--ink-black);
  margin-left: 2px;
  animation: blink 0.8s step-end infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
```

**步骤 5.5 — 创建全局样式文件**

创建 `src/styles/global.css`：

```css
@import './variables.css';
@import './typography.css';
@import './scroll-frame.css';
@import './animations.css';

/* CSS Reset */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: 'Source Han Sans SC', 'Noto Sans CJK SC', 'Microsoft YaHei',
    sans-serif;
  background-color: var(--paper-white);
  color: var(--ink-gray);
  min-height: 100vh;
  overflow-x: hidden;
}

#root {
  min-height: 100vh;
}

a {
  color: var(--cinnabar);
  text-decoration: none;
}

a:hover {
  color: var(--cinnabar-light);
}

/* 滚动条样式（Webkit） */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: var(--paper-cream);
}

::-webkit-scrollbar-thumb {
  background: var(--paper-aged);
  border-radius: 3px;
}
```

**步骤 5.6 — 更新 `src/index.tsx` 引入全局样式**

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

**步骤 5.7 — CSS 变量一致性测试**

创建 `src/styles/__tests__/variables.test.ts`：

```typescript
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
```

```bash
npx vitest run src/styles/__tests__/variables.test.ts
```

预期输出：
```
 ✓ src/styles/__tests__/variables.test.ts (6 tests) Xms
 Test Files  1 passed (1)
      Tests  6 passed (6)
```

**步骤 5.8 — 构建验证**

```bash
npm run build
```

预期输出：
```
✓ built in X.XXs
```

**步骤 5.9 — Git 提交**

```bash
git add src/styles/
git commit -m "feat: add complete CSS variable system, typography, scroll-frame components and animations from art-style spec"
```

---

### Task 6: 基础 App.tsx 骨架

**目标**：实现 Zustand store 基础结构 + ScreenRouter + 5 个空屏幕占位，确认路由可切换。

**步骤 6.1 — 定义 ScreenId 类型**

创建 `src/ui/ScreenRouter.tsx`：

```typescript
import { create } from 'zustand';

export type ScreenId = 'title' | 'game' | 'combat' | 'graph' | 'ending';

interface ScreenStore {
  screen: ScreenId;
  navigate: (screen: ScreenId) => void;
}

export const useScreenStore = create<ScreenStore>((set) => ({
  screen: 'title',
  navigate: (screen) => set({ screen }),
}));
```

**步骤 6.2 — 创建占位屏幕组件**

创建 `src/ui/screens/TitleScreen.tsx`：

```typescript
export function TitleScreen() {
  return (
    <div style={{ padding: '48px', textAlign: 'center' }}>
      <h1 className="font-title-cn text-h1" style={{ color: 'var(--gold)' }}>
        一念江湖
      </h1>
      <p className="text-body" style={{ color: 'var(--ink-light)', marginTop: 16 }}>
        一念成佛，一念成魔。
      </p>
    </div>
  );
}
```

创建 `src/ui/screens/GameScreen.tsx`：

```typescript
export function GameScreen() {
  return (
    <div style={{ padding: '24px' }}>
      <p className="text-body">游戏主界面（待实现）</p>
    </div>
  );
}
```

创建 `src/ui/screens/CombatScreen.tsx`：

```typescript
export function CombatScreen() {
  return (
    <div style={{ padding: '24px' }}>
      <p className="text-body">战斗界面（待实现）</p>
    </div>
  );
}
```

创建 `src/ui/screens/RelationGraph.tsx`：

```typescript
export function RelationGraph() {
  return (
    <div style={{ padding: '24px' }}>
      <p className="text-body">关系图（待实现）</p>
    </div>
  );
}
```

创建 `src/ui/screens/EndingScreen.tsx`：

```typescript
export function EndingScreen() {
  return (
    <div style={{ padding: '24px' }}>
      <p className="text-body">结局画面（待实现）</p>
    </div>
  );
}
```

**步骤 6.3 — 更新屏幕入口**

更新 `src/ui/screens/index.ts`：

```typescript
export { TitleScreen } from './TitleScreen';
export { GameScreen } from './GameScreen';
export { CombatScreen } from './CombatScreen';
export { RelationGraph } from './RelationGraph';
export { EndingScreen } from './EndingScreen';
```

**步骤 6.4 — 创建 ScreenRouter 组件**

追加到 `src/ui/ScreenRouter.tsx`（在 `useScreenStore` 定义之后）：

```typescript
import { TitleScreen } from './screens/TitleScreen';
import { GameScreen } from './screens/GameScreen';
import { CombatScreen } from './screens/CombatScreen';
import { RelationGraph } from './screens/RelationGraph';
import { EndingScreen } from './screens/EndingScreen';

const SCREEN_MAP: Record<ScreenId, React.FC> = {
  title: TitleScreen,
  game: GameScreen,
  combat: CombatScreen,
  graph: RelationGraph,
  ending: EndingScreen,
};

export function ScreenRouter() {
  const screen = useScreenStore((s) => s.screen);
  const Screen = SCREEN_MAP[screen];
  return <Screen />;
}
```

**步骤 6.5 — 更新 `src/App.tsx`**

```typescript
import { ScreenRouter } from './ui/ScreenRouter';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper-white)' }}>
      <ScreenRouter />
    </div>
  );
}
```

**步骤 6.6 — 创建路由测试**

创建 `src/ui/__tests__/ScreenRouter.test.tsx`：

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScreenRouter, useScreenStore } from '../ScreenRouter';

// 每个测试前重置 store
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
```

```bash
npx vitest run src/ui/__tests__/ScreenRouter.test.tsx
```

预期输出：
```
 ✓ src/ui/__tests__/ScreenRouter.test.tsx (5 tests) Xms
 Test Files  1 passed (1)
      Tests  5 passed (5)
```

**步骤 6.7 — 构建验证**

```bash
npm run build
```

预期输出：
```
✓ built in X.XXs
```

**步骤 6.8 — Git 提交**

```bash
git add src/App.tsx src/ui/
git commit -m "feat: add ScreenRouter with Zustand store and 5 screen placeholders"
```

**Phase 1 汇总验证**

```bash
npm run lint && npm run build && npx vitest run
```

预期：零 lint 错误，构建通过，全部测试通过。

---

## Phase 2: 游戏引擎核心

> 本 Phase 所有引擎模块均为纯函数，零 UI 依赖，可在 Node.js / Vitest 中独立运行测试。

---

### Task 7: types.ts — 全局类型定义

**目标**：定义 GameState 及所有枚举/联合类型，作为全项目的类型基础。

**步骤 7.1 — 编写类型定义（先创建文件，后续 Task 的测试依赖它）**

创建 `src/engine/types.ts`：

```typescript
// ==================== 枚举 / 联合类型 ====================

export type Timeslot = 'dawn' | 'noon' | 'dusk' | 'night';

export const TIMESLOTS: readonly Timeslot[] = ['dawn', 'noon', 'dusk', 'night'];

export const TIMESLOT_LABELS: Record<Timeslot, string> = {
  dawn: '卯时',
  noon: '午时',
  dusk: '酉时',
  night: '子时',
};

export type Location =
  | 'zhongyuan'
  | 'jiangnan'
  | 'saibei'
  | 'shuzhong'
  | 'xiyu';

export const LOCATIONS: readonly Location[] = [
  'zhongyuan',
  'jiangnan',
  'saibei',
  'shuzhong',
  'xiyu',
];

export type NPC_ID =
  | 'suqingheng'       // 苏青衡
  | 'qingxuzhenren'    // 清虚真人
  | 'shentingyu'       // 沈听雨
  | 'luxiaoman'        // 陆小满
  | 'xiaopodi'         // 萧破敌
  | 'ayiguli'          // 阿依古丽
  | 'baiyaoxian'       // 白药仙
  | 'liusuifeng'       // 柳随风
  | 'liwushuang'       // 厉无双
  | 'huochangqing'     // 霍长青
  | 'chubaiyi'         // 楚白衣
  | 'laowei';          // 老魏

export type Faction_ID =
  | 'taixu'
  | 'tingyu'
  | 'tieqi'
  | 'yaowang'
  | 'fentian';

export type FavorDim = 'trust' | 'intimacy' | 'awe' | 'fear';

export type Element = 'sword' | 'qi' | 'fist' | 'poison';

export type CombatType = 'story' | 'encounter' | 'npc_challenge' | 'final';

// ==================== 数据结构 ====================

export interface FavorScores {
  trust: number;
  intimacy: number;
  awe: number;
  fear: number;
}

export interface NPC_Favor {
  trust: number;
  intimacy: number;
  awe: number;
  fear: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  qi: number;
  maxQi: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
}

export interface MartialArt {
  id: string;
  name: string;
  faction: Faction_ID;
  element: Element;
  type: 'attack' | 'defense' | 'support' | 'ultimate';
  target: 'single' | 'all';
  baseDamage: number;
  qiCost: number;
  effect: string | null;
  unlockCondition: string | null;
}

export interface Combatant {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  qi: number;
  maxQi: number;
  attack: number;
  defense: number;
  speed: number;
  moves: string[];
  isDefending: boolean;
  buffs: Buff[];
  debuffs: Debuff[];
}

export interface Buff {
  type: string;
  remainingTurns: number;
  value: number;
}

export interface Debuff {
  type: string;
  remainingTurns: number;
  value: number;
}

export type ScreenId = 'title' | 'game' | 'combat' | 'graph' | 'ending';

export interface GameState {
  currentDay: number;                // 1-30
  currentTimeslot: Timeslot;
  currentLocation: Location;
  playerStats: PlayerStats;
  npcFavors: Record<NPC_ID, NPC_Favor>;
  factionReputation: Record<Faction_ID, number>;
  learnedMartialArts: string[];
  equippedSkills: string[];
  flags: Set<string>;
  endingsUnlocked: string[];
  unlockedArcs: Set<string>;
}
```

**步骤 7.2 — 验证类型编译**

```bash
npx tsc -b --noEmit
```

预期输出：无错误（退出码 0）。

**步骤 7.3 — Git 提交**

```bash
git add src/engine/types.ts
git commit -m "feat(engine): add complete type definitions for game state, NPC, faction, combat and martial arts"
```

---

### Task 8: FlagEngine — 标记管理

**目标**：实现纯函数式标记管理系统（set / has / remove / clear），TDD 全覆盖。

**步骤 8.1 — 编写失败测试**

创建 `src/engine/__tests__/FlagEngine.test.ts`：

```typescript
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
```

```bash
npx vitest run src/engine/__tests__/FlagEngine.test.ts
```

预期输出：**全部失败**（FlagEngine 模块尚未实现）。

**步骤 8.2 — 实现 FlagEngine**

创建 `src/engine/FlagEngine.ts`：

```typescript
export const FlagEngine = {
  /**
   * 设置一个标记（immutable），返回新 Set
   */
  setFlag(flags: Set<string>, key: string): Set<string> {
    if (flags.has(key)) return flags;
    const next = new Set(flags);
    next.add(key);
    return next;
  },

  /**
   * 批量设置多个标记
   */
  setFlags(flags: Set<string>, keys: string[]): Set<string> {
    let next = flags;
    for (const key of keys) {
      next = this.setFlag(next, key);
    }
    return next;
  },

  /**
   * 检查标记是否存在
   */
  hasFlag(flags: Set<string>, key: string): boolean {
    return flags.has(key);
  },

  /**
   * 移除一个标记
   */
  removeFlag(flags: Set<string>, key: string): Set<string> {
    if (!flags.has(key)) return flags;
    const next = new Set(flags);
    next.delete(key);
    return next;
  },

  /**
   * 清空所有标记
   */
  clearFlags(flags: Set<string>): Set<string> {
    return new Set<string>();
  },
};
```

```bash
npx vitest run src/engine/__tests__/FlagEngine.test.ts
```

预期输出：
```
 ✓ src/engine/__tests__/FlagEngine.test.ts (10 tests) Xms
 Test Files  1 passed (1)
      Tests  10 passed (10)
```

**步骤 8.3 — Git 提交**

```bash
git add src/engine/FlagEngine.ts src/engine/__tests__/FlagEngine.test.ts
git commit -m "feat(engine): FlagEngine — immutable flag management with TDD (10 tests)"
```

---

### Task 9: FavorEngine — 好感度计算

**目标**：实现四维好感度变化 + 一念联动（ripple）+ 阈值判定，TDD 全覆盖。

**步骤 9.1 — 编写失败测试**

创建 `src/engine/__tests__/FavorEngine.test.ts`：

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { FavorEngine } from '../FavorEngine';
import { NPC_Favor, NPC_ID } from '../types';

const makeFavor = (overrides: Partial<NPC_Favor> = {}): NPC_Favor => ({
  trust: 50,
  intimacy: 30,
  awe: 20,
  fear: 5,
  ...overrides,
});

const makeFavors = (
  id: NPC_ID,
  favor: NPC_Favor,
): Record<NPC_ID, NPC_Favor> => {
  const favors: Record<string, NPC_Favor> = {};
  for (const npc of [
    'suqingheng', 'qingxuzhenren', 'shentingyu', 'luxiaoman',
    'xiaopodi', 'ayiguli', 'baiyaoxian', 'liusuifeng',
    'liwushuang', 'huochangqing', 'chubaiyi', 'laowei',
  ]) {
    favors[npc] = npc === id ? favor : makeFavor();
  }
  return favors as Record<NPC_ID, NPC_Favor>;
};

describe('FavorEngine', () => {
  describe('applyFavorChange', () => {
    it('增加信任维度', () => {
      const favors = makeFavors('suqingheng', makeFavor({ trust: 50 }));
      const result = FavorEngine.applyFavorChange(favors, 'suqingheng', {
        trust: 10,
      });
      expect(result.suqingheng.trust).toBe(60);
    });

    it('减少信任维度', () => {
      const favors = makeFavors('suqingheng', makeFavor({ trust: 50 }));
      const result = FavorEngine.applyFavorChange(favors, 'suqingheng', {
        trust: -15,
      });
      expect(result.suqingheng.trust).toBe(35);
    });

    it('好感度限制在 0-100 范围内', () => {
      const favors = makeFavors('suqingheng', makeFavor({ trust: 95 }));
      const result = FavorEngine.applyFavorChange(favors, 'suqingheng', {
        trust: 20,
      });
      expect(result.suqingheng.trust).toBe(100);
    });

    it('好感度不低于 0', () => {
      const favors = makeFavors('suqingheng', makeFavor({ trust: 5 }));
      const result = FavorEngine.applyFavorChange(favors, 'suqingheng', {
        trust: -20,
      });
      expect(result.suqingheng.trust).toBe(0);
    });

    it('同时变化多个维度', () => {
      const favors = makeFavors('suqingheng', makeFavor());
      const result = FavorEngine.applyFavorChange(favors, 'suqingheng', {
        trust: 10,
        intimacy: -5,
        awe: 8,
        fear: -3,
      });
      expect(result.suqingheng.trust).toBe(60);
      expect(result.suqingheng.intimacy).toBe(25);
      expect(result.suqingheng.awe).toBe(28);
      expect(result.suqingheng.fear).toBe(2);
    });
  });

  describe('applyRipple（一念联动）', () => {
    it('ripple 字段触发联动变化', () => {
      const favors = makeFavors('suqingheng', makeFavor({ awe: 30 }));
      const result = FavorEngine.applyFavorChange(
        favors,
        'suqingheng',
        { trust: 15 },
        { dim: 'awe', delta: -5 },
      );
      expect(result.suqingheng.trust).toBe(65);
      expect(result.suqingheng.awe).toBe(25);
    });

    it('ripple 联动同样受 0-100 限制', () => {
      const favors = makeFavors('suqingheng', makeFavor({ awe: 3 }));
      const result = FavorEngine.applyFavorChange(
        favors,
        'suqingheng',
        { trust: 10 },
        { dim: 'awe', delta: -10 },
      );
      expect(result.suqingheng.awe).toBe(0);
    });

    it('不设 ripple 时仅变化指定维度', () => {
      const favors = makeFavors('suqingheng', makeFavor({ awe: 30 }));
      const result = FavorEngine.applyFavorChange(
        favors,
        'suqingheng',
        { trust: 10 },
      );
      expect(result.suqingheng.awe).toBe(30);
    });
  });

  describe('getFavorThreshold', () => {
    it('0-20 返回 enemy', () => {
      expect(FavorEngine.getFavorThreshold(10)).toBe('enemy');
    });

    it('21-40 返回 cold', () => {
      expect(FavorEngine.getFavorThreshold(30)).toBe('cold');
    });

    it('41-60 返回 normal', () => {
      expect(FavorEngine.getFavorThreshold(50)).toBe('normal');
    });

    it('61-80 返回 friendly', () => {
      expect(FavorEngine.getFavorThreshold(70)).toBe('friendly');
    });

    it('81-100 返回 intimate', () => {
      expect(FavorEngine.getFavorThreshold(90)).toBe('intimate');
    });

    it('边界值 0 返回 enemy', () => {
      expect(FavorEngine.getFavorThreshold(0)).toBe('enemy');
    });

    it('边界值 20 返回 enemy', () => {
      expect(FavorEngine.getFavorThreshold(20)).toBe('enemy');
    });

    it('边界值 21 返回 cold', () => {
      expect(FavorEngine.getFavorThreshold(21)).toBe('cold');
    });

    it('边界值 100 返回 intimate', () => {
      expect(FavorEngine.getFavorThreshold(100)).toBe('intimate');
    });
  });

  describe('getNPCRelation', () => {
    it('四维总和 >= 140 返回 ally', () => {
      const favor = makeFavor({ trust: 70, intimacy: 70, awe: 10, fear: 5 });
      expect(FavorEngine.getNPCRelation(favor)).toBe('ally');
    });

    it('四维总和 80-139 返回 friend', () => {
      const favor = makeFavor({ trust: 40, intimacy: 30, awe: 10, fear: 5 });
      expect(FavorEngine.getNPCRelation(favor)).toBe('friend');
    });

    it('四维总和 40-79 返回 neutral', () => {
      const favor = makeFavor({ trust: 20, intimacy: 15, awe: 10, fear: 5 });
      expect(FavorEngine.getNPCRelation(favor)).toBe('neutral');
    });

    it('四维总和 < 40 返回 hostile', () => {
      const favor = makeFavor({ trust: 5, intimacy: 3, awe: 2, fear: 1 });
      expect(FavorEngine.getNPCRelation(favor)).toBe('hostile');
    });
  });

  describe('calculateFavorTotal', () => {
    it('返回四维总和', () => {
      const favor = makeFavor({ trust: 60, intimacy: 40, awe: 20, fear: 10 });
      expect(FavorEngine.calculateFavorTotal(favor)).toBe(130);
    });
  });
});
```

```bash
npx vitest run src/engine/__tests__/FavorEngine.test.ts
```

预期输出：**全部失败**（FavorEngine 模块尚未实现）。

**步骤 9.2 — 实现 FavorEngine**

创建 `src/engine/FavorEngine.ts`：

```typescript
import { NPC_Favor, NPC_ID, FavorDim } from './types';

export type FavorThreshold = 'enemy' | 'cold' | 'normal' | 'friendly' | 'intimate';

export type NPCRelation = 'hostile' | 'neutral' | 'friend' | 'ally';

export interface RippleEffect {
  dim: FavorDim;
  delta: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const FavorEngine = {
  /**
   * 对指定 NPC 应用好感度变化（immutable）
   * @param favors  当前全部 NPC 好感度
   * @param npcId   目标 NPC
   * @param changes 各维度变化量（正值增加，负值减少）
   * @param ripple  可选一念联动
   */
  applyFavorChange(
    favors: Record<NPC_ID, NPC_Favor>,
    npcId: NPC_ID,
    changes: Partial<Record<FavorDim, number>>,
    ripple?: RippleEffect,
  ): Record<NPC_ID, NPC_Favor> {
    const current = favors[npcId];
    const nextFavors = { ...favors };

    const nextFavor: NPC_Favor = {
      trust: clamp(current.trust + (changes.trust ?? 0), 0, 100),
      intimacy: clamp(current.intimacy + (changes.intimacy ?? 0), 0, 100),
      awe: clamp(current.awe + (changes.awe ?? 0), 0, 100),
      fear: clamp(current.fear + (changes.fear ?? 0), 0, 100),
    };

    // 应用一念联动
    if (ripple) {
      const rippleValue = nextFavor[ripple.dim] + ripple.delta;
      nextFavor[ripple.dim] = clamp(rippleValue, 0, 100);
    }

    nextFavors[npcId] = nextFavor;
    return nextFavors;
  },

  /**
   * 根据好感度数值判定阈值等级
   * 0-20: enemy, 21-40: cold, 41-60: normal, 61-80: friendly, 81-100: intimate
   */
  getFavorThreshold(value: number): FavorThreshold {
    const clamped = clamp(value, 0, 100);
    if (clamped <= 20) return 'enemy';
    if (clamped <= 40) return 'cold';
    if (clamped <= 60) return 'normal';
    if (clamped <= 80) return 'friendly';
    return 'intimate';
  },

  /**
   * 根据四维总和判定 NPC 关系等级
   * <40: hostile, 40-79: neutral, 80-139: friend, >=140: ally
   */
  getNPCRelation(favor: NPC_Favor): NPCRelation {
    const total = this.calculateFavorTotal(favor);
    if (total >= 140) return 'ally';
    if (total >= 80) return 'friend';
    if (total >= 40) return 'neutral';
    return 'hostile';
  },

  /**
   * 计算四维好感度总和
   */
  calculateFavorTotal(favor: NPC_Favor): number {
    return favor.trust + favor.intimacy + favor.awe + favor.fear;
  },
};
```

```bash
npx vitest run src/engine/__tests__/FavorEngine.test.ts
```

预期输出：
```
 ✓ src/engine/__tests__/FavorEngine.test.ts (18 tests) Xms
 Test Files  1 passed (1)
      Tests  18 passed (18)
```

**步骤 9.3 — Git 提交**

```bash
git add src/engine/FavorEngine.ts src/engine/__tests__/FavorEngine.test.ts
git commit -m "feat(engine): FavorEngine — four-dimension favor with ripple and threshold (18 tests)"
```

---

### Task 10: TimeEngine — 时间推进

**目标**：实现时辰切换（dawn→noon→dusk→night→次日 dawn）、气力恢复、生命恢复逻辑，TDD 全覆盖。

**步骤 10.1 — 编写失败测试**

创建 `src/engine/__tests__/TimeEngine.test.ts`：

```typescript
import { describe, it, expect } from 'vitest';
import { TimeEngine } from '../TimeEngine';
import { Timeslot, GameState, NPC_ID } from '../types';

const makeGameState = (
  overrides: Partial<GameState> = {},
): GameState => {
  const favors = {} as Record<NPC_ID, { trust: number; intimacy: number; awe: number; fear: number }>;
  for (const npc of [
    'suqingheng', 'qingxuzhenren', 'shentingyu', 'luxiaoman',
    'xiaopodi', 'ayiguli', 'baiyaoxian', 'liusuifeng',
    'liwushuang', 'huochangqing', 'chubaiyi', 'laowei',
  ]) {
    favors[npc as NPC_ID] = { trust: 50, intimacy: 30, awe: 20, fear: 5 };
  }

  return {
    currentDay: 1,
    currentTimeslot: 'dawn',
    currentLocation: 'zhongyuan',
    playerStats: {
      health: 80,
      maxHealth: 100,
      qi: 50,
      maxQi: 100,
      attack: 12,
      defense: 10,
      speed: 10,
      level: 1,
    },
    npcFavors: favors,
    factionReputation: {
      taixu: 0, tingyu: 0, tieqi: 0, yaowang: 0, fentian: 0,
    },
    learnedMartialArts: [],
    equippedSkills: [],
    flags: new Set(),
    endingsUnlocked: [],
    unlockedArcs: new Set(),
    ...overrides,
  };
};

describe('TimeEngine', () => {
  describe('getNextTimeslot', () => {
    it('dawn → noon', () => {
      expect(TimeEngine.getNextTimeslot('dawn')).toBe('noon');
    });

    it('noon → dusk', () => {
      expect(TimeEngine.getNextTimeslot('noon')).toBe('dusk');
    });

    it('dusk → night', () => {
      expect(TimeEngine.getNextTimeslot('dusk')).toBe('night');
    });

    it('night → dawn（跨天）', () => {
      expect(TimeEngine.getNextTimeslot('night')).toBe('dawn');
    });
  });

  describe('isDayBoundary', () => {
    it('night 时辰返回 true', () => {
      expect(TimeEngine.isDayBoundary('night')).toBe(true);
    });

    it('dawn 时辰返回 false', () => {
      expect(TimeEngine.isDayBoundary('dawn')).toBe(false);
    });

    it('noon 时辰返回 false', () => {
      expect(TimeEngine.isDayBoundary('noon')).toBe(false);
    });

    it('dusk 时辰返回 false', () => {
      expect(TimeEngine.isDayBoundary('dusk')).toBe(false);
    });
  });

  describe('advanceTimeslot', () => {
    it('dawn → noon，天数不变', () => {
      const state = makeGameState({ currentDay: 1, currentTimeslot: 'dawn' });
      const result = TimeEngine.advanceTimeslot(state);
      expect(result.currentTimeslot).toBe('noon');
      expect(result.currentDay).toBe(1);
    });

    it('night → dawn，天数 +1', () => {
      const state = makeGameState({ currentDay: 5, currentTimeslot: 'night' });
      const result = TimeEngine.advanceTimeslot(state);
      expect(result.currentTimeslot).toBe('dawn');
      expect(result.currentDay).toBe(6);
    });

    it('第 30 天 night → dawn，天数不超 30', () => {
      const state = makeGameState({ currentDay: 30, currentTimeslot: 'night' });
      const result = TimeEngine.advanceTimeslot(state);
      expect(result.currentDay).toBe(30);
      expect(result.currentTimeslot).toBe('dawn');
    });
  });

  describe('dawnRecovery（卯时恢复）', () => {
    it('卯时开始恢复 20 气力', () => {
      const state = makeGameState();
      state.playerStats.qi = 40;
      const result = TimeEngine.dawnRecovery(state);
      expect(result.playerStats.qi).toBe(60);
    });

    it('气力不超过 maxQi', () => {
      const state = makeGameState();
      state.playerStats.qi = 90;
      const result = TimeEngine.dawnRecovery(state);
      expect(result.playerStats.qi).toBe(100);
    });

    it('卯时恢复 10 点生命值', () => {
      const state = makeGameState();
      state.playerStats.health = 60;
      const result = TimeEngine.dawnRecovery(state);
      expect(result.playerStats.health).toBe(70);
    });

    it('生命值不超过 maxHealth', () => {
      const state = makeGameState();
      state.playerStats.health = 95;
      const result = TimeEngine.dawnRecovery(state);
      expect(result.playerStats.health).toBe(100);
    });

    it('非卯时不执行恢复', () => {
      const state = makeGameState({ currentTimeslot: 'noon' });
      state.playerStats.qi = 40;
      state.playerStats.health = 60;
      const result = TimeEngine.dawnRecovery(state);
      expect(result.playerStats.qi).toBe(40);
      expect(result.playerStats.health).toBe(60);
    });
  });

  describe('travelCost（远行消耗）', () => {
    it('计算相同区域消耗 0 时辰', () => {
      const state = makeGameState({ currentLocation: 'zhongyuan' });
      expect(TimeEngine.travelCost('zhongyuan', 'zhongyuan')).toBe(0);
    });

    it('计算相邻区域消耗 2 时辰', () => {
      // zhongyuan → jiangnan 为相邻
      expect(TimeEngine.travelCost('zhongyuan', 'jiangnan')).toBe(2);
    });

    it('计算远距离区域消耗 3 时辰', () => {
      // zhongyuan → xiyu 为远距离
      expect(TimeEngine.travelCost('zhongyuan', 'xiyu')).toBe(3);
    });
  });

  describe('getTimeslotIndex', () => {
    it('dawn 返回 0', () => {
      expect(TimeEngine.getTimeslotIndex('dawn')).toBe(0);
    });

    it('noon 返回 1', () => {
      expect(TimeEngine.getTimeslotIndex('noon')).toBe(1);
    });

    it('dusk 返回 2', () => {
      expect(TimeEngine.getTimeslotIndex('dusk')).toBe(2);
    });

    it('night 返回 3', () => {
      expect(TimeEngine.getTimeslotIndex('night')).toBe(3);
    });
  });

  describe('getTotalTimeslotsElapsed', () => {
    it('第 1 天 dawn 返回 0', () => {
      const state = makeGameState({ currentDay: 1, currentTimeslot: 'dawn' });
      expect(TimeEngine.getTotalTimeslotsElapsed(state)).toBe(0);
    });

    it('第 1 天 noon 返回 1', () => {
      const state = makeGameState({ currentDay: 1, currentTimeslot: 'noon' });
      expect(TimeEngine.getTotalTimeslotsElapsed(state)).toBe(1);
    });

    it('第 5 天 dusk 返回 18', () => {
      // (5-1)*4 + 2 = 18
      const state = makeGameState({ currentDay: 5, currentTimeslot: 'dusk' });
      expect(TimeEngine.getTotalTimeslotsElapsed(state)).toBe(18);
    });

    it('第 30 天 night 返回 119', () => {
      // (30-1)*4 + 3 = 119
      const state = makeGameState({ currentDay: 30, currentTimeslot: 'night' });
      expect(TimeEngine.getTotalTimeslotsElapsed(state)).toBe(119);
    });
  });
});
```

```bash
npx vitest run src/engine/__tests__/TimeEngine.test.ts
```

预期输出：**全部失败**。

**步骤 10.2 — 实现 TimeEngine**

创建 `src/engine/TimeEngine.ts`：

```typescript
import { Timeslot, GameState, Location } from './types';
import { TIMESLOTS } from './types';

const TIMESLOT_INDEX: Record<Timeslot, number> = {
  dawn: 0,
  noon: 1,
  dusk: 2,
  night: 3,
};

/** 区域间距离矩阵：0=相同，2=相邻，3=远距离 */
const DISTANCE_MATRIX: Record<Location, Record<Location, number>> = {
  zhongyuan: { zhongyuan: 0, jiangnan: 2, saibei: 2, shuzhong: 2, xiyu: 3 },
  jiangnan:  { zhongyuan: 2, jiangnan: 0, saibei: 3, shuzhong: 2, xiyu: 3 },
  saibei:    { zhongyuan: 2, jiangnan: 3, saibei: 0, shuzhong: 3, xiyu: 2 },
  shuzhong:  { zhongyuan: 2, jiangnan: 2, saibei: 3, shuzhong: 0, xiyu: 3 },
  xiyu:      { zhongyuan: 3, jiangnan: 3, saibei: 2, shuzhong: 3, xiyu: 0 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const TimeEngine = {
  /**
   * 获取下一个时辰
   */
  getNextTimeslot(current: Timeslot): Timeslot {
    const idx = TIMESLOT_INDEX[current];
    return TIMESLOTS[(idx + 1) % TIMESLOTS.length];
  },

  /**
   * 判断是否为跨天边界（night 时辰）
   */
  isDayBoundary(timeslot: Timeslot): boolean {
    return timeslot === 'night';
  },

  /**
   * 推进一个时辰（immutable）
   * - night → dawn 时天数 +1，但不超过 30
   */
  advanceTimeslot(state: GameState): GameState {
    const nextTimeslot = this.getNextTimeslot(state.currentTimeslot);
    const isBoundary = this.isDayBoundary(state.currentTimeslot);

    return {
      ...state,
      currentTimeslot: nextTimeslot,
      currentDay: isBoundary
        ? Math.min(state.currentDay + 1, 30)
        : state.currentDay,
    };
  },

  /**
   * 卯时开始时的恢复逻辑
   * - 气力恢复 20
   * - 生命恢复 10
   * - 非卯时不执行
   */
  dawnRecovery(state: GameState): GameState {
    if (state.currentTimeslot !== 'dawn') return state;

    const qiRecovery = 20;
    const healthRecovery = 10;

    return {
      ...state,
      playerStats: {
        ...state.playerStats,
        qi: clamp(state.playerStats.qi + qiRecovery, 0, state.playerStats.maxQi),
        health: clamp(
          state.playerStats.health + healthRecovery,
          0,
          state.playerStats.maxHealth,
        ),
      },
    };
  },

  /**
   * 计算远行所需时辰数
   * 0=相同区域，2=相邻区域，3=远距离区域
   */
  travelCost(from: Location, to: Location): number {
    return DISTANCE_MATRIX[from][to];
  },

  /**
   * 获取当前时辰在一天中的索引（0-3）
   */
  getTimeslotIndex(timeslot: Timeslot): number {
    return TIMESLOT_INDEX[timeslot];
  },

  /**
   * 计算已消耗的总时辰数（从第 1 天卯时起算）
   */
  getTotalTimeslotsElapsed(state: GameState): number {
    return (state.currentDay - 1) * 4 + TIMESLOT_INDEX[state.currentTimeslot];
  },
};
```

```bash
npx vitest run src/engine/__tests__/TimeEngine.test.ts
```

预期输出：
```
 ✓ src/engine/__tests__/TimeEngine.test.ts (16 tests) Xms
 Test Files  1 passed (1)
      Tests  16 passed (16)
```

**步骤 10.3 — Git 提交**

```bash
git add src/engine/TimeEngine.ts src/engine/__tests__/TimeEngine.test.ts
git commit -m "feat(engine): TimeEngine — timeslot advance, dawn recovery, travel cost (16 tests)"
```

---

### Task 11: EventEngine — 事件触发与条件判定

**目标**：实现 `ConditionParser`（条件 DSL 求值）+ 事件优先级排序，TDD 全覆盖。

**步骤 11.1 — 编写失败测试**

创建 `src/utils/__tests__/condition-parser.test.ts`：

```typescript
import { describe, it, expect } from 'vitest';
import { ConditionParser } from '../condition-parser';
import { GameState, NPC_ID } from '../../engine/types';

const makeGameState = (overrides: Partial<GameState> = {}): GameState => {
  const favors = {} as Record<NPC_ID, { trust: number; intimacy: number; awe: number; fear: number }>;
  for (const npc of [
    'suqingheng', 'qingxuzhenren', 'shentingyu', 'luxiaoman',
    'xiaopodi', 'ayiguli', 'baiyaoxian', 'liusuifeng',
    'liwushuang', 'huochangqing', 'chubaiyi', 'laowei',
  ]) {
    favors[npc as NPC_ID] = { trust: 50, intimacy: 30, awe: 20, fear: 5 };
  }

  return {
    currentDay: 10,
    currentTimeslot: 'noon',
    currentLocation: 'zhongyuan',
    playerStats: {
      health: 100, maxHealth: 100, qi: 80, maxQi: 100,
      attack: 15, defense: 12, speed: 10, level: 2,
    },
    npcFavors: favors,
    factionReputation: {
      taixu: 50, tingyu: 30, tieqi: 40, yaowang: 20, fentian: 10,
    },
    learnedMartialArts: ['taixu_13_swords'],
    equippedSkills: ['taixu_13_swords'],
    flags: new Set(['found_letter']),
    endingsUnlocked: [],
    unlockedArcs: new Set(),
    ...overrides,
  };
};

describe('ConditionParser', () => {
  describe('timeslot 条件', () => {
    it('当前时辰匹配时返回 true', () => {
      const state = makeGameState({ currentTimeslot: 'noon' });
      expect(ConditionParser.evaluate(state, { type: 'timeslot', value: 'noon' })).toBe(true);
    });

    it('当前时辰不匹配时返回 false', () => {
      const state = makeGameState({ currentTimeslot: 'noon' });
      expect(ConditionParser.evaluate(state, { type: 'timeslot', value: 'dawn' })).toBe(false);
    });
  });

  describe('location 条件', () => {
    it('地点匹配返回 true', () => {
      const state = makeGameState({ currentLocation: 'zhongyuan' });
      expect(ConditionParser.evaluate(state, { type: 'location', value: 'zhongyuan' })).toBe(true);
    });

    it('地点不匹配返回 false', () => {
      const state = makeGameState({ currentLocation: 'zhongyuan' });
      expect(ConditionParser.evaluate(state, { type: 'location', value: 'jiangnan' })).toBe(false);
    });
  });

  describe('day 条件', () => {
    it('day == 10，当前第 10 天，返回 true', () => {
      const state = makeGameState({ currentDay: 10 });
      expect(ConditionParser.evaluate(state, { type: 'day', op: '==', value: 10 })).toBe(true);
    });

    it('day >= 5，当前第 10 天，返回 true', () => {
      const state = makeGameState({ currentDay: 10 });
      expect(ConditionParser.evaluate(state, { type: 'day', op: '>=', value: 5 })).toBe(true);
    });

    it('day <= 5，当前第 10 天，返回 false', () => {
      const state = makeGameState({ currentDay: 10 });
      expect(ConditionParser.evaluate(state, { type: 'day', op: '<=', value: 5 })).toBe(false);
    });

    it('day > 10，当前第 10 天，返回 false', () => {
      const state = makeGameState({ currentDay: 10 });
      expect(ConditionParser.evaluate(state, { type: 'day', op: '>', value: 10 })).toBe(false);
    });

    it('day < 15，当前第 10 天，返回 true', () => {
      const state = makeGameState({ currentDay: 10 });
      expect(ConditionParser.evaluate(state, { type: 'day', op: '<', value: 15 })).toBe(true);
    });
  });

  describe('flag 条件', () => {
    it('标记存在时返回 true', () => {
      const state = makeGameState();
      expect(ConditionParser.evaluate(state, { type: 'flag', key: 'found_letter' })).toBe(true);
    });

    it('标记不存在时返回 false', () => {
      const state = makeGameState();
      expect(ConditionParser.evaluate(state, { type: 'flag', key: 'nonexistent' })).toBe(false);
    });

    it('present=false 时标记不存在返回 true', () => {
      const state = makeGameState();
      expect(
        ConditionParser.evaluate(state, { type: 'flag', key: 'nonexistent', present: false }),
      ).toBe(true);
    });

    it('present=false 时标记存在返回 false', () => {
      const state = makeGameState();
      expect(
        ConditionParser.evaluate(state, { type: 'flag', key: 'found_letter', present: false }),
      ).toBe(false);
    });
  });

  describe('favor 条件', () => {
    it('信任 >= 40，当前 50，返回 true', () => {
      const state = makeGameState();
      expect(
        ConditionParser.evaluate(state, {
          type: 'favor', npc: 'suqingheng', dim: 'trust', op: '>=', value: 40,
        }),
      ).toBe(true);
    });

    it('信任 <= 40，当前 50，返回 false', () => {
      const state = makeGameState();
      expect(
        ConditionParser.evaluate(state, {
          type: 'favor', npc: 'suqingheng', dim: 'trust', op: '<=', value: 40,
        }),
      ).toBe(false);
    });

    it('不存在的 NPC 返回 false（安全降级）', () => {
      const state = makeGameState();
      expect(
        ConditionParser.evaluate(state, {
          type: 'favor', npc: 'nonexistent' as NPC_ID, dim: 'trust', op: '>=', value: 0,
        }),
      ).toBe(false);
    });
  });

  describe('reputation 条件', () => {
    it('声望 >= 40，当前 50，返回 true', () => {
      const state = makeGameState();
      expect(
        ConditionParser.evaluate(state, {
          type: 'reputation', faction: 'taixu', op: '>=', value: 40,
        }),
      ).toBe(true);
    });

    it('声望 <= 40，当前 50，返回 false', () => {
      const state = makeGameState();
      expect(
        ConditionParser.evaluate(state, {
          type: 'reputation', faction: 'taixu', op: '<=', value: 40,
        }),
      ).toBe(false);
    });
  });

  describe('and 组合', () => {
    it('全部满足返回 true', () => {
      const state = makeGameState({ currentDay: 10, currentTimeslot: 'noon' });
      expect(
        ConditionParser.evaluate(state, {
          type: 'and',
          conditions: [
            { type: 'day', op: '==', value: 10 },
            { type: 'timeslot', value: 'noon' },
          ],
        }),
      ).toBe(true);
    });

    it('任一不满足返回 false', () => {
      const state = makeGameState({ currentDay: 10, currentTimeslot: 'noon' });
      expect(
        ConditionParser.evaluate(state, {
          type: 'and',
          conditions: [
            { type: 'day', op: '==', value: 10 },
            { type: 'timeslot', value: 'dawn' },
          ],
        }),
      ).toBe(false);
    });
  });

  describe('or 组合', () => {
    it('任一满足返回 true', () => {
      const state = makeGameState({ currentDay: 10 });
      expect(
        ConditionParser.evaluate(state, {
          type: 'or',
          conditions: [
            { type: 'day', op: '==', value: 5 },
            { type: 'day', op: '==', value: 10 },
          ],
        }),
      ).toBe(true);
    });

    it('全部不满足返回 false', () => {
      const state = makeGameState({ currentDay: 10 });
      expect(
        ConditionParser.evaluate(state, {
          type: 'or',
          conditions: [
            { type: 'day', op: '==', value: 5 },
            { type: 'day', op: '==', value: 8 },
          ],
        }),
      ).toBe(false);
    });
  });

  describe('not 组合', () => {
    it('条件为 true 时 not 返回 false', () => {
      const state = makeGameState({ currentDay: 10 });
      expect(
        ConditionParser.evaluate(state, {
          type: 'not',
          condition: { type: 'day', op: '==', value: 10 },
        }),
      ).toBe(false);
    });

    it('条件为 false 时 not 返回 true', () => {
      const state = makeGameState({ currentDay: 10 });
      expect(
        ConditionParser.evaluate(state, {
          type: 'not',
          condition: { type: 'day', op: '==', value: 5 },
        }),
      ).toBe(true);
    });
  });

  describe('嵌套组合', () => {
    it('and + or + not 嵌套', () => {
      const state = makeGameState({
        currentDay: 10,
        currentTimeslot: 'noon',
      });
      // (day==10 AND timeslot==noon) OR (NOT flag:nonexistent)
      expect(
        ConditionParser.evaluate(state, {
          type: 'or',
          conditions: [
            {
              type: 'and',
              conditions: [
                { type: 'day', op: '==', value: 10 },
                { type: 'timeslot', value: 'noon' },
              ],
            },
            {
              type: 'not',
              condition: { type: 'flag', key: 'nonexistent' },
            },
          ],
        }),
      ).toBe(true);
    });
  });
});
```

```bash
npx vitest run src/utils/__tests__/condition-parser.test.ts
```

预期输出：**全部失败**。

**步骤 11.2 — 实现 ConditionParser**

创建 `src/utils/condition-parser.ts`：

```typescript
import { GameState, NPC_ID, Faction_ID, Timeslot, Location, FavorDim } from '../engine/types';

export type Condition =
  | { type: 'timeslot'; value: Timeslot }
  | { type: 'location'; value: Location }
  | { type: 'day'; op: '>' | '>=' | '==' | '<=' | '<'; value: number }
  | { type: 'flag'; key: string; present?: boolean }
  | { type: 'favor'; npc: NPC_ID; dim: FavorDim; op: '>=' | '<=' | '>' | '<'; value: number }
  | { type: 'reputation'; faction: Faction_ID; op: '>=' | '<='; value: number }
  | { type: 'and'; conditions: Condition[] }
  | { type: 'or'; conditions: Condition[] }
  | { type: 'not'; condition: Condition };

function compare(a: number, op: string, b: number): boolean {
  switch (op) {
    case '>':  return a > b;
    case '>=': return a >= b;
    case '==': return a === b;
    case '<=': return a <= b;
    case '<':  return a < b;
    default:   return false;
  }
}

export const ConditionParser = {
  evaluate(state: GameState, condition: Condition): boolean {
    switch (condition.type) {
      case 'timeslot':
        return state.currentTimeslot === condition.value;

      case 'location':
        return state.currentLocation === condition.value;

      case 'day':
        return compare(state.currentDay, condition.op, condition.value);

      case 'flag': {
        const present = condition.present ?? true;
        const has = state.flags.has(condition.key);
        return present ? has : !has;
      }

      case 'favor': {
        const npcFavor = state.npcFavors[condition.npc];
        if (!npcFavor) return false;
        return compare(npcFavor[condition.dim], condition.op, condition.value);
      }

      case 'reputation': {
        const rep = state.factionReputation[condition.faction];
        if (rep === undefined) return false;
        return compare(rep, condition.op, condition.value);
      }

      case 'and':
        return condition.conditions.every((c) => this.evaluate(state, c));

      case 'or':
        return condition.conditions.some((c) => this.evaluate(state, c));

      case 'not':
        return !this.evaluate(state, condition.condition);

      default:
        return false;
    }
  },
};
```

```bash
npx vitest run src/utils/__tests__/condition-parser.test.ts
```

预期输出：
```
 ✓ src/utils/__tests__/condition-parser.test.ts (22 tests) Xms
 Test Files  1 passed (1)
      Tests  22 passed (22)
```

**步骤 11.3 — 编写 EventEngine 测试**

创建 `src/engine/__tests__/EventEngine.test.ts`：

```typescript
import { describe, it, expect } from 'vitest';
import { EventEngine } from '../EventEngine';
import { GameState, NPC_ID } from '../types';
import { Condition } from '../../utils/condition-parser';

interface TestEvent {
  id: string;
  type: 'story' | 'combat' | 'random' | 'ending';
  priority: number;
  trigger: {
    conditions: Condition[];
  };
}

const makeGameState = (overrides: Partial<GameState> = {}): GameState => {
  const favors = {} as Record<NPC_ID, { trust: number; intimacy: number; awe: number; fear: number }>;
  for (const npc of [
    'suqingheng', 'qingxuzhenren', 'shentingyu', 'luxiaoman',
    'xiaopodi', 'ayiguli', 'baiyaoxian', 'liusuifeng',
    'liwushuang', 'huochangqing', 'chubaiyi', 'laowei',
  ]) {
    favors[npc as NPC_ID] = { trust: 50, intimacy: 30, awe: 20, fear: 5 };
  }

  return {
    currentDay: 10,
    currentTimeslot: 'noon',
    currentLocation: 'zhongyuan',
    playerStats: {
      health: 100, maxHealth: 100, qi: 80, maxQi: 100,
      attack: 15, defense: 12, speed: 10, level: 2,
    },
    npcFavors: favors,
    factionReputation: {
      taixu: 50, tingyu: 30, tieqi: 40, yaowang: 20, fentian: 10,
    },
    learnedMartialArts: ['taixu_13_swords'],
    equippedSkills: ['taixu_13_swords'],
    flags: new Set(['found_letter']),
    endingsUnlocked: [],
    unlockedArcs: new Set(),
    ...overrides,
  };
};

describe('EventEngine', () => {
  describe('filterByConditions', () => {
    it('返回满足所有条件的事件', () => {
      const state = makeGameState();
      const events: TestEvent[] = [
        {
          id: 'event_a',
          type: 'story',
          priority: 10,
          trigger: { conditions: [{ type: 'flag', key: 'found_letter' }] },
        },
        {
          id: 'event_b',
          type: 'story',
          priority: 5,
          trigger: { conditions: [{ type: 'flag', key: 'nonexistent' }] },
        },
      ];

      const result = EventEngine.filterByConditions(state, events);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('event_a');
    });

    it('空条件列表时所有事件都通过', () => {
      const state = makeGameState();
      const events: TestEvent[] = [
        {
          id: 'event_a',
          type: 'story',
          priority: 10,
          trigger: { conditions: [] },
        },
      ];

      const result = EventEngine.filterByConditions(state, events);
      expect(result).toHaveLength(1);
    });
  });

  describe('sortByPriority', () => {
    it('按 priority 降序排列', () => {
      const events: TestEvent[] = [
        { id: 'low', type: 'story', priority: 1, trigger: { conditions: [] } },
        { id: 'high', type: 'story', priority: 100, trigger: { conditions: [] } },
        { id: 'mid', type: 'story', priority: 50, trigger: { conditions: [] } },
      ];

      const result = EventEngine.sortByPriority(events);
      expect(result.map((e) => e.id)).toEqual(['high', 'mid', 'low']);
    });

    it('相同 priority 保持原始顺序（稳定排序）', () => {
      const events: TestEvent[] = [
        { id: 'first', type: 'story', priority: 10, trigger: { conditions: [] } },
        { id: 'second', type: 'story', priority: 10, trigger: { conditions: [] } },
      ];

      const result = EventEngine.sortByPriority(events);
      expect(result.map((e) => e.id)).toEqual(['first', 'second']);
    });
  });

  describe('getTriggeredEvents', () => {
    it('返回满足条件且按优先级排序的事件', () => {
      const state = makeGameState();
      const events: TestEvent[] = [
        {
          id: 'low_priority',
          type: 'story',
          priority: 5,
          trigger: { conditions: [{ type: 'flag', key: 'found_letter' }] },
        },
        {
          id: 'high_priority',
          type: 'story',
          priority: 50,
          trigger: { conditions: [{ type: 'flag', key: 'found_letter' }] },
        },
        {
          id: 'not_triggered',
          type: 'story',
          priority: 100,
          trigger: { conditions: [{ type: 'flag', key: 'no_such_flag' }] },
        },
      ];

      const result = EventEngine.getTriggeredEvents(state, events);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('high_priority');
      expect(result[1].id).toBe('low_priority');
    });
  });
});
```

```bash
npx vitest run src/engine/__tests__/EventEngine.test.ts
```

预期输出：**失败**（EventEngine 尚未实现）。

**步骤 11.4 — 实现 EventEngine**

创建 `src/engine/EventEngine.ts`：

```typescript
import { GameState } from './types';
import { ConditionParser, Condition } from '../utils/condition-parser';

interface Triggerable {
  id: string;
  type: string;
  priority: number;
  trigger: {
    conditions: Condition[];
  };
}

export const EventEngine = {
  /**
   * 根据条件过滤事件列表
   */
  filterByConditions<T extends Triggerable>(
    state: GameState,
    events: T[],
  ): T[] {
    return events.filter((event) =>
      event.trigger.conditions.every((condition) =>
        ConditionParser.evaluate(state, condition),
      ),
    );
  },

  /**
   * 按 priority 降序排列（稳定排序）
   */
  sortByPriority<T extends Triggerable>(events: T[]): T[] {
    return [...events].sort((a, b) => b.priority - a.priority);
  },

  /**
   * 完整流程：过滤 + 排序
   */
  getTriggeredEvents<T extends Triggerable>(
    state: GameState,
    events: T[],
  ): T[] {
    const filtered = this.filterByConditions(state, events);
    return this.sortByPriority(filtered);
  },
};
```

```bash
npx vitest run src/engine/__tests__/EventEngine.test.ts
```

预期输出：
```
 ✓ src/engine/__tests__/EventEngine.test.ts (4 tests) Xms
 Test Files  1 passed (1)
      Tests  4 passed (4)
```

**步骤 11.5 — Git 提交**

```bash
git add src/utils/condition-parser.ts src/utils/__tests__/condition-parser.test.ts src/engine/EventEngine.ts src/engine/__tests__/EventEngine.test.ts
git commit -m "feat(engine): EventEngine + ConditionParser — DSL evaluation, priority sorting (26 tests)"
```

---

### Task 12: CombatEngine — 回合制战斗

**目标**：实现伤害公式（基础伤害 × 属性克制 × 气力加成 × 随机浮动）、速度排序、回合循环、胜负判定，TDD 全覆盖。

**步骤 12.1 — 编写失败测试**

创建 `src/engine/__tests__/CombatEngine.test.ts`：

```typescript
import { describe, it, expect } from 'vitest';
import { CombatEngine } from '../CombatEngine';
import { Combatant } from '../types';

const makeCombatant = (overrides: Partial<Combatant> = {}): Combatant => ({
  id: 'player',
  name: '无名少侠',
  health: 100,
  maxHealth: 100,
  qi: 80,
  maxQi: 100,
  attack: 15,
  defense: 10,
  speed: 12,
  moves: ['taixu_13_swords'],
  isDefending: false,
  buffs: [],
  debuffs: [],
  ...overrides,
});

describe('CombatEngine', () => {
  describe('calculateDamage', () => {
    it('基础伤害 × 中性属性克制 × 满气力加成', () => {
      // 基础伤害 25，属性中性 x1.0，气力 80/100 x1.2 = x0.96
      // 测试固定随机种子以保证确定性
      const damage = CombatEngine.calculateDamage({
        baseDamage: 25,
        attackerQi: 80,
        attackerMaxQi: 100,
        elementMultiplier: 1.0,
        isDefending: false,
        randomSeed: 1.0, // 不浮动
      });
      // 25 * 1.0 * (80/100 * 1.2) * 1.0 = 25 * 0.96 = 24
      expect(damage).toBe(24);
    });

    it('克制时伤害 ×1.3', () => {
      const damage = CombatEngine.calculateDamage({
        baseDamage: 25,
        attackerQi: 100,
        attackerMaxQi: 100,
        elementMultiplier: 1.3,
        isDefending: false,
        randomSeed: 1.0,
      });
      // 25 * 1.3 * 1.2 * 1.0 = 39
      expect(damage).toBe(39);
    });

    it('被克制时伤害 ×0.7', () => {
      const damage = CombatEngine.calculateDamage({
        baseDamage: 25,
        attackerQi: 100,
        attackerMaxQi: 100,
        elementMultiplier: 0.7,
        isDefending: false,
        randomSeed: 1.0,
      });
      // 25 * 0.7 * 1.2 * 1.0 = 21
      expect(damage).toBe(21);
    });

    it('防御时伤害减半', () => {
      const damage = CombatEngine.calculateDamage({
        baseDamage: 40,
        attackerQi: 100,
        attackerMaxQi: 100,
        elementMultiplier: 1.0,
        isDefending: true,
        randomSeed: 1.0,
      });
      // 40 * 1.0 * 1.2 * 0.5 = 24
      expect(damage).toBe(24);
    });

    it('气力为 0 时加成最低', () => {
      const damage = CombatEngine.calculateDamage({
        baseDamage: 30,
        attackerQi: 0,
        attackerMaxQi: 100,
        elementMultiplier: 1.0,
        isDefending: false,
        randomSeed: 1.0,
      });
      // 30 * 1.0 * (0/100 * 1.2) = 0
      expect(damage).toBe(0);
    });
  });

  describe('getElementMultiplier', () => {
    it('剑 克制 拳 → 1.3', () => {
      expect(CombatEngine.getElementMultiplier('sword', 'fist')).toBe(1.3);
    });

    it('拳 克制 毒 → 1.3', () => {
      expect(CombatEngine.getElementMultiplier('fist', 'poison')).toBe(1.3);
    });

    it('毒 克制 气 → 1.3', () => {
      expect(CombatEngine.getElementMultiplier('poison', 'qi')).toBe(1.3);
    });

    it('气 克制 剑 → 1.3', () => {
      expect(CombatEngine.getElementMultiplier('qi', 'sword')).toBe(1.3);
    });

    it('剑 被 气 克制 → 0.7', () => {
      expect(CombatEngine.getElementMultiplier('sword', 'qi')).toBe(0.7);
    });

    it('相同属性 → 1.0', () => {
      expect(CombatEngine.getElementMultiplier('sword', 'sword')).toBe(1.0);
    });
  });

  describe('sortBySpeed', () => {
    it('按速度降序排列', () => {
      const combatants = [
        makeCombatant({ id: 'slow', speed: 5 }),
        makeCombatant({ id: 'fast', speed: 20 }),
        makeCombatant({ id: 'mid', speed: 12 }),
      ];

      const result = CombatEngine.sortBySpeed(combatants);
      expect(result.map((c) => c.id)).toEqual(['fast', 'mid', 'slow']);
    });

    it('相同速度保持原始顺序', () => {
      const combatants = [
        makeCombatant({ id: 'first', speed: 10 }),
        makeCombatant({ id: 'second', speed: 10 }),
      ];

      const result = CombatEngine.sortBySpeed(combatants);
      expect(result.map((c) => c.id)).toEqual(['first', 'second']);
    });
  });

  describe('applyQiCost', () => {
    it('消耗气力后气力减少', () => {
      const combatant = makeCombatant({ qi: 80 });
      const result = CombatEngine.applyQiCost(combatant, 30);
      expect(result.qi).toBe(50);
    });

    it('气力不足时降至 0', () => {
      const combatant = makeCombatant({ qi: 20 });
      const result = CombatEngine.applyQiCost(combatant, 30);
      expect(result.qi).toBe(0);
    });
  });

  describe('checkBattleEnd', () => {
    it('玩家生命为 0 时战斗结束，玩家败', () => {
      const player = makeCombatant({ health: 0 });
      const enemy = makeCombatant({ id: 'enemy', health: 50 });
      const result = CombatEngine.checkBattleEnd(player, [enemy]);
      expect(result.ended).toBe(true);
      expect(result.victory).toBe(false);
    });

    it('全部敌人生命为 0 时战斗结束，玩家胜', () => {
      const player = makeCombatant({ health: 50 });
      const enemies = [
        makeCombatant({ id: 'enemy1', health: 0 }),
        makeCombatant({ id: 'enemy2', health: 0 }),
      ];
      const result = CombatEngine.checkBattleEnd(player, enemies);
      expect(result.ended).toBe(true);
      expect(result.victory).toBe(true);
    });

    it('玩家存活且有敌人存活时战斗未结束', () => {
      const player = makeCombatant({ health: 50 });
      const enemies = [makeCombatant({ id: 'enemy', health: 30 })];
      const result = CombatEngine.checkBattleEnd(player, enemies);
      expect(result.ended).toBe(false);
    });
  });

  describe('applyDamage', () => {
    it('扣减生命值', () => {
      const combatant = makeCombatant({ health: 100 });
      const result = CombatEngine.applyDamage(combatant, 30);
      expect(result.health).toBe(70);
    });

    it('生命值不低于 0', () => {
      const combatant = makeCombatant({ health: 20 });
      const result = CombatEngine.applyDamage(combatant, 50);
      expect(result.health).toBe(0);
    });
  });

  describe('processDefending', () => {
    it('设置 isDefending 为 true', () => {
      const combatant = makeCombatant({ isDefending: false });
      const result = CombatEngine.processDefending(combatant);
      expect(result.isDefending).toBe(true);
    });
  });

  describe('clearDefending', () => {
    it('清除所有角色的 isDefending', () => {
      const combatants = [
        makeCombatant({ id: 'a', isDefending: true }),
        makeCombatant({ id: 'b', isDefending: true }),
      ];
      const result = CombatEngine.clearDefending(combatants);
      expect(result.every((c) => c.isDefending === false)).toBe(true);
    });
  });
});
```

```bash
npx vitest run src/engine/__tests__/CombatEngine.test.ts
```

预期输出：**全部失败**。

**步骤 12.2 — 实现 CombatEngine**

创建 `src/engine/CombatEngine.ts`：

```typescript
import { Combatant, Element } from './types';

/** 克制链：剑→拳→毒→气→剑，克制 x1.3，被克制 x0.7 */
const ADVANTAGE_MAP: Record<Element, Element> = {
  sword: 'fist',
  fist: 'poison',
  poison: 'qi',
  qi: 'sword',
};

export const CombatEngine = {
  /**
   * 计算最终伤害
   * 公式：基础伤害 × 属性克制 × 气力加成 × 随机浮动
   */
  calculateDamage(params: {
    baseDamage: number;
    attackerQi: number;
    attackerMaxQi: number;
    elementMultiplier: number;
    isDefending: boolean;
    randomSeed: number; // 0.9 ~ 1.1
  }): number {
    const qiMultiplier = (params.attackerQi / params.attackerMaxQi) * 1.2;
    const defenseMultiplier = params.isDefending ? 0.5 : 1.0;
    const randomFloat = 0.9 + params.randomSeed * 0.2; // 0.9 ~ 1.1

    const raw =
      params.baseDamage *
      params.elementMultiplier *
      qiMultiplier *
      defenseMultiplier *
      randomFloat;

    return Math.floor(raw);
  },

  /**
   * 获取属性克制倍率
   * 克制: 1.3, 被克制: 0.7, 相同/无关: 1.0
   */
  getElementMultiplier(attackerElement: Element, defenderElement: Element): number {
    if (ADVANTAGE_MAP[attackerElement] === defenderElement) return 1.3;
    if (ADVANTAGE_MAP[defenderElement] === attackerElement) return 0.7;
    return 1.0;
  },

  /**
   * 按速度降序排列（稳定排序）
   */
  sortBySpeed(combatants: Combatant[]): Combatant[] {
    return [...combatants].sort((a, b) => b.speed - a.speed);
  },

  /**
   * 消耗气力（immutable）
   */
  applyQiCost(combatant: Combatant, cost: number): Combatant {
    return {
      ...combatant,
      qi: Math.max(0, combatant.qi - cost),
    };
  },

  /**
   * 检查战斗是否结束
   */
  checkBattleEnd(
    player: Combatant,
    enemies: Combatant[],
  ): { ended: boolean; victory: boolean } {
    if (player.health <= 0) {
      return { ended: true, victory: false };
    }

    const allEnemiesDefeated = enemies.every((e) => e.health <= 0);
    if (allEnemiesDefeated) {
      return { ended: true, victory: true };
    }

    return { ended: false, victory: false };
  },

  /**
   * 对角色施加伤害（immutable）
   */
  applyDamage(combatant: Combatant, damage: number): Combatant {
    return {
      ...combatant,
      health: Math.max(0, combatant.health - damage),
    };
  },

  /**
   * 设置角色为防御状态
   */
  processDefending(combatant: Combatant): Combatant {
    return {
      ...combatant,
      isDefending: true,
    };
  },

  /**
   * 清除所有角色的防御状态（回合开始时调用）
   */
  clearDefending(combatants: Combatant[]): Combatant[] {
    return combatants.map((c) => ({ ...c, isDefending: false }));
  },
};
```

```bash
npx vitest run src/engine/__tests__/CombatEngine.test.ts
```

预期输出：
```
 ✓ src/engine/__tests__/CombatEngine.test.ts (16 tests) Xms
 Test Files  1 passed (1)
      Tests  16 passed (16)
```

**步骤 12.3 — Git 提交**

```bash
git add src/engine/CombatEngine.ts src/engine/__tests__/CombatEngine.test.ts
git commit -m "feat(engine): CombatEngine — damage formula, element advantage, speed order (16 tests)"
```

---

### Task 13: EndingEngine — 结局判定

**目标**：实现 7 种结局优先级判定、互斥关系检查、触发条件求值，TDD 全覆盖。

**步骤 13.1 — 编写失败测试**

创建 `src/engine/__tests__/EndingEngine.test.ts`：

```typescript
import { describe, it, expect } from 'vitest';
import { EndingEngine } from '../EndingEngine';
import { GameState, NPC_ID } from '../types';

const makeGameState = (overrides: Partial<GameState> = {}): GameState => {
  const favors = {} as Record<NPC_ID, { trust: number; intimacy: number; awe: number; fear: number }>;
  for (const npc of [
    'suqingheng', 'qingxuzhenren', 'shentingyu', 'luxiaoman',
    'xiaopodi', 'ayiguli', 'baiyaoxian', 'liusuifeng',
    'liwushuang', 'huochangqing', 'chubaiyi', 'laowei',
  ]) {
    favors[npc as NPC_ID] = { trust: 50, intimacy: 30, awe: 20, fear: 5 };
  }

  return {
    currentDay: 30,
    currentTimeslot: 'night',
    currentLocation: 'zhongyuan',
    playerStats: {
      health: 100, maxHealth: 100, qi: 80, maxQi: 100,
      attack: 15, defense: 12, speed: 10, level: 2,
    },
    npcFavors: favors,
    factionReputation: {
      taixu: 50, tingyu: 30, tieqi: 40, yaowang: 20, fentian: 10,
    },
    learnedMartialArts: [],
    equippedSkills: [],
    flags: new Set(),
    endingsUnlocked: [],
    unlockedArcs: new Set(),
    ...overrides,
  };
};

describe('EndingEngine', () => {
  describe('ENDING_PRIORITY', () => {
    it('一念成佛优先级最高（1）', () => {
      expect(EndingEngineENDING_PRIORITY['yinian_chengfo']).toBe(1);
    });

    it('归隐山林优先级最低（7）', () => {
      expect(EndingEngineENDING_PRIORITY['guiyin_shanlin']).toBe(7);
    });

    it('共定义 7 个结局', () => {
      expect(Object.keys(EndingEngineENDING_PRIORITY)).toHaveLength(7);
    });
  });

  describe('isMutualExclusion', () => {
    it('一念成佛 与 走火入魔 互斥', () => {
      expect(
        EndingEngine.isMutualExclusion('yinian_chengfo', 'zouhuo_rumo'),
      ).toBe(true);
    });

    it('一念成佛 与 一统江湖 互斥', () => {
      expect(
        EndingEngine.isMutualExclusion('yinian_chengfo', 'yitong_jianghu'),
      ).toBe(true);
    });

    it('武林盟主 与 一统江湖 互斥', () => {
      expect(
        EndingEngine.isMutualExclusion('wulin_mengzhu', 'yitong_jianghu'),
      ).toBe(true);
    });

    it('朝廷鹰犬 与 归隐山林 互斥', () => {
      expect(
        EndingEngine.isMutualExclusion('chaoting_yingquan', 'guiyin_shanlin'),
      ).toBe(true);
    });

    it('血染长空 与任意结局不互斥', () => {
      expect(
        EndingEngine.isMutualExclusion('xueran_changkong', 'yinian_chengfo'),
      ).toBe(false);
      expect(
        EndingEngine.isMutualExclusion('xueran_changkong', 'chaoting_yingquan'),
      ).toBe(false);
    });

    it('相同结局不互斥', () => {
      expect(
        EndingEngine.isMutualExclusion('yinian_chengfo', 'yinian_chengfo'),
      ).toBe(false);
    });
  });

  describe('evaluateEndingConditions', () => {
    it('归隐山林：亲密>=80且信任>=70时返回 eligible', () => {
      const state = makeGameState({
        npcFavors: {
          ...makeGameState().npcFavors,
          suqingheng: { trust: 75, intimacy: 85, awe: 20, fear: 5 },
        },
        flags: new Set([
          'day29_choose_leave',
          'suqingheng_arc1',
          'suqingheng_arc2',
          'suqingheng_arc3',
        ]),
      });

      const result = EndingEngine.evaluateEndingConditions(state, 'guiyin_shanlin');
      expect(result.eligible).toBe(true);
    });

    it('归隐山林：亲密<80时返回 not_eligible', () => {
      const state = makeGameState({
        npcFavors: {
          ...makeGameState().npcFavors,
          suqingheng: { trust: 75, intimacy: 60, awe: 20, fear: 5 },
        },
        flags: new Set([
          'day29_choose_leave',
          'suqingheng_arc1',
          'suqingheng_arc2',
          'suqingheng_arc3',
        ]),
      });

      const result = EndingEngine.evaluateEndingConditions(state, 'guiyin_shanlin');
      expect(result.eligible).toBe(false);
    });

    it('走火入魔：学习焚天教武学>=3且接受禁术传承时 eligible', () => {
      const state = makeGameState({
        learnedMartialArts: [
          'fentian_jianjue',
          'yuhuo_chongsheng',
          'shihun_duopo',
        ],
        flags: new Set([
          'accepted_forbidden_art',
          'mind_shaken',
        ]),
        playerStats: {
          ...makeGameState().playerStats,
          maxQi: 160,
        },
      });

      const result = EndingEngine.evaluateEndingConditions(state, 'zouhuo_rumo');
      expect(result.eligible).toBe(true);
    });

    it('武林盟主：武林盟声望>=80 且太虚声望>=60 且苏青衡信任>=50', () => {
      const state = makeGameState({
        factionReputation: {
          ...makeGameState().factionReputation,
          taixu: 65,
        },
        flags: new Set([
          'alliance_ambition',
        ]),
      });

      const result = EndingEngine.evaluateEndingConditions(state, 'wulin_mengzhu');
      expect(result.eligible).toBe(true);
    });
  });

  describe('determineEnding', () => {
    it('仅满足一个结局时返回该结局', () => {
      const state = makeGameState({
        flags: new Set([
          'day29_choose_leave',
          'suqingheng_arc1',
          'suqingheng_arc2',
          'suqingheng_arc3',
        ]),
        npcFavors: {
          ...makeGameState().npcFavors,
          suqingheng: { trust: 75, intimacy: 85, awe: 20, fear: 5 },
        },
      });

      const result = EndingEngine.determineEnding(state);
      expect(result.endingId).toBe('guiyin_shanlin');
    });

    it('同时满足多个结局时返回优先级最高者', () => {
      // 满足归隐山林 + 武林盟主 → 应该返回优先级更高的那个
      // 归隐山林 priority=7, 武林盟主 priority=6
      // 武林盟主优先级更高（数字更小）
      const state = makeGameState({
        factionReputation: {
          ...makeGameState().factionReputation,
          taixu: 65,
        },
        npcFavors: {
          ...makeGameState().npcFavors,
          suqingheng: { trust: 80, intimacy: 85, awe: 20, fear: 5 },
        },
        flags: new Set([
          'day29_choose_leave',
          'suqingheng_arc1',
          'suqingheng_arc2',
          'suqingheng_arc3',
          'alliance_ambition',
        ]),
      });

      const result = EndingEngine.determineEnding(state);
      expect(result.endingId).toBe('wulin_mengzhu');
    });

    it('互斥结局自动排除低优先级者', () => {
      // 同时满足一念成佛（priority 1）和走火入魔（priority 3）
      // 它们互斥，应返回一念成佛
      const state = makeGameState({
        learnedMartialArts: [
          'fentian_jianjue',
          'yuhuo_chongsheng',
          'shihun_duopo',
        ],
        playerStats: {
          ...makeGameState().playerStats,
          maxQi: 160,
          qi: 120,
        },
        npcFavors: {
          ...makeGameState().npcFavors,
          suqingheng: { trust: 80, intimacy: 80, awe: 10, fear: 5 },
        },
        flags: new Set([
          'completed_blood_rain_truth',
          'qingxu_forgive',
          'liwushuang_no_revenge',
          'accepted_forbidden_art',
          'mind_shaken',
          'no_forbidden_used', // 但这个与 accepted_forbidden_art 矛盾
        ]),
      });

      const result = EndingEngine.determineEnding(state);
      // 走火入魔条件优先被满足（因为有禁术标记），互斥使一念成佛排除
      expect(result.endingId).toBe('zouhuo_rumo');
    });

    it('无结局满足时返回 default_ending（归隐山林）', () => {
      const state = makeGameState({
        flags: new Set(), // 无任何结局标记
        npcFavors: {
          ...makeGameState().npcFavors,
          suqingheng: { trust: 50, intimacy: 30, awe: 20, fear: 5 },
        },
      });

      const result = EndingEngine.determineEnding(state);
      expect(result.endingId).toBe('guiyin_shanlin');
    });
  });
});

// 导出用于测试的常量
import { EndingEngine as EndingEngineImpl } from '../EndingEngine';
const EndingEngineENDING_PRIORITY = EndingEngineImpl.ENDING_PRIORITY;
```

```bash
npx vitest run src/engine/__tests__/EndingEngine.test.ts
```

预期输出：**全部失败**。

**步骤 13.2 — 实现 EndingEngine**

创建 `src/engine/EndingEngine.ts`：

```typescript
import { GameState } from './types';

export type EndingId =
  | 'yinian_chengfo'
  | 'xueran_changkong'
  | 'zouhuo_rumo'
  | 'yitong_jianghu'
  | 'chaoting_yingquan'
  | 'wulin_mengzhu'
  | 'guiyin_shanlin';

export interface EndingResult {
  endingId: EndingId;
  eligible: boolean;
}

/** 互斥关系表（无向） */
const MUTUAL_EXCLUSIONS: ReadonlySet<string> = new Set([
  'yinian_chengfo|zouhuo_rumo',
  'zouhuo_rumo|yinian_chengfo',
  'yinian_chengfo|yitong_jianghu',
  'yitong_jianghu|yinian_chengfo',
  'wulin_mengzhu|yitong_jianghu',
  'yitong_jianghu|wulin_mengzhu',
  'chaoting_yingquan|guiyin_shanlin',
  'guiyin_shanlin|chaoting_yingquan',
]);

function hasFlag(flags: Set<string>, key: string): boolean {
  return flags.has(key);
}

function anyNpcFavorAbove(
  favors: GameState['npcFavors'],
  dim: 'trust' | 'intimacy' | 'awe' | 'fear',
  threshold: number,
): boolean {
  return Object.values(favors).some((f) => f[dim] >= threshold);
}

function countNpcFavorAbove(
  favors: GameState['npcFavors'],
  dim: 'trust' | 'intimacy' | 'awe' | 'fear',
  threshold: number,
): number {
  return Object.values(favors).filter((f) => f[dim] >= threshold).length;
}

function sumNpcFavor(
  favors: GameState['npcFavors'],
  dim: 'trust' | 'intimacy' | 'awe' | 'fear',
  npcIds: string[],
): number {
  return npcIds.reduce((sum, id) => {
    const npcFavor = favors[id as keyof typeof favors];
    return sum + (npcFavor ? npcFavor[dim] : 0);
  }, 0);
}

export const EndingEngine = {
  /** 结局优先级（1 = 最高） */
  ENDING_PRIORITY: {
    yinian_chengfo: 1,
    xueran_changkong: 2,
    zouhuo_rumo: 3,
    yitong_jianghu: 4,
    chaoting_yingquan: 5,
    wulin_mengzhu: 6,
    guiyin_shanlin: 7,
  } as Record<EndingId, number>,

  /** 检查两个结局是否互斥 */
  isMutualExclusion(a: EndingId, b: EndingId): boolean {
    if (a === b) return false;
    return MUTUAL_EXCLUSIONS.has(`${a}|${b}`);
  },

  /** 评估单个结局的触发条件 */
  evaluateEndingConditions(
    state: GameState,
    endingId: EndingId,
  ): { eligible: boolean; reason?: string } {
    const { npcFavors, flags, factionReputation, learnedMartialArts, playerStats } = state;

    switch (endingId) {
      case 'guiyin_shanlin': {
        // 条件：任一 NPC 亲密>=80 且 信任>=70，第29天选择离开，至少触发3个该NPC个人剧情
        const hasCandidate = Object.values(npcFavors).some(
          (f) => f.intimacy >= 80 && f.trust >= 70,
        );
        const choseLeave = hasFlag(flags, 'day29_choose_leave');
        const hasThreeArcs = hasFlag(flags, 'suqingheng_arc1')
          || hasFlag(flags, 'shentingyu_arc1')
          || hasFlag(flags, 'chubaiyi_arc1')
          || hasFlag(flags, 'luxiaoman_arc1')
          || hasFlag(flags, 'liusuifeng_arc1');
        return {
          eligible: hasCandidate && choseLeave && hasThreeArcs,
          reason: !hasCandidate
            ? '无 NPC 亲密>=80 且信任>=70'
            : !choseLeave
              ? '未选择离开'
              : '个人剧情不足',
        };
      }

      case 'wulin_mengzhu': {
        // 武林盟声望>=80，太虚声望>=60，苏青衡信任>=50，第25天选择参选
        const allianceRep = (factionReputation as Record<string, number>)['alliance'] ?? 0;
        const taixuRep = factionReputation.taixu;
        const suTrust = npcFavors.suqingheng?.trust ?? 0;
        const choseCandidate = hasFlag(flags, 'alliance_ambition');
        return {
          eligible:
            allianceRep >= 80 &&
            taixuRep >= 60 &&
            suTrust >= 50 &&
            choseCandidate,
          reason:
            allianceRep < 80
              ? '武林盟声望不足'
              : taixuRep < 60
                ? '太虚声望不足'
                : suTrust < 50
                  ? '苏青衡信任不足'
                  : '未选择参选',
        };
      }

      case 'yitong_jianghu': {
        // 敬畏>=70 或 忌惮>=70 的数量>=5，击败3个门派NPC，霍长青合作线
        const highAwe = countNpcFavorAbove(npcFavors, 'awe', 70);
        const highFear = countNpcFavorAbove(npcFavors, 'fear', 70);
        const intimidateCount = highAwe + highFear;
        const defeatedFactions = learnedMartialArts.filter((m) =>
          m.startsWith('defeated_'),
        ).length;
        const huoCoop = hasFlag(flags, 'huo_cooperation');
        return {
          eligible: intimidateCount >= 5 && defeatedFactions >= 3 && huoCoop,
          reason:
            intimidateCount < 5
              ? '敬畏/忌惮 NPC 不足5人'
              : defeatedFactions < 3
                ? '未击败3个门派'
                : '未与霍长青合作',
        };
      }

      case 'chaoting_yingquan': {
        // 朝廷声望>=70，楚白衣合作关系，配合影司
        const courtRep = (factionReputation as Record<string, number>)['court'] ?? 0;
        const chuCoop = hasFlag(flags, 'chu_cooperation');
        const cooperateShadow = hasFlag(flags, 'shadow_cooperate');
        return {
          eligible: courtRep >= 70 && chuCoop && cooperateShadow,
          reason:
            courtRep < 70
              ? '朝廷声望不足'
              : !chuCoop
                ? '未与楚白衣维持合作'
                : '未配合影司',
        };
      }

      case 'zouhuo_rumo': {
        // 焚天教武学>=3，接受禁术传承，气力上限>=150，心智动摇
        const fentianMoves = learnedMartialArts.filter(
          (m) => m.startsWith('fentian_'),
        ).length;
        const acceptedArt = hasFlag(flags, 'accepted_forbidden_art');
        const qiMax = playerStats.maxQi;
        const mindShaken = hasFlag(flags, 'mind_shaken');
        return {
          eligible:
            fentianMoves >= 3 && acceptedArt && qiMax >= 150 && mindShaken,
          reason:
            fentianMoves < 3
              ? '焚天教武学不足3招'
              : !acceptedArt
                ? '未接受禁术传承'
                : qiMax < 150
                  ? '气力上限不足150'
                  : '未触发心智动摇',
        };
      }

      case 'xueran_changkong': {
        // 苏青衡+萧破敌+楚白衣信任总和>=200，独自面对，气力<=30
        const trustSum =
          sumNpcFavor(npcFavors, 'trust', [
            'suqingheng',
            'xiaopodi',
            'chubaiyi',
          ]);
        const faceAlone = hasFlag(flags, 'face_shadow_alone');
        const qiLow = playerStats.qi <= 30;
        return {
          eligible: trustSum >= 200 && faceAlone && qiLow,
          reason:
            trustSum < 200
              ? '三名NPC信任总和不足200'
              : !faceAlone
                ? '未选择独自面对'
                : '气力未低于30',
        };
      }

      case 'yinian_chengfo': {
        // 完成身世主线，最高NPC信任+亲密>=140，原谅清虚，不追究厉无双，气力>=100，未用禁术
        const completedTruth = hasFlag(flags, 'completed_blood_rain_truth');
        const qingxuForgive = hasFlag(flags, 'qingxu_forgive');
        const liNoRevenge = hasFlag(flags, 'liwushuang_no_revenge');
        const qiHigh = playerStats.qi >= 100;
        const noForbidden = !hasFlag(flags, 'accepted_forbidden_art');
        const noShadow = !hasFlag(flags, 'shadow_power_used');

        // 找到信任+亲密总和最高的 NPC
        let maxSum = 0;
        for (const f of Object.values(npcFavors)) {
          const sum = f.trust + f.intimacy;
          if (sum > maxSum) maxSum = sum;
        }

        return {
          eligible:
            completedTruth &&
            maxSum >= 140 &&
            qingxuForgive &&
            liNoRevenge &&
            qiHigh &&
            noForbidden &&
            noShadow,
          reason: !completedTruth
            ? '未完成身世主线'
            : maxSum < 140
              ? '最高NPC信任+亲密不足140'
              : !qingxuForgive
                ? '未原谅清虚真人'
                : !liNoRevenge
                  ? '未选择不追究厉无双'
                  : !qiHigh
                    ? '气力不足100'
                    : '使用过禁术或影司力量',
        };
      }

      default:
        return { eligible: false, reason: '未知结局' };
    }
  },

  /**
   * 确定最终结局
   * 1. 评估所有结局条件
   * 2. 过滤互斥（高优先级保留）
   * 3. 按优先级取最高
   * 4. 无满足则返回默认结局（归隐山林）
   */
  determineEnding(state: GameState): { endingId: EndingId; reason: string } {
    const endingIds = Object.keys(this.ENDING_PRIORITY) as EndingId[];

    // 评估所有结局条件
    const evaluated = endingIds.map((id) => ({
      id,
      ...this.evaluateEndingConditions(state, id),
      priority: this.ENDING_PRIORITY[id],
    }));

    // 过滤出满足条件的结局
    const eligible = evaluated.filter((e) => e.eligible);

    if (eligible.length === 0) {
      return {
        endingId: 'guiyin_shanlin',
        reason: '无结局条件满足，进入默认结局',
      };
    }

    // 按优先级排序（数字越小优先级越高）
    eligible.sort((a, b) => a.priority - b.priority);

    // 依次处理互斥：从最高优先级开始，排除与之互斥的低优先级结局
    const final: typeof eligible = [];
    for (const candidate of eligible) {
      const hasConflict = final.some((accepted) =>
        this.isMutualExclusion(candidate.id, accepted.id),
      );
      if (!hasConflict) {
        final.push(candidate);
      }
    }

    const winner = final[0];
    return {
      endingId: winner.id,
      reason: `满足条件，优先级 ${winner.priority}`,
    };
  },
};
```

```bash
npx vitest run src/engine/__tests__/EndingEngine.test.ts
```

预期输出：
```
 ✓ src/engine/__tests__/EndingEngine.test.ts (12 tests) Xms
 Test Files  1 passed (1)
      Tests  12 passed (12)
```

**步骤 13.3 — Git 提交**

```bash
git add src/engine/EndingEngine.ts src/engine/__tests__/EndingEngine.test.ts
git commit -m "feat(engine): EndingEngine — 7 endings with priority, mutual exclusion, condition evaluation (12 tests)"
```

---

## Phase 1 + Phase 2 最终验证

```bash
npm run lint && npx tsc -b --noEmit && npm run build && npx vitest run
```

预期输出：
```
ESLint: 0 problems
TypeScript: 0 errors
Vite build: ✓ built in X.XXs
Vitest: X tests passed (X test files)
```

**Git 提交历史（Phase 1 + Phase 2）：**

```
Phase 1:
1. chore: initialize Vite + React + TypeScript + Vitest project
2. chore: create project directory structure with placeholder files
3. chore: configure TypeScript strict mode with all strict checks enabled
4. chore: add ESLint (flat config) and Prettier with strict rules
5. feat: add complete CSS variable system, typography, scroll-frame components and animations from art-style spec
6. feat: add ScreenRouter with Zustand store and 5 screen placeholders

Phase 2:
7. feat(engine): add complete type definitions for game state, NPC, faction, combat and martial arts
8. feat(engine): FlagEngine — immutable flag management with TDD (10 tests)
9. feat(engine): FavorEngine — four-dimension favor with ripple and threshold (18 tests)
10. feat(engine): TimeEngine — timeslot advance, dawn recovery, travel cost (16 tests)
11. feat(engine): EventEngine + ConditionParser — DSL evaluation, priority sorting (26 tests)
12. feat(engine): CombatEngine — damage formula, element advantage, speed order (16 tests)
13. feat(engine): EndingEngine — 7 endings with priority, mutual exclusion, condition evaluation (12 tests)
```

**测试总数统计：**

| Task | 模块 | 测试数 |
|------|------|--------|
| Task 8 | FlagEngine | 10 |
| Task 9 | FavorEngine | 18 |
| Task 10 | TimeEngine | 16 |
| Task 11 | ConditionParser + EventEngine | 26 |
| Task 12 | CombatEngine | 16 |
| Task 13 | EndingEngine | 12 |
| Task 5 | CSS 变量 | 6 |
| Task 6 | ScreenRouter | 5 |
| **合计** | | **109** |
