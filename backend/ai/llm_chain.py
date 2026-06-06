import logging
import re
import time
import unicodedata

from langchain_core.messages import HumanMessage, SystemMessage

from ai.config import get_llm
from ai.prompts import (
    HINT_PROMPT,
    SYSTEM_PROMPT,
    VALID_ANSWERS,
    format_conversation_history,
    get_dummy_answer,
    get_dummy_hint,
)

logger = logging.getLogger(__name__)

MAX_RETRIES = 2
RETRY_BACKOFF = 1.0


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
            {"answer": "Tak"|"Nie"|"Nie wiem"}
        """
        if self.llm is None:
            logger.info("Question endpoint: using DUMMY mode (no GOOGLE_API_KEY)")
            dummy = get_dummy_answer()
            return {"answer": dummy}

        logger.info("Question endpoint: calling Google AI Studio (gemini)")

        prompt_text = SYSTEM_PROMPT.format(
            secret_character=self.character_name,
            conversation_history=format_conversation_history(
                conversation_history
            ),
            question=question,
        )

        messages = [
            SystemMessage(content=prompt_text),
            HumanMessage(content=question),
        ]

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = self.llm.invoke(messages)
                content = response.content
                if isinstance(content, list):
                    content = "".join(
                        part.get("text", "") if isinstance(part, dict) else str(part)
                        for part in content
                    )
                raw = content.strip()
                answer = self._validate(raw)
                return {"answer": answer}
            except Exception:
                logger.warning(
                    "LLM call attempt %d/%d failed", attempt, MAX_RETRIES,
                    exc_info=True,
                )
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_BACKOFF * attempt)

        return {"answer": "Nie wiem"}

    def get_hint(self) -> dict:
        """Return a short character hint."""
        if self.llm is None:
            logger.info("Hint endpoint: using DUMMY mode (no GOOGLE_API_KEY)")
            return {"hint_text": get_dummy_hint(self.character_name)}

        logger.info("Hint endpoint: calling Google AI Studio (gemini)")

        prompt_text = HINT_PROMPT.format(secret_character=self.character_name)

        messages = [
            SystemMessage(content=prompt_text),
            HumanMessage(content="Podaj jedną krótką podpowiedź."),
        ]

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = self.llm.invoke(messages)
                content = response.content
                if isinstance(content, list):
                    content = "".join(
                        part.get("text", "") if isinstance(part, dict) else str(part)
                        for part in content
                    )
                hint_text = str(content).strip()
                if hint_text:
                    return {"hint_text": hint_text}
            except Exception:
                logger.warning(
                    "Hint LLM call attempt %d/%d failed", attempt, MAX_RETRIES,
                    exc_info=True,
                )
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_BACKOFF * attempt)

        return {"hint_text": get_dummy_hint(self.character_name)}

    @staticmethod
    def _validate(raw_response: str) -> str:
        """Validate LLM output. Return 'Nie wiem' as fallback."""
        normalized = unicodedata.normalize("NFC", raw_response)
        collapsed = re.sub(r"\s+", " ", normalized).strip()
        cleaned = collapsed.strip(".,!?;:\"'-")
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
