# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A keyboard shortcut to open the popup (`Alt+Shift+P` by default).
- Commands can have an optional `description`, which the popup shows when that command is selected.
- A `Push remote` setting on the options page, for when your integration remote isn't called `origin`. ([#4](https://github.com/junpataleta/moodle-pull/issues/4))

### Changed

- Redesigned popup that needs fewer clicks and is easier to use with a keyboard and screen readers:
  - Actions for all branches and for one branch are now separate. `Copy pull for all branches` and `Copy push for all branches` are grouped at the top, and say which branches they include.
  - `Copy pull for all branches` has focus when the popup opens, so pressing `Enter` copies the pull command for every branch.
  - The command choice (`Pull`, `Fetch`, and so on) only applies to the `One branch` section, so commands that don't make sense for all branches at once can't be copied for all of them. It's reset to `Pull` each time the popup opens.
  - Each branch is a single copy button, labelled with its Moodle version and pull branch.
  - Branches are listed main first, then the latest stable branch down to the oldest, whatever order the tracker shows them in.
  - Issues with a patch for a single branch show just that branch and its push button.
  - The full copied command is shown after copying, and copy results are announced to screen readers.
  - The popup no longer closes half a second after copying, so the confirmation can be read. It still closes as soon as you switch to your terminal.
  - Clearer messages when the page can't be read, there are no pull branches, or copying fails.
  - Stronger focus outlines and larger click targets.

## [1.1.0] - 2026-11-26

### Added

- Dark mode support. The popup and the configuration page now follow the system's light or dark colour scheme.

### Changed

- Bootstrap has been upgraded to v5.3.9.
- The minimum supported versions are now Firefox 140 and Firefox for Android 142.

## [1.0.0] - 2026-11-18

### Added

- Firefox support.

### Changed

- The popup now reads the tracker fields directly via `scripting.executeScript()` instead of relying on message passing from a content script.
- Bootstrap's CSS is now bundled with the extension instead of being loaded from a CDN.

### Fixed

- The `Pull all` and `Push command` buttons not showing when `main` is the only branch with a patch.
- Command buttons occasionally not being generated if the tracker fields were received before the configuration was loaded.
- Command buttons being generated for pull branch fields that only contain placeholder text (e.g. `None`, `Add text`, `Add URL`).

## [0.9.0] - 2025-09-10

### Changed

- Updated to work with the new Jira tracker's issue page layout.

### Fixed

- Command buttons being generated for empty pull branch fields.

## [0.8.0] - 2024-08-16

### Added

- A changelog! 🎉
- New `Moodle Pull Configuration` page. Check it out by right-clicking on the popup button and selecting `Options` on the menu. - Shamim Rezaie
- Refinements to the config page, such as:
  - Config validation. 
  - Displaying the default configuration and allowing integrators to copy it to the clipboard.
- New command buttons:
  - `Pull all` - Generates a pull command for all branches with patches and copies to the clipboard.
  - `Push command` - Generates a push command for the all branches and copies to the clipboard.

### Changed

- Default pull commands now have a `--no-edit` option since we normally don't need to edit the merge commit message.

### Removed

- References to the Moodle's `master` branch following its removal on 12 August 2024.
