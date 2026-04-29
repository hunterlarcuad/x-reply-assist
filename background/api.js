import { storage } from '../libs/storage.js';

const ZHIPU_BASE_URL = 'https://open.bigmodel.cn/api/anthropic';

function resolveProviderCfg(providerConfigs, providerName, protocol) {
  if (!providerConfigs) return {};
  if (providerName === 'glm') return providerConfigs.glm || {};
  const key = `${providerName}|${protocol || 'openai'}`;
  return providerConfigs[key] || providerConfigs[providerName] || {};
}

/**
 * 生成 JWT Token (仅用于 Zhipu AI 原生协议)
 */
async function generateZhipuToken(apiKey) {
  const parts = apiKey.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error('Invalid Zhipu API Key format (expected id.secret)');
  }
  const [id, secret] = parts;
  const header = { alg: 'HS256', sign_type: 'SIGN' };
  const payload = { api_key: id, exp: Date.now() + 3600 * 1000, timestamp: Date.now() };
  return createJWT(header, payload, secret);
}

async function createJWT(header, payload, secret) {
  const textEncoder = new TextEncoder();
  const b64 = (obj) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const data = `${b64(header)}.${b64(payload)}`;
  const key = await crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(data));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${data}.${encodedSignature}`;
}

function btoa(str) {
  return globalThis.btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 核心生成函数
 */
export async function generateReply(prompt, model, provider, protocol) {
  const { providerConfigs, apiKey: rootKey, baseUrl: rootUrl } = await storage.get(['providerConfigs', 'apiKey', 'baseUrl']);
  const currentProvider = provider || 'glm';
  const fallbackCfg = resolveProviderCfg(providerConfigs, currentProvider, protocol);
  const targetProtocol = protocol || fallbackCfg.protocol || 'openai';
  const cfg = resolveProviderCfg(providerConfigs, currentProvider, targetProtocol);
  
  const apiKey = cfg.apiKey || rootKey;
  const apiBase = (cfg.baseUrl || rootUrl || ZHIPU_BASE_URL).replace(/\/$/, '');
  
  if (!apiKey) throw new Error('API Key not found for provider: ' + currentProvider);

  const isAnthropic = targetProtocol === 'anthropic' || apiBase.includes('anthropic');
  let token = (currentProvider === 'glm' && apiKey.includes('.')) ? await generateZhipuToken(apiKey) : apiKey;

  const endpoint = isAnthropic 
    ? (apiBase.endsWith('/v1') ? `${apiBase}/messages` : `${apiBase}/v1/messages`)
    : `${apiBase}/chat/completions`;

  const headers = { 'Content-Type': 'application/json' };
  let bodyData = { model, stream: false };

  if (isAnthropic) {
    headers['x-api-key'] = token;
    headers['api-key'] = token;
    headers['anthropic-version'] = '2023-06-01';
    bodyData.max_tokens = 2048;
    bodyData.messages = [{ role: 'user', content: [{ type: 'text', text: prompt }] }];
  } else {
    headers['Authorization'] = `Bearer ${token}`;
    headers['api-key'] = token;
    bodyData.max_tokens = 2048;
    bodyData.messages = [{ role: 'user', content: prompt }];
  }

  console.log(`[AssistX AI] Calling ${endpoint} for ${currentProvider}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(bodyData)
  });

  const responseText = await response.text();
  let data;
  try { data = JSON.parse(responseText); } catch (e) { throw new Error(`Invalid JSON (HTTP ${response.status})`); }

  if (!response.ok || data.error || data.success === false) {
    const msg = data.error?.message || data.message || data.msg || responseText;
    throw new Error(`[API Error] ${msg}`);
  }

  let content = '';
  if (isAnthropic) content = data.content?.[0]?.text || '';
  else content = data.choices?.[0]?.message?.content || '';

  return content.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

export async function fetchModels() {
  const { apiKey, baseUrl, provider } = await storage.get(['apiKey', 'baseUrl', 'provider']);
  if (!apiKey || baseUrl?.includes('anthropic')) return [];
  const apiBase = baseUrl ? baseUrl.replace(/\/$/, '') : ZHIPU_BASE_URL;
  const token = (provider === 'glm' && apiKey.includes('.')) ? await generateZhipuToken(apiKey) : apiKey;

  try {
    const response = await fetch(`${apiBase}/models`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'api-key': token }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  } catch (e) { return []; }
}

export async function testConnection(apiKey, baseUrl, provider, model, protocol) {
  const apiBase = baseUrl ? baseUrl.replace(/\/$/, '') : ZHIPU_BASE_URL;
  const isAnthropic = protocol === 'anthropic' || apiBase.includes('anthropic');
  const token = (provider === 'glm' && apiKey.includes('.')) ? await generateZhipuToken(apiKey) : apiKey;

  const endpoint = isAnthropic 
    ? (apiBase.endsWith('/v1') ? `${apiBase}/messages` : `${apiBase}/v1/messages`)
    : `${apiBase}/chat/completions`;

  const headers = { 'Content-Type': 'application/json' };
  let bodyData = { model, max_tokens: 1, stream: false };

  if (isAnthropic) {
    headers['x-api-key'] = token;
    headers['api-key'] = token;
    headers['anthropic-version'] = '2023-06-01';
    bodyData.messages = [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }];
  } else {
    headers['Authorization'] = `Bearer ${token}`;
    headers['api-key'] = token;
    bodyData.messages = [{ role: 'user', content: 'hi' }];
  }

  const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(bodyData) });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch(e) { throw new Error(`HTTP ${response.status}`); }
  if (!response.ok || data.error || data.success === false) {
     throw new Error(data.error?.message || data.message || text);
  }
  return [];
}
