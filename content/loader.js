(async () => {
  try {
    const src = chrome.runtime.getURL('content/index.js');
    await import(src);
  } catch (e) {
    console.error('[AssistX] Failed to load content script:', e);
  }
})();
