#!/bin/sh

# Installs correct node and yarn versions if we aren't doing a docker build.

if [ -z "${IMAGE}" ] ; then

	git clone --branch v1.5.4 --depth 1 https://github.com/jasongin/nvs ~/.nvs
	. ~/.nvs/nvs.sh
	nvs --version
	nvs add $TRAVIS_NODE_VERSION
	nvs use $TRAVIS_NODE_VERSION
	node --version

    # install our own yarn to make things work on osx
    curl -o- -L https://yarnpkg.com/install.sh | bash -s -- --version 1.22.0
    export PATH=$HOME/.yarn/bin:$PATH

    # install our own nodejs to get a reasonable version if outside docker
    # rm -rf ~/.nvm && git clone https://github.com/creationix/nvm.git ~/.nvm && (cd ~/.nvm && git checkout `git describe --abbrev=0 --tags`) && source ~/.nvm/nvm.sh && nvm install $TRAVIS_NODE_VERSION
fi