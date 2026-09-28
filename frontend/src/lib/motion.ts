export const afterMotion = (node: Element | null) =>
  new Promise<void>((done) => {
    if (!node) return done();

    requestAnimationFrame(() => {
      const running = node.getAnimations({ subtree: true });
      Promise.allSettled(running.map(({ finished }) => finished)).then(() =>
        done(),
      );
    });
  });

export const bringIntoView = (node: Element | null) =>
  node?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "nearest",
  });
