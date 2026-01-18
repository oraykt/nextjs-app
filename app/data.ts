// This simulates a server-side data source

import { unstable_cache } from "next/cache";

export type Item = {
  id: string;
  label: string;
};

export type Stats = {
  total: number;
};

// Use globalThis to persist data across module reloads in development
const globalForItems = globalThis as unknown as {
  items: Item[] | undefined;
};

const items: Item[] = globalForItems.items ?? [
  { id: "1", label: "Task 1" },
  { id: "2", label: "Task 2" },
  { id: "3", label: "Task 3" },
];

globalForItems.items = items;

// Both getItems and getStats share the same cache tag "items-data"
// This ensures they are invalidated together for consistency

async function fetchItems(): Promise<Item[]> {
  await new Promise((res) => setTimeout(res, 200));
  return [...items];
}

async function fetchStats(): Promise<Stats> {
  await new Promise((res) => setTimeout(res, 200));
  const stats = { total: items.length };
  return stats;
}

export const getItems = unstable_cache(fetchItems, ["items"], {
  tags: ["items-data"],
});

export const getStats = unstable_cache(fetchStats, ["stats"], {
  tags: ["items-data"],
});

export async function addItem(label: string): Promise<Item> {
  await new Promise((res) => setTimeout(res, 200));
  const newItem = { id: crypto.randomUUID(), label };
  items.push(newItem);
  return newItem;
}

export async function editItem(id: string, label: string): Promise<Item> {
  await new Promise((res) => setTimeout(res, 200));

  if (label.toLowerCase().includes("error")) {
    throw new Error("Simulated server error for labels containing 'error'");
  }

  const index = items.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error("Item not found");
  }

  items[index] = { ...items[index], label };
  return items[index];
}
