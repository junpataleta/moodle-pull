const pullBranches = {};
let pullFromRepository = '';
let config = [];

// Use the promise-based `browser` namespace in Firefox and fall back to `chrome` in Chromium browsers.
const api = globalThis.browser ?? globalThis.chrome;

const PLACEHOLDER_WORDS = [
    'None',
    'Add text',
    'Add URL',
];

/**
 * Runs in the context of the tracker page and returns the issue's custom fields.
 *
 * This function is serialised and injected into the page, so it must not reference anything outside its own scope.
 *
 * @returns {{label: string, value: string, href: (string|null)}[]}
 */
const extractTrackerFields = () => {
    const selector = '[data-testid$="details-group"] '
        + 'div[data-component-selector="jira-issue-field-heading-field-wrapper"][data-testid*="customfield"]';
    return Array.from(document.querySelectorAll(selector)).map(wrapper => {
        const [labelElement, valueElement] = wrapper.children;
        const link = valueElement ? valueElement.querySelector('a') : null;
        return {
            label: labelElement ? labelElement.textContent : '',
            value: valueElement ? valueElement.textContent : '',
            href: link ? link.getAttribute('href') : null,
        };
    });
};

/**
 * Process the fields extracted from the tracker page and generate the command buttons.
 *
 * @param {{label: string, value: string, href: (string|null)}[]} fields
 */
const processTrackerFields = fields => {
    // Reverse the fields so main comes first, then latest stable down to oldest.
    fields.reverse();
    for (const field of fields) {
        const fieldLabel = field.label;
        // Skip non-Pull X.Y... fields.
        if (fieldLabel.indexOf('Pull') === -1) {
            continue;
        }
        // We don't need the Pull Diff URL.
        if (fieldLabel.indexOf('Diff URL') >= 0) {
            continue;
        }
        if (fieldLabel.indexOf('from Repository') >= 0) {
            if (!field.href) {
                continue;
            }
            // Make sure GitHub repository URLs are not using the unauthenticated git protocol.
            pullFromRepository = field.href.replace("git://github.com", "https://github.com");
        } else {
            const parts = fieldLabel.trim().split(" ");
            let version = null;
            for (const part of parts) {
                if (part.length === 0 || part === 'Pull' || part === 'Branch') {
                    continue;
                }
                version = part.toLowerCase();
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
                const trimmedValue = field.value.trim();
                if (trimmedValue.length === 0 || PLACEHOLDER_WORDS.includes(trimmedValue)) {
                    continue;
                }
                pullBranches[version] = trimmedValue;
                const branch = getMoodleBranch(version);

                // Append this button to the form.
                const actionCells = document.querySelectorAll('#pull-form [data-action]');
                for (const cell of actionCells) {
                    cell.append(createCommandButton(branch, version));
                }
            }
        }
    }

    // Enable Pull all and Push buttons if there are command buttons.
    if (Object.keys(pullBranches).length > 0) {
        document.getElementById('bulkCommands').removeAttribute('hidden');
    }
};

/**
 * Show a notice in the popup when no pull commands can be generated.
 *
 * @param {string} message
 */
const showNotice = message => {
    const notice = document.getElementById('notice');
    notice.textContent = message;
    notice.removeAttribute('hidden');
};

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
    console.error(`Configuration not found for action ${commandAction}`);
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

document.addEventListener('DOMContentLoaded', async() => {
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

    // Load the configuration and generate the command table before populating it with buttons.
    try {
        const data = await api.storage.sync.get(['config']);
        config = data.config || defaultConfig;
    } catch (error) {
        console.error('Error loading the configuration. Using the default configuration.', error);
        config = defaultConfig;
    }
    generateTable();

    // Extract the pull fields from the tracker issue in the active tab.
    try {
        const [activeTab] = await api.tabs.query({active: true, currentWindow: true});
        const results = await api.scripting.executeScript({
            target: {tabId: activeTab.id},
            func: extractTrackerFields,
        });
        const fields = (results || []).flatMap(result => result.result || []);
        processTrackerFields(fields);
    } catch (error) {
        console.error('Error reading the tracker issue:', error);
    }

    if (Object.keys(pullBranches).length === 0) {
        showNotice('No pull branches found. Open an MDL issue on the Moodle Tracker that has patches.');
    }
});
