export default function Footer() {
  const orgName = process.env.NEXT_PUBLIC_ORGANIZATION_NAME || "Dalailul Khairath Kakkidippuram";

  return (
    <footer className="py-8 text-center text-xs text-[#415a77] border-t border-[#c8d1dc]/60 mt-12 bg-[#f9f9f8]/60 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4">
        <p>© 2026 {orgName} – Alumni Portal. All rights reserved.</p>
      </div>
    </footer>
  );
}
