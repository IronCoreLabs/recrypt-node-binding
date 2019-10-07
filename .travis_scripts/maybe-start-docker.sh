#!/bin/sh

# Starts our build image inside docker, if we're doing a docker build.

set -ex

if [ -z "${IMAGE}" ] ; then
    exit 0
fi

docker build -t node-rust:"${IMAGE}" -f ".travis_scripts/${IMAGE}/Dockerfile" .
docker run --detach --name target -v "$(pwd)":/src -w /src -e NPM_TOKEN="$NPM_TOKEN" node-rust:"${IMAGE}" sleep 999999999