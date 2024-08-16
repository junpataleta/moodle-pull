const defaultConfig = [
  {
    "type": "pull",
    "title": "Pull",
    "command": "git checkout {{BRANCH}} && git pull --no-edit {{PULL_REPOSITORY}} {{PULL_BRANCH}}"
  },
  {
    "type": "pull-only",
    "title": "Pull only (no checkout)",
    "command": "git pull --no-edit {{PULL_REPOSITORY}} {{PULL_BRANCH}}"
  },
  {
    "type": "fetch",
    "title": "Fetch",
    "command": "git fetch {{PULL_REPOSITORY}} {{PULL_BRANCH}}"
  },
  {
    "type": "repo-branch",
    "title": "Repo + branch only",
    "command": "{{PULL_REPOSITORY}} {{PULL_BRANCH}}"
  }
];
