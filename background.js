chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCsrfToken") {
    chrome.cookies.get(
      { url: "https://www.linkedin.com", name: "JSESSIONID" },
      (cookie) => {
        if (cookie) {
          // The cookie value might include quotes; remove them if necessary.
          let csrfToken = cookie.value.replace(/"/g, "");
          sendResponse({ csrfToken });
        } else {
          sendResponse({ csrfToken: null });
        }
      }
    );
    // Return true to indicate asynchronous response.
    return true;
  }
});
