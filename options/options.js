// Restore options on page load
document.body.onload = function() {
    var email = localStorage['email'];
    if (email) {
        document.getElementById('email').value = email;
    }
    document.getElementById('email').focus();
};

// Save button: save options and close window
document.getElementById('saveButton').onclick = function() {
    var email = document.getElementById('email').value;
    localStorage['email'] = email;

    chrome.extension.sendRequest({command: 'getRegisteredTabs'}, function(response) {
        for (var tabID in response.registeredTabs) {
            //console.log('AlwaysBCC: Sending saved options to tab ' + tabID);
            chrome.tabs.sendRequest(parseInt(tabID), {command: 'setEmail', email: email});
        }
        window.close();
    });
};

// Cancel button: close window
document.getElementById('cancelButton').onclick = function() {
    window.close();
};
