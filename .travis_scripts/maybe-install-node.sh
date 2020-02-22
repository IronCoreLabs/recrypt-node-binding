#!/bin/sh

# Installs correct node and yarn versions if we aren't doing a docker build.

if [ -z "${IMAGE}" ] ; then

	# install node via NVS -- supports Linux, OS X, and Windows
	git clone --branch v1.5.4 --depth 1 https://github.com/jasongin/nvs ~/.nvs
	. ~/.nvs/nvs.sh
	nvs --version
	nvs add $TRAVIS_NODE_VERSION
	nvs use $TRAVIS_NODE_VERSION
	node --version

    # install our own yarn to make things work on osx
    curl -o- -L https://yarnpkg.com/install.sh | bash -s -- --version 1.22.0
    export PATH=$HOME/.yarn/bin:$PATH

fi