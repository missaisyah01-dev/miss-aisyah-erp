"use client";

import { ChangeEvent, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

type ImportRow = { sku: string; tipe: string; jumlah: string; keterangan: string };

export default function StockImport({ onSuccess }: { onSuccess: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  function downloadTemplate() {
    const sheet = XLSX.utils.json_to_sheet([{ SKU: "SKU-VARIAN-001", TIPE: "MASUK", JUMLAH: 1, KETERANGAN: "Stok awal" }]);
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, sheet, "Pergerakan Stok");
    XLSX.writeFile(workbook, "template-impor-stok.xlsx");
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" }).map((row): ImportRow => ({ sku: String(row.SKU ?? row.sku ?? "").trim(), tipe: String(row.TIPE ?? row.tipe ?? "").trim().toUpperCase(), jumlah: String(row.JUMLAH ?? row.jumlah ?? "").trim(), keterangan: String(row.KETERANGAN ?? row.keterangan ?? "").trim() }));
      if (!rows.length) throw new Error("File Excel tidak memiliki baris data.");
      const { data, error } = await supabase.rpc("import_stock_movements", { p_items: rows });
      if (error) throw error;
      alert(`${data} pergerakan stok berhasil diimpor.`);
      onSuccess();
    } catch (error) { alert(`Impor gagal: ${error instanceof Error ? error.message : "format file tidak valid"}`); }
    finally { setImporting(false); event.target.value = ""; }
  }

  return <div className="flex flex-wrap gap-2"><button type="button" onClick={downloadTemplate} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Template Excel</button><button type="button" disabled={importing} onClick={() => inputRef.current?.click()} className="rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-sm font-semibold text-pink-700 hover:bg-pink-100 disabled:opacity-60">{importing ? "Mengimpor..." : "Impor Excel"}</button><input ref={inputRef} onChange={(event) => void importFile(event)} accept=".xlsx,.xls" type="file" className="hidden" /></div>;
}
