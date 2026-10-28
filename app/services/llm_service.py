import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

class LLMService:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        self.model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")


        if not api_key:
            raise ValueError("GROQ_API_KEY is missing from the environment.")

        self.client = Groq(api_key=api_key)



    def generate_answer(self, query: str, contexts: list[dict]) -> str:
        if not contexts:
            return "I couldn't find relevant information in the indexed documents to answer this question."

       
        evidence = []

        for index, context in enumerate(contexts, start=1):
            evidence.append(
                f"[Source {index}]\n"
                f"Document: {context['source']}\n"
                f"Page: {context['page']}\n"
                f"Content: {context['text']}"
            )
        context_text = "\n\n".join(evidence)

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                                "You are FinGuard AI, an evidence-based banking and financial "
                                "policy assistant. Answer using only the supplied evidence. "
                                "Do not invent facts, policies, fees, dates, or procedures. "
                                "If the evidence is insufficient, clearly say so. "
                                "Cite factual claims using the exact source identifier supplied, "
                                "such as [S1]. Never invent source identifiers. "
                                "Ensure every citation refers to evidence supporting the claim."
                            )
                },
                {
                    "role": "user",
                    "content": (
                        f"Question:\n{query}\n\n"
                        f"Retrieved evidence:\n{context_text}"
                    )
                }
            ],
            temperature=0.1,
            max_completion_tokens=1000
        )

        answer = response.choices[0].message.content

        if not answer:
            return "I couldn't generate an answer from the available evidence."

        return answer.strip()

