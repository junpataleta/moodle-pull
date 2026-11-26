# moodle-pull
A simple browser extension (Chrome and Firefox) that generates git pull commands from the Moodle Tracker for Moodle integrators.

## Installation

### Firefox
1. Go to the [latest release](https://github.com/junpataleta/moodle-pull/releases/latest).
2. Under `Assets`, click the `.xpi` file.
3. Firefox will ask for permission to install the add-on. Press `Continue to Installation`, then `Add`.
4. You should see the `PULL` button in the toolbar. If not, pin it from the extensions menu (the puzzle piece icon).

The add-on is signed by Mozilla, so it works in regular Firefox releases.

To update, install the `.xpi` file from the newest release the same way. It replaces the installed version and keeps your configuration.

### Chrome
1. Clone the repository (or [download the zip](https://github.com/junpataleta/moodle-pull/archive/refs/heads/main.zip)) to any local directory you prefer. e.g.
`git clone https://github.com/junpataleta/moodle-pull.git`
2. Open Chrome and go to `chrome://extensions/`.
3. Turn on `Developer mode`.
4. Press `Load unpacked`.
5. Browse to the location of the `moodle-pull` folder.
6. Select the folder and press `Open`.
7. You should see the `PULL` button beside your browser's address bar.

To update, run `git pull` in the `moodle-pull` folder (or download the zip again), then press the reload button on the extension's card in `chrome://extensions/`.

## Usage
1. On an MDL issue page in the tracker, press the `PULL` button (or press `Alt+Shift+P`).
2. Press `Enter` (or the `Copy pull for all branches` button) to copy the pull command for every branch with a patch, chained with `&&`.
3. Paste to your terminal.
4. Integrate away!

When you're ready to push, open the popup again and press `Copy push for all branches`.

To copy a command for a single branch, use the `One branch` section: choose the command (`Pull` by default), then press the branch. With the keyboard, press `Tab` twice from `Copy pull for all branches` to reach the commands, use the arrow keys to choose one, then press `Tab` to reach the branches.

The push command pushes to `origin` by default. If your remote has a different name (such as `integration`), set it in the extension's options.

You can change the keyboard shortcut in your browser's extension shortcut settings, and the available commands in the extension's options.

## Development

### Firefox
To test local changes, load the extension as a temporary add-on:
1. Go to `about:debugging#/runtime/this-firefox`.
2. Press `Load Temporary Add-on...`.
3. Select the `manifest.json` file in the `moodle-pull` folder.

Temporary add-ons are removed when Firefox restarts. Alternatively, run `web-ext run` from the `moodle-pull` folder.
