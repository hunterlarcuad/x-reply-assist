import { TwitterHandler } from './twitter.js';

// 初始化
if (window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com')) {
  new TwitterHandler();
}

// 侧边栏通信桥接
function messageHandler(request, sender, sendResponse) {
  if (request.type === 'EXTRACT_POST') {
    const postData = extractPostContent();
    sendResponse(postData);
    return true;
  } else if (request.type === 'INSERT_REPLY') {
    handleInsertReply(request.text, sendResponse);
    return true;
  } else if (request.type === 'PUBLISH_REPLY') {
    handlePublishReply(sendResponse);
    return true;
  } else if (request.type === 'GET_ACCOUNT') {
    handleGetAccount(sendResponse);
    return true;
  }
}

// 幂等保护：防止推特 (SPA) 页面跳转时脚本重复注入，导致插入两次的问题
if (!window.assistxMsgListenerAdded) {
  chrome.runtime.onMessage.addListener(messageHandler);
  window.assistxMsgListenerAdded = true;
}

/**
 * 核心提取逻辑：兼容短帖与长文
 */
function extractPostContent() {
  const postData = { text: '', author: '', handle: '', time: '' };
  
  // 1. 尝试从 Article 容器开始提取 (最准确)
  const articles = document.querySelectorAll('article[data-testid="tweet"]');
  let mainArticle = articles.length > 0 ? articles[0] : null;

  // 2. 提取文本内容
  let s_content = '';

  // 2.1 优先检查是否是长文 (Article)
  // 长文通常有特殊的标题和内容容器
  const titleEl = document.querySelector('[data-testid="twitter-article-title"]');
  const articleBodyEl = document.querySelector('[data-testid="twitterArticleRichTextView"]');
  
  if (articleBodyEl) {
    const s_title = titleEl ? titleEl.innerText : '';
    s_content = s_title ? `【标题】${s_title}\n【正文】${articleBodyEl.innerText}` : articleBodyEl.innerText;
  }

  // 2.2 如果不是长文，或者长文没抓到，抓取普通推文
  if (!s_content) {
    if (mainArticle) {
      const tweetTextEl = mainArticle.querySelector('[data-testid="tweetText"]');
      if (tweetTextEl) {
        s_content = tweetTextEl.innerText;
      }
    } else {
      // 兜底：全局寻找第一个 tweetText
      const tweetTextEl = document.querySelector('[data-testid="tweetText"]');
      if (tweetTextEl) {
        s_content = tweetTextEl.innerText;
      }
    }
  }

  postData.text = s_content || '';
  
  // 3. 提取作者和时间信息
  if (mainArticle) {
    const userNameEl = mainArticle.querySelector('[data-testid="User-Name"]');
    if (userNameEl) {
      const nameSpans = userNameEl.querySelectorAll('span');
      for (const span of nameSpans) {
        const text = span.textContent.trim();
        if (text && !text.startsWith('@') && text !== '·' && !text.includes('Verified')) {
          postData.author = text;
          break;
        }
      }
      const handleLink = userNameEl.querySelector('a[href^="/"]');
      if (handleLink) {
        const href = handleLink.getAttribute('href');
        postData.handle = '@' + href.replace('/', '').split('/')[0];
      }
    }
    const timeEl = mainArticle.querySelector('time');
    if (timeEl) postData.time = timeEl.getAttribute('datetime') || timeEl.innerText;
  }
  
  return postData;
}

function handleGetAccount(sendResponse) {
  try {
    const accountButton = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
    if (accountButton) {
      const avatar = accountButton.querySelector('img')?.src;
      const spans = accountButton.querySelectorAll('span');
      let name = '', handle = '';
      spans.forEach(span => {
        const text = span.textContent.trim();
        if (text.startsWith('@')) handle = text;
        else if (text && !text.includes('…') && text.length > 1) name = text;
      });
      sendResponse({ name, handle, avatar });
    } else { sendResponse({}); }
  } catch (e) { sendResponse({}); }
}

function handleInsertReply(text, sendResponse) {
  const targetTextarea = document.querySelector('[data-testid="tweetTextarea_0"]');
  if (!targetTextarea) {
    sendResponse({ success: false, error: '未找到输入框' });
    return;
  }

  try {
    targetTextarea.focus();
    
    // 全选当前框内的所有内容（保留 Draft.js 的选区状态，避免破坏 React 树）
    document.execCommand('selectAll', false, null);
    
    // 使用原生的剪贴板粘贴事件（Paste Event）来将文字交给推特编辑器。
    // 原理：推特的 React 引擎会拦截 paste 事件，安全地更新其内部的文字 State 并渲染到 DOM。
    // 这彻底避免了使用 execCommand('insertText') 时由于浏览器原生插入与 React 状态同步冲突而产生的“内容双倍”Bug。
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', text);
    
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true
    });
    
    targetTextarea.dispatchEvent(pasteEvent);

    sendResponse({ success: true });
  } catch (e) {
    sendResponse({ success: false, error: e.message });
  }
}

function handlePublishReply(sendResponse) {
  const replyButton = document.querySelector('[data-testid="tweetButtonInline"]');
  if (replyButton) {
    replyButton.click();
    sendResponse({ success: true });
  } else { sendResponse({ success: false, error: '未找到发布按钮' }); }
}
