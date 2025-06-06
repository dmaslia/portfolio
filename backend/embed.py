import os
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

UPLOAD_DIR = "./uploads"
VECTOR_DIR = "./vectorstore"

def load_documents():
    docs = []
    for filename in os.listdir(UPLOAD_DIR):
        filepath = os.path.join(UPLOAD_DIR, filename)
        if filename.endswith(".pdf"):
            loader = PyPDFLoader(filepath)
        elif filename.endswith(".txt"):
            loader = TextLoader(filepath)
        else:
            continue  # skip unsupported
        docs.extend(loader.load())
    return docs

def embed_and_store():
    print("[*] Loading documents...")
    docs = load_documents()

    print(f"[*] Loaded {len(docs)} documents. Splitting into chunks...")
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)

    print(f"[*] Generated {len(chunks)} chunks. Embedding...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-MiniLM-L6-v2")

    print(f"[*] Storing into Chroma at {VECTOR_DIR}")
    Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=VECTOR_DIR
    )

    print("[✓] Done. Vectorstore saved.")

if __name__ == "__main__":
    embed_and_store()
