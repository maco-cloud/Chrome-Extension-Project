import type { ExtensionMessage, MessageType } from './types';

export class ExtensionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExtensionError';
  }
}

export async function sendMessage<TPayload, TResponse = unknown>(
  message: ExtensionMessage<TPayload>,
): Promise<TResponse> {
  const res = (await chrome.runtime.sendMessage(message)) as TResponse & {
    error?: string;
  };
  if (res && typeof res === 'object' && 'error' in res && res.error) {
    throw new ExtensionError(res.error);
  }
  return res as TResponse;
}

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof (value as ExtensionMessage).type === 'string'
  );
}

export type MessageHandler = (
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
) => Promise<unknown> | unknown;

export function onMessage(handlers: Partial<Record<MessageType, MessageHandler>>) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isExtensionMessage(message)) return;
    const handler = handlers[message.type];
    if (!handler) return;

    Promise.resolve(handler(message, sender))
      .then(sendResponse)
      .catch((err) => {
        sendResponse({
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      });
    return true;
  });
}
