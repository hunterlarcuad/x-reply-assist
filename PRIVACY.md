# Chrome Web Store 发布素材清单

## 必需素材

### 1. 商店截图 (Screenshots) — 至少 1 张，最多 5 张
- **尺寸**: 1280x800 或 640x400（宽高比 8:5）
- **格式**: PNG 或 JPEG（无透明通道）
- **建议截图内容**:
  1. **主界面** - Side Panel 展示推文提取 + AI 回复生成
  2. **设置页** - API Key 配置 + 多模型选择
  3. **多服务商** - Provider 切换界面
  4. **指令库** - 自定义 Prompt 模板管理
  5. **插入/发布** - 一键插入回复到推特编辑框

### 2. 图标 (Icons) ✅ 已生成
| 尺寸 | 用途 | 文件 |
|------|------|------|
| 16x16 | 工具栏 | `assets/icon-16.png` |
| 48x48 | 扩展管理页 | `assets/icon-48.png` |
| 128x128 | Web Store | `assets/icon-128.png` |
| 448x448 | Web Store 高清 | `assets/icon-448.png` |

## 截图制作步骤

```bash
# 1. 在 Chrome 中加载扩展（开发者模式）
# 2. 打开 https://x.com 随便找一个帖子
# 3. 点击扩展图标打开 Side Panel
# 4. 用 macOS 截图工具:
#    Cmd+Shift+4 → 空格 → 选择窗口 → 自动截取窗口
#    或 Cmd+Shift+3 全屏后裁剪到 1280x800

# 5. 如果需要统一尺寸，用 sips 处理:
sips -z 800 1280 screenshot.png --out store-screenshot-1.png
```

### 截图 Tips
- 使用**浅色背景**的 Twitter 页面截图
- 确保文字清晰可读（放大浏览器到 125%-150% 再截）
- 不要包含敏感信息（你的 API Key、用户名等）
- 可以适当标注功能区域（箭头、圆圈等）

## Store Listing 填写模板

### 语言: 默认英语（可添加中文）

| 字段 | 推荐填写 |
|------|----------|
| **Extension name** | AssistX - Smart AI Reply for X |
| **Detailed description** | 见下方 |
| **Short description** | AI-powered smart reply assistant for Twitter/X. Support GLM, GPT, Claude & more. |
| **Category** | Productivity |
| **Language** | English (添加 Chinese Simplified) |

### Detailed Description (英文)

```
AssistX is a powerful Chrome extension that brings AI-powered smart replies to Twitter/X.

🚀 KEY FEATURES

• Smart Reply Generation — Automatically extract tweet content and generate contextual AI responses with one click
• Multi-Model Support — Works with GLM, GPT-4o, Claude, DeepSeek, and more
• Dual Protocol — Compatible with both OpenAI and Anthropic API formats
• Multi-Provider Config — Configure and switch between multiple AI providers seamlessly
• Flexible UI — Choose between Side Panel or Popup mode
• Custom Prompt Library — Save and manage your own prompt templates
• Bilingual UI — Full Chinese and English interface support
• Direct Insert & Post — Insert reply to compose box or publish instantly

🛡️ PRIVACY

• All data stays on your device — API keys are stored locally in browser storage
• No accounts, no tracking, no analytics
• No data sent to any server except your configured AI API endpoint
• Full privacy policy: https://hunterlarcuad.github.io/x-reply-assist/privacy.html

📋 PERMISSIONS EXPLAINED

• storage — Save your settings and API keys securely
• activeTab — Access current tab to extract tweet content
• scripting — Inject content scripts for Twitter/X interaction
• alarms — Support for scheduled tasks
• sidePanel — Provide side panel UI

🔧 SETUP

1. Click the extension icon to open settings
2. Enter your AI API key (ZhipuAI, OpenAI, Anthropic, etc.)
3. Select your preferred model
4. Navigate to any tweet and click "Generate Reply"

Made with ❤️ for the X community.
```

### Detailed Description (中文)

```
AssistX 是一款强大的 Chrome 扩展，为 Twitter/X 带来 AI 智能回复能力。

🚀 核心功能

• 智能回复生成 — 自动提取推文内容，一键生成上下文相关的 AI 回复
• 多模型支持 — 兼容 GLM、GPT-4o、Claude、DeepSeek 等
• 双协议适配 — 同时支持 OpenAI 和 Anthropic API 格式
• 多服务商配置 — 可同时配置多个 AI 服务商并灵活切换
• 灵活 UI — 侧边栏 / 弹出窗口两种模式可选
• 自定义指令库 — 保存和管理自定义 Prompt 模板
• 中英双语界面 — 完整的中英文界面支持
• 直接插入/发布 — 一键将回复插入编辑框或直接发布

🛡️ 隐私保护

• 所有数据存储在本地设备 — API Key 保存在浏览器本地存储中
• 无账号、无追踪、无数据分析
• 除你配置的 AI API 外，不向任何服务器发送数据
• 完整隐私政策: https://hunterlarcuad.github.io/x-reply-assist/privacy.html

📋 权限说明

• storage — 安全保存你的设置和 API Key
• activeTab — 访问当前标签页以提取推文内容
• scripting — 注入内容脚本与 Twitter/X 页面交互
• alarms — 支持定时任务
• sidePanel — 提供侧边栏界面

🔧 使用方法

1. 点击扩展图标打开设置面板
2. 输入你的 AI API Key（智谱AI、OpenAI、Anthropic 等）
3. 选择喜欢的模型
4. 浏览任意推文，点击"生成回复"

用 ❤️ 打造，服务于 X 社区。
```
