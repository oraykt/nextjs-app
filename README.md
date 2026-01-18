# Task Module – Advanced Next.js App Router Patterns

This module demonstrates **production-grade data flow patterns** using **Next.js App Router**, focusing on:

- Server Components
- Server Actions
- Cache ownership & invalidation
- Parallel data fetching
- Optimistic UI with rollback
- Accessibility-aware client components

The implementation intentionally avoids legacy or anti-patterns (API routes, client refetching, global state).

---

## 📁 Folder Structure

```
components/
└─ task/
   ├─ action/
   │  └─ action.ts            # Server Actions (mutations + revalidation)
   ├─ ui/
   │  ├─ AddItemForm.tsx      # Client mutation trigger (optimistic)
   │  └─ SearchableList.tsx   # Client UI (search, keyboard, accessibility)
   ├─ data.ts                 # Server-side data source + cache
app/
└─ task/
   └─ page.tsx                # Server Component (parallel fetch)
```

---

## 🧠 Architectural Principles

- **Server is the source of truth**
- **Client state is ephemeral**
- **Next.js owns caching**
- **Mutations invalidate cache, not UI**
- **Derived state is never stored**
- **Explicit rollback over implicit magic**

---

## 🗄️ Server Data Layer

**`components/task/data.ts`**

### Responsibilities

- Simulate a backend data source
- Register data with Next.js cache
- Ensure consistency across multiple consumers

### Key Patterns

- `unstable_cache` for cache ownership
- Shared cache tags for atomic invalidation
- Snapshot safety (no in-place mutation leaks)

```ts
export const getItems = unstable_cache(fetchItems, ["items:list"], {
  tags: ["items-data"],
});

export const getStats = unstable_cache(fetchStats, ["items:stats"], {
  tags: ["items-data"],
});
```

### Why this matters

- Cache invalidation only works if Next.js owns the cache
- Shared tags ensure **items and stats never desync**
- Returning new references (`[...]`) avoids stale snapshots

---

## 🔄 Server Actions

**`components/task/action/action.ts`**

### Responsibilities

- Perform mutations on the server
- Trigger cache invalidation
- Replace API routes

```ts
export async function addItemAction(label: string) {
  await addItem(label);
  revalidateTag("items-data");
}
```

### Key Rules

- No optimistic logic on the server
- No client secrets
- Cache revalidation drives UI updates

---

## 📄 Server Component (Entry Point)

**`app/task/page.tsx`**

### Responsibilities

- Fetch all required data on the server
- Run fetches **in parallel**
- Pass snapshots to client components

```ts
const [list, stats] = await Promise.all([getItems(), getStats()]);
```

### Why this works

- No fetch waterfalls
- No client data fetching
- Revalidation automatically refreshes UI

---

## 🧩 Client UI Components

### 🔍 Searchable List

**`components/task/ui/SearchableList.tsx`**

#### Features

- Search with debounce
- Keyboard navigation (↑ ↓ Enter)
- ARIA roles (`listbox`, `option`)
- Optimistic selection handling
- Modal-driven item creation

#### Key Decisions

- Only `searchTerm` stored in state
- Derived data via `useMemo`
- No `useEffect` for fetching
- Transitions handled with `useTransition`

---

### ➕ Add Item Form

**`components/task/ui/AddItemForm.tsx`**

#### Responsibilities

- Trigger server mutation
- Handle optimistic UI
- Disable UI while pending
- Close modal on success

```tsx
startTransition(async () => {
  await addItemAction(label);
});
```

---

## ⚡ Optimistic UI + Rollback

### Pattern Used

- Optimistic item added immediately on client
- Server Action runs in background
- Rollback on failure
- Cache revalidation reconciles success

```ts
setItems((prev) => [...prev, optimisticItem]);

try {
  await addItemAction(label);
} catch {
  rollback();
}
```

### Why not `useOptimistic`

- Explicit rollback control
- Safer under concurrency
- Easier debugging
- Better failure handling

---

## 🧠 Cache Invalidation Mental Model

> **Mutations do not update UI — cache invalidation does**

Key rules:

- `revalidateTag` only works for cached data
- `unstable_cache` snapshots return values
- Never mutate cached data in place
- Always return new references

---

## ❌ Patterns Explicitly Avoided

| Pattern              | Reason                  |
| -------------------- | ----------------------- |
| API routes           | Unnecessary boilerplate |
| `useEffect` fetching | App Router anti-pattern |
| `router.refresh()`   | Hides cache bugs        |
| Global state         | Breaks server authority |
| `cache: "no-store"`  | Disables scalability    |

---

## ♿ Accessibility

- Keyboard navigation supported
- ARIA roles applied
- Focus-safe interactions
- Predictable behavior

---

## 🎯 What This Module Demonstrates

✅ App Router mastery
✅ Server-first architecture
✅ Cache ownership & invalidation
✅ Parallel fetching
✅ Optimistic UI with rollback
✅ Production-grade UX

---

## 🚀 Possible Extensions

- Streaming + Suspense
- Auth-scoped caching
- Optimistic reconciliation with server IDs
- Race-condition stress testing

---

**This task module is intentionally minimal but architecturally complete.**
It reflects how modern Next.js applications should be built in production.

---
