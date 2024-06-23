let tabHistory = [];
let currentIndex = -1;
let tabSwitcherWindowId = null;
let tabSwitcherTabId = null;

// Load tab history from storage on extension startup
chrome.storage.local.get(['tabHistory', 'currentIndex'], (result) => {
  if (result.tabHistory && result.currentIndex !== undefined) {
    tabHistory = result.tabHistory;
    currentIndex = result.currentIndex;
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  if (activeInfo.tabId !== tabSwitcherTabId) {
    tabHistory = tabHistory.filter(id => id !== activeInfo.tabId);
    tabHistory.push(activeInfo.tabId);
    currentIndex = tabHistory.length - 1;
    saveTabHistory();
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  let wasCurrentTab = tabId === tabHistory[currentIndex];
  tabHistory = tabHistory.filter(id => id !== tabId);
  if (currentIndex >= tabHistory.length) {
    currentIndex = tabHistory.length - 1;
  }
  if (tabId === tabSwitcherTabId) {
    tabSwitcherTabId = null;
  }
  saveTabHistory();
  if (wasCurrentTab && tabHistory.length > 0) {
    chrome.tabs.update(tabHistory[currentIndex], { active: true });
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "open-tab-switcher") {
    handleTabSwitcher();
  }
});

function saveTabHistory() {
  chrome.storage.local.set({ tabHistory, currentIndex });
}

function handleTabSwitcher() {
  if (tabSwitcherWindowId !== null) {
    chrome.windows.remove(tabSwitcherWindowId);
    tabSwitcherWindowId = null;
    tabSwitcherTabId = null;
    removeTabSwitcherFromHistory();
    return;
  }

  chrome.windows.getCurrent((window) => {
    const popupWidth = 600; // Adjust width as needed
    const popupHeight = 500;
    const left = Math.round(window.left + (window.width / 2) - (popupWidth / 2));
    const top = Math.round(window.top + (window.height / 2) - (popupHeight / 2));

    chrome.windows.create({
      url: "tab_switcher.html",
      type: "popup",
      width: popupWidth,
      height: popupHeight,
      top: top,
      left: left,
      focused: true
    }, (win) => {
      tabSwitcherWindowId = win.id;
      tabSwitcherTabId = win.tabs[0].id;
    });
  });
}

function removeTabSwitcherFromHistory() {
  chrome.history.search({ text: '', maxResults: 10 }, (results) => {
    results.forEach((page) => {
      if (page.url.includes('tab_switcher.html')) {
        chrome.history.deleteUrl({ url: page.url });
      }
    });
  });
}

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === tabSwitcherWindowId) {
    tabSwitcherWindowId = null;
    tabSwitcherTabId = null;
  }
});
