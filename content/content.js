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

var MAX_RETRIES = 20;
var TIME_TO_FIRST_CHECK = 500;
var TIME_BETWEEN_CHECKS = 500;
var INIT_TIMEOUTS = [0.25, 0.25, 0.5, 1, 1, 2, 3, 5];

var activeStatus;
var displayMenu = 'false';  // Start with 'false' so that on page load, menu will be displayed if displayMenu is actually 'true'
var email;

// Set to true when user clicks on Bcc Me menu
var showingMenuItems = false;

function findBcc() {
    if (activeStatus === 'active' && email) {
        var bccBox = $('textarea[name="bcc"]');
        if (bccBox.length > 0) {
            var focusedElem = document.activeElement;
            // Only populate if Bcc box not already in focus (otherwise, it can become very hard to edit)
            if (focusedElem !== bccBox.get(0)) {
                populateBccBox(bccBox, email);
            }
            focusedElem.focus();
        }
    }
    setTimeout(findBcc, TIME_BETWEEN_CHECKS);
}

function populateBccBox(bccBox, email) {
    // If Bcc box is not visible, then simulate click to make it so
    if (!bccBox.is(':visible')) {
        $('span:contains("Add Bcc")').click();
    }

    // Add email to Bcc box, if not already in there
    var bccElement = bccBox.get(0);
    if (bccElement.value) {
        if (bccElement.value.indexOf(email) === -1) {
            bccElement.value += ', ' + email;
        }
    } else {
        bccElement.value = email;
    }
}

function toggleActiveStatus() {
    chrome.extension.sendMessage({command: 'setOptions', options: {activeStatus: (activeStatus === 'active' ? 'inactive' : 'active')}});
}

function setDisplayMenuOff() {
    chrome.extension.sendMessage({command: 'setOptions', options: {displayMenu: 'false'}});
}

function openOptionsPage() {
    chrome.extension.sendMessage({command: 'openOptionsPage'});
}

function htmlEncode(value) {
    return $('<div/>').text(value).html();
}

function getActiveStatusMenuItemText() {
    if (email) {
        return activeStatus === 'active' ? 'Status: <strong>Working</strong> <em>(click to pause)</em>' : 'Status: <strong>Paused</strong> <em>(click to unpause)</em>';
    } else {
        return 'Status: <strong>Bcc email not set</strong>';
    }
}

function getEmailMenuItemText() {
    if (email) {
        return 'Bcc: <strong>' + htmlEncode(email) + '</strong> <em>(click to change)</em>';
    } else {
        return 'Bcc: <strong>Not set</strong> <em>(click to set)</em>';
    }
}

function toggleMenuItems(e) {
    showingMenuItems = !showingMenuItems;
    if (showingMenuItems) {
        $('#abcc_menu').addClass('on');
        $('#abcc_menuLink').addClass('on').after('\
            <div id="abcc_menuDropdown">	\
                <ol id="abcc_menuDropdownList">	\
                    <li><a class="abcc_menuItem" id="item_activeInactive">' + getActiveStatusMenuItemText() + '</a></li>	\
                    <li><a class="abcc_menuItem" id="item_email">' + getEmailMenuItemText() + '</a></li>	\
                    <li><a class="abcc_menuItem" id="item_options">Options</a></li>	\
                    <li><a class="abcc_menuItem" id="item_hideMenu">Hide This Menu</a></li>	\
                </ol>	\
            </div>');
        $('#abcc_menuTriangle').addClass('on');
        $('#item_activeInactive').click(toggleActiveStatus);
        $('#item_email').click(openOptionsPage);
        $('#item_options').click(openOptionsPage);
        $('#item_hideMenu').click(setDisplayMenuOff);
    } else {
        hideMenuItems();
    }
    e.stopPropagation();
}

function hideMenuItems() {
    showingMenuItems = false;
    $('#abcc_menu').removeClass('on');
    $('#abcc_menuLink').removeClass('on');
    $('#abcc_menuDropdown').remove();
    $('#abcc_menuTriangle').removeClass('on');
}

function showMenu(retries) {
    var more = $('li > a > span > span:contains("More")').parent().parent().parent();
    if (more.length > 0) {
        more.after('\
            <li id="abcc_menu">	\
                <span id="abcc_menuLink">	\
                    <span>Bcc Me</span>	\
                    <span id="abcc_menuTriangle"></span>	\
                </span>	\
            </li>');
        $('#abcc_menuLink').click(toggleMenuItems);
        $('body').click(hideMenuItems);
    } else {
        if (retries < MAX_RETRIES) {
            setTimeout(showMenu, 200, retries+1);
        }
    }
}

function hideMenu() {
    $('#abcc_menu').remove();
    $('body').unbind('click', hideMenuItems);
}

function showOrHideMenu(oldValue, newValue) {
    if (oldValue !== newValue) {
        if (newValue === 'true') {
            //console.log('Bcc Me: Showing menu');
            showMenu(0);
        } else {
            //console.log('Bcc Me: Hiding menu');
            hideMenu();
        }
    } else {
        //console.log('Bcc Me: No change in menu visibility');
    }
}

function handleUpdatedOptions(options) {
    for (key in options) {
        handleUpdatedOption(key, options[key]);
    }
}

function handleUpdatedOption(option, value) {
    if (value === undefined) return;

    switch (option) {
    case 'activeStatus':
        //console.log('Bcc Me: Set activeStatus to "' + value + '" in content script');
        activeStatus = value;
        chrome.extension.sendMessage({command: 'setIcon'});
        $('#item_activeInactive').html(getActiveStatusMenuItemText());
        break;
    case 'displayMenu':
        //console.log('Bcc Me: Set displayMenu to "' + value + '" in content script');
        showOrHideMenu(displayMenu, value);
        displayMenu = value;
        break;
    case 'email':
        //console.log('Bcc Me: Set email to "' + value + '" in content script');
        email = value;
        $('#item_email').html(getEmailMenuItemText());
        // email setting will affect what active status gets displayed 
        $('#item_activeInactive').html(getActiveStatusMenuItemText());
        break;
    }
}

$(document).ready(function() {
    checkInit(0);
});


function checkInit(timeoutIndex) {
    /*
    For a given tab, this script is inserted into every document (the main window and all iframes).  It should
    only be initialized in one, though.  So how do we figure out which document to initialize in?  Well, there
    are two ways the main Gmail window is displayed:

        1. In top window (but only if it doesn't have an iframe named canvas_frame)
        2. In iframe named canvas_frame

    The tricky part is, sometimes, the top window will have an iframe named canvas_frame, so we might think it's
    case #2 and move on.  However, later, after Gmail has finally finished loading, the canvas_frame will
    disappear.  At that point, we realize it's case #1.

    This is how we check:

    if top window
        if canvas frame exists, then check again later to make sure it's still there
        if canvas frame does not exist, then init
    if iframe
        if canvas_frame, then init
        if other iframe, then quit trying
    */

    if (window === window.top) {
        if (document.getElementById('canvas_frame')) {
            // Check again later
            if (INIT_TIMEOUTS[timeoutIndex]) {
                //console.log('Check again in ' + INIT_TIMEOUTS[timeoutIndex] + ' seconds');
                setTimeout(checkInit, INIT_TIMEOUTS[timeoutIndex] * 1000, timeoutIndex+1);
            }
        } else {
            // Case #1
            //console.log('Initializing (in top window)');
            init();
        }
    } else {
        if (window.frameElement.id === 'canvas_frame') {
            // Case #2
            //console.log('Initializing (in iframe)');
            init();
        }
    }
}

function init() {
    // Initialize options to defaults, if not already set
    chrome.extension.sendMessage({ command: 'initOptions' }, function() {
        // When done initializing options, load and apply options
        chrome.extension.sendMessage({ command: 'getOptions' }, function(response) {
            handleUpdatedOptions(response.options);
        });
    });

    // Set up listener for updated options
    chrome.storage.onChanged.addListener(function(changes, areaName) {
        for (key in changes) {
            var storageChange = changes[key];
            if (storageChange.oldValue !== storageChange.newValue) {
                handleUpdatedOption(key, storageChange.newValue);
            }
        }
    });

    setTimeout(findBcc, TIME_TO_FIRST_CHECK);
}
