import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { installTranslationDomGuard } from "./translation-dom-guard";

// What Google Translate does: swap each text node for <font><font>…</font></font>.
function translate(container: HTMLElement) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }
  for (const text of textNodes) {
    const outer = document.createElement("font");
    const inner = document.createElement("font");
    inner.textContent = `translated ${text.data}`;
    outer.appendChild(inner);
    text.replaceWith(outer);
  }
}

function Vote({ yes }: { yes: boolean }) {
  return createElement(
    "button",
    { type: "button" },
    yes ? "Yes" : null,
    "Vote",
    " ",
    "now",
  );
}

function mountTranslated() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(createElement(Vote, { yes: true })));
  translate(container);
  return { container, root };
}

describe("installTranslationDomGuard", () => {
  // Runs first: the guard patches Node.prototype for the rest of the file.
  it("React throws on a translated page without the guard", () => {
    const { root } = mountTranslated();
    expect(() =>
      act(() => root.render(createElement(Vote, { yes: false }))),
    ).toThrow(/not a child/);
  });

  it("lets React update and unmount a translated page", () => {
    installTranslationDomGuard();
    const { container, root } = mountTranslated();
    act(() => root.render(createElement(Vote, { yes: false })));
    act(() => root.render(createElement(Vote, { yes: true })));
    expect(container.querySelector("button")?.textContent).toContain("Yes");
    act(() => root.unmount());
    expect(container.innerHTML).toBe("");
  });

  it("inserts before the wrapper of a wrapped reference node", () => {
    const parent = document.createElement("div");
    const reference = document.createTextNode("b");
    const wrapper = document.createElement("font");
    parent.appendChild(wrapper);
    wrapper.appendChild(reference);
    const inserted = document.createTextNode("a");
    parent.insertBefore(inserted, reference);
    expect(parent.firstChild).toBe(inserted);
    expect(parent.lastChild).toBe(wrapper);
  });

  it("removes a wrapped child from its wrapper", () => {
    const parent = document.createElement("div");
    const wrapper = document.createElement("font");
    const child = document.createTextNode("a");
    parent.appendChild(wrapper);
    wrapper.appendChild(child);
    parent.removeChild(child);
    expect(child.parentNode).toBeNull();
  });

  it("ignores removing a node that is not under the parent", () => {
    const parent = document.createElement("div");
    const stranger = document.createElement("span");
    expect(parent.removeChild(stranger)).toBe(stranger);
  });
});
