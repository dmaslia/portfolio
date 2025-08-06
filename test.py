import time
from llama_cpp import Llama
from datetime import datetime

# === Settings ===
MODELS = {
    "mistral-7b-instruct": "/root/llama.cpp/models/mistral-7b-instruct/mistral-7b-instruct-v0.1.Q4_K_M.gguf",
    "deepseek-1.3b-instruct": "/root/llama.cpp/models/deepseek-coder-1.3b-instruct/deepseek-coder-1.3b-instruct.Q4_K_M.gguf",
    "phi-2": "/root/llama.cpp/models/phi-2/phi-2.Q4_K_M.gguf",
}

PROMPT = (
    "Create a software engineering portfolio using only HTML and Tailwind. "
    "Return only the full file with no explanation. "
    "It should include a skills section, an experience section, and a college section. "
    "Wrap everything inside <html>...</html>."
)

REPEAT_RUNS = 3
MAX_TOKENS = 1024
N_CTX = 2048
N_THREADS = 8
N_GPU_LAYERS = 35  # adjust per model/GPU setup

# === Logging ===
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
LOGFILE = f"benchmark_log_{timestamp}.txt"

def log(msg):
    print(msg)
    with open(LOGFILE, "a") as f:
        f.write(msg + "\n")

# === Benchmark Loop ===
for model_name, model_path in MODELS.items():
    log(f"\n=== Benchmarking {model_name} ===")
    log(f"Model path: {model_path}")

    # Load model
    log("Loading model...")
    llm = Llama(
        model_path=model_path,
        n_ctx=N_CTX,
        n_threads=N_THREADS,
        n_gpu_layers=N_GPU_LAYERS,
        verbose=False
    )

    prompt_tokens = llm.tokenize(PROMPT.encode())
    log(f"Prompt token count: {len(prompt_tokens)}")

    total_times = []
    first_token_times = []
    total_token_counts = []

    for run in range(REPEAT_RUNS):
        log(f"\n--- Run {run + 1} ---")
        start_time = time.time()

        stream = llm(
            PROMPT,
            max_tokens=MAX_TOKENS,
            stop=["</html>"],  # encourages complete file
            stream=True
        )

        response = ""
        first_token = True
        first_token_time = 0

        for chunk in stream:
            token = chunk["choices"][0]["text"]
            if first_token:
                first_token_time = time.time() - start_time
                log(f"[First token latency: {first_token_time:.2f} sec]")
                first_token = False
            response += token

        total_time = time.time() - start_time
        total_tokens = len(llm.tokenize(response.encode()))

        first_token_times.append(first_token_time)
        total_times.append(total_time)
        total_token_counts.append(total_tokens)

        log(f"Total tokens: {total_tokens}")
        log(f"Total time: {total_time:.2f} sec")
        log(f"Throughput: {total_tokens / total_time:.2f} tokens/sec")
        log("\n--- Response ---\n" + response.strip() + "\n----------------\n")

    avg_first = sum(first_token_times) / REPEAT_RUNS
    avg_total = sum(total_times) / REPEAT_RUNS
    avg_tokens = sum(total_token_counts) / REPEAT_RUNS
    avg_tput = avg_tokens / avg_total

    log(f"\n=== Summary for {model_name} ===")
    log(f"Avg first token latency: {avg_first:.2f} sec")
    log(f"Avg total latency: {avg_total:.2f} sec")
    log(f"Avg tokens generated: {avg_tokens:.2f}")
    log(f"Avg throughput: {avg_tput:.2f} tokens/sec")
    log("\n" + "=" * 60 + "\n")
