import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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

const INSTALLED = Symbol.for("rallly.translationDomGuard");
const nativeRemoveChild = Node.prototype.removeChild;
const nativeInsertBefore = Node.prototype.insertBefore;

function restoreNativeDom() {
  Node.prototype.removeChild = nativeRemoveChild;
  Node.prototype.insertBefore = nativeInsertBefore;
  delete (Node.prototype as { [INSTALLED]?: true })[INSTALLED];
}

describe("installTranslationDomGuard", () => {
  beforeEach(restoreNativeDom);
  afterEach(restoreNativeDom);

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
    installTranslationDomGuard();
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

  it("appends when the reference text node was detached", () => {
    installTranslationDomGuard();
    const parent = document.createElement("div");
    parent.appendChild(document.createElement("span"));
    const inserted = document.createTextNode("a");
    parent.insertBefore(inserted, document.createTextNode("gone"));
    expect(parent.lastChild).toBe(inserted);
  });

  it("removes a wrapped child from its wrapper", () => {
    installTranslationDomGuard();
    const parent = document.createElement("div");
    const wrapper = document.createElement("font");
    const child = document.createTextNode("a");
    parent.appendChild(wrapper);
    wrapper.appendChild(child);
    parent.removeChild(child);
    expect(child.parentNode).toBeNull();
  });

  it("ignores removing a detached text node", () => {
    installTranslationDomGuard();
    const parent = document.createElement("div");
    const text = document.createTextNode("gone");
    expect(parent.removeChild(text)).toBe(text);
  });

  it("keeps the native error for nodes translation did not touch", () => {
    installTranslationDomGuard();
    const parent = document.createElement("div");
    const elsewhere = document.createElement("div");
    const element = document.createElement("span");
    const text = document.createTextNode("a");
    elsewhere.append(element, text);
    expect(() => parent.removeChild(document.createElement("span"))).toThrow();
    expect(() => parent.removeChild(text)).toThrow();
    expect(() =>
      parent.insertBefore(document.createTextNode("b"), element),
    ).toThrow();
    expect(() =>
      parent.insertBefore(document.createTextNode("b"), text),
    ).toThrow();
  });
});
