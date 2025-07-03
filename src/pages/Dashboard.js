import React, { useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import '../style_index.css';

// Landmark palette data
const landmarkIcons = [
  { type: 'house', icon: '🏠', label: 'Home' },
  { type: 'tree', icon: '🌳', label: 'Landmark' },
  { type: 'building', icon: '🏢', label: 'Building' },
  { type: 'hospital', icon: '🏥', label: 'Hospital' },
  { type: 'police', icon: '🚓', label: 'Police' },
  { type: 'cafe', icon: '☕', label: 'Cafe' },
  { type: 'pool', icon: '🏊', label: 'Pool' },
  { type: 'school', icon: '🏫', label: 'School' },
  { type: 'toilet', icon: '🚻', label: 'Toilet' },
  { type: 'villa', icon: '🏡', label: 'Villa' },
  { type: 'apartment', icon: '🏬', label: 'Apartment' },
  { type: 'shop', icon: '🏪', label: 'Shop' },
  { type: 'church', icon: '⛪', label: 'Church' },
  { type: 'mosque', icon: '🕌', label: 'Mosque' },
  { type: 'synagogue', icon: '🕍', label: 'Synagogue' },
  { type: 'bank', icon: '🏦', label: 'Bank' },
  { type: 'fire', icon: '🚒', label: 'Fire' },
  { type: 'pharmacy', icon: '💊', label: 'Pharmacy' },
  { type: 'restaurant', icon: '🍽️', label: 'Restaurant' },
  { type: 'parking', icon: '🅿️', label: 'Parking' },
];

const themes = {
  classic: {
    background: '#e0e7ff',
    roadColor: '#374151',
  },
  night: {
    background: '#232946',
    roadColor: '#eebbc3',
  },
};

const DEFAULT_ORIGIN = { lat: 28.6139, lng: 77.2090 };
const DEFAULT_SCALE = 10000;

const BG_IMAGE_SRC = '/Assets/bg1.png';
const HOTEL_ICON_SRC = '/assets/landmark-hotel.png';

const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

function MapNameModal({ open, onClose, onSubmit, loading }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Map name is required');
      return;
    }
    setError('');
    onSubmit(name.trim());
  };
  if (!open) return null;
  return (
    <div className="modal-bg">
      <div className="modal-card">
        <h3>Save Map</h3>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Map Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter map name" />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-btn" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          <button className="auth-btn secondary" type="button" onClick={onClose} disabled={loading}>Cancel</button>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const containerRef = useRef();
  const stageRef = useRef();
  const [theme, setTheme] = useState('night');
  const [gpsTracking, setGpsTracking] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('OFF');
  const [drawing, setDrawing] = useState(false);
  const [simRoute, setSimRoute] = useState(null);
  const [exportMsg, setExportMsg] = useState('');
  const [dragType, setDragType] = useState(null);
  const [landmarks, setLandmarks] = useState([]); // {type, x, y, label}
  const [roads, setRoads] = useState([]); // array of arrays of points
  const [currentLine, setCurrentLine] = useState(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 500 });
  const [scale, setScale] = useState(1);
  const [popup, setPopup] = useState(null); // {x, y, idx, label}
  const [gpsOrigin, setGpsOrigin] = useState(DEFAULT_ORIGIN);
  const [gpsScale] = useState(DEFAULT_SCALE);
  const [bgImageLoaded, setBgImageLoaded] = useState(false);
  const [hotelIconLoaded, setHotelIconLoaded] = useState(false);
  const [bgImage, setBgImage] = useState(null);
  const [hotelIcon, setHotelIcon] = useState(null);
  const [panMode, setPanMode] = useState(false);
  const [lastDist, setLastDist] = useState(null);
  const [lastCenter, setLastCenter] = useState(null);
  const [simulated, setSimulated] = useState(false);
  const gpsWatchId = useRef(null);
  const [popupAbs, setPopupAbs] = useState(null); // {left, top, idx, label}
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupInput, setPopupInput] = useState('');
  const [popupIdx, setPopupIdx] = useState(null);
  const [popupCoords, setPopupCoords] = useState({left:0,top:0});
  const [showMapNameModal, setShowMapNameModal] = useState(false);
  const [maps, setMaps] = useState([]);
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapSaveLoading, setMapSaveLoading] = useState(false);
  const [mapMessage, setMapMessage] = useState('');
  const [mapError, setMapError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth <= 600);
  const [liveLocation, setLiveLocation] = useState(null); // {x, y}
  const [geoError, setGeoError] = useState('');
  const [shareUrl, setShareUrl] = useState('');

  // Responsive resizing
  useEffect(() => {
    function handleResize() {
      const width = Math.min(900, window.innerWidth - 40);
      const height = Math.max(400, Math.round(width * 0.625));
      setStageSize({ width, height });
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load background and hotel icon images
  useEffect(() => {
    const img = new window.Image();
    img.src = BG_IMAGE_SRC;
    img.onload = () => { setBgImage(img); setBgImageLoaded(true); };
    const hotel = new window.Image();
    hotel.src = HOTEL_ICON_SRC;
    hotel.onload = () => { setHotelIcon(hotel); setHotelIconLoaded(true); };
  }, []);

  // Konva setup and event logic
  useEffect(() => {
    if (!containerRef.current) return;
    const { width, height } = stageSize;
    containerRef.current.innerHTML = '';
    const stage = new Konva.Stage({
      container: containerRef.current,
      width,
      height,
      scaleX: scale,
      scaleY: scale,
    });
    stageRef.current = stage;
    // Layers
    const backgroundLayer = new Konva.Layer();
    const roadLayer = new Konva.Layer();
    const landmarkLayer = new Konva.Layer();
    stage.add(backgroundLayer);
    stage.add(roadLayer);
    stage.add(landmarkLayer);
    // Draw background image or color
    if (bgImageLoaded && bgImage) {
      const bg = new Konva.Image({ image: bgImage, width, height, opacity: 1 });
      backgroundLayer.add(bg);
      backgroundLayer.draw();
    } else {
      const bgRect = new Konva.Rect({ x: 0, y: 0, width, height, fill: themes[theme].background });
      backgroundLayer.add(bgRect);
      backgroundLayer.draw();
    }
    // Map name
    const mapName = new Konva.Text({
      x: width / 2 - 40,
      y: 15,
      text: 'Map Name',
      fontSize: 30,
      fontFamily: 'Poppins',
      fill: 'Grey',
    });
    backgroundLayer.add(mapName);
    backgroundLayer.draw();
    // Add hotel icon
    if (hotelIconLoaded && hotelIcon) {
      const icon = new Konva.Image({
        image: hotelIcon,
        x: 200,
        y: 300,
        width: 80,
        height: 80,
        draggable: true
      });
      landmarkLayer.add(icon);
      stage.add(landmarkLayer);
    }
    // Draw existing roads
    roads.forEach(points => {
      const line = new Konva.Line({
        points,
        stroke: themes[theme].roadColor,
        strokeWidth: 8,
        lineCap: 'round',
        lineJoin: 'round',
      });
      roadLayer.add(line);
    });
    roadLayer.draw();
    // Debug: Draw a marker at the center of the canvas
    const centerMarker = new Konva.Circle({
      x: stageSize.width / 2,
      y: stageSize.height / 2,
      radius: 8,
      fill: '#00f',
    });
    roadLayer.add(centerMarker);
    roadLayer.draw();
    // Draw live location marker if available
    if (gpsTracking && liveLocation) {
      console.log('Drawing live marker at:', liveLocation.x, liveLocation.y, liveLocation.lat, liveLocation.lng);
      const marker = new Konva.Circle({
        x: liveLocation.x,
        y: liveLocation.y,
        radius: 12,
        fill: '#ff9800',
        stroke: '#fff',
        strokeWidth: 3,
        shadowBlur: 8,
        shadowColor: '#ff9800',
      });
      roadLayer.add(marker);
      roadLayer.draw();
    }
    // Draw simulated route
    if (simRoute) {
      const simLine = new Konva.Line({
        points: simRoute,
        stroke: '#43a047',
        strokeWidth: 8,
        lineCap: 'round',
        lineJoin: 'round',
        dash: [18, 12],
        shadowBlur: 8,
        shadowColor: '#43a047',
      });
      roadLayer.add(simLine);
      roadLayer.draw();
    }
    // Draw landmarks
    landmarks.forEach((lm, idx) => {
      const icon = new Konva.Text({
        x: lm.x - 16,
        y: lm.y - 16,
        text: landmarkIcons.find(i => i.type === lm.type)?.icon || '❓',
        fontSize: 32,
        draggable: true,
        shadowColor: '#000',
        shadowBlur: 4,
        shadowOffset: { x: 2, y: 2 },
        shadowOpacity: 0.3,
      });
      // Open naming popup on double-click (desktop)
      icon.on('dblclick dbltap', () => {
        setPopup({ x: lm.x, y: lm.y, idx, label: lm.label || '' });
      });
      // Open naming popup on click/tap (for backward compatibility)
      icon.on('click tap', () => {
        setPopup({ x: lm.x, y: lm.y, idx, label: lm.label || '' });
      });
      // Update position directly on dragend
      icon.on('dragend', e => {
        const { x, y } = e.target.position();
        setLandmarks(lms => lms.map((l, i) => i === idx ? { ...l, x: x + 16, y: y + 16 } : l));
      });
      landmarkLayer.add(icon);
      // Add label below the icon if present
      if (lm.label) {
        const labelText = new Konva.Text({
          x: lm.x - 32,
          y: lm.y + 20,
          text: lm.label,
          fontSize: 16,
          fill: '#fff',
          fontStyle: 'bold',
          shadowColor: '#000',
          shadowBlur: 2,
          shadowOffset: { x: 1, y: 1 },
          shadowOpacity: 0.2,
          align: 'center',
          width: 64,
        });
        landmarkLayer.add(labelText);
      }
    });
    landmarkLayer.draw();
    // Drawing logic
    let isDrawing = false;
    let currentPoints = [];
    stage.on('mousedown touchstart', (e) => {
      if (e.target !== stage) return;
      isDrawing = true;
      currentPoints = [e.evt.offsetX, e.evt.offsetY];
      const line = new Konva.Line({
        points: currentPoints,
        stroke: themes[theme].roadColor,
        strokeWidth: 8,
        lineCap: 'round',
        lineJoin: 'round',
      });
      roadLayer.add(line);
      setCurrentLine(line);
    });
    stage.on('mousemove touchmove', (e) => {
      if (!isDrawing || !currentLine) return;
      currentPoints.push(e.evt.offsetX, e.evt.offsetY);
      currentLine.points(currentPoints);
      roadLayer.batchDraw();
    });
    stage.on('mouseup touchend', (e) => {
      if (!isDrawing || !currentLine) return;
      setRoads(r => [...r, currentLine.points()]);
      setCurrentLine(null);
      isDrawing = false;
    });
    // Mouse wheel zoom
    stage.container().addEventListener('wheel', (e) => {
      e.preventDefault();
      let direction = e.deltaY > 0 ? -1 : 1;
      let newScale = direction > 0 ? scale * 1.1 : scale / 1.1;
      newScale = Math.max(0.5, Math.min(4, newScale));
      setScale(newScale);
    });
    // Clean up
    return () => {
      stage.destroy();
    };
    // eslint-disable-next-line
  }, [theme, roads, landmarks, simRoute, scale, stageSize, bgImageLoaded, bgImage, hotelIconLoaded, hotelIcon, liveLocation, gpsTracking]);

  // Handle theme switching
  useEffect(() => {
    document.documentElement.style.setProperty('--bg-gradient', theme === 'classic' ? 'linear-gradient(135deg, #fefae0 0%, #faedcd 100%)' : 'linear-gradient(135deg, #232946 0%, #181c2a 100%)');
  }, [theme]);

  // Asset drag handlers
  function handleDragStart(type) {
    setDragType(type);
  }
  function handleDragEnd() {
    setDragType(null);
  }
  function handleDrop(e) {
    if (!dragType) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    let lat = null, lng = null;
    if (gpsTracking && liveLocation && liveLocation.lat && liveLocation.lng) {
      lat = liveLocation.lat;
      lng = liveLocation.lng;
    }
    setLandmarks(lms => {
      const newLandmarks = [...lms, { type: dragType, x, y, lat, lng, label: '' }];
      setTimeout(() => {
        setPopup({ x, y, idx: newLandmarks.length - 1, label: '' });
      }, 0);
      return newLandmarks;
    });
    setDragType(null);
  }

  // Toolbar handlers
  function handleThemeChange(e) {
    setTheme(e.target.value);
  }
  function handleExport() {
    setShowMapNameModal(true);
  }
  function handleZoomIn() {
    setScale(s => Math.min(4, s * 1.1));
  }
  function handleZoomOut() {
    setScale(s => Math.max(0.5, s / 1.1));
  }
  // GPS tracking
  function handleStartGPS() {
    if (!navigator.geolocation) {
      setGpsStatus('Not supported');
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoError('');
    setGpsTracking(true);
    setGpsStatus('ON');
    setSimulated(false);
    let lastPos = null;
    let watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (!lastPos) {
          setGpsOrigin({ lat, lng });
          lastPos = { lat, lng };
          // Start a new road with the first point
          const x = stageSize.width / 2 + (lng - gpsOrigin.lng) * gpsScale;
          const y = stageSize.height / 2 - (lat - gpsOrigin.lat) * gpsScale;
          setRoads(r => [...r, [x, y]]);
          setLiveLocation({ x, y, lat, lng });
          return;
        }
        // Convert lat/lng to canvas x/y
        const x = stageSize.width / 2 + (lng - gpsOrigin.lng) * gpsScale;
        const y = stageSize.height / 2 - (lat - gpsOrigin.lat) * gpsScale;
        setLiveLocation({ x, y, lat, lng });
        setRoads(r => {
          if (r.length === 0) return [[x, y]];
          const last = r[r.length - 1];
          return [...r.slice(0, -1), [...last, x, y]];
        });
        console.log('Live location updated:', { x, y, lat, lng });
      },
      err => {
        setGpsStatus('Error');
        setGpsTracking(false);
        setLiveLocation(null);
        setGeoError('Unable to retrieve your location. Please allow location access.');
        console.error('Geolocation error:', err);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    // Stop GPS on unmount
    return () => navigator.geolocation.clearWatch(watchId);
  }
  function handleStopGPS() {
    setGpsTracking(false);
    setGpsStatus('OFF');
    setLiveLocation(null);
  }
  // Simulate route
  function handleSimulateRoute() {
    setSimulated(true);
    setGpsTracking(false);
    setGpsStatus('OFF');
    // Example simulated route
    const simRoute = [
      stageSize.width / 2, stageSize.height / 2,
      stageSize.width / 2 + 60, stageSize.height / 2 - 40,
      stageSize.width / 2 + 120, stageSize.height / 2 - 80,
      stageSize.width / 2 + 180, stageSize.height / 2 - 120,
      stageSize.width / 2 + 240, stageSize.height / 2 - 160,
    ];
    setSimRoute(simRoute);
  }
  // Landmark label popup handlers
  function handlePopupSave() {
    if (!popup.label || !popup.label.trim()) return; // Require a name
    setLandmarks(lms => lms.map((l, i) => i === popup.idx ? { ...l, label: popup.label.trim() } : l));
    setPopup(null);
  }
  function handlePopupDelete() {
    setLandmarks(lms => lms.filter((_, i) => i !== popup.idx));
    setPopup(null);
  }

  // --- Mobile tap-to-center for palette icons ---
  useEffect(() => {
    if (!isMobile()) return;
    const palette = document.getElementById('landmark-palette');
    if (!palette) return;
    const handler = function (e) {
      const target = e.target.closest('.asset-item');
      if (!target) return;
      if (e.cancelBubble) return;
      e.preventDefault();
      const type = target.getAttribute('data-type');
      // Place at center of canvas
      const { width, height } = stageSize;
      setLandmarks(lms => [...lms, { type, x: width/2, y: height/2 }]);
    };
    palette.addEventListener('touchend', handler, { passive: false });
    return () => palette.removeEventListener('touchend', handler);
  }, [stageSize]);

  // --- Landmark label popup with outside click ---
  useEffect(() => {
    if (!popupOpen) return;
    function handleClick(e) {
      if (!document.getElementById('landmark-popup')?.contains(e.target)) {
        setPopupOpen(false);
      }
    }
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('touchstart', handleClick);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('touchstart', handleClick);
    };
  }, [popupOpen]);

  // --- Long-press to edit place label on marker (mobile) ---
  useEffect(() => {
    if (!isMobile() || !stageRef.current) return;
    let longPressTimer = null;
    let longPressTarget = null;
    const stage = stageRef.current;
    stage.on('touchstart', function (e) {
      if (e.target && e.target.className === 'Text') {
        longPressTarget = e.target;
        longPressTimer = setTimeout(() => {
          const pos = longPressTarget.getAbsolutePosition();
          setPopupIdx(longPressTarget._id);
          setPopupInput(longPressTarget.getAttr('label') || '');
          setPopupCoords({ left: pos.x, top: pos.y });
          setPopupOpen(true);
          longPressTarget = null;
        }, 500);
      }
    });
    stage.on('touchend touchmove', function () {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
        longPressTarget = null;
      }
    });
    return () => {
      stage.off('touchstart');
      stage.off('touchend');
      stage.off('touchmove');
    };
  }, [stageRef.current]);

  // --- Pan with drag, pinch zoom, mouse wheel zoom ---
  useEffect(() => {
    if (!stageRef.current) return;
    const stage = stageRef.current;
    let lastDist = null;
    let lastCenter = null;
    function onWheel(e) {
      e.preventDefault();
      let direction = e.deltaY > 0 ? -1 : 1;
      let newScale = direction > 0 ? scale * 1.1 : scale / 1.1;
      newScale = Math.max(0.5, Math.min(4, newScale));
      setScale(newScale);
    }
    function onMouseDown(e) {
      if (e.evt.touches && e.evt.touches.length === 2) {
        // Pinch start
        const [touch1, touch2] = e.evt.touches;
        lastDist = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        lastCenter = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };
      } else {
        stage.draggable(true);
      }
    }
    function onMouseUp(e) {
      stage.draggable(false);
      lastDist = null;
      lastCenter = null;
    }
    function onTouchMove(e) {
      if (e.evt.touches && e.evt.touches.length === 2) {
        const [touch1, touch2] = e.evt.touches;
        const dist = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        const center = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };
        if (lastDist && lastCenter) {
          let newScale = stage.scaleX() * (dist / lastDist);
          newScale = Math.max(0.5, Math.min(4, newScale));
          stage.scale({ x: newScale, y: newScale });
          const dx = center.x - lastCenter.x;
          const dy = center.y - lastCenter.y;
          stage.position({ x: stage.x() + dx, y: stage.y() + dy });
          stage.batchDraw();
        }
        lastDist = dist;
        lastCenter = center;
      }
    }
    stage.container().addEventListener('wheel', onWheel);
    stage.on('mousedown touchstart', onMouseDown);
    stage.on('mouseup touchend', onMouseUp);
    stage.on('touchmove', onTouchMove);
    return () => {
      stage.container().removeEventListener('wheel', onWheel);
      stage.off('mousedown', onMouseDown);
      stage.off('mouseup', onMouseUp);
      stage.off('touchstart', onMouseDown);
      stage.off('touchend', onMouseUp);
      stage.off('touchmove', onTouchMove);
    };
  }, [scale, stageRef.current]);

  // --- GPS tracking cleanup ---
  useEffect(() => {
    return () => {
      if (gpsWatchId.current) navigator.geolocation.clearWatch(gpsWatchId.current);
    };
  }, []);

  // --- Theme CSS vars ---
  useEffect(() => {
    const uiThemes = {
      classic: {
        '--bg-gradient': 'linear-gradient(135deg, #fefae0 0%, #faedcd 100%)',
        '--glass-bg': 'rgba(255,255,255,0.75)',
        '--glass-border': 'rgba(212,163,115,0.18)',
        '--glass-blur': '12px',
        '--primary': '#d4a373',
        '--accent': '#b08968',
        '--button-glow': '0 0 16px #d4a37388, 0 2px 8px #b08968cc',
        '--text': '#3c2f2f',
        '--text-muted': '#b08968',
        '--icon-bg': 'rgba(212,163,115,0.08)',
        '--icon-hover': '#b08968',
      },
      night: {
        '--bg-gradient': 'linear-gradient(135deg, #232946 0%, #181c2a 100%)',
        '--glass-bg': 'rgba(36, 41, 61, 0.65)',
        '--glass-border': 'rgba(255,255,255,0.12)',
        '--glass-blur': '18px',
        '--primary': '#a3bffa',
        '--accent': '#f6c177',
        '--button-glow': '0 0 16px #f6c17788, 0 2px 8px #232946cc',
        '--text': '#f7f7fa',
        '--text-muted': '#bfc6e0',
        '--icon-bg': 'rgba(255,255,255,0.08)',
        '--icon-hover': '#f6c177',
      }
    };
    const vars = uiThemes[theme] || uiThemes.night;
    for (const key in vars) {
      document.documentElement.style.setProperty(key, vars[key]);
    }
  }, [theme]);

  // Fetch user's maps
  useEffect(() => {
    async function fetchMaps() {
      setMapsLoading(true);
      setMapError('');
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/maps`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMaps(data);
        } else {
          setMapError('Failed to load maps');
        }
      } catch {
        setMapError('Network error');
      }
      setMapsLoading(false);
    }
    fetchMaps();
  }, []);

  // Export handler (save map)
  const handleMapNameSubmit = async (name) => {
    setMapSaveLoading(true);
    setMapError('');
    setMapMessage('');
    try {
      // Save all relevant state in mapData
      const mapData = {
        roads, // now contains {x, y, lat, lng} points
        landmarks, // now contains {x, y, lat, lng, ...}
        simRoute, // Save simulated route as part of map data
        // Add more state here if needed
      };
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/maps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, data: mapData }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMapMessage('Map saved!');
        setShowMapNameModal(false);
        // Refresh maps list
        const mapsRes = await fetch(`${process.env.REACT_APP_API_URL}/api/maps`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (mapsRes.ok) setMaps(await mapsRes.json());
        // Show shareable URL
        if (saved._id) {
          const url = `${window.location.origin}/map/${saved._id}`;
          setShareUrl(url);
          try { await navigator.clipboard.writeText(url); } catch {}
        }
      } else {
        const data = await res.json();
        setMapError(data.message || 'Failed to save map');
      }
    } catch {
      setMapError('Network error');
    }
    setMapSaveLoading(false);
  };

  // Load map handler
  const handleLoadMap = async (id) => {
    setMapError('');
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/maps/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const map = await res.json();
        // Restore all keys from map.data into state if they exist
        if (map.data) {
          if (map.data.roads !== undefined) {
            setRoads(map.data.roads);
            console.log('Loaded roads:', map.data.roads);
          }
          if (map.data.landmarks !== undefined) setLandmarks(map.data.landmarks);
          if (map.data.simRoute !== undefined) setSimRoute(map.data.simRoute);
        }
        setMapMessage(`Loaded map: ${map.name}`);
      } else {
        setMapError('Failed to load map');
      }
    } catch {
      setMapError('Network error');
    }
  };

  // Delete map handler
  const handleDeleteMap = async (id) => {
    setMapError('');
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/maps/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMaps(maps => maps.filter(m => m._id !== id));
        setMapMessage('Map deleted');
      } else {
        setMapError('Failed to delete map');
      }
    } catch {
      setMapError('Network error');
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Render
  return (
    <>
      <header>
        <div className="app-title">
          <span role="img" aria-label="map">🗺️</span>
          <span>Pathix</span>
        </div>
        <div className="subtitle">Design, annotate, and export property maps with ease</div>
      </header>
      <div className="main-layout">
        <div className="map-area glass-card">
          <div className="toolbar">
            {/* Hamburger menu for mobile */}
            {isMobileScreen ? (
              <>
                <button
                  className="hamburger-menu"
                  aria-label="Open menu"
                  onClick={() => setMobileMenuOpen(true)}
                  style={{ fontSize: '2rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginRight: 8 }}
                >
                  &#9776;
                </button>
                {/* Mobile menu modal/drawer */}
                {mobileMenuOpen && (
                  <div className="mobile-menu-bg" onClick={() => setMobileMenuOpen(false)}>
                    <div className="mobile-menu" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setTheme(theme === 'classic' ? 'night' : 'classic'); setMobileMenuOpen(false); }}>Switch Theme</button>
                      <button onClick={() => { handleStartGPS(); setMobileMenuOpen(false); }} disabled={gpsTracking}>Start GPS Tracking</button>
                      <button onClick={() => { handleStopGPS(); setMobileMenuOpen(false); }} disabled={!gpsTracking}>Stop GPS Tracking</button>
                      <button onClick={() => { handleSimulateRoute(); setMobileMenuOpen(false); }} disabled={simulated}>Simulate Route</button>
                      <button onClick={() => { handleExport(); setMobileMenuOpen(false); }}>Export Map</button>
                      <button onClick={() => setMobileMenuOpen(false)} style={{ color: 'red' }}>Close</button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <label htmlFor="theme-select">Theme:</label>
                <select id="theme-select" value={theme} onChange={handleThemeChange}>
                  <option value="classic">Classic</option>
                  <option value="night">Night</option>
                </select>
                <button id="start-gps" onClick={handleStartGPS} disabled={gpsTracking}>Start GPS Tracking</button>
                <button id="stop-gps" onClick={handleStopGPS} disabled={!gpsTracking}>Stop GPS Tracking</button>
                <button id="simulate-route" onClick={handleSimulateRoute} disabled={simulated}>Simulate Route</button>
                <button id="export-map" onClick={handleExport}>Export Map</button>
                <div id="gps-status" className={`gps-status ${gpsTracking ? 'on' : 'off'}`}>
                  <span className="dot"></span>
                  GPS Tracking: {gpsStatus}
                </div>
              </>
            )}
          </div>
          <div className="map-canvas-card" style={{position:'relative'}}>
            <div
              id="container"
              ref={containerRef}
              style={{ width: '100%', height: '100%', minHeight: 400, position: 'absolute', top: 0, left: 0 }}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            />
            {/* Fixed zoom controls for desktop */}
            <div id="zoom-controls-fixed" style={{position:'fixed', bottom:24, right:24, zIndex:100, display: isMobileScreen ? 'none' : 'flex', flexDirection:'column', gap:10}}>
              <button id="zoom-in-btn" onClick={handleZoomIn} style={{fontSize:'2rem', width:48, height:48, borderRadius:'50%', border:'none', background:'var(--primary)', color:'#fff', boxShadow:'0 2px 8px #23294633'}}>+</button>
              <button id="zoom-out-btn" onClick={handleZoomOut} style={{fontSize:'2rem', width:48, height:48, borderRadius:'50%', border:'none', background:'var(--primary)', color:'#fff', boxShadow:'0 2px 8px #23294633'}}>-</button>
            </div>
            {/* Mobile zoom controls (absolute, inside map) */}
            <div id="mobile-zoom-controls" style={{position:'absolute', bottom:16, right:16, zIndex:10, display: isMobileScreen ? 'flex' : 'none', flexDirection:'column', gap:10}}>
              <button id="zoom-in-btn-mobile" onClick={handleZoomIn} style={{fontSize:'2rem', width:48, height:48, borderRadius:'50%', border:'none', background:'var(--primary)', color:'#fff', boxShadow:'0 2px 8px #23294633'}}>+</button>
              <button id="zoom-out-btn-mobile" onClick={handleZoomOut} style={{fontSize:'2rem', width:48, height:48, borderRadius:'50%', border:'none', background:'var(--primary)', color:'#fff', boxShadow:'0 2px 8px #23294633'}}>-</button>
            </div>
            {exportMsg && <div style={{position:'absolute',top:10,right:10,background:'#232946',color:'#fff',padding:'8px 16px',borderRadius:8}}>{exportMsg}</div>}
            {/* Landmark label popup */}
            {popup && (
              <div style={{position:'absolute', left:popup.x, top:popup.y, background:'#fff', color:'#232946', borderRadius:8, boxShadow:'0 2px 8px #23294633', padding:16, zIndex:1000, minWidth:220}}>
                <div style={{fontWeight:600, marginBottom:8}}>Edit Place Label</div>
                <input
                  type="text"
                  value={popup.label}
                  onChange={e => setPopup(p => ({ ...p, label: e.target.value }))}
                  style={{width:'100%',padding:8,marginBottom:8,borderRadius:4,border:'1px solid #ccc'}}
                  placeholder="Enter name or description..."
                  autoFocus
                />
                <div style={{display:'flex',gap:8,marginTop:8}}>
                  <button onClick={handlePopupSave} style={{flex:1,background:'#43a047',color:'#fff',border:'none',borderRadius:4,padding:8}}>Save</button>
                  <button onClick={()=>setPopup(null)} style={{flex:1,background:'#ccc',color:'#232946',border:'none',borderRadius:4,padding:8}}>Cancel</button>
                  <button onClick={handlePopupDelete} style={{flex:1,background:'#e53935',color:'#fff',border:'none',borderRadius:4,padding:8}}>Delete</button>
                </div>
              </div>
            )}
          </div>
        </div>
        <aside className="asset-panel glass-card">
          <div className="asset-title">Assets</div>
          <div className="asset-list" id="landmark-palette">
            {landmarkIcons.map(lm => (
              <div
                className="asset-item"
                key={lm.type}
                draggable
                onDragStart={() => handleDragStart(lm.type)}
                onDragEnd={handleDragEnd}
                tabIndex={0}
                data-type={lm.type}
                style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',cursor:'grab'}}
              >
                <span className="asset-icon" style={{fontSize:'1.5em'}}>{lm.icon}</span>
                <span>{lm.label}</span>
              </div>
            ))}
          </div>
          <div className="asset-upload">
            <button className="upload-btn">Upload</button>
            <span style={{color:'var(--text-muted)', fontSize:'0.98em'}}>(Coming soon)</span>
          </div>
          <div className="my-maps-list">
            <h4>My Maps</h4>
            {mapsLoading ? <div>Loading...</div> : null}
            {mapError && <div className="auth-error">{mapError}</div>}
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {maps.map(m => (
                <li key={m._id} style={{ marginBottom: 12 }}>
                  <span style={{ fontWeight: 500 }}>{m.name}</span>
                  <button onClick={() => handleLoadMap(m._id)} style={{ marginLeft: 8 }}>Load</button>
                  <button onClick={() => handleDeleteMap(m._id)} style={{ marginLeft: 4, color: 'red' }}>Delete</button>
                  <div style={{ fontSize: '0.95em', marginTop: 4, color: 'var(--text-muted)' }}>
                    <span>URL: </span>
                    <input
                      value={`${window.location.origin}/map/${m._id}`}
                      readOnly
                      style={{ width: '70%', fontSize: '0.95em', padding: '2px 6px', borderRadius: 4, border: '1px solid #ccc', marginRight: 4 }}
                    />
                    <button
                      style={{ fontSize: '0.95em', padding: '2px 8px', borderRadius: 4, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer' }}
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/map/${m._id}`)}
                    >Copy</button>
                  </div>
                </li>
              ))}
            </ul>
            {mapMessage && <div className="auth-success">{mapMessage}</div>}
          </div>
        </aside>
      </div>
      <MapNameModal open={showMapNameModal} onClose={() => setShowMapNameModal(false)} onSubmit={handleMapNameSubmit} loading={mapSaveLoading} />
      <footer style={{textAlign:'center', color:'var(--text-muted)', fontSize:'0.98em', marginBottom:18, marginTop:10}}>
        &copy; 2024 Pathix &mdash; Crafted with <span style={{color:'var(--accent)'}}>&#10084;&#65039;</span>
      </footer>
      {geoError && <div style={{color:'#e53935',textAlign:'center',margin:'8px 0',fontWeight:600}}>{geoError}</div>}
      {shareUrl && (
        <div className="modal-bg">
          <div className="modal-card">
            <h3>Map Saved!</h3>
            <div style={{marginBottom:12}}>Share or bookmark this map:</div>
            <input value={shareUrl} readOnly style={{width:'100%',padding:8,marginBottom:8}} />
            <button onClick={()=>window.open(shareUrl, '_blank')}>Open Map Page</button>
            <button onClick={()=>setShareUrl('')} style={{marginLeft:8}}>Close</button>
            <div style={{marginTop:8, color:'var(--text-muted)', fontSize:'0.95em'}}>URL copied to clipboard</div>
          </div>
        </div>
      )}
    </>
  );
} 