const defaultConfig = [
  {
    "title": "Pull",
    "command": "git checkout {{BRANCH}} && git pull --no-edit {{PULL_REPOSITORY}} {{PULL_BRANCH}}"
  },
  {
    "title": "Pull only (no checkout)",
    "command": "git pull --no-edit {{PULL_REPOSITORY}} {{PULL_BRANCH}}"
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
