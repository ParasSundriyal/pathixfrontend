
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { FaQrcode, FaTrash, FaPlus, FaCheckCircle } from 'react-icons/fa';
import logo from '../logo.svg';   // Assuming you have a logo.svg in your src folder

// --- Dashboard UI ---
function DashboardHeader({ plan, scanCount, onAddMap, mapCount }) {
  // Tooltip state for scan limit
  const [showTooltip, setShowTooltip] = useState(false);
  // Set maxScanCount based on plan
  let maxScanCount = 100;
  if (plan && plan.toLowerCase().includes('starter')) maxScanCount = 50;
  if (plan && plan.toLowerCase().includes('pro')) maxScanCount = 1000;
  const percent = Math.max(0, Math.min(100, Math.round((scanCount / maxScanCount) * 100)));
  // Determine if user can add a new map
  const isStarter = plan && plan.toLowerCase().includes('starter');
  const isPro = plan && plan.toLowerCase().includes('pro');
  const canAddMap = isPro || (!isPro && !isStarter) || (isStarter && mapCount < 1);
  const [showAddTooltip, setShowAddTooltip] = useState(false);
  return (
    <div className="flex flex-col items-center mb-6 w-full">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 mb-4 flex-wrap md:flex-nowrap">
        <div className="relative flex items-center mb-3 md:mb-0 w-full md:w-auto justify-center md:justify-start">
          <button
            onClick={canAddMap ? onAddMap : undefined}
            className={`px-6 py-2 rounded-lg bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 font-bold shadow-glow text-lg flex items-center gap-2 whitespace-nowrap transition-all ${canAddMap ? 'hover:scale-105' : 'opacity-60 cursor-not-allowed'}`}
            disabled={!canAddMap}
            onMouseEnter={() => !canAddMap && setShowAddTooltip(true)}
            onMouseLeave={() => setShowAddTooltip(false)}
            tabIndex={0}
          >
            <FaPlus /> Add New Map
          </button>
          {!canAddMap && showAddTooltip && (
            <div className="absolute left-1/2 top-[-38px] -translate-x-1/2 bg-[#23243aee] text-yellow-100 text-xs font-semibold px-3 py-2 rounded-xl shadow-glow border border-accent-gold z-10 animate-fadeIn">
              Starter plan allows only one map. Upgrade for unlimited maps.
            </div>
          )}
        </div>
        <div className="flex-1 flex justify-center mb-3 md:mb-0 w-full md:w-auto">
          {plan && (
            <div className="bg-[#181c2a]/60 border border-accent-gold rounded-xl px-6 py-3 shadow-glow text-yellow-100 font-bold text-lg flex items-center gap-3 mx-auto">
              <FaCheckCircle className="text-accent-gold" /> {plan} Plan
              {!(plan && plan.toLowerCase().includes('pro')) && (
                <a
                  href="https://forms.gle/XSKeisu5q5YWahgY8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-300 to-yellow-500 text-gray-900 font-bold shadow-glow text-sm hover:scale-105 transition-all"
                >
                  Upgrade to Pro
                </a>
              )}
            </div>
          )}
        </div>
        <div className="relative flex items-center justify-center w-full md:w-auto">
          <div
            className="w-20 h-20 flex flex-col items-center justify-center shadow-glow cursor-pointer bg-[#181c2aee] rounded-2xl border-2 border-accent-gold"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            tabIndex={0}
            aria-label="Scans Left"
            style={{ position: 'relative', boxShadow: '0 0 32px 0 #FFD70088, 0 0 8px 0 #FFD700' }}
          >
            <svg width="80" height="80" viewBox="0 0 80 80" className="absolute top-0 left-0">
              <circle cx="40" cy="40" r="32" stroke="#23243a" strokeWidth="8" fill="none" />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="url(#scanGradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 32}
                strokeDashoffset={2 * Math.PI * 32 * (1 - percent / 100)}
                style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)', filter: 'drop-shadow(0 0 8px #FFD700)' }}
              />
              <defs>
                <linearGradient id="scanGradient" x1="0" y1="0" x2="80" y2="80">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#FFEA70" />
                </linearGradient>
              </defs>
            </svg>
            <span className="z-10 text-yellow-100 font-extrabold text-3xl drop-shadow-lg" style={{ textShadow: '0 0 8px #FFD700' }}>{scanCount}</span>
            <span className="z-10 text-yellow-100 font-bold text-lg mt-[-2px]" style={{ textShadow: '0 0 8px #FFD700' }}>Scans</span>
            <span className="z-10 text-yellow-100 font-bold text-lg mt-[-8px]" style={{ textShadow: '0 0 8px #FFD700' }}>Left</span>
            {showTooltip && (
              <div className="absolute left-1/2 top-[-48px] -translate-x-1/2 bg-[#23243aee] text-yellow-100 text-xs font-semibold px-3 py-2 rounded-xl shadow-glow border border-accent-gold z-10 animate-fadeIn">
                Number of scans you can perform this month. Upgrade for more.
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Removed duplicate plan display below header row */}
      <style>{`
        @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 2.5s linear infinite; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.2s ease; }
      `}</style>
    </div>
  );
}

function DashboardMapList({ maps, onDelete, onDownloadQR }) {
  const [qrModal, setQrModal] = useState({ open: false, mapId: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const handleOpenMap = async (mapId) => {
    const token = sessionStorage.getItem('token');
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/maps/${mapId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {}
    window.location.href = `/maps/${mapId}`;
  };
  const handleShowQR = (mapId) => {
    const map = maps.find(m => m._id === mapId);
    setQrModal({ open: true, mapId, mapName: map ? map.name : '' });
    setSnackbar({ open: true, message: 'QR code generated!' });
    setTimeout(() => setSnackbar({ open: false, message: '' }), 2000);
  };
  const handleCloseQR = () => {
    setQrModal({ open: false, mapId: null });
  };
  const handleDownloadQR = async () => {
    if (!qrModal.mapId) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location}/api/maps/${qrModal.mapId}`)}`;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const safeName = qrModal.mapName ? qrModal.mapName.replace(/[^a-zA-Z0-9-_]/g, '_') : `map-${qrModal.mapId}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeName}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: 'QR code downloaded!' });
      setTimeout(() => setSnackbar({ open: false, message: '' }), 2000);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to download QR code.' });
      setTimeout(() => setSnackbar({ open: false, message: '' }), 2000);
    }
  };
  const handleCopyLink = (mapId) => {
    navigator.clipboard.writeText(`${window.location.origin}/maps/${mapId}`);
    setSnackbar({ open: true, message: 'Map link copied!' });
    setTimeout(() => setSnackbar({ open: false, message: '' }), 2000);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {maps.map(map => (
          <div key={map._id} className="rounded-3xl bg-gradient-to-br from-[#23243aee] to-[#181c2aee] border border-accent-gold shadow-glass p-7 flex flex-col gap-4 transition-all duration-300 hover:shadow-glow hover:border-yellow-400/60 hover:-translate-y-2 hover:scale-105 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-accent-gold to-yellow-400 animate-pulse"></span>
              <span className="font-bold text-yellow-100 text-xl tracking-wide">{map.name}</span>
            </div>
            <div className="flex gap-4 items-center mt-2">
              <button onClick={() => handleOpenMap(map._id)} className="px-5 py-2 rounded-xl bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 font-bold shadow-glow text-base hover:scale-110 transition-all">Open</button>
              <button onClick={() => handleShowQR(map._id)} className="px-5 py-2 rounded-xl bg-gradient-to-r from-yellow-300 to-yellow-500 text-gray-900 font-bold shadow-glow flex items-center gap-2 text-base hover:scale-110 transition-all"><FaQrcode className="text-lg" /> QR</button>
              <button onClick={() => onDelete(map._id)} className="px-5 py-2 rounded-xl bg-gray-700 text-white font-bold shadow hover:bg-gray-600 transition flex items-center gap-2 text-base hover:scale-110"> <FaTrash className="text-lg" /> Delete</button>
            </div>
            <div className="text-gray-400 text-sm mt-3 flex items-center gap-2">
              <a href={`/maps/${map._id}`} target="_blank" rel="noopener noreferrer" className="underline text-accent-gold hover:text-yellow-400 transition-all">/maps/{map._id}</a>
              <button
                onClick={() => handleCopyLink(map._id)}
                className="ml-2 px-2 py-1 rounded bg-accent-gold text-gray-900 font-bold text-xs shadow hover:bg-yellow-400 transition-all"
                title="Copy link"
              >Copy</button>
            </div>
          </div>
        ))}
      </div>
      {qrModal.open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md animate-fadeIn">
          <div className="bg-gradient-to-br from-[#23243aee] via-[#181c2aee] to-[#23243aee] rounded-3xl p-9 shadow-glow flex flex-col items-center relative min-w-[360px] max-w-sm border-2 border-accent-gold animate-slideUp backdrop-blur-lg">
            <div className="w-full flex justify-between items-center mb-4">
              <div className="font-bold text-accent-gold text-lg tracking-wide">Map QR Code</div>
              <button
                onClick={handleCloseQR}
                aria-label="Close QR modal"
                className="text-gray-400 hover:text-yellow-400 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-full w-8 h-8 flex items-center justify-center transition-all"
                tabIndex={0}
              >
                ×
              </button>
            </div>
            <div className="w-full border-b border-accent-gold/30 mb-4"></div>
            <div className="mb-3 text-yellow-100 font-semibold text-center text-base px-2 break-words w-full">{qrModal.mapName}</div>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location}/api/maps/${qrModal.mapId}`)}`} alt="QR Code" className="w-48 h-48 mb-5 rounded-xl border-2 border-accent-gold shadow-glow bg-white transition-all duration-300" />
            <button onClick={handleDownloadQR} className="px-7 py-2 rounded-xl bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 font-bold shadow-glow text-lg hover:scale-110 transition-all mt-2 w-full">Download QR</button>
          </div>
        </div>,
        document.body
      )}
      {snackbar.open && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#23243aee] text-yellow-100 font-bold px-6 py-3 rounded-xl shadow-glow border border-accent-gold z-50 animate-fadeIn text-center text-base">
          {snackbar.message}
        </div>
      )}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease; }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1); }
      `}</style>
    </>
  );
}

// --- Main Dashboard Component ---
export default function Dashboard() {
  const [maps, setMaps] = useState([]);
  const [plan, setPlan] = useState('');
  const [scanCount, setScanCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user info and maps
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const [userRes, mapsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.REACT_APP_API_URL}/api/maps`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const userData = await userRes.json();
      const mapsData = await mapsRes.json();
      setMaps(mapsData.maps || []);
      setPlan(userData.accountType || 'Plan not found');
      setScanCount(userData.scanLeft || 0);
    } catch (err) {
      // handle error
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDelete = async (mapId) => {
    if (!window.confirm('Delete this map?')) return;
    const token = sessionStorage.getItem('token');
    await fetch(`${process.env.REACT_APP_API_URL}/api/maps/${mapId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    // Refetch dashboard data after delete
    fetchDashboardData();
  };

  const handleAddMap = () => {
    navigate('/drawMap');
  };

  // QR modal logic now handled in DashboardMapList

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#15192b] via-[#101117] to-[#23243a] flex flex-col items-center font-sans">
      <Navbar />
      <div className="h-20" />
      <section className="w-full max-w-5xl mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold text-accent-gold mb-4 ">Dashboard</h2>
       
        <DashboardHeader plan={plan} scanCount={scanCount} onAddMap={handleAddMap} mapCount={maps.length} />
         <h4 className="text-3xl font-bold text-accent-gold mb-8 ">Your Maps</h4>
        {loading ? (
          <div className="text-center text-yellow-300">Loading...</div>
        ) : (
          <DashboardMapList maps={maps} onDelete={handleDelete} />
        )}
      </section>
    </div>
  );
}
// ...existing code...
