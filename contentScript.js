var MAX_RETRIES = 20;
var TIME_TO_FIRST_CHECK = 500;
var TIME_BETWEEN_CHECKS = 1500;

var email;

function findBcc() {
    if (email && $('#pauseControl').is(':checked')) {
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

function setUpPauseControl(retries) {
    var more = $('li > a > span > span:contains("More")').parent().parent().parent();
    if (more.length > 0) {
        more.after('<div style="display: inline-block"><span id="alwaysBcc_control" title="' + makeControlTitle(email) + '">AlwaysBCC <input type="checkbox" id="pauseControl" checked="checked"></span></div>');
    } else {
        if (retries < MAX_RETRIES) {
            setTimeout(setUpPauseControl, 200, retries+1);
        }
    }
}

function makeControlTitle(email) {
    return 'When checked, your emails will automatically BCC\n' + email;
}

$(document).ready(function() {
    if (window != window.top && window.frameElement.id == 'canvas_frame') {
        chrome.extension.sendRequest({command: 'getEmail'}, function(response) {
            //console.log('AlwaysBCC: Got email from localStorage: ' + email);
            email = response.email;
        });

        // Set up listener to handle changes to option page
        chrome.extension.sendRequest({command: 'registerTab'});
        window.onbeforeunload = function() {
            chrome.extension.sendRequest({command: 'unregisterTab'});
        };
        chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
            if (request.command === 'setEmail') {
                //console.log('AlwaysBCC: Set email to "' + request.email + '" in content script');
                email = request.email;
                document.getElementById('alwaysBcc_control').title = makeControlTitle(email);
            }
        });

        setTimeout(findBcc, TIME_TO_FIRST_CHECK);
        setUpPauseControl(0);
    }
});
