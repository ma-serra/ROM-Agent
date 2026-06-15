#!/usr/bin/env python3
"""
ROM Agent - Extrator PDF com pdfplumber
=======================================

Extrai texto estruturado de PDFs mantendo:
- Alinhamento de colunas em tabelas
- Estrutura de planilhas de cálculos
- Andamentos processuais formatados
- Layout original de documentos

Uso:
    python pdfplumber_extractor.py <caminho_do_pdf>
"""

import sys
import json
import pdfplumber
from typing import Dict, List, Any


def extract_tables_from_pdf(pdf_path: str) -> Dict[str, Any]:
    """
    Extrai tabelas e texto estruturado de um PDF usando pdfplumber

    Args:
        pdf_path: Caminho para o arquivo PDF

    Returns:
        Dicionário com texto extraído, tabelas e metadados
    """
    result = {
        "success": False,
        "text": "",
        "tables": [],
        "pages": 0,
        "method": "pdfplumber",
        "metadata": {}
    }

    try:
        with pdfplumber.open(pdf_path) as pdf:
            all_text = []
            all_tables = []

            for page_num, page in enumerate(pdf.pages, 1):
                # Extrair texto da página
                page_text = page.extract_text()
                if page_text:
                    all_text.append(f"\n{'='*80}\n")
                    all_text.append(f"PÁGINA {page_num}\n")
                    all_text.append(f"{'='*80}\n\n")
                    all_text.append(page_text)

                # Extrair tabelas da página
                tables = page.extract_tables()
                if tables:
                    for table_num, table in enumerate(tables, 1):
                        all_tables.append({
                            "page": page_num,
                            "table_number": table_num,
                            "rows": len(table),
                            "cols": len(table[0]) if table else 0,
                            "data": table
                        })

                        # Adicionar tabela formatada ao texto
                        all_text.append(f"\n\n{'─'*80}\n")
                        all_text.append(f"TABELA {table_num} (Página {page_num})\n")
                        all_text.append(f"{'─'*80}\n\n")

                        # Formatar tabela preservando alinhamento
                        if table:
                            # Calcular largura máxima de cada coluna
                            col_widths = []
                            for col_idx in range(len(table[0])):
                                max_width = max(
                                    len(str(row[col_idx] or ""))
                                    for row in table
                                )
                                col_widths.append(max_width)

                            # Renderizar tabela formatada
                            for row in table:
                                formatted_row = []
                                for col_idx, cell in enumerate(row):
                                    cell_text = str(cell or "").strip()
                                    # Alinhar célula com espaços
                                    formatted_row.append(
                                        cell_text.ljust(col_widths[col_idx])
                                    )
                                all_text.append(" | ".join(formatted_row) + "\n")

            # Juntar todo o texto
            full_text = "".join(all_text)

            result.update({
                "success": True,
                "text": full_text,
                "tables": all_tables,
                "pages": len(pdf.pages),
                "metadata": {
                    "total_tables": len(all_tables),
                    "char_count": len(full_text),
                    "word_count": len(full_text.split()),
                    "chars_per_page": len(full_text) / len(pdf.pages) if pdf.pages else 0
                }
            })

    except Exception as e:
        result["error"] = str(e)

    return result


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python pdfplumber_extractor.py <pdf_path>"
        }))
        sys.exit(1)

    pdf_path = sys.argv[1]
    result = extract_tables_from_pdf(pdf_path)

    # Imprimir resultado como JSON
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
