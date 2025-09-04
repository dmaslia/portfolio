#!/bin/bash

# --- Script Configuration ---
# Exit immediately if a command fails, to prevent unexpected behavior.
set -e

# --- Load Environment Secrets ---
# This section securely loads API keys and other secrets from a local .env file.

echo "Checking for .env file..."
# Check if the .env file exists in the current directory.
if [ -f .env ]; then
  # Load the variables from .env and make them available to this script.
  export $(cat .env | sed 's/#.*//g' | xargs)
else
  # If the file is missing, exit with an error to the user.
  echo "--> ERROR: .env file not found."
  echo "--> Please copy .env.example to .env and fill in your secrets."
  exit 1
fi

# Verify that the required secret was actually in the .env file.
if [ -z "$HUGGINGFACE_HUB_TOKEN" ]; then
    echo "--> ERROR: HUGGINGFACE_HUB_TOKEN is not set in your .env file."
    exit 1
fi

echo "✅ Secrets loaded successfully."
echo ""


# --- Environment Setup ---
# Your original commands start here. The HUGGINGFACE_HUB_TOKEN is now available
# as if you had typed 'export HUGGINGFACE_HUB_TOKEN=...' yourself.

echo "Configuring CUDA path..."
export PATH=/usr/local/cuda-12.6/bin:$PATH

echo "Installing system dependencies (cmake, libcurl)..."
sudo apt update
sudo apt install -y cmake libcurl4-openssl-dev

# --- Build llama.cpp ---
# We'll add a check to avoid re-cloning and re-building if it's already done.
if [ ! -d "llama.cpp" ]; then
    echo "Cloning llama.cpp repository..."
    git clone https://github.com/ggml-org/llama.cpp.git
    cd llama.cpp
    echo "Building llama.cpp with CUDA support... (This may take a while)"
    cmake -B build -DGGML_CUDA=ON
    cmake --build build --config Release -j $(nproc)
    cd .. # Go back to the project root
else
    echo "✅ llama.cpp directory already exists, skipping clone and build."
fi


# --- Python Dependencies ---
echo "Installing/updating Python packages..."
# The HUGGINGFACE_HUB_TOKEN is automatically used by the huggingface_hub library
# which llama-cpp-python depends on for downloading models.
pip3 install llama-cpp-python --force-reinstall --upgrade

echo ""
echo "🚀 Setup complete! Your environment is ready."
