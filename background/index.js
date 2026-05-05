import { generateReply, fetchModels, testConnection } from './api.js';
import { storage } from '../libs/storage.js';

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'generate_reply') {
    handleGenerateReply(request, sendResponse);
    return true; 
  } else if (request.type === 'get_models') {
    handleGetModels(sendResponse);
    return true;
  } else if (request.type === 'test_connection') {
    handleTestConnection(request, sendResponse);
    return true;
  }
});

function resolveProviderCfg(providerConfigs, providerName, protocol) {
  if (!providerConfigs) return {};
  if (providerName === 'glm') return providerConfigs.glm || {};
  const key = `${providerName}|${protocol || 'openai'}`;
  return providerConfigs[key] || providerConfigs[providerName] || {};
}

async function handleGetModels(sendResponse) {
  try {
    const models = await fetchModels();
    sendResponse({ success: true, models });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGenerateReply(request, sendResponse) {
  try {
    const { prompt, model, protocol, provider: reqProvider, tweetText, commandText, wordLimit } = request;
    const { selectedModel, provider: storageProvider, providerConfigs } = await storage.get(['selectedModel', 'provider', 'providerConfigs']);
    
    // 优先使用请求中的 provider，防止存储同步延迟
    const currentProvider = reqProvider || storageProvider || 'glm';
    const fallbackCfg = resolveProviderCfg(providerConfigs, currentProvider, protocol);
    const targetProtocol = protocol || fallbackCfg.protocol || 'openai';
    const cfg = resolveProviderCfg(providerConfigs, currentProvider, targetProtocol);
    const targetModel = model || selectedModel || cfg.selectedModel || 'glm-4.7-flash';

    // 如果没有 prompt，尝试构造 (针对 sidebar.js 等旧调用)
    let finalPrompt = prompt;
    if (!finalPrompt && tweetText) {
      const { buildReplyPrompt } = await import('./utils.js').catch(() => ({})); 
      if (buildReplyPrompt) {
        finalPrompt = buildReplyPrompt({ tweetText, commandText, wordLimit: wordLimit || 70 });
      } else {
        finalPrompt = `Reply to this tweet: ${tweetText}\nInstructions: ${commandText || 'friendly'}`;
      }
    }

    if (!finalPrompt) throw new Error('Prompt is required');

    const reply = await generateReply(finalPrompt, targetModel, currentProvider, targetProtocol);
    sendResponse({ success: true, reply });
  } catch (error) {
    console.error('Generation failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleTestConnection(request, sendResponse) {
  try {
    const { apiKey, baseUrl, provider, model, protocol } = request;
    if (!apiKey) throw new Error('API Key is required');
    
    // We pass the explicit config to the API function to test them directly
    const result = await testConnection(apiKey, baseUrl, provider || 'glm', model, protocol || 'openai');
    sendResponse({ success: true, models: result });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}
