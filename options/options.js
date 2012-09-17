// Restore options on page load
document.body.onload = function() {
    document.getElementById('activeStatus').checked = (options.get('activeStatus') === 'active');
    document.getElementById('displayMenu').checked = (options.get('displayMenu') === 'true');
    document.getElementById('email').value = options.get('email');

    document.getElementById('email').focus();
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
