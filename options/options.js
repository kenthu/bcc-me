// Restore options on page load
document.body.onload = function() {
    chrome.extension.sendRequest({command: 'getOptions'}, function(response) {
        document.getElementById('activeStatus').checked = (response.options['activeStatus'] === 'active');
        document.getElementById('displayMenu').checked = (response.options['displayMenu'] === 'true');
        document.getElementById('email').value = response.options['email'];

        document.getElementById('email').focus();
    });
};

// Save button: save options and close window
document.getElementById('saveButton').onclick = function() {
    chrome.extension.sendRequest({command: 'setOptions', options: {
        activeStatus: (document.getElementById('activeStatus').checked ? 'active' : 'inactive'),
        displayMenu: (document.getElementById('displayMenu').checked ? 'true' : 'false'),
        email: document.getElementById('email').value
    }});
    window.close();
};

// Cancel button: close window
document.getElementById('cancelButton').onclick = function() {
    window.close();
};
