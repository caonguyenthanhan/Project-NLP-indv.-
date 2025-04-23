{ pkgs ? import <nixpkgs> {} }:

with pkgs;
mkShell {
  buildInputs = [
    python311
    python311Packages.pip
    python311Packages.virtualenv
    nodejs_20
    stdenv.cc.cc.lib
    zlib
    gfortran
    pkg-config
    blas
    lapack
  ];

  shellHook = ''
    export LD_LIBRARY_PATH=${pkgs.stdenv.cc.cc.lib}/lib:${pkgs.zlib}/lib:$LD_LIBRARY_PATH
    export PYTHONPATH=$PWD/$\{PYTHONPATH:+:$PYTHONPATH}
  '';
} 