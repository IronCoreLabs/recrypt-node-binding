# This Dockerfile produces a musl binary for recrypt-node-binding.
# It can be built with this command to copy the result out into ./host-artifacts/out
# docker build --build-arg NODE_VERSION=24 --output type=local,dest=./host-artifacts .

ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-alpine3.22 AS build

RUN apk add --no-cache \
    build-base \
    rust \
    cargo
COPY . /app
WORKDIR /app
RUN yarn install
RUN node publish.js

FROM scratch AS artifacts
WORKDIR /out
COPY --from=build /app/bin-package ./
