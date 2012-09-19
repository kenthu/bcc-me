var MAX_RETRIES = 20;
var TIME_TO_FIRST_CHECK = 500;
var TIME_BETWEEN_CHECKS = 1500;

var activeStatus;
var displayMenu = 'false';  // Start with 'false' so that on page load, menu will be displayed if displayMenu is actually 'true'
var email;

// Set to true when user clicks on AlwaysBcc menu
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
    chrome.extension.sendRequest({command: 'setOptions', options: {activeStatus: (activeStatus === 'active' ? 'inactive' : 'active')}});
}

function setDisplayMenuOff() {
    chrome.extension.sendRequest({command: 'setOptions', options: {displayMenu: 'false'}});
}

function openOptionsPage() {
    chrome.extension.sendRequest({command: 'openOptionsPage'});
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
                    <span>AlwaysBcc</span>	\
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
            //console.log('AlwaysBcc: Showing menu');
            showMenu(0);
        } else {
            //console.log('AlwaysBcc: Hiding menu');
            hideMenu();
        }
    } else {
        //console.log('AlwaysBcc: No change in menu visibility');
    }
}

function handleUpdatedOptions(options) {
    if (options['activeStatus'] !== undefined) {
        //console.log('AlwaysBcc: Set activeStatus to "' + options['activeStatus'] + '" in content script');
        activeStatus = options['activeStatus'];
        chrome.extension.sendRequest({command: 'setIcon'});
        $('#item_activeInactive').html(getActiveStatusMenuItemText());
    }
    if (options['displayMenu'] !== undefined) {
        //console.log('AlwaysBcc: Set displayMenu to "' + options['displayMenu'] + '" in content script');
        showOrHideMenu(displayMenu, options['displayMenu']);
        displayMenu = options['displayMenu'];
    }
    if (options['email'] !== undefined) {
        //console.log('AlwaysBcc: Set email to "' + options['email'] + '" in content script');
        email = options['email'];
        $('#item_email').html(getEmailMenuItemText());
        // email setting will affect what active status gets displayed 
        $('#item_activeInactive').html(getActiveStatusMenuItemText());
    }
}

$(document).ready(function() {
    if (window != window.top && window.frameElement.id == 'canvas_frame') {
        // Initialize options to defaults, if not already set
        chrome.extension.sendRequest({command: 'initOptions'});

        // Register tab
        chrome.extension.sendRequest({command: 'registerTab'});

        // Set up handler to unregister tab when tab closes
        window.onbeforeunload = function() {
            chrome.extension.sendRequest({command: 'unregisterTab'});
        };

        // Load and apply options
        chrome.extension.sendRequest({command: 'getOptions'}, function(response) {
            handleUpdatedOptions(response.options);
        });

        // Set up handlers for updated options and statuses
        chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
            if (request.command === 'handleUpdatedOptions') {
                handleUpdatedOptions(request.options);
            } else {
                console.error('AlwaysBcc: Invalid command sent to content script: ' + request.command);
            }
        });

        setTimeout(findBcc, TIME_TO_FIRST_CHECK);
    }
});
