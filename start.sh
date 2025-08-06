# script for booting up simplepod gpu for llama usage

export PATH=/usr/local/cuda-12.6/bin:$PATH
sudo apt install cmake
sudo apt install libcurl4-openssl-dev
git clone https://github.com/ggml-org/llama.cpp.git
cd llama.cpp
cmake -B build -DGGML_CUDA=ON
cmake --build build --config Release
export HUGGINGFACE_HUB_TOKEN=***REMOVED_HUGGINGFACE_TOKEN***
pip3 install llama-cpp-python --force-reinstall --upgrade
