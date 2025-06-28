// background.js

// ...existing code...

// Add error handling to any existing message sending
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // ...existing code...
  
  // When sending messages to tabs, wrap in try-catch
  if (request.action === 'someAction') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Message failed:', chrome.runtime.lastError.message);
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            sendResponse(response);
          }
        });
      }
    });
    return true; // Keep message channel open
  }
});