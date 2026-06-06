import { z } from 'zod';

// ===== 基础枚举 =====
export const TimeslotSchema = z.enum(['dawn', 'noon', 'dusk', 'night']);
export const LocationSchema = z.enum(['zhongyuan', 'jiangnan', 'saibei', 'shuzhong', 'xiyu']);
export const FavorDimSchema = z.enum(['trust', 'intimacy', 'awe', 'fear']);
export const FactionIdSchema = z.enum(['taixu', 'tingyu', 'tieqi', 'yaowang', 'fentian']);
export const NpcIdSchema = z.enum([
  'suqingheng', 'qingxuzhenren', 'shentingyu', 'luxiaoman',
  'xiaopodi', 'ayiguli', 'baiyaoxian', 'liusuifeng',
  'liwushuang', 'huochangqing', 'chubaiyi', 'laowei',
]);
export const ElementSchema = z.enum(['sword', 'qi', 'fist', 'poison']);
export const EventTypeSchema = z.enum(['story', 'combat', 'random', 'ending']);
export const SkillTypeSchema = z.enum(['attack', 'defense', 'support', 'ultimate']);
export const TargetTypeSchema = z.enum(['single', 'all', 'self']);

// ===== 好感度 =====
export const FavorSchema = z.object({
  trust: z.number().int().min(0).max(100),
  intimacy: z.number().int().min(0).max(100),
  awe: z.number().int().min(0).max(100),
  fear: z.number().int().min(0).max(100),
});

// ===== NPC =====
export const NpcDataSchema = z.object({
  name: z.string(),
  title: z.string(),
  faction: FactionIdSchema,
  gender: z.enum(['male', 'female']),
  age: z.number().int().min(1).max(150),
  initialFavor: FavorSchema,
  portrait: z.string(),
});

// ===== 武学 =====
export const MartialArtDataSchema = z.object({
  name: z.string(),
  faction: FactionIdSchema,
  element: ElementSchema,
  type: SkillTypeSchema,
  target: TargetTypeSchema,
  baseDamage: z.number().int().min(-100).max(200),
  qiCost: z.number().int().min(0).max(100),
  effect: z.string().nullable(),
  unlockCondition: z.string().nullable(),
});

// ===== 门派 =====
export const FactionDataSchema = z.object({
  name: z.string(),
  description: z.string(),
  location: LocationSchema,
  element: z.union([ElementSchema, z.literal('mixed')]),
  leader: NpcIdSchema,
  style: z.string(),
});

// ===== 条件 DSL =====
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ConditionSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({ type: z.literal('timeslot'), value: TimeslotSchema }),
    z.object({ type: z.literal('location'), value: LocationSchema }),
    z.object({ type: z.literal('day'), op: z.enum(['>', '>=', '==', '<=', '<']), value: z.number().int().min(1).max(30) }),
    z.object({ type: z.literal('flag'), key: z.string(), present: z.boolean().optional() }),
    z.object({ type: z.literal('favor'), npc: NpcIdSchema, dim: FavorDimSchema, op: z.enum(['>=', '<=', '>', '<']), value: z.number().int().min(0).max(100) }),
    z.object({ type: z.literal('reputation'), faction: FactionIdSchema, op: z.enum(['>=', '<=']), value: z.number().int().min(0).max(100) }),
    z.object({ type: z.literal('and'), conditions: z.array(ConditionSchema) }),
    z.object({ type: z.literal('or'), conditions: z.array(ConditionSchema) }),
    z.object({ type: z.literal('not'), condition: ConditionSchema }),
  ])
);

// ===== 效果 =====
export const EffectSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('favor'), npc: NpcIdSchema, trust: z.number().int().min(-100).max(100).optional(), intimacy: z.number().int().min(-100).max(100).optional(), awe: z.number().int().min(-100).max(100).optional(), fear: z.number().int().min(-100).max(100).optional(), ripple: z.object({ dim: FavorDimSchema, delta: z.number().int().min(-50).max(50) }).optional() }),
  z.object({ type: z.literal('reputation'), faction: FactionIdSchema, delta: z.number().int().min(-100).max(100) }),
  z.object({ type: z.literal('flag'), key: z.string(), set: z.boolean() }),
  z.object({ type: z.literal('unlock'), what: z.string() }),
  z.object({ type: z.literal('stat'), stat: z.enum(['health', 'qi', 'attack', 'defense']), delta: z.number().int().min(-100).max(100) }),
  z.object({ type: z.literal('learnMartial'), martial: z.string() }),
]);

// ===== 对话 =====
export const DialogueSchema = z.object({
  speaker: z.string(),
  text: z.string(),
  emotion: z.string().optional(),
});

// ===== 选择 =====
export const ChoiceSchema = z.object({
  id: z.string(),
  text: z.string(),
  conditions: z.array(ConditionSchema),
  effects: z.array(EffectSchema),
  nextEvent: z.string().nullable().optional(),
});

// ===== 场景 =====
export const SceneSchema = z.object({
  background: z.string(),
  description: z.string(),
  ambient: z.string().optional(),
});

// ===== 触发器 =====
export const TriggerSchema = z.object({
  timeslot: TimeslotSchema.optional(),
  location: LocationSchema.optional(),
  conditions: z.array(ConditionSchema),
});

// ===== 敌人 =====
export const EnemyDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  health: z.number().int().min(1).max(1000),
  qi: z.number().int().min(0).max(500),
  attack: z.number().int().min(1).max(100),
  defense: z.number().int().min(0).max(50),
  speed: z.number().int().min(1).max(50),
  moves: z.array(z.string()),
});

// ===== 战斗定义 =====
export const CombatDefSchema = z.object({
  type: z.enum(['story', 'encounter', 'npc_challenge', 'boss']),
  enemies: z.array(EnemyDataSchema),
  rewards: z.array(EffectSchema),
  onDefeat: z.string().nullable().optional(),
  onFlee: z.string().nullable().optional(),
});

// ===== 事件 =====
export const EventSchema = z.object({
  id: z.string(),
  type: EventTypeSchema,
  priority: z.number().int().optional(),
  trigger: TriggerSchema,
  scene: SceneSchema.optional(),
  dialogues: z.array(DialogueSchema).optional(),
  choices: z.array(ChoiceSchema).optional(),
  combat: CombatDefSchema.optional(),
  nextEvent: z.string().nullable().optional(),
});

// ===== 每日事件 =====
export const DayEventsSchema = z.object({
  day: z.number().int().min(1).max(30),
  events: z.array(EventSchema),
});

// ===== 结局条件 =====
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EndingConditionSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({ type: z.literal('flag'), key: z.string(), present: z.boolean() }),
    z.object({ type: z.literal('favor'), npc: NpcIdSchema, dim: FavorDimSchema, op: z.enum(['>=', '<=']), value: z.number().int().min(0).max(100) }),
    z.object({ type: z.literal('favorTotal'), npcs: z.array(NpcIdSchema), op: z.enum(['>=', '<=']), value: z.number().int().min(0).max(500) }),
    z.object({ type: z.literal('reputation'), faction: FactionIdSchema, op: z.enum(['>=', '<=']), value: z.number().int().min(0).max(100) }),
    z.object({ type: z.literal('not'), condition: EndingConditionSchema }),
    z.object({ type: z.literal('and'), conditions: z.array(EndingConditionSchema) }),
  ])
);

// ===== 结局 =====
export const EndingDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  quote: z.string(),
  tone: z.string(),
  priority: z.number().int().min(1).max(100),
  conditions: z.array(EndingConditionSchema),
  mutuallyExclusive: z.array(z.string()),
  scene: z.string(),
  finalText: z.string(),
});

// ===== 随机事件 =====
export const RandomEventSchema = z.object({
  id: z.string(),
  weight: z.number().int().min(1).max(100),
  dialogues: z.array(DialogueSchema),
  choices: z.array(ChoiceSchema),
});
