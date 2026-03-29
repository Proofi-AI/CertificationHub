import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Minimal nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/ProofiLogo.png" alt="Proofi AI" width={28} height={28} className="rounded-lg" />
        </Link>
      </nav>

      {/* Bg blobs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-600/8 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        {children}
      </div>
    </div>
  );
}
