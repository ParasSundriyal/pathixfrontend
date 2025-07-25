import React, { useEffect, useRef, useState } from 'react';

const BASE_CANVAS_WIDTH = 800;
const BASE_CANVAS_HEIGHT = 500;


// Extract map ID from URL path (e.g., /maps/:id)
function getMapIdFromPath() {
  const match = window.location.pathname.match(/\/maps\/(\w+)/);
  return match ? match[1] : null;
}



const MapViewer = () => {
  // All hooks must be at the top level, before any logic or early returns
  // Navigation modal state
  const [showNavModal, setShowNavModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [assetsList, setAssetsList] = useState([]);
  const [navTarget, setNavTarget] = useState(null); // selected asset for navigation
  // Map/canvas state
  const [mapData, setMapData] = useState(null);
  const [error, setError] = useState('');
  const [bgImageObj, setBgImageObj] = useState(null);
  const stageRef = useRef();
  const [canvasSize, setCanvasSize] = useState({ width: BASE_CANVAS_WIDTH, height: BASE_CANVAS_HEIGHT, scale: 1 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });


  // Responsive canvas size
  useEffect(() => {
    function updateSize() {
      const maxW = Math.min(window.innerWidth - 32, BASE_CANVAS_WIDTH);
      const scale = maxW / BASE_CANVAS_WIDTH;
      setCanvasSize({
        width: Math.round(BASE_CANVAS_WIDTH * scale),
        height: Math.round(BASE_CANVAS_HEIGHT * scale),
        scale: scale * zoom,
      });
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
    // eslint-disable-next-line
  }, [zoom]);

  // Reset pan when zoom is reset to 1
  useEffect(() => {
    if (zoom === 1 && (pan.x !== 0 || pan.y !== 0)) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

  // Load map data from backend using map ID in URL path (decrement scan only on initial fetch)
  // IMPORTANT: Only this fetch should use ?decrementScan=true. All other fetches (e.g., theme, assets) must NOT use this parameter.
  const didFetchRef = useRef(false);
  useEffect(() => {
  if (didFetchRef.current) return; // prevent second fetch
    didFetchRef.current = true;
    const mapId = getMapIdFromPath();
    if (mapId) {
      fetch(`${process.env.REACT_APP_API_URL}/api/maps/${mapId}?decrementScan=true`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch map');
          return res.json();
        })
        .then(data => setMapData(data))
        .catch(() => setError('Failed to load map data.'));
    }
  }, []);

  // Load background image if present
  useEffect(() => {
    if (mapData?.theme?.backgroundImage) {
      const img = new window.Image();
      img.src = mapData.theme.backgroundImage;
      img.onload = () => setBgImageObj(img);
    } else {
      setBgImageObj(null);
    }
  }, [mapData]);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target.result);
        setMapData(data);
        setError('');
      } catch {
        setError('Invalid map file.');
      }
    };
    reader.readAsText(file);
  };

  // Draw the map on canvas (responsive)
  useEffect(() => {
    if (!mapData) return;
    // Use mapData.data if present, else mapData
    const map = mapData.data ? mapData.data : mapData;
    const canvas = stageRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    ctx.save();
    ctx.scale(canvasSize.scale, canvasSize.scale);
    // Pan (translate) if zoomed in
    if (zoom > 1) {
      ctx.translate(pan.x, pan.y);
    }
    // Draw background
    if (bgImageObj) {
      ctx.drawImage(bgImageObj, 0, 0, BASE_CANVAS_WIDTH, BASE_CANVAS_HEIGHT);
    } else if (map.theme?.backgroundColor) {
      ctx.fillStyle = map.theme.backgroundColor;
      ctx.fillRect(0, 0, BASE_CANVAS_WIDTH, BASE_CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#e0e7ff';
      ctx.fillRect(0, 0, BASE_CANVAS_WIDTH, BASE_CANVAS_HEIGHT);
    }
    // Draw GPS path
    if (Array.isArray(map.gpsPath) && map.gpsPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = map.theme?.roadStyle?.color || '#eebbc3';
      ctx.lineWidth = map.theme?.roadStyle?.width || 8;
      ctx.lineCap = map.theme?.roadStyle?.lineCap || 'round';
      ctx.beginPath();
      ctx.moveTo(map.gpsPath[0].x, map.gpsPath[0].y);
      for (let i = 1; i < map.gpsPath.length; i++) {
        ctx.lineTo(map.gpsPath[i].x, map.gpsPath[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
    // Draw landmarks
    if (Array.isArray(map.landmarks)) {
      for (const lm of map.landmarks) {
        // Draw icon (emoji or image)
        if (lm.icon && lm.icon.startsWith('http')) {
          const img = new window.Image();
          img.src = lm.icon;
          img.onload = () => {
            ctx.drawImage(img, lm.x, lm.y, lm.width || 48, lm.height || 48);
          };
        } else {
          ctx.font = `${lm.width || 32}px ${map.theme?.fonts?.[0] || 'Poppins, Arial, sans-serif'}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(lm.icon || '•', lm.x + (lm.width || 24), lm.y + (lm.height || 24));
        }
        // Draw label
        if (lm.label) {
          ctx.font = `16px ${map.theme?.fonts?.[0] || 'Poppins, Arial, sans-serif'}`;
          ctx.fillStyle = '#555';
          ctx.textAlign = 'left';
          ctx.fillText(lm.label, lm.x, lm.y + (lm.height || 48) + 16);
        }
      }
    }
    // Draw user's current location (if available)
    if (userLocation && map.gpsOrigin && map.gpsScale) {
      // Convert user lat/lng to canvas coordinates using map's gpsOrigin and gpsScale
      const { lat, lng } = userLocation;
      const { lat: originLat, lng: originLng } = map.gpsOrigin;
      const gpsScale = map.gpsScale;
      const userX = BASE_CANVAS_WIDTH / 2 + (lng - originLng) * gpsScale;
      const userY = BASE_CANVAS_HEIGHT / 2 - (lat - originLat) * gpsScale;
      ctx.save();
      ctx.beginPath();
      ctx.arc(userX, userY, 12, 0, 2 * Math.PI);
      ctx.fillStyle = '#e11d48';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#e11d48';
      ctx.textAlign = 'left';
      ctx.fillText('You', userX + 16, userY - 8);
      ctx.restore();
      // Draw route to selected asset
      if (navTarget) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(userX, userY);
        ctx.lineTo(navTarget.x + (navTarget.width || 24), navTarget.y + (navTarget.height || 24));
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 5;
        ctx.setLineDash([12, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }
    // Draw map name
    if (mapData.name) {
      ctx.font = `30px ${map.theme?.fonts?.[0] || 'Poppins, Arial, sans-serif'}`;
      ctx.fillStyle = '#888';
      ctx.textAlign = 'center';
      ctx.fillText(mapData.name, BASE_CANVAS_WIDTH / 2, 35);
    }
    // Draw scale bar
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, BASE_CANVAS_HEIGHT - 40);
    ctx.lineTo(130, BASE_CANVAS_HEIGHT - 40);
    ctx.stroke();
    ctx.font = '16px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText('100 m', 30, BASE_CANVAS_HEIGHT - 20);
    ctx.restore();
    ctx.restore();
  }, [mapData, bgImageObj, canvasSize, userLocation, navTarget, pan.x, pan.y, zoom]);



  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow text-red-600">{error}</div>
        <input type="file" accept=".json" onChange={handleFileUpload} className="mt-4" />
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">Loading map...</div>
        <input type="file" accept=".json" onChange={handleFileUpload} className="mt-4" />
      </div>
    );
  }

  // Open navigation modal: ask for location, then show assets
  const handleOpenNavigation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setShowNavModal(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        // Prepare asset list (landmarks)
        if (Array.isArray(mapData?.landmarks)) {
          setAssetsList(mapData.landmarks.map((lm, i) => ({
            ...lm,
            displayName: lm.label || lm.name || `Asset #${i + 1}`
          })));
        } else {
          setAssetsList([]);
        }
        setShowNavModal(true);
      },
      (err) => {
        setLocationError('Location access denied or unavailable.');
        setShowNavModal(true);
      }
    );
  };

  // Select asset to navigate to (future: implement navigation logic)
  const handleSelectAsset = (asset) => {
    setNavTarget(asset);
    setShowNavModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <header className="flex flex-col items-center py-4 font-sans">
        <div className="flex items-center gap-2 text-3xl font-bold font-serif ">
          <span role="img" aria-label="map">🗺️</span>
          <span className=" text-[oklch(78.9%_0.154_211.53)]">Pathix Map Viewer</span>
        </div>
        <div className="subtitle text-gray-400 dark:text-blue-100 text-m mt-1 ml-2 font-sans">View property maps shared via QR or file</div>
      </header>
      <div className="flex flex-col items-center max-w-4xl mx-auto w-full gap-4 px-2 font-sans">
        <div className="map-area flex flex-col items-center bg-white/10 dark:bg-gray-900/80 rounded-2xl shadow-lg m-2 p-2 border border-white/10 dark:border-gray-700 w-full" style={{maxWidth: 900}}>
          <div className="map-canvas-card relative w-full flex justify-center items-center rounded-2xl shadow-lg border border-white/10 dark:border-gray-700 bg-white/10 dark:bg-gray-900/80 overflow-x-auto" style={{ minHeight: canvasSize.height + 40 }}>
            <canvas
              ref={stageRef}
              width={canvasSize.width}
              height={canvasSize.height}
              style={{ background: 'transparent', borderRadius: 12, width: canvasSize.width, height: canvasSize.height, maxWidth: '100%', touchAction: 'manipulation', cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
              onPointerDown={e => {
                if (zoom <= 1) return;
                setIsPanning(true);
                panStart.current = { x: e.clientX, y: e.clientY };
                panOrigin.current = { ...pan };
              }}
              onPointerMove={e => {
                if (!isPanning) return;
                const dx = (e.clientX - panStart.current.x) / canvasSize.scale;
                const dy = (e.clientY - panStart.current.y) / canvasSize.scale;
                // Clamp pan so you can't pan out of bounds
                let newX = panOrigin.current.x + dx;
                let newY = panOrigin.current.y + dy;
                const maxPanX = (BASE_CANVAS_WIDTH * (zoom - 1)) / zoom;
                const maxPanY = (BASE_CANVAS_HEIGHT * (zoom - 1)) / zoom;
                newX = Math.max(-maxPanX, Math.min(0, newX));
                newY = Math.max(-maxPanY, Math.min(0, newY));
                setPan({ x: newX, y: newY });
              }}
              onPointerUp={() => setIsPanning(false)}
              onPointerLeave={() => setIsPanning(false)}
            />
            {/* Zoom controls (mobile) */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10 md:hidden">
              <button
                className="rounded-full bg-blue-600 text-white w-9 h-9 text-lg shadow hover:bg-blue-700 flex items-center justify-center border border-white/30"
                style={{ boxShadow: '0 2px 8px #0002' }}
                aria-label="Zoom in"
                onClick={() => setZoom(z => Math.min(4, z * 1.1))}
              >
                <span style={{fontWeight: 'bold', fontSize: 22, lineHeight: 1}}>+</span>
              </button>
              <button
                className="rounded-full bg-blue-600 text-white w-9 h-9 text-lg shadow hover:bg-blue-700 flex items-center justify-center border border-white/30"
                style={{ boxShadow: '0 2px 8px #0002' }}
                aria-label="Zoom out"
                onClick={() => setZoom(z => Math.max(0.5, z / 1.1))}
              >
                <span style={{fontWeight: 'bold', fontSize: 22, lineHeight: 1}}>-</span>
              </button>
            </div>
            {/* Navigation button (top right) */}
            <button
              className="absolute top-4 right-4 z-20 bg-green-600 hover:bg-green-700 text-white rounded-full shadow px-4 py-2 text-sm font-semibold flex items-center gap-2 border border-white/30"
              style={{ boxShadow: '0 2px 8px #0002' }}
              onClick={handleOpenNavigation}
            >
              <span role="img" aria-label="navigate">🧭</span> Navigate
            </button>
            {/* Navigation Modal */}
            {showNavModal && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 max-w-xs w-full relative">
                  <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white" onClick={() => setShowNavModal(false)}>&times;</button>
                  <div className="font-bold text-lg mb-2 flex items-center gap-2"><span role="img" aria-label="navigate">🧭</span>Navigate to Asset</div>
                  {locationError && <div className="text-red-600 text-sm mb-2">{locationError}</div>}
                  {!locationError && !userLocation && <div className="text-gray-500 text-sm mb-2">Requesting location...</div>}
                  {userLocation && (
                    <>
                      {assetsList.length === 0 ? (
                        <div className="text-gray-500 text-sm">No assets found on this map.</div>
                      ) : (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-48 overflow-y-auto my-2">
                          {assetsList.map((asset, i) => (
                            <li key={i} className="py-2 flex items-center gap-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 rounded px-2" onClick={() => handleSelectAsset(asset)}>
                              <span className="text-xl">{asset.icon || '📍'}</span>
                              <span className="font-medium">{asset.displayName}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 text-gray-500 text-xs text-center">Upload a map JSON file or scan a QR code to view a map.</div>
        <input type="file" accept=".json" onChange={handleFileUpload} className="mt-2" style={{maxWidth: 300}} />
      </div>
      <footer className="text-center text-gray-400 text-xs my-4">&copy; 2024 Pathix &mdash; Map Viewer</footer>
    </div>
  );
};

export default MapViewer;