import React, { useState, useRef } from 'react';
import './SignUp.css';
import { GoogleLogin } from '@react-oauth/google';
import { Link } from 'react-router-dom';

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
    <div className="modal-bg">
      <div className="modal-card">
        <h3>Complete your profile</h3>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" />
          </div>
          <div className="input-group">
            <label>Organization</label>
            <input type="text" value={organization} onChange={e => setOrganization(e.target.value)} placeholder="Organization name" />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-btn" type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</button>
          <button className="auth-btn secondary" type="button" onClick={onClose} disabled={loading}>Cancel</button>
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
              await fetch('/api/auth/avatar', {
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
          await fetch('/api/auth/avatar', {
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
        setMessage('Sign up successful! You can now sign in.');
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
        const meRes = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${data.token}` } });
        const me = await meRes.json();
        // If no name, use email prefix
        if (!me.name && me.email) {
          const name = me.email.split('@')[0];
          await fetch('/api/auth/me', {
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
    <div className="min-h-screen" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="auth-card" style={{ width: '100%', maxWidth: 400, boxShadow: '0 8px 32px #a3bffa55' }}>
        <div className="text-center" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <svg width="32" height="32" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 8 }}><path d="M12 21c-4.418 0-8-5.373-8-10a8 8 0 1 1 16 0c0 4.627-3.582 10-8 10z"/><circle cx="12" cy="11" r="3"/></svg>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Pathix</h1>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#232946', marginBottom: 2 }}>Create Your Account</div>
          <div style={{ color: '#64748b', fontSize: '1rem', marginBottom: 8 }}>Join Pathix to create premium mapping solutions for your organization</div>
        </div>
        <form className="auth-form" onSubmit={handleSubmit} autoComplete="off" style={{ width: '100%' }}>
          <div className="input-group" style={{ position: 'relative', textAlign: 'center' }}>
            <label htmlFor="avatar" style={{ color: '#64748b', fontWeight: 500 }}>Profile Image</label>
            <input name="avatar" id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} style={{ margin: '0 auto' }} />
            <button type="button" className="auth-btn secondary" style={{ margin: '8px auto', width: 'auto' }} onClick={openCamera}>Use Camera</button>
            {avatarPreview && <img src={avatarPreview} alt="Preview" style={{ width: 64, height: 64, borderRadius: '50%', margin: '8px auto' }} />}
          </div>
          {cameraOpen && (
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <video ref={videoRef} width={128} height={128} autoPlay style={{ borderRadius: 12, marginBottom: 8 }} />
              <br />
              <button type="button" className="auth-btn" style={{ width: 'auto', marginRight: 8 }} onClick={capturePhoto}>Capture</button>
              <button type="button" className="auth-btn secondary" style={{ width: 'auto' }} onClick={closeCamera}>Cancel</button>
              <canvas ref={canvasRef} width={128} height={128} style={{ display: 'none' }} />
            </div>
          )}
          <div className="input-group" style={{ position: 'relative' }}>
            <label htmlFor="name" style={{ color: '#64748b', fontWeight: 500 }}>Full Name</label>
            <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24" style={{ position: 'absolute', left: 12, top: 38, zIndex: 2 }}><circle cx="12" cy="8" r="4" /><path d="M6 20c0-2.21 3.58-4 6-4s6 1.79 6 4" /></svg>
            <input name="name" type="text" placeholder="Enter your full name" value={form.name} onChange={handleChange} required style={{ paddingLeft: 36 }} />
          </div>
          <div className="input-group" style={{ position: 'relative' }}>
            <label htmlFor="email" style={{ color: '#64748b', fontWeight: 500 }}>Email Address</label>
            <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24" style={{ position: 'absolute', left: 12, top: 38, zIndex: 2 }}><path d="M4 4h16v16H4z" fill="none"/><path d="M22 6l-10 7L2 6" /></svg>
            <input name="email" type="email" placeholder="Enter your email" value={form.email} onChange={handleChange} required style={{ paddingLeft: 36 }} />
          </div>
          <div className="input-group" style={{ position: 'relative' }}>
            <label htmlFor="phone" style={{ color: '#64748b', fontWeight: 500 }}>Phone Number</label>
            <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24" style={{ position: 'absolute', left: 12, top: 38, zIndex: 2 }}><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M16 10h.01" /></svg>
            <input name="phone" type="tel" placeholder="Enter your phone number" value={form.phone} onChange={handleChange} style={{ paddingLeft: 36 }} />
          </div>
          <div className="input-group" style={{ position: 'relative' }}>
            <label htmlFor="organization" style={{ color: '#64748b', fontWeight: 500 }}>Organization Name</label>
            <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24" style={{ position: 'absolute', left: 12, top: 38, zIndex: 2 }}><rect x="3" y="7" width="18" height="10" rx="2" /><path d="M7 7v10M17 7v10" /></svg>
            <input name="organization" type="text" placeholder="Enter your organization name" value={form.organization} onChange={handleChange} style={{ paddingLeft: 36 }} />
          </div>
          <div className="input-group" style={{ position: 'relative' }}>
            <label htmlFor="password" style={{ color: '#64748b', fontWeight: 500 }}>Password</label>
            <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24" style={{ position: 'absolute', left: 12, top: 38, zIndex: 2 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><circle cx="12" cy="10" r="1" /></svg>
            <input name="password" type="password" placeholder="Create a password" value={form.password} onChange={handleChange} required minLength={6} style={{ paddingLeft: 36 }} />
          </div>
          <div className="input-group" style={{ position: 'relative' }}>
            <label htmlFor="confirmPassword" style={{ color: '#64748b', fontWeight: 500 }}>Confirm Password</label>
            <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24" style={{ position: 'absolute', left: 12, top: 38, zIndex: 2 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><circle cx="12" cy="10" r="1" /></svg>
            <input name="confirmPassword" type="password" placeholder="Confirm your password" value={form.confirmPassword} onChange={handleChange} required minLength={6} style={{ paddingLeft: 36 }} />
          </div>
          <button className="auth-btn" type="submit" disabled={loading} style={{ marginTop: 8 }}>{loading ? 'Signing Up...' : 'Create Account'}</button>
          <div className="auth-divider"><span>or</span></div>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              width="100%"
              useOneTap
            />
          </div>
          {message && <div className="auth-success">{message}</div>}
          {error && <div className="auth-error">{error}</div>}
        </form>
        <div className="auth-footer" style={{ marginTop: 18, textAlign: 'center', fontSize: 14 }}>
          Already have an account?
          <Link to="/signin" style={{ color: '#2563eb', fontWeight: 600, marginLeft: 4, textDecoration: 'underline' }}>Sign in</Link>
        </div>
      </div>
      <PhoneOrgModal open={showModal} onClose={() => setShowModal(false)} onSubmit={handleModalSubmit} loading={modalLoading} />
    </div>
  );
} 