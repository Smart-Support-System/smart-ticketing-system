import React, { useState } from 'react';
//import type { Route } from "./+types/login"; // might delete this line later (used for testing)
import { useNavigate } from 'react-router';
import { API_BASE_URL } from '~/root';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setError(null);

      const response = await fetch(API_BASE_URL + '/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();

      console.log('Logged in user:', data);

      localStorage.setItem('currentUser', JSON.stringify(data.user));

      navigate('/home');
    } catch (err) {
      setError('Login failed. Check email/password.');
    }
  };

  return (
    <div className='bg-slate-200 text-gray-500'
      style={{
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <form onSubmit={handleSubmit} style={{ minWidth: '300px' }} className='w-full max-w-md rounded-2xl bg-white p-8 shadow-sm'>
        <h2 style={{ marginBottom: '10px' }}>Login to Ticket System</h2>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        {/* BUTTON TABS SECTION - Login, Signup */}
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <button
            type="submit"
            style={{
              padding: '10px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => navigate('/signup')}
            style={{
              padding: '10px',
              backgroundColor: '#e5e7eb',
              color: '#111827',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
}