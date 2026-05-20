import { toUserMessage } from "./user-messages.js";

export function sendMessage(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, ...payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(
          new Error(
            toUserMessage(
              { message: chrome.runtime.lastError.message },
              "Could not reach the extension. Try closing and reopening the popup.",
            ),
          ),
        );
        return;
      }
      if (!response?.ok) {
        reject(
          new Error(
            toUserMessage(
              { message: response?.error },
              "Request failed. Please try again.",
            ),
          ),
        );
        return;
      }
      resolve(response.data);
    });
  });
}
