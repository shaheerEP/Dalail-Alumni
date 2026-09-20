import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AlumniForm from "@/components/AlumniForm";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#ececea]">
      {/* Dark Navy Summit Header */}
      <Header />

      {/* Main Registration Card Container */}
      {/* On mobile: mt-4 ensures the card is never clipped or hidden behind the header */}
      {/* On desktop: sm:-mt-10 creates the elegant floating card effect */}
      <main className="flex-1 mt-4 sm:-mt-10 px-3 sm:px-6 mb-12 relative z-10">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Quick Action Banner: Get Pass */}
          <div className="bg-gradient-to-r from-[#1b263b] to-[#0d1b2a] text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 border border-[#415a77]/30">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center text-xl shrink-0">
                🎫
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white">Already Registered for LINKUP?</h2>
                <p className="text-xs text-[#8ba1ca]">Search your name & get your official QR Entry Pass</p>
              </div>
            </div>
            <a
              href="/get-pass"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#0d1b2a] font-extrabold text-xs sm:text-sm shadow-md transition-all text-center shrink-0 cursor-pointer hover:scale-[1.02]"
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
