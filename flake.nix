{
  description = "Segments.ai Coding Test";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = inputs:
    inputs.flake-utils.lib.eachDefaultSystem (system:
      let pkgs = inputs.nixpkgs.legacyPackages.${system};
      in {
        devShells.default = pkgs.mkShell {
          nativeBuildInputs = with pkgs; [ nodejs_20 ];

          shellHook = with pkgs; ''
            export PATH="$PWD/node_modules/.bin/:$PATH"
          '';
        };
      });
}
