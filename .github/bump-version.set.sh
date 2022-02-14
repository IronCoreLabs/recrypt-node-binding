#!/bin/bash

# This script is copied from the depot repo; edit it there, not in the destination repo.

# Set the semver in various files.

# Always performs sanity checking:
# - There must be at least one version file.
# - The version must be a valid semver.
# - The version must not be 0.0.0.
# - After running, altered files must already be under Git control, and they must be only the version files we know how to handle,
#   and modifications must be 0 or 1 line changes.

# If setting the version to $a.$b.$c-$pre, substitute "SNAPSHOT" for $pre in any Java-related files.

set -e

# Parse args
if [ $# -ne 1 ] ; then
    echo "Usage: $0 version" 1>&2
    exit 1
fi
NEWVERS="$1"

# Sanity check: Ignoring any pre-release info, version must not be 0.0.0.
if [ "${NEWVERS/-*/}" = "0.0.0" ] ; then
    echo "Illegal zero version '${NEWVERS}'" 1>&2
    exit 1
fi
# Sanity check: Must be valid semver.
if ! [[ ${NEWVERS} =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-((0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*)(\.(0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*))*))?(\+([0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*))?$ ]] ; then
    echo "Invalid version '${NEWVERS}'" 1>&2
    exit 1
fi

# Find the version files in this directory or its descendants, but don't recurse too deep.
# This line must be kept in sync with "bump-version.get.sh".
VERSFILES=$(find . -maxdepth 3 ! -path ./.git/\* | grep -v /node_modules/ | grep -E '.*/(version|Cargo.toml|package.json|pom.xml|version.sbt)$')

# Edit the version files.
for FILE in ${VERSFILES} ; do
    DIR=$(dirname "${FILE}")
    case $(basename "${FILE}") in
    version)
        echo "${NEWVERS}" > "${FILE}"
        ;;

    Cargo.toml)
        sed 's/^version = ".*"$/version = "'"${NEWVERS}"'"/' "${FILE}" > "${FILE}.tmp"
        mv "${FILE}.tmp" "${FILE}"

        # If there's a Cargo.lock, update it also.
        if [ -f "${DIR}/Cargo.lock" ] ; then
            CARGO_LOCKS="${CARGO_LOCKS} ${DIR}"
        fi
        ;;

    package.json)
        if [ "$(dirname "${FILE}")" = "." ] ; then
            # This is the root package.json, so we want .version.
            jq --indent 4 ".version=\"${NEWVERS}\"" "${FILE}" > "${FILE}.new"
        else
            # We already know the root package name from above, so reuse that here.
            jq --indent 4 ".dependencies[\"${ROOTJSNAME}\"]=\"^${NEWVERS}\"" "${FILE}" > "${FILE}.new"
        fi
        mv "${FILE}.new" "${FILE}"
        ;;

    pom.xml)
        # Replace -foo with -SNAPSHOT to be compatible with Java conventions.
        JAVAVERS="${NEWVERS/-*/-SNAPSHOT}"

        if [ "$(dirname "${FILE}")" = "." ] ; then
            # This is the root pom.xml, so we want /m:project/m:version.
            xmlstarlet ed -L -P -N m="http://maven.apache.org/POM/4.0.0" -u "/m:project/m:version" -v "${JAVAVERS}" "${FILE}"
        else
            # We've already computed our XPATH expression above, so reuse that here.
            xmlstarlet ed -L -P -N m="http://maven.apache.org/POM/4.0.0" -u "${XPATH}" -v "${JAVAVERS}" "${FILE}"
        fi
        ;;

    version.sbt)
        # Replace -foo with -SNAPSHOT to be compatible with Java conventions.
        # Disabling this logic to work with cmk-s3-proxy. Since we only use bump-version to publish our scala containers, not our
        # scala libs, the -SNAPSHOT suffix isn't an important convention.
        # JAVAVERS="${NEWVERS/-*/-SNAPSHOT}"
        JAVAVERS="${NEWVERS}"

        # The file might use the old, deprecated syntax or the newer syntax:
        # version in ThisBuild := "1.2.3-SNAPSHOT"
        # ThisBuild / version := "1.2.3-SNAPSHOT"
        sed 's,^ThisBuild / version := ".*"$,ThisBuild / version := "'"${JAVAVERS}"'",' "${FILE}" > "${FILE}.tmp"
        sed 's,^version in ThisBuild := ".*"$,ThisBuild / version := "'"${JAVAVERS}"'",' "${FILE}.tmp" > "${FILE}"
        rm "${FILE}.tmp"
        ;;

    *)
        echo "Can't edit '${FILE}' with new version" 1>&2
        exit 1
    esac

    # Add it to git.
    git add "${FILE}"
    # Verify that we've changed zero or one line.
    git diff --cached -w --numstat "${FILE}" > /tmp/diffcount
    if [ -s /tmp/diffcount ] ; then
        # shellcheck disable=SC2034
        read -r ADDED REMOVED FILENAME < /tmp/diffcount
        if [ "${ADDED}" -ne 1 ] || [ "${REMOVED}" -ne 1 ] ; then
            echo "Changes to '${FILE}' must be zero or one line, but observed edits are:" 1>&2
            git diff --cached "${FILE}" 1>&2
            exit 1
        fi
    fi
done

# If there are Cargo.lock files, we need to run "cargo fetch" after all the Cargo.toml files have been edited.
for DIR in ${CARGO_LOCKS} ; do
    ( cd "${DIR}" && cargo fetch )
    git add "${DIR}/Cargo.lock"
done

# Look for files that have been changed, but that we haven't told git about.
echo "Checking for modified but untracked files:"
if git status -s | grep -qEv '^M ' ; then
    echo "Modified but untracked files:" 1>&2
    git status -s | grep -Ev '^M ' 1>&2
    echo "This probably means '$0' modified a file but forgot to 'git add' it." 1>&2
    exit 1
fi
