const commands = ["Ringkas penjualan hari ini", "Cek stok menipis", "Bantu operasional toko"];

export function QuickCommands({ onSelect }: { onSelect: (command: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2">
      {commands.map((command) => (
        <button key={command} type="button" onClick={() => onSelect(command)} className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors duration-200 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-300">
          {command}
        </button>
      ))}
    </div>
  );
}
