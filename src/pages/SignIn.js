import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link } from 'react-router-dom';
import logo from '../logo.svg';

function PhoneOrgModal({ open, onClose, onSubmit, loading }) {
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!phone || !organization) {
      setError('Both fields are required.');
      return;
    }
    setError('');
    onSubmit({ phone, organization });
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-[#232946] to-[#181c2a] rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/10 backdrop-blur-xl">
        <h3 className="text-xl font-bold text-white mb-4">Complete your profile</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Organization</label>
            <input type="text" value={organization} onChange={e => setOrganization(e.target.value)} placeholder="Organization name" className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400" />
          </div>
          {error && <div className="text-red-400 text-sm font-medium">{error}</div>}
          <div className="flex gap-2 mt-2">
            <button className="flex-1 bg-gradient-to-r from-[#f6d365] to-[#fda085] text-gray-900 font-bold rounded-lg py-2 shadow-lg hover:from-[#fda085] hover:to-[#f6d365] transition" type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</button>
            <button className="flex-1 bg-gray-700 text-white rounded-lg py-2" type="button" onClick={onClose} disabled={loading}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SignIn() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleCredential, setGoogleCredential] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Sign in successful! Redirecting...');
        if (data.token) {
          sessionStorage.setItem('token', data.token);
          setTimeout(() => window.location.href = '/dashboard', 1000);
        }
      } else {
        setError(data.message || 'Sign in failed.');
      }
    } catch (err) {
      setError('Network error.');
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setMessage('');
    setGoogleCredential(credentialResponse.credential);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        sessionStorage.setItem('token', data.token);
        setMessage('Google sign in successful! Redirecting...');
        setTimeout(() => window.location.href = '/dashboard', 1000);
      } else if (data.message && data.message.includes('Phone and organization')) {
        setShowModal(true);
      } else {
        setError(data.message || 'Google sign in failed.');
      }
    } catch (err) {
      setError('Google sign in error.');
    }
  };

  const handleGoogleError = () => {
    setError('Google sign in failed.');
  };

  const handleModalSubmit = async ({ phone, organization }) => {
    setModalLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: googleCredential, phone, organization }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        sessionStorage.setItem('token', data.token);
        setShowModal(false);
        setMessage('Google sign in successful! Redirecting...');
        setTimeout(() => window.location.href = '/dashboard', 1000);
      } else {
        setError(data.message || 'Google sign in failed.');
      }
    } catch (err) {
      setError('Google sign in error.');
    }
    setModalLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#15192b] via-[#101117] to-[#23243a] px-4 py-12 font-sans">
      <div className="w-full max-w-lg bg-[#181c2a]/60 border border-accent-gold/60 rounded-3xl shadow-glow p-10 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center mb-2 gap-2">
            <img src={logo} alt="Pathix Logo" className="h-14 w-14 drop-shadow-[0_0_16px_#f6d365] mx-auto" />
            <h1 className="text-3xl md:text-4xl font-extrabold font-serif bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_0_16px_#f6d365] tracking-wide">Pathix</h1>
          </div>
          <div className="text-2xl font-bold text-accent-gold mb-1 font-serif">Welcome Back</div>
          <div className="text-gray-300 text-base mb-2">Sign in to access your mapping dashboard</div>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
          {/* Email/Phone */}
          <div>
            <label htmlFor="email" className="block text-accent-gold font-medium mb-1">Email or Phone Number</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-yellow-300">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16v16H4z" fill="none"/><path d="M22 6l-10 7L2 6" /></svg>
              </span>
              <input name="email" type="text" placeholder="Enter your email or phone number" value={form.email} onChange={handleChange} required className="w-full rounded-lg bg-white/10 border border-accent-gold text-white px-10 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400" />
            </div>
          </div>
          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-accent-gold font-medium mb-1">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-yellow-300">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><circle cx="12" cy="10" r="1" /></svg>
              </span>
              <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required minLength={6} className="w-full rounded-lg bg-white/10 border border-accent-gold text-white px-10 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400" />
            </div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <input id="remember" type="checkbox" className="accent-accent-gold w-4 h-4 rounded" />
              <label htmlFor="remember" className="text-xs text-gray-300">Remember me</label>
            </div>
            <Link to="/forgot-password" className="text-xs text-accent-gold font-semibold underline">Forgot password?</Link>
          </div>
          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 font-bold shadow-glow hover:scale-105 transition text-lg" type="submit" disabled={loading}>{loading ? 'Signing In...' : 'Sign In'}</button>
          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-white/20" />
            <span className="mx-3 text-gray-400 text-sm">or</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              width="100%"
              useOneTap
            />
          </div>
          {message && <div className="text-green-400 text-center font-medium mt-2">{message}</div>}
          {error && <div className="text-red-400 text-center font-medium mt-2">{error}</div>}
        </form>
        <div className="mt-6 text-center text-gray-300 text-sm">
          Don't have an account?
          <Link to="/signup" className="text-accent-gold font-bold ml-2 underline">Sign up</Link>
        </div>
      </div>
      <PhoneOrgModal open={showModal} onClose={() => setShowModal(false)} onSubmit={handleModalSubmit} loading={modalLoading} />
    </div>
  );
} 