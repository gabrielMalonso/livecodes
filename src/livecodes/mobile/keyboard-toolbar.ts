interface KeyboardEditor {
  contentDOM: HTMLElement;
  insertText: (text: string) => void;
  indent: () => void;
  outdent: () => void;
}

const keyGroups = [
  ['(', ')', '{', '}', '[', ']', '<', '>', '"', '`', ':', ';'],
  ['=', '!', '&', '|', '=>'],
];

const createKeyboardToolbar = () => {
  const editors = new Set<KeyboardEditor>();
  // The Android host publishes IME visibility; viewport size alone also changes on rotation.
  const host = parent as Window & { livecodesKeyboardVisible?: boolean };
  let keyboardVisible = host.livecodesKeyboardVisible === true;
  let activeEditor: KeyboardEditor | undefined;
  let columns = 0;
  let pageIndex = 0;

  const toolbar = document.createElement('div');
  toolbar.id = 'mobile-keyboard-toolbar';
  toolbar.hidden = true;
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute(
    'aria-label',
    window.deps.translateString('keyboardToolbar.label', 'Coding keys'),
  );

  const fixed = document.createElement('div');
  fixed.className = 'keyboard-fixed-keys';
  const pager = document.createElement('div');
  pager.className = 'keyboard-pager';
  const pages = document.createElement('div');
  pages.className = 'keyboard-pages';
  const indicators = document.createElement('div');
  indicators.className = 'keyboard-page-indicators';
  pager.append(pages, indicators);
  toolbar.append(fixed, pager);
  document.body.append(toolbar);

  const makeKey = (label: string, action: () => void, title = label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.title = title;
    button.setAttribute('aria-label', title);
    button.addEventListener('click', action);
    return button;
  };
  fixed.append(
    makeKey(
      'Tab',
      () => activeEditor?.indent(),
      window.deps.translateString('keyboardToolbar.indent', 'Indent'),
    ),
    makeKey(
      '⇧ Tab',
      () => activeEditor?.outdent(),
      window.deps.translateString('keyboardToolbar.outdent', 'Outdent'),
    ),
  );

  const updateIndicators = () => {
    if (!pages.clientWidth) return;
    pageIndex = Math.round(pages.scrollLeft / pages.clientWidth);
    Array.from(indicators.children).forEach((indicator, index) => {
      indicator.setAttribute('aria-pressed', String(index === pageIndex));
    });
  };

  const layoutPages = () => {
    const width = pages.clientWidth;
    if (!width) return;
    const nextColumns = Math.max(1, Math.floor((width + 4) / 48));
    if (nextColumns !== columns) {
      columns = nextColumns;
      const groups = keyGroups.flatMap((group) => {
        const count = Math.ceil(group.length / columns);
        const size = Math.ceil(group.length / count);
        return Array.from({ length: count }, (_, index) =>
          group.slice(index * size, (index + 1) * size),
        );
      });
      pages.replaceChildren();
      indicators.replaceChildren();
      groups.forEach((keys, index) => {
        const page = document.createElement('div');
        page.className = 'keyboard-key-page';
        keys.forEach((key) => page.append(makeKey(key, () => activeEditor?.insertText(key))));
        pages.append(page);
        const title = `${window.deps.translateString('keyboardToolbar.page', 'Page')} ${index + 1} / ${groups.length}`;
        const indicator = makeKey(
          '',
          () => pages.scrollTo({ left: index * pages.clientWidth }),
          title,
        );
        indicators.append(indicator);
      });
      pageIndex = Math.min(pageIndex, groups.length - 1);
    }
    pages.scrollLeft = pageIndex * width;
    updateIndicators();
  };

  const syncVisibility = () => {
    if (!toolbar.contains(document.activeElement)) {
      activeEditor = Array.from(editors).find((editor) =>
        editor.contentDOM.contains(document.activeElement),
      );
    }
    const visible = keyboardVisible && activeEditor !== undefined;
    toolbar.hidden = !visible;
    document.body.classList.toggle('mobile-keyboard-open', visible);
    if (visible) layoutPages();
  };
  const onFocusOut = () => queueMicrotask(syncVisibility);
  const onKeyboardChange = (event: Event) => {
    if (!('detail' in event) || typeof event.detail !== 'boolean') return;
    keyboardVisible = event.detail;
    syncVisibility();
  };

  // Cancel focus transfer, while touch-action still allows native horizontal swipes.
  toolbar.addEventListener('pointerdown', (event) => event.preventDefault());
  pages.addEventListener('scroll', updateIndicators, { passive: true });
  document.addEventListener('focusin', syncVisibility);
  document.addEventListener('focusout', onFocusOut);
  host.addEventListener('livecodes-keyboard', onKeyboardChange);
  const observer = new ResizeObserver(layoutPages);
  observer.observe(pages);

  return {
    register: (editor: KeyboardEditor) => {
      editors.add(editor);
      syncVisibility();
      return () => {
        editors.delete(editor);
        if (activeEditor === editor) activeEditor = undefined;
        syncVisibility();
        if (editors.size) return;
        observer.disconnect();
        document.removeEventListener('focusin', syncVisibility);
        document.removeEventListener('focusout', onFocusOut);
        host.removeEventListener('livecodes-keyboard', onKeyboardChange);
        toolbar.remove();
        keyboardToolbar = undefined;
      };
    },
  };
};

let keyboardToolbar: ReturnType<typeof createKeyboardToolbar> | undefined;

export const registerKeyboardToolbar = (editor: KeyboardEditor) => {
  keyboardToolbar ??= createKeyboardToolbar();
  return keyboardToolbar.register(editor);
};
