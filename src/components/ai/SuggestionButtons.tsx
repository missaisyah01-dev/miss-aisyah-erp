const suggestions = ["Jelaskan lebih lanjut", "Apa langkah berikutnya?"];

export function SuggestionButtons({ onSelect }: { onSelect: (suggestion: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => onSelect(suggestion)} className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs text-blue-700 transition-colors duration-200 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950">{suggestion}</button>)}
    </div>
  );
}
