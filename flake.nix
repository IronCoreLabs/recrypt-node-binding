{
  description = "CMK Config Broker";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        lib = import <nixpkgs/lib>;
        pkgs = nixpkgs.legacyPackages.${system};
      in
      rec {
        packages = {
          cmk-config-broker = {
            name = "cmk-config-broker";
            version = "0.1.0";
            src = ./.;
            buildInputs = with pkgs.nodePackages; [
              pkgs.nodejs-18_x
              pkgs.protobuf
              pkgs.jsonpatch
              (pkgs.yarn.override { nodejs = nodejs-18_x; })
            ];
            nativeBuildInputs = [ ]
              ++ lib.optionals (pkgs.stdenv.isDarwin) [ pkgs.darwin.cctools ];
          };
        };
        defaultPackage = packages.cmk-config-broker;

        devShell = pkgs.mkShell {
          buildInputs = with pkgs.nodePackages; [
            pkgs.nodejs-16_x
            pkgs.protobuf
            (pkgs.yarn.override { nodejs = pkgs.nodejs-16_x; })
          ];
        };
      });
}
