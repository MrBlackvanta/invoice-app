import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { installMatchMedia, resetMedia } from "./support/media";
import { installDialog } from "./support/dialog";

Element.prototype.scrollIntoView ??= () => {};
Element.prototype.getAnimations ??= () => [];
installDialog();

beforeEach(() => {
  installMatchMedia();
});

afterEach(() => {
  cleanup();
  resetMedia();
  localStorage.clear();
  document.documentElement.className = "";
});
