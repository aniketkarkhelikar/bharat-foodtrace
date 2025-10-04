import Link from 'next/link';
import Image from 'next/image';

export default function Header({ userEmail, userType, onLogout }) {
  const portalName = userType.charAt(0).toUpperCase() + userType.slice(1);
  const portalColor = userType === 'consumer' ? 'text-primary' : 'text-secondary';

  return (
    <header className="bg-white p-4 shadow-md sticky top-0 z-10 flex items-center justify-between">
      <Link href="/" className="flex items-center space-x-3">
        <Image src="/logo.png" alt="Bharat FoodTrace Logo" width={40} height={40} />
        <div>
          <h1 className="text-xl font-bold text-gray-800">Bharat FoodTrace</h1>
          <p className={`text-sm font-semibold ${portalColor}`}>{portalName} Portal</p>
        </div>
      </Link>
      <div>
        <span className="text-sm text-gray-500 mr-4 hidden md:inline">{userEmail}</span>
        <button onClick={onLogout} className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 text-sm transition-colors">
          Logout
        </button>
      </div>
    </header>
  );
}
