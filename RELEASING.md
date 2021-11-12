## Bumping up the version

The following files must be updated: `src/constants.js` and `package.json`.

In the `src/constants.js`, the variable named `VERSION` must be updated.

In the `package.json`, the field `version` must be updated.

In case this new version depends on a new API version, the field `MIN_API_VERSION` must also be updated on `src/constants.js`.

Create a git tag and a new release on GitHub.

## Deploying
Deploys are automated using Github Actions.

To deploy to the `testnet` website, simply commit to the `master` branch.

To deploy to the `mainnet` website, create a release in Github using a tag in the format `v0.0.0`. You should use the same version that you updated in the files in the previous section.
