import { useCallback, useEffect, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { AnimatePresence } from 'framer-motion';
import { sendMessage } from '../shared/messaging';
import type { ExtensionState } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/constants';
import { isHostAllowed } from './site-guard';
import {
  findEditableFields,
  isEditableElement,
  getFieldRect,
  type EditableField,
} from './field-detector';
import { FloatingTrigger } from './FloatingTrigger';
import { ReplyToolbar } from './ReplyToolbar';
import contentStyles from '../styles/content-shadow.css?inline';

export function ContentApp() {
  const [state, setState] = useState<ExtensionState | null>(null);
  const [activeField, setActiveField] = useState<EditableField | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const loadState = useCallback(async () => {
    const res = await sendMessage<undefined, ExtensionState>({ type: 'GET_STATE' });
    setState(res);
    setEnabled(isHostAllowed(location.hostname, res.settings ?? DEFAULT_SETTINGS));
  }, []);

  useEffect(() => {
    loadState();
    const onStorage = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.ara_settings || changes.ara_subscription) loadState();
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => chrome.storage.onChanged.removeListener(onStorage);
  }, [loadState]);

  useEffect(() => {
    if (!enabled) return;

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as Element;
      if (isEditableElement(target)) {
        setActiveField(target);
        setShowToolbar(false);
      }
    };

    document.addEventListener('focusin', onFocusIn, true);
    return () => document.removeEventListener('focusin', onFocusIn, true);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const scan = () => findEditableFields();
    const observer = new MutationObserver(() => {
      if (document.activeElement && isEditableElement(document.activeElement)) {
        setActiveField(document.activeElement);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['contenteditable', 'disabled', 'readonly'],
    });

    scan();
    return () => observer.disconnect();
  }, [enabled]);

  const handleUpgrade = useCallback(() => {
    sendMessage({ type: 'OPEN_CHECKOUT', payload: { interval: 'monthly' } });
    sendMessage({ type: 'TRACK_EVENT', payload: { event: 'upgrade_click' } });
  }, []);

  if (!enabled || !state || !activeField) return null;

  const rect = getFieldRect(activeField);

  return (
    <>
      {!showToolbar && (
        <FloatingTrigger
          rect={rect}
          onClick={() => {
            setShowToolbar(true);
            sendMessage({
              type: 'TRACK_EVENT',
              payload: { event: 'toolbar_open', siteHost: location.hostname },
            }).catch(() => {});
          }}
        />
      )}
      <AnimatePresence>
        {showToolbar && (
          <ReplyToolbar
            field={activeField}
            anchorRect={rect}
            state={state}
            onClose={() => setShowToolbar(false)}
            onUpgrade={handleUpgrade}
          />
        )}
      </AnimatePresence>
    </>
  );
}

let root: Root | null = null;
let host: HTMLDivElement | null = null;

export function mountContentApp() {
  if (host) return;

  host = document.createElement('div');
  host.id = 'ai-reply-anywhere-root';
  host.setAttribute('data-ara-ignore', 'true');
  host.style.cssText =
    'position:absolute;top:0;left:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:2147483647;';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = contentStyles;
  shadow.appendChild(style);

  const mountPoint = document.createElement('div');
  mountPoint.style.pointerEvents = 'auto';
  shadow.appendChild(mountPoint);

  root = createRoot(mountPoint);
  root.render(<ContentApp />);
}
