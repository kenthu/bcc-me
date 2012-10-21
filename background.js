/*
Copyright 2012 Kent Hu

Bcc Me for Gmail is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Bcc Me for Gmail is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Bcc Me for Gmail.  If not, see <http://www.gnu.org/licenses/>.
*/

// Object to control extension options
var options = {
    // Mapping of option names to their default values.  Values are strings because we used to store options in
    // localStorage, before chrome.storage became available.
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
    init: function(callback) {
        var self = this;
        this.getAll(function(allOptions) {
            var optionsToSet = {};
            for (var option in self.defaults) {
                if (!(self.isValid(option, allOptions[option]))) {
                    optionsToSet[option] = self.defaults[option];
                }
            }
            chrome.storage.local.set(optionsToSet, callback);
        });
    },

    get: function(option, callback) {
        if (option in this.defaults) {
            chrome.storage.local.get(option, function(items) {
                callback(items[option]);
            });
        }
    },

    getAll: function(callback) {
        chrome.storage.local.get(Object.keys(this.defaults), function(items) {
            callback({
                activeStatus: items.activeStatus,
                displayMenu: items.displayMenu,
                email: items.email
            });
        });
    },

    // callback function is optional
    set: function(optionsToSet, callback) {
        var validatedOptions = {};
        for (var option in optionsToSet) {
            if (this.isValid(option, optionsToSet[option])) {
                validatedOptions[option] = optionsToSet[option];
            }
        }
        chrome.storage.local.set(validatedOptions, function() {
            if (callback !== undefined) {
                callback();
            }
        });
    },

    // For dev only ...
    clear: function() {
        chrome.storage.local.remove(Object.keys(this.defaults));
    },

    // For dev only ...
    showAll: function() {
        this.getAll(function(allOptions) {
            console.log(allOptions);
        });
    }
};

// Based on Mohamed Mansour's code here:  http://stackoverflow.com/a/2401788/631303
var version = {
    // Other people seem to use chrome.app.getDetails().version, but that isn't currently a supported public
    // API.  Once there's something supported, we can stop putting the current version in multiple places.
    current: "0.1.2",

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
        getIconFilename(function(iconFilename) {
            chrome.pageAction.setIcon({ path: iconFilename, tabId: tabId });
        });
        chrome.pageAction.show(tabId);
    }
});

chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
    switch (message.command) {
    case 'getOptions':
        options.getAll(function(allOptions) {
            sendResponse({options: allOptions});
        });
        break;
    case 'setOptions':
        options.set(message.options, function() {
            sendResponse({status: 'done'});
        });
        break;
    case 'openOptionsPage':
        chrome.tabs.create({url: "options/options.html"});
        break;
    case 'setIcon':
        getIconFilename(function(iconFilename) {
            chrome.pageAction.setIcon({ path: iconFilename, tabId: sender.tab.id });
        });
        break;
    case 'initOptions':
        options.init(function() {
            // Send empty response so that dependent code can continue
            sendResponse({});
        });
        break;
    default:
        console.error('Bcc Me: Invalid command sent to background.js: ' + message.command);
    }
    return true;
});

function getIconFilename(callback) {
    options.get('activeStatus', function(activeStatus) {
        callback('icons/' + (activeStatus === 'active' ? 'pageAction_on.png' : 'pageAction_off.png'));
    });
}

chrome.pageAction.onClicked.addListener(function(tab) {
    options.get('activeStatus', function(activeStatus) {
        options.set({ activeStatus: activeStatus === 'active' ? 'inactive' : 'active' });
    });
});
