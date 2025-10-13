// Figma Spacing Grid - Background Script

// Function to update the badge text based on the active state
function updateBadge() {
  chrome.storage.local.get('isActive', (data) => {
    const badgeText = data.isActive ? 'ON' : 'OFF';
    const badgeColor = data.isActive ? '#008000' : '#DC3545'; // Green for ON, Red for OFF
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  });
}

// Initialize on install - labels always on by default
chrome.runtime.onInstalled.addListener(() => {
  console.log('Figma Spacing Grid Extension installed!');

  chrome.storage.local.set({ isActive: false }, () => {
    updateBadge();
  });

  chrome.storage.sync.set({
    labelsAlwaysOn: true
  });
});

// Update badge when the extension starts
chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Handle extension icon click - toggle spacing grid
chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get('isActive', (data) => {
    const newState = !data.isActive;
    chrome.storage.local.set({ isActive: newState }, () => {
      updateBadge();

      // Send message to content script to toggle
      chrome.tabs.sendMessage(tab.id, { action: 'toggle', isActive: newState }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
        }
      });
    });
  });
});
