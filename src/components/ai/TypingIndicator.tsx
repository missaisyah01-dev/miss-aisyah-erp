export function TypingIndicator() {
  return (
    <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-slate-100 px-3 py-3 dark:bg-slate-800" aria-label="KasirIntelek sedang mengetik">
      {[0, 150, 300].map((delay) => <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${delay}ms` }} />)}
    </div>
  );
}
