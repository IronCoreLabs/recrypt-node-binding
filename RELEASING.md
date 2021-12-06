Release Checklist
=================

* Decide on the new version number and write the CHANGELOG.md entry for the release by looking at the PRs.
* Commit the `CHANGELOG.md`.
* Update to the new version number using the [Bump Version](https://github.com/IronCoreLabs/recrypt-node-binding/actions/workflows/bump-version.yaml) workflow. This will be used as the NPM version number.
* The [Publish](https://github.com/IronCoreLabs/recrypt-node-binding/actions/workflows/publish.yaml) action will automatically publish the release to NPM.