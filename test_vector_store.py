from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStore


embedder = EmbeddingService()
store = VectorStore(path="./test_chroma_data")

chunks = [
    {
        "chunk_id": "page_1_chunk_1",
        "page": 1,
        "text": "Customers can raise complaints through the bank's grievance redressal mechanism."
    },
    {
        "chunk_id": "page_2_chunk_1",
        "page": 2,
        "text": "Borrowers must repay their loans according to the agreed repayment schedule."
    },
    {
        "chunk_id": "page_3_chunk_1",
        "page": 3,
        "text": "The bank must disclose all applicable service charges."
    }
]

texts = [chunk["text"] for chunk in chunks]
embeddings = embedder.embed_texts(texts)

store.add_chunks(
    chunks=chunks,
    embeddings=embeddings,
    document_id="demo_policy"
)

query = "How can I report a problem with my bank?"
query_embedding = embedder.embed_texts([query])[0]

results = store.search(query_embedding, top_k=3)

for idx, chunk_id in enumerate(results["ids"][0]):
    print(f"\nID: {chunk_id}")
    print(f"Text: {results['documents'][0][idx]}")
    print(f"Metadata: {results['metadatas'][0][idx]}")
    print(f"Distance: {results['distances'][0][idx]:.4f}")