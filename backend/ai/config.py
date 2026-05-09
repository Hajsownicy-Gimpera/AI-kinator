import os
import logging

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

def get_llm():
    """Return configured ChatGoogleGenerativeAI instance, or None if no API key."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logger.warning("GOOGLE_API_KEY not set - LLM will run in dummy mode")
        return None

    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        model="gemini-3.1-flash-lite-preview",
        google_api_key=api_key,
        temperature=0.0,
    )
