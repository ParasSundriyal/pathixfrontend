import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Konva from 'konva';

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

function getDistance(lat1, lng1, lat2, lng2) {
  // Haversine formula
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getBearing(start, end) {
  const toRad = deg => deg * Math.PI / 180;
  const toDeg = rad => rad * 180 / Math.PI;
  const startLat = toRad(start.lat);
  const startLng = toRad(start.lng);
  const endLat = toRad(end.lat);
  const endLng = toRad(end.lng);
  const y = Math.sin(endLng - startLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) -
           Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
  let bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

function getDirectionFromBearing(bearing) {
  const directions = [
    { name: 'north', min: 337.5, max: 22.5 },
    { name: 'northeast', min: 22.5, max: 67.5 },
    { name: 'east', min: 67.5, max: 112.5 },
    { name: 'southeast', min: 112.5, max: 157.5 },
    { name: 'south', min: 157.5, max: 202.5 },
    { name: 'southwest', min: 202.5, max: 247.5 },
    { name: 'west', min: 247.5, max: 292.5 },
    { name: 'northwest', min: 292.5, max: 337.5 }
  ];
  return directions.find(dir => bearing >= dir.min && bearing < dir.max)?.name || 'north';
}

function getNavigationInstruction(userPos, destination, distance, heading) {
  if (distance <= 30) {
    return "You have arrived at your destination";
  }
  const bearing = getBearing(userPos, destination);
  const direction = getDirectionFromBearing(bearing);
  const relativeBearing = (bearing - heading + 360) % 360;
  let turnInstruction = '';
  if (relativeBearing > 337.5 || relativeBearing <= 22.5) {
    turnInstruction = 'Continue straight ahead';
  } else if (relativeBearing > 22.5 && relativeBearing <= 67.5) {
    turnInstruction = 'Slight right';
  } else if (relativeBearing > 67.5 && relativeBearing <= 112.5) {
    turnInstruction = 'Turn right';
  } else if (relativeBearing > 112.5 && relativeBearing <= 157.5) {
    turnInstruction = 'Sharp right';
  } else if (relativeBearing > 157.5 && relativeBearing <= 202.5) {
    turnInstruction = 'Turn around';
  } else if (relativeBearing > 202.5 && relativeBearing <= 247.5) {
    turnInstruction = 'Sharp left';
  } else if (relativeBearing > 247.5 && relativeBearing <= 292.5) {
    turnInstruction = 'Turn left';
  } else if (relativeBearing > 292.5 && relativeBearing <= 337.5) {
    turnInstruction = 'Slight left';
  }
  return `${turnInstruction}. Head ${direction}.`;
}

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

export default function MapViewer() {
  const { id } = useParams();
  const containerRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [map, setMap] = useState(null);
  const [theme] = useState('night');
  const [stageSize, setStageSize] = useState({ width: 800, height: 500 });
  const [destination, setDestination] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [navInstruction, setNavInstruction] = useState('Waiting for destination...');
  const [navDistance, setNavDistance] = useState(0);
  const [showNav, setShowNav] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [currentScale, setCurrentScale] = useState(1);
  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [heading, setHeading] = useState(0);
  const [searchName, setSearchName] = useState('');
  const [searchError, setSearchError] = useState('');

  // 1. Geolocation & Navigation improvements
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    let didCancel = false;
    let timeoutId;
    let watchId = navigator.geolocation.watchPosition(
      pos => {
        if (!didCancel) {
          setUserPos({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        }
      },
      err => {
        if (!didCancel) {
          if (err.code === 1) setError('Location permission denied.');
          else if (err.code === 2) setError('Location unavailable.');
          else if (err.code === 3) setError('Location request timed out.');
          else setError('Location error.');
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    // Timeout for GPS signal loss
    timeoutId = setTimeout(() => {
      setError('GPS signal lost or too slow.');
    }, 20000);
    return () => {
      didCancel = true;
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(timeoutId);
    };
  }, []);

  // 2. Map Data Loading improvements
  useEffect(() => {
    async function fetchMap() {
      setLoading(true);
      setError('');
      try {
        // Offline cache support
        let data;
        const cacheKey = `map_${id}`;
        if (navigator.onLine) {
          const res = await fetch(`${process.env.REACT_APP_API_URL}/api/maps/${id}`);
          if (res.ok) {
            data = await res.json();
            localStorage.setItem(cacheKey, JSON.stringify(data));
          } else if (res.status === 404) {
            setError('Map not found.');
            setLoading(false);
            return;
          } else {
            setError('Network error.');
            setLoading(false);
            return;
          }
        } else {
          const cached = localStorage.getItem(cacheKey);
          if (cached) data = JSON.parse(cached);
          else {
            setError('Offline and no cached map available.');
            setLoading(false);
            return;
          }
        }
        if (!data || !data.data) {
          setError('Map data is empty or corrupted.');
          setLoading(false);
          return;
        }
        setMap(data);
      } catch {
        setError('Network or parsing error.');
      }
      setLoading(false);
    }
    fetchMap();
  }, [id]);

  // 3. Navigation Calculations improvements
  function safeGetDistance(lat1, lng1, lat2, lng2) {
    if (
      lat1 == null || lng1 == null || lat2 == null || lng2 == null ||
      (lat1 === lat2 && lng1 === lng2)
    ) return 0;
    return getDistance(lat1, lng1, lat2, lng2);
  }
  function safeGetBearing(start, end) {
    if (!start || !end || isNaN(start.lat) || isNaN(start.lng) || isNaN(end.lat) || isNaN(end.lng)) return 0;
    const b = getBearing(start, end);
    return isNaN(b) ? 0 : b;
  }
  function safeGetNavigationInstruction(userPos, destination, distance, heading) {
    if (!userPos || !destination) return 'No navigation data.';
    return getNavigationInstruction(userPos, destination, distance, heading);
  }

  useEffect(() => {
    function handleOrientation(e) {
      if (e.absolute && e.alpha != null) {
        setHeading(360 - e.alpha);
      }
    }
    window.addEventListener('deviceorientationabsolute', handleOrientation);
    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // 4. Speech Synthesis improvements
  useEffect(() => {
    if (!userPos || !destination) return;
    const dist = safeGetDistance(userPos.lat, userPos.lng, destination.lat, destination.lng);
    setNavDistance(Math.round(dist));
    const instr = safeGetNavigationInstruction(userPos, destination, dist, heading);
    setNavInstruction(instr);
    setShowNav(true);
    if (isSoundEnabled && 'speechSynthesis' in window && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const utter = new window.SpeechSynthesisUtterance(instr);
        window.speechSynthesis.speak(utter);
      } catch {}
    }
  }, [userPos, destination, heading, isSoundEnabled]);

  // 5. UI & Responsiveness improvements
  // (in JSX: use width: '100%', maxWidth, etc. already present)
  // Add touch event handling to prevent pinch-zoom conflicts
  useEffect(() => {
    function preventPinch(e) {
      if (e.touches && e.touches.length > 1) e.preventDefault();
    }
    document.addEventListener('touchmove', preventPinch, { passive: false });
    return () => document.removeEventListener('touchmove', preventPinch);
  }, []);

  // 6. Destination Search improvements
  // (in JSX: already case-insensitive, add null label check and empty results message)
  useEffect(() => {
    if (!containerRef.current || !map || !map.data) return;
    const { width, height } = stageSize;
    containerRef.current.innerHTML = '';
    const stage = new Konva.Stage({
      container: containerRef.current,
      width,
      height,
      scaleX: currentScale,
      scaleY: currentScale,
    });
    const backgroundLayer = new Konva.Layer();
    const roadLayer = new Konva.Layer();
    const landmarkLayer = new Konva.Layer();
    const userLayer = new Konva.Layer();
    const routeLayer = new Konva.Layer();
    stage.add(backgroundLayer);
    stage.add(roadLayer);
    stage.add(landmarkLayer);
    stage.add(routeLayer);
    stage.add(userLayer);
    const bgRect = new Konva.Rect({ x: 0, y: 0, width, height, fill: themes[theme].background });
    backgroundLayer.add(bgRect);
    backgroundLayer.draw();
    (Array.isArray(map.data.roads) ? map.data.roads : []).forEach(points => {
      const line = new Konva.Line({
        points,
        stroke: themes[theme].roadColor,
        strokeWidth: 8,
        lineCap: 'round',
        lineJoin: 'round',
      });
      roadLayer.add(line);
    });
    if (Array.isArray(map.data.simRoute)) {
      const simLine = new Konva.Line({
        points: map.data.simRoute,
        stroke: '#43a047',
        strokeWidth: 8,
        lineCap: 'round',
        lineJoin: 'round',
        dash: [18, 12],
        shadowBlur: 8,
        shadowColor: '#43a047',
      });
      roadLayer.add(simLine);
    }
    roadLayer.draw();
    (Array.isArray(map.data.landmarks) ? map.data.landmarks : []).forEach(lm => {
      const iconText = landmarkIcons.find(i => i.type === lm.type)?.icon || '❓';
      const icon = new Konva.Text({
        x: lm.x - 16,
        y: lm.y - 16,
        text: iconText,
        fontSize: 32,
        shadowColor: '#000',
        shadowBlur: 4,
        shadowOffset: { x: 2, y: 2 },
        shadowOpacity: 0.3,
      });
      landmarkLayer.add(icon);
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
    const autoMarkerSize = Math.max(10, Math.min(32, 18 / currentScale));
    if (userPos) {
      const marker = new Konva.Circle({
        x: width/2,
        y: height/2,
        radius: autoMarkerSize,
        fill: '#2196f3',
        stroke: '#fff',
        strokeWidth: 3,
        shadowBlur: 8,
        shadowColor: '#2196f3',
      });
      userLayer.add(marker);
      userLayer.draw();
    }
    return () => stage.destroy();
  }, [map, theme, stageSize, userPos, currentScale]);

  // 7. General Edge Cases: browser compatibility
  useEffect(() => {
    if (!('geolocation' in navigator)) setError('Geolocation API not supported.');
    if (!('speechSynthesis' in window)) setIsSoundEnabled(false);
  }, []);

  // 8. Konva Rendering improvements
  useEffect(() => {
    if (!containerRef.current || !map || !map.data) return;
    // Destroy previous stage if any
    if (containerRef.current._konvaStage) {
      containerRef.current._konvaStage.destroy();
      containerRef.current._konvaStage = null;
    }
    const { width, height } = stageSize;
    containerRef.current.innerHTML = '';
    const stage = new Konva.Stage({
      container: containerRef.current,
      width,
      height,
      scaleX: currentScale,
      scaleY: currentScale,
    });
    containerRef.current._konvaStage = stage;
    const backgroundLayer = new Konva.Layer();
    const roadLayer = new Konva.Layer();
    const landmarkLayer = new Konva.Layer();
    const userLayer = new Konva.Layer();
    const routeLayer = new Konva.Layer();
    stage.add(backgroundLayer);
    stage.add(roadLayer);
    stage.add(landmarkLayer);
    stage.add(routeLayer);
    stage.add(userLayer);
    const bgRect = new Konva.Rect({ x: 0, y: 0, width, height, fill: themes[theme].background });
    backgroundLayer.add(bgRect);
    backgroundLayer.draw();
    (Array.isArray(map.data.roads) ? map.data.roads : []).forEach(points => {
      const line = new Konva.Line({
        points,
        stroke: themes[theme].roadColor,
        strokeWidth: 8,
        lineCap: 'round',
        lineJoin: 'round',
      });
      roadLayer.add(line);
    });
    if (Array.isArray(map.data.simRoute)) {
      const simLine = new Konva.Line({
        points: map.data.simRoute,
        stroke: '#43a047',
        strokeWidth: 8,
        lineCap: 'round',
        lineJoin: 'round',
        dash: [18, 12],
        shadowBlur: 8,
        shadowColor: '#43a047',
      });
      roadLayer.add(simLine);
    }
    roadLayer.draw();
    (Array.isArray(map.data.landmarks) ? map.data.landmarks : []).forEach(lm => {
      const iconText = landmarkIcons.find(i => i.type === lm.type)?.icon || '❓';
      const icon = new Konva.Text({
        x: lm.x - 16,
        y: lm.y - 16,
        text: iconText,
        fontSize: 32,
        shadowColor: '#000',
        shadowBlur: 4,
        shadowOffset: { x: 2, y: 2 },
        shadowOpacity: 0.3,
      });
      landmarkLayer.add(icon);
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
    const autoMarkerSize = Math.max(10, Math.min(32, 18 / currentScale));
    if (userPos) {
      const marker = new Konva.Circle({
        x: width/2,
        y: height/2,
        radius: autoMarkerSize,
        fill: '#2196f3',
        stroke: '#fff',
        strokeWidth: 3,
        shadowBlur: 8,
        shadowColor: '#2196f3',
      });
      userLayer.add(marker);
      userLayer.draw();
    }
    return () => stage.destroy();
  }, [map, theme, stageSize, userPos, currentScale]);

  if (loading) return <div style={{textAlign:'center',marginTop:40}}>Loading map...</div>;
  if (error) return <div style={{color:'#e53935',textAlign:'center',marginTop:40}}>{error}</div>;
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1f3c 0%, #0f1220 100%)',
      fontFamily: 'Poppins, sans-serif',
      color: '#e2e8f0',
      padding: 0,
      margin: 0,
      boxSizing: 'border-box',
      width: '100vw',
      overflowX: 'hidden',
    }}>
      <div className="header-section" style={{
        width: '100%',
        maxWidth: 900,
        margin: '0 auto',
        padding: '40px 0 24px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}>
        <span style={{ fontSize: 48, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>📍</span>
        <div className="main-title" style={{
          fontSize: '1.8rem',
          fontWeight: 700,
          letterSpacing: 1,
          color: '#818cf8',
          textShadow: '0 2px 4px rgba(0,0,0,0.2)',
          margin: '8px 0',
        }}>Live Property Map</div>
        <div className="subtitle" style={{
          fontSize: '1.1rem',
          color: '#94a3b8',
          fontWeight: 400,
          textAlign: 'center',
          marginBottom: 4,
        }}>See your location and nearby assets in real time</div>
      </div>
      <div className="map-card" style={{
        padding: '24px 16px 16px 16px',
        borderRadius: 24,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        maxWidth: 900,
        width: '98vw',
        margin: '0 auto 24px auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div className="destination-input" style={{
          width: '98vw',
          maxWidth: 320,
          marginBottom: 16,
          display: 'flex',
          gap: 8,
        }}>
          <input
            type="text"
            placeholder="Enter landmark name..."
            value={searchName}
            onChange={e => { setSearchName(e.target.value); setSearchError(''); }}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '1em',
              backdropFilter: 'blur(4px)',
            }}
          />
          <button
            onClick={() => {
              const lm = (map?.data?.landmarks || []).find(l => l.label && l.label.toLowerCase() === searchName.trim().toLowerCase());
              if (lm) {
                setDestination({ lat: lm.x, lng: lm.y, name: lm.label });
                setShowNav(true);
                setSearchError('');
              } else {
                setSearchError('No landmark found with that name.');
              }
            }}
            style={{
              padding: '12px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#818cf8',
              color: '#fff',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            disabled={!searchName.trim()}
          >Navigate</button>
        </div>
        {searchError && <div style={{ color: '#e53935', marginTop: 4, fontWeight: 500 }}>{searchError}</div>}
        <div className="map-container" style={{
          width: '98vw',
          maxWidth: 800,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.08)',
          margin: '0 auto',
          minHeight: 220,
          minWidth: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 20,
            background: 'rgba(0,0,0,0.18)',
            borderRadius: '50%',
            width: 38,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px #23294633',
            border: '2px solid #fff',
            fontWeight: 700,
            fontSize: 18,
            color: '#e53935',
            letterSpacing: 1,
            userSelect: 'none',
          }}>N</div>
          <div ref={containerRef}></div>
          <div className="zoom-controls" style={{
            position: 'absolute',
            right: 20,
            top: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            zIndex: 10,
          }}>
            <button className="zoom-btn" onClick={()=>setCurrentScale(s=>Math.min(4,s*1.1))} style={{
              width: 40,
              height: 40,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition: 'all 0.2s ease',
            }}>+</button>
            <button className="zoom-btn" onClick={()=>setCurrentScale(s=>Math.max(0.5,s/1.1))} style={{
              width: 40,
              height: 40,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition: 'all 0.2s ease',
            }}>-</button>
          </div>
        </div>
      </div>
      {showNav && (
        <div className="nav-notification navigation active" style={{
          position: 'fixed',
          right: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'linear-gradient(135deg, rgba(26,31,60,0.95) 0%, rgba(52,211,153,0.1) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: 20,
          color: '#e2e8f0',
          fontSize: '1em',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          zIndex: 100,
          minWidth: 280,
          maxWidth: 320,
          transition: 'all 0.3s ease',
          opacity: 1,
          pointerEvents: 'all',
        }}>
          <button className="sound-toggle" onClick={()=>setIsSoundEnabled(s=>!s)} style={{
            position: 'absolute',
            top: 12,
            right: 40,
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 4,
            fontSize: '1.2em',
            transition: 'color 0.2s ease',
            opacity: isSoundEnabled ? 1 : 0.5,
          }}>{isSoundEnabled ? '🔊' : '🔇'}</button>
          <button className="close-btn" onClick={()=>setShowNav(false)} style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 4,
            fontSize: '1.2em',
            transition: 'color 0.2s ease',
          }}>×</button>
          <div className="header" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}>
            <span style={{ color: '#34d399', fontWeight: 600, fontSize: '1.1em' }}>📍</span>
            <span style={{ color: '#34d399', fontWeight: 600, fontSize: '1.1em' }}>Navigation</span>
          </div>
          <div className="distance" style={{ fontSize: '1.8em', fontWeight: 700, color: '#fff', margin: '8px 0' }}>{navDistance} m</div>
          <div className="instruction" style={{ color: '#94a3b8', fontSize: '0.95em', lineHeight: 1.4 }}>{navInstruction}</div>
        </div>
      )}
    </div>
  );
} 