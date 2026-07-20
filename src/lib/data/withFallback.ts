/**
 * withFallback — graceful degradation helper.
 * If the live data function throws (missing env, connection error, query error),
 * returns the mock fixture instead. Logs a structured warning. Never 500s.
 *
 * Pattern: withFallback(liveFn, mockFixture, label)
 */

export interface FallbackResult<T> {
  data: T;
  isFallback: boolean;
}

export async function withFallback<T>(
  liveFn: () => Promise<T>,
  mockFixture: T,
  label: string
): Promise<FallbackResult<T>> {
  try {
    const data = await liveFn();
    return { data, isFallback: false };
  } catch (err) {
    console.warn(`[withFallback] ${label}: falling back to mock data`, {
      route: label,
      cause: err instanceof Error ? err.message : String(err),
    });
    return { data: mockFixture, isFallback: true };
  }
}
