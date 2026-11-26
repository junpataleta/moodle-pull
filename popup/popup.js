// Use the promise-based `browser` namespace in Firefox and fall back to `chrome` in Chromium browsers.
const api = globalThis.browser ?? globalThis.chrome;

const PLACEHOLDER_WORDS = [
    'None',
    'Add text',
    'Add URL',
];

const state = {
    /** @type {{type: string, title: string, command: string, description?: string}[]} */
    config: [],
    /** Index of the command selected for single branches in the configuration. */
    selected: 0,
    /** The remote that the push command pushes to. */
    pushRemote: defaultPushRemote,
    issueKey: '',
    repository: '',
    /** @type {{version: string, label: string, branch: string, pullBranch: string}[]} */
    branches: [],
};

/**
 * Runs in the context of the tracker page and returns the issue key and the issue's custom fields.
 *
 * This function is serialised and injected into the page, so it must not reference anything outside its own scope.
 *
 * @returns {{issueKey: string, fields: {label: string, value: string, href: (string|null)}[]}}
 */
const extractTrackerFields = () => {
    const selector = '[data-testid$="details-group"] '
        + 'div[data-component-selector="jira-issue-field-heading-field-wrapper"][data-testid*="customfield"]';
    const fields = Array.from(document.querySelectorAll(selector)).map(wrapper => {
        const [labelElement, valueElement] = wrapper.children;
        const link = valueElement ? valueElement.querySelector('a') : null;
        return {
            label: labelElement ? labelElement.textContent : '',
            value: valueElement ? valueElement.textContent : '',
            href: link ? link.getAttribute('href') : null,
        };
    });
    const issueKeyMatch = window.location.pathname.match(/MDL-\d+/);
    return {
        issueKey: issueKeyMatch ? issueKeyMatch[0] : '',
        fields,
    };
};

const getMoodleBranch = version => version === 'main' ? 'main' : `MOODLE_${version}_STABLE`;

/**
 * Parse the version from a pull branch field label, e.g. "Pull 4.5 Branch" or "Pull Main Branch".
 *
 * @param {string} fieldLabel
 * @returns {{version: string, label: string}|null} The compact version (e.g. "405") and a display label.
 */
const parseVersion = fieldLabel => {
    let result = null;
    for (const part of fieldLabel.trim().split(' ')) {
        if (part.length === 0 || part === 'Pull' || part === 'Branch') {
            continue;
        }
        const version = part.toLowerCase();
        if (version === 'main') {
            result = {version, label: 'main'};
            continue;
        }
        const [major, minor = '0'] = version.split('.');
        // Pre-pad the minor version with 0 for 4.0 and up. Older versions combine both parts.
        const compact = major >= 4 ? major + minor.padStart(2, '0') : major + minor;
        result = {version: compact, label: `${major}.${minor}`};
    }
    return result;
};

/**
 * Process the fields extracted from the tracker page into the list of branches and the repository.
 *
 * @param {{label: string, value: string, href: (string|null)}[]} fields
 */
const processTrackerFields = fields => {
    for (const field of fields) {
        const fieldLabel = field.label;
        // Skip non-Pull X.Y... fields and the Pull Diff URL.
        if (fieldLabel.indexOf('Pull') === -1 || fieldLabel.indexOf('Diff URL') >= 0) {
            continue;
        }
        if (fieldLabel.indexOf('from Repository') >= 0) {
            if (field.href) {
                // Make sure GitHub repository URLs are not using the unauthenticated git protocol.
                state.repository = field.href.replace('git://github.com', 'https://github.com');
            }
            continue;
        }
        const parsed = parseVersion(fieldLabel);
        const pullBranch = field.value.trim();
        if (!parsed || pullBranch.length === 0 || PLACEHOLDER_WORDS.includes(pullBranch)) {
            continue;
        }
        state.branches.push({
            ...parsed,
            branch: getMoodleBranch(parsed.version),
            pullBranch,
        });
    }
    // List main first, then the latest stable branch down to the oldest, whatever order the tracker shows them in.
    const sortKey = branch => branch.version === 'main' ? Infinity : Number(branch.version);
    state.branches.sort((a, b) => sortKey(b) - sortKey(a));
};

/**
 * Summarise the branches, e.g. "main, 5.3, 5.2".
 *
 * @returns {string}
 */
const summariseBranches = () => state.branches.map(branch => branch.label).join(', ');

/**
 * Shorten a repository URL for display, e.g. "https://github.com/jdoe/moodle.git" becomes "jdoe/moodle".
 *
 * @param {string} repository
 * @returns {string}
 */
const shortRepositoryName = repository => {
    try {
        const url = new URL(repository);
        const path = url.pathname.replace(/^\/|\.git$/g, '');
        return url.hostname === 'github.com' ? path : `${url.hostname}/${path}`;
    } catch {
        return repository;
    }
};

const selectedCommand = () => state.config[state.selected];

/**
 * The command used for all branches: the "pull" command, or the first configured command if there is none.
 *
 * Other commands, such as pulling without checking out the Moodle branch first, don't make sense for all branches at
 * once, so they are only offered for one branch at a time.
 *
 * @returns {{type: string, title: string, command: string}}
 */
const pullCommand = () => state.config.find(command => command.type === 'pull') || state.config[0];

/**
 * Generate a command for a branch.
 *
 * @param {{command: string}} command
 * @param {{branch: string, pullBranch: string}} branch
 * @returns {string}
 */
const generateCommand = (command, branch) => command.command
    .replaceAll('{{BRANCH}}', branch.branch)
    .replaceAll('{{PULL_REPOSITORY}}', state.repository)
    .replaceAll('{{PULL_BRANCH}}', branch.pullBranch);

/**
 * Generate the pull command for all branches, chained with `&&`.
 *
 * @returns {string}
 */
const generatePullForAll = () => state.branches.map(branch => generateCommand(pullCommand(), branch)).join(' && ');

const generatePushCommand = () => `git push ${state.pushRemote} ${state.branches.map(branch => branch.branch).join(' ')}`;

/**
 * Show a notice instead of the controls when no commands can be generated.
 *
 * @param {string} message
 */
const showNotice = message => {
    const notice = document.getElementById('notice');
    notice.textContent = message;
    notice.hidden = false;
    document.getElementById('controls').hidden = true;
};

/**
 * Announce the result of a copy action and show the copied command.
 *
 * @param {string} message
 * @param {string} command The copied command, or an empty string on failure.
 * @param {boolean} isError
 */
const showStatus = (message, command, isError = false) => {
    const status = document.getElementById('status');
    const copiedCommand = document.getElementById('copied-command');
    // Clear the status first so that screen readers announce the message even if it is the same as the last one.
    status.textContent = '';
    copiedCommand.hidden = true;
    setTimeout(() => {
        status.className = isError ? 'text-danger-emphasis' : 'text-success-emphasis';
        status.textContent = message;
        copiedCommand.textContent = command;
        copiedCommand.hidden = command.length === 0;
    }, 50);
};

/**
 * Copy a command to the clipboard and report the result.
 *
 * The popup stays open so the confirmation can be read. It closes on its own once the user switches to their terminal.
 *
 * @param {string} command
 * @param {string} successMessage
 */
const copyToClipboard = async(command, successMessage) => {
    try {
        await navigator.clipboard.writeText(command);
        showStatus(successMessage, command);
    } catch (error) {
        console.error('Error copying to the clipboard:', error);
        showStatus("Couldn't copy the command. Try again.", '', true);
    }
};

/**
 * Create a small copy icon.
 *
 * @returns {SVGSVGElement}
 */
const createCopyIcon = () => {
    const svgNamespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNamespace, 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('flex-shrink-0');
    const path = document.createElementNS(svgNamespace, 'path');
    path.setAttribute('d', 'M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 '
        + '0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 '
        + '1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z');
    svg.append(path);
    return svg;
};

/**
 * Render the command options from the configuration.
 */
const renderCommandOptions = () => {
    const container = document.getElementById('command-options');
    state.config.forEach((command, index) => {
        const input = document.createElement('input');
        input.type = 'radio';
        input.className = 'btn-check';
        input.name = 'command';
        input.id = `command-${index}`;
        input.value = String(index);
        input.autocomplete = 'off';
        input.checked = index === state.selected;
        input.addEventListener('change', () => {
            state.selected = index;
            updateCommandLabels();
        });

        const label = document.createElement('label');
        label.className = 'btn btn-outline-secondary btn-sm';
        label.htmlFor = input.id;
        label.textContent = command.title;

        container.append(input, label);
    });
};

/**
 * Render a copy button for each branch.
 */
const renderBranches = () => {
    const list = document.getElementById('branch-list');
    state.branches.forEach((branch, index) => {
        const item = document.createElement('li');
        item.className = 'list-group-item p-0';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'branch-button btn w-100 d-flex align-items-center gap-2 text-start border-0 rounded-0';

        const label = document.createElement('span');
        label.className = 'fw-semibold text-nowrap';
        label.textContent = branch.label;

        // Spoken after the visible label, so that the visible text stays at the start of the button's name.
        const hiddenAction = document.createElement('span');
        hiddenAction.className = 'visually-hidden';
        hiddenAction.dataset.commandName = '';

        const details = document.createElement('span');
        details.id = `branch-details-${index}`;
        details.className = 'flex-grow-1 small font-monospace text-body-secondary text-break';
        details.setAttribute('aria-hidden', 'true');
        details.textContent = branch.pullBranch;
        button.setAttribute('aria-describedby', details.id);

        button.append(label, hiddenAction, details, createCopyIcon());
        button.addEventListener('click', () => {
            copyToClipboard(generateCommand(selectedCommand(), branch), `Copied ${selectedCommand().title} for ${branch.label}`);
        });

        item.append(button);
        list.append(item);
    });

};

/**
 * Set up the actions for all branches, or move the push action next to the branch when there is only one.
 */
const renderAllBranchesActions = () => {
    const count = state.branches.length;
    const pushButton = document.getElementById('copy-push');
    if (count === 1) {
        // With a single branch, copying for "all branches" would repeat the branch's own button. Keep only the push
        // action, after the branch.
        const branch = state.branches[0];
        document.getElementById('all-branches').hidden = true;
        document.getElementById('one-branch-heading').textContent = 'Command';
        pushButton.textContent = `Copy push for ${branch.label}`;
        pushButton.classList.add('mt-2');
        document.getElementById('branch-list').after(pushButton);
        return;
    }
    document.getElementById('all-branches-summary').textContent = ` · ${summariseBranches()}`;
    document.getElementById('copy-pull-all-label').textContent =
        `Copy ${pullCommand().title.toLowerCase()} for all ${count} branches`;
    pushButton.textContent = `Copy push for all ${count} branches`;
};

/**
 * Update the labels that mention the selected command.
 */
const updateCommandLabels = () => {
    const command = selectedCommand();
    document.querySelectorAll('[data-command-name]').forEach(element => {
        element.textContent = `, copy ${command.title}`;
    });

    const description = document.getElementById('command-description');
    description.textContent = command.description || '';
    description.hidden = !command.description;
};

/**
 * Load the configuration, and select the pull command so that the default action is always to pull.
 */
const loadConfig = async() => {
    try {
        const data = await api.storage.sync.get(['config', 'pushRemote']);
        state.config = Array.isArray(data.config) && data.config.length > 0 ? data.config : defaultConfig;
        if (typeof data.pushRemote === 'string' && isValidRemoteName(data.pushRemote)) {
            state.pushRemote = data.pushRemote;
        }
    } catch (error) {
        console.error('Error loading the configuration. Using the default configuration.', error);
        state.config = defaultConfig;
    }
    state.selected = state.config.indexOf(pullCommand());
};

/**
 * Read the issue from the tracker page in the active tab.
 *
 * @returns {Promise<boolean>} Whether the page could be read.
 */
const loadTrackerIssue = async() => {
    try {
        const [activeTab] = await api.tabs.query({active: true, currentWindow: true});
        const [result] = await api.scripting.executeScript({
            target: {tabId: activeTab.id},
            func: extractTrackerFields,
        });
        const {issueKey, fields} = result.result;
        state.issueKey = issueKey;
        processTrackerFields(fields);
        return true;
    } catch (error) {
        console.error('Error reading the tracker issue:', error);
        return false;
    }
};

document.addEventListener('DOMContentLoaded', async() => {
    const [canReadPage] = await Promise.all([loadTrackerIssue(), loadConfig()]);

    if (state.issueKey) {
        document.getElementById('issue-key').textContent = state.issueKey;
    }
    if (state.repository) {
        document.getElementById('repository').textContent = shortRepositoryName(state.repository);
    }

    if (!canReadPage) {
        showNotice("Can't read this page. Open an MDL issue on the Moodle Tracker, then open Moodle Pull again.");
        return;
    }
    if (state.branches.length === 0) {
        showNotice('No pull branches found. Open an MDL issue on the Moodle Tracker that has patches.');
        return;
    }

    renderCommandOptions();
    renderBranches();
    renderAllBranchesActions();
    updateCommandLabels();
    document.getElementById('controls').hidden = false;

    const isSingleBranch = state.branches.length === 1;
    const branchesDescription = isSingleBranch ? state.branches[0].label : `all ${state.branches.length} branches`;
    document.getElementById('copy-pull-all').addEventListener('click', () => {
        copyToClipboard(generatePullForAll(), `Copied ${pullCommand().title} for ${branchesDescription}`);
    });
    document.getElementById('copy-push').addEventListener('click', () => {
        copyToClipboard(generatePushCommand(), `Copied push for ${branchesDescription}`);
    });

    // Focus the most common action, so that pressing Enter copies it: pulling all branches, or the only branch.
    const defaultAction = isSingleBranch
        ? document.querySelector('.branch-button')
        : document.getElementById('copy-pull-all');
    defaultAction.classList.add('default-action');
    defaultAction.focus({focusVisible: true});
});
