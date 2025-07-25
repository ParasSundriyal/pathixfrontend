import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function ProfileEdit() {
  const [profile, setProfile] = useState({ phone: '', organization: '', avatar: '', avatarType: '' });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch profile data
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setProfile(data);
          if (data.avatar && data.avatarType) {
            setAvatarPreview(`data:${data.avatarType};base64,${data.avatar}`);
          }
        } else {
          setError(data.message || 'Failed to fetch profile');
        }
      } catch (err) {
        setError('Network error');
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = e => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        setProfile(p => ({ ...p, avatar: base64, avatarType: file.type }));
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const token = sessionStorage.getItem('token');
      // Update profile fields
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to update profile');
        setLoading(false);
        return;
      }
      // If password fields are filled, send password change request
      if (oldPassword && newPassword) {
        const resPwd = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ oldPassword, newPassword })
        });
        const dataPwd = await resPwd.json();
        if (!resPwd.ok) {
          setError(dataPwd.message || 'Failed to change password');
          setLoading(false);
          return;
        }
        setMessage('Profile and password updated');
      } else {
        setMessage(data.message || 'Profile updated');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#15192b] via-[#101117] to-[#23243a] flex flex-col items-center font-sans">
      <Navbar />
      <div className="h-16 sm:h-20" />
      <div className="w-full max-w-lg mx-auto bg-[#181c2a]/60 border border-accent-gold/60 rounded-3xl shadow-glow p-4 sm:p-8 md:p-10 backdrop-blur-xl mt-6 sm:mt-12 font-sans">
        <h2 className="text-xl sm:text-2xl font-bold text-accent-gold mb-4 sm:mb-6 text-center">Edit Profile</h2>
        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="text-center">
            <label htmlFor="avatar" className="block text-accent-gold font-medium mb-1">Profile Image</label>
            <input name="avatar" id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="mx-auto block text-xs sm:text-sm text-gray-400 file:mr-2 sm:file:mr-4 file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-gradient-to-r file:from-accent-gold file:to-yellow-400 file:text-gray-900 hover:file:from-yellow-400 hover:file:to-accent-gold" />
            {avatarPreview && <img src={avatarPreview} alt="Preview" className="w-12 h-12 sm:w-16 sm:h-16 rounded-full mx-auto mt-2 border-2 border-accent-gold shadow-glow" />}
          </div>
          <div>
            <label htmlFor="phone" className="block text-accent-gold font-medium mb-1">Phone Number</label>
            <input name="phone" type="tel" placeholder="Enter your phone number" value={profile.phone || ''} onChange={handleChange} className="w-full rounded-lg bg-white/10 border border-accent-gold text-white px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400 text-xs sm:text-base" />
          </div>
          <div>
            <label htmlFor="organization" className="block text-accent-gold font-medium mb-1">Organization Name</label>
            <input name="organization" type="text" placeholder="Enter your organization name" value={profile.organization || ''} onChange={handleChange} className="w-full rounded-lg bg-white/10 border border-accent-gold text-white px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400 text-xs sm:text-base" />
          </div>
          <div>
            <label htmlFor="oldPassword" className="block text-accent-gold font-medium mb-1">Old Password</label>
            <input name="oldPassword" type="password" placeholder="Enter old password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full rounded-lg bg-white/10 border border-accent-gold text-white px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400 text-xs sm:text-base" />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-accent-gold font-medium mb-1">New Password</label>
            <input name="newPassword" type="password" placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full rounded-lg bg-white/10 border border-accent-gold text-white px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400 text-xs sm:text-base" />
          </div>
          <button className="w-full py-2 sm:py-3 rounded-xl bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 font-bold shadow-glow hover:scale-105 transition text-base sm:text-lg" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
          {message && <div className="text-green-400 text-center font-medium mt-2">{message}</div>}
          {error && <div className="text-red-400 text-center font-medium mt-2">{error}</div>}
        </form>
      </div>
    </div>
  );
}
