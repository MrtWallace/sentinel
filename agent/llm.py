import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parent / ".env")


class LLMClient(Protocol):
    def complete_json(self, system_prompt: str, user_prompt: str) -> dict:
        ...


@dataclass
class OpenAICompatibleConfig:
    base_url: str
    api_key: str
    model: str
    timeout_seconds: float = 15
    temperature: float = 0

    @classmethod
    def from_env(cls):
        return cls(
            base_url=os.getenv("LLM_BASE_URL", "https://api.deepseek.com"),
            api_key=os.getenv("LLM_API_KEY", ""),
            model=os.getenv("LLM_MODEL", "deepseek-chat"),
            timeout_seconds=float(os.getenv("LLM_TIMEOUT_SECONDS", "15")),
            temperature=float(os.getenv("LLM_TEMPERATURE", "0")),
        )


class OpenAICompatibleLLMClient:
    def __init__(self, config: OpenAICompatibleConfig | None = None):
        self.config = config or OpenAICompatibleConfig.from_env()

    def complete_json(self, system_prompt: str, user_prompt: str) -> dict:
        if not self.config.api_key:
            raise RuntimeError("Missing LLM_API_KEY")

        from openai import OpenAI

        client = OpenAI(
            api_key=self.config.api_key,
            base_url=self.config.base_url,
            timeout=self.config.timeout_seconds,
        )
        response = client.chat.completions.create(
            model=self.config.model,
            temperature=self.config.temperature,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        content = response.choices[0].message.content or ""
        return extract_json_object(content)


def extract_json_object(text: str) -> dict:
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise ValueError("LLM response did not contain a JSON object")
        parsed = json.loads(match.group())

    if not isinstance(parsed, dict):
        raise ValueError("LLM response JSON must be an object")

    return parsed


def build_default_llm_client() -> LLMClient:
    provider = os.getenv("LLM_PROVIDER", "openai_compatible").lower()
    if provider != "openai_compatible":
        raise RuntimeError(f"Unsupported LLM_PROVIDER: {provider}")
    return OpenAICompatibleLLMClient()
