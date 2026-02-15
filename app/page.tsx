export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-transparent">
      <div className="rounded-xl border border-white/10 bg-black/50 p-8 text-center backdrop-blur-md">
        <h1 className="text-2xl font-bold tracking-wider text-white">
          BlockParty Engine Initialized
        </h1>
        <p className="mt-2 text-sm text-gray-300">
          Overlay Active • Awaiting Commands
        </p>
      </div>
    </main>
  );
}
