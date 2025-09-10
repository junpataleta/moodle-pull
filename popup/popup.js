const pullBranches = [];
let pullFromRepository = '';
let config = [];

chrome.runtime.onMessage.addListener(links => {
    // Reverse the links so main comes first, then latest stable down to oldest.
    links.reverse();
    for (const index in links) {
        const dummy = document.createElement('div');
        dummy.innerHTML = links[index];
        const container = dummy.children;
        const fieldLabel = container[0].innerText;
        let fieldValue;
        // Skip non-Pull X.Y... fields.
        if (fieldLabel.indexOf('Pull') === -1) {
            continue;
        }
        // We don't need the Pull Diff URL.
        if (fieldLabel.indexOf('Diff URL') >= 0) {
            continue;
        }
        if (fieldLabel.indexOf('from Repository') >= 0) {
            fieldValue = container[1].querySelector('a');
            pullFromRepository = fieldValue.getAttribute('href');
            // Make sure GitHub repository URLs are not using the unauthenticated git protocol.
            pullFromRepository = pullFromRepository.replace("git://github.com", "https://github.com");
        } else {
            fieldValue = container[1].innerText;
            const parts = fieldLabel.trim().split(" ");
            let version = null;
            for (const i in parts) {
                if (parts[i].length === 0 || parts[i] === 'Pull' || parts[i] === 'Branch') {
                    continue;
                }
                version = parts[i].toLowerCase();
                if (version !== 'main') {
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
                const trimmedValue = fieldValue.trim();
                if (trimmedValue.length === 0 || trimmedValue === 'None') {
                    continue
                }
                pullBranches[version] = trimmedValue;
                const branch = getMoodleBranch(version);

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

    // Enable Pull all and Push buttons if there are command buttons.
    if (pullBranches.length > 0) {
        document.getElementById('bulkCommands').removeAttribute('hidden');
    }
});

const getMoodleBranch = (version) => {
    if (version === 'main') {
        return version;
    } else {
        return `MOODLE_${version}_STABLE`;
    }
}

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
    button.dataset.type = 'command';
    button.innerText = version;
    return button;
};

/**
 * Generate the command to be copied to the clipboard.
 *
 * @param button
 * @return {string}
 */
const generatePullCommand = button => {
    const version = button.dataset.version;
    const branch = button.dataset.branch;
    const commandType = parseInt(button.closest('[data-action]').dataset.type);
    const commandAction = parseInt(button.closest('[data-action]').dataset.action);

    const commandConfig = config[commandAction];
    if (commandConfig) {
        // Use the dynamically loaded command from config.
        return commandConfig.command
            .replaceAll("{{BRANCH}}", branch)
            .replaceAll("{{PULL_REPOSITORY}}", pullFromRepository)
            .replaceAll("{{PULL_BRANCH}}", pullBranches[version]);
    }
    console.error(`Configuration not found for action ${commandType}`);
    return '';
}

const copyToClipboard = (command, tooltipTarget, successMessage) => {
    navigator.clipboard.writeText(command).then(() => {
        console.log("Git pull command '" + command + "' has been copied to the clipboard.");

        // Change button text to indicate the command has been copied.
        const tooltip = new bootstrap.Tooltip(tooltipTarget, {
            title: successMessage,
            trigger: "manual",
        });
        tooltip.show();
    }).catch().finally(() => {
        // Delay by half a second before closing the popup.
        setTimeout(window.close, 500);
    });
}

/**
 * Generate the table based on the configuration data and append it to the popup.
 */
function generateTable() {
    const tableBody = document.getElementById('pull-table-body');

    // Loop through the configuration and create table rows
    for (let key in config) {
        const row = document.createElement('tr');
        const titleCell = document.createElement('th');
        titleCell.classList.add('fw-normal');
        titleCell.textContent = config[key].title;
        const actionCell = document.createElement('td');
        actionCell.setAttribute('data-action', key);
        actionCell.setAttribute('data-type', config[key].type);
        row.appendChild(titleCell);
        row.appendChild(actionCell);

        // Append the row to the table body
        tableBody.appendChild(row);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['config'], function(data) {
        config = data.config || defaultConfig;

        // Use the configuration data to generate the table.
        generateTable();
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
        const commandButton = e.target.closest('button[data-type="command"]');
        if (commandButton) {
            const command = generatePullCommand(commandButton);
            if (command) {
                copyToClipboard(command, commandButton, `Copied for ${commandButton.dataset.version}`);
            }
        }

        // Generate the pull command for all branches and copy to the clipboard.
        const btnPullAll = e.target.closest('#pullAll');
        if (btnPullAll) {
            const buttons = document.querySelectorAll('td[data-type="pull"] button[data-type="command"]');
            const pullCommands = [];
            buttons.forEach(button => {
                const command = generatePullCommand(button);
                if (command) {
                    pullCommands.push(command);
                }
            });
            copyToClipboard(pullCommands.join(" && "), btnPullAll, `Pull commands copied for all branches!`);
        }

        // Generate the push command and copy to the clipboard.
        const btnPush = e.target.closest('#pushCommand');
        if (btnPush) {
            const pushBranches = [];
            Object.keys(pullBranches).forEach(version => {
                pushBranches.push(getMoodleBranch(version));
            })
            copyToClipboard(`git push origin ${pushBranches.join(" ")}`, btnPush, `Push command copied!`);
        }
    });
});
