from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-MiniLM-L6-v2")
vectorstore = Chroma(persist_directory="vectorstore", embedding_function=embeddings)

results = vectorstore.similarity_search("list all jobs Daniel Maslia has had", k=20)
for doc in results:
    print("---")
    print(doc.page_content)
