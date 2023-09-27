const pullBranches = [];
let pullFromRepository = '';

chrome.runtime.onMessage.addListener(function(links) {
    // Reverse the links so master comes first, then latest stable down to oldest.
    links.reverse();
    for (const index in links) {
        const container = $(links[index]);
        if (container.text().indexOf('Pull') >= 0) {
            if (container.text().indexOf('Diff URL') >= 0) {
                continue;
            }
            if (container.text().indexOf('from Repository') >= 0) {
                pullFromRepository = $(container[2]).text().trim();
                // Make sure GitHub repository URLs are not using the unauthenticated git protocol.
                pullFromRepository = pullFromRepository.replace("git://github.com", "https://github.com");
            } else {
                const parts = $(container[0]).text().trim().split(" ");
                let version = null;
                for (const i in parts) {
                    if (parts[i].length > 0 && parts[i] !== 'Pull' && parts[i] !== 'Branch:') {
                        version = parts[i].toLowerCase();
                        if (version !== 'master') {
                            // Split version number.
                            const verParts = version.split(".");
                            if (verParts[0] >= 4) {
                                // Pre-pad decimal part with 0 and join for 4.0 and up.
                                version = verParts[0] + verParts[1].padStart(2, "0");
                            } else {
                                // Just combine the whole number and decimal part
                                version = verParts[0] + verParts[1];
                            }
                        }
                    }
                }
                if (version !== null) {
                    pullBranches[version] = $(container[2]).text().trim();
                    const branch = version === 'master' ? 'master' : 'MOODLE_' + version + '_STABLE'
                    const buttonHtml = `<button
                        class="btn btn-outline-secondary m-1"
                        id="copy-${version}"
                        data-version="${version}"
                        data-branch="${branch}"
                    >${version}</button>`;
                    const button = $(buttonHtml);
                    // Add event listener to button.
                    button.click(function(e) {
                        e.preventDefault();
                        generatePullCommand(this);
                    });
                    // Append this button to the form.
                    button.appendTo('#pull-form [data-action]');
                }
            }
        }
    }
});

function generatePullCommand(button) {
    const version = $(button).data('version');
    const branch = $(button).data('branch');
    const commandType = parseInt($(button).closest('[data-action]').data('action'));
    let result;
    switch (commandType) {
        case 1:
            result = `git fetch ${pullFromRepository} ${pullBranches[version]}`;
            break;
        case 2:
            result = `${pullFromRepository} ${pullBranches[version]}`
            break;
        case 3:
            result = `git pull ${pullFromRepository} ${pullBranches[version]}`;
            break;
        default:
            result = `git checkout ${branch} && git pull ${pullFromRepository} ${pullBranches[version]}`;
            break;
    }
    navigator.clipboard.writeText(result).then(() => {
        console.log("Git pull command '" + result + "' has been copied to the clipboard.");
        // Change button text to indicate the command has been copied.
        const tooltip = new bootstrap.Tooltip(button, {
            title: `Copied for ${version}!`,
            trigger: "manual",
        });
        tooltip.show();
    }).catch().finally(() => {
        // Delay by a quarter of a second before closing the popup.
        setTimeout(() => {
            window.close();
        }, 250);
    });
}

$(document).ready(function() {
    chrome.windows.getCurrent(function (currentWindow) {
        chrome.tabs.query({active: true, windowId: currentWindow.id},
            function(activeTabs) {
                chrome.scripting.executeScript({
                    target: {tabId: activeTabs[0].id, allFrames: true},
                    files: ['send_links.js']
                });
            }
        );
    });
});
