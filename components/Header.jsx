import Image from "next/image";

export default function Header() {
  const eventDate = "02 October 2026";
  const orgName = process.env.NEXT_PUBLIC_ORGANIZATION_NAME || "Dalailul Khairath Kakkidippuram";

  return (
    <header className="bg-gradient-to-b from-[#0d1b2a] via-[#101b2a] to-[#1b263b] text-white pt-8 pb-12 sm:pb-16 px-4 border-b border-[#415a77]/30 relative">
      <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
        {/* Official Institution Logo */}
        <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-white shadow-xl flex items-center justify-center p-2.5 mb-3 sm:mb-4">
          <Image
            src="/logo.png"
            alt="Dalailul Khairath Logo"
            width={160}
            height={200}
            className="w-full h-full object-contain"
            priority
          />
        </div>

        {/* Institution Subtitle */}
        <p className="text-[#8ba1ca] text-xs sm:text-sm font-medium tracking-wide">
          {orgName}
        </p>

        {/* Event Main Title */}
        <h1 className="text-2xl sm:text-4xl font-black tracking-widest text-white uppercase mt-1 px-2">
          LINKUP
        </h1>
        <p className="text-xs text-amber-400 font-bold uppercase tracking-widest mt-0.5">
          Alumni Meet 2026
        </p>

        {/* Event Date Badge & Actions */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1b263b]/90 border border-[#778da9]/30 text-xs text-[#e0e1dd]">
            <span className="text-[#8ba1ca]">Event Date:</span>
            <span className="text-amber-400 font-bold">{eventDate}</span>
          </div>

          <a
            href="/get-pass"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#0d1b2a] font-extrabold text-xs shadow-md hover:shadow-amber-500/20 transition-all hover:scale-[1.03] cursor-pointer"
          >
            <span className="text-sm">🎫</span>
            <span>Get Pass</span>
          </a>
        </div>
      </div>
    </header>
  );
}
