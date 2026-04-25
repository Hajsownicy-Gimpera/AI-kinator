import logging

from langchain_core.messages import HumanMessage, SystemMessage

from ai.config import get_llm
from ai.prompts import (
    SYSTEM_PROMPT,
    VALID_ANSWERS,
    format_conversation_history,
    get_dummy_answer,
)

logger = logging.getLogger(__name__)


class LLMChain:
    def __init__(self, character_name: str):
        self.character_name = character_name
        self.llm = get_llm()

    def get_answer(
        self, question: str, conversation_history: list[dict]
    ) -> dict:
        """
        Ask the LLM a yes/no question about the secret character.

        Returns:
            {"answer": "Tak"|"Nie"|"Nie wiem", "raw_response": str}
        """
        if self.llm is None:
            dummy = get_dummy_answer()
            return {"answer": dummy, "raw_response": f"[dummy] {dummy}"}

        prompt_text = SYSTEM_PROMPT.format(
            secret_character=self.character_name,
            conversation_history=format_conversation_history(
                conversation_history
            ),
            question=question,
        )

        try:
            response = self.llm.invoke(
                [
                    SystemMessage(content=prompt_text),
                    HumanMessage(content=question),
                ]
            )
            raw = response.content.strip()
            answer = self._validate(raw)
            return {"answer": answer, "raw_response": raw}
        except Exception:
            logger.exception("LLM call failed")
            return {"answer": "Nie wiem", "raw_response": "[error]"}

    @staticmethod
    def _validate(raw_response: str) -> str:
        """Validate LLM output. Return 'Nie wiem' as fallback."""
        cleaned = raw_response.strip().rstrip(".")
        if cleaned in VALID_ANSWERS:
            return cleaned
        for valid in VALID_ANSWERS:
            if valid.lower() == cleaned.lower():
                return valid
        logger.warning(
            "LLM returned unexpected response: %r – falling back to 'Nie wiem'",
            raw_response,
        )
        return "Nie wiem"
