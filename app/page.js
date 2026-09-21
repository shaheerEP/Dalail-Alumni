import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AlumniForm from "@/components/AlumniForm";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7eb]">
      {/* Forest Olive Summit Header */}
      <Header />

      {/* Main Registration Card Container */}
      <main className="flex-1 mt-4 sm:-mt-10 px-3 sm:px-6 mb-12 relative z-10">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Quick Action Banner: Get Pass */}
          <div className="bg-gradient-to-r from-[#192200] via-[#243100] to-[#2d3a00] text-white rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-[#719100]/40">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-[#fff000]/20 text-[#fff000] flex items-center justify-center text-xl shrink-0 border border-[#fff000]/30">
                🎫
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white">Already Registered for LINKUP?</h2>
                <p className="text-xs text-[#d8ec78]">Search your name & get your official QR Entry Pass</p>
              </div>
            </div>
            <a
              href="/get-pass"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#fff000] to-[#fed700] hover:from-[#fff542] hover:to-[#ffe033] text-[#192200] font-black text-xs sm:text-sm shadow-md transition-all text-center shrink-0 cursor-pointer hover:scale-[1.02]"
            >
              Get Pass ➔
            </a>
          </div>

          <AlumniForm />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
