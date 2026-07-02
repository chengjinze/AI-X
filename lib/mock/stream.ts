export interface StreamCallbacks {
  onChar: (char: string) => void;
  onComplete: () => void;
}

export function simulateStream(
  text: string,
  callbacks: StreamCallbacks,
  speed = 15
): () => void {
  let index = 0;
  let cancelled = false;

  const interval = setInterval(() => {
    if (cancelled) {
      clearInterval(interval);
      return;
    }
    if (index < text.length) {
      callbacks.onChar(text[index]);
      index++;
    } else {
      clearInterval(interval);
      callbacks.onComplete();
    }
  }, speed);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}
