const pullBranches = [];
let pullFromRepository = '';

chrome.runtime.onMessage.addListener(links => {
    // Reverse the links so master comes first, then latest stable down to oldest.
    links.reverse();
    for (const index in links) {
        const dummy = document.createElement('div');
        dummy.innerHTML = links[index];
        const container = dummy.children;
        const fieldLabel = container[0].innerText;
        const fieldValue = container[1].innerText;
        // Skip non-Pull X.Y... fields.
        if (fieldLabel.indexOf('Pull') === -1) {
            continue;
        }
        // We don't need the Pull Diff URL.
        if (fieldLabel.indexOf('Diff URL') >= 0) {
            continue;
        }
        if (fieldLabel.indexOf('from Repository') >= 0) {
            pullFromRepository = fieldValue.trim();
            // Make sure GitHub repository URLs are not using the unauthenticated git protocol.
            pullFromRepository = pullFromRepository.replace("git://github.com", "https://github.com");
        } else {
            const parts = fieldLabel.trim().split(" ");
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
                pullBranches[version] = fieldValue.trim();
                const branch = version === 'master' ? 'master' : 'MOODLE_' + version + '_STABLE'

                // Append this button to the form.
                const actionCells = document.querySelectorAll('#pull-form [data-copytype]');
                for (let i = 0; i < actionCells.length; i++) {
                    const cell = actionCells[i];
                    // Create the copy button.
                    const button = document.createElement('button');
                    button.className = "btn btn-outline-secondary m-1";
                    button.dataset.version = version;
                    button.dataset.branch = branch;
                    button.innerText = version;
                    // Append to the cell.
                    cell.append(button);
                }
            }
        }
    }
});

const generatePullCommand = button => {
    const version = button.dataset.version;
    const branch = button.dataset.branch;
    const commandType = parseInt(button.closest('[data-copytype]').dataset.copytype);
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
        // Delay by half a second before closing the popup.
        setTimeout(window.close, 500);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    chrome.windows.getCurrent(currentWindow => {
        chrome.tabs.query({active: true, windowId: currentWindow.id},
            activeTabs => {
                chrome.scripting.executeScript({
                    target: {tabId: activeTabs[0].id, allFrames: true},
                    files: ['scripts/send_links.js']
                });
            }
        );
    });

    // Add event listener to copy buttons.
    document.addEventListener('click', e => {
        const button = e.target.closest('button');
        e.preventDefault();
        if (button) {
            generatePullCommand(button);
        }
    });
});
