import { buildReplyPrompt } from './utils.js';

/**
 * Sidebar component for AssistX
 * Injects a fixed sidebar panel on the right side of the page
 */
export class Sidebar {
  constructor() {
    this.isOpen = false;
    this.container = null;
    this.init();
  }

  async init() {
    // Check if sidebar mode is enabled
    const result = await chrome.storage.local.get('layoutMode');
    if (result.layoutMode === 'sidebar') {
      this.create();
      this.open();
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[AssistX Sidebar] Received message:', message);
      
      if (message.type === 'OPEN_SIDEBAR') {
        if (!this.container) {
          this.create();
        }
        this.open();
        sendResponse({ success: true });
      } else if (message.type === 'CLOSE_SIDEBAR') {
        this.close();
        sendResponse({ success: true });
      } else if (message.type === 'TOGGLE_SIDEBAR') {
        this.toggle();
        sendResponse({ success: true });
      }
      
      return true; // Keep the message channel open for async response
    });
  }

  create() {
    if (this.container) return;

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'assistx-sidebar';
    this.container.innerHTML = `
      <style>
        #assistx-sidebar {
          position: fixed;
          top: 0;
          right: -340px;
          width: 320px;
          height: 100vh;
          background: #f5f8fa;
          box-shadow: -2px 0 10px rgba(0, 0, 0, 0.15);
          z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
          transition: right 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        #assistx-sidebar.open {
          right: 0;
        }

        #assistx-sidebar .sidebar-header {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e1e8ed;
          background: #fff;
        }

        #assistx-sidebar .sidebar-logo {
          width: 28px;
          height: 28px;
          margin-right: 10px;
        }

        #assistx-sidebar .sidebar-title {
          font-size: 16px;
          font-weight: 600;
          color: #1da1f2;
          margin: 0;
          flex: 1;
        }

        #assistx-sidebar .sidebar-close {
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          color: #657786;
          transition: all 0.2s;
        }

        #assistx-sidebar .sidebar-close:hover {
          background: #e8f5fe;
          color: #1da1f2;
        }

        /* Tab Navigation */
        #assistx-sidebar .tab-nav {
          display: flex;
          background: #fff;
          border-bottom: 1px solid #e1e8ed;
          padding: 0 8px;
        }

        #assistx-sidebar .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 8px;
          border: none;
          background: transparent;
          color: #657786;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }

        #assistx-sidebar .tab-btn:hover {
          color: #1da1f2;
          background: #f5f8fa;
        }

        #assistx-sidebar .tab-btn.active {
          color: #1da1f2;
        }

        #assistx-sidebar .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 12px;
          right: 12px;
          height: 3px;
          background: #1da1f2;
          border-radius: 3px 3px 0 0;
        }

        #assistx-sidebar .tab-btn svg {
          flex-shrink: 0;
        }

        /* Tab Content */
        #assistx-sidebar .tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        #assistx-sidebar .tab-panel {
          display: none;
        }

        #assistx-sidebar .tab-panel.active {
          display: block;
        }

        #assistx-sidebar .form-group {
          margin-bottom: 15px;
        }

        #assistx-sidebar .form-label {
          display: block;
          font-size: 14px;
          margin-bottom: 6px;
          color: #657786;
        }

        #assistx-sidebar .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          box-sizing: border-box;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        #assistx-sidebar .form-input:focus {
          border-color: #1da1f2;
          outline: none;
        }

        #assistx-sidebar .form-hint {
          font-size: 12px;
          color: #aab8c2;
          margin-top: 6px;
        }

        #assistx-sidebar .form-hint a {
          color: #1da1f2;
          text-decoration: none;
        }

        #assistx-sidebar .form-hint a:hover {
          text-decoration: underline;
        }

        #assistx-sidebar .btn-primary {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #1da1f2 0%, #1a91da 100%);
          color: white;
          border: none;
          border-radius: 25px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        #assistx-sidebar .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(29, 161, 242, 0.4);
        }

        #assistx-sidebar .status-message {
          margin-top: 12px;
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          text-align: center;
          display: none;
        }

        #assistx-sidebar .status-message.success {
          display: block;
          background: #e8f8ef;
          color: #17bf63;
        }

        #assistx-sidebar .status-message.error {
          display: block;
          background: #fde8ed;
          color: #e0245e;
        }

        #assistx-sidebar .sidebar-footer {
          padding: 12px 20px;
          text-align: center;
          font-size: 11px;
          color: #aab8c2;
          border-top: 1px solid #e1e8ed;
          background: #fff;
        }

        /* Section styles */
        #assistx-sidebar .section-box {
          background: #fff;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        #assistx-sidebar .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        #assistx-sidebar .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #14171a;
        }

        #assistx-sidebar .btn-icon {
          width: 28px;
          height: 28px;
          padding: 4px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 6px;
          color: #657786;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        #assistx-sidebar .btn-icon:hover {
          background: #e8f5fe;
          color: #1da1f2;
        }

        #assistx-sidebar .btn-icon.loading svg {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Account info styles */
        #assistx-sidebar .account-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
        }

        #assistx-sidebar .account-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background-size: cover;
          background-position: center;
        }

        #assistx-sidebar .account-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        #assistx-sidebar .account-name {
          font-weight: 600;
          font-size: 14px;
          color: #14171a;
        }

        #assistx-sidebar .account-handle {
          font-size: 12px;
          color: #657786;
        }

        /* Post content styles */
        #assistx-sidebar .post-content {
          background: #f8fafc;
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          line-height: 1.5;
          color: #14171a;
          max-height: 200px;
          overflow-y: auto;
          word-wrap: break-word;
        }

        #assistx-sidebar .post-placeholder {
          color: #aab8c2;
          text-align: center;
          padding: 20px 0;
          font-size: 13px;
        }

        #assistx-sidebar .post-meta {
          margin-top: 8px;
          font-size: 12px;
          color: #657786;
        }

        #assistx-sidebar .post-author {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e1e8ed;
        }

        #assistx-sidebar .post-author-name {
          font-weight: 600;
          color: #14171a;
        }

        #assistx-sidebar .post-author-handle {
          color: #657786;
        }

        #assistx-sidebar .post-text {
          white-space: pre-wrap;
        }

        /* AI Button styles */
        #assistx-sidebar .btn-ai {
          width: 100%;
          padding: 12px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          margin-bottom: 12px;
        }

        #assistx-sidebar .btn-ai:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        #assistx-sidebar .btn-ai:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        #assistx-sidebar .btn-ai.loading svg {
          animation: spin 1s linear infinite;
        }

        /* AI Response styles */
        #assistx-sidebar .ai-response {
          background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
          border: 1px solid #e8ecff;
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          line-height: 1.6;
          color: #14171a;
          min-height: 60px;
          max-height: 180px;
          overflow-y: auto;
          word-wrap: break-word;
        }

        #assistx-sidebar .ai-response-text {
          white-space: pre-wrap;
        }

        #assistx-sidebar .ai-response-textarea {
          width: 100%;
          min-height: 160px;
          padding: 10px;
          border: none;
          border-radius: 8px;
          box-sizing: border-box;
          font-size: 14px;
          font-family: inherit;
          line-height: 1.5;
          resize: vertical;
          background: transparent;
        }

        #assistx-sidebar .ai-response-textarea:focus {
          outline: none;
          background: #fff;
        }

        /* AI Actions styles */
        #assistx-sidebar .ai-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }

        #assistx-sidebar .btn-secondary {
          flex: 1;
          padding: 8px 12px;
          background: #fff;
          color: #657786;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.2s ease;
        }

        #assistx-sidebar .btn-secondary:hover {
          background: #f0f4ff;
          color: #667eea;
          border-color: #667eea;
        }

        #assistx-sidebar .btn-secondary.copied {
          background: #e8f8ef;
          color: #17bf63;
          border-color: #17bf63;
        }

        #assistx-sidebar .btn-insert {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
        }

        #assistx-sidebar .btn-insert:hover {
          background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
        }

        #assistx-sidebar .btn-insert.inserted {
          background: #17bf63;
        }

        #assistx-sidebar .btn-publish {
          background: #1da1f2;
          color: white;
          border: none;
        }

        #assistx-sidebar .btn-publish:hover {
          background: #1a91da;
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(29, 161, 242, 0.4);
        }

        #assistx-sidebar .btn-publish.published {
          background: #17bf63;
        }

        /* Quick Commands */
        #assistx-sidebar .quick-commands {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        #assistx-sidebar .quick-cmd {
          flex: 1;
          min-width: 40px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e1e8ed;
          background: #fff;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        #assistx-sidebar .quick-cmd:hover {
          background: #f0f4ff;
          border-color: #667eea;
          transform: translateY(-1px);
        }

        #assistx-sidebar .quick-cmd.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        /* Generate Row */
        #assistx-sidebar .generate-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        #assistx-sidebar .generate-row .btn-ai {
          flex: 1;
        }

        /* Expand Button */
        #assistx-sidebar .btn-expand {
          width: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e1e8ed;
          background: #fff;
          border-radius: 12px;
          color: #657786;
          cursor: pointer;
          transition: all 0.2s;
        }

        #assistx-sidebar .btn-expand:hover {
          background: #f0f4ff;
          border-color: #667eea;
          color: #667eea;
        }

        #assistx-sidebar .btn-expand.expanded {
          background: #f0f4ff;
          border-color: #667eea;
          color: #667eea;
        }

        #assistx-sidebar .btn-expand.expanded svg {
          transform: rotate(180deg);
        }

        /* Prompt Preview */
        #assistx-sidebar .prompt-preview {
          background: linear-gradient(135deg, #fdfbfb 0%, #f5f7fa 100%);
          border: 1px solid #e1e8ed;
          border-radius: 10px;
          margin-bottom: 12px;
          overflow: hidden;
        }

        #assistx-sidebar .prompt-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: #fff;
          border-bottom: 1px solid #e1e8ed;
          font-size: 12px;
          font-weight: 600;
          color: #657786;
        }

        #assistx-sidebar .prompt-preview-content {
          padding: 12px;
          font-size: 12px;
          line-height: 1.6;
          color: #14171a;
          max-height: 150px;
          overflow-y: auto;
          white-space: pre-wrap;
          font-family: monospace;
        }

        /* Word Limit Row */
        #assistx-sidebar .word-limit-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          padding: 8px 10px;
          background: #f8fafc;
          border-radius: 8px;
        }

        #assistx-sidebar .word-limit-label {
          font-size: 12px;
          color: #657786;
        }

        #assistx-sidebar .word-limit-input {
          width: 60px;
          padding: 4px 8px;
          border: 1px solid #e1e8ed;
          border-radius: 6px;
          font-size: 13px;
          text-align: center;
        }

        #assistx-sidebar .word-limit-input:focus {
          border-color: #667eea;
          outline: none;
        }

        #assistx-sidebar .word-limit-unit {
          font-size: 12px;
          color: #657786;
        }

        /* Word Count Display */
        #assistx-sidebar .word-count {
          display: flex;
          justify-content: flex-end;
          padding: 6px 12px;
          font-size: 12px;
          color: #657786;
        }

        #assistx-sidebar .word-count #assistx-wordCountNum {
          font-weight: 600;
          color: #1da1f2;
          margin-right: 2px;
        }

        #assistx-sidebar .word-count.over-limit #assistx-wordCountNum {
          color: #e53935;
        }

        /* Command list styles */
        #assistx-sidebar .command-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        #assistx-sidebar .command-item {
          background: #f8fafc;
          border: 1px solid #e1e8ed;
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.2s;
        }

        #assistx-sidebar .command-item:hover {
          border-color: #667eea;
        }

        #assistx-sidebar .command-item.active {
          border-color: #667eea;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
        }

        #assistx-sidebar .command-header {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          cursor: pointer;
          background: #fff;
        }

        #assistx-sidebar .command-icon {
          font-size: 16px;
          margin-right: 8px;
        }

        #assistx-sidebar .command-name {
          flex: 1;
          font-size: 14px;
          font-weight: 600;
          color: #14171a;
        }

        #assistx-sidebar .command-name-input {
          flex: 1;
          font-size: 14px;
          font-weight: 600;
          color: #14171a;
          border: 1px solid #e1e8ed;
          border-radius: 4px;
          padding: 4px 8px;
          outline: none;
        }

        #assistx-sidebar .command-name-input:focus {
          border-color: #667eea;
        }

        #assistx-sidebar .btn-edit {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          color: #657786;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        #assistx-sidebar .btn-edit:hover {
          background: #f0f4ff;
          color: #667eea;
        }

        #assistx-sidebar .command-content {
          display: none;
          padding: 0 12px 12px;
        }

        #assistx-sidebar .command-item.editing .command-content {
          display: block;
        }

        #assistx-sidebar .command-textarea {
          width: 100%;
          min-height: 60px;
          padding: 10px;
          border: 1px solid #e1e8ed;
          border-radius: 6px;
          box-sizing: border-box;
          font-size: 13px;
          font-family: inherit;
          resize: vertical;
          transition: border-color 0.2s;
        }

        #assistx-sidebar .command-textarea:focus {
          border-color: #667eea;
          outline: none;
        }

        /* Command search */
        #assistx-sidebar .command-search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: #fff;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        #assistx-sidebar .command-search svg {
          flex-shrink: 0;
          color: #657786;
        }

        #assistx-sidebar .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 13px;
          background: transparent;
        }

        /* Add button */
        #assistx-sidebar .btn-add {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        #assistx-sidebar .btn-add:hover {
          transform: scale(1.05);
        }

        /* Delete button */
        #assistx-sidebar .btn-delete {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          color: #657786;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          margin-left: 4px;
        }

        #assistx-sidebar .btn-delete:hover {
          background: #ffebee;
          color: #e53935;
        }

        /* Textarea styles */
        #assistx-sidebar .form-textarea {
          width: 100%;
          min-height: 80px;
          padding: 10px 12px;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          box-sizing: border-box;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          transition: border-color 0.2s;
          margin-bottom: 12px;
        }

        #assistx-sidebar .form-textarea:focus {
          border-color: #1da1f2;
          outline: none;
        }

        /* About section */
        #assistx-sidebar .about-info {
          text-align: center;
          color: #657786;
          font-size: 13px;
        }

        #assistx-sidebar .about-info p {
          margin: 6px 0;
        }

        #assistx-sidebar .about-info strong {
          color: #1da1f2;
        }
      </style>
      
      <div class="sidebar-header">
        <img class="sidebar-logo" src="${chrome.runtime.getURL('assets/icon.png')}" alt="AssistX" />
        <h2 class="sidebar-title">AssistX</h2>
        <button class="sidebar-close" title="关闭侧边栏">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      
      <!-- Tab Navigation -->
      <div class="tab-nav">
        <button class="tab-btn active" data-tab="reply">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
          </svg>
          回复
        </button>
        <button class="tab-btn" data-tab="commands">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          指令
        </button>
        <button class="tab-btn" data-tab="settings">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          设置
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Reply Tab -->
        <div class="tab-panel active" id="tab-reply">
          <!-- Post Content Section -->
          <div class="section-box" id="assistx-post-section">
            <div class="section-header">
              <span class="section-title">📝 当前帖子</span>
              <button class="btn-icon" id="assistx-refreshPost" title="刷新帖子内容">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12a9 9 0 11-9-9"/>
                  <path d="M21 3v6h-6"/>
                </svg>
              </button>
            </div>
            <div class="post-content" id="assistx-postContent">
              <div class="post-placeholder">点击刷新按钮获取帖子内容</div>
            </div>
            <div class="post-meta" id="assistx-postMeta"></div>
          </div>

          <!-- AI Reply Section -->
          <div class="section-box" id="assistx-ai-section">
            <div class="section-header">
              <span class="section-title">🤖 AI 回复</span>
            </div>
            
            <!-- Quick Commands -->
            <div class="quick-commands" id="assistx-quickCommands">
              <button class="quick-cmd active" data-prompt="default" title="友好回复">🎯</button>
              <button class="quick-cmd" data-prompt="agree" title="表示赞同">👍</button>
              <button class="quick-cmd" data-prompt="question" title="提出问题">❓</button>
              <button class="quick-cmd" data-prompt="humor" title="幽默风趣">😄</button>
              <button class="quick-cmd" data-prompt="professional" title="专业分析">💼</button>
            </div>
            
            <!-- Prompt Preview Area -->
            <div class="prompt-preview" id="assistx-promptPreview" style="display: none;">
              <div class="prompt-preview-header">
                <span>📝 完整提示词</span>
                <button class="btn-icon" id="assistx-closePreview" title="收起">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="18 15 12 9 6 15"/>
                  </svg>
                </button>
              </div>
              <div class="prompt-preview-content" id="assistx-promptContent">
                提示词内容将在此显示...
              </div>
            </div>
            
            <!-- Word Limit Setting -->
            <div class="word-limit-row">
              <label class="word-limit-label">字数限制</label>
              <input type="number" id="assistx-wordLimit" class="word-limit-input" value="70" min="10" max="280" />
              <span class="word-limit-unit">字</span>
            </div>
            
            <!-- Generate Button Row -->
            <div class="generate-row">
              <button class="btn-expand" id="assistx-expandPrompt" title="预览提示词">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <button class="btn-ai" id="assistx-generateReply">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                <span>生成 AI 回复</span>
              </button>
            </div>
            <div class="ai-response" id="assistx-aiResponse">
              <div class="post-placeholder" id="assistx-aiPlaceholder">点击按钮生成 AI 回复</div>
              <textarea class="ai-response-textarea" id="assistx-aiResponseText" style="display: none;" placeholder="AI 回复内容..."></textarea>
            </div>
            <div class="word-count" id="assistx-wordCount" style="display: none;">
              <span id="assistx-wordCountNum">0</span> 字
            </div>
            <div class="ai-actions" id="assistx-aiActions" style="display: none;">
              <button class="btn-secondary btn-insert" id="assistx-insertReply" title="插入到回复框">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14"/>
                  <path d="M5 12h14"/>
                </svg>
                插入
              </button>
              <button class="btn-secondary" id="assistx-copyReply" title="复制回复">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                复制
              </button>
              <button class="btn-secondary btn-publish" id="assistx-publishReply" title="发布回复">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                发布
              </button>
            </div>
          </div>
        </div>

        <!-- Commands Tab -->
        <div class="tab-panel" id="tab-commands">
          <div class="section-box">
            <div class="section-header">
              <span class="section-title">📋 指令模板</span>
              <button class="btn-icon btn-add" id="assistx-addCommand" title="新增指令">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
            <div class="command-search">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" id="assistx-commandSearch" class="search-input" placeholder="搜索指令..." />
            </div>
            <div class="command-list" id="assistx-commandList">
              <div class="command-item" data-prompt="default">
                <div class="command-header">
                  <span class="command-icon">🎯</span>
                  <span class="command-name">默认回复</span>
                  <button class="btn-edit" data-prompt="default" title="编辑">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
                <div class="command-content">
                  <textarea class="command-textarea" data-prompt="default" placeholder="输入指令内容...">友好地回复推文内容，态度积极正面</textarea>
                </div>
              </div>
              
              <div class="command-item" data-prompt="agree">
                <div class="command-header">
                  <span class="command-icon">👍</span>
                  <span class="command-name">表示赞同</span>
                  <button class="btn-edit" data-prompt="agree" title="编辑">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
                <div class="command-content">
                  <textarea class="command-textarea" data-prompt="agree" placeholder="输入指令内容...">表示认同对方观点，并补充自己的看法</textarea>
                </div>
              </div>
              
              <div class="command-item" data-prompt="question">
                <div class="command-header">
                  <span class="command-icon">❓</span>
                  <span class="command-name">提出问题</span>
                  <button class="btn-edit" data-prompt="question" title="编辑">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
                <div class="command-content">
                  <textarea class="command-textarea" data-prompt="question" placeholder="输入指令内容...">针对推文内容提出有建设性的问题，引发讨论</textarea>
                </div>
              </div>
              
              <div class="command-item" data-prompt="humor">
                <div class="command-header">
                  <span class="command-icon">😄</span>
                  <span class="command-name">幽默风趣</span>
                  <button class="btn-edit" data-prompt="humor" title="编辑">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
                <div class="command-content">
                  <textarea class="command-textarea" data-prompt="humor" placeholder="输入指令内容...">用轻松幽默的方式回复，增加互动趣味</textarea>
                </div>
              </div>
              
              <div class="command-item" data-prompt="professional">
                <div class="command-header">
                  <span class="command-icon">💼</span>
                  <span class="command-name">专业分析</span>
                  <button class="btn-edit" data-prompt="professional" title="编辑">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
                <div class="command-content">
                  <textarea class="command-textarea" data-prompt="professional" placeholder="输入指令内容...">从专业角度分析内容，给出深入见解</textarea>
                </div>
              </div>
            </div>
            
            <button class="btn-primary" id="assistx-saveCommands" style="margin-top: 12px;">保存指令</button>
          </div>
        </div>

        <!-- Settings Tab -->
        <div class="tab-panel" id="tab-settings">
          <!-- Current Account -->
          <div class="section-box">
            <div class="section-header">
              <span class="section-title">👤 当前账号</span>
            </div>
            <div class="account-info">
              <div class="account-avatar" id="assistx-accountAvatar"></div>
              <div class="account-details">
                <span class="account-name" id="assistx-accountName">加载中...</span>
                <span class="account-handle" id="assistx-accountHandle">@...</span>
              </div>
            </div>
          </div>

          <div class="section-box">
            <div class="section-header">
              <span class="section-title">🔑 API 配置</span>
            </div>
            <div class="form-group">
              <label class="form-label" for="assistx-apiKey">ZhipuAI API Key</label>
              <input type="password" id="assistx-apiKey" class="form-input" placeholder="Enter your API Key (id.secret)" />
              <p class="form-hint">
                Get your key from <a href="https://open.bigmodel.cn/usercenter/apikeys" target="_blank">open.bigmodel.cn</a>
              </p>
            </div>
            
            <button class="btn-primary" id="assistx-saveBtn">保存设置</button>
            
            <div class="status-message" id="assistx-status"></div>
          </div>

          <div class="section-box">
            <div class="section-header">
              <span class="section-title">ℹ️ 关于</span>
            </div>
            <div class="about-info">
              <p><strong>AssistX</strong> v0.1.0</p>
              <p>使用 ZhipuAI GLM-4 模型</p>
              <p>智能 AI 回复助手</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="sidebar-footer">
        Powered by GLM-4
      </div>
    `;

    document.body.appendChild(this.container);

    // Bind events
    this.bindEvents();
    
    // Load saved settings
    this.loadSettings();
  }

  bindEvents() {
    // Close button
    const closeBtn = this.container.querySelector('.sidebar-close');
    closeBtn.addEventListener('click', () => this.close());

    // Save button
    const saveBtn = this.container.querySelector('#assistx-saveBtn');
    saveBtn.addEventListener('click', () => this.saveSettings());

    // Refresh post button
    const refreshBtn = this.container.querySelector('#assistx-refreshPost');
    refreshBtn.addEventListener('click', () => this.refreshPostContent());

    // AI Generate button
    const generateBtn = this.container.querySelector('#assistx-generateReply');
    generateBtn.addEventListener('click', () => this.generateAIReply());

    // Insert reply button
    const insertBtn = this.container.querySelector('#assistx-insertReply');
    insertBtn.addEventListener('click', () => this.insertReply());

    // Copy reply button
    const copyBtn = this.container.querySelector('#assistx-copyReply');
    copyBtn.addEventListener('click', () => this.copyReply());

    // Publish reply button
    const publishBtn = this.container.querySelector('#assistx-publishReply');
    publishBtn.addEventListener('click', () => this.publishReply());

    // Tab navigation
    const tabBtns = this.container.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // Command selection (in Commands tab) - clicking header selects
    const commandHeaders = this.container.querySelectorAll('.command-header');
    commandHeaders.forEach(header => {
      header.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-edit')) {
          const item = header.closest('.command-item');
          this.selectPrompt(item.dataset.prompt);
        }
      });
    });

    // Edit buttons (toggle editing mode)
    const editBtns = this.container.querySelectorAll('.btn-edit');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = btn.closest('.command-item');
        item.classList.toggle('editing');
      });
    });

    // Quick commands (in Reply tab)
    const quickCmds = this.container.querySelectorAll('.quick-cmd');
    quickCmds.forEach(cmd => {
      cmd.addEventListener('click', () => this.selectPrompt(cmd.dataset.prompt));
    });

    // Save commands button
    const saveCommandsBtn = this.container.querySelector('#assistx-saveCommands');
    if (saveCommandsBtn) {
      saveCommandsBtn.addEventListener('click', () => this.saveCommands());
    }

    // Add command button
    const addCommandBtn = this.container.querySelector('#assistx-addCommand');
    if (addCommandBtn) {
      addCommandBtn.addEventListener('click', () => this.addCommand());
    }

    // Search input
    const searchInput = this.container.querySelector('#assistx-commandSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.searchCommands(e.target.value));
    }

    // Delegate delete button clicks (for dynamically added items)
    const commandList = this.container.querySelector('#assistx-commandList');
    if (commandList) {
      commandList.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.btn-delete');
        if (deleteBtn) {
          e.stopPropagation();
          const item = deleteBtn.closest('.command-item');
          this.deleteCommand(item);
        }
      });
    }

    // Expand prompt preview button
    const expandBtn = this.container.querySelector('#assistx-expandPrompt');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => this.togglePromptPreview());
    }

    // Close prompt preview button
    const closePreviewBtn = this.container.querySelector('#assistx-closePreview');
    if (closePreviewBtn) {
      closePreviewBtn.addEventListener('click', () => this.togglePromptPreview(false));
    }
  }

  /**
   * Switch between tabs
   */
  switchTab(tabName) {
    // Update tab buttons
    const tabBtns = this.container.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab panels
    const tabPanels = this.container.querySelectorAll('.tab-panel');
    tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabName}`);
    });
  }

  /**
   * Select a prompt template (syncs quick commands and command items)
   */
  selectPrompt(promptType) {
    // Update quick commands in Reply tab
    const quickCmds = this.container.querySelectorAll('.quick-cmd');
    quickCmds.forEach(cmd => {
      cmd.classList.toggle('active', cmd.dataset.prompt === promptType);
    });

    // Update command items in Commands tab
    const commandItems = this.container.querySelectorAll('.command-item');
    commandItems.forEach(item => {
      item.classList.toggle('active', item.dataset.prompt === promptType);
    });
    
    // Store selected prompt type
    this.selectedPromptType = promptType;
    console.log('[AssistX] Selected prompt:', this.selectedPromptType);
    
    // Update preview if visible
    const preview = this.container.querySelector('#assistx-promptPreview');
    if (preview && preview.style.display !== 'none') {
      this.updatePromptPreview();
    }
  }

  /**
   * Toggle prompt preview visibility
   */
  togglePromptPreview(show = null) {
    const preview = this.container.querySelector('#assistx-promptPreview');
    const expandBtn = this.container.querySelector('#assistx-expandPrompt');
    
    if (show === null) {
      show = preview.style.display === 'none';
    }
    
    preview.style.display = show ? 'block' : 'none';
    expandBtn.classList.toggle('expanded', show);
    
    if (show) {
      this.updatePromptPreview();
    }
  }

  /**
   * Update the prompt preview content
   */
  updatePromptPreview() {
    const contentDiv = this.container.querySelector('#assistx-promptContent');
    const postData = this.extractPostContent();
    
    // Get selected command text
    const selectedType = this.selectedPromptType || 'default';
    const commandTextarea = this.container.querySelector(`.command-textarea[data-prompt="${selectedType}"]`);
    const commandText = commandTextarea ? commandTextarea.value : '友好地回复推文内容';
    
    // Get word limit
    const wordLimitInput = this.container.querySelector('#assistx-wordLimit');
    const wordLimit = parseInt(wordLimitInput.value) || 70;
    
    // Build prompt using shared function
    const prompt = buildReplyPrompt({
      tweetText: postData.text,
      commandText,
      wordLimit
    });
    
    contentDiv.textContent = prompt;
  }

  /**
   * Save all commands to storage
   */
  async saveCommands() {
    const textareas = this.container.querySelectorAll('.command-textarea');
    const commands = {};
    
    textareas.forEach(textarea => {
      commands[textarea.dataset.prompt] = textarea.value.trim();
    });
    
    try {
      await chrome.storage.local.set({ commands });
      this.showStatus('指令已保存!', 'success');
      console.log('[AssistX] Saved commands:', commands);
    } catch (error) {
      this.showStatus('保存失败', 'error');
      console.error(error);
    }
  }

  /**
   * Add a new command
   */
  addCommand() {
    const commandList = this.container.querySelector('#assistx-commandList');
    const emojis = ['✨', '🚀', '💡', '🎨', '📌', '⭐', '🔥', '💬'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const id = 'cmd_' + Date.now();
    
    const newItem = document.createElement('div');
    newItem.className = 'command-item editing';
    newItem.dataset.prompt = id;
    newItem.innerHTML = `
      <div class="command-header">
        <span class="command-icon">${randomEmoji}</span>
        <input class="command-name-input" type="text" value="新指令" placeholder="指令名称" />
        <button class="btn-edit" data-prompt="${id}" title="编辑">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn-delete" data-prompt="${id}" title="删除">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
      <div class="command-content">
        <textarea class="command-textarea" data-prompt="${id}" placeholder="输入指令内容..."></textarea>
      </div>
    `;
    
    // Add to beginning of list
    commandList.insertBefore(newItem, commandList.firstChild);
    
    // Focus the name input
    const nameInput = newItem.querySelector('.command-name-input');
    nameInput.focus();
    nameInput.select();
    
    // Bind edit button
    const editBtn = newItem.querySelector('.btn-edit');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      newItem.classList.toggle('editing');
    });
    
    // Bind header click
    const header = newItem.querySelector('.command-header');
    header.addEventListener('click', (e) => {
      if (!e.target.closest('.btn-edit') && !e.target.closest('.btn-delete') && !e.target.closest('.command-name-input')) {
        this.selectPrompt(id);
      }
    });
    
    console.log('[AssistX] Added new command:', id);
  }

  /**
   * Delete a command
   */
  deleteCommand(item) {
    const prompt = item.dataset.prompt;
    
    // Confirm deletion
    if (confirm('确定要删除这个指令吗？')) {
      item.remove();
      console.log('[AssistX] Deleted command:', prompt);
      
      // Save updated commands
      this.saveCommands();
    }
  }

  /**
   * Search commands
   */
  searchCommands(query) {
    const commandItems = this.container.querySelectorAll('.command-item');
    const lowerQuery = query.toLowerCase().trim();
    
    commandItems.forEach(item => {
      const name = item.querySelector('.command-name, .command-name-input');
      const textarea = item.querySelector('.command-textarea');
      
      const nameText = name ? (name.value || name.textContent).toLowerCase() : '';
      const contentText = textarea ? textarea.value.toLowerCase() : '';
      
      const matches = lowerQuery === '' || 
                      nameText.includes(lowerQuery) || 
                      contentText.includes(lowerQuery);
      
      item.style.display = matches ? 'block' : 'none';
    });
  }

  async loadSettings() {
    const result = await chrome.storage.local.get(['apiKey', 'wordLimit']);
    
    if (result.apiKey) {
      const input = this.container.querySelector('#assistx-apiKey');
      input.value = result.apiKey;
    }
    
    // Load word limit setting
    if (result.wordLimit) {
      const wordLimitInput = this.container.querySelector('#assistx-wordLimit');
      wordLimitInput.value = result.wordLimit;
    }
    
    // Save word limit on change
    const wordLimitInput = this.container.querySelector('#assistx-wordLimit');
    wordLimitInput.addEventListener('change', async () => {
      const wordLimit = parseInt(wordLimitInput.value) || 70;
      await chrome.storage.local.set({ wordLimit });
      console.log('[AssistX] Saved word limit:', wordLimit);
    });
    
    // Auto-load post content when sidebar opens
    this.refreshPostContent();
    
    // Load current Twitter account
    this.loadCurrentAccount();
  }

  /**
   * Load and display the current Twitter account
   */
  loadCurrentAccount() {
    const nameEl = this.container.querySelector('#assistx-accountName');
    const handleEl = this.container.querySelector('#assistx-accountHandle');
    const avatarEl = this.container.querySelector('#assistx-accountAvatar');
    
    try {
      // Try to find the account info from Twitter's sidebar
      // The account button usually has data-testid="SideNav_AccountSwitcher_Button"
      const accountButton = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
      
      if (accountButton) {
        // Get avatar image
        const avatarImg = accountButton.querySelector('img');
        if (avatarImg && avatarImg.src) {
          avatarEl.style.backgroundImage = `url(${avatarImg.src})`;
        }
        
        // Get display name and handle from the button's spans
        const spans = accountButton.querySelectorAll('span');
        let displayName = '';
        let handle = '';
        
        spans.forEach(span => {
          const text = span.textContent.trim();
          if (text.startsWith('@')) {
            handle = text;
          } else if (text && !text.includes('…') && text.length > 1) {
            displayName = text;
          }
        });
        
        if (displayName) nameEl.textContent = displayName;
        if (handle) handleEl.textContent = handle;
        
        console.log('[AssistX] Loaded account:', displayName, handle);
      } else {
        nameEl.textContent = '未检测到账号';
        handleEl.textContent = '@unknown';
      }
    } catch (error) {
      console.error('[AssistX] Failed to load account:', error);
      nameEl.textContent = '加载失败';
      handleEl.textContent = '@error';
    }
  }

  /**
   * Extract the current post content from the Twitter/X page
   */
  extractPostContent() {
    // Try to get the main tweet on the page
    // On a status page, the main tweet is usually the first one or has specific styling
    
    const postData = {
      text: '',
      author: '',
      handle: '',
      time: ''
    };

    // Try to find the main tweet article
    const articles = document.querySelectorAll('article[data-testid="tweet"]');
    
    if (articles.length > 0) {
      // Get the first article (main tweet on status page)
      const mainArticle = articles[0];
      
      // Extract tweet text
      const tweetTextEl = mainArticle.querySelector('[data-testid="tweetText"]');
      if (tweetTextEl) {
        postData.text = tweetTextEl.innerText;
      }
      
      // Extract author info
      const userNameEl = mainArticle.querySelector('[data-testid="User-Name"]');
      if (userNameEl) {
        const nameSpans = userNameEl.querySelectorAll('span');
        // First span with actual text is usually the display name
        for (const span of nameSpans) {
          const text = span.textContent.trim();
          if (text && !text.startsWith('@') && text !== '·' && !text.includes('Verified')) {
            postData.author = text;
            break;
          }
        }
        // Find @handle
        const handleLink = userNameEl.querySelector('a[href^="/"]');
        if (handleLink) {
          const href = handleLink.getAttribute('href');
          postData.handle = '@' + href.replace('/', '').split('/')[0];
        }
      }
      
      // Extract time
      const timeEl = mainArticle.querySelector('time');
      if (timeEl) {
        postData.time = timeEl.getAttribute('datetime') || timeEl.innerText;
      }
    } else {
      // Fallback: just try to get any tweet text on the page
      const tweetTexts = document.querySelectorAll('[data-testid="tweetText"]');
      if (tweetTexts.length > 0) {
        postData.text = tweetTexts[0].innerText;
      }
    }

    return postData;
  }

  /**
   * Refresh and display the current post content
   */
  async refreshPostContent() {
    const refreshBtn = this.container.querySelector('#assistx-refreshPost');
    const postContentDiv = this.container.querySelector('#assistx-postContent');
    const postMetaDiv = this.container.querySelector('#assistx-postMeta');
    
    // Show loading state
    refreshBtn.classList.add('loading');
    
    try {
      // Small delay to allow page to settle if just opened
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const postData = this.extractPostContent();
      
      if (postData.text) {
        // Build the post HTML
        let postHtml = '';
        
        if (postData.author || postData.handle) {
          postHtml += `<div class="post-author">`;
          if (postData.author) {
            postHtml += `<span class="post-author-name">${this.escapeHtml(postData.author)}</span>`;
          }
          if (postData.handle) {
            postHtml += `<span class="post-author-handle">${this.escapeHtml(postData.handle)}</span>`;
          }
          postHtml += `</div>`;
        }
        
        postHtml += `<div class="post-text">${this.escapeHtml(postData.text)}</div>`;
        
        postContentDiv.innerHTML = postHtml;
        
        // Show meta info
        if (postData.time) {
          const timeStr = this.formatTime(postData.time);
          postMetaDiv.textContent = timeStr;
        } else {
          postMetaDiv.textContent = '';
        }
      } else {
        postContentDiv.innerHTML = `<div class="post-placeholder">未找到帖子内容，请确保在帖子详情页</div>`;
        postMetaDiv.textContent = '';
      }
    } catch (error) {
      console.error('[AssistX] Error extracting post:', error);
      postContentDiv.innerHTML = `<div class="post-placeholder">获取帖子内容失败</div>`;
    } finally {
      refreshBtn.classList.remove('loading');
    }
  }

  /**
   * Generate AI reply for the current post
   */
  async generateAIReply() {
    const generateBtn = this.container.querySelector('#assistx-generateReply');
    const responseDiv = this.container.querySelector('#assistx-aiResponse');
    const actionsDiv = this.container.querySelector('#assistx-aiActions');
    const wordCountDiv = this.container.querySelector('#assistx-wordCount');
    
    // Get current post content
    const postData = this.extractPostContent();
    
    if (!postData.text) {
      responseDiv.innerHTML = `<div class="post-placeholder">请先获取帖子内容</div>`;
      wordCountDiv.style.display = 'none';
      return;
    }
    
    // Get word limit
    const wordLimitInput = this.container.querySelector('#assistx-wordLimit');
    const wordLimit = parseInt(wordLimitInput.value) || 70;
    
    // Get selected command
    const selectedType = this.selectedPromptType || 'default';
    const commandTextarea = this.container.querySelector(`.command-textarea[data-prompt="${selectedType}"]`);
    const commandText = commandTextarea ? commandTextarea.value : '友好地回复推文内容';
    
    // Show loading state
    generateBtn.classList.add('loading');
    generateBtn.disabled = true;
    
    const placeholder = this.container.querySelector('#assistx-aiPlaceholder');
    const responseTextarea = this.container.querySelector('#assistx-aiResponseText');
    placeholder.textContent = '🤔 AI 正在思考...';
    placeholder.style.display = 'block';
    responseTextarea.style.display = 'none';
    actionsDiv.style.display = 'none';
    wordCountDiv.style.display = 'none';
    
    try {
      // Send message to background script with word limit and command
      const response = await chrome.runtime.sendMessage({
        type: 'generate_reply',
        tweetText: postData.text,
        wordLimit: wordLimit,
        commandText: commandText
      });
      
      console.log('[AssistX] AI Response:', response);
      
      if (response && response.success) {
        // Display the reply in editable textarea
        this.currentReply = response.reply;
        placeholder.style.display = 'none';
        responseTextarea.value = response.reply;
        responseTextarea.style.display = 'block';
        actionsDiv.style.display = 'flex';
        
        // Update word count
        this.updateWordCount();
        
        // Add input event for real-time word count
        responseTextarea.oninput = () => {
          this.currentReply = responseTextarea.value;
          this.updateWordCount();
        };
      } else {
        const errorMsg = response?.error || '生成失败，请检查 API Key';
        placeholder.textContent = `❌ ${errorMsg}`;
        placeholder.style.display = 'block';
        responseTextarea.style.display = 'none';
      }
    } catch (error) {
      console.error('[AssistX] AI Error:', error);
      placeholder.textContent = `❌ ${error.message}`;
      placeholder.style.display = 'block';
      responseTextarea.style.display = 'none';
    } finally {
      generateBtn.classList.remove('loading');
      generateBtn.disabled = false;
    }
  }

  /**
   * Count characters (Twitter-style: counts all characters)
   */
  countWords(text) {
    if (!text) return 0;
    // Twitter counts all characters including spaces
    return text.length;
  }

  /**
   * Update the word count display
   */
  updateWordCount() {
    const wordCountDiv = this.container.querySelector('#assistx-wordCount');
    const wordCountNum = this.container.querySelector('#assistx-wordCountNum');
    const wordLimitInput = this.container.querySelector('#assistx-wordLimit');
    const responseTextarea = this.container.querySelector('#assistx-aiResponseText');
    
    const text = responseTextarea.value || '';
    const wordCount = this.countWords(text);
    const wordLimit = parseInt(wordLimitInput.value) || 70;
    
    wordCountNum.textContent = wordCount;
    wordCountDiv.style.display = 'flex';
    
    // Check over limit
    if (wordCount > wordLimit) {
      wordCountDiv.classList.add('over-limit');
    } else {
      wordCountDiv.classList.remove('over-limit');
    }
  }

  /**
   * Copy the AI reply to clipboard
   */
  async copyReply() {
    if (!this.currentReply) return;
    
    const copyBtn = this.container.querySelector('#assistx-copyReply');
    
    try {
      await navigator.clipboard.writeText(this.currentReply);
      
      // Show copied feedback
      copyBtn.classList.add('copied');
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        已复制
      `;
      
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.innerHTML = originalText;
      }, 2000);
    } catch (error) {
      console.error('[AssistX] Copy failed:', error);
    }
  }

  /**
   * Insert the AI reply into Twitter's reply input box
   */
  async insertReply() {
    if (!this.currentReply) return;
    
    const insertBtn = this.container.querySelector('#assistx-insertReply');
    const originalText = insertBtn.innerHTML;
    
    // Find Twitter's reply textarea
    const textarea = document.querySelector('[data-testid="tweetTextarea_0"]');
    
    if (!textarea) {
      // Try to find the reply button and click it first
      const replyButton = document.querySelector('[data-testid="reply"]');
      if (replyButton) {
        replyButton.click();
        // Wait for textarea to appear
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const targetTextarea = document.querySelector('[data-testid="tweetTextarea_0"]');
    
    if (!targetTextarea) {
      // Show error feedback
      insertBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        未找到
      `;
      setTimeout(() => {
        insertBtn.innerHTML = originalText;
      }, 2000);
      return;
    }
    
    try {
      // Show loading state
      insertBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" class="spin">
          <path d="M21 12a9 9 0 11-9-9"/>
        </svg>
        插入中
      `;
      
      // Focus the textarea
      targetTextarea.focus();
      
      // Wait a bit for focus
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Select all existing content first, then replace with new text
      document.execCommand('selectAll', false, null);
      
      // Insert text (will replace selected content)
      document.execCommand('insertText', false, this.currentReply);
      
      // Dispatch input event to trigger React/Draft.js updates
      targetTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Show success feedback
      insertBtn.classList.add('inserted');
      insertBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        已插入
      `;
      
      setTimeout(() => {
        insertBtn.classList.remove('inserted');
        insertBtn.innerHTML = originalText;
      }, 2000);
      
      console.log('[AssistX] Reply inserted successfully');
    } catch (error) {
      console.error('[AssistX] Insert failed:', error);
      insertBtn.innerHTML = originalText;
    }
  }

  /**
   * Click Twitter's reply button to publish the reply
   */
  async publishReply() {
    const publishBtn = this.container.querySelector('#assistx-publishReply');
    const originalText = publishBtn.innerHTML;
    
    // Find Twitter's reply/post button
    // The button has data-testid="tweetButtonInline" for inline replies
    const replyButton = document.querySelector('[data-testid="tweetButtonInline"]');
    
    if (!replyButton) {
      // Show error feedback
      publishBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        未找到
      `;
      setTimeout(() => {
        publishBtn.innerHTML = originalText;
      }, 2000);
      return;
    }
    
    // Check if button is disabled (usually when textarea is empty)
    if (replyButton.disabled || replyButton.getAttribute('aria-disabled') === 'true') {
      publishBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        字数超限
      `;
      setTimeout(() => {
        publishBtn.innerHTML = originalText;
      }, 2000);
      return;
    }
    
    try {
      // Show loading state
      publishBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" class="spin">
          <path d="M21 12a9 9 0 11-9-9"/>
        </svg>
        发布中
      `;
      
      // Click the reply button
      replyButton.click();
      
      // Wait a bit for the action to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Show success feedback
      publishBtn.classList.add('published');
      publishBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        已发布
      `;
      
      setTimeout(() => {
        publishBtn.classList.remove('published');
        publishBtn.innerHTML = originalText;
      }, 3000);
      
      console.log('[AssistX] Reply published successfully');
    } catch (error) {
      console.error('[AssistX] Publish failed:', error);
      publishBtn.innerHTML = originalText;
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format timestamp
   */
  formatTime(timeStr) {
    try {
      const date = new Date(timeStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeStr;
    }
  }

  async saveSettings() {
    const input = this.container.querySelector('#assistx-apiKey');
    const apiKey = input.value.trim();
    const statusDiv = this.container.querySelector('#assistx-status');

    if (!apiKey) {
      this.showStatus('Please enter an API Key', 'error');
      return;
    }

    try {
      await chrome.storage.local.set({ apiKey });
      this.showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      this.showStatus('Failed to save settings', 'error');
      console.error(error);
    }
  }

  showStatus(message, type) {
    const statusDiv = this.container.querySelector('#assistx-status');
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = 'status-message';
    }, 3000);
  }

  open() {
    if (this.container) {
      requestAnimationFrame(() => {
        this.container.classList.add('open');
      });
      this.isOpen = true;
    }
  }

  close() {
    if (this.container) {
      this.container.classList.remove('open');
      this.isOpen = false;
      // Save preference back to popup mode
      chrome.storage.local.set({ layoutMode: 'popup' });
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      if (!this.container) {
        this.create();
      }
      this.open();
    }
  }
}
