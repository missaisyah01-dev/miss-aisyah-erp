export default function Header() {
  return (
    <header className="flex items-center justify-between bg-white p-4 shadow">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard
        </h1>

        <p className="text-gray-500">
          Selamat datang di MISS AISYAH
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-semibold">Owner</p>
          <p className="text-sm text-gray-500">
            Admin Miss Aisyah
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-600 text-white font-bold">
          A
        </div>
      </div>
    </header>
  );
}