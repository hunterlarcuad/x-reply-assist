import { waitForSelector, simulateTyping, randomSleep } from './utils.js';

// Selectors
const SELECTORS = {
  TWEET_TEXT: '[data-testid="tweetText"]',
  REPLY_BOX: '[data-testid="tweetTextarea_0"]',
  TOOLBAR: '[data-testid="toolBar"]',
  REPLY_BUTTON: '[data-testid="tweetButtonInline"]', // The actual reply button
};

export class TwitterHandler {
  constructor() {
    this.observer = null;
    this.init();
  }

  init() {
    console.log('AssistX: Twitter Handler Initialized');
    this.observePage();
  }

  observePage() {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          this.checkForReplyBox();
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Initial check
    this.checkForReplyBox();
  }

  checkForReplyBox() {
    // Find all reply boxes (there might be multiple if multiple tweets are expanded, but usually one main one or modal)
    // We look for the toolbar to inject our button
    const toolbars = document.querySelectorAll(SELECTORS.TOOLBAR);
    
    toolbars.forEach(toolbar => {
      if (toolbar.dataset.assistxInjected) return;
      
      // Check if this toolbar belongs to a reply box context
      // The toolbar is usually inside a parent that also contains the text area
      // We can try to find the textarea relative to this toolbar
      // Go up a few levels
      const composer = toolbar.closest('[data-testid="tweetTextarea_0_label"]') || toolbar.closest('.public-DraftEditor-content') ? null : toolbar.parentElement.parentElement; 
      // The structure is complex. Let's look for the textarea directly and then find its associated toolbar.
    });

    // Better approach: Find the textarea, then find the toolbar associated with it.
    const textareas = document.querySelectorAll(SELECTORS.REPLY_BOX);
    textareas.forEach(textarea => {
      // The textarea is a contenteditable div.
      // We need to find the toolbar. It's usually a sibling of the container holding the textarea, or close by.
      // Structure:
      // div (cellInnerDiv)
      //   div (composer)
      //     div (input area)
      //     div (toolbar) -> data-testid="toolBar"
      
      // Go up to find the common container
      const composer = textarea.closest('[class*="r-"]'); // This is too generic.
      
      // Let's try to find the toolbar within the same major container
      // If we are in a modal or inline reply
      
      // Let's just query all toolbars and see if they are near a reply box.
      // Actually, injecting into the toolbar is the standard way.
      // data-testid="toolBar" contains the image upload, gif, poll buttons etc.
    });
    
    const toolbars2 = document.querySelectorAll('[data-testid="toolBar"]');
    toolbars2.forEach(toolbar => {
        if (toolbar.dataset.assistxInjected) return;
        
        // Create our button
        const btn = this.createButton();
        
        // Insert it. Usually the toolbar has a left group and right group.
        // We want to add it to the left group (where image/gif icons are).
        // The toolbar usually has 2 direct children divs. Left and Right.
        if (toolbar.children.length >= 2) {
            const leftGroup = toolbar.children[0];
            leftGroup.appendChild(btn);
            toolbar.dataset.assistxInjected = 'true';
            
            // Attach click handler
            btn.addEventListener('click', (e) => this.handleButtonClick(e, toolbar));
        }
    });
  }

  createButton() {
    const div = document.createElement('div');
    div.className = 'css-175oi2r r-18jsvk2 r-1777fci r-1plcrui r-xtis37'; // Mimic Twitter button styles roughly
    div.style.display = 'inline-flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.marginLeft = '8px';
    div.style.cursor = 'pointer';
    div.style.width = '34px';
    div.style.height = '34px';
    div.style.borderRadius = '9999px';
    div.style.transition = 'background-color 0.2s';
    div.title = 'Smart Reply (AssistX)';
    
    div.onmouseover = () => div.style.backgroundColor = 'rgba(29, 161, 242, 0.1)';
    div.onmouseout = () => div.style.backgroundColor = 'transparent';

    // Icon (Magic Wand or similar)
    div.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1xvli5t r-1hdv0qi" style="color: #1d9bf0; width: 20px; height: 20px;">
        <g><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"></path></g> 
        <!-- Placeholder icon, let's use a simple 'AI' text or similar if SVG is complex. Using a generic graph icon above. -->
      </svg>
      <span style="font-size: 10px; font-weight: bold; color: #1d9bf0; position: absolute;">AI</span>
    `;
    
    return div;
  }

  async handleButtonClick(e, toolbar) {
    e.preventDefault();
    e.stopPropagation();
    
    // 1. Find the tweet text
    // If this is a reply modal, the tweet text is in the modal above.
    // If this is an inline reply, the tweet text is in the article above.
    
    let tweetText = '';
    
    // Try to find the closest article
    // The toolbar is in the reply area. The tweet we are replying to is usually structurally previous to the reply area.
    
    // Case 1: Modal
    const modal = toolbar.closest('[data-testid="modal"]');
    if (modal) {
        const tweetTextNode = modal.querySelector('[data-testid="tweetText"]');
        if (tweetTextNode) tweetText = tweetTextNode.innerText;
    } else {
        // Case 2: Inline
        // Go up to the cellInnerDiv
        const cell = toolbar.closest('[data-testid="cellInnerDiv"]');
        if (cell) {
            // In inline reply, the original tweet is usually in a previous sibling cell or the same cell structure is different.
            // Actually, usually when you click reply, a new cell opens or you are on the status page.
            
            // If we are on a status page ( /username/status/12345 ), the main tweet is the one with data-testid="tweetText" that is NOT a reply.
            // But there might be many.
            
            // Let's assume the user is looking at the main tweet.
            // A simple heuristic: Find the tweet text that is closest to the top of the viewport or the main one.
            
            // Better: Find the article that contains the "Replying to @..." text?
            
            // Let's try to find the closest [data-testid="tweet"] before this toolbar.
            // This is hard because DOM structure is flat lists of cells.
            
            // Fallback: Get the text of the main tweet on the page (usually the first one or the one with largest font).
            const texts = document.querySelectorAll('[data-testid="tweetText"]');
            if (texts.length > 0) {
                // If on status page, the main tweet is usually the one with a larger font size or specific class.
                // For now, let's just grab the first one visible or the one immediately preceding.
                tweetText = texts[0].innerText; // Naive but often works for the main tweet
            }
        }
    }

    if (!tweetText) {
        alert('Could not find tweet text to reply to.');
        return;
    }

    console.log('Generating reply for:', tweetText);
    
    // Show loading state on button
    const btn = e.currentTarget;
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<span style="font-size:10px">...</span>';
    
    try {
        // 2. Call Background
        const response = await chrome.runtime.sendMessage({
            type: 'generate_reply',
            tweetText: tweetText
        });
        
        console.log('Received response from background:', response);
        
        if (response && response.success) {
            // 3. Insert Text
            console.log('Response success, finding textarea...');
            // Find the textarea associated with this toolbar
            // Go up from toolbar to find the common wrapper, then down to textarea
            // The textarea is usually [data-testid="tweetTextarea_0"]
            
            // We can search within the same composer container
            // The composer usually wraps both input and toolbar.
            const composer = toolbar.closest('.public-DraftEditor-content') ? null : toolbar.parentElement.parentElement.parentElement;
            // This traversal is brittle.
            
            // Alternative: document.activeElement might be the textarea if the user clicked our button? 
            // No, clicking our button steals focus.
            
            // Let's try to find the textarea that is a sibling/cousin
            // Common container: div[class="css-175oi2r r-14lw9ot r-184en5c"] (example)
            
            // Let's just find the closest [data-testid="tweetTextarea_0"]
            // Since we are in the toolbar, the textarea should be "nearby".
            // We can use a bounding rect check or just querySelectorAll and find the closest one.
            
            // Simplest: The textarea is usually in the DOM before the toolbar.
            // Let's traverse up to a common container that contains both.
            const commonContainer = toolbar.closest('[class*="r-"]'); // Generic
            const textarea = commonContainer ? commonContainer.querySelector('[data-testid="tweetTextarea_0"]') : document.querySelector('[data-testid="tweetTextarea_0"]');
            
            if (textarea) {
                console.log('Textarea found, simulating typing...');
                await simulateTyping(textarea, response.reply);
                console.log('Typing simulation complete.');
            } else {
                console.error('Textarea NOT found.');
                alert('Could not find text area to insert reply.');
            }
        } else {
            console.error('Background returned error:', response);
            alert('Failed to generate reply: ' + (response.error || 'Unknown error'));
        }
    } catch (err) {
        console.error(err);
        alert('Error: ' + err.message);
    } finally {
        btn.innerHTML = originalContent;
    }
  }
}
