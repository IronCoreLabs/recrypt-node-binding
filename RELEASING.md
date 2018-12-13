Release Checklist
=================

* Decide on the new version number and update it within the `package.json` file. This will be used as the NPM version number.
* Write the CHANGELOG.md entry for the release by looking at the PRs.
* Commit `package.json` (for version number) and `CHANGELOG.md`.
* Push a tag for the version that exists in the `package.json` using `git tag {version}` and `git push origin {tag}`. Pushing this tag will cause Travis to build the Node bindings for all currently supported platforms to verify that they build correctly. If they do, it will then perform the NPM publish step within TravisCI via the `publish.js` script.