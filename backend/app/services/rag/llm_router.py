import asyncio
import httpx
import logging
from typing import List
from groq import AsyncGroq
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMRouter:
    def __init__(self):
        raw_secondary_url = settings.SECONDARY_MODEL_URL
        if raw_secondary_url and raw_secondary_url.startswith(("http://", "https://")):
            self._secondary_url = raw_secondary_url
        else:
            self._secondary_url = None
            if raw_secondary_url:
                logger.warning("RAG llm_router ignored invalid SECONDARY_MODEL_URL (must be http/https URL)")

        # Prefer explicit primary key, fallback to provider-specific key.
        self._primary_api_key = settings.PRIMARY_MODEL_API_KEY or settings.GROQ_API_KEY
        self._primary_model = settings.PRIMARY_MODEL_NAME or "llama-3.1-8b-instant"
        
        if self._primary_api_key:
            self._client = AsyncGroq(api_key=self._primary_api_key)
        else:
            self._client = None
        logger.info(
            "RAG llm_router initialized primary_model=%s has_primary_api_key=%s has_secondary_url=%s",
            self._primary_model,
            bool(self._primary_api_key),
            bool(self._secondary_url),
        )

    def update_secondary_url(self, new_url: str) -> None:
        if new_url and new_url.startswith(("http://", "https://")):
            self._secondary_url = new_url
            logger.info("Secondary model URL updated")
            return

        self._secondary_url = None
        logger.warning("Secondary model URL rejected because it is not a valid http/https URL")

    async def call_primary(self, messages: List[dict], temperature: float = 0.1) -> str:
        try:
            if not self._client:
                raise RuntimeError("Primary model client is not configured")

            logger.info(
                "RAG llm_router call_primary start model=%s temperature=%s message_count=%s",
                self._primary_model,
                temperature,
                len(messages),
            )
                
            formatted_messages = []
            for m in messages:
                role = m.get("role")
                if role not in {"system", "user", "assistant"}:
                    role = "user"
                formatted_messages.append({"role": role, "content": m.get("content", "")})

            response = await self._client.chat.completions.create(
                model=self._primary_model,
                messages=formatted_messages,
                temperature=temperature,
                max_completion_tokens=1024,
                top_p=1,
                stream=False,
            )
            response_text = (response.choices[0].message.content or "") if response.choices else ""
            logger.info("RAG llm_router call_primary done response_len=%s", len(response_text))
            return response_text
        except Exception as exc:
            logger.exception(
                "RAG llm_router call_primary failed model=%s error_type=%s error=%r",
                self._primary_model,
                type(exc).__name__,
                exc,
            )
            raise RuntimeError("Primary model error") from exc

    async def call_secondary(self, messages: List[dict], temperature: float = 0.1) -> str:
        try:
            if not self._secondary_url:
                logger.info("RAG llm_router call_secondary skipped secondary_url_not_set=true")
                return ""

            logger.info(
                "RAG llm_router call_secondary start temperature=%s message_count=%s",
                temperature,
                len(messages),
            )
                
            system_msg = {
                "role": "system", 
                "content": "You are Llama, a helpful news analyst AI. Your name is Llama 3.1. If asked what model you are or what your name is, always say Llama 3.1."
            }
            
            payload_messages = [system_msg] + messages
            
            payload = {
                "model": "llama",
                "messages": payload_messages,
                "temperature": temperature
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{self._secondary_url}/v1/chat/completions",
                    json=payload
                )
                resp.raise_for_status()
                data = resp.json()
                output = data["choices"][0]["message"]["content"]
                logger.info("RAG llm_router call_secondary done response_len=%s", len(output or ""))
                return output
        except Exception as exc:
            logger.warning(
                "RAG llm_router call_secondary failed error_type=%s error=%r",
                type(exc).__name__,
                exc,
                exc_info=True,
            )
            return ""

    async def call_both(self, messages: List[dict], temperature: float = 0.1) -> str:
        logger.info(
            "RAG llm_router call_both start temperature=%s message_count=%s",
            temperature,
            len(messages),
        )
        primary_result, secondary_result = await asyncio.gather(
            self.call_primary(messages, temperature),
            self.call_secondary(messages, temperature),
            return_exceptions=True,
        )

        if isinstance(primary_result, Exception):
            logger.warning(
                "RAG llm_router call_both primary_unavailable error_type=%s error=%r",
                type(primary_result).__name__,
                primary_result,
            )
            primary_text = ""
        else:
            primary_text = primary_result or ""

        secondary_text = ""
        if isinstance(secondary_result, Exception):
            logger.warning(
                "RAG llm_router call_both secondary_unavailable error_type=%s error=%r",
                type(secondary_result).__name__,
                secondary_result,
            )
        else:
            secondary_text = secondary_result or ""

        if primary_text:
            logger.info("RAG llm_router call_both done selected=primary response_len=%s", len(primary_text))
            return primary_text

        if secondary_text:
            logger.info("RAG llm_router call_both done selected=secondary response_len=%s", len(secondary_text))
            return secondary_text

        raise RuntimeError(
            "No LLM response available: configure PRIMARY_MODEL_API_KEY/GROQ_API_KEY "
            "or SECONDARY_MODEL_URL"
        )

llm_router = LLMRouter()
