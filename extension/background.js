chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;
  if (!chrome.sidePanel?.open) return;
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onInstalled.addListener(() => {
  if (!chrome.sidePanel?.setPanelBehavior) return;
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
