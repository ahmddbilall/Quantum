import asyncio
import httpx
import logging
from typing import List
from groq import AsyncGroq
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMRouter:
    def __init__(self):
        raw_secondary_url = settings.LLAMA_MODEL_URL
        if raw_secondary_url and raw_secondary_url.startswith(("http://", "https://")):
            self._secondary_url = raw_secondary_url
        else:
            self._secondary_url = None
            if raw_secondary_url:
                logger.warning("RAG llm_router ignored invalid LLAMA_MODEL_URL (must be http/https URL)")

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
                
            system_prompt = "You are a helpful news analyst AI."

            normalized_messages = []
            for m in messages:
                role = m.get("role")
                if role not in {"system", "user", "assistant"}:
                    role = "user"
                normalized_messages.append({"role": role, "content": m.get("content", "")})

            last_user_message = ""
            for msg in reversed(normalized_messages):
                if msg.get("role") == "user":
                    last_user_message = msg.get("content", "")
                    break

            if not last_user_message:
                last_user_message = normalized_messages[-1].get("content", "") if normalized_messages else ""

            history = normalized_messages[:-1] if normalized_messages else []

            payload = {
                "history": history,
                "message": last_user_message,
                "system_prompt": system_prompt,
                "max_new_tokens": 512,
                "temperature": temperature,
                "top_p": 0.9,
                "repetition_penalty": 1.1,
            }

            def _extract_text(data: dict) -> str:
                # Support known /chat schemas and OpenAI-style envelopes.
                for key in ("reply", "response", "content", "generated_text", "output"):
                    value = data.get(key)
                    if isinstance(value, str) and value.strip():
                        return value

                choices = data.get("choices")
                if isinstance(choices, list) and choices:
                    first_choice = choices[0]
                    if isinstance(first_choice, dict):
                        msg = first_choice.get("message")
                        if isinstance(msg, dict):
                            content = msg.get("content")
                            if isinstance(content, str):
                                return content
                return ""

            base_url = self._secondary_url.rstrip("/")
            timeout = httpx.Timeout(connect=10.0, read=120.0, write=30.0, pool=10.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = None
                for attempt in range(2):
                    try:
                        resp = await client.post(f"{base_url}/chat", json=payload)
                        break
                    except (httpx.ReadTimeout, httpx.ReadError, httpx.ConnectTimeout, httpx.ConnectError):
                        if attempt == 1:
                            raise
                        logger.info(
                            "RAG llm_router call_secondary transient_network_error retrying attempt=%s",
                            attempt + 2,
                        )
                        await asyncio.sleep(0.75)

                if resp is not None and resp.status_code == 404:
                    # Backward compatibility for OpenAI-compatible deployments.
                    fallback_payload = {
                        "model": "llama",
                        "messages": [{"role": "system", "content": system_prompt}] + normalized_messages,
                        "temperature": temperature,
                    }
                    resp = await client.post(f"{base_url}/v1/chat/completions", json=fallback_payload)

                if resp is None:
                    raise RuntimeError("Secondary model request did not produce an HTTP response")
                resp.raise_for_status()
                data = resp.json()
                output = _extract_text(data)
                if not output:
                    raise ValueError("Secondary model response did not contain text content")
                logger.info("RAG llm_router call_secondary done response_len=%s", len(output or ""))
                return output
        except httpx.RequestError as exc:
            logger.info(
                "RAG llm_router call_secondary unavailable error_type=%s error=%r",
                type(exc).__name__,
                exc,
            )
            return ""
        except Exception as exc:
            logger.warning(
                "RAG llm_router call_secondary failed error_type=%s error=%r",
                type(exc).__name__,
                exc,
                exc_info=True,
            )
            return ""

    async def call_secondary_summary(self, text: str, temperature: float = 0.2) -> str:
        try:
            if not self._secondary_url:
                logger.info("RAG llm_router call_secondary_summary skipped secondary_url_not_set=true")
                return ""

            prompt_text = (text or "").strip()
            if not prompt_text:
                return ""

            payload = {
                "text": prompt_text,
                "max_new_tokens": 160,
                "temperature": temperature,
                "top_p": 0.95,
                "repetition_penalty": 1.05,
            }

            def _extract_summary(data: dict) -> str:
                for key in ("summary", "reply", "response", "content", "generated_text", "output"):
                    value = data.get(key)
                    if isinstance(value, str) and value.strip():
                        return value
                return ""

            base_url = self._secondary_url.rstrip("/")
            timeout = httpx.Timeout(connect=10.0, read=120.0, write=30.0, pool=10.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = None
                for attempt in range(2):
                    try:
                        resp = await client.post(f"{base_url}/summarize", json=payload)
                        break
                    except (httpx.ReadTimeout, httpx.ReadError, httpx.ConnectTimeout, httpx.ConnectError):
                        if attempt == 1:
                            raise
                        logger.info(
                            "RAG llm_router call_secondary_summary transient_network_error retrying attempt=%s",
                            attempt + 2,
                        )
                        await asyncio.sleep(0.75)

                if resp is not None and resp.status_code == 404:
                    # Compatibility for alternate endpoint naming.
                    resp = await client.post(f"{base_url}/summary", json=payload)

                if resp is None:
                    raise RuntimeError("Secondary summary request did not produce an HTTP response")

                resp.raise_for_status()
                data = resp.json()
                summary_text = _extract_summary(data)
                if not summary_text:
                    raise ValueError("Secondary summary response did not contain text content")

                logger.info("RAG llm_router call_secondary_summary done response_len=%s", len(summary_text))
                return summary_text
        except httpx.RequestError as exc:
            logger.info(
                "RAG llm_router call_secondary_summary unavailable error_type=%s error=%r",
                type(exc).__name__,
                exc,
            )
            return ""
        except Exception as exc:
            logger.warning(
                "RAG llm_router call_secondary_summary failed error_type=%s error=%r",
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
        primary_task = asyncio.create_task(self.call_primary(messages, temperature))
        secondary_task = asyncio.create_task(self.call_secondary(messages, temperature))

        def _discard_secondary_result(task: asyncio.Task) -> None:
            try:
                _ = task.result()
                logger.info("RAG llm_router call_both secondary_result_discarded=true")
            except Exception as exc:
                logger.info(
                    "RAG llm_router call_both secondary_discard_failed error_type=%s error=%r",
                    type(exc).__name__,
                    exc,
                )

        primary_text = ""
        try:
            primary_result = await primary_task
            primary_text = primary_result or ""
        except Exception as exc:
            logger.warning(
                "RAG llm_router call_both primary_unavailable error_type=%s error=%r",
                type(exc).__name__,
                exc,
            )

        if primary_text:
            logger.info("RAG llm_router call_both done selected=primary response_len=%s", len(primary_text))
            secondary_task.add_done_callback(_discard_secondary_result)
            return primary_text

        secondary_text = ""
        try:
            secondary_result = await secondary_task
            secondary_text = secondary_result or ""
        except Exception as exc:
            logger.warning(
                "RAG llm_router call_both secondary_unavailable error_type=%s error=%r",
                type(exc).__name__,
                exc,
            )

        if secondary_text:
            logger.info("RAG llm_router call_both done selected=secondary response_len=%s", len(secondary_text))
            return secondary_text

        raise RuntimeError(
            "No LLM response available: configure PRIMARY_MODEL_API_KEY/GROQ_API_KEY "
            "or LLAMA_MODEL_URL"
        )

llm_router = LLMRouter()
