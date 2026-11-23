import docx

doc = docx.Document("FINAL_QA_REPORT.docx")
print("Paragraphs:", len(doc.paragraphs))
print("Tables:", len(doc.tables))
print("Sections:", len(doc.sections))
print("Inline shapes count:", len(doc.inline_shapes))

for i, shape in enumerate(doc.inline_shapes):
    print(f"Shape {i+1}: width = {shape.width / 914400:.2f} in, height = {shape.height / 914400:.2f} in")

print("\nSample table headers:")
for i, t in enumerate(doc.tables[:8]):
    header = [c.text.strip().replace("\n", " ") for c in t.rows[0].cells]
    print(f"Table {i+1} ({len(t.rows)} rows, {len(t.columns)} cols): {header[:3]}")

# Check first page different header
s = doc.sections[0]
print("Different first page:", s.different_first_page_header_footer)
print("Page dimensions: width =", s.page_width.mm, "mm, height =", s.page_height.mm, "mm")
print("Page margins: left =", s.left_margin.mm, "mm, top =", s.top_margin.mm, "mm")
