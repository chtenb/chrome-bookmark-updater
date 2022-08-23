// Initialize button with user's preferred color
let changeColor = document.getElementById("changeColor");
let clear = document.getElementById("clear");

chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.backgroundColor = color;
});

clear.addEventListener("click", async () => {
  chrome.storage.sync.clear();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  console.log("tab updated: ", tabId, changeInfo, tab);
  if (tab.title && changeInfo.url) {

    chrome.storage.sync.get("enabledDomains", ({ enabledDomains }) => {
      if (enabledDomains.includes(new URL(changeInfo.url).host)) {
        console.log("Extension enabled for current domain");
        chrome.bookmarks.search(
          { title: tab.title },
          (searchResults) => {
            searchResults.forEach(bookmark => {
              if (new URL(bookmark.url).host === new URL(changeInfo.url).host) {
                // Found a bookmark with the same title and domain as the current active tab
                // Update the bookmark to point to this page
                console.log(`Updating URL of bookmark ${bookmark.title} to ${changeInfo.url}. (Was ${bookmark.url})`);
                chrome.bookmarks.update(
                  bookmark.id,
                  { url: changeInfo.url }
                );
              }
            });
          });
      }
    });
  }
});

// When the button is clicked, inject setPageBackgroundColor into current page
changeColor.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.query({ active: true }, function (tabs) {
    console.log(tabs[0]);
    // FIXME: why is the url property sometimes not present?
    let pageUrl = new URL(tabs[0].url);
    if (!pageUrl) {
      console.log("URL of current page is not accessible");
    } else {
      let pageHost = pageUrl.host;
      console.log("current host: ", pageHost);
      chrome.storage.sync.get("enabledDomains", ({ enabledDomains }) => {
        console.log("current enabled domains: ", enabledDomains);
        if (!enabledDomains) {
          enabledDomains = [];
        }
        enabledDomains.push(pageHost);
        chrome.storage.sync.set({ enabledDomains: enabledDomains }, function (result) {
          console.log("enabled domains after push: ", enabledDomains);
        })
      });
    }
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: setPageBackgroundColor,
  });
});

// The body of this function will be executed as a content script inside the
// current page
function setPageBackgroundColor() {
  chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;
  });
}
