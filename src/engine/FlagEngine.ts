export const FlagEngine = {
  setFlag(flags: Set<string>, key: string): Set<string> {
    if (flags.has(key)) return flags;
    const next = new Set(flags);
    next.add(key);
    return next;
  },

  hasFlag(flags: Set<string>, key: string): boolean {
    return flags.has(key);
  },

  removeFlag(flags: Set<string>, key: string): Set<string> {
    const next = new Set(flags);
    next.delete(key);
    return next;
  },

  clearFlags(flags: Set<string>): Set<string> {
    return new Set<string>();
  },

  setFlags(flags: Set<string>, keys: string[]): Set<string> {
    const next = new Set(flags);
    for (const key of keys) next.add(key);
    return next;
  },
};
