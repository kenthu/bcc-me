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

document.body.onload = function() {
    // Initialize options to defaults, if not already set
    chrome.extension.sendMessage({command: 'initOptions'}, getOptions);

    // Save button: save options and close window
    document.getElementById('saveButton').onclick = function() {
        chrome.extension.sendMessage({command: 'setOptions', options: {
            activeStatus: (document.getElementById('activeStatus_active').checked ? 'active' : 'inactive'),
            displayMenu: (document.getElementById('displayMenu').checked ? 'true' : 'false'),
            email: document.getElementById('email').value
        }});
        window.close();
    };

    // Cancel button: close window
    document.getElementById('cancelButton').onclick = function() {
        window.close();
    };
};

// Retrieve options
function getOptions(response) {
    chrome.extension.sendMessage({command: 'getOptions'}, loadOptions);
}

// Load options
function loadOptions(response) {
    if (response.options['activeStatus'] === 'active') {
        document.getElementById('activeStatus_active').checked = true;
    } else {
        document.getElementById('activeStatus_inactive').checked = true;
    }
    document.getElementById('displayMenu').checked = (response.options['displayMenu'] === 'true');
    document.getElementById('email').value = response.options['email'];

    document.getElementById('email').focus();
}
