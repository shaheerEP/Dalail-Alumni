export default function Footer() {
  const orgName = process.env.NEXT_PUBLIC_ORGANIZATION_NAME || "Dalailul Khairath Kakkidippuram";

  return (
    <footer className="py-8 text-center text-xs text-[#576b2d] border-t border-[#719100]/20 mt-12 bg-[#edf2dc]/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <p>© 2026 {orgName} – Alumni Portal. All rights reserved.</p>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <a href="/get-pass" className="text-[#719100] hover:text-[#4d6300] hover:underline transition-colors">
            🎫 Get Pass
          </a>
          <span className="text-[#719100]/30">•</span>
          <a href="/admin" className="text-[#576b2d] hover:text-[#192200] transition-colors">
            Admin Portal
          </a>
        </div>
      </div>
    </footer>
  );
}
