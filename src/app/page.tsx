import ClientChatWrapper from '@/components/ClientChatWrapper';
import { Beaker, Shield, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">
            <span className="text-amber-600">Food Funda</span> Adulteration Helpline
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your trusted assistant for identifying food adulteration, understanding testing methods,
            and ensuring the safety of your food. Ask any questions about food adulteration concerns.
          </p>
        </header>

        {/* Features */}
        <div className="w-full max-w-5xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center text-center">
            <div className="bg-blue-100 p-3 rounded-full mb-3">
              <Beaker className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-blue-800 mb-2">Testing Methods</h3>
            <p className="text-gray-600 text-sm">
              Learn simple home-based methods to detect common adulterants in everyday food items.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center text-center">
            <div className="bg-amber-100 p-3 rounded-full mb-3">
              <Shield className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-amber-800 mb-2">Safety Guidelines</h3>
            <p className="text-gray-600 text-sm">
              Access official FSSAI guidelines and recommendations for ensuring food safety.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center text-center">
            <div className="bg-green-100 p-3 rounded-full mb-3">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-green-800 mb-2">Expert Knowledge</h3>
            <p className="text-gray-600 text-sm">
              Get information based on official food adulteration testing manuals and research.
            </p>
          </div>
        </div>

        {/* Main Chat Interface */}
        <main className="mb-12">
          <ClientChatWrapper />
        </main>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-8">
          <p>Powered by FSSAI Food Safety Knowledge</p>
          <p className="mt-1">© {new Date().getFullYear()} Food Funda Adulteration Helpline</p>
        </footer>
      </div>
    </div>
  );
}
