document.body.onload = function() {
    // Initialize options to defaults, if not already set
    chrome.extension.sendMessage({command: 'initOptions'});

    // Save button: save options and close window
    document.getElementById('saveButton').onclick = function() {
        chrome.extension.sendMessage({command: 'setOptions', options: {
            email: document.getElementById('email').value
        }}, onSaved);
    };

    document.getElementById('email').focus();
};

function onSaved(response) {
    document.getElementById('saveConfirmation').style.display = "inline-block";
    setTimeout(function() {
        $('#saveConfirmation').fadeOut();
    }, 5000);
}
