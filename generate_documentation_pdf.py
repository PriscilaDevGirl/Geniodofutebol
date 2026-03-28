from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import ListFlowable, ListItem, Paragraph, Preformatted, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parent
INPUT_FILE = ROOT / "documentacao.md"
OUTPUT_FILE = ROOT / "documentacao_jurados.pdf"


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="TitleCenter",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=19,
            leading=23,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#0b1f33"),
            spaceAfter=16,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Heading1Custom",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#0f4c81"),
            spaceBefore=12,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Heading2Custom",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11.5,
            leading=14,
            textColor=colors.HexColor("#1d3557"),
            spaceBefore=9,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodyCustom",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.8,
            leading=13.2,
            textColor=colors.HexColor("#202124"),
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CodeCustom",
            parent=styles["Code"],
            fontName="Courier",
            fontSize=8.3,
            leading=10.1,
            backColor=colors.HexColor("#f4f7fb"),
            borderPadding=6,
            borderColor=colors.HexColor("#d9e2ec"),
            borderWidth=0.6,
            borderRadius=4,
            spaceBefore=6,
            spaceAfter=8,
        )
    )
    return styles


def flush_bullets(story, bullet_buffer, styles):
    if not bullet_buffer:
        return
    items = [
        ListItem(Paragraph(item, styles["BodyCustom"]), leftIndent=10)
        for item in bullet_buffer
    ]
    story.append(
        ListFlowable(
            items,
            bulletType="bullet",
            leftIndent=14,
            bulletFontName="Helvetica",
            bulletFontSize=9,
            bulletOffsetY=1,
        )
    )
    story.append(Spacer(1, 0.12 * cm))
    bullet_buffer.clear()


def parse_markdown(lines, styles):
    story = []
    bullet_buffer = []
    in_code_block = False
    code_lines = []

    for raw_line in lines:
        line = raw_line.rstrip("\n")
        stripped = line.strip()

        if stripped.startswith("```"):
            flush_bullets(story, bullet_buffer, styles)
            if in_code_block:
                story.append(Preformatted("\n".join(code_lines), styles["CodeCustom"]))
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        if not stripped:
            flush_bullets(story, bullet_buffer, styles)
            story.append(Spacer(1, 0.14 * cm))
            continue

        if stripped.startswith("- "):
            bullet_buffer.append(stripped[2:].strip())
            continue

        flush_bullets(story, bullet_buffer, styles)

        if stripped.startswith("# "):
            story.append(Paragraph(stripped[2:].strip(), styles["TitleCenter"]))
        elif stripped.startswith("## "):
            story.append(Paragraph(stripped[3:].strip(), styles["Heading1Custom"]))
        elif stripped.startswith("### "):
            story.append(Paragraph(stripped[4:].strip(), styles["Heading2Custom"]))
        else:
            story.append(Paragraph(stripped, styles["BodyCustom"]))

    flush_bullets(story, bullet_buffer, styles)
    if code_lines:
        story.append(Preformatted("\n".join(code_lines), styles["CodeCustom"]))
    return story


def add_page_decor(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(colors.HexColor("#0f4c81"))
    canvas.rect(0, height - 24, width, 24, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#7a8a99"))
    canvas.setFont("Helvetica", 8)
    canvas.drawString(1.8 * cm, 1.2 * cm, "Documentacao Tecnica para Jurados")
    canvas.drawRightString(width - 1.8 * cm, 1.2 * cm, f"Pagina {doc.page}")
    canvas.restoreState()


def main():
    styles = build_styles()
    lines = INPUT_FILE.read_text(encoding="utf-8").splitlines()
    story = parse_markdown(lines, styles)

    doc = SimpleDocTemplate(
        str(OUTPUT_FILE),
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=1.8 * cm,
        bottomMargin=1.6 * cm,
        title="Documentacao Tecnica para Jurados",
        author="Codex",
    )
    doc.build(story, onFirstPage=add_page_decor, onLaterPages=add_page_decor)


if __name__ == "__main__":
    main()
