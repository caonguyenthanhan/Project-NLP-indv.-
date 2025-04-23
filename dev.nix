{ pkgs ? import <nixpkgs> {} }:

let
  pythonEnv = pkgs.python311.withPackages (ps: with ps; [
    numpy
    scikit-learn
    pandas
    nltk
    torch
    transformers
    fastapi
    uvicorn
    python-multipart
    beautifulsoup4
    requests
  ]);
in
pkgs.mkShell {
  buildInputs = with pkgs; [
    pythonEnv
    nodejs_20
    yarn
    gcc
    gfortran
    pkg-config
    blas
    lapack
    stdenv.cc.cc.lib
    zlib
  ];

  shellHook = ''
    export LD_LIBRARY_PATH=${pkgs.stdenv.cc.cc.lib}/lib:${pkgs.zlib}/lib:$LD_LIBRARY_PATH
    export PYTHONPATH=$PWD/$\{PYTHONPATH:+:$PYTHONPATH}
    
    if [ ! -d "venv" ]; then
      python -m venv venv
    fi
    source venv/bin/activate
    
    echo "Python virtual environment activated!"
    echo "Node.js version: $(node --version)"
    echo "Python version: $(python --version)"
  '';
} 