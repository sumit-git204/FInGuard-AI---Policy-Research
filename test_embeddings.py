from app.services.embedding_service import EmbeddingService


embedder = EmbeddingService()

texts = [
    "How can I report a problem with my bank?",
    "Customers can raise complaints through the grievance redressal mechanism.",
    "The borrower must repay the loan according to the repayment schedule."
]

vectors = embedder.embed_texts(texts)

print("Number of texts:", len(texts))
print("Embedding shape:", vectors.shape)
print("First vector dimensions:", len(vectors[0]))
print("First five values:", vectors[0][:5])