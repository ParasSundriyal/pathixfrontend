import React, { useState, useRef } from 'react';
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

export default function SignUp() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', organization: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleCredential, setGoogleCredential] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(null);
    }
  };

  // Camera capture logic
  const openCamera = async () => {
    setCameraOpen(true);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    }
  };
  const closeCamera = () => {
    setCameraOpen(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, 128, 128);
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setAvatarPreview(dataUrl);
      setAvatarFile(dataUrl); // We'll handle this as a base64 string
      closeCamera();
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    if (!form.email || !form.password || !form.name) {
      setError('Name, email and password are required.');
      setLoading(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    try {
      // Send signup request with name
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          organization: form.organization,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // If avatar selected, upload it
        if (avatarFile) {
          let base64, type;
          if (typeof avatarFile === 'string' && avatarFile.startsWith('data:')) {
            base64 = avatarFile.split(',')[1];
            type = 'image/png';
          } else {
            const reader = new FileReader();
            reader.onloadend = async () => {
              base64 = reader.result.split(',')[1];
              type = avatarFile.type;
              await fetch(`${process.env.REACT_APP_API_URL}/api/auth/avatar`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                  avatar: base64,
                  avatarType: type,
                }),
              });
            };
            reader.readAsDataURL(avatarFile);
            setLoading(false);
            setMessage('Sign up successful! You can now sign in.');
            setForm({ name: '', email: '', password: '', phone: '', organization: '', confirmPassword: '' });
            setAvatarFile(null);
            setAvatarPreview(null);
            return;
          }
          await fetch(`${process.env.REACT_APP_API_URL}/api/auth/avatar`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${sessionStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              avatar: base64,
              avatarType: type,
            }),
          });
        }
        setMessage('Sign up successful! Redirecting...');
        setTimeout(() => window.location.href = '/dashboard', 1000);
        setForm({ name: '', email: '', password: '', phone: '', organization: '', confirmPassword: '' });
        setAvatarFile(null);
        setAvatarPreview(null);
      } else {
        setError(data.message || 'Sign up failed.');
      }
    } catch (err) {
      setError('Network error.');
    }
    setLoading(false);
  };

  // Google login handler
  const handleGoogleSuccess = async (credentialResponse) => {
    console.log('API URL:', process.env.REACT_APP_API_URL); // Temporary debug log
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
        // Fetch user info to get Google name and photo
        const meRes = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${data.token}` } });
        const me = await meRes.json();
        // If no name, use email prefix
        if (!me.name && me.email) {
          const name = me.email.split('@')[0];
          await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
            body: JSON.stringify({ name }),
          });
        }
        setMessage('Google sign up successful! Redirecting...');
        setTimeout(() => window.location.href = '/dashboard', 1000);
      } else if (data.message && data.message.includes('Phone and organization')) {
        setShowModal(true);
      } else {
        setError(data.message || 'Google sign up failed.');
      }
    } catch (err) {
      setError('Google sign up error.');
    }
  };

  const handleGoogleError = () => {
    setError('Google sign up failed.');
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
        setMessage('Google sign up successful! Redirecting...');
        setTimeout(() => window.location.href = '/dashboard', 1000);
      } else {
        setError(data.message || 'Google sign up failed.');
      }
    } catch (err) {
      setError('Google sign up error.');
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
          <div className="text-2xl font-bold text-accent-gold mb-1 font-serif">Create Your Account</div>
          <div className="text-gray-300 text-base mb-2">Join Pathix to create premium mapping solutions for your organization</div>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
          {/* Avatar upload and camera */}
          <div className="text-center">
            <label htmlFor="avatar" className="block text-accent-gold font-medium mb-1">Profile Image</label>
            <input name="avatar" id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="mx-auto block text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-accent-gold file:to-yellow-400 file:text-gray-900 hover:file:from-yellow-400 hover:file:to-accent-gold" />
            <button type="button" className="mt-2 px-4 py-2 rounded-lg bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 font-semibold shadow-glow hover:scale-105 transition" onClick={openCamera}>Use Camera</button>
            {avatarPreview && <img src={avatarPreview} alt="Preview" className="w-16 h-16 rounded-full mx-auto mt-2 border-2 border-accent-gold shadow-glow" />}
          </div>
          {cameraOpen && (
            <div className="text-center mb-4">
              <video ref={videoRef} width={128} height={128} autoPlay className="rounded-xl mb-2 mx-auto shadow-glow" />
              <div className="flex gap-2 justify-center">
                <button type="button" className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 font-bold shadow-glow hover:scale-105 transition" onClick={capturePhoto}>Capture</button>
                <button type="button" className="px-4 py-2 rounded-lg bg-gray-700 text-white font-semibold shadow hover:bg-gray-600 transition" onClick={closeCamera}>Cancel</button>
              </div>
              <canvas ref={canvasRef} width={128} height={128} className="hidden" />
            </div>
          )}
          {/* Form fields */}
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-accent-gold font-medium mb-1">Full Name</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-yellow-300">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M6 20c0-2.21 3.58-4 6-4s6 1.79 6 4" /></svg>
              </span>
              <input name="name" type="text" placeholder="Enter your full name" value={form.name} onChange={handleChange} required className="w-full rounded-lg bg-white/10 border border-accent-gold text-white px-10 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400" />
            </div>
          </div>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-accent-gold font-medium mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-yellow-300">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16v16H4z" fill="none"/><path d="M22 6l-10 7L2 6" /></svg>
              </span>
              <input name="email" type="email" placeholder="Enter your email" value={form.email} onChange={handleChange} required className="w-full rounded-lg bg-white/10 border border-accent-gold text-white px-10 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400" />
            </div>
          </div>
          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-accent-gold font-medium mb-1">Phone Number</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-yellow-300">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M16 10h.01" /></svg>
              </span>
              <input name="phone" type="tel" placeholder="Enter your phone number" value={form.phone} onChange={handleChange} className="w-full rounded-lg bg-white/10 border border-accent-gold text-white px-10 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400" />
            </div>
          </div>
          {/* Organization */}
          <div>
            <label htmlFor="organization" className="block text-accent-gold font-medium mb-1">Organization Name</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-yellow-300">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="2" /><path d="M7 7v10M17 7v10" /></svg>
              </span>
              <input name="organization" type="text" placeholder="Enter your organization name" value={form.organization} onChange={handleChange} className="w-full rounded-lg bg-white/10 border border-accent-gold text-white px-10 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400" />
            </div>
          </div>
          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-accent-gold font-medium mb-1">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-yellow-300">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><circle cx="12" cy="10" r="1" /></svg>
              </span>
              <input name="password" type="password" placeholder="Create a password" value={form.password} onChange={handleChange} required minLength={6} className="w-full rounded-lg bg-white/10 border border-accent-gold text-white px-10 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400" />
            </div>
          </div>
          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-accent-gold font-medium mb-1">Confirm Password</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-yellow-300">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><circle cx="12" cy="10" r="1" /></svg>
              </span>
              <input name="confirmPassword" type="password" placeholder="Confirm your password" value={form.confirmPassword} onChange={handleChange} required minLength={6} className="w-full rounded-lg bg-white/10 border border-accent-gold text-white px-10 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400" />
            </div>
          </div>
          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 font-bold shadow-glow hover:scale-105 transition text-lg" type="submit" disabled={loading}>{loading ? 'Signing Up...' : 'Create Account'}</button>
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
          Already have an account?
          <Link to="/signin" className="text-accent-gold font-bold ml-2 underline">Sign in</Link>
        </div>
      </div>
      <PhoneOrgModal open={showModal} onClose={() => setShowModal(false)} onSubmit={handleModalSubmit} loading={modalLoading} />
    </div>
  );
} 