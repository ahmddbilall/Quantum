import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-4xl font-bold mb-4 font-oxanium text-emerald-400">404 - Not Found</h2>
        <p className="text-xl text-zinc-400 mb-8">Could not find requested resource</p>
        <Link href="/" className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors">
          Return Home
        </Link>
      </div>
    </div>
  );
}
