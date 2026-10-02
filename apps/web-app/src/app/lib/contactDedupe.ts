import { sqliteTrue } from "@linky-fit/linksync";

interface DedupeContact {
  readonly createdAt?: string | null;
  readonly groupName?: string | null;
  readonly name?: string | null;
  readonly lnAddress?: string | null;
  readonly lnAddressSetByUser?: number | null;
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
    const withNpub = indexes.filter((index) => npubByRoot.has(find(index)));
    const npubs = new Set(withNpub.map((index) => npubByRoot.get(find(index))));
    if (npubs.size > 1) continue;
    const withoutNpub = indexes.filter((index) => !npubByRoot.has(find(index)));
    for (const index of withoutNpub) union(withoutNpub[0], index);

    const userSetAddressOwner = withNpub.find(
      (index) => contacts[index].lnAddressSetByUser === sqliteTrue,
    );
    if (userSetAddressOwner !== undefined && withoutNpub.length > 0) {
      union(userSetAddressOwner, withoutNpub[0]);
    }
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

const keepScore = (contact: DedupeContact): number =>
  [contact.name, contact.lnAddress, contact.groupName].filter((value) =>
    normalize(value),
  ).length + (normalize(contact.npub) ? 10 : 0);

export const pickContactToKeep = <TContact extends DedupeContact>(
  group: readonly TContact[],
): TContact => {
  let keep = group[0];
  for (const contact of group.slice(1)) {
    const score = keepScore(contact);
    const bestScore = keepScore(keep);
    if (
      score > bestScore ||
      (score === bestScore &&
        Number(contact.createdAt ?? 0) > Number(keep.createdAt ?? 0))
    ) {
      keep = contact;
    }
  }
  return keep;
};

export const canMergeContactNpubs = (
  a: string | null | undefined,
  b: string | null | undefined,
): boolean => {
  const npubA = normalize(a);
  const npubB = normalize(b);
  return !npubA || !npubB || npubA === npubB;
};
