// Browser page translation (Chrome, Google Translate, Safari) and some
// extensions replace the text nodes React rendered with <font> wrappers. React
// still holds the original nodes, so its next removeChild or insertBefore on
// them throws NotFoundError and the error boundary replaces the page. These
// patches make both calls tolerate a node that has moved, so the page keeps
// working and stays translatable. See facebook/react#11538.

const INSTALLED = Symbol.for("rallly.translationDomGuard");

type GuardedPrototype = typeof Node.prototype & { [INSTALLED]?: true };

// A text node a translator detached, or wrapped while leaving it under
// `parent`. Anything else keeps the native NotFoundError.
function isTranslatedText(parent: Node, node: Node) {
  return (
    node.nodeType === Node.TEXT_NODE &&
    (node.parentNode === null || parent.contains(node))
  );
}

// The direct child of `parent` that contains `node`, when a wrapper was
// inserted between them.
function childContaining(parent: Node, node: Node) {
  let current: Node | null = node;
  while (current && current.parentNode !== parent) {
    current = current.parentNode;
  }
  return current;
}

export function installTranslationDomGuard() {
  if (typeof Node !== "function") {
    return;
  }
  const proto: GuardedPrototype = Node.prototype;
  if (proto[INSTALLED]) {
    return;
  }
  proto[INSTALLED] = true;

  const originalRemoveChild = proto.removeChild;
  proto.removeChild = function removeChild<T extends Node>(
    this: Node,
    child: T,
  ): T {
    if (child.parentNode === this || !isTranslatedText(this, child)) {
      return originalRemoveChild.call(this, child) as T;
    }
    // Wrapped in a <font> that is still under this parent: remove it from
    // where it is. Already detached by the translator: nothing to remove.
    if (child.parentNode) {
      return originalRemoveChild.call(child.parentNode, child) as T;
    }
    return child;
  };

  const originalInsertBefore = proto.insertBefore;
  proto.insertBefore = function insertBefore<T extends Node>(
    this: Node,
    node: T,
    child: Node | null,
  ): T {
    if (!child || child.parentNode === this || !isTranslatedText(this, child)) {
      return originalInsertBefore.call(this, node, child) as T;
    }
    // The reference node is wrapped: insert before its wrapper. It was
    // detached: its position is lost, so append rather than drop the node.
    const anchor = childContaining(this, child);
    return originalInsertBefore.call(this, node, anchor) as T;
  };
}
