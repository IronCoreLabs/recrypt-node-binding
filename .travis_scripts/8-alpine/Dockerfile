FROM node:8-alpine

RUN wget https://sh.rustup.rs -O - | sh -s -- -y
RUN ln -s "${HOME}"/.cargo/bin/* /usr/local/bin
# hack to get dynlibs working with musl
# https://github.com/rust-lang/rust/pull/55163#issuecomment-436631090
ENV RUSTFLAGS="-C target-feature=-crt-static"
RUN apk add --no-cache build-base musl-dev python2

CMD ["sh"]