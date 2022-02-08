#!/bin/bash

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
    # Sanity check: Must be valid semver.
    if ! [[ ${V} =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-((0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*)(\.(0|[1-9][0-9]*|[0-9]*[a-zA-Z-][0-9a-zA-Z-]*))*))?(\+([0-9a-zA-Z-]+(\.[0-9a-zA-Z-]+)*))?$ ]] ; then
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
        # Split "1.2.3-pre.4" into "1.2.3" and "pre.4".
        read -r PRE POST < <(echo "${CURRENTVERS/-/ }")
        # Remove non-numeric parts of "pre.4" like "pre".
        POST="$(echo "${POST}" | sed -e 's/[^0-9.]//g' -e 's/\.*$//')"
        # Remove leading, trailing, or repeated "." characters.
        POST="$(echo "${POST}" | sed -e 's/^\.*//' -e 's/\.*$//' -e 's/\.\.*/./g')"
        if [ "${POST}" = "" ] ; then
            POST="0"
        fi
        # Set "1.2.3-rc.4".
        RELEASEVERS="${PRE}-rc.${POST}"
        ;;
    esac
fi
echo "::set-output name=release::${RELEASEVERS}"

# Derive a new bumped version from the release version.
# Change "1.2.3-rc.4" to "1.2.3.4".
VERSION="$(echo "${RELEASEVERS}" | sed -e 's/-/./g' -e 's/rc//' -e 's/\.\.*/./g')"
# Increment "1.2.3.4" to "1.2.3.5".
VERSION="$(echo "${VERSION}" | awk -F. -v OFS=. '{$NF += 1 ; print}')"
# Convert back to valid semver syntax "1.2.3-pre.5".
VERSION="$(echo "${VERSION}" | sed -e 's/\([^.]*\)\.\([^.]*\)\.\([^.]*\)\(\.\(.*\)\)\{0,1\}/\1.\2.\3-pre.\5/' -e 's/\.$//')"
echo "::set-output name=bumped::${VERSION}"
