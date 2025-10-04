import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { loginConsumer, registerConsumer } from '../../lib/api';
import Link from 'next/link';

export default function ConsumerLoginPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('consumerAuthToken')) {
      router.push('/consumer/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      if (isLoginView) {
        const data = await loginConsumer(email, password);
        if (data.access_token) {
          localStorage.setItem('consumerAuthToken', data.access_token);
          router.push('/consumer/dashboard');
        } else {
          throw new Error("Login failed. Please check your credentials.");
        }
      } else {
        await registerConsumer(email, password);
        setStatus('Registration successful! Please switch to the Login tab.');
        e.target.reset();
        setIsLoginView(true);
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
          <p className="text-gray-500">Your Personal Food Safety & Wellness Companion</p>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setIsLoginView(true); setError(''); setStatus(''); }}
            className={`flex-1 p-3 font-semibold transition-colors ${isLoginView ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLoginView(false); setError(''); setStatus(''); }}
            className={`flex-1 p-3 font-semibold transition-colors ${!isLoginView ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <input type="email" name="email" placeholder="Email Address" required className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary" />
          <input type="password" name="password" placeholder={isLoginView ? "Password" : "Create a Password"} required className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary" />
          <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-all">
            {isLoginView ? 'Login Securely' : 'Create Account'}
          </button>
          {error && <div className="text-red-500 text-sm text-center h-4">{error}</div>}
          {status && <div className="text-green-600 text-sm text-center h-4">{status}</div>}
        </form>
      </div>
    </div>
  );
}
