const mainBranches = {
    main: 'main',
    master: 'master',
};

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
                if (parts[i].length === 0 || parts[i] === 'Pull' || parts[i] === 'Branch:') {
                    continue;
                }
                version = parts[i].toLowerCase();
                if (version === mainBranches.master) {
                    // If the tracker field still uses master, point this to main.
                    version = mainBranches.main;
                } else if (version !== mainBranches.main) {
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
            if (version !== null) {
                pullBranches[version] = fieldValue.trim();
                let branch;
                if (mainBranches.hasOwnProperty(version)) {
                    branch = version;
                } else {
                    branch = `MOODLE_${version}_STABLE`;
                }

                // Append this button to the form.
                const actionCells = document.querySelectorAll('#pull-form [data-action]');
                for (let i = 0; i < actionCells.length; i++) {
                    const cell = actionCells[i];
                    // Create the copy button.
                    const button = createCommandButton(branch, version);

                    // Append to the cell.
                    cell.append(button);
                }
            }
        }
    }
});

/**
 * Create a command button that will be appended to the popup later.
 *
 * @param branch
 * @param version
 * @returns {HTMLButtonElement}
 */
const createCommandButton = (branch, version) => {
    const button = document.createElement('button');
    button.className = "btn btn-outline-secondary m-1";
    button.type = 'button';
    button.dataset.version = version;
    button.dataset.branch = branch;
    button.innerText = version;
    return button;
};

/**
 * Generate the command to be copied to the clipboard.
 *
 * @param button
 */
const generatePullCommand = button => {
    const version = button.dataset.version;
    const branch = button.dataset.branch;
    const commandType = parseInt(button.closest('[data-action]').dataset.action);
    
    chrome.storage.sync.get(['config'], function(data) {
        const config = data.config || [];

        const commandConfig = config[commandType];
        if (commandConfig) {
            // Use the dynamically loaded command from config.
            const result = commandConfig.command
                .replaceAll("{{BRANCH}}", branch)
                .replaceAll("{{PULL_REPOSITORY}}", pullFromRepository)
                .replaceAll("{{PULL_BRANCH}}", pullBranches[version]);

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
        } else {
            console.error(`Configuration not found for action ${commandType}`);
        }
    });
}

/**
 * Generate the table based on the configuration data and append it to the popup.
 *
 * @param {Array<Object>} config - An array of objects representing the configuration data
 * where each object has two properties: `title` (string) and `command` (string).
 */
function generateTable(config) {
    const tableBody = document.getElementById('pull-table-body');

    // Loop through the configuration and create table rows
    for (key in config) {
        const row = document.createElement('tr');
        const titleCell = document.createElement('th');
        titleCell.classList.add('fw-normal');
        titleCell.textContent = config[key].title;
        const actionCell = document.createElement('td');
        actionCell.setAttribute('data-action', key);
        row.appendChild(titleCell);
        row.appendChild(actionCell);

        // Append the row to the table body
        tableBody.appendChild(row);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['config'], function(data) {
        const config = data.config || [];
        
        // Use the configuration data to generate the table.
        generateTable(config);
    });

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
