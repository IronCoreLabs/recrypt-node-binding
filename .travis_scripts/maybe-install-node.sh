#!/bin/sh

# Installs correct node and yarn versions if we aren't doing a docker build.

if [ -z "${IMAGE}" ] ; then
    # install our own yarn to make things work on osx
    curl -o- -L https://yarnpkg.com/install.sh | bash -s -- --version 1.10.1
    export PATH=$HOME/.yarn/bin:$PATH

    # install our own nodejs to get a reasonable version if outside docker
    rm -rf ~/.nvm && git clone https://github.com/creationix/nvm.git ~/.nvm && (cd ~/.nvm && git checkout `git describe --abbrev=0 --tags`) && source ~/.nvm/nvm.sh && nvm install $TRAVIS_NODE_VERSION
fi