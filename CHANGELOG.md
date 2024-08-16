# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
