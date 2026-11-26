// Use the promise-based `browser` namespace in Firefox and fall back to `chrome` in Chromium browsers.
const api = globalThis.browser ?? globalThis.chrome;

let currentConfig = '';
let currentPushRemote = defaultPushRemote;

document.addEventListener('DOMContentLoaded', function() {
    // Show the default configuration.
    const defaultConfigTextContainer = document.getElementById('defaultConfigText');
    defaultConfigTextContainer.innerText = JSON.stringify(defaultConfig, null, 2);

    // Load saved configuration when the options page is opened.
    api.storage.sync.get(['config', 'pushRemote']).then(data => {
        currentPushRemote = typeof data.pushRemote === 'string' && isValidRemoteName(data.pushRemote)
            ? data.pushRemote : defaultPushRemote;
        document.getElementById('pushRemote').value = currentPushRemote;

        // Populate your options page with the loaded configuration.
        currentConfig = data.config || [];
        if (currentConfig.length === 0) {
            // Use default configuration if none is saved.
            currentConfig = defaultConfig;
        }
        populateOptions(currentConfig);
    }).catch(error => {
        console.error('Error loading configuration:', error);
        document.getElementById('pushRemote').value = currentPushRemote;
        currentConfig = defaultConfig;
        populateOptions(currentConfig);
    });

    // Save button click event.
    document.querySelector('[data-action="save"]').addEventListener('click', function() {
        const pushRemote = extractPushRemoteFromPage();
        if (pushRemote === null) {
            document.getElementById('pushRemote').focus();
            return;
        }

        const config = extractConfigFromPage();

        if (!validateConfig(config)) {
            // Show an error message if the configuration is invalid.
            alert('Invalid configuration. Check the console for details. Changes discarded...');
            populateOptions(currentConfig);
        } else if (JSON.stringify(config) !== JSON.stringify(currentConfig) || pushRemote !== currentPushRemote) {
            // Save if there are changes.
            saveConfig(config, pushRemote);
        }
    });

    // Copy the default configuration to clipboard.
    document.getElementById('copyToClipboard').addEventListener('click', function() {
        const button = this;
        // Copy the configuration to the clipboard.
        navigator.clipboard.writeText(defaultConfigTextContainer.innerText).then(() => {
            // Change button text to indicate the command has been copied.
            button.innerText = "Copied!";
        }).catch();
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
        return JSON.parse(enteredConfig);
    } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('Invalid JSON. Please enter a valid JSON configuration.');
        return currentConfig;
    }
}

function validateConfig(config) {
    // Validate configuration.
    if (!config) {
        console.error('Invalid configuration:', config);
        return false;
    } else if (!Array.isArray(config)) {
        console.error('Invalid configuration. Expected an array:', config);
        return false;
    } else if (config.length === 0) {
        console.error('Invalid configuration. Expected a non-empty array:', config);
        return false;
    }
    return true;
}

/**
 * Read and validate the push remote, showing an error next to the field if it is invalid.
 *
 * @returns {string|null} The push remote, or null if it is invalid.
 */
function extractPushRemoteFromPage() {
    const input = document.getElementById('pushRemote');
    const error = document.getElementById('pushRemoteError');
    const pushRemote = input.value.trim() || defaultPushRemote;
    const isValid = isValidRemoteName(pushRemote);

    input.value = pushRemote;
    input.classList.toggle('is-invalid', !isValid);
    input.setAttribute('aria-invalid', String(!isValid));
    error.textContent = isValid ? '' : 'Enter a remote name using only letters, numbers, ".", "_", "-" or "/".';
    return isValid ? pushRemote : null;
}

function saveConfig(config, pushRemote) {
    // Only save the settings that changed, so that saving the push remote alone doesn't store a copy of the default
    // commands, which would stop future changes to the defaults from applying.
    const changes = {};
    if (JSON.stringify(config) !== JSON.stringify(currentConfig)) {
        changes.config = config;
    }
    if (pushRemote !== currentPushRemote) {
        changes.pushRemote = pushRemote;
    }
    currentConfig = config;
    currentPushRemote = pushRemote;
    // Save the configuration to the synced extension storage.
    api.storage.sync.set(changes).then(() => {
        // Show a success message.
        new bootstrap.Toast(document.getElementById('successToast')).show();
    }).catch(error => {
        console.error('Error saving configuration:', error);
    });
}
