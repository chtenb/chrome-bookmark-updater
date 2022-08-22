// Initialize button with user's preferred color
let changeColor = document.getElementById("changeColor");
let clear = document.getElementById("clear");

chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.backgroundColor = color;
});

clear.addEventListener("click", async () => {
  chrome.storage.sync.clear();
});

// When the button is clicked, inject setPageBackgroundColor into current page
changeColor.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.query({ active: true }, function (tabs) {
    console.log(tabs[0]);
    // FIXME: why is the url property sometimes not present?
    let pageUrl = new URL(tabs[0].url);
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
