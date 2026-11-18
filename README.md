# moodle-pull
A simple browser extension (Chrome and Firefox) that generates git pull commands from the Moodle Tracker for Moodle integrators.

## Installation

### Chrome
1. Clone the repository (or download the zip) to any local directory you prefer. e.g.
`git clone git@github.com:junpataleta/moodle-pull.git`
2. Open Chrome and go to `chrome://extensions/`.
3. Turn on `Developer mode`.
4. Press `Load unpacked`.
5. Browse to the location of the `moodle-pull` folder.
6. Select the folder and press `Open`.
7. You should see the `PULL` button beside your browser's address bar.

### Firefox
1. Clone the repository (or download the zip) to any local directory you prefer.
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`.
3. Press `Load Temporary Add-on...`.
4. Browse to the `moodle-pull` folder and select its `manifest.json` file.
5. You should see the `PULL` button in the toolbar (you may need to pin it from the extensions menu).

Temporary add-ons are removed when Firefox restarts. Alternatively, run `web-ext run` from the `moodle-pull` folder.

## Usage
1. On the issue page in the tracker, press the `PULL` button.
2. The available branches with patch will automatically be listed as buttons.
3. Press the desired branch of the patch that you would like to generate a pull command for. The pull command will be automatically copied to your clipboard.
4. Paste to your terminal.
5. Integrate away!
