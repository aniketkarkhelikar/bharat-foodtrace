import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white min-h-screen shadow-2xl">
        <header className="bg-white p-4 shadow-md sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image src="/logo.png" alt="Bharat FoodTrace Logo" width={40} height={40} />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Bharat FoodTrace</h1>
              <p className="text-sm text-gray-500">Traceability & Wellness</p>
            </div>
          </div>
          <Link href="/consumer/login" className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 text-sm transition-colors">
            Consumer Login
          </Link>
        </header>
        <main>
          <div className="text-center p-12 bg-gray-100">
            <h1 className="text-4xl font-bold mb-4 text-gray-800">Know Your Food, Know Your Health</h1>
            <p className="text-lg text-gray-600">Bringing transparency to the Indian food supply chain, from farm to fork.</p>
          </div>
          <div className="p-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Join the Network</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center border border-gray-200">
                <h3 className="text-xl font-bold mb-4">For Consumers</h3>
                <p className="text-gray-600 mb-6">Scan a QR code to instantly see a product's journey, nutritional information, and personalized health alerts.</p>
                <Link href="/consumer/login" className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-all">
                    Get Started
                </Link>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg text-center border border-gray-200">
                <h3 className="text-xl font-bold mb-4">For Businesses</h3>
                <p className="text-gray-600 mb-6">Manage your products, build trust, and ensure compliance with our powerful tools.</p>
                <div className="flex justify-center gap-4">
                  <Link href="/manufacturer/login" className="bg-secondary text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-all">
                    Manufacturer
                  </Link>
                  <Link href="/logistics" className="bg-accent text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-600 transition-all">
                    Logistics
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
        <footer className="text-center p-4 text-gray-500 text-sm border-t">
            <p>&copy; {new Date().getFullYear()} Bharat FoodTrace. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
}
