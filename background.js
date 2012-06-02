// Show "bcc" page action icon only for Gmail pages
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tab.url.indexOf('http://mail.google.com/') === 0 || tab.url.indexOf('https://mail.google.com/') === 0) {
        chrome.pageAction.show(tabId);
    }
});

// Hash table of IDs for every tab with Gmail
var tabs = {};

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    switch (request.command) {
    case 'getEmail':
        //console.log('AlwaysBCC: Returning email from options');
        sendResponse({email: localStorage['email']});
        break;
    case 'registerTab':
        //console.log('AlwaysBCC: Registering tab ' + String(sender.tab.id));
        tabs[sender.tab.id] = true;
        break;
    case 'unregisterTab':
        //console.log('AlwaysBCC: Unregistering tab ' + String(sender.tab.id));
        delete tabs[sender.tab.id];
        break;
    case 'getRegisteredTabs':
        //console.log('AlwaysBCC: Returning registered tabs');
        sendResponse({registeredTabs: tabs});
        break;
    }
});
