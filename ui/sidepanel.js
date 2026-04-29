import { storage } from '../libs/storage.js';
import { buildReplyPrompt, buildMultiReplyPrompt } from '../content/utils.js';

const PROTOCOL_MODELS = {
  'glm': ['glm-4-plus', 'glm-4.5-air', 'glm-4.7', 'glm-4.7-flash', 'glm-5', 'glm-5-turbo', 'glm-5.1'],
  'openai': ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-preview', 'deepseek-chat', 'deepseek-coder'],
  'anthropic': ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest']
};

const i18n = {
  zh: {
    tab_reply: '回复', tab_commands: '指令库', tab_settings: '设置',
    post_title: '📝 当前帖子', post_placeholder: '正在提取推文内容...', post_not_found: '未找到推文', post_hint: '请在推特页面使用', post_error: '推文获取失败',
    ai_title: '⚡ 智能回复生成', prompt_preview: '指令预览', word_limit: '字数限制:', word_char: '字符', time_cost: '耗时:',
    gen_btn: '生成回复内容', gen_thinking: '<div class="thinking-loader"><div class="thinking-dots"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div><div class="thinking-text">AI 正在思考...</div></div>', gen_error: '❌ 生成失败', gen_need_post: '❌ 未获取到帖子内容',
    btn_copy: '复制', btn_insert: '插入', btn_publish: '发布',
    provider_label: '服务商', provider_name_label: '服务商名称', available_models_label: '可用模型列表', protocol_type_label: '协议类型', api_url_label: 'API Base URL', cmd_title: '🎨 自定义指令', cmd_search: '搜索指令模板...', cmd_save: '保存指令库',
    settings_account: '👤 当前账号', settings_title: '🔑 API & 模型', lang_label: '界面语言', model_label: 'AI 模型',
    save_all: '保存全部设置', status_saved: '设置已保存!', status_copied: '已复制!', status_inserted: '已插入!',
    account_loading: '加载中...', account_unknown: '未检测到账号', cmd_delete: '删除', prompt_new_cmd: '请输入新指令的唯一标识符:',
    test_conn: '测试连接', testing_conn: '测试中...', test_success: '连接成功！', test_failed: '连接失败: ',
    manual_input_toggle: '手动输入推文 (可选)', manual_input_clear: '清空', manual_input_placeholder: '如果自动提取失败，可在此手动输入或粘贴推文内容...',
    reply_lang_label: '回复语言:', reply_lang_auto: '自动', reply_lang_zh: '中文', reply_lang_en: '英语',
    btn_all: '全部'
  },
  en: {
    tab_reply: 'Reply', tab_commands: 'Library', tab_settings: 'Settings',
    post_title: '📝 Current Tweet', post_placeholder: 'Extracting content...', post_not_found: 'Tweet not found', post_hint: 'Please use on Twitter/X', post_error: 'Failed to fetch tweet',
    ai_title: '⚡ Smart AI Reply', prompt_preview: 'Prompt Preview', word_limit: 'Word Limit:', word_char: 'chars', time_cost: 'Time:',
    gen_btn: 'Generate Reply', gen_thinking: '<div class="thinking-loader"><div class="thinking-dots"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div><div class="thinking-text">AI Thinking...</div></div>', gen_error: '❌ Failed to generate', gen_need_post: '❌ Tweet content not found',
    btn_copy: 'Copy', btn_insert: 'Insert', btn_publish: 'Post',
    provider_label: 'Provider', provider_name_label: 'Provider Name', available_models_label: 'Available Models', protocol_type_label: 'Protocol Type', api_url_label: 'API Base URL', cmd_title: '🎨 Custom Commands', cmd_search: 'Search templates...', cmd_save: 'Save Library',
    settings_account: '👤 Current Account', settings_title: '🔑 API & Model', lang_label: 'Language', model_label: 'AI Model',
    save_all: 'Save Settings', status_saved: 'Settings Saved!', status_copied: 'Copied!', status_inserted: 'Inserted!',
    account_loading: 'Loading...', account_unknown: 'No account detected', cmd_delete: 'Delete', prompt_new_cmd: 'Enter unique ID:',
    test_conn: 'Test Connection', testing_conn: 'Testing...', test_success: 'Connected!', test_failed: 'Failed: ',
    manual_input_toggle: 'Manual Input (Optional)', manual_input_clear: 'Clear', manual_input_placeholder: 'If auto-extract fails, manually input or paste the tweet here...',
    reply_lang_label: 'Reply Lang:', reply_lang_auto: 'Auto', reply_lang_zh: 'Chinese', reply_lang_en: 'English',
    btn_all: 'All'
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  // --- 1. UI Elements ---
  const providerSelect = document.getElementById('assistx-provider');
  const customSection = document.getElementById('assistx-customProviderSection');
  const providerNameSelect = document.getElementById('assistx-providerName');
  const addProviderBtn = document.getElementById('assistx-addProvider');
  const protocolTypeSelect = document.getElementById('assistx-protocolType');
  const customModelsTextarea = document.getElementById('assistx-customModels');
  const deleteProviderBtn = document.getElementById('assistx-deleteProvider');
  const baseUrlInput = document.getElementById('assistx-baseUrl');
  const apiKeyInput = document.getElementById('assistx-apiKey');
  const modelSelect = document.getElementById('assistx-modelSelect');
  const modelSelectReply = document.getElementById('assistx-modelSelect-reply');
  const refreshModelsBtn = document.getElementById('assistx-refreshModels');
  const testBtn = document.getElementById('assistx-testBtn');
  const statusDiv = document.getElementById('assistx-status');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const refreshPostBtn = document.getElementById('assistx-refreshPost');
  const generateBtn = document.getElementById('assistx-generateReply');
  const copyBtn = document.getElementById('assistx-copyReply');
  const insertBtn = document.getElementById('assistx-insertReply');
  const publishBtn = document.getElementById('assistx-publishReply');
  const wordLimitInput = document.getElementById('assistx-wordLimit');
  const commandListDiv = document.getElementById('assistx-commandList');
  const quickCmdsDiv = document.getElementById('assistx-quickCmds');
  const scrollLeftBtn = document.getElementById('assistx-scrollLeft');
  const scrollRightBtn = document.getElementById('assistx-scrollRight');
  const commandSearchInput = document.getElementById('assistx-commandSearch');
  const saveCommandsBtn = document.getElementById('assistx-saveCommands');
  const addCommandBtn = document.getElementById('assistx-addCommand');
  const expandPromptBtn = document.getElementById('assistx-expandPrompt');
  const promptPreviewTextarea = document.getElementById('assistx-promptPreview');
  const themeToggleBtn = document.getElementById('theme-toggle');
  const langSelect = document.getElementById('assistx-langSelect');
  const allResultsDiv = document.getElementById('assistx-allResults');
  const singleResultDiv = document.getElementById('assistx-singleResult');
  const replyLangSelect = document.getElementById('assistx-replyLangSelect');
  const toggleManualInput = document.getElementById('assistx-toggleManualInput');
  const clearManualInput = document.getElementById('assistx-clearManualInput');
  const manualInputTextarea = document.getElementById('assistx-manualInput');
  const placeholder = document.getElementById('assistx-aiPlaceholder');
  const responseTextarea = document.getElementById('assistx-aiResponseText');
  const actionsDiv = document.getElementById('assistx-aiActions');
  const wordCountDiv = document.getElementById('assistx-wordCount');
  const resultStatusDiv = document.getElementById('assistx-resultStatus');
  const generationTimeDiv = document.getElementById('assistx-generationTime');
  const timeNumSpan = document.getElementById('assistx-timeNum');

  // --- 2. State ---
  let currentReply = '';
  let selectedPromptType = 'all';
  let lastProvider = 'glm';
  let providerConfigs = {};
  let themeMode = 'system';
  let currentLang = 'zh';
  let isManualInputOpen = false;
  let candidateReplies = {}; 
  let latestExtractedPostText = '';
  let countdownTimer = null;
  let thinkingTimerInterval = null;
  let remainingSeconds = 0;
  let commands = {
    default: '友好地回复推文内容',
    friendly: '以非常友好、赞赏的口吻回复',
    funny: '用幽默、风趣、带点冷笑话的感觉回复',
    disagree: '委婉地表达不同意见或进行有深度的反驳'
  };

  // --- 3. Helper Functions ---
  function getCfgKey(name, protocol) {
    if (name === 'glm') return 'glm';
    return `${name}|${protocol}`;
  }

  function resolveProviderCfg(name, protocol) {
    const targetProtocol = protocol || 'openai';
    return (
      providerConfigs[getCfgKey(name, targetProtocol)] ||
      providerConfigs[name] ||
      {}
    );
  }

  function getProviderCacheKey() {
    const isCustom = providerSelect.value === 'custom';
    const name = isCustom ? (providerNameSelect.value || 'custom') : 'glm';
    const protocol = isCustom ? (protocolTypeSelect.value || 'openai') : 'openai';
    return `${name}|${protocol}`;
  }

  function maskApiKey(key) {
    if (!key || key.length <= 8) return key;
    const stars = '*'.repeat(key.length - 8);
    return key.substring(0, 4) + stars + key.substring(key.length - 4);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async function safeSendMessage(tabId, message) {
    try { return await chrome.tabs.sendMessage(tabId, message); } catch (e) { return null; }
  }

  async function fallbackExtractPost(tabId) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const postData = { text: '', author: '', handle: '', time: '' };

          const titleEl = document.querySelector('[data-testid="twitter-article-title"]');
          const articleBodyEl = document.querySelector('[data-testid="twitterArticleRichTextView"]');
          if (articleBodyEl) {
            const title = titleEl ? titleEl.innerText : '';
            postData.text = title ? `【标题】${title}\n【正文】${articleBodyEl.innerText}` : articleBodyEl.innerText;
          }

          if (!postData.text) {
            const mainArticle = document.querySelector('article[data-testid="tweet"]');
            const tweetTextEl = mainArticle?.querySelector('[data-testid="tweetText"]') || document.querySelector('[data-testid="tweetText"]');
            if (tweetTextEl) postData.text = tweetTextEl.innerText;
          }

          const mainArticle = document.querySelector('article[data-testid="tweet"]');
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
                const href = handleLink.getAttribute('href') || '';
                postData.handle = href ? '@' + href.replace('/', '').split('/')[0] : '';
              }
            }
            const timeEl = mainArticle.querySelector('time');
            if (timeEl) postData.time = timeEl.getAttribute('datetime') || timeEl.innerText;
          }

          return postData;
        }
      });
      return results?.[0]?.result || null;
    } catch (e) {
      return null;
    }
  }

  async function extractPostFromActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || (!tab?.url?.includes('twitter.com') && !tab?.url?.includes('x.com'))) {
      return { ok: false, reason: 'not_twitter', data: null };
    }
    let data = await safeSendMessage(tab.id, { type: 'EXTRACT_POST' });
    if (!data?.text) data = await fallbackExtractPost(tab.id);
    return { ok: !!data?.text, reason: data?.text ? 'ok' : 'not_found', data };
  }

  function parseCustomModels(rawValue) {
    if (!rawValue) return [];
    return rawValue
      .split(/[,\n;\uFF0C\u3001]+/g)
      .map(model => model.trim())
      .filter(Boolean);
  }

  function updateScrollButtons() {
    if (!quickCmdsDiv || !scrollLeftBtn || !scrollRightBtn) return;
    const { scrollLeft, scrollWidth, clientWidth } = quickCmdsDiv;
    if (scrollLeft > 5) scrollLeftBtn.classList.remove('hidden');
    else scrollLeftBtn.classList.add('hidden');
    if (scrollWidth - clientWidth - scrollLeft > 5) scrollRightBtn.classList.remove('hidden');
    else scrollRightBtn.classList.add('hidden');
  }

  function stopCountdown() {
    if (thinkingTimerInterval) { clearInterval(thinkingTimerInterval); thinkingTimerInterval = null; }
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    remainingSeconds = 0;
    generateBtn.disabled = false;
    generateBtn.textContent = i18n[currentLang].gen_btn;
  }

  function startCountdown(duration) {
    remainingSeconds = duration;
    generateBtn.disabled = true;
    generateBtn.textContent = `${i18n[currentLang].gen_btn} (${remainingSeconds}s)`;
    countdownTimer = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds < 0) stopCountdown();
      else generateBtn.textContent = `${i18n[currentLang].gen_btn} (${remainingSeconds}s)`;
    }, 1000);
  }

  function getValidTweetText() {
    if (manualInputTextarea.value.trim() !== '') return manualInputTextarea.value.trim();
    if (latestExtractedPostText) return latestExtractedPostText;
    const contentArea = document.getElementById('assistx-postContent');
    const tweetText = contentArea ? contentArea.innerText.trim() : '';
    const invalidExactTexts = ['正在提取推文内容...', '未找到推文', 'Extracting content...', 'Tweet not found', '请在推特页面使用'];
    if (!tweetText || invalidExactTexts.includes(tweetText)) return '';
    return tweetText;
  }

      function updateModelDropdown(modelIds, selectedValue) {
    if (!modelSelect) return;
    modelSelect.innerHTML = '';
    if (modelSelectReply) modelSelectReply.innerHTML = '';
    
    const isGlmProvider = providerSelect.value === 'glm';
    let protocol = isGlmProvider ? 'glm' : (protocolTypeSelect.value || 'openai');
    const defaultList = PROTOCOL_MODELS[protocol] || PROTOCOL_MODELS['openai'];
    
    // 获取用户在 textarea 中填写的自定义模型
    const manualModels = parseCustomModels(customModelsTextarea.value);
    
    const discoveredModels = modelIds || [];
    let finalModels = [];

    if (isGlmProvider) {
      finalModels = [...new Set([...discoveredModels, ...manualModels, ...defaultList])].sort();
    } else {
      const customSource = [...new Set([...discoveredModels, ...manualModels])].sort();
      finalModels = customSource.length > 0 ? customSource : [...defaultList];
    }
    
    finalModels.forEach(id => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = id;
      modelSelect.appendChild(opt);
      if (modelSelectReply) modelSelectReply.appendChild(opt.cloneNode(true));
    });
    
    if (selectedValue) {
      modelSelect.value = selectedValue;
      if (modelSelectReply) modelSelectReply.value = selectedValue;
    } else {
      const defaultModel = (protocol === 'glm') ? 'glm-4.7-flash' : (manualModels[0] || defaultList[0] || '');
      modelSelect.value = defaultModel;
      if (modelSelectReply) modelSelectReply.value = defaultModel;
    }
  }

  function ensureProviderOption(name) {
    if (!providerNameSelect || !name) return;
    const exists = Array.from(providerNameSelect.options).some(opt => opt.value === name);
    if (exists) return;
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    providerNameSelect.appendChild(opt);
  }

function refreshProviderDatalist() {
    if (!providerNameSelect) return;
    const currentValue = providerNameSelect.value;
    providerNameSelect.innerHTML = '';
    const names = new Set();
    Object.entries(providerConfigs).forEach(([key, cfg]) => {
      const name = cfg.name || key.split('|')[0];
      if (name && name !== 'glm') names.add(name);
    });
    [...names].sort().forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      providerNameSelect.appendChild(opt);
    });
    if (providerNameSelect.options.length === 0) {
      if (providerSelect.value === 'custom') {
        ensureProviderOption('Custom1');
        providerNameSelect.value = 'Custom1';
      }
      return;
    }
    const hasCurrent = Array.from(providerNameSelect.options).some(opt => opt.value === currentValue);
    providerNameSelect.value = hasCurrent ? currentValue : providerNameSelect.options[0].value;
  }

  function updateUIStrings(lang) {
    const dict = i18n[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      if (el.id === 'assistx-generateReply' && countdownTimer) return;
      const key = el.dataset.i18n;
      if (dict[key]) el.textContent = dict[key];
    });
    commandSearchInput.placeholder = dict.cmd_search;
    manualInputTextarea.placeholder = dict.manual_input_placeholder;
    if (toggleManualInput) {
        toggleManualInput.innerHTML = (isManualInputOpen ? '▼ ' : '▶ ') + `<span data-i18n="manual_input_toggle">${dict.manual_input_toggle}</span>`;
    }
  }

  function renderQuickCommands() {
    quickCmdsDiv.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className = `quick-cmd ${selectedPromptType === 'all' ? 'active' : ''}`;
    allBtn.dataset.prompt = 'all';
    allBtn.textContent = i18n[currentLang].btn_all;
    quickCmdsDiv.appendChild(allBtn);
    Object.keys(commands).forEach(id => {
      const btn = document.createElement('button');
      btn.className = `quick-cmd ${id === selectedPromptType ? 'active' : ''}`;
      btn.dataset.prompt = id;
      btn.textContent = (id === 'default') ? ('✨ ' + (currentLang === 'zh' ? '默认' : 'Default')) : id;
      if (candidateReplies[id]) btn.style.borderColor = 'var(--primary-color)';
      quickCmdsDiv.appendChild(btn);
    });
    setTimeout(updateScrollButtons, 50);
  }

  function renderResultView() {
    if (Object.keys(candidateReplies).length === 0) return;
    if (selectedPromptType === 'all') {
      singleResultDiv.style.display = 'none'; allResultsDiv.style.display = 'block';
      wordCountDiv.style.display = 'none'; resultStatusDiv.style.display = 'flex';
      renderAllResults();
    } else {
      allResultsDiv.style.display = 'none'; singleResultDiv.style.display = 'block';
      responseTextarea.style.display = 'block'; actionsDiv.style.display = 'flex';
      wordCountDiv.style.display = 'flex'; resultStatusDiv.style.display = 'flex';
      currentReply = candidateReplies[selectedPromptType] || '';
      responseTextarea.value = currentReply;
      updateWordCount();
    }
  }

  function renderAllResults() {
    allResultsDiv.innerHTML = '';
    Object.entries(candidateReplies).forEach(([id, text]) => {
      const card = document.createElement('div');
      card.className = 'result-card';
      const displayName = (id === 'default') ? (currentLang === 'zh' ? '默认' : 'Default') : id;
      card.innerHTML = `
        <div class="result-card-header">
          <span class="result-card-title">${displayName}</span>
          <button class="btn-icon copy-card-btn" title="Copy">📋</button>
        </div>
        <div class="result-card-body">${escapeHtml(text)}</div>
        <div class="result-card-actions">
           <button class="btn-secondary use-card-btn" style="padding: 4px 12px; font-size: 11px;">${i18n[currentLang].btn_insert}</button>
        </div>
      `;
      card.querySelector('.copy-card-btn').onclick = () => { navigator.clipboard.writeText(text); showStatus(i18n[currentLang].status_copied, 'success'); };
      card.querySelector('.use-card-btn').onclick = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          const ok = await safeSendMessage(tab.id, { type: 'INSERT_REPLY', text: text });
          if (ok) showStatus(i18n[currentLang].status_inserted, 'success');
        }
      };
      allResultsDiv.appendChild(card);
    });
  }

  function saveCurrentToMap() {
    const isCustom = providerSelect.value === 'custom';
    const name = isCustom ? providerNameSelect.value : 'glm';
    const protocol = isCustom ? protocolTypeSelect.value : 'openai';
    if (!name) return;
    const key = getCfgKey(name, protocol);
    const isMasked = apiKeyInput.value.includes('*') && apiKeyInput.value.length > 8;
    const oldKey =
      (providerConfigs[key] && providerConfigs[key].apiKey) ||
      (providerConfigs[name] && providerConfigs[name].apiKey) ||
      '';
    providerConfigs[key] = {
      name: name,
      baseUrl: baseUrlInput.value.trim(),
      apiKey: isMasked ? oldKey : apiKeyInput.value.trim(),
      selectedModel: modelSelect.value,
      protocol: protocol,
      availableModels: customModelsTextarea.value.trim()
    };
  }

  async function persistCurrentProviderConfig() {
    const isCustom = providerSelect.value === 'custom';
    const name = isCustom ? providerNameSelect.value : 'glm';
    if (isCustom && !name) return;

    const protocol = isCustom ? protocolTypeSelect.value : 'openai';
    const prevCfg = resolveProviderCfg(name, protocol);
    const prevSnapshot = JSON.stringify({
      provider: name,
      protocol: prevCfg.protocol || protocol,
      baseUrl: prevCfg.baseUrl || '',
      apiKey: prevCfg.apiKey || '',
      selectedModel: prevCfg.selectedModel || '',
      availableModels: prevCfg.availableModels || '',
      language: currentLang
    });

    saveCurrentToMap();

    const cfg = resolveProviderCfg(name, protocol);
    lastProvider = name;

    const nextSnapshot = JSON.stringify({
      provider: name,
      protocol: cfg.protocol || protocol,
      baseUrl: cfg.baseUrl || '',
      apiKey: cfg.apiKey || '',
      selectedModel: cfg.selectedModel || '',
      availableModels: cfg.availableModels || '',
      language: currentLang
    });
    if (prevSnapshot === nextSnapshot) return;

    await storage.set({
      provider: name,
      providerConfigs,
      baseUrl: cfg.baseUrl || '',
      apiKey: cfg.apiKey || '',
      selectedModel: cfg.selectedModel || '',
      protocol: cfg.protocol || protocol,
      availableModels: cfg.availableModels || '',
      language: currentLang
    });
    showStatus('已自动保存', 'success', 5000);
  }

  function loadFromMap(name, protocol) {
    const targetProtocol = protocol || protocolTypeSelect.value || 'openai';
    const cfg = resolveProviderCfg(name, targetProtocol);
    
    if (name === 'glm') {
      baseUrlInput.value = cfg.baseUrl || 'https://open.bigmodel.cn/api/anthropic';
      protocolTypeSelect.value = 'openai';
      apiKeyInput.value = maskApiKey(cfg.apiKey || '');
      customModelsTextarea.value = cfg.availableModels || '';
    } else {
      baseUrlInput.value = cfg.baseUrl || '';
      if (!protocol && cfg.protocol) protocolTypeSelect.value = cfg.protocol;
      apiKeyInput.value = maskApiKey(cfg.apiKey || '');
      customModelsTextarea.value = cfg.availableModels || '';
    }
    updateModelDropdown(null, cfg.selectedModel || '');
    lastProvider = name;
  }

  function updatePromptPreview() {
    const tweetText = getValidTweetText();
    if (tweetText) {
      promptPreviewTextarea.value = buildMultiReplyPrompt({ 
        tweetText, commands, wordLimit: parseInt(wordLimitInput.value) || 70, 
        replyLanguage: replyLangSelect.value 
      });
    } else { promptPreviewTextarea.value = '(等待推文内容...)'; }
  }

  function renderCommands(filter = '') {
    commandListDiv.innerHTML = '';
    Object.entries(commands).forEach(([id, text]) => {
      if (filter && !id.toLowerCase().includes(filter) && !text.toLowerCase().includes(filter)) return;
      const item = document.createElement('div');
      item.className = 'command-item';
      item.dataset.id = id;
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin:8px 0 4px;">
          <span style="font-size:12px; font-weight:700;">${id}</span>
          <button class="btn-delete" style="font-size:10px; border:none; background:none; cursor:pointer; color:#e0245e;">${i18n[currentLang].cmd_delete}</button>
        </div>
        <textarea class="form-input" style="min-height:40px; font-size:12px;">${text}</textarea>
      `;
      commandListDiv.appendChild(item);
    });
    commandListDiv.querySelectorAll('.btn-delete').forEach(btn => {
      btn.onclick = () => {
        const id = btn.closest('.command-item').dataset.id;
        if (id !== 'default') {
          delete commands[id];
          renderCommands();
          renderQuickCommands();
          storage.set({ commands });
        }
      }
    });
  }

  function collectCommandsFromDom() {
    const nextCommands = {};
    commandListDiv.querySelectorAll('.command-item').forEach(item => {
      nextCommands[item.dataset.id] = item.querySelector('textarea').value;
    });
    return nextCommands;
  }

  async function refreshPost() {
    const contentDiv = document.getElementById('assistx-postContent');
    const dict = i18n[currentLang];
    contentDiv.innerText = dict.post_placeholder;
    try {
      const result = await extractPostFromActiveTab();
      if (result.reason === 'not_twitter') {
        latestExtractedPostText = '';
        contentDiv.innerText = dict.post_hint;
      } else if (result.ok) {
        const response = result.data;
        latestExtractedPostText = response.text || '';
        contentDiv.innerHTML = `<div class="post-author" style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">${response.author || ''} ${response.handle || ''}</div><div class="post-text">${response.text}</div>`;
        if (promptPreviewTextarea.style.display === 'block') updatePromptPreview();
      } else {
        latestExtractedPostText = '';
        contentDiv.innerText = dict.post_not_found;
      }
    } catch (e) { contentDiv.innerHTML = `<div style="padding:20px; text-align:center; color:#e0245e;">${dict.post_error}</div>`; }
  }

  async function fetchModels() {
    refreshModelsBtn.classList.add('spinning');
    try {
      const response = await chrome.runtime.sendMessage({ type: 'get_models' });
      if (response.success && response.models) {
        const modelIds = response.models.map(m => m.id).sort();
        updateModelDropdown(modelIds, modelSelect.value);
        const existing = await storage.get(['cachedModelsByProvider']);
        const cachedModelsByProvider = existing.cachedModelsByProvider || {};
        cachedModelsByProvider[getProviderCacheKey()] = modelIds;
        storage.set({ cachedModelsByProvider, cachedModels: modelIds });
      }
    } catch (e) {} finally { refreshModelsBtn.classList.remove('spinning'); }
  }

  // --- 4. Initialization ---
  const settings = await storage.get(['apiKey', 'baseUrl', 'provider', 'protocol', 'availableModels', 'providerConfigs', 'wordLimit', 'replyLanguage', 'selectedModel', 'cachedModels', 'cachedModelsByProvider', 'commands', 'themeMode', 'language']);
  providerConfigs = settings.providerConfigs || {};
  lastProvider = settings.provider || 'glm';
  providerSelect.value = (lastProvider === 'glm') ? 'glm' : 'custom';
  refreshProviderDatalist();
  if (lastProvider !== 'glm') {
    customSection.style.display = 'block';
    ensureProviderOption(lastProvider);
    providerNameSelect.value = lastProvider;
  } else { customSection.style.display = 'none'; }
  
  const resolvedProtocol =
    settings.protocol ||
    resolveProviderCfg(lastProvider, protocolTypeSelect.value).protocol ||
    protocolTypeSelect.value ||
    'openai';
  const currentCfg =
    providerConfigs[getCfgKey(lastProvider, resolvedProtocol)] ||
    providerConfigs[lastProvider] ||
    {};
  const currentProviderKey = getCfgKey(lastProvider, resolvedProtocol);
  if (!providerConfigs[currentProviderKey]) {
    providerConfigs[currentProviderKey] = {
      name: lastProvider,
      baseUrl: currentCfg.baseUrl || settings.baseUrl || (lastProvider === 'glm' ? 'https://open.bigmodel.cn/api/anthropic' : ''),
      apiKey: currentCfg.apiKey || settings.apiKey || '',
      selectedModel: currentCfg.selectedModel || settings.selectedModel || '',
      protocol: currentCfg.protocol || resolvedProtocol,
      availableModels: currentCfg.availableModels || ''
    };
  }
  baseUrlInput.value = currentCfg.baseUrl || settings.baseUrl || (lastProvider === 'glm' ? 'https://open.bigmodel.cn/api/anthropic' : '');
  apiKeyInput.value = maskApiKey(currentCfg.apiKey || settings.apiKey || '');
  if (currentCfg.protocol) protocolTypeSelect.value = currentCfg.protocol;
  customModelsTextarea.value = currentCfg.availableModels || '';
  
  if (settings.wordLimit) wordLimitInput.value = settings.wordLimit;
  if (settings.replyLanguage) replyLangSelect.value = settings.replyLanguage;
  if (settings.commands) commands = { ...commands, ...settings.commands };
  if (settings.themeMode) themeMode = settings.themeMode;
  if (settings.language) currentLang = settings.language;
  
  langSelect.value = currentLang;
  updateUIStrings(currentLang);
  const initialCacheKey = `${lastProvider}|${resolvedProtocol || 'openai'}`;
  const initialCachedModels = (settings.cachedModelsByProvider && settings.cachedModelsByProvider[initialCacheKey]) || settings.cachedModels || [];
  updateModelDropdown(initialCachedModels, currentCfg.selectedModel || settings.selectedModel || '');
  refreshProviderDatalist(); renderQuickCommands(); renderCommands(); refreshPost();
  
  const isDark = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
  themeToggleBtn.textContent = themeMode === 'system' ? '🖥️' : themeMode === 'light' ? '☀️' : '🌙';

  async function loadCurrentAccount() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && (tab?.url?.includes('twitter.com') || tab?.url?.includes('x.com'))) {
        const resp = await safeSendMessage(tab.id, { type: 'GET_ACCOUNT' });
        if (resp?.name) {
            document.getElementById('assistx-accountName').textContent = resp.name;
            document.getElementById('assistx-accountHandle').textContent = resp.handle;
            if (resp.avatar) document.getElementById('assistx-accountAvatar').style.backgroundImage = `url(${resp.avatar})`;
        } else { document.getElementById('assistx-accountName').textContent = i18n[currentLang].account_unknown; }
    }
  }
  setTimeout(loadCurrentAccount, 1000);

  // --- 5. Event Listeners ---
  langSelect.addEventListener('change', (e) => {
    currentLang = e.target.value; updateUIStrings(currentLang);
    renderQuickCommands(); renderCommands(); storage.set({ language: currentLang });
  });
  themeToggleBtn.addEventListener('click', () => {
    themeMode = themeMode === 'system' ? 'light' : themeMode === 'light' ? 'dark' : 'system';
    const isD = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.body.setAttribute('data-theme', isD ? 'dark' : 'light');
    themeToggleBtn.textContent = themeMode === 'system' ? '🖥️' : themeMode === 'light' ? '☀️' : '🌙';
    storage.set({ themeMode });
  });
  providerSelect.addEventListener('change', () => {
    if (providerSelect.value === 'glm') { customSection.style.display = 'none'; loadFromMap('glm', 'openai'); }
    else {
      customSection.style.display = 'block';
      refreshProviderDatalist();
      const name = providerNameSelect.value || 'Custom1';
      ensureProviderOption(name);
      providerNameSelect.value = name;
      loadFromMap(name, protocolTypeSelect.value);
    }
    refreshProviderDatalist();
    persistCurrentProviderConfig();
  });
  providerNameSelect.addEventListener('change', () => {
    if (providerSelect.value !== 'custom') return;
    const name = providerNameSelect.value;
    if (!name) return;
    loadFromMap(name, protocolTypeSelect.value);
    persistCurrentProviderConfig();
  });
  if (addProviderBtn) {
    addProviderBtn.addEventListener('click', async () => {
      const name = prompt(i18n[currentLang].prompt_new_cmd, 'Custom2');
      if (!name || !name.trim()) return;
      const nextName = name.trim();
      ensureProviderOption(nextName);
      providerNameSelect.value = nextName;
      loadFromMap(nextName, protocolTypeSelect.value);
      await persistCurrentProviderConfig();
      refreshProviderDatalist();
    });
  }
  customModelsTextarea.addEventListener('input', () => {
    updateModelDropdown(null, modelSelect.value);
  });
  customModelsTextarea.addEventListener('blur', persistCurrentProviderConfig);
  baseUrlInput.addEventListener('blur', persistCurrentProviderConfig);
  apiKeyInput.addEventListener('blur', persistCurrentProviderConfig);
  protocolTypeSelect.addEventListener('change', () => {
    const name = providerNameSelect.value;
    if (name) loadFromMap(name, protocolTypeSelect.value);
    updateModelDropdown(null, modelSelect.value);
    persistCurrentProviderConfig();
  });
  wordLimitInput.addEventListener('change', async () => {
    await storage.set({ wordLimit: parseInt(wordLimitInput.value, 10) || 70 });
    showStatus('已自动保存', 'success', 5000);
  });
  replyLangSelect.addEventListener('change', async () => {
    await storage.set({ replyLanguage: replyLangSelect.value });
    showStatus('已自动保存', 'success', 5000);
  });
  const syncModel = async (e) => {
    const newModel = e.target.value;
    modelSelect.value = newModel;
    if (modelSelectReply) modelSelectReply.value = newModel;
    await persistCurrentProviderConfig();
  };
  modelSelect.addEventListener('change', syncModel);
  if (modelSelectReply) modelSelectReply.addEventListener('change', syncModel);

  deleteProviderBtn.addEventListener('click', async () => {
    const name = providerNameSelect.value;
    if (!name || name === 'glm') return;
    if (confirm(`确定要删除服务商 "${name}" 吗？`)) {
      delete providerConfigs[getCfgKey(name, protocolTypeSelect.value)];
      delete providerConfigs[name];
      providerSelect.value = 'glm'; customSection.style.display = 'none'; loadFromMap('glm', 'openai');
      refreshProviderDatalist();
      await storage.set({ provider: 'glm', providerConfigs, baseUrl: providerConfigs['glm']?.baseUrl || 'https://open.bigmodel.cn/api/anthropic', apiKey: providerConfigs['glm']?.apiKey || '', selectedModel: providerConfigs['glm']?.selectedModel || '', language: currentLang });
      showStatus(i18n[currentLang].status_saved, 'success');
    }
  });

  generateBtn.addEventListener('click', async () => {
    if (countdownTimer) return;
    startCountdown(60);
    const dict = i18n[currentLang];
    const extracted = await extractPostFromActiveTab();
    if (extracted.reason === 'not_twitter') {
      latestExtractedPostText = '';
      placeholder.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted);">${dict.post_hint}</div>`;
      stopCountdown();
      return;
    }
    if (extracted.ok) {
      const contentDiv = document.getElementById('assistx-postContent');
      const response = extracted.data;
      latestExtractedPostText = response.text || '';
      contentDiv.innerHTML = `<div class="post-author" style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">${response.author || ''} ${response.handle || ''}</div><div class="post-text">${response.text}</div>`;
      if (promptPreviewTextarea.style.display === 'block') updatePromptPreview();
    }
    placeholder.innerHTML = dict.gen_thinking; placeholder.style.display = 'block';
    generationTimeDiv.style.display = 'block';
    timeNumSpan.textContent = '0.0';
    responseTextarea.style.display = 'none'; allResultsDiv.style.display = 'none'; allResultsDiv.innerHTML = '';
    actionsDiv.style.display = 'none'; resultStatusDiv.style.display = 'none'; generationTimeDiv.style.display = 'none';
    candidateReplies = {};
    const startTime = Date.now();
    generationTimeDiv.style.display = 'block';
    thinkingTimerInterval = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      timeNumSpan.textContent = elapsed;
    }, 100);
    try {
      const tweetText = getValidTweetText();
      if (!tweetText) {
        const contentDiv = document.getElementById('assistx-postContent');
        contentDiv.innerHTML = `<div style="padding:20px; text-align:center; color:#e0245e;">${dict.post_error}</div>`;
        placeholder.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted);">${dict.gen_need_post}</div>`;
        generationTimeDiv.style.display = 'none';
        stopCountdown(); return;
      }
      const finalPrompt = (promptPreviewTextarea.style.display === 'block' && promptPreviewTextarea.value.length > 50) 
        ? promptPreviewTextarea.value : buildMultiReplyPrompt({ tweetText, commands, wordLimit: parseInt(wordLimitInput.value) || 70, replyLanguage: replyLangSelect.value });
      const response = await chrome.runtime.sendMessage({ 
        type: 'generate_reply', prompt: finalPrompt, model: modelSelect.value, 
        protocol: (providerSelect.value === 'glm' ? 'openai' : protocolTypeSelect.value) 
      });
      if (response?.success) {
        let s_raw = response.reply.trim();
        if (s_raw.startsWith('```')) s_raw = s_raw.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
        try { candidateReplies = JSON.parse(s_raw); } catch (e) { candidateReplies = { default: response.reply }; }
        selectedPromptType = 'all'; renderQuickCommands(); placeholder.style.display = 'none'; renderResultView();
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        timeNumSpan.textContent = duration; generationTimeDiv.style.display = 'block'; stopCountdown();
      } else { placeholder.innerHTML = `<div style="padding:20px; text-align:center; color:#e0245e;">${dict.gen_error + ': ' + (response?.error || '')}</div>`; generationTimeDiv.style.display = 'none'; stopCountdown(); }
    } catch (e) {
      latestExtractedPostText = '';
      placeholder.innerHTML = `<div style="padding:20px; text-align:center; color:#e0245e;">${dict.gen_error + ': ' + e.message}</div>`;
      generationTimeDiv.style.display = 'none';
      stopCountdown();
    }
  });

  quickCmdsDiv.addEventListener('click', (e) => {
    const btn = e.target.closest('.quick-cmd');
    if (btn) { selectedPromptType = btn.dataset.prompt; renderQuickCommands(); renderResultView(); if (promptPreviewTextarea.style.display === 'block') updatePromptPreview(); }
  });

  expandPromptBtn.addEventListener('click', () => {
    const isVisible = promptPreviewTextarea.style.display === 'block';
    promptPreviewTextarea.style.display = isVisible ? 'none' : 'block';
    expandPromptBtn.textContent = isVisible ? '👁️' : '🕶️';
    if (!isVisible) updatePromptPreview();
  });

  if (scrollLeftBtn && scrollRightBtn && quickCmdsDiv) {
    scrollLeftBtn.onclick = () => { quickCmdsDiv.scrollBy({ left: -100, behavior: 'smooth' }); };
    scrollRightBtn.onclick = () => { quickCmdsDiv.scrollBy({ left: 100, behavior: 'smooth' }); };
    quickCmdsDiv.onscroll = updateScrollButtons;
    window.onresize = updateScrollButtons;
  }

  toggleManualInput.addEventListener('click', () => {
    isManualInputOpen = !isManualInputOpen;
    manualInputTextarea.style.display = isManualInputOpen ? 'block' : 'none';
    clearManualInput.style.display = isManualInputOpen ? 'block' : 'none';
    updateUIStrings(currentLang);
  });

  clearManualInput.addEventListener('click', () => { manualInputTextarea.value = ''; manualInputTextarea.focus(); updatePromptPreview(); });
  commandSearchInput.addEventListener('input', (e) => renderCommands(e.target.value.toLowerCase()));
  commandListDiv.addEventListener('focusout', async (e) => {
    if (e.target.tagName !== 'TEXTAREA') return;
    commands = collectCommandsFromDom();
    await storage.set({ commands });
    renderQuickCommands();
    showStatus('已自动保存', 'success', 5000);
  });
  if (saveCommandsBtn) {
    saveCommandsBtn.addEventListener('click', async () => {
      const newCommands = {};
      commandListDiv.querySelectorAll('.command-item').forEach(item => { newCommands[item.dataset.id] = item.querySelector('textarea').value; });
      commands = newCommands; await storage.set({ commands });
      renderQuickCommands(); showStatus(i18n[currentLang].status_copied, 'success');
    });
  }

  addCommandBtn.addEventListener('click', () => {
    const id = prompt(i18n[currentLang].prompt_new_cmd);
    if (id && !commands[id.trim().toLowerCase()]) {
      commands[id.trim().toLowerCase()] = '...';
      renderCommands();
      renderQuickCommands();
      storage.set({ commands });
    }
  });

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  if (refreshPostBtn) refreshPostBtn.addEventListener('click', refreshPost);

  testBtn.addEventListener('click', async () => {
    const dict = i18n[currentLang];
    const apiKey = apiKeyInput.value.trim();
    const baseUrl = baseUrlInput.value.trim();
    const isMasked = apiKey.includes('*') && apiKey.length > 8;
    const actualKey = isMasked ? (providerConfigs[getCfgKey(lastProvider, protocolTypeSelect.value)]?.apiKey || providerConfigs[lastProvider]?.apiKey || '') : apiKey;
    if (!actualKey) { showStatus(dict.test_failed + 'Key required', 'error'); return; }
    testBtn.disabled = true; testBtn.textContent = dict.testing_conn;
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'test_connection', apiKey: actualKey, baseUrl, 
        provider: (providerSelect.value === 'glm' ? 'glm' : 'custom'), 
        protocol: (providerSelect.value === 'glm' ? 'openai' : protocolTypeSelect.value),
        model: modelSelect.value 
      });
      if (response.success) {
        showStatus(dict.test_success, 'success');
        if (response.models?.length > 0) updateModelDropdown(response.models.map(m => m.id).sort(), modelSelect.value);
      } else showStatus(dict.test_failed + (response.error || 'error'), 'error');
    } catch (e) { showStatus(dict.test_failed + e.message, 'error'); }
    finally { testBtn.disabled = false; testBtn.textContent = dict.test_conn; }
  });

  function showStatus(msg, type, duration = 3000) {
    statusDiv.textContent = msg; statusDiv.className = `status-message ${type}`;
    setTimeout(() => { statusDiv.textContent = ''; statusDiv.className = 'status-message'; }, duration);
  }
});
