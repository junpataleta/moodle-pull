chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install' || details.reason === 'update') {
        // Extension was either installed or updated.
        chrome.storage.sync.get(['config'], function(data) {
            const config = data.config || getDefaultConfig();

            chrome.storage.sync.set({'config': config}, function () {
                if (chrome.runtime.lastError) {
                    console.error('Error setting default configuration:', chrome.runtime.lastError);
                } else {
                    console.log('Default configuration set!');
                }
            });
        });
    }
});

function getDefaultConfig() {
    // Return your default configuration.
    return [
        {
            "title": "Pull",
            "command": "git checkout {{BRANCH}} && git pull {{PULL_REPOSITORY}} {{PULL_BRANCH}}"
        },
        {
            "title": "Pull only (no checkout)",
            "command": "git pull {{PULL_REPOSITORY}} {{PULL_BRANCH}}"
        },
        {
            "title": "Fetch",
            "command": "git fetch {{PULL_REPOSITORY}} {{PULL_BRANCH}}"
        },
        {
            "title": "Repo + branch only",
            "command": "{{PULL_REPOSITORY}} {{PULL_BRANCH}}"
        }
    ];
}

