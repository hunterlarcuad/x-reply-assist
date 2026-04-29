/**
 * Wait for an element to appear in the DOM
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Element>}
 */
export function waitForSelector(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for selector: ${selector}`));
    }, timeout);
  });
}

/**
 * Simulate human-like typing
 * @param {Element} element - Input/Textarea element
 * @param {string} text - Text to type
 */
export async function simulateTyping(element, text) {
  console.log('simulateTyping called. Text length:', text.length);
  element.focus();
  
  // For contenteditable divs (like Twitter's), we need to handle it differently than input/textarea
  // Twitter uses Draft.js or similar, so direct value assignment doesn't work well.
  // We often need to use document.execCommand('insertText') or dispatch events.
  
  // Try execCommand first as it's most reliable for contenteditable
  // But to simulate typing, we split it.
  
  for (const char of text) {
    // Random delay between 50ms and 150ms
    const delay = Math.floor(Math.random() * 100) + 50;
    await new Promise(r => setTimeout(r, delay));
    
    document.execCommand('insertText', false, char);
    
    // Dispatch input events just in case (though insertText usually handles it)
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

/**
 * Sleep for a random duration
 * @param {number} min - Minimum ms
 * @param {number} max - Maximum ms
 */
export function randomSleep(min = 500, max = 1500) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(r => setTimeout(r, delay));
}

/**
 * Build AI reply prompt
 * @param {Object} options - Prompt options
 * @param {string} options.tweetText - The tweet text to reply to
 * @param {string} options.commandText - The command/style text
 * @param {number} options.wordLimit - Word limit for reply
 * @returns {string} The constructed prompt
 */
export function buildReplyPrompt({ tweetText, commandText = '友好地回复推文内容', wordLimit = 70, replyLanguage = 'auto' }) {
  let langReq = '必须使用与原推文相同的语言回复！原推文是英文就用英文回复，原推文是中文就用中文回复。';
  if (replyLanguage === 'zh') {
    langReq = '必须使用中文(简体)回复！不论原推文是什么语言，都翻译或用中文回复。';
  } else if (replyLanguage === 'en') {
    langReq = '必须使用英文(English)回复！不论原推文是什么语言，都翻译或用英文回复。';
  }

  return `【功能】
对推文内容进行回复

【重要：语言要求】
${langReq}

【要求】
${commandText}
回复要简短。
回复内容要与原推文相关，态度友好。
回复字数控制在 ${wordLimit} 字以内。
回复的内容是直接可以回复的，不要出现与回复无关的内容。
输出不要出现换行符。

【参考推文内容如下】
${tweetText || '(未获取到帖子内容)'}`;
}

/**
 * 一次性构建多风格回复的提示词 (参考 xnotice.py 逻辑)
 */
export function buildMultiReplyPrompt({ tweetText, commands, wordLimit = 70, replyLanguage = 'auto' }) {
  let langReq = '必须使用与原推文相同的语言撰写回复！原推文是英文就用英文，原推文是中文就用中文。';
  if (replyLanguage === 'zh') {
    langReq = '必须使用中文(简体)撰写回复！不论原推文是什么语言。';
  } else if (replyLanguage === 'en') {
    langReq = '必须使用英文(English)撰写回复！不论原推文是什么语言。';
  }

  const stylesBlock = Object.entries(commands)
    .map(([id, text]) => `- 「${id}」：${text}`)
    .join('\n');

  const keysStr = Object.keys(commands).map(k => `"${k}"`).join('、');

  return `# 【功能】
阅读给定推文，一次性输出 ${Object.keys(commands).length} 条不同风格的回复候选。

# 【重要：语言要求】
${langReq}

# 【风格列表说明】
${stylesBlock}

# 【通用要求】
每条回复要简短；与推文相关；单条字数控制在 ${wordLimit} 字以内；
每条回复字符串内不要出现换行符；不要输出与 JSON 无关的说明文字。

# 【输出格式】
仅输出一个 JSON 对象，键名必须严格对应：${keysStr}，值为对应风格的回复正文。
示例：{"default":"...","friendly":"...","funny":"..."}

# 【参考推文内容如下】
${tweetText || '(未获取到帖子内容)'}`;
}
