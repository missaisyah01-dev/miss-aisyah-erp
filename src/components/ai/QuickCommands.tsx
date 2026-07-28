const commands = [
  { tool: "getSales", label: "Ringkas penjualan hari ini" },
  { tool: "getProfit", label: "Cek profit bisnis" },
  { tool: "getLowStock", label: "Cek stok menipis" },
  { tool: "getStock", label: "Lihat stok produk" },
  { tool: "getProduct", label: "Cari produk" },
];

export function QuickCommands({ allowedTools, onSelect }: { allowedTools: string[]; onSelect: (command: string) => void }) {
  const visibleCommands = commands.filter((command) => allowedTools.includes(command.tool));
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2">
      {visibleCommands.map((command) => (
        <button key={command.tool} type="button" onClick={() => onSelect(command.label)} className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors duration-200 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-300">
          {command.label}
        </button>
      ))}
    </div>
  );
}
