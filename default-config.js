const defaultConfig = [
  {
    "type": "pull",
    "title": "Pull",
    "command": "git checkout {{BRANCH}} && git pull --no-edit {{PULL_REPOSITORY}} {{PULL_BRANCH}}"
  },
  {
    "type": "pull-only",
    "title": "Pull only (no checkout)",
    "command": "git pull --no-edit {{PULL_REPOSITORY}} {{PULL_BRANCH}}",
    "description": "Pulls into your current branch without checking out the Moodle branch first."
  },
  {
    "type": "fetch",
    "title": "Fetch",
    "command": "git fetch {{PULL_REPOSITORY}} {{PULL_BRANCH}}",
    "description": "Fetches the patch without merging it."
  },
  {
    "type": "repo-branch",
    "title": "Repo + branch only",
    "command": "{{PULL_REPOSITORY}} {{PULL_BRANCH}}",
    "description": "Copies only the repository URL and the patch branch."
  }
];

// The remote that the push command pushes to.
const defaultPushRemote = 'origin';

/**
 * Check whether a remote name is safe to use in the push command. Only allow characters that are valid in Git remote
 * names and have no special meaning in a shell, since the command is pasted into a terminal.
 *
 * @param {string} remote
 * @returns {boolean}
 */
const isValidRemoteName = remote => /^[A-Za-z0-9_][A-Za-z0-9._/-]*$/.test(remote);
