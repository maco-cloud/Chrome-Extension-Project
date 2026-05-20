export type EditableField = HTMLTextAreaElement | HTMLElement;

const FIELD_SELECTOR = [
  'textarea:not([disabled]):not([readonly])',
  'input[type="text"]:not([disabled]):not([readonly])',
  '[contenteditable="true"]',
  '[contenteditable=""]',
  '[role="textbox"]',
].join(',');

const IGNORED_ANCESTORS = ['SCRIPT', 'STYLE', 'NOSCRIPT'];

export function isEditableElement(el: Element | null): el is EditableField {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el.closest('[data-ara-ignore]')) return false;

  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return !el.disabled && !el.readOnly;
  }

  if (el.isContentEditable) return true;
  return el.getAttribute('role') === 'textbox';
}

export function findEditableFields(root: ParentNode = document): EditableField[] {
  const nodes = root.querySelectorAll(FIELD_SELECTOR);
  const fields: EditableField[] = [];

  nodes.forEach((node) => {
    if (!isEditableElement(node)) return;
    let parent: HTMLElement | null = node.parentElement;
    while (parent) {
      if (IGNORED_ANCESTORS.includes(parent.tagName)) return;
      parent = parent.parentElement;
    }
    if (!fields.includes(node)) fields.push(node);
  });

  return fields;
}

export function getFieldText(field: EditableField): string {
  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
    return field.value;
  }
  return field.innerText || field.textContent || '';
}

function setNativeValue(
  el: HTMLTextAreaElement | HTMLInputElement,
  value: string,
): void {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
  const setter = descriptor?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }
}

export function setFieldText(field: EditableField, text: string): void {
  if (field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement) {
    setNativeValue(field, text);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  field.focus();
  const selection = window.getSelection();
  if (selection && field.contains(selection.anchorNode)) {
    selection.deleteFromDocument();
    selection.getRangeAt(0).insertNode(document.createTextNode(text));
  } else {
    field.textContent = text;
  }
  field.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
}

export function extractContext(field: EditableField): string {
  const draft = getFieldText(field).trim();
  const container =
    field.closest('[role="main"]') ??
    field.closest('article') ??
    field.closest('.msg-form') ??
    field.closest('[data-testid]') ??
    field.parentElement?.parentElement;

  const threadLines: string[] = [];
  if (container) {
    const candidates = container.querySelectorAll(
      'blockquote, .gmail_default, [data-message-author], .msg-s-message-list-container p, [data-testid="tweetText"]',
    );
    candidates.forEach((el, i) => {
      if (i > 8) return;
      const t = (el.textContent || '').trim();
      if (t.length > 20) threadLines.push(t.slice(0, 400));
    });
  }

  const context = threadLines.length ? threadLines.join('\n---\n') : draft;
  return context.slice(0, 4000);
}

export function getFieldRect(field: EditableField): DOMRect {
  return field.getBoundingClientRect();
}
