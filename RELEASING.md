# Bumping up the version

The following files must be updated: `src/constants.js` and `package.json`.

In the `src/constants.js`, the variable named `VERSION` must be updated.

In the `package.json`, the field `version` must be updated.

In case this new version depends on a new API version, the field `MIN_API_VERSION` must also be updated on `src/constants.js`.

Create a git tag and a new release on GitHub.