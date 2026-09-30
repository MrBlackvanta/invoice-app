type Listener = (event: MediaQueryListEvent) => void;

const matching = new Set<string>();
const listeners = new Map<string, Set<Listener>>();

const listenersFor = (query: string) => {
  const existing = listeners.get(query);
  if (existing) return existing;

  const created = new Set<Listener>();
  listeners.set(query, created);

  return created;
};

export const installMatchMedia = () => {
  window.matchMedia = (query: string) =>
    ({
      media: query,
      get matches() {
        return matching.has(query);
      },
      onchange: null,
      addEventListener: (_: "change", listener: Listener) =>
        void listenersFor(query).add(listener),
      removeEventListener: (_: "change", listener: Listener) =>
        void listenersFor(query).delete(listener),
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
};

export const resetMedia = () => {
  matching.clear();
  listeners.clear();
};

export const setMediaMatches = (query: string, matches: boolean) => {
  if (matches) matching.add(query);
  else matching.delete(query);

  listenersFor(query).forEach((listener) =>
    listener({ matches, media: query } as MediaQueryListEvent),
  );
};

export const prefersDark = (matches: boolean) =>
  setMediaMatches("(prefers-color-scheme: dark)", matches);
