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
    const { prompt, model, protocol } = request;
    const { selectedModel, provider, providerConfigs } = await storage.get(['selectedModel', 'provider', 'providerConfigs']);
    
    // 自动寻找当前服务商的协议
    const currentProvider = provider || 'glm';
    const fallbackCfg = resolveProviderCfg(providerConfigs, currentProvider, protocol);
    const targetProtocol = protocol || fallbackCfg.protocol || 'openai';
    const cfg = resolveProviderCfg(providerConfigs, currentProvider, targetProtocol);
    const targetModel = model || selectedModel || cfg.selectedModel || 'glm-4.7-flash';

    if (!prompt) throw new Error('Prompt is required');

    const reply = await generateReply(prompt, targetModel, currentProvider, targetProtocol);
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
