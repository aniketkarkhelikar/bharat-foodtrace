import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { loginManufacturer } from '../../lib/api';
import Link from 'next/link';

export default function ManufacturerLoginPage() {
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
      if (localStorage.getItem('manufacturerAuthToken')) {
        router.push('/manufacturer/dashboard');
      }
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const email = e.target.email.value;
        const password = e.target.password.value;

        try {
            const data = await loginManufacturer(email, password);
             if (data.access_token) {
                localStorage.setItem('manufacturerAuthToken', data.access_token);
                router.push('/manufacturer/dashboard');
            } else {
                throw new Error("Login failed. Please check your credentials.");
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <Link href="/">
                        <Image src="/logo.png" alt="Bharat FoodTrace Logo" width={64} height={64} className="mx-auto cursor-pointer" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800 mt-4">Bharat FoodTrace</h1>
                    <p className="text-gray-500">Manufacturer Portal</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <input type="email" name="email" defaultValue="manufacturer1@example.com" placeholder="Email" required className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-secondary" />
                    <input type="password" name="password" defaultValue="testpassword" placeholder="Password" required className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-secondary" />
                    <button type="submit" className="w-full bg-secondary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-all">
                        Login
                    </button>
                    {error && <div className="text-red-500 text-sm text-center h-4">{error}</div>}
                </form>
            </div>
        </div>
    );
}
