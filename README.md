# AssistX - Twitter/X 智能AI回复 Chrome 扩展

Smart AI replies for Twitter/X using ZhipuAI GLM model (also supports OpenAI, Anthropic, DeepSeek, etc.).

## Features

- **智能回复生成** - 自动提取推文内容，一键生成 AI 回复
- **多模型支持** - 支持 GLM、GPT、Claude、DeepSeek 等多种 AI 模型
- **多协议兼容** - 同时支持 OpenAI 和 Anthropic API 协议
- **多服务商配置** - 可同时配置多个 AI 服务商，灵活切换
- **侧边栏 / 弹出窗口** - 两种 UI 模式可选
- **自定义指令库** - 可保存和管理自定义 Prompt 模板
- **中英双语界面** - 支持中文和英文界面切换
- **直接插入 / 发布** - 一键将回复插入编辑框或直接发布

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select this folder
5. Click the extension icon to open the settings panel
6. Enter your API Key

## Configuration

### API Key Setup

- **ZhipuAI (GLM)**: Get your key from [open.bigmodel.cn](https://open.bigmodel.cn/usercenter/apikeys)
- **OpenAI**: Use your standard OpenAI API key
- **Anthropic**: Use your Anthropic API key
- **Others**: Configure custom Base URL and API key in settings

### Supported Providers & Models

| Provider | Default Models |
|----------|---------------|
| GLM | glm-4-plus, glm-4.5-air, glm-4.7, glm-4.7-flash, glm-5, glm-5-turbo, glm-5.1 |
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4-turbo, o1-preview, deepseek-chat, deepseek-coder |
| Anthropic | claude-3-5-sonnet-latest, claude-3-5-haiku-latest, claude-3-opus-latest |

## Project Structure

```
assistx-chrome-extension/
├── manifest.json       # Chrome Extension Manifest V3
├── background/         # Service worker (API calls, message handling)
│   ├── api.js          # AI API integration (OpenAI + Anthropic protocols)
│   └── index.js        # Background script entry point
├── content/            # Content scripts (Twitter/X page interaction)
│   ├── index.js        # Content script entry & message bridge
│   ├── loader.js       # Script injection loader
│   ├── sidebar.js      # Injected sidebar UI component
│   ├── twitter.js      # Twitter DOM handler
│   └── utils.js        # Prompt building utilities
├── libs/               # Shared utilities
│   └── storage.js      # Chrome storage wrapper
├── ui/                 # Extension UI
│   ├── popup.html/js/css    # Popup interface
│   └── sidepanel.html/js/css # Side panel interface
└── assets/             # Icons and static resources
```

## Development

This is a Manifest V3 Chrome Extension using ES modules.

### Permissions Required

- `storage` - Save user settings and API keys
- `activeTab` - Access current tab for tweet extraction
- `scripting` - Inject content scripts
- `alarms` - Scheduled tasks
- `sidePanel` - Side panel UI

## License

MIT
