from __future__ import annotations
import io
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from backend.models.schemas import ExportReportRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["report"])


@router.post("/export-report")
async def export_report(request: ExportReportRequest):
    """Export the structured report as PDF or plain text."""
    if request.format == "txt":
        content = (
            f"FINDINGS:\n{request.findings}\n\n"
            f"IMPRESSION:\n{request.impression}\n\n"
            f"RECOMMENDATION:\n{request.recommendation}\n"
        )
        return Response(
            content=content.encode("utf-8"),
            media_type="text/plain",
            headers={"Content-Disposition": "attachment; filename=medical_report.txt"},
        )
    elif request.format == "pdf":
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import cm
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
            from reportlab.lib import colors

            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4,
                                    rightMargin=2*cm, leftMargin=2*cm,
                                    topMargin=2*cm, bottomMargin=2*cm)
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle("Title", parent=styles["Heading1"],
                                         textColor=colors.HexColor("#00BCD4"))
            section_style = ParagraphStyle("Section", parent=styles["Heading2"],
                                           textColor=colors.HexColor("#0F1923"))
            body_style = styles["Normal"]

            story = [
                Paragraph("Lung Cancer Analysis Report", title_style),
                Spacer(1, 0.5*cm),
                Paragraph("FINDINGS", section_style),
                Paragraph(request.findings.replace("\n", "<br/>"), body_style),
                Spacer(1, 0.3*cm),
                Paragraph("IMPRESSION", section_style),
                Paragraph(request.impression.replace("\n", "<br/>"), body_style),
                Spacer(1, 0.3*cm),
                Paragraph("RECOMMENDATION", section_style),
                Paragraph(request.recommendation.replace("\n", "<br/>"), body_style),
            ]
            doc.build(story)
            buffer.seek(0)
            return Response(
                content=buffer.read(),
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=medical_report.pdf"},
            )
        except Exception as e:
            logger.error(f"PDF generation error: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'pdf' or 'txt'.")
