{
  description = "Recrypt Node Binding";
  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = { self, nixpkgs, rust-overlay, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        lib = import <nixpkgs/lib>;
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs { inherit system overlays; };
      in
      rec {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs.nodePackages; [
            pkgs.nodejs_20
            (pkgs.yarn.override { nodejs = pkgs.nodejs_20; })
            pkgs.libiconv
          ];
          nativeBuildInputs = [ pkgs.rust-bin.stable.latest.default ]
            ++ pkgs.lib.optionals (pkgs.stdenv.isDarwin) [ pkgs.darwin.cctools ];
        };
      });
}
