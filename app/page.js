import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AlumniForm from "@/components/AlumniForm";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#ececea]">
      {/* Dark Navy Summit Header */}
      <Header />

      {/* Main Registration Card Container */}
      <main className="flex-1 -mt-8 px-4 sm:px-6 mb-12">
        <div className="max-w-2xl mx-auto">
          <AlumniForm />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
