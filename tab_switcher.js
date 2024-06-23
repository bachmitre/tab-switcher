let tabsList = document.getElementById('tabs-list');
let tabHistory = [];
let tabSwitcherTabId = null;

chrome.storage.local.get(['tabHistory', 'tabSwitcherTabId'], (result) => {
  if (result.tabHistory) {
    tabHistory = result.tabHistory.filter(id => id !== result.tabSwitcherTabId);
    populateTabList();
  }
});

function populateTabList() {
  tabsList.innerHTML = '';
  let latestTabs = tabHistory.slice(-10); // Get the latest 10 tabs

  latestTabs.reverse().forEach((tabId, index) => {
    try {
      chrome.tabs.get(tabId, (tab) => {
        if (!tab) return; // Skip if tab information is not available

        let li = document.createElement('li');
        li.textContent = tab.title;

        // Add tab icon
        let img = document.createElement('img');
        img.src = tab.favIconUrl || '';
        img.width = 16;
        img.height = 16;
        li.prepend(img);

        li.dataset.tabId = tabId;
        tabsList.appendChild(li);

        // Pre-select the second item
        if (index === 1) {
          li.classList.add('selected');
        }
      });
    } catch (e) {
      console.log(e);
    }
  });
}

document.addEventListener('keydown', (event) => {
  let items = tabsList.querySelectorAll('li');
  let currentIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));
  if (event.key === 'ArrowDown' || event.key === 'z') {
    currentIndex = (currentIndex + 1) % items.length;
    updateSelection(items, currentIndex);
  } else if (event.key === 'ArrowUp') {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    updateSelection(items, currentIndex);
  } else if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    let selectedTabId = items[currentIndex].dataset.tabId;
    chrome.tabs.update(parseInt(selectedTabId), { active: true });
    window.close();
  }
});

function updateSelection(items, currentIndex) {
  items.forEach((item, index) => {
    if (index === currentIndex) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}
