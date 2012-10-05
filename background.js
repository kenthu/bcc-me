// Object that tracks tabIds for all Gmail tabs
var tabs = {
    hashTable: {},

    register: function(tabId) {
        this.hashTable[tabId] = true;
    },

    unregister: function(tabId) {
        delete this.hashTable[tabId];
    },

    // Return array of tabIds.  Guaranteed to only return tabId if it's a number.
    getTabs: function() {
        var tabArray = [];
        var tabId;
        for (var tabIdString in this.hashTable) {
            tabId = parseInt(tabIdString);
            if (!isNaN(tabId)) {
                tabArray.push(tabId);
            }
        }
        return tabArray;
    }
};

// Object to control extension options
var options = {
    // Mapping of option names to their default values (values must be strings, because that's what localStorage uses)
    defaults: {
        activeStatus: 'active',	// possible values: 'active', 'inactive'
        displayMenu: 'true',	// possible values: 'true', 'false'
        email: ''
    },

    isValid: function(option, value) {
        switch (option) {
        case 'activeStatus':
            return (value === 'active' || value === 'inactive');
            break;
        case 'displayMenu':
            return (value === 'true' || value === 'false');
            break;
        case 'email':
            return (typeof(value) === 'string');
            break;
        default:
            return false;
        }
    },

    // Set defaults on all invalid/undefined options, so we don't have to worry about undefineds
    init: function() {
        for (var option in this.defaults) {
            if (!(this.isValid(option, localStorage[option]))) {
                localStorage[option] = this.defaults[option];
            }
        }
    },

    get: function(option) {
        if (option in this.defaults) {
            return localStorage[option];
        }
    },

    getAll: function() {
        return {
            activeStatus: localStorage['activeStatus'],
            displayMenu: localStorage['displayMenu'],
            email: localStorage['email']
        }
    },

    set: function(optionsToSet, firstTabToApply) {
        var validatedOptions = {};
        for (var option in optionsToSet) {
            if (this.isValid(option, optionsToSet[option])) {
                localStorage[option] = optionsToSet[option];
                validatedOptions[option] = optionsToSet[option];
            }
        }
        this.propagate(firstTabToApply, validatedOptions);
    },

    // Propagate a setting change to all tabs
    propagate: function(firstTabToApply, optionsToSet) {
        // Handle this tab first
        chrome.tabs.sendRequest(firstTabToApply.id, {command: 'handleUpdatedOptions', options: optionsToSet});

        // Handle all other tabs
        var allTabs = tabs.getTabs();
        for (var i = 0; i < allTabs.length; i++) {
            var tabId = allTabs[i];
            if (tabId !== firstTabToApply.id) {
                chrome.tabs.sendRequest(tabId, {command: 'handleUpdatedOptions', options: optionsToSet});
            }
        }
    },

    // For testing only ...
    clear: function() {
        for (var option in this.defaults) {
            delete localStorage[option];
        }
    }
};

// Based on Mohamed Mansour's code here:  http://stackoverflow.com/a/2401788/631303
var version = {
    // Other people seem to use chrome.app.getDetails().version, but that isn't currently a supported public
    // API.  Once there's something supported, we can stop putting the current version in multiple places.
    current: "0.1",

    check: function() {
        // Check if the version has changed.
        var currVersion = this.current;
        var savedVersion = localStorage['version']
        if (currVersion !== savedVersion) {
            if (savedVersion === undefined) {
                this.onInstall();
            } else {
                this.onUpdate();
            }
            localStorage['version'] = currVersion;
        }
    },

    onInstall: function() {
        chrome.tabs.create({url: "help/gettingStarted.html"});
    },

    onUpdate: function() {
    }
}


options.init();

version.check();

// Show "bcc" page action icon for all Gmail pages
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tab.url.indexOf('http://mail.google.com/') === 0 || tab.url.indexOf('https://mail.google.com/') === 0) {
        chrome.pageAction.setIcon({path: getIconFilename(), tabId: tabId});
        chrome.pageAction.show(tabId);
    }
});

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    switch (request.command) {
    case 'registerTab':
        //console.log('AlwaysBcc: Registering tab ' + String(sender.tab.id));
        tabs.register(sender.tab.id);
        break;
    case 'unregisterTab':
        //console.log('AlwaysBcc: Unregistering tab ' + String(sender.tab.id));
        tabs.unregister(sender.tab.id);
        break;
    case 'getOptions':
        sendResponse({options: options.getAll()});
        break;
    case 'setOptions':
        options.set(request.options, sender.tab);
        sendResponse({status: 'done'});
        break;
    case 'openOptionsPage':
        chrome.tabs.create({url: "options/options.html"});
        break;
    case 'setIcon':
        chrome.pageAction.setIcon({path: getIconFilename(), tabId: sender.tab.id});
        break;
    case 'initOptions':
        options.init();
        // Send empty response so that options page can proceed
        sendResponse({});
        break;
    default:
        console.error('AlwaysBcc: Invalid command sent to background.js: ' + request.command);
    }
});

function getIconFilename() {
    return 'icons/' + (options.get('activeStatus') === 'active' ? 'bcc.png' : 'bccOff.png');
}

chrome.pageAction.onClicked.addListener(function(tab) {
    options.set({activeStatus: options.get('activeStatus') === 'active' ? 'inactive' : 'active'}, tab);
});
