import Image from "next/image";

export default function Header() {
  const eventDate = "02 October 2026";
  const orgName = process.env.NEXT_PUBLIC_ORGANIZATION_NAME || "Dalailul Khairath Kakkidippuram";

  return (
    <header className="bg-gradient-to-b from-[#141b00] via-[#202b00] to-[#2d3a00] text-white pt-8 pb-12 sm:pb-16 px-4 border-b border-[#719100]/30 relative">
      <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
        {/* Official Institution Logo */}
        <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-white shadow-xl flex items-center justify-center p-2.5 mb-3 sm:mb-4 border border-[#719100]/20">
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
        <p className="text-[#d8ec78] text-xs sm:text-sm font-semibold tracking-wide uppercase">
          {orgName}
        </p>

        {/* Event Main Title matching pass typography */}
        <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-wider text-white uppercase mt-1 px-2">
          LINKUP
        </h1>
        <p className="text-xs sm:text-sm text-[#fff000] font-black uppercase tracking-widest mt-0.5">
          The Grand Alumni Summit 2026
        </p>

        {/* Event Date Badge */}
        <div className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#172000]/90 border border-[#719100]/40 text-xs text-[#f5f7eb] shadow-sm">
          <span className="text-[#d8ec78]">Event Date:</span>
          <span className="text-[#fff000] font-bold">{eventDate}</span>
        </div>
      </div>
    </header>
  );
}
