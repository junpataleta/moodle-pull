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
                        version = version.replace(".", "");
                    }
                }
                if (version !== null) {
                    pullBranches[version] = $(container[2]).text().trim();
                    let versionText = version;
                    if (version !== 'master') {
                        versionText = 'MOODLE_' + version + '_STABLE';
                    }
                    const buttonHtml = '<button class="btn btn-outline-secondary" id="copy-' + version +
                        '" data-version="' + version + '">' + versionText + '</button>';
                    const button = $(buttonHtml);
                    // Append this button to the form.
                    button.appendTo('#buttons-container');
                    // Add event listener to button.
                    button.click(function(e) {
                        e.preventDefault();
                        generatePullCommand(this);
                    });
                }
            }
        }
    }
});

function generatePullCommand(button) {
    const version = $(button).data('version');
    const branch = $(button).text();
    const commandType = parseInt(document.getElementById('command-type').value);
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
        // Change button text to indicate the command has been copied.
        $(button).text(`Copied for ${version}!`);
        console.log("Git pull command '" + result + "' has been copied to the clipboard.");
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
                chrome.tabs.executeScript(
                    activeTabs[0].id, {file: 'send_links.js', allFrames: true});
            });
    });
});
