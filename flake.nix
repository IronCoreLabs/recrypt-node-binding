{
  description = "Recrypt Node Binding";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        lib = import <nixpkgs/lib>;
        pkgs = nixpkgs.legacyPackages.${system};
      in
      rec {
        packages = {
          recrypt-node-binding = {
            name = "recrypt-node-binding";
            version = "0.1.0";
            src = ./.;
            buildInputs = with pkgs.nodePackages; [
              pkgs.nodejs-18_x
              (pkgs.yarn.override { nodejs = nodejs-18_x; })
            ];
            nativeBuildInputs = [ ]
              ++ lib.optionals (pkgs.stdenv.isDarwin) [ pkgs.darwin.cctools ];
          };
        };
        defaultPackage = packages.recrypt-node-binding;

        devShell = pkgs.mkShell {
          buildInputs = with pkgs.nodePackages; [
            pkgs.nodejs-18_x
            (pkgs.yarn.override { nodejs = pkgs.nodejs-18_x; })
          ];
        };
      });
}
