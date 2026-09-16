import Image from "next/image";

export default function Header() {
  const portalSubtitle = process.env.NEXT_PUBLIC_PORTAL_SUBTITLE || "DALAILUL KHAIRATH KAKKIDIPPURAM ALUMNI PORTAL";
  const eventTitle = process.env.NEXT_PUBLIC_EVENT_TITLE || "ALUMNI MEET 2026 - DALAILUL KHAIRATH KAKKIDIPPURAM";
  const eventDate = process.env.NEXT_PUBLIC_EVENT_DATE || "02 October 2026";

  return (
    <header className="bg-gradient-to-b from-[#0d1b2a] via-[#101b2a] to-[#1b263b] text-white pt-8 pb-10 sm:pb-20 px-4 shadow-xl border-b border-[#415a77]/40 relative">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Official Institution Logo */}
        <div className="w-32 h-40 sm:w-44 sm:h-52 rounded-3xl bg-white shadow-2xl border-2 border-[#778da9]/50 flex items-center justify-center p-3 sm:p-4 mb-4 sm:mb-5">
          <Image
            src="/logo.png"
            alt="Dalailul Khairath Logo"
            width={200}
            height={260}
            className="w-full h-full object-contain"
            priority
          />
        </div>

        {/* Portal Subtitle */}
        <span className="text-[#8ba1ca] text-xs sm:text-sm font-bold tracking-widest uppercase mb-2">
          {portalSubtitle}
        </span>

        {/* Event Main Title */}
        <h1 className="text-lg sm:text-3xl lg:text-4xl font-black tracking-tight text-white uppercase drop-shadow-md max-w-2xl leading-tight px-2">
          {eventTitle}
        </h1>

        {/* Event Date Badge */}
        <div className="mt-3.5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1b263b]/80 border border-[#778da9]/40 backdrop-blur-sm text-xs sm:text-sm font-medium text-[#e0e1dd]">
          <span className="text-[#c8d1dc]">Event Date:</span>
          <span className="text-amber-400 font-extrabold tracking-wide">{eventDate}</span>
        </div>
      </div>
    </header>
  );
}
