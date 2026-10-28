import fitz   # PyMuPDF as fits just to extract text from pdfs


def extract_pdf(file_bytes: bytes) -> list[dict]:
    pages = []

    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page_num, page in enumerate(doc, start=1):
            text = page.get_text("text").strip()

            if text:
                pages.append({
                    "page": page_num,
                    "text": text
                })

    return pages