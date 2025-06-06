import os
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document


UPLOAD_DIR = "./uploads"
VECTOR_DIR = "./vectorstore"

def load_documents():
    docs = []
    for filename in os.listdir(UPLOAD_DIR):
        filepath = os.path.join(UPLOAD_DIR, filename)
        if filename.endswith(".pdf"):
            loader = PyPDFLoader(filepath)
            pages = loader.load()
            # Combine all pages into a single string to preserve flow
            full_text = "\n".join([p.page_content for p in pages])
            docs.append(Document(page_content=full_text))
        elif filename.endswith(".txt"):
            loader = TextLoader(filepath)
            docs.extend(loader.load())
    return docs

def embed_and_store():
    print("[*] Loading documents...")
    docs = load_documents()

    print(f"[*] Loaded {len(docs)} documents. Splitting into chunks...")
    
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,
        chunk_overlap=30,
        separators=["\n\n", "\n", ".", " "],  # preserve paragraphs and bullets
    )

    chunks = splitter.split_documents(docs)

    print(f"[*] Generated {len(chunks)} chunks. Embedding...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-MiniLM-L6-v2")

    print(f"[*] Storing into Chroma at {VECTOR_DIR}")
    vs = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=VECTOR_DIR,
    )
    print("✅ Stored chunks:", vs._collection.count())

    print("[✓] Done. Vectorstore saved.")

if __name__ == "__main__":
    embed_and_store()
