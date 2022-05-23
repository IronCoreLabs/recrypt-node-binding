#!/bin/bash

# This script is copied from the depot repo; edit it there, not in the destination repo.

# Get the semver from various files in the repo.

# Always performs sanity checking:
# - There must be at least one version file.
# - All version files must agree. (Ignoring the contents but not existence of pre-release version.)
# - The version must be a valid semver.
# - The version must not be 0.0.0.

set -e

# Parse args
if [ $# -gt 0 ] ; then
    echo "Usage: $0" 1>&2
    exit 1
fi

# Find the version files in this directory or its descendants, but don't recurse too deep.
# This line must be kept in sync with "bump-version.set.sh".
VERSFILES=$(find . -maxdepth 3 ! -path ./.git/\* | grep -v /node_modules/ | grep -E '.*/(version|Cargo.toml|version.go|package.json|pom.xml|version.sbt)$')

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
        VERS=$(cargo metadata --manifest-path "${FILE}" --no-deps --offline --format-version 1 | jq -re '.packages[0].version')
        ;;
    version.go)
        VERS=$(grep "const Version" < "${FILE}" | sed -e 's/^[^"]*"//' -e 's/"$//')
        ;;
    package.json)
        if [ "$(dirname "${FILE}")" = "." ] ; then
            # This is the root package.json, so we want .version.
            VERS=$(jq -re '.version' < "${FILE}")
        else
            # This isn't the root package.json, so we assume it depends on the package declared in the root package.json. We need to
            # get the root package's name.
            ROOTJSNAME="$(jq -re '.name' < package.json)"
            VERS=$(jq -re ".dependencies[\"${ROOTJSNAME}\"]" < "${FILE}")
            # Strip off any leading "^".
            VERS=${VERS/^/}
        fi
        ;;
    pom.xml)
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
# Sanity check: Must start with a valid semver.
if ! [[ ${CURRENTVERS} =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-((0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*)(\.(0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*))*))?(\+([0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*))? ]] ; then
    echo "Invalid version '${CURRENTVERS}'" 1>&2
    exit 1
fi

echo "${CURRENTVERS}"
