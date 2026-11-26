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
