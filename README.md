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
1. On the issue page in the tracker, press the `PULL` button.
2. The available branches with patch will automatically be listed as buttons.
3. Press the desired branch of the patch that you would like to generate a pull command for. The pull command will be automatically copied to your clipboard.
4. Paste to your terminal.
5. Integrate away!

## Development

### Firefox
To test local changes, load the extension as a temporary add-on:
1. Go to `about:debugging#/runtime/this-firefox`.
2. Press `Load Temporary Add-on...`.
3. Select the `manifest.json` file in the `moodle-pull` folder.

Temporary add-ons are removed when Firefox restarts. Alternatively, run `web-ext run` from the `moodle-pull` folder.

### Releasing a new Firefox version
1. Bump the version in `manifest.json` and update `CHANGELOG.md`.
2. Sign the extension with [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/): `web-ext sign --channel=unlisted` (requires [AMO API credentials](https://addons.mozilla.org/developers/addon/api/key/)).
3. Tag the release and attach the signed `.xpi` file from `web-ext-artifacts/` to a new GitHub release.
