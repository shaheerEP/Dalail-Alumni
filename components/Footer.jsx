export default function Footer() {
  const orgName = process.env.NEXT_PUBLIC_ORGANIZATION_NAME || "Dalailul Khairath Kakkidippuram";

  return (
    <footer className="py-8 text-center text-xs text-[#415a77] border-t border-[#c8d1dc]/60 mt-12 bg-[#f9f9f8]/60 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <p>© 2026 {orgName} – Alumni Portal. All rights reserved.</p>
        <div className="flex items-center gap-4 text-xs font-medium">
          <a href="/get-pass" className="text-[#3875b6] hover:underline">Get Pass</a>
          <span className="text-[#c8d1dc]">•</span>
          <a href="/admin" className="text-[#778da9] hover:text-[#0d1b2a] transition-colors">Admin Portal</a>
        </div>
      </div>
    </footer>
  );
}
