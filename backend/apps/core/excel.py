from __future__ import annotations

import re
import zipfile
from datetime import UTC, date, datetime
from decimal import Decimal
from io import BytesIO
from typing import Iterable, Sequence
from xml.sax.saxutils import escape, quoteattr

from django.http import HttpResponse

XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

INVALID_XML_CHARS_RE = re.compile("[\x00-\x08\x0b\x0c\x0e-\x1f\ufffe\uffff]")


def make_excel_response(
    *,
    filename: str,
    headers: Sequence[str],
    rows: Iterable[Sequence[object]],
    sheet_name: str = "Sheet1",
) -> HttpResponse:
    response = HttpResponse(
        build_xlsx(headers=headers, rows=rows, sheet_name=sheet_name),
        content_type=XLSX_CONTENT_TYPE,
    )
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


def build_xlsx(
    *,
    headers: Sequence[str],
    rows: Iterable[Sequence[object]],
    sheet_name: str = "Sheet1",
) -> bytes:
    data_rows = [list(row) for row in rows]
    header_row = [str(header) for header in headers]
    all_rows = [header_row, *data_rows]
    column_count = max(len(header_row), *(len(row) for row in data_rows), 1)

    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", _content_types_xml())
        archive.writestr("_rels/.rels", _root_rels_xml())
        archive.writestr("docProps/app.xml", _app_xml())
        archive.writestr("docProps/core.xml", _core_xml())
        archive.writestr("xl/workbook.xml", _workbook_xml(sheet_name))
        archive.writestr("xl/_rels/workbook.xml.rels", _workbook_rels_xml())
        archive.writestr("xl/styles.xml", _styles_xml())
        archive.writestr(
            "xl/worksheets/sheet1.xml",
            _worksheet_xml(all_rows, column_count),
        )

    return buffer.getvalue()


def _worksheet_xml(rows: Sequence[Sequence[object]], column_count: int) -> str:
    max_row = max(len(rows), 1)
    dimension_ref = f"A1:{_column_name(column_count)}{max_row}"
    row_xml = "\n".join(
        _row_xml(row_index=index, values=row, column_count=column_count)
        for index, row in enumerate(rows, start=1)
    )

    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="{dimension_ref}"/>
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  {_columns_xml(rows, column_count)}
  <sheetData>
{row_xml}
  </sheetData>
  <autoFilter ref="{dimension_ref}"/>
</worksheet>'''


def _row_xml(*, row_index: int, values: Sequence[object], column_count: int) -> str:
    style = ' s="1"' if row_index == 1 else ""
    cells = []
    for column_index in range(1, column_count + 1):
        value = values[column_index - 1] if column_index <= len(values) else ""
        cells.append(_cell_xml(row_index, column_index, value, style))
    return f'    <row r="{row_index}">\n{"".join(cells)}    </row>'


def _cell_xml(row_index: int, column_index: int, value: object, style: str) -> str:
    cell_ref = f"{_column_name(column_index)}{row_index}"
    if value is None:
        value = ""

    if isinstance(value, bool):
        return f'      <c r="{cell_ref}"{style} t="b"><v>{1 if value else 0}</v></c>\n'

    if isinstance(value, (int, float, Decimal)) and not isinstance(value, bool):
        return f'      <c r="{cell_ref}"{style}><v>{value}</v></c>\n'

    text = _stringify(value)
    preserve_space = ' xml:space="preserve"' if text != text.strip() else ""
    return (
        f'      <c r="{cell_ref}"{style} t="inlineStr">'
        f"<is><t{preserve_space}>{escape(text)}</t></is></c>\n"
    )


def _stringify(value: object) -> str:
    if isinstance(value, datetime):
        value = value.strftime("%Y-%m-%d %H:%M:%S")
    elif isinstance(value, date):
        value = value.strftime("%Y-%m-%d")
    text = str(value)
    return INVALID_XML_CHARS_RE.sub("", text)


def _columns_xml(rows: Sequence[Sequence[object]], column_count: int) -> str:
    columns = []
    for column_index in range(1, column_count + 1):
        values = [
            _stringify(row[column_index - 1])
            for row in rows
            if column_index <= len(row) and row[column_index - 1] is not None
        ]
        width = min(max(max((len(value) for value in values), default=10) + 2, 10), 45)
        columns.append(
            f'<col min="{column_index}" max="{column_index}" width="{width}" customWidth="1"/>'
        )
    return f"<cols>{''.join(columns)}</cols>"


def _column_name(index: int) -> str:
    name = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        name = chr(65 + remainder) + name
    return name


def _safe_sheet_name(name: str) -> str:
    cleaned = re.sub(r"[\[\]:*?/\\]", " ", name).strip()
    return cleaned[:31] or "Sheet1"


def _content_types_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>"""


def _root_rels_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>"""


def _workbook_xml(sheet_name: str) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name={quoteattr(_safe_sheet_name(sheet_name))} sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>"""


def _workbook_rels_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""


def _styles_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="1" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>"""


def _app_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>JOBIO</Application>
</Properties>"""


def _core_xml() -> str:
    created_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>JOBIO</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">{created_at}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{created_at}</dcterms:modified>
</cp:coreProperties>"""
