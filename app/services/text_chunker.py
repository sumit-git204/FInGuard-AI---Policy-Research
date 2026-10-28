from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_pages(pages: list[dict]) -> list[dict]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=120,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    chunks = []

    for page in pages:
        page_chunks = splitter.split_text(page["text"])

        for index, text in enumerate(page_chunks, start=1):
            chunks.append({
                "chunk_id": f"page_{page['page']}_chunk_{index}",
                "page": page["page"],
                "text": text
            })

    return chunks