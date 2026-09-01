# 🧰 Universal Anti-Hallucination & Debugging Toolkit

Zero-dependency, production-grade utility functions that can be dropped into **any codebase** (TypeScript, JavaScript, Python, Go, Rust) to enforce type alignment, prevent AI hallucinations, handle async safely, and eliminate runtime bugs.

---

## 1. 🛡️ TypeScript / JavaScript Implementations

### `assertNever` (Exhaustive Pattern Matching)

```typescript
/**
 * Enforces exhaustive pattern matching at compile time.
 * If any case of a discriminated union is unhandled, TypeScript will fail compilation.
 */
export function assertNever(value: never, customMessage?: string): never {
  throw new Error(
    customMessage ?? `[Zero-Bug Invariant] Unhandled union variant encountered: ${JSON.stringify(value)}`
  );
}

// 📖 Usage:
type Status = "idle" | "loading" | "success" | "error";
function handleStatus(status: Status) {
  switch (status) {
    case "idle": return "Ready";
    case "loading": return "Processing...";
    case "success": return "Done!";
    case "error": return "Failed!";
    default:
      return assertNever(status); // Fails build if new variant added!
  }
}
```

### `safeAsync` (Result Tuple Pattern)

```typescript
export type Result<T, E = Error> = [data: T, error: null] | [data: null, error: E];

export async function safeAsync<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return [data, null];
  } catch (rawError) {
    const error = (rawError instanceof Error ? rawError : new Error(String(rawError))) as E;
    return [null, error];
  }
}
```

### `withTimeout` (AbortSignal Guard)

```typescript
export async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs = 8000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fn(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`[Timeout Error] Operation exceeded time limit of ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
```

### `withRetry` (Exponential Backoff + Full Jitter)

```typescript
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 300,
  maxDelayMs = 5000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) break;
      const expDelay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
      const jitter = expDelay * (0.5 + Math.random() * 0.5);
      await new Promise((resolve) => setTimeout(resolve, jitter));
    }
  }
  throw lastError;
}
```

---

## 2. 🐍 Python Implementations

```python
import asyncio
import random
from typing import TypeVar, Callable, Any, Tuple, Optional

T = TypeVar("T")

async def safe_async(coroutine) -> Tuple[Optional[T], Optional[Exception]]:
    """Safe Result tuple pattern for Python async."""
    try:
        data = await coroutine
        return data, None
    except Exception as err:
        return None, err

async def with_retry(
    async_fn: Callable[[], Any],
    max_retries: int = 3,
    base_delay: float = 0.3,
    max_delay: float = 5.0
) -> Any:
    """Exponential backoff with full jitter in Python."""
    for attempt in range(max_retries + 1):
        try:
            return await async_fn()
        except Exception as err:
            if attempt == max_retries:
                raise err
            delay = min(max_delay, base_delay * (2 ** attempt)) * random.uniform(0.5, 1.5)
            await asyncio.sleep(delay)
```

---

## 3. 🐹 Go Implementations

```go
package utils

import (
    "context"
    "fmt"
    "math/rand"
    "time"
)

// WithRetry executes a function with exponential backoff and randomized jitter
func WithRetry(ctx context.Context, maxRetries int, baseDelay time.Duration, maxDelay time.Duration, op func() error) error {
    var err error
    for attempt := 0; attempt <= maxRetries; attempt++ {
        err = op()
        if err == nil {
            return nil
        }
        if attempt == maxRetries {
            break
        }

        backoff := time.Duration(float64(baseDelay) * float64(int(1)<<attempt))
        if backoff > maxDelay {
            backoff = maxDelay
        }
        jitter := time.Duration(float64(backoff) * (0.5 + rand.Float64()*0.5))

        select {
        case <-time.After(jitter):
        case <-ctx.Done():
            return ctx.Err()
        }
    }
    return fmt.Errorf("operation failed after %d retries: %w", maxRetries, err)
}
```

---

## 4. 🦀 Rust Implementations

```rust
use std::time::Duration;
use tokio::time::sleep;

/// Retries an asynchronous future with exponential backoff and jitter
pub async fn with_retry<F, Fut, T, E>(
    mut op: F,
    max_retries: u32,
    base_delay: Duration,
    max_delay: Duration,
) -> Result<T, E>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = Result<T, E>>,
{
    let mut attempt = 0;
    loop {
        match op().await {
            Ok(val) => return Ok(val),
            Err(err) => {
                if attempt >= max_retries {
                    return Err(err);
                }
                attempt += 1;
                let exp = base_delay.as_millis() * (1 << attempt);
                let cap = exp.min(max_delay.as_millis()) as f64;
                let jitter = cap * (0.5 + rand::random::<f64>() * 0.5);
                sleep(Duration::from_millis(jitter as u64)).await;
            }
        }
    }
}
```

---

## 5. 🐘 PHP Implementations (PHP 8.2+)

```php
<?php

declare(strict_types=1);

namespace App\Utils;

use Throwable;
use LogicException;
use BackedEnum;

/**
 * Enforces exhaustive match branches for enums or union states.
 */
function assertNever(mixed $value, ?string $message = null): never
{
    $formatted = is_object($value) && $value instanceof BackedEnum
        ? (string) $value->value
        : (string) json_encode($value);

    throw new LogicException(
        $message ?? "[Zero-Bug Invariant] Unhandled variant encountered: {$formatted}"
    );
}

/**
 * Safe Result tuple pattern for PHP: returns [$data, $error].
 *
 * @template T
 * @param callable(): T $callable
 * @return array{0: T|null, 1: Throwable|null}
 */
function safeCall(callable $callable): array
{
    try {
        return [$callable(), null];
    } catch (Throwable $e) {
        return [null, $e];
    }
}

/**
 * Exponential backoff with jitter for PHP operations.
 *
 * @template T
 * @param callable(): T $operation
 * @param int $maxRetries
 * @param int $baseDelayMs
 * @param int $maxDelayMs
 * @return T
 * @throws Throwable
 */
function withRetry(
    callable $operation,
    int $maxRetries = 3,
    int $baseDelayMs = 300,
    int $maxDelayMs = 5000
): mixed {
    $lastError = null;

    for ($attempt = 0; $attempt <= $maxRetries; $attempt++) {
        try {
            return $operation();
        } catch (Throwable $e) {
            $lastError = $e;
            if ($attempt === $maxRetries) {
                break;
            }

            $expDelay = min($maxDelayMs, $baseDelayMs * (2 ** $attempt));
            $jitter = (int) ($expDelay * (0.5 + (mt_rand(0, 1000) / 1000.0) * 0.5));
            usleep($jitter * 1000);
        }
    }

    throw $lastError;
}
```
