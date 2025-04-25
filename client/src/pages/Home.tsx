import Footer from "@/components/Footer";
import Header from "@/components/Header";
import HowItWorks from "@/components/HowItWorks";
import DropConvert from "@/components/DropConvert";
import TechnicalDetails from "@/components/TechnicalDetails";
import { siteConfig } from "@/config";

export default function Home() {
  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
      <div className="flex-grow">
        <Header />
        
        <main className="py-6 flex-grow">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div className="text-center mb-8">
              <h1 className="relative inline-block px-2 py-1">
                <span className="relative z-10 text-4xl font-black tracking-tight bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 bg-clip-text text-transparent drop-shadow-sm">
                  {siteConfig.defaultConversionMode === 'avifToJpg' 
                    ? 'Convert AVIF to JPG' 
                    : 'Convert JPG to AVIF'}
                </span>
                <span className="absolute inset-0 blur-xl opacity-20 bg-blue-400 rounded-lg transform -rotate-1"></span>
              </h1>
              <p className="mt-4 text-xl text-gray-600 sm:mt-5 max-w-xl mx-auto">
                Fast, free, and completely private - no files are uploaded to any server
              </p>
            </div>

            <DropConvert />
            <HowItWorks />
            <TechnicalDetails />
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
