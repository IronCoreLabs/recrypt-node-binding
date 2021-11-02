#!/bin/bash

# Get or set the semver in various files.

# If called with no args, return the current version.
# If called with one arg, set the version to the new value.

# Always performs sanity checking:
# - There must be at least one version file.
# - All version files must agree. (Ignoring the contents but not existence of pre-release version.)
# - The version must be a valid semver.
# - The version must not be 0.0.0.

# If setting the version to $a.$b.$c-$pre, substitute "SNAPSHOT" for $pre in any Java-related files.

set -e

# Parse args
case "$#" in
"0")
    NEWVERS=""
    ;;
"1")
    NEWVERS="$1"
    ;;
"*")
    echo "Usage: $0 [version]" 1>&2
    exit 1
    ;;
esac

# Find the version files in this directory or its descendants, but don't recurse too deep.
VERSFILES=$(find . -maxdepth 3 ! -path ./.git/\* | grep -v /node_modules/ | grep -E '.*/(version|Cargo.toml|package.json|pom.xml|version.sbt)$')

# Do we have at least one?
if [ -z "${VERSFILES}" ] ; then
    echo "No version files found; aborting" 1>&2
    exit 1
fi

# Read the versions.
CURRENTVERS=""
for FILE in ${VERSFILES} ; do
    # Parse each version file according to its type.
    case $(basename "${FILE}") in
    version)
        # It's a file to capture version info for generic things that don't have their own format.
        VERS=$(cat "${FILE}")
        ;;
    Cargo.toml)
        VERS=$(cargo metadata --manifest-path "${FILE}" --no-deps --offline --format-version 1 | jq -r '.packages[0].version')
        ;;
    package.json)
        if [ "$(dirname "${FILE}")" = "." ] ; then
            # This is the root package.json, so we want .version.
            VERS=$(jq -r '.version' < "${FILE}")
        else
            # This isn't the root package.json, so we assume it depends on the package declared in the root package.json. We need to
            # get the root package's name.
            ROOTJSNAME=$(jq -r '.name' < package.json)
            VERS=$(jq -r ".dependencies[\"${ROOTJSNAME}\"]" < "${FILE}")
            # Strip off any leading "^".
            VERS=${VERS/^/}
        fi
        ;;
    ./pom.xml)
        if [ "$(dirname "${FILE}")" = "." ] ; then
            # This is the root pom.xml, so we want /m:project/m:version.
            VERS=$(xmlstarlet sel -N m="http://maven.apache.org/POM/4.0.0" -t -v "/m:project/m:version" < "${FILE}")
        else
            # This isn't the root pom.xml, so we assume it depends on the package declared in the root pom.xml. We need to get the
            # root pom's artifactId.
            ROOTID=$(xmlstarlet sel -N m="http://maven.apache.org/POM/4.0.0" -t -v "/m:project/m:artifactId" < pom.xml)
            # Select /m:project/m:dependencies/m:dependency/m:version where it has a sibling m:artifactId with the correct value.
            XPATH="/m:project/m:dependencies/m:dependency[m:artifactId=\"${ROOTID}\"]/m:version"
            VERS=$(xmlstarlet sel -N m="http://maven.apache.org/POM/4.0.0" -t -v "${XPATH}" < "${FILE}")
        fi
        ;;
    version.sbt)
        VERS=$(sed -e 's/^[^"]*"//' -e 's/"$//' < "${FILE}")
        ;;
    *)
        echo "Can't parse '${FILE}' for version" 1>&2
        exit 1
        ;;
    esac

    if [ -z "${VERS}" ] ; then
        echo "Empty version from '${FILE}'" 1>&2
        exit 1
    fi

    # If this is the first parsed version file, then set current version.
    if [ -z "${CURRENTVERS}" ] ; then
        CURRENTVERS="${VERS}"
    fi

    # Compare this file's version to other files' version. Ignore anything after the "-" in a pre-release version, but keep the "-"
    # so a release version is unequal to a pre-release.
    if ! [ "${CURRENTVERS/-*/-}" = "${VERS/-*/-}" ] ; then
        echo "Version '${VERS}' in '${FILE}' doesn't match '${CURRENTVERS}' from others in '${VERSFILES}'" 1>&2
        exit 1
    fi
done

# Sanity check: Ignoring any pre-release info, version must not be 0.0.0.
if [ "${CURRENTVERS/-*/}" = "0.0.0" ] ; then
    echo "Illegal zero version '${CURRENTVERS}'" 1>&2
    exit 1
fi
# Sanity check: Must be valid semver.
if ! [[ ${CURRENTVERS} =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-((0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*)(\.(0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*))*))?(\+([0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*))?$ ]] ; then
    echo "Invalid version '${CURRENTVERS}'" 1>&2
    exit 1
fi

# If we're just getting the current version, print it and exit successfully.
if [ -z "${NEWVERS}" ] ; then
    echo "${CURRENTVERS}"
    exit 0
fi

# If we reach this point, it means we're setting the version.

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
