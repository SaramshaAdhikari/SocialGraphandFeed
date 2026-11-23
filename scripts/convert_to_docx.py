#!/usr/bin/env python3
"""
convert_to_docx.py
Converts FINAL_QA_REPORT.md into a professionally styled Microsoft Word document (FINAL_QA_REPORT.docx)
adhering to academic formatting standards and strict institutional requirements.

Formatting Specifications:
- Document Format: A4 (210 x 297 mm), 1-inch (25.4 mm) margins.
- Font Family: Times New Roman throughout body, headings, and table cells.
- Body Text: 12 pt, 1.5 line spacing, 6 pt after.
- Headings: Bold Times New Roman in Navy (#1E3A8A) / Dark Slate (#0F172A).
- Code Blocks: Consolas 9.5 pt, shaded box (#F8FAFC), 1pt border.
- Tables: Dark Navy (#1E3A8A) header with white text, alternating zebra striping (#F8FAFC), cell padding.
- Embedded Screenshots: Full-width (5.8 inches), centered, with academic figure captions.
- Title Page & Table of Contents: Academic title block, metadata summary table, different first page header/footer.
- Header & Footer: Document title header, dynamic page numbering ("Page X of Y").
"""

import os
import sys
import re
from PIL import Image
import docx
from docx.shared import Inches, Pt, RGBColor, Mm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

BASE_DIR = r"C:\Users\saram\Projects\SocialGraphandFeed_Testing"
MD_FILE = os.path.join(BASE_DIR, "FINAL_QA_REPORT.md")
DOCX_FILE = os.path.join(BASE_DIR, "FINAL_QA_REPORT.docx")

# Colors
COLOR_PRIMARY_NAVY = RGBColor(30, 58, 138)    # #1E3A8A
COLOR_DARK_SLATE = RGBColor(15, 23, 42)      # #0F172A
COLOR_MUTED_GRAY = RGBColor(100, 116, 139)   # #64748B
COLOR_WHITE = RGBColor(255, 255, 255)
COLOR_PASS_GREEN = RGBColor(21, 128, 61)     # #15803D
COLOR_FAIL_RED = RGBColor(185, 28, 28)       # #B91C1C
COLOR_WARN_AMBER = RGBColor(180, 83, 9)      # #B45309

HEX_PRIMARY_NAVY = "1E3A8A"
HEX_LIGHT_BG = "F8FAFC"
HEX_BORDER = "CBD5E1"
HEX_CALLOUT_BG = "EFF6FF"
HEX_CALLOUT_BORDER = "2563EB"

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:left w:val="none"/>
            <w:right w:val="none"/>
            <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def set_callout_borders(table, border_color="2563EB", bg_color="EFF6FF"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:bottom w:val="none"/>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
            <w:right w:val="none"/>
            <w:insideH w:val="none"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)
    cell = table.cell(0, 0)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)

def set_code_block_borders(table):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
            <w:insideH w:val="none"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)
    cell = table.cell(0, 0)
    set_cell_background(cell, "F8FAFC")
    set_cell_margins(cell, top=100, bottom=100, left=160, right=160)

def add_footer_page_fields(paragraph):
    p = paragraph._p
    # Run 1: "Page "
    r1 = paragraph.add_run("Page ")
    r1.font.name = "Times New Roman"
    r1.font.size = Pt(10)
    r1.font.color.rgb = COLOR_MUTED_GRAY
    
    # Field: PAGE
    fld1 = parse_xml(r'<w:fldSimple %s w:instr="PAGE"/>' % nsdecls('w'))
    p.append(fld1)
    
    # Run 2: " of "
    r2 = paragraph.add_run(" of ")
    r2.font.name = "Times New Roman"
    r2.font.size = Pt(10)
    r2.font.color.rgb = COLOR_MUTED_GRAY
    
    # Field: NUMPAGES
    fld2 = parse_xml(r'<w:fldSimple %s w:instr="NUMPAGES"/>' % nsdecls('w'))
    p.append(fld2)

def find_image_file(base_dir, img_ref):
    if not img_ref:
        return None
    cleaned = img_ref.replace("file:///", "").replace("file://", "").replace("/", os.sep)
    if os.path.isabs(cleaned) and os.path.isfile(cleaned):
        return cleaned
    
    rel_path = os.path.join(base_dir, cleaned)
    if os.path.isfile(rel_path):
        return rel_path
    
    filename = os.path.basename(cleaned)
    search_dirs = [
        os.path.join(base_dir, "SCREENSHOTS", "LOCAL_E2E"),
        os.path.join(base_dir, "packages", "frontend", "dist"),
        os.path.join(base_dir, "SCREENSHOTS", "BOUNDARY_VALUE_ANALYSIS"),
        os.path.join(base_dir, "SCREENSHOTS", "NEGATIVE_TESTING"),
        os.path.join(base_dir, "SCREENSHOTS", "BLACK_BOX"),
        os.path.join(base_dir, "SCREENSHOTS", "WHITE_BOX"),
    ]
    for sdir in search_dirs:
        if os.path.exists(sdir):
            for root, _, files in os.walk(sdir):
                if filename in files:
                    return os.path.join(root, filename)
    return None

def add_scaled_picture(doc, img_path):
    p_img = doc.add_paragraph()
    p_img.paragraph_format.space_before = Pt(8)
    p_img.paragraph_format.space_after = Pt(2)
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_img = p_img.add_run()
    try:
        with Image.open(img_path) as im:
            w_px, h_px = im.size
            aspect = h_px / w_px
    except Exception:
        aspect = 0.625

    if aspect > 1.2:
        r_img.add_picture(img_path, height=Inches(4.8))
    else:
        r_img.add_picture(img_path, width=Inches(5.8))

def format_inline_runs(paragraph, text, base_font_size=12, is_italic=False, default_color=COLOR_DARK_SLATE):
    """
    Parses Markdown inline styling (**bold**, *italic*, `code`, [link](url)) and emits formatted Runs.
    """
    pattern = re.compile(r'(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))')
    parts = pattern.split(text)
    for part in parts:
        if not part:
            continue
        if part.startswith("**") and part.endswith("**") and len(part) >= 4:
            run = paragraph.add_run(part[2:-2])
            run.font.name = "Times New Roman"
            run.font.size = Pt(base_font_size)
            run.font.bold = True
            run.font.color.rgb = default_color
        elif part.startswith("*") and part.endswith("*") and len(part) >= 2:
            run = paragraph.add_run(part[1:-1])
            run.font.name = "Times New Roman"
            run.font.size = Pt(base_font_size)
            run.font.italic = True
            run.font.color.rgb = default_color
        elif part.startswith("`") and part.endswith("`") and len(part) >= 2:
            run = paragraph.add_run(part[1:-1])
            run.font.name = "Consolas"
            run.font.size = Pt(base_font_size - 1.5)
            run.font.color.rgb = RGBColor(30, 41, 59)
        elif part.startswith("[") and "](" in part and part.endswith(")"):
            m = re.match(r'\[(.*?)\]\((.*?)\)', part)
            if m:
                label = m.group(1)
                run = paragraph.add_run(label)
                run.font.name = "Times New Roman"
                run.font.size = Pt(base_font_size)
                run.font.underline = True
                run.font.color.rgb = COLOR_PRIMARY_NAVY
            else:
                run = paragraph.add_run(part)
                run.font.name = "Times New Roman"
                run.font.size = Pt(base_font_size)
                run.font.color.rgb = default_color
        else:
            run = paragraph.add_run(part)
            run.font.name = "Times New Roman"
            run.font.size = Pt(base_font_size)
            run.font.italic = is_italic
            run.font.color.rgb = default_color

def build_cover_page(doc):
    cover_p1 = doc.add_paragraph()
    cover_p1.paragraph_format.space_before = Pt(36)
    cover_p1.paragraph_format.space_after = Pt(8)
    cover_p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_inst = cover_p1.add_run("SOFTWARE QUALITY ASSURANCE & VERIFICATION AUDIT")
    r_inst.font.name = "Times New Roman"
    r_inst.font.size = Pt(11)
    r_inst.font.bold = True
    r_inst.font.color.rgb = COLOR_PRIMARY_NAVY

    cover_p2 = doc.add_paragraph()
    cover_p2.paragraph_format.space_before = Pt(12)
    cover_p2.paragraph_format.space_after = Pt(12)
    cover_p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = cover_p2.add_run("FORMAL SOFTWARE TESTING &\nQUALITY ASSURANCE REPORT")
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(24)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_DARK_SLATE

    cover_p3 = doc.add_paragraph()
    cover_p3.paragraph_format.space_before = Pt(4)
    cover_p3.paragraph_format.space_after = Pt(18)
    cover_p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = cover_p3.add_run("SocialGraph & Feed Engineering Platform")
    r_sub.font.name = "Times New Roman"
    r_sub.font.size = Pt(16)
    r_sub.font.bold = True
    r_sub.font.color.rgb = COLOR_MUTED_GRAY

    cover_p4 = doc.add_paragraph()
    cover_p4.paragraph_format.space_before = Pt(0)
    cover_p4.paragraph_format.space_after = Pt(36)
    cover_p4.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_desc = cover_p4.add_run("High-Concurrency Social Network with Dual-Strategy Feed Architecture\nInspired by Meta TAO (The Associations and Objects) Distributed Data Model")
    r_desc.font.name = "Times New Roman"
    r_desc.font.size = Pt(11)
    r_desc.font.italic = True
    r_desc.font.color.rgb = COLOR_MUTED_GRAY

    # Metadata Table
    meta_table = doc.add_table(rows=8, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(meta_table, color="94A3B8", sz="6")

    meta_items = [
        ("Architecture Model", "Meta TAO Hybrid Feed (Fan-Out-On-Write / Fan-Out-On-Read)"),
        ("Deployed Baseline Commit", "94540883ab99b8862ac995fa9afebc2e9eadaa16"),
        ("Application Code Freeze", "Strict Freeze Maintained (Zero Changes to Application Source)"),
        ("Evaluation Environment", "Isolated Testing Workspace (SocialGraphandFeed_Testing)"),
        ("Automated Vitest Cases", "527 Distinct Cases (232 Backend Passed, 3 Failed; 292 Frontend Passed)"),
        ("Browser E2E Workflows", "10 Automated Playwright User Journeys on Chrome (10 Passed)"),
        ("Schema Boundary Assertions", "32 TypeBox Boundary Value Analysis Conditions (32 Passed)"),
        ("Production Security Probes", "5 Cloud Audits on Render (4 Passed, 1 Documented Finding SEC-005)"),
    ]

    for idx, (label, val) in enumerate(meta_items):
        cell_lbl = meta_table.cell(idx, 0)
        cell_val = meta_table.cell(idx, 1)
        
        cell_lbl.width = Inches(2.2)
        cell_val.width = Inches(4.0)

        set_cell_background(cell_lbl, "F1F5F9" if idx % 2 == 0 else "FFFFFF")
        set_cell_background(cell_val, "F8FAFC" if idx % 2 == 0 else "FFFFFF")
        set_cell_margins(cell_lbl, top=80, bottom=80, left=120, right=120)
        set_cell_margins(cell_val, top=80, bottom=80, left=120, right=120)

        p_lbl = cell_lbl.paragraphs[0]
        p_lbl.paragraph_format.space_after = Pt(2)
        r_l = p_lbl.add_run(label)
        r_l.font.name = "Times New Roman"
        r_l.font.size = Pt(10)
        r_l.font.bold = True
        r_l.font.color.rgb = COLOR_DARK_SLATE

        p_val = cell_val.paragraphs[0]
        p_val.paragraph_format.space_after = Pt(2)
        r_v = p_val.add_run(val)
        r_v.font.name = "Times New Roman"
        r_v.font.size = Pt(10)
        r_v.font.color.rgb = COLOR_DARK_SLATE

    cov_foot = doc.add_paragraph()
    cov_foot.paragraph_format.space_before = Pt(48)
    cov_foot.paragraph_format.space_after = Pt(0)
    cov_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_auth = cov_foot.add_run("Lead QA & Verification Engineering • Academic Submission • November 2026")
    r_auth.font.name = "Times New Roman"
    r_auth.font.size = Pt(10)
    r_auth.font.italic = True
    r_auth.font.color.rgb = COLOR_MUTED_GRAY

    doc.add_page_break()

def build_toc_page(doc):
    toc_head = doc.add_paragraph()
    toc_head.paragraph_format.space_before = Pt(12)
    toc_head.paragraph_format.space_after = Pt(12)
    r = toc_head.add_run("Table of Contents")
    r.font.name = "Times New Roman"
    r.font.size = Pt(18)
    r.font.bold = True
    r.font.color.rgb = COLOR_PRIMARY_NAVY

    toc_items = [
        ("1. PART A — Project Report", [
            ("1.1 Abstract", "Executive overview and core testing parameters"),
            ("1.2 Introduction & Architectural Overview", "Meta TAO inspiration and multi-tier topologies"),
            ("1.3 Hardware and Software Requirements", "Host specifications, Docker WSL2, and port matrix"),
            ("1.4 Module Descriptions", "7 functional subsystems from auth to generative UI"),
            ("1.5 System Execution & Local Reproduction", "Step-by-step local launch commands and validation"),
            ("1.6 Future Enhancements & Architectural Roadmap", "Five key production roadmap objectives"),
        ]),
        ("2. PART B — Software Testing & Quality Assurance", [
            ("2.1 Quality Assurance Methodology & Unified Scorecard", "Comprehensive testing scorecard across all tiers"),
            ("2.2 Black Box Testing Techniques", "13 techniques: Functional, Integration, System, BVA, Security, etc."),
            ("2.3 White Box Testing Techniques", "9 techniques: Unit, Statement, Branch, Cyclomatic Complexity, etc."),
        ]),
        ("3. PART C — Consolidated Defect & Risk Audit", [
            ("3.1 Defect Classification & Root-Cause Matrix", "Formal triage of all findings by severity and cause"),
            ("3.2 Analysis of the Three Backend Integration Failures", "Code-level forensic analysis of BE-INT-001/002/003"),
            ("3.3 Analysis of Production Security Finding SEC-005", "Audit of missing CSP/X-Frame-Options on root SPA"),
            ("3.4 Residual Risk Assessment & Final Sign-Off", "Final quality assessment and formal verification verdict"),
        ])
    ]

    for part_title, subitems in toc_items:
        p_part = doc.add_paragraph()
        p_part.paragraph_format.space_before = Pt(10)
        p_part.paragraph_format.space_after = Pt(2)
        r_pt = p_part.add_run(part_title)
        r_pt.font.name = "Times New Roman"
        r_pt.font.size = Pt(12)
        r_pt.font.bold = True
        r_pt.font.color.rgb = COLOR_PRIMARY_NAVY

        for sub_id_title, desc in subitems:
            p_sub = doc.add_paragraph()
            p_sub.paragraph_format.left_indent = Inches(0.3)
            p_sub.paragraph_format.space_before = Pt(1)
            p_sub.paragraph_format.space_after = Pt(2)
            
            r_st = p_sub.add_run(sub_id_title)
            r_st.font.name = "Times New Roman"
            r_st.font.size = Pt(10.5)
            r_st.font.bold = True
            r_st.font.color.rgb = COLOR_DARK_SLATE

            r_sp = p_sub.add_run(" — ")
            r_sp.font.name = "Times New Roman"
            r_sp.font.size = Pt(10.5)
            r_sp.font.color.rgb = COLOR_MUTED_GRAY

            r_d = p_sub.add_run(desc)
            r_d.font.name = "Times New Roman"
            r_d.font.size = Pt(10.5)
            r_d.font.italic = True
            r_d.font.color.rgb = COLOR_MUTED_GRAY

    doc.add_page_break()

def parse_markdown_and_build_docx(md_path, docx_path):
    print("Reading markdown:", md_path)
    with open(md_path, "r", encoding="utf-8") as f:
        content = f.read()

    doc = docx.Document()

    # Configure A4 page and 1-inch margins
    section = doc.sections[0]
    section.page_width = Mm(210)
    section.page_height = Mm(297)
    section.top_margin = Mm(25.4)
    section.bottom_margin = Mm(25.4)
    section.left_margin = Mm(25.4)
    section.right_margin = Mm(25.4)

    # Different first page for cover
    section.different_first_page_header_footer = True

    # Configure Header
    header = section.header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    hr = hp.add_run("SocialGraph & Feed Engineering Platform — Quality Assurance & Testing Report")
    hr.font.name = "Times New Roman"
    hr.font.size = Pt(8.5)
    hr.font.italic = True
    hr.font.color.rgb = COLOR_MUTED_GRAY

    # Configure Footer
    footer = section.footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    add_footer_page_fields(fp)

    # Build Cover & TOC
    print("Building cover page...")
    build_cover_page(doc)
    print("Building Table of Contents...")
    build_toc_page(doc)

    lines = content.split("\n")
    idx = 0
    total_lines = len(lines)

    # Skip initial YAML / title up to line starting with "# PART A"
    while idx < total_lines:
        line = lines[idx]
        if line.strip().startswith("# PART A"):
            break
        idx += 1

    in_code_block = False
    code_block_lines = []
    code_block_lang = ""

    figure_counter = 1

    e2e_screenshots = [
        ("LOCAL_E2E_001", "LOCAL_E2E_001_AUTH_INVALID.png", "Authentication Negative Test — Invalid Login Banner"),
        ("LOCAL_E2E_002", "LOCAL_E2E_002_REGISTRATION_SUCCESS.png", "User Registration Journey — Profile Initialization"),
        ("LOCAL_E2E_003", "LOCAL_E2E_003_LOGIN_SESSION.png", "Session Restoration & Navigation Bar User State"),
        ("LOCAL_E2E_004", "LOCAL_E2E_004_FEED_DELIVERY.png", "Home Feed Delivery — Top Tab Filter Execution"),
        ("LOCAL_E2E_005", "LOCAL_E2E_005_POST_COMPOSER.png", "Rich Content Creation — Post Composer with Tags"),
        ("LOCAL_E2E_006", "LOCAL_E2E_006_POST_PUBLISHED.png", "Post Mutation Success — Redirect to Unique Permalink"),
        ("LOCAL_E2E_007", "LOCAL_E2E_007_COMMENT_ENGAGEMENT.png", "Interactive Discussion — Comment Thread Submission"),
        ("LOCAL_E2E_008", "LOCAL_E2E_008_SOCIAL_GRAPH_FOLLOW.png", "Directed Social Graph — Atomic Follow Relationship Mutation"),
        ("LOCAL_E2E_009", "LOCAL_E2E_009_UNIVERSAL_SEARCH.png", "Universal Search Engine — Query q=systems Result Cards"),
        ("LOCAL_E2E_010", "LOCAL_E2E_010_THEME_CUSTOMIZATION.png", "Appearance Customization — Client Theme Switcher Context"),
    ]

    acceptance_screenshots = [
        ("ACC-001", "acceptance_mobile_390_home.png", "Mobile Viewport (390x844) Responsive Layout & Bottom Navigation"),
        ("ACC-002", "acceptance_desktop_1440_home.png", "Desktop Viewport (1440x900) Three-Column Rail Layout"),
        ("ACC-003", "acceptance_desktop_1440_discover_masonry.png", "Discover Masonry Grid Dynamic Column Calculation"),
        ("ACC-004", "acceptance_post_modal_discussion.png", "Discussion Thread Permalinks & Interactive Modal View"),
    ]

    current_h2_or_h3 = ""

    while idx < total_lines:
        line = lines[idx]
        stripped = line.strip()

        # Handle Code Blocks
        if stripped.startswith("```"):
            if not in_code_block:
                in_code_block = True
                code_block_lang = stripped[3:].strip()
                code_block_lines = []
                idx += 1
                continue
            else:
                in_code_block = False
                code_text = "\n".join(code_block_lines)
                table = doc.add_table(rows=1, cols=1)
                table.alignment = WD_TABLE_ALIGNMENT.CENTER
                set_code_block_borders(table)
                cell = table.cell(0, 0)
                cell.width = Inches(6.2)
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(2)
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.line_spacing = 1.0
                run = p.add_run(code_text)
                run.font.name = "Consolas"
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(15, 23, 42)

                sp = doc.add_paragraph()
                sp.paragraph_format.space_before = Pt(0)
                sp.paragraph_format.space_after = Pt(4)
                idx += 1
                continue

        if in_code_block:
            code_block_lines.append(line)
            idx += 1
            continue

        # Handle Markdown Tables
        if stripped.startswith("|") and stripped.endswith("|"):
            table_lines = []
            while idx < total_lines and lines[idx].strip().startswith("|") and lines[idx].strip().endswith("|"):
                table_lines.append(lines[idx].strip())
                idx += 1

            if len(table_lines) >= 2:
                raw_header = [c.strip() for c in table_lines[0].strip("|").split("|")]
                data_rows = []
                for r_line in table_lines[2:]:
                    row_cells = [c.strip() for c in r_line.strip("|").split("|")]
                    while len(row_cells) < len(raw_header):
                        row_cells.append("")
                    data_rows.append(row_cells[:len(raw_header)])

                num_cols = len(raw_header)
                num_rows = len(data_rows) + 1

                t = doc.add_table(rows=num_rows, cols=num_cols)
                t.alignment = WD_TABLE_ALIGNMENT.CENTER
                set_table_borders(t, color=HEX_BORDER, sz="4")

                # Format Header
                for c_idx, h_text in enumerate(raw_header):
                    cell = t.cell(0, c_idx)
                    set_cell_background(cell, HEX_PRIMARY_NAVY)
                    set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
                    p = cell.paragraphs[0]
                    p.paragraph_format.space_before = Pt(1)
                    p.paragraph_format.space_after = Pt(2)
                    p.paragraph_format.line_spacing = 1.15
                    format_inline_runs(p, h_text, base_font_size=10, default_color=COLOR_WHITE)
                    for r in p.runs:
                        r.font.bold = True

                # Format Data Rows
                for r_idx, row_data in enumerate(data_rows):
                    row_num = r_idx + 1
                    bg_col = "FFFFFF" if r_idx % 2 == 0 else HEX_LIGHT_BG
                    for c_idx, cell_text in enumerate(row_data):
                        cell = t.cell(row_num, c_idx)
                        set_cell_background(cell, bg_col)
                        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
                        p = cell.paragraphs[0]
                        p.paragraph_format.space_before = Pt(1)
                        p.paragraph_format.space_after = Pt(2)
                        p.paragraph_format.line_spacing = 1.15

                        upper_text = cell_text.upper()
                        if "PASS" in upper_text:
                            format_inline_runs(p, cell_text, base_font_size=9.5, default_color=COLOR_PASS_GREEN)
                            for r in p.runs:
                                if "PASS" in r.text.upper():
                                    r.font.bold = True
                        elif "FAIL" in upper_text or "DEFECT" in upper_text:
                            format_inline_runs(p, cell_text, base_font_size=9.5, default_color=COLOR_FAIL_RED)
                            for r in p.runs:
                                if "FAIL" in r.text.upper() or "DEFECT" in r.text.upper():
                                    r.font.bold = True
                        elif "LIMITATION" in upper_text or "PARTIAL" in upper_text:
                            format_inline_runs(p, cell_text, base_font_size=9.5, default_color=COLOR_WARN_AMBER)
                            for r in p.runs:
                                r.font.bold = True
                        else:
                            format_inline_runs(p, cell_text, base_font_size=9.5, default_color=COLOR_DARK_SLATE)

                p_sp = doc.add_paragraph()
                p_sp.paragraph_format.space_before = Pt(0)
                p_sp.paragraph_format.space_after = Pt(4)

                # Embed E2E gallery after table in 2.2.3
                if "2.2.3 System Testing" in current_h2_or_h3:
                    p_gal_head = doc.add_paragraph()
                    p_gal_head.paragraph_format.space_before = Pt(12)
                    p_gal_head.paragraph_format.space_after = Pt(6)
                    r_gh = p_gal_head.add_run("Browser Automation Visual Evidence Gallery (Chromium 1440x900):")
                    r_gh.font.name = "Times New Roman"
                    r_gh.font.size = Pt(11.5)
                    r_gh.font.bold = True
                    r_gh.font.color.rgb = COLOR_PRIMARY_NAVY

                    for test_id, img_filename, caption_text in e2e_screenshots:
                        img_path = find_image_file(BASE_DIR, img_filename)
                        if img_path and os.path.isfile(img_path):
                            print(f"Embedding E2E screenshot {img_filename}...")
                            add_scaled_picture(doc, img_path)

                            p_cap = doc.add_paragraph()
                            p_cap.paragraph_format.space_before = Pt(2)
                            p_cap.paragraph_format.space_after = Pt(8)
                            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
                            r_cap = p_cap.add_run(f"Figure {figure_counter}: {test_id} — {caption_text}")
                            r_cap.font.name = "Times New Roman"
                            r_cap.font.size = Pt(9.5)
                            r_cap.font.italic = True
                            r_cap.font.color.rgb = COLOR_MUTED_GRAY
                            figure_counter += 1

                # Embed Acceptance gallery after table in 2.2.4
                elif "2.2.4 Acceptance Testing" in current_h2_or_h3:
                    p_gal_head = doc.add_paragraph()
                    p_gal_head.paragraph_format.space_before = Pt(12)
                    p_gal_head.paragraph_format.space_after = Pt(6)
                    r_gh = p_gal_head.add_run("Acceptance Testing Responsive Viewport Exhibit Gallery:")
                    r_gh.font.name = "Times New Roman"
                    r_gh.font.size = Pt(11.5)
                    r_gh.font.bold = True
                    r_gh.font.color.rgb = COLOR_PRIMARY_NAVY

                    for test_id, img_filename, caption_text in acceptance_screenshots:
                        img_path = find_image_file(BASE_DIR, img_filename)
                        if img_path and os.path.isfile(img_path):
                            print(f"Embedding Acceptance screenshot {img_filename}...")
                            add_scaled_picture(doc, img_path)

                            p_cap = doc.add_paragraph()
                            p_cap.paragraph_format.space_before = Pt(2)
                            p_cap.paragraph_format.space_after = Pt(8)
                            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
                            r_cap = p_cap.add_run(f"Figure {figure_counter}: {test_id} — {caption_text}")
                            r_cap.font.name = "Times New Roman"
                            r_cap.font.size = Pt(9.5)
                            r_cap.font.italic = True
                            r_cap.font.color.rgb = COLOR_MUTED_GRAY
                            figure_counter += 1

            continue

        # Handle Blockquotes / Callout Boxes (> ...)
        if stripped.startswith(">"):
            quote_lines = []
            while idx < total_lines and lines[idx].strip().startswith(">"):
                q_text = lines[idx].strip()[1:].strip()
                if q_text.startswith("[!NOTE]"):
                    q_text = q_text[7:].strip()
                quote_lines.append(q_text)
                idx += 1
            
            callout_content = " ".join([ql for ql in quote_lines if ql])
            callout_tbl = doc.add_table(rows=1, cols=1)
            callout_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
            set_callout_borders(callout_tbl, border_color=HEX_CALLOUT_BORDER, bg_color=HEX_CALLOUT_BG)
            c_cell = callout_tbl.cell(0, 0)
            c_cell.width = Inches(6.2)
            cp = c_cell.paragraphs[0]
            cp.paragraph_format.space_before = Pt(2)
            cp.paragraph_format.space_after = Pt(2)
            cp.paragraph_format.line_spacing = 1.25

            r_icon = cp.add_run("NOTE: ")
            r_icon.font.name = "Times New Roman"
            r_icon.font.size = Pt(11)
            r_icon.font.bold = True
            r_icon.font.color.rgb = RGBColor(37, 99, 235)

            format_inline_runs(cp, callout_content, base_font_size=11, is_italic=True, default_color=RGBColor(30, 58, 138))

            p_sp = doc.add_paragraph()
            p_sp.paragraph_format.space_before = Pt(0)
            p_sp.paragraph_format.space_after = Pt(4)
            continue

        # Handle Headings
        if stripped.startswith("# "):
            h_text = stripped[2:].strip()
            if "PART B" in h_text or "PART C" in h_text:
                doc.add_page_break()

            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(18)
            p.paragraph_format.space_after = Pt(8)
            p.paragraph_format.keep_with_next = True
            r = p.add_run(h_text)
            r.font.name = "Times New Roman"
            r.font.size = Pt(18)
            r.font.bold = True
            r.font.color.rgb = COLOR_PRIMARY_NAVY
            current_h2_or_h3 = h_text
            idx += 1
            continue

        if stripped.startswith("## "):
            h_text = stripped[3:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.keep_with_next = True
            r = p.add_run(h_text)
            r.font.name = "Times New Roman"
            r.font.size = Pt(15)
            r.font.bold = True
            r.font.color.rgb = COLOR_PRIMARY_NAVY
            current_h2_or_h3 = h_text
            idx += 1
            continue

        if stripped.startswith("### "):
            h_text = stripped[4:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            r = p.add_run(h_text)
            r.font.name = "Times New Roman"
            r.font.size = Pt(13)
            r.font.bold = True
            r.font.color.rgb = COLOR_DARK_SLATE
            current_h2_or_h3 = h_text
            idx += 1
            continue

        if stripped.startswith("#### "):
            h_text = stripped[5:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.keep_with_next = True
            r = p.add_run(h_text)
            r.font.name = "Times New Roman"
            r.font.size = Pt(12)
            r.font.bold = True
            r.font.color.rgb = RGBColor(51, 65, 85)
            idx += 1
            continue

        # Handle Horizontal Rules (---)
        if stripped == "---":
            idx += 1
            continue

        # Handle Bullet Lists
        if stripped.startswith("- ") or stripped.startswith("* "):
            bullet_text = stripped[2:].strip()
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.3
            format_inline_runs(p, bullet_text, base_font_size=11.5)
            idx += 1
            continue

        # Handle Numbered Lists
        m_num = re.match(r'^(\d+)\.\s+(.*)', stripped)
        if m_num:
            num_val = m_num.group(1)
            item_text = m_num.group(2)
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.3
            format_inline_runs(p, item_text, base_font_size=11.5)
            idx += 1
            continue

        # Handle Empty Lines
        if not stripped:
            idx += 1
            continue

        # Standard Paragraph
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.5
        format_inline_runs(p, stripped, base_font_size=12)

        idx += 1

    print("Saving output DOCX to:", docx_path)
    doc.save(docx_path)
    print("SUCCESS: Generated", docx_path, "Size:", os.path.getsize(docx_path), "bytes")

if __name__ == "__main__":
    parse_markdown_and_build_docx(MD_FILE, DOCX_FILE)
