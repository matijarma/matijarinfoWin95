export function delay(ms) {
  const safeDurationMs = Math.max(0, ms);

  return new Promise((resolve) => {
    setTimeout(resolve, safeDurationMs);
  });
}
