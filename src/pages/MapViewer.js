import React, { useEffect, useRef, useState } from 'react';

const BASE_CANVAS_WIDTH = 800;
const BASE_CANVAS_HEIGHT = 500;

// Haversine formula to calculate distance between two lat/lng points in meters
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate angle between three points (in degrees)
function getTurnAngle(p1, p2, p3) {
  const a = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const b = Math.atan2(p3.y - p2.y, p3.x - p2.x);
  let angle = (b - a) * (180 / Math.PI);
  if (angle > 180) angle -= 360;
  if (angle < -180) angle += 360;
  return angle;
}

// Snap a point to the nearest point on a polyline
function snapToPath(point, path) {
  let minDist = Infinity;
  let closestIdx = 0;
  for (let i = 0; i < path.length; i++) {
    const d = Math.hypot(point.x - path[i].x, point.y - path[i].y);
    if (d < minDist) {
      minDist = d;
      closestIdx = i;
    }
  }
  return { idx: closestIdx, pt: path[closestIdx], dist: minDist };
}

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
  const [distanceToTarget, setDistanceToTarget] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [currentInstruction, setCurrentInstruction] = useState('');
  const [stepIdx, setStepIdx] = useState(0);
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
      // Draw route to selected asset (along the path)
      if (navTarget && Array.isArray(map.gpsPath) && map.gpsPath.length > 1) {
        // Snap user and target to path
        const { idx: userIdx } = snapToPath({ x: userX, y: userY }, map.gpsPath);
        const { idx: targetIdx } = snapToPath(navTarget, map.gpsPath);
        const route = userIdx <= targetIdx ? map.gpsPath.slice(userIdx, targetIdx + 1) : map.gpsPath.slice(targetIdx, userIdx + 1).reverse();
        if (route.length > 1) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(route[0].x, route[0].y);
          for (let i = 1; i < route.length; i++) {
            ctx.lineTo(route[i].x, route[i].y);
          }
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 5;
          ctx.setLineDash([12, 10]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
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

  // Watch user position when navigation modal is open
  useEffect(() => {
    if (showNavModal && navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          setLocationError('Location access denied or unavailable.');
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
      setWatchId(id);
      return () => {
        navigator.geolocation.clearWatch(id);
        setWatchId(null);
      };
    }
    // Cleanup watcher if modal closes
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
    };
    // eslint-disable-next-line
  }, [showNavModal]);

  // Calculate distance to target when userLocation or navTarget changes
  useEffect(() => {
    if (!userLocation || !navTarget) {
      setDistanceToTarget(null);
      return;
    }
    // Use mapData.data if present, else mapData (same logic as in the drawing useEffect)
    const map = mapData.data ? mapData.data : mapData;
    if (!map?.gpsOrigin || !map?.gpsScale) {
      setDistanceToTarget(null);
      return;
    }
    // Convert asset x/y to lat/lng
    const { x, y } = navTarget;
    const { lat: originLat, lng: originLng } = map.gpsOrigin;
    const gpsScale = map.gpsScale;
    const assetLng = originLng + (x - BASE_CANVAS_WIDTH / 2) / gpsScale;
    const assetLat = originLat - (y - BASE_CANVAS_HEIGHT / 2) / gpsScale;
    const d = haversine(userLocation.lat, userLocation.lng, assetLat, assetLng);
    setDistanceToTarget(d);
  }, [userLocation, navTarget, mapData]);

  // Advanced turn-by-turn navigation logic
  useEffect(() => {
    if (!userLocation || !navTarget) {
      setCurrentInstruction('');
      return;
    }
    // Use mapData.data if present, else mapData (same logic as in the drawing useEffect)
    const map = mapData.data ? mapData.data : mapData;
    if (!map?.gpsOrigin || !map?.gpsScale || !Array.isArray(map.gpsPath)) {
      setCurrentInstruction('');
      return;
    }
    // Convert user GPS to canvas coordinates
    const { lat: originLat, lng: originLng } = map.gpsOrigin;
    const gpsScale = map.gpsScale;
    const userX = BASE_CANVAS_WIDTH / 2 + (userLocation.lng - originLng) * gpsScale;
    const userY = BASE_CANVAS_HEIGHT / 2 - (userLocation.lat - originLat) * gpsScale;
    // Snap user to path
    const { idx: userIdx } = snapToPath({ x: userX, y: userY }, map.gpsPath);
    // Snap target to path
    const { idx: targetIdx } = snapToPath(navTarget, map.gpsPath);
    // Route is from userIdx to targetIdx
    const route = userIdx <= targetIdx ? map.gpsPath.slice(userIdx, targetIdx + 1) : map.gpsPath.slice(targetIdx, userIdx + 1).reverse();
    // If at the end, arrived
    if (route.length < 2) {
      setCurrentInstruction('You have arrived at your destination.');
      window.speechSynthesis.speak(new SpeechSynthesisUtterance('You have arrived at your destination.'));
      return;
    }
    // Find next step
    let nextStep = stepIdx;
    if (nextStep >= route.length - 1) nextStep = 0;
    // Calculate direction
    let instruction = '';
    if (route.length > 2 && nextStep < route.length - 2) {
      const angle = getTurnAngle(route[nextStep], route[nextStep + 1], route[nextStep + 2]);
      if (Math.abs(angle) < 25) {
        instruction = `Continue straight for ${haversine(
          (route[nextStep].y - BASE_CANVAS_HEIGHT / 2) / -gpsScale + originLat,
          (route[nextStep].x - BASE_CANVAS_WIDTH / 2) / gpsScale + originLng,
          (route[nextStep + 1].y - BASE_CANVAS_HEIGHT / 2) / -gpsScale + originLat,
          (route[nextStep + 1].x - BASE_CANVAS_WIDTH / 2) / gpsScale + originLng
        ).toFixed(0)} meters.`;
      } else if (angle > 25) {
        instruction = `Turn left in ${haversine(
          (route[nextStep].y - BASE_CANVAS_HEIGHT / 2) / -gpsScale + originLat,
          (route[nextStep].x - BASE_CANVAS_WIDTH / 2) / gpsScale + originLng,
          (route[nextStep + 1].y - BASE_CANVAS_HEIGHT / 2) / -gpsScale + originLat,
          (route[nextStep + 1].x - BASE_CANVAS_WIDTH / 2) / gpsScale + originLng
        ).toFixed(0)} meters.`;
      } else if (angle < -25) {
        instruction = `Turn right in ${haversine(
          (route[nextStep].y - BASE_CANVAS_HEIGHT / 2) / -gpsScale + originLat,
          (route[nextStep].x - BASE_CANVAS_WIDTH / 2) / gpsScale + originLng,
          (route[nextStep + 1].y - BASE_CANVAS_HEIGHT / 2) / -gpsScale + originLat,
          (route[nextStep + 1].x - BASE_CANVAS_WIDTH / 2) / gpsScale + originLng
        ).toFixed(0)} meters.`;
      }
    } else {
      instruction = `Continue for ${haversine(
        (route[nextStep].y - BASE_CANVAS_HEIGHT / 2) / -gpsScale + originLat,
        (route[nextStep].x - BASE_CANVAS_WIDTH / 2) / gpsScale + originLng,
        (route[nextStep + 1].y - BASE_CANVAS_HEIGHT / 2) / -gpsScale + originLat,
        (route[nextStep + 1].x - BASE_CANVAS_WIDTH / 2) / gpsScale + originLng
      ).toFixed(0)} meters.`;
    }
    setCurrentInstruction(instruction);
    // Speak the instruction
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(instruction));
    // Advance step if user is close to next point
    const distToNext = Math.hypot(userX - route[nextStep + 1].x, userY - route[nextStep + 1].y);
    if (distToNext < 15 && nextStep < route.length - 2) {
      setStepIdx(nextStep + 1);
    }
    // Reset step if user restarts navigation
    if (nextStep === 0 && distToNext > 50) {
      setStepIdx(0);
    }
  }, [userLocation, navTarget, mapData, stepIdx]);

  // Reset step index when new navigation starts
  useEffect(() => {
    setStepIdx(0);
  }, [navTarget]);


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
    setShowNavModal(true);
    // Prepare asset list (landmarks)
    // Use mapData.data if present, else mapData (same logic as in the drawing useEffect)
    const map = mapData.data ? mapData.data : mapData;
    console.log('Map data structure:', { mapData, map });
    console.log('Landmarks found:', map?.landmarks);
    if (Array.isArray(map?.landmarks)) {
      const assets = map.landmarks.map((lm, i) => ({
        ...lm,
        displayName: lm.label || lm.name || `Asset #${i + 1}`
      }));
      console.log('Processed assets:', assets);
      setAssetsList(assets);
    } else {
      console.log('No landmarks array found');
      setAssetsList([]);
    }
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
                      {navTarget && distanceToTarget !== null && (
                        <div className="mt-2 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                          Distance to target: {distanceToTarget < 1000 ? `${distanceToTarget.toFixed(1)} m` : `${(distanceToTarget/1000).toFixed(2)} km`}
                        </div>
                      )}
                      {currentInstruction && (
                        <div className="mt-2 text-green-700 dark:text-green-300 text-base font-bold">
                          {currentInstruction}
                        </div>
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