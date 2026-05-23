# 美术风格基线

## 视觉关键词

**朱砂红古卷风**——翻开一本泛黄的古籍，朱砂批注跃然纸上。厚重的历史感、克制的华丽、刀锋般的文字。

---

## 色彩体系

### 主色板

```css
:root {
  /* 主色 */
  --cinnabar:       #C23B22;  /* 朱砂红 — 强调、按钮、重要标记 */
  --cinnabar-light: #E85D4A;  /* 浅朱砂 — hover 态、次级强调 */
  --cinnabar-dark:  #8B1A1A;  /* 深朱砂 — 按下态、血条 */

  /* 墨色系 */
  --ink-black:    #1A1A2E;   /* 墨黑 — 主文字、标题 */
  --ink-gray:     #3D3D56;   /* 深墨 — 次要文字 */
  --ink-light:    #6B6B80;   /* 淡墨 — 占位符文字 */

  /* 纸色系 */
  --paper-white:  #F5F0E8;   /* 宣纸白 — 主背景 */
  --paper-cream:  #EDE5D8;   /* 米色 — 卡片背景 */
  --paper-aged:   #D4C9B5;   /* 老纸色 — 分割线、边框 */

  /* 金属色 */
  --gold:         #C5A55A;   /* 鎏金 — 成就、稀有物品、标题装饰 */
  --gold-light:   #DBC07A;   /* 浅金 — hover */
  --gold-dark:    #9A7B3A;   /* 暗金 — 阴影 */

  /* 功能色 */
  --success:      #5B8C5A;   /* 青铜绿 — 治疗、正面效果 */
  --danger:       #8B1A1A;   /* 暗红 — 伤害、负面效果 */
  --info:         #4A708B;   /* 青瓷蓝 — 信息提示 */

  /* 门派色 */
  --faction-taixu:   #5B8C8C; /* 青铜色 — 太虚剑宗 */
  --faction-tingyu:  #7B68AE; /* 紫色 — 听雨阁 */
  --faction-tieqi:   #8B6914; /* 铁锈色 — 铁骑营 */
  --faction-yaowang: #6B8E23; /* 草药绿 — 药王谷 */
  --faction-fentian: #C23B22; /* 赤红 — 焚天教（复用朱砂红） */

  /* 阴影 */
  --shadow-ink:   rgba(26, 26, 46, 0.15);  /* 墨色阴影 */
  --shadow-gold:  rgba(197, 165, 90, 0.2); /* 金色光晕 */
}
```

### 色彩使用规则

| 场景 | 用色 |
|------|------|
| 页面主背景 | `--paper-white` |
| 标题文字 | `--ink-black` |
| 正文文字 | `--ink-gray` |
| 重点强调 / 按钮 | `--cinnabar` |
| 按钮 hover | `--cinnabar-light` |
| 卡片 / 弹窗背景 | `--paper-cream` |
| 分割线 / 边框 | `--paper-aged` |
| 成就 / 里程碑 | `--gold` |
| 门派标识 | 对应门派色 |

---

## 字体方案

```css
/* 中文 — 主标题 */
font-family: "FZQingKeBenYueSongS-R-GB", "Source Han Serif SC", "Noto Serif CJK SC", serif;

/* 中文 — 正文 */
font-family: "Source Han Sans SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;

/* 英文 / 数字 — 标题 */
font-family: "Cinzel", "Palatino", serif;

/* 英文 / 数字 — 正文 */
font-family: "EB Garamond", "Times New Roman", serif;
```

**字体层级：**
- 一级标题（门派名/结局名）：中文 36px，bold，宋体
- 二级标题（章节名）：中文 24px，bold，宋体
- 三级标题（NPC名/招式名）：中文 18px，semibold，宋体
- 正文：中文 16px，常规，黑体
- 小字/注释：中文 14px，淡墨色
- 数字/属性值：英文 14px，EB Garamond，等宽排列

---

## UI 组件风格

### 卷轴边框

所有卡片、弹窗使用卷轴风格边框：

```css
.scroll-frame {
  background: var(--paper-cream);
  border: 2px solid var(--paper-aged);
  border-image: linear-gradient(
    to bottom,
    var(--gold-dark),
    var(--paper-aged) 10%,
    var(--paper-aged) 90%,
    var(--gold-dark)
  ) 1;
  padding: 24px 32px;
  position: relative;
}

/* 卷轴顶部装饰 */
.scroll-frame::before {
  content: "";
  position: absolute;
  top: -4px;
  left: 20px;
  right: 20px;
  height: 8px;
  background: linear-gradient(to right,
    transparent, var(--gold), transparent);
  border-radius: 50%;
}
```

### 印章式按钮

```css
.btn-seal {
  background: var(--cinnabar);
  color: var(--paper-white);
  font-family: "FZQingKeBenYueSongS-R-GB", serif;
  font-size: 16px;
  padding: 8px 24px;
  border: 2px solid var(--cinnabar-dark);
  position: relative;
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
```

### 墨迹分割线

```css
.divider-ink {
  border: none;
  height: 2px;
  background: linear-gradient(to right,
    transparent 0%,
    var(--ink-light) 15%,
    var(--ink-gray) 50%,
    var(--ink-light) 85%,
    transparent 100%
  );
  margin: 24px 0;
  opacity: 0.6;
}
```

### 好感度指示器

```css.好感度条的样式
.favor-bar {
  height: 8px;
  background: var(--paper-aged);
  border-radius: 4px;
  overflow: hidden;
}

.favor-bar-fill {
  height: 100%;
  transition: width 0.5s ease;
  /* 四维分别用不同颜色 */
}
.favor-trust  .favor-bar-fill { background: var(--gold); }      /* 信任 — 鎏金 */
.favor-intim  .favor-bar-fill { background: var(--cinnabar); }  /* 亲密 — 朱砂 */
.favor-awe    .favor-bar-fill { background: var(--info); }      /* 敬畏 — 青瓷 */
.favor-fear   .favor-bar-fill { background: var(--ink-black); } /* 忌惮 — 墨黑 */
```

---

## 图标风格

毛笔线条风格，单色（默认 `--ink-black`），线宽 2px：

- 动作类图标：毛笔笔触（攻击 = 劈砍笔触、防御 = 横挡笔触）
- 门派图标：各门派的图腾（剑/扇/盾/草/焰）
- 好感度图标：信任 = 印章、亲密 = 红绳、敬畏 = 宝剑、忌惮 = 暗影
- 时间图标：卯时 = 日出月牙、午时 = 日中、酉时 = 落日、子时 = 星辰

---

## 背景纹理

### 主背景 — 宣纸质感

```css
body {
  background-color: var(--paper-white);
  background-image: url("data:image/svg+xml,..."); /* 宣纸纤维 SVG 纹理 */
  /* 或用 CSS 实现微妙的噪点纹理 */
  background-image: url("data:image/png;base64,...");
}
```

### 场景背景 — 淡水墨山水

五个地理区域各有淡水墨风格背景：
- 中原：远山叠嶂 + 松树剪影
- 江南：烟雨楼台 + 柳枝
- 塞北：大漠孤烟 + 城墙
- 蜀中：云雾缭绕 + 竹林
- 西域：沙丘 + 驼铃

所有背景使用 CSS 渐变 + 半透明 SVG 实现，保持轻量。

---

## 动效规范

| 动效 | 实现方式 | 时长 |
|------|----------|------|
| 页面切换 | 墨水晕染展开 | 400ms |
| 好感度变化 | 数值滚动 + 颜色闪烁 | 300ms |
| 按钮点击 | 印章盖下效果 | 150ms |
| 对话文字 | 逐字打印（古书翻页感） | 50ms/字 |
| 战斗招式 | 墨迹飞溅 + 笔触划过 | 500ms |
| 结局画面 | 水墨渐隐至白 | 2000ms |

---

## 响应式策略

| 设备 | 宽度 | 布局 |
|------|------|------|
| 桌面 | ≥1024px | 双栏（左事件/右属性面板） |
| 平板 | 768-1023px | 单栏 + 折叠面板 |
| 手机 | <768px | 纯单栏，底部导航 |

所有设备保持朱砂红主色调和卷轴边框风格不变。
