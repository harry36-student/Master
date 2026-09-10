from __future__ import annotations
import logging
from typing import TYPE_CHECKING

import httpx
import openai

if TYPE_CHECKING:
    from backend.config import AppConfig

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are MedGemma, an expert medical AI assistant specializing in lung cancer histopathology.
You analyze H&E-stained lung tissue whole-slide images (WSI) and core biopsy sections,
and provide structured pathology reports based on DenseNet121 classification results and Grad-CAM heatmap findings.

Focus on histopathological features such as:
- Cellular morphology (nuclear atypia, pleomorphism, mitotic figures)
- Tissue architecture (glandular patterns, solid nests, lepidic growth)
- Stromal characteristics (desmoplasia, inflammation, necrosis)
- Regions highlighted by Grad-CAM as diagnostically significant

Always respond in the following exact format:

FINDINGS:
[Describe the histopathological features observed in the tissue section, referencing
cellular patterns, architectural features, and Grad-CAM highlighted regions]

IMPRESSION:
[Provide the pathological interpretation, including the most likely diagnosis
(e.g., Lung Adenocarcinoma, Squamous Cell Carcinoma, or Benign Tissue),
supported by the DenseNet121 confidence score and morphological evidence]

RECOMMENDATION:
[Suggest next steps such as IHC staining panels, molecular testing (EGFR/ALK/ROS1),
staging workup, or multidisciplinary tumor board review as appropriate]

Be precise, use standard surgical pathology terminology, and do not include any text
outside of these three sections."""


class LLMConnectionError(Exception):
    """Raised when the LLM service cannot be reached."""
    pass


class LLMTimeoutError(Exception):
    """Raised when the LLM service does not respond within the timeout."""
    pass


class LLMClient:
    """Calls MedGemma 1.5 via LM Studio's OpenAI-compatible API."""

    def __init__(self, config: "AppConfig") -> None:
        self.config = config
        self._client = self._build_client()

    def _build_client(self) -> openai.OpenAI:
        """
        建立 OpenAI 客戶端，指向 LM Studio 本地端點。
        使用 httpx.Client() 明確傳入，避免新版 openai SDK 的 proxies 參數衝突。
        timeout 設定為設定檔中的 llm_timeout_seconds。
        """
        timeout = httpx.Timeout(
            connect=10.0,                                    # 連線逾時 10 秒
            read=float(self.config.llm_timeout_seconds),    # 讀取逾時（等待 LLM 回應）
            write=10.0,                                      # 寫入逾時 10 秒
            pool=5.0,                                        # 連線池逾時 5 秒
        )
        http_client = httpx.Client(timeout=timeout)
        return openai.OpenAI(
            base_url=f"{self.config.lm_studio_url}/v1",
            api_key="lm-studio",   # LM Studio 不需要真實的 API key
            http_client=http_client,
        )

    def generate_report(self, prompt: str) -> str:
        """
        Send prompt to MedGemma and return the raw response text.

        Raises:
            LLMConnectionError: If the LM Studio server is unreachable.
            LLMTimeoutError: If the request exceeds llm_timeout_seconds.
        """
        try:
            response = self._client.chat.completions.create(
                model=self.config.llm_model_name,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=1024,
            )
            return response.choices[0].message.content or ""

        except openai.APITimeoutError as e:
            logger.error(f"LLM request timed out: {e}")
            raise LLMTimeoutError(
                f"Report generation timed out after {self.config.llm_timeout_seconds}s. "
                f"Please retry."
            )
        except (openai.APIConnectionError, httpx.ConnectError) as e:
            logger.error(f"LLM connection error: {e}")
            raise LLMConnectionError(
                f"Cannot connect to LM Studio at {self.config.lm_studio_url}. "
                f"Please ensure LM Studio is running."
            )
        except openai.APIError as e:
            logger.error(f"LLM API error: {e}")
            raise LLMConnectionError(f"LLM API error: {e}")
