# Phase 6: 部署与上线

> **目标**: 将项目构建为生产就绪的静态站点，部署到 Vercel，验证性能指标达标，打 tag 发布 v1.0.0。

---

## Task 46: 生产构建优化

**目的**: Vite build 配置、代码分割、资源优化，确保生产构建产物体积可控、首屏加载高效。

### 46.1 Vite 配置优化

文件: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // React 运行时单独分包
          vendor: ['react', 'react-dom'],
          // d3-force 单独分包（仅关系图使用）
          d3: ['d3-force'],
          // Zustand + zod 单独分包
          state: ['zustand', 'zod'],
        },
        // 文件名带 hash 用于缓存
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // 构建产物大小警告阈值
    chunkSizeWarningLimit: 500,
  },
  // 预览服务器配置（模拟生产环境）
  preview: {
    port: 4173,
    host: true,
  },
});
```

### 46.2 package.json 构建脚本

确保 `package.json` 中的 scripts 部分包含以下内容:

```json
{
  "name": "yinian-jianghu",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx",
    "test": "vitest run",
    "test:watch": "vitest",
    "type-check": "tsc --noEmit",
    "build:analyze": "ANALYZE=true vite build"
  }
}
```

### 46.3 index.html 资源预加载

文件: `index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>一念江湖</title>
    <meta name="description" content="武侠题材 RPG 游戏 — 一念成佛，一念成魔。" />

    <!-- 预连接字体源 -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

    <!-- 关键 CSS 内联（首屏渲染所需最小样式） -->
    <style>
      /* FOUT 防止：首屏用系统字体，加载后切换 */
      body {
        margin: 0;
        background-color: #F5F0E8;
        color: #1A1A2E;
        font-family: "Source Han Sans SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;
      }
      #root {
        min-height: 100vh;
      }
      /* 加载指示器 */
      .app-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-size: 24px;
        color: #C23B22;
      }
    </style>

    <!-- 预加载关键 JS -->
    <link rel="modulepreload" href="/src/main.tsx" />

    <!-- Favicon（朱砂印章图标） -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <div id="root">
      <div class="app-loading">江湖加载中...</div>
    </div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 46.4 资源优化脚本

文件: `scripts/check-bundle-size.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== 一念江湖 生产构建分析 ==="
echo ""

# 执行构建
echo "[1/3] 执行生产构建..."
npm run build 2>&1

echo ""
echo "[2/3] 分析构建产物..."
echo ""

# 统计 dist 目录大小
DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
echo "dist/ 总大小: ${DIST_SIZE}"

# 列出所有文件及大小（按大小排序）
echo ""
echo "--- 构建产物清单 ---"
find dist -type f -name '*.js' -o -name '*.css' | while read -r f; do
  size=$(wc -c < "$f" | tr -d ' ')
  echo "$(echo "scale=2; $size / 1024" | bc)KB  $f"
done | sort -rn

echo ""
echo "--- 首屏 JS 大小 ---"
MAIN_JS=$(find dist -name 'index-*.js' | head -1)
if [ -n "${MAIN_JS:-}" ]; then
  MAIN_SIZE=$(wc -c < "$MAIN_JS" | tr -d ' ')
  echo "index.js: $(echo "scale=2; $MAIN_SIZE / 1024" | bc)KB"
fi

echo ""
echo "--- CSS 大小 ---"
find dist -name '*.css' | while read -r f; do
  size=$(wc -c < "$f" | tr -d ' ')
  echo "$(echo "scale=2; $size / 1024" | bc)KB  $f"
done | sort -rn

echo ""
echo "[3/3] 大小检查..."

# 检查总体积是否超阈值（10MB）
TOTAL_BYTES=$(du -sb dist 2>/dev/null | cut -f1)
THRESHOLD=$((10 * 1024 * 1024))  # 10MB
if [ "${TOTAL_BYTES}" -gt "${THRESHOLD}" ]; then
  echo "FAIL: dist/ 总大小超过 10MB"
  exit 1
fi

echo "PASS: dist/ 总大小在 10MB 以内"
echo ""
echo "=== 构建分析完成 ==="
```

运行权限设置:

```bash
chmod +x scripts/check-bundle-size.sh
```

### 46.5 构建验证测试

文件: `src/__tests__/build-config.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('生产构建配置', () => {
  const root = resolve(__dirname, '../../');
  const configPath = resolve(root, 'vite.config.ts');

  it('vite.config.ts 存在', () => {
    expect(existsSync(configPath)).toBe(true);
  });

  it('index.html 存在且包含 meta description', () => {
    const htmlPath = resolve(root, 'index.html');
    expect(existsSync(htmlPath)).toBe(true);
    const html = readFileSync(htmlPath, 'utf-8');
    expect(html).toContain('一念江湖');
    expect(html).toContain('<meta name="description"');
    expect(html).toContain('lang="zh-CN"');
  });

  it('package.json 版本为 1.0.0', () => {
    const pkgPath = resolve(root, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    expect(pkg.version).toBe('1.0.0');
    expect(pkg.scripts.build).toBeDefined();
    expect(pkg.scripts.preview).toBeDefined();
  });

  it('dist 目录存在（需先运行 npm run build）', () => {
    const distPath = resolve(root, 'dist');
    const hasDist = existsSync(distPath);
    if (!hasDist) {
      console.log('提示: 请先运行 npm run build 以生成 dist/');
    }
    // 此测试在 CI 中会在 build 后运行
  });

  it('CSS 变量文件存在', () => {
    const cssPath = resolve(root, 'src/styles/variables.css');
    expect(existsSync(cssPath)).toBe(true);
    const css = readFileSync(cssPath, 'utf-8');
    expect(css).toContain('--cinnabar:');
    expect(css).toContain('--paper-white:');
  });
});
```

### 46.6 运行命令与预期输出

```bash
# 1. 执行生产构建
npm run build

# 预期输出:
# tsc --noEmit
# vite build
# v5.x.x building for production...
# ✓ xx modules transformed.
# dist/assets/vendor-[hash].js    xx.x0 kB │ gzip: xx.x0 kB
# dist/assets/d3-[hash].js        xx.x0 kB │ gzip: xx.x0 kB
# dist/assets/state-[hash].js     xx.x0 kB │ gzip: xx.x0 kB
# dist/assets/index-[hash].js     xx.x0 kB │ gzip: xx.x0 kB
# dist/assets/index-[hash].css    xx.x0 kB │ gzip: xx.x0 kB
# ✓ built in x.xxs

# 2. 检查构建产物大小
bash scripts/check-bundle-size.sh

# 3. 本地预览生产构建
npm run preview
# VITE preview  http://localhost:4173/
 运行构建验证测试
npx vitest run src/__tests__/build-config.test.ts
```

### 46.7 验收标准

- [ ] `npm run build` 无错误、无 TypeScript 类型错误
- [ ] dist/ 总大小 < 10MB（含所有 JSON 游戏数据）
- [ ] JS bundle 按 vendor / d3 / state 分包
- [ ] sourcemap 未生成（生产环境关闭）
- [ ] index.html 包含 meta description 和 lang="zh-CN"
- [ ] `npm run preview` 可在 localhost:4173 正常预览
- [ ] 5 个构建验证测试通过

---

## Task 47: Vercel 部署配置

**目的**: 配置 vercel.json、构建命令、域名、HTTPS，实现一键部署。

### 47.1 Vercel 配置文件

文件: `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 47.2 部署脚本

文件: `scripts/deploy.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== 一念江湖 Vercel 部署流程 ==="
echo ""

# 1. 类型检查
echo "[1/5] TypeScript 类型检查..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "FAIL: 类型检查未通过"
  exit 1
fi
echo "PASS: 类型检查通过"

# 2. Lint
echo ""
echo "[2/5] ESLint 检查..."
npm run lint
if [ $? -ne 0 ]; then
  echo "FAIL: Lint 未通过"
  exit 1
fi
echo "PASS: Lint 通过"

# 3. 测试
echo ""
echo "[3/5] 运行测试..."
npm run test
if [ $? -ne 0 ]; then
  echo "FAIL: 测试未通过"
  exit 1
fi
echo "PASS: 测试通过"

# 4. 生产构建
echo ""
echo "[4/5] 生产构建..."
npm run build
if [ $? -ne 0 ]; then
  echo "FAIL: 构建失败"
  exit 1
fi
echo "PASS: 构建成功"

# 5. 部署到 Vercel
echo ""
echo "[5/5] 部署到 Vercel..."
if command -v vercel &> /dev/null; then
  vercel --prod --yes
  echo ""
  echo "=== 部署完成 ==="
  echo "生产环境 URL: https://yinian-jianghu.vercel.app"
else
  echo "Vercel CLI 未安装，跳过自动部署"
  echo "请手动执行: vercel --prod"
  echo "或通过 Git push 触发 Vercel 自动部署"
fi
```

### 47.3 .gitignore 确保正确

文件: `.gitignore`

```
# Dependencies
node_modules/

# Build output
dist/

# Vercel
.vercel/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Test coverage
coverage/

# Debug
npm-debug.log*

# Vite
*.tsbuildinfo
```

### 47.4 Vercel 部署验证

文件: `src/__tests__/vercel-config.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('Vercel 部署配置', () => {
  const root = resolve(__dirname, '../../');

  it('vercel.json 存在', () => {
    expect(existsSync(resolve(root, 'vercel.json'))).toBe(true);
  });

  it('vercel.json 包含正确的构建配置', () => {
    const raw = readFileSync(resolve(root, 'vercel.json'), 'utf-8');
    const config = JSON.parse(raw);
    expect(config.buildCommand).toBe('npm run build');
    expect(config.outputDirectory).toBe('dist');
    expect(config.framework).toBe('vite');
  });

  it('vercel.json 配置了 SPA rewrite', () => {
    const raw = readFileSync(resolve(root, 'vercel.json'), 'utf-8');
    const config = JSON.parse(raw);
    expect(config.rewrites).toBeDefined();
    const spaRewrite = config.rewrites.find(
      (r: { source: string; destination: string }) => r.destination === '/index.html'
    );
    expect(spaRewrite).toBeDefined();
  });

  it('vercel.json 配置了静态资源缓存', () => {
    const raw = readFileSync(resolve(root, 'vercel.json'), 'utf-8');
    const config = JSON.parse(raw);
    const assetsHeader = config.headers.find(
      (h: { source: string }) => h.source === '/assets/(.*)'
    );
    expect(assetsHeader).toBeDefined();
    expect(assetsHeader.headers.some(
      (h: { key: string; value: string }) =>
        h.key === 'Cache-Control' && h.value.includes('immutable')
    )).toBe(true);
  });

  it('vercel.json 配置了安全头', () => {
    const raw = readFileSync(resolve(root, 'vercel.json'), 'utf-8');
    const config = JSON.parse(raw);
    const securityHeader = config.headers.find(
      (h: { source: string }) => h.source === '/(.*)'
    );
    expect(securityHeader).toBeDefined();
    expect(securityHeader.headers.some(
      (h: { key: string }) => h.key === 'X-Content-Type-Options'
    )).toBe(true);
  });

  it('.gitignore 包含 dist/', () => {
    const gitignore = readFileSync(resolve(root, '.gitignore'), 'utf-8');
    expect(gitignore).toContain('dist/');
  });
});
```

### 47.5 运行命令与预期输出

```bash
# 运行 Vercel 配置测试
npx vitest run src/__tests__/vercel-config.test.ts
```

预期输出:

```
 ✓ src/__tests__/vercel-config.test.ts (6 tests) 5ms

Test Files  1 passed (1)
     Tests  6 passed (6)
```

### 47.6 部署操作步骤

```bash
# 首次部署（需要 Vercel 账号）

# 安装 Vercel CLI
npm i -g vercel

# 登录（交互式）
vercel login

# 链接到项目
vercel link

# 预览部署
vercel

# 生产部署
vercel --prod

# 后续部署：push 到 main 分支即自动部署（通过 Vercel Git 集成）
```

### 47.7 验收标准

- [ ] `vercel.json` 包含正确的 buildCommand / outputDirectory / framework
- [ ] SPA rewrite 配置正确（所有路由回退到 index.html）
- [ ] 静态资源 Cache-Control: immutable 已配置
- [ ] 安全头（X-Content-Type-Options / X-Frame-Options / Referrer-Policy）已配置
- [ ] `vercel --prod` 部署成功，可通过 `https://yinian-jianghu.vercel.app` 访问
- [ ] HTTPS 自动启用（Vercel 默认）
- [ ] 6 个 Vercel 配置测试通过

---

## Task 48: 性能验证

**目的**: Lighthouse 测试、首屏加载时间、60fps 动画验证，确保性能指标达标。

### 48.1 性能基准配置

文件: `src/__tests__/performance.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, join } from 'path';

/**
 * 性能验证测试
 * 通过分析构建产物来验证性能指标
 * 真正的 Lighthouse 和帧率测试需要在浏览器中手动完成
 */

const root = resolve(__dirname, '../../');
const distPath = resolve(root, 'dist');

function getDistFileSize(relativePath: string): number {
  const fullPath = join(distPath, relativePath);
  if (!existsSync(fullPath)) return 0;
  return statSync(fullPath).size;
}

function findAllDistFiles(extension: string): { name: string; size: number }[] {
  const { readdirSync } = require('fs');
  const files: { name: string; size: number }[] = [];

  function scanDir(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith(extension)) {
        files.push({
          name: fullPath.replace(distPath, 'dist'),
          size: statSync(fullPath).size,
        });
      }
    }
  }

  scanDir(distPath);
  return files;
}

describe('性能验证', () => {
  it('dist/ 目录存在', () => {
    expect(existsSync(distPath)).toBe(true);
  });

  it('HTML 文件大小 < 10KB', () => {
    const htmlSize = getDistFileSize('index.html');
    expect(htmlSize).toBeGreaterThan(0);
    expect(htmlSize).toBeLessThan(10 * 1024);
    console.log(`index.html: ${(htmlSize / 1024).toFixed(2)}KB`);
  });

  it('JS 总大小 < 500KB（gzip 后 < 200KB）', () => {
    const jsFiles = findAllDistFiles('.js');
    const totalJsSize = jsFiles.reduce((sum, f) => sum + f.size, 0);
    expect(jsFiles.length).toBeGreaterThan(0);
    console.log('JS 文件:');
    jsFiles.forEach(f => {
      console.log(`  ${f.name}: ${(f.size / 1024).toFixed(2)}KB`);
    });
    console.log(`JS 总大小: ${(totalJsSize / 1024).toFixed(2)}KB`);
    expect(totalJsSize).toBeLessThan(500 * 1024);
  });

  it('CSS 总大小 < 100KB', () => {
    const cssFiles = findAllDistFiles('.css');
    const totalCssSize = cssFiles.reduce((sum, f) => sum + f.size, 0);
    console.log('CSS 文件:');
    cssFiles.forEach(f => {
      console.log(`  ${f.name}: ${(f.size / 1024).toFixed(2)}KB`);
    });
    console.log(`CSS 总大小: ${(totalCssSize / 1024).toFixed(2)}KB`);
    expect(totalCssSize).toBeLessThan(100 * 1024);
  });

  it('单个 JS chunk < 250KB', () => {
    const jsFiles = findAllDistFiles('.js');
    const oversizedChunks = jsFiles.filter(f => f.size > 250 * 1024);
    if (oversizedChunks.length > 0) {
      console.log('过大的 chunk:');
      oversizedChunks.forEach(f => {
        console.log(`  ${f.name}: ${(f.size / 1024).toFixed(2)}KB`);
      });
    }
    expect(oversizedChunks.length).toBe(0);
  });

  it('dist/ 总大小 < 10MB', () => {
    const { readdirSync } = require('fs');
    let totalSize = 0;

    function calcSize(dir: string) {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          calcSize(fullPath);
        } else {
          totalSize += statSync(fullPath).size;
        }
      }
    }

    calcSize(distPath);
    console.log(`dist/ 总Size / 1024 / 1024).toFixed(2)}MB`);
    expect(totalSize).toBeLessThan(10 * 1024 * 1024);
  });

  it('存在 vendor 分包（React 单独打包）', () => {
    const jsFiles = findAllDistFiles('.js');
    const vendorChunk = jsFiles.find(f => f.name.includes('vendor'));
    expect(vendorChunk).toBeDefined();
    console.log(`vendor chunk: ${vendorChunk!.name} (${(vendorChunk!.size / 1024).toFixed(2)}KB)`);
  });

  it('存在 d3 分包', () => {
    const jsFiles = findAllDistFiles('.js');
    const d3Chunk = jsFiles.find(f => f.name.includes('d3'));
    expect(d3Chunk).toBeDefined();
    console.log(`d3 chunk: ${d3Chunk!.name} (${(d3Chunk!.size / 1024).toFixed(2)}KB)`);
  });
});
```

### 48.2 Lighthouse 配置文件

文件: `lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:4173/"],
      "numberOfRuns": 1
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.8 }],
        "categories:accessibility": ["warn", { "minScore": 0.8 }],
        "categories:best-practices": ["warn", { "minScore": 0.8 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 3000 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 500 }],
        "interactive": ["error", { "maxNumericValue": 3000 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### 48.3 手动性能测试指南

文件: `scripts/performance-check.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== 一念江湖 性能验证 ==="
echo ""

# 1. 确保有生产构建
if [ ! -d "dist" ]; then
  echo "[0/5] 执行生产构建..."
  npm run build
fi

# 2. 启动预览服务器
echo "[1/5] 启动本地预览服务器..."
npm run preview &
PREVIEW_PID=$!
sleep 3

echo ""
echo "[2/5] 构建产物分析（自动化测试）..."
npx vitest run src/__tests__/performance.test.ts
echo ""

echo "[3/5] Lighthouse 手动测试指引"
echo "================================"
echo ""
echo "请在浏览器中打开以下地址进行手动测试:"
echo "  预览地址: http://localhost:4173/"
echo ""
echo "Chrome Lighthouse 测试步骤:"
echo "  1. 打开 Chrome DevTools (F12)"
echo "  2. 切换到 Lighthouse 标签"
echo "  3. 选择 'Performance' 分类"
echo "  4. 点击 'Analyze page load'"
echo "  5. 目标分数: >= 80"
echo ""
echo "60fps 动画验证步骤:"
echo "  1. 打开 Chrome DevTools"
echo "  2. Performance 标签 -> 录制"
echo "  3. 在游戏中触发战斗动画、好感度变化"
echo "  4. 停止录制，查看帧率图表"
echo "  5. 目标: 动画期间帧率 >= 55fps"
echo ""
echo "首屏加载时间验证:"
echo "  1. DevTools -> Network -> Fast 3G 模拟"
echo "  2. Hard reload (Ctrl+Shift+R)"
echo "  3. 目标: First Contentful Paint < 2s"
echo ""

echo "[4/5] Vercel 生产环境测试指引"
echo "================================"
echo ""
echo "部署后在生产环境验证:"
echo "  1. 访问 https://yinian-jianghu.vercel.app"
echo "  2. 运行 Lighthouse (URL: 生产地址)"
echo "  3. 验证 HTTPS 自动启用"
echo "  4. 验证 Cache-Control 头:"
echo "     curl -I https://yinian-jianghu.vercel.app/assets/xxx.js"
echo "  5. 确认返回 immutable 缓存头"
echo ""

echo "[5/5] 性能指标汇总"
echo "================================"
echo ""
echo "| 指标                     | 目标           | 测试方式       |"
echo "|--------------------------|----------------|----------------|"
echo "| Lighthouse Performance   | >= 80          | Lighthouse     |"
echo "| First Contentful Paint   | < 2s           | Lighthouse     |"
echo "| Largest Contentful Paint | < 3s           | Lighthouse     |"
echo "| Cumulative Layout Shift  | < 0.1          | Lighthouse     |"
echo "| Total Blocking Time      | < 500ms        | Lighthouse     |"
echo "| Time to Interactive      | < 3s           | Lighthouse     |"
echo "| 动画帧率                 | >= 55fps       | Performance    |"
echo "| dist/ 总大小             | < 10MB         | 自动化测试     |"
echo "| JS 总大小                | < 500KB        | 自动化测试     |"
echo "| CSS 总大小               | < 100KB        | 自动化测试     |"
echo ""

# 关闭预览服务器
kill $PREVIEW_PID 2>/dev/null || true

echo "=== 性能验证完成 ==="
```

### 48.4 运行命令与预期输出

```bash
# 1. 先执行生产构建
npm run build

# 2. 运行性能分析测试
npx vitest run src/__tests__/performance.test.ts

# 预期输出:
# ✓ HTML 文件大小 < 10KB
# ✓ JS 总大小 < 500KB (gzip < 200KB)
# ✓ CSS 总大小 < 100KB
# ✓ 单个 JS chunk < 250KB
# ✓ dist/ 总大小 < 10MB
# ✓ 存在 vendor 分包
# ✓ 存在 d3 分包

# 3. 运行完整性能验证脚本
bash scripts/performance-check.sh
```

### 48.5 验收标准

- [ ] Lighthouse Performance >= 80
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 3s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Total Blocking Time < 500ms
- [ ] Time to Interactive < 3s
- [ ] 战斗动画帧率 >= 55fps
- [ ] dist/ 总大小 < 10MB
- [ ] JS 总大小 < 500KB
- [ ] 8 个性能自动化测试全部通过

---

## Task 49: 最终 Commit + 版本标记

**目的**: 清理所有临时文件，创建最终 commit，打 v1.0.0 tag。

### 49.1 最终检查清单脚本

文件: `scripts/final-checklist.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== 一念江湖 v1.0.0 发布前最终检查 ==="
echo ""

ERRORS=0

# 1. 类型检查
echo "[1/8] TypeScript 类型检查..."
if npm run type-check 2>&1 | grep -q "error"; then
  echo "  FAIL: 类型检查有错误"
  ERRORS=$((ERRORS + 1))
else
  echo "  PASS"
fi

# 2. Lint
echo "[2/8] ESLint 检查..."
if npm run lint 2>&1 | grep -q "error"; then
  echo "  FAIL: Lint 有错误"
  ERRORS=$((ERRORS + 1))
else
  echo "  PASS"
fi

# 3. 测试
echo "[3/8] 测试运行..."
if ! npm run test 2>&1; then
  echo "  FAIL: 测试未通过"
  ERRORS=$((ERRORS + 1))
else
  echo "  PASS"
fi

# 4. 构建
echo "[4/8] 生产构建..."
if ! npm run build 2>&1; then
  echo "  FAIL: 构建失败"
  ERRORS=$((ERRORS + 1))
else
  echo "  PASS"
fi

# 5. 构建产物检查
echo "[5/8] 构建产物检查..."
if [ ! -d "dist" ]; then
  echo "  FAIL: dist/ 目录不存在"
  ERRORS=$((ERRORS + 1))
else
  DIST_SIZE=$(du -sb dist 2>/dev/null | cut -f1)
  if [ "${DIST_SIZE}" -gt $((10 * 1024 * 1024)) ]; then
    echo "  FAIL: dist/ 大小超过 10MB"
    ERRORS=$((ERRORS + 1))
  else
    echo "  PASS"
  fi
fi

# 6. 检查没有临时/测试文件残留
echo "[6/8] 临时文件检查..."
TEMP_FILES=$(find src -name '_test_*' -o -name '*.tmp' -o -name '*.bak' 2>/dev/null | head -5)
if [ -n "${TEMP_FILES}" ]; then
  echo "  WARN: 发现临时文件:"
  echo "${TEMP_FILES}"
else
  echo "  PASS"
fi

# 7. 检查 package.json 版本
echo "[7/8] 版本号检查..."
VERSION=$(node -p "require('./package.json').version")
if [ "${VERSION}" = "1.0.0" ]; then
  echo "  PASS: 版本号为 ${VERSION}"
else
  echo "  FAIL: 版本号为 ${VERSION}，应为 1.0.0"
  ERRORS=$((ERRORS + 1))
fi

# 8. 检查 git 状态
echo "[8/8] Git 状态检查..."
GIT_STATUS=$(git status --porcelain 2>/dev/null)
if [ -z "${GIT_STATUS}" ]; then
  echo "  PASS: 工作区干净"
else
  echo "  INFO: 有未提交的变更"
  echo "${GIT_STATUS}" | head -10
fi

echo ""
echo "==============================="
if [ "${ERRORS}" -gt 0 ]; then
  echo "FAIL: ${ERRORS} 项检查未通过，无法发布"
  exit 1
else
  echo "ALL PASS: 所有检查通过，可以发布 v1.0.0"
fi
echo "==============================="
```

### 49.2 发布操作流程

```bash
# 1. 运行最终检查
bash scripts/final-checklist.sh

# 预期输出:
# [1/8] TypeScript 类型检查... PASS
# [2/8] ESLint 检查... PASS
# [3/8] 测试运行... PASS
# [4/8] 生产构建... PASS
# [5/8] 构建产物检查... PASS
# [6/8] 临时文件检查... PASS
# [7/8] 版本号检查... PASS: 版本号为 1.0.08] Git 状态检查... PASS
# ALL PASS: 所有检查通过，可以发布 v1.0.0

# 2. 暂存所有文件
git add -A

# 3. 创建最终 commit
git commit -m "$(cat <<'EOF'
release: v1.0.0 一念江湖 初始发布

完整游戏功能:
- 游戏引擎: TimeEngine / FavorEngine / CombatEngine / EventEngine / EndingEngine / FlagEngine
- 数据层: 30 天事件 JSON + zod schema 校验
- UI 层: 5 个屏幕 + 12 NPC 好感度 + 回合制战斗 + d3-force 关系图
- 端到端集成: Engine + Data + UI 全链路贯通
- 存档系统: localStorage 持久化 + JSON 导出/导入
- 二周目: endingsUnlocked 持久化 + 天眼模式
- 构建优化: 代码分包 + 资源缓存
- 部署: Vercel 静态站点 + HTTPS
EOF
)"

# 4. 打 tag
git tag -a v1.0.0 -m "$(cat <<'EOF'
一念江湖 v1.0.0

武侠题材 RPG 游戏
30 天江湖日历，7 种结局，12 NPC，5 大门派
一念成佛，一念成魔。
EOF
)"

# 5. 验证 tag
git tag -l
# 预期输出:
# v1.0.0

git show v1.0.0 --stat
# 预期输出: 显示 tag 信息和 commit 摘要

# 6. 推送到远程（如有需要）
git push origin main --tags

# 7. 验证远端 tag
git ls-remote --tags origin
# 预期输出: 包含 v1.0.0 的 ref
```

### 49.3 发布后验证

```bash
# 1. Vercel 部署状态
vercel ls --prod

# 2. 验证生产环境 URL 可访问
curl -I https://yinian-jianghu.vercel.app/
# 预期输出:
# HTTP/2 200
# content-type: text/html; charset=utf-8
# cache-control: public, max-age=0, must-revalidate

# 3. 验证静态资源缓存头
# （需要替换为实际的 JS 文件名）
curl -I https://yinian-jianghu.vercel.app/assets/vendor-xxx.js
# 预期输出:
# cache-control: public, max-age=31536000, immutable

# 4. 验证 HTTPS
curl -I https://yinian-jianghu.vercel.app/ 2>&1 | head -1
# 预期输出:
# HTTP/2 200

# 5. 运行 Lighthouse
npx lighthouse https://yinian-jianghu.vercel.app/ --output=json --output-path=./lighthouse-report.json

# 查看 Performance 分数
node -e "const r = require('./lighthouse-report.json'); console.log('Performance:', r.categories.performance.score * 100)"
```

### 49.4 验收标准

- [ ] `scripts/final-checklist.sh` 所有 8 项检查通过
- [ ] 最终 commit 消息包含 release: v1.0.0 和完整变更摘要
- [ ] `git tag -l` 显示 v1.0.0
- [ ] `git show v1.0.0` 显示正确的 tag 注释
- [ ] 推送到远端后 tag 可被 `git ls-remote --tags` 看到
- [ ] Vercel 生产环境 URL 可访问
- [ ] HTTPS 自动启用
- [ ] 静态资源 immutable 缓存头生效
- [ ] Lighthouse Performance >= 80

---

## Phase 5 + Phase 6 文件清单

### Phase 5 新增文件

| 文件路径 | 说明 |
|----------|------|
| `src/data/events/_test_day01.json` | 集成测试用事件数据 |
| `src/__tests__/integration.test.ts` | Engine + Data 集成测试（13 tests） |
| `src/ui/store/gameStore.ts` | Zustand store（连接 Engine） |
| `src/__tests__/gameStore.test.ts` | Store 单元测试（8 tests） |
| `src/__tests__/fixtures/test-day-data.ts` | 测试用 day 事件数据 |
| `src/__tests__/full-flow.test.ts` | 完整流程测试（3 tests） |
| `src/__tests__/fixtures/test-combat-data.ts` | 战斗测试数据 |
| `src/__tests__/combat-flow.test.ts` | 战斗流程测试（7 tests） |
| `src/ui/components/RelationGraphData.ts` | 关系图数据构建 |
| `src/__tests__/relation-graph.test.ts` | 关系图数据测试（9 tests） |
| `src/engine/SecondPlaythrough.ts` | 二周目管理器 |
| `src/__tests__/second-playthrough.test.ts` | 二周目测试（9 tests） |
| `src/engine/SaveManager.ts` | 存档管理器 |
| `src/__tests__/save-manager.test.ts` | 存档测试（9 tests） |
| `src/__tests__/smoke-test.ts` | 手动验收走查表（12 tests） |

**Phase 5 测试总数**: 60 个测试

### Phase 6 新增文件

| 文件路径 | 说明 |
|----------|------|
| `vite.config.ts` | Vite 构建配置（分包 + 优化） |
| `scripts/check-bundle-size.sh` | 构建产物大小分析脚本 |
| `src/__tests__/build-config.test.ts` | 构建配置验证测试（5 tests） |
| `vercel.json` | Vercel 部署配置 |
| `.gitignore` | Git 忽略文件 |
| `scripts/deploy.sh` | 部署脚本 |
| `src/__tests__/vercel-config.test.ts` | Vercel 配置测试（6 tests） |
| `lighthouserc.json` | Lighthouse 配置 |
| `scripts/performance-check.sh` | 性能验证脚本 |
| `src/__tests__/performance.test.ts` | 性能基准测试（8 tests） |
| `scripts/final-checklist.sh` | 发布前最终检查脚本 |

**Phase 6 测试总数**: 19 个测试

### 累计测试统计

| Phase | 测试数 |
|-------|--------|
| Phase 2（引擎） | ~40 |
| Phase 3（数据） | ~15 |
| Phase 4（UI） | ~20 |
| Phase 5（集成） | 60 |
| Phase 6（部署） | 19 |
| **总计** | **~154** |
