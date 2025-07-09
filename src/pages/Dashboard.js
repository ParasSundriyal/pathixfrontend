import React, { useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import '../style_index.css';
import logo from '../logo.svg';

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
const DEFAULT_SCALE = 1; // Will be dynamically calculated

const BG_IMAGE_SRC = '/Assets/bg1.png';
const HOTEL_ICON_SRC = '/assets/landmark-hotel.png';

const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isSafari = () => {
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|Chromium|Android/.test(ua);
};

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

// Haversine formula to get distance in meters between two lat/lng points
function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // meters
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const LOCAL_CACHE_KEY = 'pathix_offline_map';

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
  const [selectedAssetType, setSelectedAssetType] = useState(null); // For mobile tap-to-place
  const [landmarks, setLandmarks] = useState([]); // {type, x, y, label}
  const [roads, setRoads] = useState([]); // array of arrays of points
  const roadsRef = useRef([]); // Ref for roads to avoid race conditions
  // Keep roadsRef in sync with state
  useEffect(() => { roadsRef.current = roads; }, [roads]);
  const [currentLine, setCurrentLine] = useState(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 500 });
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
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
  const lastPosRef = useRef(null); // Persist last GPS position
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
  const [gpsSignalLost, setGpsSignalLost] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [bounds, setBounds] = useState({ minLat: null, maxLat: null, minLng: null, maxLng: null });
  const [dynamicScale, setDynamicScale] = useState(DEFAULT_SCALE);
  const [mobileSidebarTab, setMobileSidebarTab] = useState('assets'); // 'assets' or 'maps'
  // Add state for mobile asset picker
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [pendingAssetCoords, setPendingAssetCoords] = useState(null);

  // User info state
  const [userInfo, setUserInfo] = useState({ name: '', avatar: '', email: '' });
  const [uploading, setUploading] = useState(false);

  // Example stats (replace with real data if available)
  const stats = [
    { label: 'Maps', value: maps.length },
    { label: 'Landmarks', value: landmarks.length },
  ];

  // Sidebar icons (use emoji for now, can swap for SVGs/icons)
  const sidebarIcons = [
    { icon: '🗺️', label: 'Map' },
    { icon: '➕', label: 'Add Landmark' },
    { icon: '✏️', label: 'Draw Road' },
    { icon: '📤', label: 'Export' },
    { icon: '⚙️', label: 'Settings' },
  ];

  // FAB menu state
  const [fabOpen, setFabOpen] = useState(false);
  const fabActions = [
    { icon: '🗺️', label: 'New Map', onClick: () => setShowMapNameModal(true) },
    { icon: '➕', label: 'Add Landmark', onClick: () => setDragType('landmark') },
    { icon: '✏️', label: 'Draw Road', onClick: () => setDrawing(true) },
    { icon: '📤', label: 'Export', onClick: () => handleExport() },
  ];

  // User avatar (use avatar URL or fallback to initial)
  const userInitial = userInfo.name ? userInfo.name[0].toUpperCase() : (userInfo.email ? userInfo.email[0].toUpperCase() : 'U');

  // Responsive resizing
  useEffect(() => {
    function updateSize() {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let width = rect.width;
      let height;
      if (window.innerWidth <= 600) {
        // On mobile, use a 1:1 aspect ratio and a minimum height
        height = Math.max(width, 250);
      } else {
        height = width * 0.625; // 16:10 aspect ratio for desktop
      }
      setStageSize({ width, height });
    }
    updateSize();
    let resizeObserver;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(updateSize);
      if (containerRef.current) resizeObserver.observe(containerRef.current);
    } else {
      window.addEventListener('resize', updateSize);
    }
    return () => {
      if (resizeObserver && containerRef.current) resizeObserver.unobserve(containerRef.current);
      window.removeEventListener('resize', updateSize);
    };
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
      // scaleX: scale, // REMOVE
      // scaleY: scale, // REMOVE
      x: pan.x,
      y: pan.y,
    });
    stageRef.current = stage;
    // Layers
    const backgroundLayer = new Konva.Layer();
    const roadLayer = new Konva.Layer();
    const landmarkLayer = new Konva.Layer();
    stage.add(backgroundLayer);
    stage.add(roadLayer);
    stage.add(landmarkLayer);
    // Clear old objects to prevent memory leaks
    roadLayer.destroyChildren();
    landmarkLayer.destroyChildren();
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
    // Limit total points for performance
    const MAX_POINTS = 1000;
    let totalPoints = 0;
    for (let i = 0; i < roads.length; i++) {
      let pointsArr = roads[i];
      // Downsample if too many points
      if (pointsArr.length > 2 && pointsArr.length > MAX_POINTS / roads.length) {
        const step = Math.ceil(pointsArr.length / (MAX_POINTS / roads.length));
        pointsArr = pointsArr.filter((_, idx) => idx % step === 0 || idx === pointsArr.length - 1);
      }
      // Convert array of {lat, lng} to [x1, y1, x2, y2, ...]
      const flatPoints = pointsArr.map(pt => {
        const { x, y } = latLngToXY(pt.lat, pt.lng);
        return [x, y];
      }).flat();
      totalPoints += pointsArr.length;
      if (totalPoints > MAX_POINTS) break;
      const line = new Konva.Line({
        points: flatPoints,
        stroke: themes[theme].roadColor,
        strokeWidth: 8,
        lineCap: 'round',
        lineJoin: 'round',
      });
      roadLayer.add(line);
    }
    roadLayer.batchDraw();
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
      const { x, y } = latLngToXY(liveLocation.lat, liveLocation.lng);
      console.log('Drawing live marker at:', x, y, liveLocation.lat, liveLocation.lng);
      const marker = new Konva.Circle({
        x,
        y,
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
  }, [theme, roads, landmarks, simRoute, scale, stageSize, bgImageLoaded, bgImage, hotelIconLoaded, hotelIcon, liveLocation, gpsTracking, pan]);

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
  function handleStartGPS(highAccuracy = true, retryCount = 0) {
    if (!navigator.geolocation) {
      setGpsStatus('Not supported');
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoError('');
    setGpsTracking(true);
    setGpsStatus('ON');
    setSimulated(false);
    setGpsSignalLost(false);
    lastPosRef.current = null;
    const maxRetries = 3;
    const retryDelay = 2000;
    if (isSafari()) {
      // Safari: Poll getCurrentPosition every 2s
      let stopped = false;
      function poll(currentRetry = 0, useHighAccuracy = highAccuracy) {
        if (stopped) return;
        navigator.geolocation.getCurrentPosition(
          pos => {
            setGpsSignalLost(false);
            const { latitude: lat, longitude: lng } = pos.coords;
            if (!lastPosRef.current) {
              setGpsOrigin({ lat, lng });
              lastPosRef.current = { lat, lng };
              setBounds({ minLat: lat, maxLat: lat, minLng: lng, maxLng: lng });
              const newRoads = [...roadsRef.current, [{ lat, lng }]];
              roadsRef.current = newRoads;
              setRoads(newRoads);
              setLiveLocation({ lat, lng });
              return;
            }
            const dist = getDistanceMeters(lastPosRef.current.lat, lastPosRef.current.lng, lat, lng);
            if (dist > 30) {
              console.warn('GPS jump filtered:', dist, 'meters');
              return;
            }
            lastPosRef.current = { lat, lng };
            setBounds(prev => ({
              minLat: Math.min(prev.minLat, lat),
              maxLat: Math.max(prev.maxLat, lat),
              minLng: Math.min(prev.minLng, lng),
              maxLng: Math.max(prev.maxLng, lng),
            }));
            setLiveLocation({ lat, lng });
            let newRoads;
            if (roadsRef.current.length === 0) {
              newRoads = [[{ lat, lng }]];
            } else {
              const last = roadsRef.current[roadsRef.current.length - 1];
              const lastPoint = last[last.length - 1];
              if (lastPoint && lastPoint.lat === lat && lastPoint.lng === lng) {
                newRoads = [...roadsRef.current]; // skip duplicate
              } else {
                newRoads = [...roadsRef.current.slice(0, -1), [...last, { lat, lng }]];
              }
            }
            roadsRef.current = newRoads;
            setRoads(newRoads);
            console.log('Live location updated:', { lat, lng });
          },
          err => {
            setGpsSignalLost(true);
            if (err.code === 1) { // PERMISSION_DENIED
              setGeoError('Location permission denied. Please allow access and retry.');
            } else if (err.code === 2) { // POSITION_UNAVAILABLE
              setGeoError('Location unavailable. Try moving to an open area.');
            } else if (err.code === 3) { // TIMEOUT
              setGeoError('Location request timed out.');
            } else {
              setGeoError('Unable to retrieve your location.');
            }
            if (useHighAccuracy && currentRetry < maxRetries) {
              setTimeout(() => poll(currentRetry + 1, false), retryDelay);
            } else if (currentRetry < maxRetries) {
              setTimeout(() => poll(currentRetry + 1, useHighAccuracy), retryDelay);
            }
          },
          { enableHighAccuracy: useHighAccuracy, maximumAge: 0, timeout: 15000 }
        );
        setTimeout(() => poll(0, highAccuracy), 2000);
      }
      poll();
      // Return stop function
      return () => { stopped = true; };
    } else {
      // Chrome/other: use watchPosition
      let watchId = null;
      let retriedHighAccuracy = false;
      function startWatch(useHighAccuracy = highAccuracy, currentRetry = 0) {
        if (watchId) navigator.geolocation.clearWatch(watchId);
        watchId = navigator.geolocation.watchPosition(
          pos => {
            setGpsSignalLost(false);
            const { latitude: lat, longitude: lng } = pos.coords;
            if (!lastPosRef.current) {
              setGpsOrigin({ lat, lng });
              lastPosRef.current = { lat, lng };
              setBounds({ minLat: lat, maxLat: lat, minLng: lng, maxLng: lng });
              const newRoads = [...roadsRef.current, [{ lat, lng }]];
              roadsRef.current = newRoads;
              setRoads(newRoads);
              setLiveLocation({ lat, lng });
              return;
            }
            // GPS drift filter: ignore if jump > 30m
            const dist = getDistanceMeters(lastPosRef.current.lat, lastPosRef.current.lng, lat, lng);
            if (dist > 30) {
              console.warn('GPS jump filtered:', dist, 'meters');
              return;
            }
            lastPosRef.current = { lat, lng };
            setBounds(prev => ({
              minLat: Math.min(prev.minLat, lat),
              maxLat: Math.max(prev.maxLat, lat),
              minLng: Math.min(prev.minLng, lng),
              maxLng: Math.max(prev.maxLng, lng),
            }));
            setLiveLocation({ lat, lng });
            let newRoads;
            if (roadsRef.current.length === 0) {
              newRoads = [[{ lat, lng }]];
            } else {
              const last = roadsRef.current[roadsRef.current.length - 1];
              const lastPoint = last[last.length - 1];
              if (lastPoint && lastPoint.lat === lat && lastPoint.lng === lng) {
                newRoads = [...roadsRef.current]; // skip duplicate
              } else {
                newRoads = [...roadsRef.current.slice(0, -1), [...last, { lat, lng }]];
              }
            }
            roadsRef.current = newRoads;
            setRoads(newRoads);
            console.log('Live location updated:', { lat, lng });
          },
          err => {
            setGpsSignalLost(true);
            if (err.code === 1) { // PERMISSION_DENIED
              setGeoError('Location permission denied. Please allow access and retry.');
            } else if (err.code === 2) { // POSITION_UNAVAILABLE
              setGeoError('Location unavailable. Try moving to an open area.');
            } else if (err.code === 3) { // TIMEOUT
              setGeoError('Location request timed out.');
            } else {
              setGeoError('Unable to retrieve your location.');
            }
            if (useHighAccuracy && currentRetry < maxRetries) {
              setTimeout(() => startWatch(false, currentRetry + 1), retryDelay);
            } else if (currentRetry < maxRetries) {
              setTimeout(() => startWatch(useHighAccuracy, currentRetry + 1), retryDelay);
            }
          },
          { enableHighAccuracy: useHighAccuracy, maximumAge: 0, timeout: 15000 }
        );
      }
      startWatch();
      // Stop GPS on unmount
      return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
    }
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
      setSelectedAssetType(type); // Wait for user to tap map
    };
    palette.addEventListener('touchend', handler, { passive: false });
    return () => palette.removeEventListener('touchend', handler);
  }, [stageSize]);

  // Mobile: tap on map to place asset
  useEffect(() => {
    if (!isMobile() || !selectedAssetType) return;
    const container = containerRef.current;
    if (!container) return;
    const handler = (e) => {
      // Only respond to single taps
      if (e.touches && e.touches.length > 1) return;
      const rect = container.getBoundingClientRect();
      let x, y;
      if (e.touches && e.touches.length === 1) {
        x = (e.touches[0].clientX - rect.left) / scale;
        y = (e.touches[0].clientY - rect.top) / scale;
      } else {
        x = (e.clientX - rect.left) / scale;
        y = (e.clientY - rect.top) / scale;
      }
      setLandmarks(lms => [...lms, { type: selectedAssetType, x, y }]);
      setSelectedAssetType(null);
    };
    container.addEventListener('touchend', handler, { passive: false });
    container.addEventListener('click', handler, { passive: false });
    return () => {
      container.removeEventListener('touchend', handler);
      container.removeEventListener('click', handler);
    };
  }, [selectedAssetType, scale]);

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
      setPan({ x: stage.x(), y: stage.y() });
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
          setPan({ x: stage.x() + dx, y: stage.y() + dy });
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

  // Restore from cache on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        const { roads: cachedRoads, landmarks: cachedLandmarks } = JSON.parse(cached);
        if (Array.isArray(cachedRoads)) setRoads(cachedRoads);
        if (Array.isArray(cachedLandmarks)) setLandmarks(cachedLandmarks);
      }
    } catch {}
  }, []);

  // Cache roads and landmarks on every update
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify({ roads, landmarks }));
    } catch {}
  }, [roads, landmarks]);

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
        scale,
        pan,
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
        // Clear offline cache after export
        try { localStorage.removeItem(LOCAL_CACHE_KEY); } catch {}
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
          if (map.data.scale !== undefined) setScale(map.data.scale);
          if (map.data.pan !== undefined) setPan(map.data.pan);
        }
        setMapMessage(`Loaded map: ${map.name}`);
        // Clear offline cache after loading a map
        try { localStorage.removeItem(LOCAL_CACHE_KEY); } catch {}
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

  // Calculate dynamic scale and convert lat/lng to x/y
  function latLngToXY(lat, lng) {
    if (!gpsOrigin) return { x: 0, y: 0 };
    // Use bounds to determine scale
    let minLat = bounds.minLat ?? lat;
    let maxLat = bounds.maxLat ?? lat;
    let minLng = bounds.minLng ?? lng;
    let maxLng = bounds.maxLng ?? lng;
    // Add some padding
    const padding = 0.0002;
    minLat -= padding;
    maxLat += padding;
    minLng -= padding;
    maxLng += padding;
    // Calculate scale so all points fit in the canvas
    let latRange = Math.abs(maxLat - minLat);
    let lngRange = Math.abs(maxLng - minLng);
    // Avoid division by zero
    if (latRange === 0) latRange = 1e-9;
    if (lngRange === 0) lngRange = 1e-9;
    const fitScaleX = stageSize.width / lngRange;
    const fitScaleY = stageSize.height / latRange;
    const dynamic = Math.min(fitScaleX, fitScaleY);
    const effectiveScale = dynamic * scale; // Combine fit and user zoom
    // Centering
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const x = stageSize.width / 2 + (lng - centerLng) * effectiveScale;
    const y = stageSize.height / 2 - (lat - centerLat) * effectiveScale;
    setDynamicScale(dynamic);
    return { x, y };
  }

  // User info fetch
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.name) setUserInfo(data);
      })
      .catch(() => {});
  }, []);

  // Handle avatar upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1];
      setUploading(true);
      const token = sessionStorage.getItem('token');
      await fetch('/api/auth/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          avatar: base64,
          avatarType: file.type,
        }),
      });
      setUploading(false);
      // Refetch user info
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.name) setUserInfo(data);
        });
    };
    reader.readAsDataURL(file);
  };

  // Render
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#15192b] via-[#101117] to-[#23243a] flex flex-col items-center font-sans">
      {/* Top Navbar with Logo */}
      <nav className="w-full flex items-center px-8 md:px-24 py-6 fixed top-0 left-0 z-30 bg-gradient-to-b from-[#181c2aee] to-transparent backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Pathix Logo" className="h-12 w-12 drop-shadow-[0_0_16px_#f6d365]" />
          <span className="text-3xl font-extrabold font-serif bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_0_16px_#f6d365] tracking-wide">Pathix</span>
        </div>
      </nav>
      <div className="h-20" />
      {/* Main Layout */}
      <div className="flex flex-col gap-8 max-w-6xl mx-auto pt-20 px-2 sm:px-4 md:px-8 w-full">
        {/* Mini Stats Card at the top */}
        <div className="hidden sm:flex gap-4 sm:gap-8 bg-[#181c2a]/60 border border-accent-gold/60 rounded-2xl sm:rounded-3xl shadow-[0_0_12px_#f6d36544] py-4 sm:py-6 px-4 sm:px-8 mb-4 sm:mb-6 items-center justify-start max-w-xs sm:max-w-md mx-auto animate-fadeInUp text-sm sm:text-base">
          {stats.map((stat, idx) => (
            <div className="flex flex-col items-center min-w-[60px] sm:min-w-[80px]" key={idx}>
              <div className="font-bold text-lg sm:text-2xl text-accent-gold font-serif">{stat.value}</div>
              <div className="text-gray-400 text-xs sm:text-base mt-1 font-sans">{stat.label}</div>
            </div>
          ))}
        </div>
        {/* Map and Sidebar below stats */}
        <div className="flex flex-col md:flex-row gap-4 sm:gap-8 w-full relative">
          {/* Hamburger for mobile */}
          {isMobileScreen && (
            <button
              className="fixed top-24 left-4 z-40 bg-[#181c2a]/80 border border-accent-gold/60 rounded-full w-12 h-12 flex items-center justify-center shadow-glow text-2xl text-accent-gold md:hidden"
              aria-label="Open sidebar"
              onClick={() => setMobileMenuOpen(true)}
            >
              &#9776;
            </button>
          )}
          {/* Map Area */}
          <div className="flex-1 min-w-0">
            <div className="bg-[#181c2a]/60 border border-accent-gold/60 rounded-2xl sm:rounded-3xl shadow-[0_0_12px_#f6d36544] p-3 sm:p-6 mb-4 sm:mb-8 animate-fadeInUp relative">
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-2 sm:mb-4 items-center bg-[#23243a]/60 border border-accent-gold/30 rounded-lg px-2 sm:px-4 py-1 sm:py-2 shadow-sm md:flex">
                {/* Desktop toolbar only */}
                {!isMobileScreen && (
                  <>
                    <label htmlFor="theme-select" className="text-sm text-gray-500 dark:text-gray-300 mr-2">Theme:</label>
                    <select id="theme-select" value={theme} onChange={handleThemeChange} className="rounded-md border border-gray-300 dark:border-neutral-600 px-3 py-1 bg-white dark:bg-neutral-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 mr-2">
                      <option value="classic">Classic</option>
                      <option value="night">Night</option>
                    </select>
                    <button className="rounded-md px-3 py-1 bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 font-semibold shadow-glow transition mr-2 hover:from-yellow-400 hover:to-orange-300 hover:text-black hover:scale-105" id="start-gps" onClick={handleStartGPS} disabled={gpsTracking}>Start GPS Tracking</button>
                    <button className="rounded-md px-3 py-1 bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 font-semibold shadow-glow transition mr-2 hover:from-yellow-400 hover:to-orange-300 hover:text-black hover:scale-105" id="stop-gps" onClick={handleStopGPS} disabled={!gpsTracking}>Stop GPS Tracking</button>
                    <button className="rounded-md px-3 py-1 bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 font-semibold shadow-glow transition mr-2 hover:from-yellow-400 hover:to-orange-300 hover:text-black hover:scale-105" id="simulate-route" onClick={handleSimulateRoute} disabled={simulated}>Simulate Route</button>
                    <button className="rounded-md px-3 py-1 bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 font-semibold shadow-glow transition mr-2 hover:from-yellow-400 hover:to-orange-300 hover:text-black hover:scale-105" id="export-map" onClick={handleExport}>Export Map</button>
                    <div id="gps-status" className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${gpsTracking ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'} ml-2`}>
                      <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: gpsTracking ? '#22c55e' : '#aaa' }}></span>
                      GPS Tracking: {gpsStatus}
                    </div>
                  </>
                )}
              </div>
              <div className="relative w-full aspect-[16/10] rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_0_12px_#f6d36544] bg-[#23243a]/60 animate-fadeInUp border border-accent-gold/30">
                <div
                  id="container"
                  ref={containerRef}
                  className="absolute top-0 left-0 w-full h-full min-h-[70vh] sm:min-h-[400px]"
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={e => {
                    if (isMobileScreen) {
                      // Get click coordinates relative to container
                      const rect = containerRef.current.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      setPendingAssetCoords({ x, y });
                      setShowAssetPicker(true);
                    }
                  }}
                />
                {/* Fixed zoom controls for desktop */}
                <div className="hidden md:flex flex-col gap-2 absolute bottom-4 sm:bottom-6 right-4 sm:right-6 z-20">
                  <button id="zoom-in-btn" onClick={handleZoomIn} className="bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 rounded-full w-8 h-8 text-lg shadow-glow transition flex items-center justify-center p-0 hover:from-yellow-400 hover:to-orange-300 hover:text-black hover:scale-110 hover:shadow-lg">+</button>
                  <button id="zoom-out-btn" onClick={handleZoomOut} className="bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 rounded-full w-8 h-8 text-lg shadow-glow transition flex items-center justify-center p-0 hover:from-yellow-400 hover:to-orange-300 hover:text-black hover:scale-110 hover:shadow-lg">-</button>
                </div>
                {/* Mobile zoom controls */}
                <div className="flex md:hidden flex-col gap-2 absolute bottom-4 right-4 z-20">
                  <button id="zoom-in-btn-mobile" onClick={handleZoomIn} className="bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 rounded-full w-10 h-10 text-xl shadow-glow transition flex items-center justify-center p-0 hover:from-yellow-400 hover:to-orange-300 hover:text-black hover:scale-110 hover:shadow-lg">+</button>
                  <button id="zoom-out-btn-mobile" onClick={handleZoomOut} className="bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 rounded-full w-10 h-10 text-xl shadow-glow transition flex items-center justify-center p-0 hover:from-yellow-400 hover:to-orange-300 hover:text-black hover:scale-110 hover:shadow-lg">-</button>
                </div>
                {exportMsg && <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-[#181c2a]/80 text-accent-gold px-2 sm:px-4 py-1 sm:py-2 rounded-lg shadow-[0_0_12px_#f6d36544] border border-accent-gold/60 text-xs sm:text-base">{exportMsg}</div>}
                {/* Landmark label popup */}
                {popup && (
                  <div className="absolute left-0 top-0 bg-white text-neutral-900 rounded-lg shadow-lg p-2 sm:p-4 z-30 min-w-[160px] sm:min-w-[220px]" style={{ left: popup.x, top: popup.y }}>
                    <div className="font-semibold mb-2">Edit Place Label</div>
                    <input
                      type="text"
                      value={popup.label}
                      onChange={e => setPopup(p => ({ ...p, label: e.target.value }))}
                      className="w-full px-2 sm:px-3 py-1 sm:py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-400 mb-2"
                      placeholder="Enter name or description..."
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={handlePopupSave} className="flex-1 bg-green-600 text-white rounded px-2 sm:px-3 py-1 sm:py-2 transition hover:bg-green-700">Save</button>
                      <button onClick={() => setPopup(null)} className="flex-1 bg-gray-300 text-neutral-900 rounded px-2 sm:px-3 py-1 sm:py-2 transition hover:bg-gray-400">Cancel</button>
                      <button onClick={handlePopupDelete} className="flex-1 bg-red-600 text-white rounded px-2 sm:px-3 py-1 sm:py-2 transition hover:bg-red-700">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Sidebar: modal/drawer on mobile, visible on desktop */}
          {/* Desktop sidebar */}
          <aside className="hidden md:flex bg-[#181c2a]/60 border border-accent-gold/60 rounded-2xl sm:rounded-3xl shadow-[0_0_12px_#f6d36544] p-3 sm:p-6 min-w-0 w-full md:w-[320px] max-w-full md:max-w-xs flex-col gap-4 sm:gap-6 animate-fadeInUp order-2 md:order-none">
            <div className="text-base sm:text-lg font-bold text-accent-gold mb-1 sm:mb-2 font-serif">Assets</div>
            <div className="grid gap-2 sm:gap-3 mb-2 sm:mb-4 max-h-40 sm:max-h-72 overflow-y-auto" id="landmark-palette">
              {landmarkIcons.map(lm => (
                <div
                  key={lm.type}
                  draggable={!isMobile()}
                  onDragStart={!isMobile() ? () => handleDragStart(lm.type) : undefined}
                  onDragEnd={!isMobile() ? handleDragEnd : undefined}
                  tabIndex={0}
                  data-type={lm.type}
                  className={`asset-item flex items-center gap-2 sm:gap-3 bg-[#23243a]/60 border border-accent-gold/30 rounded-lg px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base text-gray-200 cursor-grab hover:bg-gradient-to-r hover:from-accent-gold hover:to-yellow-400 hover:text-gray-900 transition animate-fadeInUp ${isMobile() ? 'cursor-pointer' : ''}`}
                  onClick={isMobile() ? () => setSelectedAssetType(lm.type) : undefined}
                >
                  <span className="text-lg sm:text-xl">{lm.icon}</span>
                  <span>{lm.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 rounded px-3 sm:px-4 py-1 sm:py-2 font-semibold shadow-glow hover:scale-105 transition text-xs sm:text-base">Upload</button>
              <span className="text-gray-400 text-xs sm:text-sm">(Coming soon)</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2 text-accent-gold font-serif">My Maps</h4>
              {mapsLoading ? <div>Loading...</div> : null}
              {mapError && <div className="text-red-500 text-xs sm:text-sm mb-2">{mapError}</div>}
              <ul className="list-none p-0">
                {maps.map(m => (
                  <li key={m._id} className="mb-2 sm:mb-3">
                    <span className="font-medium text-xs sm:text-base">{m.name}</span>
                    <button onClick={() => handleLoadMap(m._id)} className="ml-2 px-2 py-1 rounded bg-blue-600 text-white text-xs transition hover:bg-blue-700">Load</button>
                    <button onClick={() => handleDeleteMap(m._id)} className="ml-1 px-2 py-1 rounded bg-red-600 text-white text-xs transition hover:bg-red-700">Delete</button>
                    <div className="text-xs mt-1 text-gray-400">
                      <span>URL: </span>
                      <input
                        value={`${window.location.origin}/map/${m._id}`}
                        readOnly
                        className="w-3/4 text-xs px-2 py-1 rounded border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-700 mr-1"
                      />
                      <button
                        className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/map/${m._id}`)}
                      >Copy</button>
                    </div>
                  </li>
                ))}
              </ul>
              {mapMessage && <div className="text-green-600 text-xs sm:text-sm mt-2">{mapMessage}</div>}
            </div>
          </aside>
          {/* Mobile sidebar modal/drawer */}
          {isMobileScreen && mobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex items-end md:hidden" style={{background:'rgba(0,0,0,0.5)'}} onClick={() => setMobileMenuOpen(false)}>
              <div className="bg-[#181c2a] w-full max-h-[90vh] rounded-t-2xl p-4 flex flex-col gap-4 overflow-y-auto animate-fadeInUp border-t border-accent-gold/60" onClick={e => e.stopPropagation()}>
                <button className="self-end text-2xl text-accent-gold mb-2" aria-label="Close sidebar" onClick={() => setMobileMenuOpen(false)}>&times;</button>
                <div>
                  <h4 className="font-semibold text-sm mb-1 text-accent-gold font-serif">My Maps</h4>
                  {mapsLoading ? <div>Loading...</div> : null}
                  {mapError && <div className="text-red-500 text-xs mb-2">{mapError}</div>}
                  <ul className="list-none p-0">
                    {maps.map(m => (
                      <li key={m._id} className="mb-2">
                        <span className="font-medium text-xs">{m.name}</span>
                        <button onClick={() => handleLoadMap(m._id)} className="ml-2 px-2 py-1 rounded bg-blue-600 text-white text-xs transition hover:bg-blue-700">Load</button>
                        <button onClick={() => handleDeleteMap(m._id)} className="ml-1 px-2 py-1 rounded bg-red-600 text-white text-xs transition hover:bg-red-700">Delete</button>
                        <div className="text-xs mt-1 text-gray-400">
                          <span>URL: </span>
                          <input
                            value={`${window.location.origin}/map/${m._id}`}
                            readOnly
                            className="w-3/4 text-xs px-2 py-1 rounded border border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-700 mr-1"
                          />
                          <button
                            className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/map/${m._id}`)}
                          >Copy</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {mapMessage && <div className="text-green-600 text-xs mt-2">{mapMessage}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Floating Action Button (FAB) */}
        <button
          className="fixed bottom-6 sm:bottom-10 right-6 sm:right-10 bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 rounded-full w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl p-0 flex items-center justify-center shadow-glow hover:scale-110 transition z-50"
          onClick={() => setFabOpen(fab => !fab)}
          title="Quick Actions"
        >
          +
        </button>
        {fabOpen && (
          <div className="fixed bottom-24 sm:bottom-32 right-6 sm:right-10 bg-[#181c2a]/90 border border-accent-gold/60 rounded-2xl shadow-[0_0_12px_#f6d36544] p-3 sm:p-4 flex flex-col gap-2 z-50 animate-fadeInUp">
            {fabActions.map((action, idx) => (
              <button key={idx} onClick={() => { action.onClick(); setFabOpen(false); }} className="flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 rounded hover:bg-gradient-to-r hover:from-accent-gold hover:to-yellow-400 hover:text-gray-900 transition text-xs sm:text-base">
                <span className="mr-2">{action.icon}</span> {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <MapNameModal open={showMapNameModal} onClose={() => setShowMapNameModal(false)} onSubmit={handleMapNameSubmit} loading={mapSaveLoading} />
      <footer className="text-center text-accent-gold text-sm my-6 font-serif">
        &copy; 2025 Pathix &mdash; Crafted with <span className="text-yellow-400">&#10084;&#65039;</span>
      </footer>
      {geoError && <div className="text-red-600 text-center my-2 font-semibold">{geoError}</div>}
      {gpsSignalLost && (
        <div className="text-yellow-400 text-center my-2 font-semibold">
          GPS Signal Lost. Please try moving to an open area or allow location access.
          <button onClick={() => handleStartGPS(true)} className="ml-2 px-3 py-1 rounded bg-blue-600 text-white text-xs transition hover:bg-blue-700">Retry</button>
        </div>
      )}
      {shareUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-[#181c2a]/90 border border-accent-gold/60 rounded-2xl shadow-[0_0_12px_#f6d36544] p-8 animate-fadeInUp">
            <h3 className="text-lg font-bold mb-2 text-accent-gold font-serif">Map Saved!</h3>
            <div className="mb-3 text-gray-200">Share or bookmark this map:</div>
            <input value={shareUrl} readOnly className="w-full px-3 py-2 rounded border border-accent-gold/30 bg-[#23243a]/60 text-gray-100 mb-2" />
            <button onClick={()=>window.open(shareUrl, '_blank')} className="w-full py-2 rounded bg-gradient-to-r from-accent-gold to-yellow-400 text-gray-900 mb-2 shadow-glow transition hover:from-yellow-400 hover:to-orange-300 hover:text-black hover:scale-105">Open Map Page</button>
            <button onClick={()=>setShareUrl('')} className="w-full py-2 rounded bg-gray-300 text-neutral-900 transition hover:bg-gray-400">Close</button>
            <div className="mt-2 text-accent-gold text-xs">URL copied to clipboard</div>
          </div>
        </div>
      )}
      {/* Mobile asset picker bottom sheet */}
      {isMobileScreen && showAssetPicker && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden" style={{background:'rgba(0,0,0,0.3)'}} onClick={() => setShowAssetPicker(false)}>
          <div className="bg-[#181c2a] w-full rounded-t-2xl p-4 flex flex-col gap-4 animate-fadeInUp border-t border-accent-gold/60" onClick={e => e.stopPropagation()}>
            <div className="text-base font-bold text-accent-gold mb-2 font-serif text-center">Choose an Asset</div>
            <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto">
              {landmarkIcons.map(lm => (
                <button
                  key={lm.type}
                  className="flex flex-col items-center justify-center bg-[#23243a]/60 border border-accent-gold/30 rounded-lg px-2 py-2 text-lg text-gray-200 hover:bg-gradient-to-r hover:from-accent-gold hover:to-yellow-400 hover:text-gray-900 transition"
                  onClick={() => {
                    // Place asset at pendingAssetCoords
                    if (pendingAssetCoords) {
                      setLandmarks(lms => [...lms, { type: lm.type, x: pendingAssetCoords.x, y: pendingAssetCoords.y, label: '' }]);
                      setShowAssetPicker(false);
                      setPendingAssetCoords(null);
                    }
                  }}
                >
                  <span>{lm.icon}</span>
                  <span className="text-xs mt-1">{lm.label}</span>
                </button>
              ))}
            </div>
            <button className="mt-4 py-2 rounded-lg bg-red-500 text-white" onClick={() => setShowAssetPicker(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
} 