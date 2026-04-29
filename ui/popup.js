import { storage } from '../libs/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');
  const layoutToggle = document.getElementById('layoutToggle');

  // Load saved settings
  const { apiKey, layoutMode } = await storage.get(['apiKey', 'layoutMode']);
  if (apiKey) {
    apiKeyInput.value = apiKey;
  }

  // Apply saved layout mode
  if (layoutMode === 'sidebar') {
    document.body.classList.add('sidebar-mode');
    layoutToggle.title = '切换到弹出窗口模式';
  }

  // Layout toggle
  layoutToggle.addEventListener('click', async () => {
    const isSidebar = document.body.classList.toggle('sidebar-mode');
    const newMode = isSidebar ? 'sidebar' : 'popup';
    
    await storage.set({ layoutMode: newMode });
    layoutToggle.title = isSidebar ? '切换到弹出窗口模式' : '切换到侧边栏模式';
    
    // If switching to sidebar mode, send message to content script
    if (isSidebar) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          // Send message and wait for response before closing
          await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_SIDEBAR' });
          // Small delay to ensure sidebar is created
          setTimeout(() => window.close(), 100);
        }
      } catch (e) {
        console.log('Could not send message to tab:', e);
        // Still show status if message fails
        showStatus('请刷新页面后重试', 'error');
      }
    }
  });

  // Save settings
  saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter an API Key', 'error');
      return;
    }

    try {
      await storage.set({ apiKey });
      showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      showStatus('Failed to save settings', 'error');
      console.error(error);
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status';
    }, 3000);
  }
});
