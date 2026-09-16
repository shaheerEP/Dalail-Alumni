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
        <div className="max-w-2xl mx-auto">
          <AlumniForm />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
