import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../logo.svg';

export default function Navbar() {
  const [user, setUser] = useState({ organization: '', avatar: '', avatarType: '' });
  const [loggedIn, setLoggedIn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setLoggedIn(false);
        return;
      }
      setLoggedIn(true);
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data);
        }
      } catch {}
    };
    fetchUser();
  }, []);

  const avatarUrl = user.avatar && user.avatarType ? `data:${user.avatarType};base64,${user.avatar}` : null;

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <nav className="w-full flex flex-wrap items-center justify-between px-4 sm:px-8 md:px-16 lg:px-20 py-4 sm:py-6 fixed top-0 left-0 z-40 bg-[#181c2aee] backdrop-blur-xl">
      <Link to="/" className="flex items-center gap-2 sm:gap-3">
        <img src={logo} alt="Pathix Logo" className="h-8 w-8 sm:h-10 sm:w-10 drop-shadow-[0_0_12px_#f6d365]" />
        <span className="text-xl sm:text-3xl font-extrabold font-sans bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_#f6d365] tracking-wide ml-1 sm:ml-2">Pathix</span>
      </Link>
      {loggedIn && (
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((open) => !open)}
            className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 rounded-full hover:bg-accent-gold/20 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400"
            style={{ minWidth: 0 }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-accent-gold shadow-glow object-cover" />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r from-accent-gold to-yellow-400 flex items-center justify-center text-gray-900 font-bold text-lg border-2 border-accent-gold shadow-glow">
                {user.organization ? user.organization[0].toUpperCase() : <span className="text-gray-500">?</span>}
              </div>
            )}
            <span className="font-bold text-yellow-100 text-base sm:text-lg truncate max-w-[80px] sm:max-w-[120px]">{user.organization || 'Profile'}</span>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-[#23243a] border border-accent-gold rounded-xl shadow-glow py-2 z-50">
              <button onClick={() => { setDropdownOpen(false); navigate('/ProfileEdit'); }} className="w-full text-left px-5 py-2 text-yellow-100 hover:bg-accent-gold/20 font-semibold">Settings</button>
              <button onClick={handleLogout} className="w-full text-left px-5 py-2 text-red-400 hover:bg-red-400/20 font-semibold">Logout</button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
