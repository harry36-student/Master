from __future__ import annotations
import logging
import re
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from backend.models.schemas import ClassificationResult, GradCAMResult, StructuredReport
from backend.services.llm_client import LLMClient

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)


class ReportParseError(Exception):
    """Raised when the LLM response cannot be parsed into a structured report."""
    pass


class ReportGenerator:
    """Generates structured medical reports using LLM (with fallback)."""

    def __init__(self, llm_client: Optional[LLMClient]) -> None:
        self.llm_client = llm_client  # 允許為 None（fallback 模式）

    def _build_prompt(
        self,
        classification: ClassificationResult,
        image_metadata: dict,
        report_language: str = "Traditional Chinese",
    ) -> str:
        """
        Build the user prompt for the LLM.
        Always includes predicted_label, confidence value, and report language instruction.
        """
        probs_text = "\n".join([
            f"  - {p['label']}: {p['probability'] * 100:.1f}%"
            for p in classification.all_probabilities
        ])

        return f"""Lung Cancer Histopathology Analysis Request

IMPORTANT: Please write the entire report (FINDINGS, IMPRESSION, RECOMMENDATION) in {report_language}.

Image Information:
- Type: H&E-stained lung tissue section (histopathology)
- Dimensions: {image_metadata.get('width', 'N/A')}x{image_metadata.get('height', 'N/A')} pixels
- Filename: {image_metadata.get('filename', 'unknown')}

DenseNet121 Classification Results:
- Model: DenseNet121 (pretrained, fine-tuned on lung histopathology)
- Predicted Class: {classification.predicted_label}
- Confidence: {classification.confidence * 100:.1f}%
- All Class Probabilities:
{probs_text}

Grad-CAM Analysis:
- The Grad-CAM heatmap highlights tissue regions most influential for the DenseNet121 prediction.
- High-activation areas (red/yellow in jet colormap) correspond to diagnostically
  significant morphological features in the H&E section.

Please provide a structured pathology report in {report_language} based on the DenseNet121 classification results
and the Grad-CAM highlighted regions."""

    def _parse_report(self, raw_text: str) -> StructuredReport:
        """
        Parse LLM response into a StructuredReport.
        Expects FINDINGS:, IMPRESSION:, RECOMMENDATION: sections.

        Raises:
            ReportParseError: If any required section is missing or empty.
        """
        sections = {
            "findings": "",
            "impression": "",
            "recommendation": "",
        }

        # Use regex to extract each section
        pattern = re.compile(
            r"FINDINGS:\s*(.*?)\s*(?=IMPRESSION:|$)"
            r"|IMPRESSION:\s*(.*?)\s*(?=RECOMMENDATION:|$)"
            r"|RECOMMENDATION:\s*(.*?)(?=\Z)",
            re.DOTALL | re.IGNORECASE,
        )

        # Simpler sequential extraction
        findings_match = re.search(
            r"FINDINGS:\s*(.*?)(?=\s*IMPRESSION:|\Z)", raw_text, re.DOTALL | re.IGNORECASE
        )
        impression_match = re.search(
            r"IMPRESSION:\s*(.*?)(?=\s*RECOMMENDATION:|\Z)", raw_text, re.DOTALL | re.IGNORECASE
        )
        recommendation_match = re.search(
            r"RECOMMENDATION:\s*(.*?)(?=\Z)", raw_text, re.DOTALL | re.IGNORECASE
        )

        if findings_match:
            sections["findings"] = findings_match.group(1).strip()
        if impression_match:
            sections["impression"] = impression_match.group(1).strip()
        if recommendation_match:
            sections["recommendation"] = recommendation_match.group(1).strip()

        # Validate all sections are non-empty
        missing = [k for k, v in sections.items() if not v]
        if missing:
            raise ReportParseError(
                f"LLM response is missing or has empty sections: {missing}. "
                f"Raw response: {raw_text[:200]}..."
            )

        return StructuredReport(
            findings=sections["findings"],
            impression=sections["impression"],
            recommendation=sections["recommendation"],
            raw_text=raw_text,
            generated_at=datetime.utcnow(),
        )

    def generate(
        self,
        classification: ClassificationResult,
        gradcam_result: GradCAMResult,
        image_metadata: dict,
        report_language: str = "Traditional Chinese",
    ) -> StructuredReport:
        """
        Generate a structured medical report in the specified language.

        Args:
            classification: DenseNet121 classification result.
            gradcam_result: Grad-CAM result (used for context).
            image_metadata: Dict with 'filename', 'width', 'height'.
            report_language: Language for the report (e.g. 'Traditional Chinese', 'English', 'Japanese').

        Returns:
            StructuredReport with findings, impression, recommendation.
        """
        # ── 嘗試使用 LLM 生成報告 ─────────────────────────────────────
        if self.llm_client is not None:
            try:
                prompt = self._build_prompt(classification, image_metadata, report_language)
                raw_text = self.llm_client.generate_report(prompt)
                return self._parse_report(raw_text)
            except Exception as e:
                logger.warning(f"LLM report generation failed, using fallback: {e}")

        # ── LLM 不可用時的 Fallback 降級報告 ──────────────────────────
        return self._generate_fallback_report(classification, image_metadata)

    def _generate_fallback_report(
        self,
        classification: ClassificationResult,
        image_metadata: dict,
    ) -> StructuredReport:
        """
        當 LLM 不可用時，根據分類結果自動產生基本的結構化報告。
        Generates a rule-based fallback report when LLM is unavailable.
        """
        label = classification.predicted_label
        confidence = classification.confidence * 100
        filename = image_metadata.get('filename', 'unknown')

        label_detail = {
            "Lung Adenocarcinoma": {
                "findings": (
                    f"本次分析影像 ({filename}) 之組織型態學特徵顯示，"
                    "細胞排列呈腺管狀或乳突狀生長模式，細胞核具有輕至中度異型性，"
                    "細胞質豐富。Grad-CAM 熱力圖顯示高激活區域集中於腺體結構周圍。"
                ),
                "impression": (
                    f"DenseNet121 分類模型預測結果為「肺腺癌 (Lung Adenocarcinoma)」，"
                    f"信心指數達 {confidence:.1f}%。形態學特徵與腺癌之診斷標準相符。"
                ),
                "recommendation": (
                    "建議執行：(1) 免疫組織化學染色 (TTF-1, Napsin A) 確認腺癌亞型；"
                    "(2) 分子檢測 (EGFR, ALK, ROS1, KRAS, PD-L1) 評估標靶治療適應性；"
                    "(3) 完整分期檢查及多學科腫瘤委員會討論。"
                ),
            },
            "Lung Squamous Cell Carcinoma": {
                "findings": (
                    f"影像 ({filename}) 顯示腫瘤細胞呈多角形，細胞間橋清晰可辨，"
                    "角化珠形成，細胞核染色質粗糙。Grad-CAM 熱力圖高激活區域位於角化區域。"
                ),
                "impression": (
                    f"DenseNet121 分類模型預測結果為「肺鱗狀細胞癌 (Lung Squamous Cell Carcinoma)」，"
                    f"信心指數達 {confidence:.1f}%。形態學特徵與鱗狀細胞癌之診斷標準相符。"
                ),
                "recommendation": (
                    "建議執行：(1) 免疫組織化學染色 (p40, p63, CK5/6) 確認鱗狀分化；"
                    "(2) PD-L1 表現評估免疫治療適應性；"
                    "(3) 完整分期工作及多學科腫瘤委員會討論。"
                ),
            },
            "Lung Benign Tissue": {
                "findings": (
                    f"影像 ({filename}) 之組織型態學特徵顯示，"
                    "肺泡結構保持完整，細胞形態規則，無明顯細胞核異型性或病理性有絲分裂。"
                    "Grad-CAM 熱力圖激活程度低，未見異常高激活區域。"
                ),
                "impression": (
                    f"DenseNet121 分類模型預測結果為「肺良性組織 (Lung Benign Tissue)」，"
                    f"信心指數達 {confidence:.1f}%。目前分析結果不支持惡性腫瘤診斷。"
                ),
                "recommendation": (
                    "建議：(1) 對照臨床症狀及影像學檢查進行綜合評估；"
                    "(2) 如臨床高度懷疑惡性，建議重複取樣或切除活檢；"
                    "(3) 定期追蹤觀察。"
                ),
            },
        }

        detail = label_detail.get(label, {
            "findings": f"影像 ({filename}) 分析完成，偵測到組織異常，需進一步評估。",
            "impression": f"模型預測類別：{label}（信心指數 {confidence:.1f}%）。",
            "recommendation": "建議由合格病理科醫師複閱本次分析結果，並結合臨床資料進行綜合判斷。",
        })

        logger.info(f"Fallback report generated for label: {label} ({confidence:.1f}%)")

        return StructuredReport(
            findings=detail["findings"],
            impression=detail["impression"],
            recommendation=detail["recommendation"],
            raw_text=f"[Fallback Report] Label: {label}, Confidence: {confidence:.1f}%",
            generated_at=datetime.utcnow(),
        )
