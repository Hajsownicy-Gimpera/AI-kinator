import os
import logging

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")


def get_llm():
    """Return configured ChatGoogleGenerativeAI instance, or None if no API key."""
    if not GOOGLE_API_KEY:
        logger.warning("GOOGLE_API_KEY not set – LLM will run in dummy mode")
        return None

    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=GOOGLE_API_KEY,
        temperature=0.0,
    )
