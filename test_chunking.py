from app.services.text_chunker import chunk_pages


pages = [
    {
        "page": 1,
        "text": (
            "The bank must disclose all applicable charges to customers. "
            "Customers may submit complaints through the grievance "
            "redressal mechanism. Unresolved complaints may be escalated "
            "to the appropriate authority. "
        ) * 20
    },
    {
        "page": 2,
        "text": (
            "Loan applicants must submit the required documents. "
            "The bank reviews the application before approving a loan. "
        ) * 10
    }
]

chunks = chunk_pages(pages)

print("Total chunks:", len(chunks))

for chunk in chunks:
    print("\nID:", chunk["chunk_id"])
    print("Page:", chunk["page"])
    print("Length:", len(chunk["text"]))
    print("Text:", chunk["text"])