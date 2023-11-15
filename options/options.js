document.addEventListener('DOMContentLoaded', function() {
    // Load saved configuration when the options page is opened.
    chrome.storage.sync.get(['config'], function(data) {
        // Populate your options page with the loaded configuration.
        populateOptions(data.config);
    });

    // Save button click event.
    document.querySelector('[data-action="save"]').addEventListener('click', function() {
        // Your save button logic here.
        const config = extractConfigFromPage();
        saveConfig(config);
        console.log('Configuration saved!');
    });
});

function populateOptions(config) {
    // Populate your options page with the configuration.
    const configTextarea = document.getElementById('configTextarea');
    configTextarea.value = JSON.stringify(config, null, 2);
}

function extractConfigFromPage() {
    // Extract the configuration from your options page.
    const configTextarea = document.getElementById('configTextarea');
    const enteredConfig = configTextarea.value.trim();

    try {
        // Parse the JSON, and handle potential errors.
        const parsedConfig = JSON.parse(enteredConfig);
        return parsedConfig;
    } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('Invalid JSON. Please enter a valid JSON configuration.');
        return [];
    }
}

function saveConfig(config) {
    // Save the configuration to chrome.storage.sync.
    chrome.storage.sync.set({'config': config}, function() {
        if (chrome.runtime.lastError) {
            console.error('Error saving configuration:', chrome.runtime.lastError);
        }
    });
}

