import chromadb

class VectorStore:
    def __init__(self, path: str = "./chroma_data"):
        self.client = chromadb.PersistentClient(path=path)

        self.collection = self.client.get_or_create_collection(
            name="finguard_documents",
            metadata={"hnsw:space": "cosine"}
        )

     
    def add_chunks(
        self,
        chunks: list[dict],
        embeddings,
        document_id: str,
        source: str
    ):
        if not chunks:
            return

        self.collection.upsert(
            ids=[
                f"{document_id}_{chunk['chunk_id']}"
                for chunk in chunks
            ],
            documents=[chunk["text"] for chunk in chunks],
            embeddings=embeddings.tolist(),
            metadatas=[
                {
                    "document_id": document_id,
                    "source": source,
                    "page": chunk["page"],
                    "chunk_id": chunk["chunk_id"]
                }
                for chunk in chunks
            ]
        )

    def search(self, query_embedding, top_k: int = 3):
        count = self.collection.count()

        if count == 0:
            return {
                "ids": [[]],
                "documents": [[]],
                "metadatas": [[]],
                "distances": [[]]
            }

        return self.collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=min(top_k, count)
        )
    
    def delete_by_source(self, source: str):
        self.collection.delete(
            where={"source": source}
        )

