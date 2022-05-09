#!/bin/bash

# This script is copied from the depot repo; edit it there, not in the destination repo.

# Decide what the next versions are going to be. Inputs are the mode, current version, and optional release version override.
# Outputs are the new release version and the new development version.

# Mode can be "release" or "prerelease". See bump-version.yaml for details.

set -e

case "$#" in
"2")
    MODE="$1"
    CURRENTVERS="$2"
    ;;
"3")
    MODE="$1"
    CURRENTVERS="$2"
    RELEASEVERS="$3"
    ;;
*)
    echo "Usage: $0 mode current_vers [new_vers]" 1>&2
    exit 1
esac
if [ "${MODE}" != "release" ] && [ "${MODE}" != "prerelease" ] ; then
    echo "Invalid mode '${MODE}'" 1>&2
    exit 1
fi

for V in ${CURRENTVERS} ${RELEASEVERS} ; do
    # Sanity check: Ignoring any pre-release info, version must not be 0.0.0.
    if [ "${V/-*/}" = "0.0.0" ] ; then
        echo "Illegal zero version '${V}'" 1>&2
        exit 1
    fi
    # Sanity check: Must start with a valid semver.
    if ! [[ ${V} =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-((0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*)(\.(0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*))*))?(\+([0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*))? ]] ; then
        echo "Invalid version '${V}'" 1>&2
        exit 1
    fi
done

# Derive a new release version.
if [ -z "${RELEASEVERS}" ] ; then
    case "${MODE}" in
    "release")
        RELEASEVERS="${CURRENTVERS/-*}"
        ;;
    "prerelease")
        # Replace [-.]pre[-.$] with [-.]rc[-.$].
        RELEASEVERS="$(echo "${CURRENTVERS}" | sed -E 's/([-.])pre([-.]|$)/\1rc\2/')"
        # If no [-.]rc[-.$], append -rc.0.
        if ! [[ ${RELEASEVERS} =~ [-.]rc([-.]|$) ]] ; then
            RELEASEVERS="${RELEASEVERS}-rc.0"
        fi
        ;;
    esac
fi
echo "::set-output name=release::${RELEASEVERS}"

# Derive a new bumped version from the release version.
# Increment the last number in the string.
VERSION="$(echo "${RELEASEVERS}" | gawk '{ start=match($0, /(.*[^0-9])([0-9]+)([^0-9]*)$/, a) ; a[2] += 1 ; printf("%s%s%s", a[1], a[2], a[3]) }')"
# Replace [-.]rc[-.$] with pre.
VERSION="$(echo "${VERSION}" | sed -E 's/([-.])rc([-.]|$)/\1pre\2/')"
# If no [-.]pre[-.$], then append -pre.
if ! [[ ${VERSION} =~ [-.]pre([-.]|$) ]] ; then
    VERSION="${VERSION}-pre"
fi
echo "::set-output name=bumped::${VERSION}"
