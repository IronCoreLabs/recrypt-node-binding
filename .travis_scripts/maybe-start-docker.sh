#!/bin/sh

# Starts our build image inside docker, if we're doing a docker build.

set -ex

if [ -z "${IMAGE}" ] ; then
    exit 0
fi

docker build -t node-rust:"${IMAGE}" -f ".travis_scripts/Dockerfile" --build-arg IMAGE="$IMAGE" .
docker run --detach --name target -v "$(pwd)":/src -w /src node-rust:"${IMAGE}" sleep 999999999