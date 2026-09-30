import StatusFilter from "@/views/home/status-filter";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const show = (statuses: ("draft" | "pending" | "paid")[] = []) => {
  const onToggle = vi.fn();
  const user = userEvent.setup();

  render(
    <div>
      <button type="button">outside</button>
      <StatusFilter statuses={statuses} onToggle={onToggle} />
    </div>,
  );

  const trigger = screen.getByRole("button", { name: /^filter/i });

  return { user, onToggle, trigger };
};

const panelOf = (trigger: HTMLElement) =>
  document.getElementById(trigger.getAttribute("aria-controls") ?? "");

describe("StatusFilter", () => {
  it("starts collapsed", () => {
    const { trigger } = show();

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(panelOf(trigger)).not.toHaveAttribute("data-open");
  });

  it("points at the panel it controls", () => {
    const { trigger } = show();

    expect(panelOf(trigger)).not.toBeNull();
  });

  it("expands on click and collapses on a second click", async () => {
    const { user, trigger } = show();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(panelOf(trigger)).toHaveAttribute("data-open");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("offers the three invoice statuses", () => {
    show();

    expect(screen.getByRole("checkbox", { name: "Draft" })).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Pending" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Paid" })).toBeInTheDocument();
  });

  it("leaves every status unchecked when nothing is filtered", () => {
    show();

    screen
      .getAllByRole("checkbox")
      .forEach((box) => expect(box).not.toBeChecked());
  });

  it("checks only the statuses it was given", () => {
    show(["draft", "paid"]);

    expect(screen.getByRole("checkbox", { name: "Draft" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Paid" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Pending" })).not.toBeChecked();
  });

  it("reports the status the user ticked", async () => {
    const { user, onToggle, trigger } = show();

    await user.click(trigger);
    await user.click(screen.getByRole("checkbox", { name: "Pending" }));

    expect(onToggle).toHaveBeenCalledExactlyOnceWith("pending");
  });

  it("reports a status the user unticked", async () => {
    const { user, onToggle, trigger } = show(["paid"]);

    await user.click(trigger);
    await user.click(screen.getByRole("checkbox", { name: "Paid" }));

    expect(onToggle).toHaveBeenCalledExactlyOnceWith("paid");
  });

  it("stays open while the user ticks several statuses", async () => {
    const { user, onToggle, trigger } = show();

    await user.click(trigger);
    await user.click(screen.getByRole("checkbox", { name: "Draft" }));
    await user.click(screen.getByRole("checkbox", { name: "Paid" }));

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it("closes on Escape and hands focus back to the trigger", async () => {
    const { user, trigger } = show();

    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("ignores Escape while already closed", async () => {
    const { user, trigger } = show();

    await user.click(trigger);
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes when the user points at something else", async () => {
    const { user, trigger } = show();

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "outside" }));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("is reachable and operable from the keyboard alone", async () => {
    const { user, onToggle } = show();

    await user.tab();
    await user.tab();
    await user.keyboard("{Enter}");
    await user.tab();
    await user.keyboard(" ");

    expect(onToggle).toHaveBeenCalledExactlyOnceWith("draft");
  });
});
