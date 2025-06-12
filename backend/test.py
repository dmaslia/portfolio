from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import sys

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-MiniLM-L6-v2")
vectorstore = Chroma(persist_directory="vectorstore", embedding_function=embeddings)

# Get query from command line argument
query = sys.argv[1] if len(sys.argv) > 1 else "previous education"

print(f"\nQuery: {query}")
print("-" * 50)
results = vectorstore.similarity_search(query, k=5)
for i, doc in enumerate(results, 1):
    print(f"\nResult {i}:")
    print(doc.page_content)
    print("-" * 30)
