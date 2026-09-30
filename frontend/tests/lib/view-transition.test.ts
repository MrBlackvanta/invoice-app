import { withThemeSweep } from "@/lib/view-transition";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prefersReducedMotion } from "../support/media";

const VIEWPORT = { width: 1000, height: 600 };

const TOP_RIGHT = { x: 1000, y: 0 };
const CENTRE = { x: 500, y: 300 };

type Settle = { resolve: () => void; reject: (reason?: unknown) => void };

const settleable = (): [Promise<void>, Settle] => {
  let settle!: Settle;
  const promise = new Promise<void>((resolve, reject) => {
    settle = { resolve, reject };
  });

  promise.catch(() => {});

  return [promise, settle];
};

const root = () => document.documentElement;

const sweepProperty = (name: string) =>
  Number.parseFloat(root().style.getPropertyValue(name));

const stubViewport = () => {
  for (const [property, value] of [
    ["clientWidth", VIEWPORT.width],
    ["clientHeight", VIEWPORT.height],
  ] as const)
    Object.defineProperty(root(), property, {
      configurable: true,
      value,
    });
};

const stubViewTransition = () => {
  const [ready, readyControls] = settleable();
  const [finished, finishedControls] = settleable();
  const start = vi.fn((update: () => void) => {
    update();

    return { ready, finished };
  });

  Object.defineProperty(document, "startViewTransition", {
    configurable: true,
    value: start,
  });

  return { start, readyControls, finishedControls };
};

const supportsViewTransitions = () =>
  Object.prototype.hasOwnProperty.call(document, "startViewTransition");

beforeEach(stubViewport);

afterEach(() => {
  if (supportsViewTransitions())
    Reflect.deleteProperty(document, "startViewTransition");
});

describe("without view transitions", () => {
  it("still applies the change", () => {
    const update = vi.fn();

    withThemeSweep(update, CENTRE, false);

    expect(update).toHaveBeenCalledOnce();
  });

  it("marks nothing on the document", () => {
    withThemeSweep(() => {}, CENTRE, false);

    expect(root().dataset.sweep).toBeUndefined();
    expect(root().style.getPropertyValue("--sweep-r")).toBe("");
  });
});

describe("when motion is not wanted", () => {
  it("applies the change without starting a transition", () => {
    const { start } = stubViewTransition();
    prefersReducedMotion(true);
    const update = vi.fn();

    withThemeSweep(update, CENTRE, false);

    expect(update).toHaveBeenCalledOnce();
    expect(start).not.toHaveBeenCalled();
    expect(root().dataset.sweep).toBeUndefined();
  });
});

describe("the sweep", () => {
  it("runs the change inside the transition rather than before it", () => {
    const order: string[] = [];
    const [ready] = settleable();
    const [finished] = settleable();

    Object.defineProperty(document, "startViewTransition", {
      configurable: true,
      value: (update: () => void) => {
        order.push("transition started");
        update();

        return { ready, finished };
      },
    });

    withThemeSweep(() => order.push("theme painted"), CENTRE, false);

    expect(order).toEqual(["transition started", "theme painted"]);
  });

  it("opens outward when the new theme arrives underneath", () => {
    stubViewTransition();

    withThemeSweep(() => {}, CENTRE, false);

    expect(root().dataset.sweep).toBe("in");
  });

  it("closes inward when the old theme is what peels away", () => {
    stubViewTransition();

    withThemeSweep(() => {}, CENTRE, true);

    expect(root().dataset.sweep).toBe("out");
  });

  it("puts the circle where the button was", () => {
    stubViewTransition();

    withThemeSweep(() => {}, CENTRE, false);

    expect(sweepProperty("--sweep-x")).toBeCloseTo(50, 5);
    expect(sweepProperty("--sweep-y")).toBeCloseTo(50, 5);
  });

  it("puts it in the corner when the button is in the corner", () => {
    stubViewTransition();

    withThemeSweep(() => {}, TOP_RIGHT, false);

    expect(sweepProperty("--sweep-x")).toBeCloseTo(100, 5);
    expect(sweepProperty("--sweep-y")).toBeCloseTo(0, 5);
  });

  it("grows only as far as the furthest corner", () => {
    stubViewTransition();

    withThemeSweep(() => {}, TOP_RIGHT, false);

    expect(sweepProperty("--sweep-r")).toBeCloseTo(100 * Math.SQRT2, 5);
  });

  it("needs a smaller circle from the middle than from a corner", () => {
    stubViewTransition();

    withThemeSweep(() => {}, CENTRE, false);

    expect(sweepProperty("--sweep-r")).toBeCloseTo((100 * Math.SQRT2) / 2, 5);
  });
});

describe("after the sweep", () => {
  it("unmarks the document once the transition finishes", async () => {
    const { finishedControls } = stubViewTransition();

    withThemeSweep(() => {}, CENTRE, false);
    expect(root().dataset.sweep).toBe("in");

    finishedControls.resolve();
    await vi.waitFor(() => expect(root().dataset.sweep).toBeUndefined());
  });

  it("unmarks it when the transition is skipped", async () => {
    const { finishedControls } = stubViewTransition();

    withThemeSweep(() => {}, CENTRE, true);

    finishedControls.reject(new DOMException("skipped", "AbortError"));
    await vi.waitFor(() => expect(root().dataset.sweep).toBeUndefined());
  });

  it("unmarks it when the transition never becomes ready", async () => {
    const { readyControls } = stubViewTransition();

    withThemeSweep(() => {}, CENTRE, false);

    readyControls.reject(new DOMException("aborted", "AbortError"));
    await vi.waitFor(() => expect(root().dataset.sweep).toBeUndefined());
  });
});
