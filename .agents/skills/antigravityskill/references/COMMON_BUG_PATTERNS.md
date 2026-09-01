# 🐛 Top 10 Common Bug Anti-Patterns & Visual Fix Catalog

A visual reference catalog of the most frequent software engineering and AI-generated bugs, explaining the root cause, anti-pattern code, and the gold-standard fix.

---

## 1. The Falsy Zero / Nullish Coalescing Trap (`??` vs `||`)

* **Root Cause**: Using `||` treats `0`, `false`, and `""` as falsy, replacing valid zero values with default fallbacks.
* **Impact**: User enters `0` (e.g. quantity or price), but the system resets it to the default (e.g. `10`).

```typescript
// ❌ BUG: Overwrites valid 0 or false with default
const count = userEnteredCount || 10; // If userEnteredCount is 0, count becomes 10!
const isEnabled = userConfig.isEnabled || true; // If user set false, it becomes true!

// ✅ FIX: Use Nullish Coalescing (??) to only catch null and undefined
const count = userEnteredCount ?? 10;
const isEnabled = userConfig.isEnabled ?? true;
```

---

## 2. The Async In-Loop Trap (`.forEach(async ...)` vs `for...of` / `Promise.all`)

* **Root Cause**: `Array.prototype.forEach` ignores returned promises. Async callbacks fire un-awaited, causing operations to run out of order.
* **Impact**: Functions return before data is saved; subsequent code reads stale data.

```typescript
// ❌ BUG: forEach does not await promises; function finishes prematurely
async function processUsers(users: User[]) {
  users.forEach(async (user) => {
    await saveToDatabase(user);
  });
  console.log("All users saved!"); // LIED! Database saves are still running in background!
}

// ✅ FIX (Sequential): Use for...of loop
async function processUsersSequential(users: User[]) {
  for (const user of users) {
    await saveToDatabase(user);
  }
  console.log("All users saved in order!");
}

// ✅ FIX (Parallel): Use Promise.all
async function processUsersParallel(users: User[]) {
  await Promise.all(users.map((user) => saveToDatabase(user)));
  console.log("All users saved concurrently!");
}
```

---

## 3. The React Stale Closure & Out-of-Order Async Overwrite

* **Root Cause**: Rapid user interactions trigger multiple async requests. If Request 1 finishes *after* Request 2, Request 1 overwrites the newer data.
* **Impact**: UI displays stale search results or corrupted state.

```typescript
// ❌ BUG: Out-of-order responses overwrite current state
useEffect(() => {
  fetchSearchResults(query).then((results) => {
    setResults(results); // Stale response can overwrite newer query results!
  });
}, [query]);

// ✅ FIX: Use AbortController to cancel previous in-flight requests
useEffect(() => {
  const controller = new AbortController();

  async function loadData() {
    try {
      const response = await fetch(`/api/search?q=${query}`, {
        signal: controller.signal,
      });
      const data = await response.json();
      setResults(data);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Search failed:", err);
      }
    }
  }

  loadData();
  return () => controller.abort(); // Cleanup: aborts previous request on query change
}, [query]);
```

---

## 4. Unchecked Array Indexing (`Cannot read properties of undefined`)

* **Root Cause**: Assuming an array or `.find()` search always returns at least one item.
* **Impact**: Runtime crash on empty search results or zero-item arrays.

```typescript
// ❌ BUG: Crashes if items is empty or no match is found
const firstItemName = items[0].name;
const matchedUserEmail = users.find((u) => u.id === targetId).email;

// ✅ FIX: Guard with optional chaining (?.) and fallback
const firstItemName = items[0]?.name ?? "Unknown Item";
const matchedUser = users.find((u) => u.id === targetId);
const matchedUserEmail = matchedUser?.email ?? "No Email Found";
```

---

## 5. Hydration Mismatch in SSR / Next.js

* **Root Cause**: Rendering dynamic client-side values (e.g. `Date.now()`, `Math.random()`, `window.innerWidth`, `localStorage`) directly during server rendering.
* **Impact**: `Hydration failed because the initial UI does not match what was rendered on the server.`

```typescript
// ❌ BUG: Server renders UTC/timestamp A; Client renders timestamp B
function CurrentTime() {
  return <div>Time: {new Date().toLocaleTimeString()}</div>; // Mismatch!
}

// ✅ FIX: Render dynamic time only after mounting on the client
function CurrentTime() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
  }, []);

  if (!time) return <div className="animate-pulse">Loading time...</div>;
  return <div>Time: {time}</div>;
}
```

---

## 6. Database Connection Pool Starvation

* **Root Cause**: Acquiring a database client from a pool and failing to release it when an error occurs.
* **Impact**: Pool exhausts all available connections, causing all subsequent queries to hang indefinitely.

```typescript
// ❌ BUG: If db.query throws, client.release() is never called!
async function getUser(id: string) {
  const client = await pool.connect();
  const res = await client.query("SELECT * FROM users WHERE id = $1", [id]);
  client.release();
  return res.rows[0];
}

// ✅ FIX: Always release connection in a finally block
async function getUser(id: string) {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM users WHERE id = $1", [id]);
    return res.rows[0];
  } finally {
    client.release(); // Guaranteed release even if an exception occurs!
  }
}
```

---

## 7. Direct State Mutation in Complex Objects

* **Root Cause**: Mutating properties of state objects/arrays directly instead of creating new references.
* **Impact**: React / UI frameworks fail to detect state changes, causing UI to not re-render.

```typescript
// ❌ BUG: Directly mutates state object; React skips re-rendering
const handleUpdateScore = (playerIndex: number, newScore: number) => {
  players[playerIndex].score = newScore; // Mutation!
  setPlayers(players); // React sees same reference, does not re-render!
};

// ✅ FIX: Create immutable copy with map / structuredClone
const handleUpdateScore = (playerIndex: number, newScore: number) => {
  setPlayers((prev) =>
    prev.map((player, idx) =>
      idx === playerIndex ? { ...player, score: newScore } : player
    )
  );
};
```

---

## 8. Unhandled JSON Parsing Crash

* **Root Cause**: `JSON.parse(data)` throws a syntax error if data is malformed or empty, crashing the entire request handler.
* **Impact**: Server 500 error or unhandled promise rejection.

```typescript
// ❌ BUG: Crashes on invalid JSON
function parseConfig(rawString: string) {
  return JSON.parse(rawString); // Throws unhandled SyntaxError on invalid input!
}

// ✅ FIX: Safe JSON parser with fallback
function safeParseJson<T>(rawString: string, fallback: T): T {
  try {
    return JSON.parse(rawString) as T;
  } catch {
    return fallback;
  }
}
```

---

## 9. CORS Preflight & Credentials Wildcard Conflict

* **Root Cause**: Setting `Access-Control-Allow-Origin: *` while simultaneously setting `Access-Control-Allow-Credentials: true`.
* **Impact**: Browser blocks all authenticated cross-origin requests with a CORS error.

```text
❌ BUG Response Headers:
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
(Browser rejects: Wildcard origin cannot be used when credentials flag is true)

✅ FIX Response Headers:
Access-Control-Allow-Origin: https://app.yourdomain.com  (Explicit origin)
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 10. Swallowed Promise Rejections

* **Root Cause**: An async function contains an empty `catch {}` block or fails to return/await an inner promise.
* **Impact**: Silent failures with zero log evidence.

```typescript
// ❌ BUG: Swallows error completely; nobody knows it failed
async function syncData() {
  try {
    await pushToRemote();
  } catch (e) {
    // Empty catch - silent failure!
  }
}

// ✅ FIX: Context-preserving structured logging
async function syncData() {
  try {
    await pushToRemote();
  } catch (error) {
    logger.error("Sync data operation failed during remote push", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    throw error; // Rethrow or return structured error status
  }
}
```

---

## 11. Dead Code, Unused Variables & Redundant Duplicates

### ❌ Anti-Pattern: Unused imports, dead unreachable code, or copy-pasted helper logic

```typescript
// ❌ WRONG: Leftover unused imports, unreachable dead logic, duplicate helper
import { fetchUserData, formatAddress, legacyParser } from './utils'; // formatAddress never used

function calculateDiscount(price: number, isVip: boolean): number {
  if (isVip) {
    return price * 0.8;
  } else {
    return price * 0.95;
  }
  console.log("Discount calculated"); // Unreachable dead code!
}
```

### ✅ Solution: Ruthless dead-code elimination & clean DRY consolidation

```typescript
// ✅ FIX: Clean imports, zero dead code, shared utilities
import { fetchUserData } from './utils';

function calculateDiscount(price: number, isVip: boolean): number {
  return price * (isVip ? 0.8 : 0.95);
}
```

---

## 12. Secret API Keys Exposed in Frontend / Client-Side Bundles

### ❌ Anti-Pattern: Hardcoding or prefixing private keys in client components

```typescript
// ❌ WRONG: Exposing private API keys to browser bundle
// In a client component ('use client'):
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY; // NEVER DO THIS!
// Or:
const stripeSecret = "sk_live_51Mz..."; // Hardcoded secret leaked in bundle!

export function ChatBox() {
  async function sendMessage(prompt: string) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      headers: { Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: prompt }] }),
    });
  }
}
```

### ✅ Solution: Proxy API calls through backend routes / server actions

```typescript
// ✅ FIX: Server-side API Route / Route Handler (app/api/chat/route.ts)
// The secret key is only accessed on the server (OPENAI_API_KEY without NEXT_PUBLIC_)
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY; // Secure server-only environment variable

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: { Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: prompt }] }),
  });
  const data = await response.json();
  return NextResponse.json(data);
}

// In the Client Component: call internal backend route
export function ChatBox() {
  async function sendMessage(prompt: string) {
    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
  }
}
```
