from app.services.llm_service import LLMService


llm = LLMService()

contexts = [
    {
        "source": "demo_banking_policy.pdf",
        "page": 3,
        "text": "Customers can submit complaints through the bank's grievance redressal mechanism."
    }
]

answer = llm.generate_answer(
    query="How can a customer raise a complaint?",
    contexts=contexts
)

print(answer)