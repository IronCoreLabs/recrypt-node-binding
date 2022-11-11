{
  description = "Recrypt Node Binding";
  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = { self, nixpkgs, rust-overlay, flake-utils}:
    flake-utils.lib.eachDefaultSystem (system:
      let
        lib = import <nixpkgs/lib>;
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs { inherit system overlays; };
      in
      rec {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs.nodePackages; [
            pkgs.nodejs-18_x
            (pkgs.yarn.override { nodejs = pkgs.nodejs-18_x; })
            pkgs.libiconv
          ];
          nativeBuildInputs = [ pkgs.rust-bin.fromRustupToolchain.stable ]
              ++ pkgs.lib.optionals (pkgs.stdenv.isDarwin) [ pkgs.darwin.cctools ];
        };
      });
}
