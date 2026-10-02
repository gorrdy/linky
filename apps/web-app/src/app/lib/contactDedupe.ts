interface DedupeContact {
  readonly lnAddress?: string | null;
  readonly npub?: string | null;
}

const normalize = (value: string | null | undefined): string =>
  (value ?? "").trim().toLowerCase();

export const groupDuplicateContacts = (
  contacts: readonly DedupeContact[],
): number[][] => {
  const parent = contacts.map((_contact, index) => index);
  const npubByRoot = new Map<number, string>();
  const find = (index: number): number => {
    let root = index;
    while (parent[root] !== root) {
      parent[root] = parent[parent[root]];
      root = parent[root];
    }
    return root;
  };
  const union = (a: number, b: number) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA === rootB) return;
    parent[rootB] = rootA;
    const npub = npubByRoot.get(rootA) ?? npubByRoot.get(rootB);
    if (npub) npubByRoot.set(rootA, npub);
  };

  const indexesByKey = (key: (contact: DedupeContact) => string) => {
    const byKey = new Map<string, number[]>();
    contacts.forEach((contact, index) => {
      const value = key(contact);
      if (!value) return;
      const indexes = byKey.get(value);
      if (indexes) indexes.push(index);
      else byKey.set(value, [index]);
    });
    return byKey;
  };

  for (const [npub, indexes] of indexesByKey((c) => normalize(c.npub))) {
    for (const index of indexes) union(indexes[0], index);
    npubByRoot.set(find(indexes[0]), npub);
  }

  for (const indexes of indexesByKey((c) => normalize(c.lnAddress)).values()) {
    const npubs = new Set(
      indexes.flatMap((index) => npubByRoot.get(find(index)) ?? []),
    );
    if (npubs.size > 1) continue;
    for (const index of indexes) union(indexes[0], index);
  }

  const groups = new Map<number, number[]>();
  contacts.forEach((_contact, index) => {
    const root = find(index);
    const group = groups.get(root);
    if (group) group.push(index);
    else groups.set(root, [index]);
  });
  return [...groups.values()].filter((group) => group.length > 1);
};

export const canMergeContactNpubs = (
  a: string | null | undefined,
  b: string | null | undefined,
): boolean => {
  const npubA = normalize(a);
  const npubB = normalize(b);
  return !npubA || !npubB || npubA === npubB;
};
