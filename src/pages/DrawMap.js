// DrawMap.js
// This page provides an interactive map editor with asset placement, GPS tracking, and theme support.
// Users can drag and drop assets, track GPS routes, zoom/pan, and export map data.
//
// Main features:
// - Asset placement and editing
// - GPS route tracking (with Kalman filter smoothing)
// - Map name editing
// - Theme switching
// - Export/save map data
// - Zoom and pan controls
// - Responsive for mobile/desktop

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Text, Group, Image as KonvaImage } from 'react-konva';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { useTheme } from '../components/ThemeContext';
import AssetPanel from '../components/AssetPanel';
import PlacedAsset from '../components/PlacedAsset';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

// Utility: Detect if running on a mobile device
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Simple Kalman filter for smoothing noisy GPS data
class SimpleKalmanFilter {
  constructor(R = 0.00001, Q = 0.0001, A = 1, B = 0, C = 1) {
    this.R = R; // noise covariance
    this.Q = Q; // process covariance
    this.A = A;
    this.B = B;
    this.C = C;
    this.cov = NaN;
    this.x = NaN;
  }
  filter(z, u = 0) {
    if (isNaN(this.x)) {
      this.x = (1 / this.C) * z;
      this.cov = (1 / this.C) * this.Q * (1 / this.C);
    } else {
      // Prediction
      const predX = (this.A * this.x) + (this.B * u);
      const predCov = ((this.A * this.cov) * this.A) + this.R;
      // Kalman gain
      const K = predCov * this.C / ((this.C * predCov * this.C) + this.Q);
      // Correction
      this.x = predX + K * (z - (this.C * predX));
      this.cov = predCov - (K * this.C * predCov);
    }
    return this.x;
  }
}

const DrawMap = () => {
  // Tool mode: 'pointer', 'grab', or 'point'
  const [toolMode, setToolMode] = useState('pointer');
  // Store original asset data for restoring after point tool
  const [originalLandmarks, setOriginalLandmarks] = useState([]);
  // State for pointer position while placing asset
  const [pointerPos, setPointerPos] = useState(null);
  // Theme context for background image/colors
  const { currentTheme } = useTheme();
  // Map name and editing state
  const [mapName, setMapName] = useState('Map Name');
  const [editingMapName, setEditingMapName] = useState(false);
  // Landmarks/assets placed on the map
  const [landmarks, setLandmarks] = useState([]); // {name, icon, x, y, label}
  // Index of selected landmark for label editing
  const [selectedLandmark, setSelectedLandmark] = useState(null); // for label popup
  // GPS tracking state
  const [gpsTracking, setGpsTracking] = useState(false);
  const [gpsPath, setGpsPath] = useState([]); // [{x, y}]
  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  // Show login modal for saving/exporting
  const [showLogin, setShowLogin] = useState(false);
  // GPS status string (OFF, ON, SIM)
  const [gpsStatus, setGpsStatus] = useState('OFF');
  // Background image object for the map
  const [bgImageObj, setBgImageObj] = useState(null);
  // Refs for Konva stage and drag asset
  const stageRef = useRef();
  const dragAsset = useRef(null);
  // GPS origin and Kalman filter refs
  const [gpsOrigin, setGpsOrigin] = useState(null); // {lat, lng}
  const [gpsWatchId, setGpsWatchId] = useState(null);
  const gpsOriginRef = useRef(null);
  const gpsLatKalman = useRef(null);
  const gpsLngKalman = useRef(null);

  // State for asset placement and selection
  const [pendingAsset, setPendingAsset] = useState(null); // asset to place
  const [selectedAssetIdx, setSelectedAssetIdx] = useState(null);

  // Add state to track if any asset is being dragged
  const [assetDragging, setAssetDragging] = useState(false);

  // Handler to toggle pointer/grab (independent of point tool)
  const togglePointerPan = () => {
    if (toolMode === 'grab') {
      setToolMode('pointer');
    } else if (toolMode === 'pointer') {
      setToolMode('grab');
    } else if (toolMode === 'point') {
      // If point tool is active, do not toggle pointer/pan
      // Optionally, you can allow switching, but for now, keep point tool exclusive
      return;
    }
  };

  // Handler to toggle point tool and convert all assets to points, restore on toggle off
  const activatePointTool = () => {
    if (toolMode === 'point') {
      // Restore original icons, width, height
      setLandmarks(originalLandmarks.length ? originalLandmarks : (lm => lm));
      setToolMode('pointer');
    } else {
      // Save current state for restoration
      setOriginalLandmarks(landmarks.map(lm => ({ ...lm })));
      // Convert all existing assets to points
      setLandmarks(landmarks => landmarks.map(lm => ({
        ...lm,
        width: 18,
        height: 18,
        icon: '☩', // Use a dot, or change to any icon you want
      })));
      setToolMode('point');
    }
  };

  // Utility: Convert lat/lng to canvas coordinates based on origin
  const gpsScale = 100000; // adjust for your use case
  function latLngToCanvas(lat, lng, origin = gpsOriginRef.current) {
    if (!origin) return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
    const x = CANVAS_WIDTH / 2 + (lng - origin.lng) * gpsScale;
    const y = CANVAS_HEIGHT / 2 - (lat - origin.lat) * gpsScale;
    return { x, y };
  }

  // Effect: Load background image from theme
  useEffect(() => {
    if (currentTheme?.backgroundImage) {
      const img = new window.Image();
      img.src = currentTheme.backgroundImage;
      img.onload = () => setBgImageObj(img);
    } else {
      setBgImageObj(null);
    }
  }, [currentTheme]);

  // Drag and drop asset logic
  // When drag starts from AssetPanel, store asset in ref
  const handleAssetDragStart = () => setAssetDragging(true);
  // When drag ends on canvas, place asset at pointer position
  const handleAssetDragEnd = (e) => {
    if (!dragAsset.current) return;
    const stage = stageRef.current.getStage();
    const pointer = stage.getPointerPosition();
    setLandmarks([...landmarks, { ...dragAsset.current, x: pointer.x, y: pointer.y, label: '' }]);
    dragAsset.current = null;
  };

  // Landmark label popup logic
  // Open label editor for a landmark
  const openLabelPopup = (idx) => setSelectedLandmark(idx);
  // Close label editor
  const closeLabelPopup = () => setSelectedLandmark(null);
  // Add local state for label input
  const [labelInput, setLabelInput] = useState("");

  // When opening label popup, set labelInput to current label
  useEffect(() => {
    if (selectedLandmark !== null) {
      setLabelInput(landmarks[selectedLandmark]?.label || "");
    }
  }, [selectedLandmark, landmarks]);

  // Update label for a landmark (only on Save)
  const saveLandmarkLabel = (idx) => {
    setLandmarks(landmarks => landmarks.map((lm, i) => i === idx ? { ...lm, label: labelInput } : lm));
    closeLabelPopup();
  };
  // Delete a landmark
  const deleteLandmark = (idx) => {
    setLandmarks(landmarks => landmarks.filter((_, i) => i !== idx));
    closeLabelPopup();
  };

  // When asset is clicked in AssetPanel, set as pending for placement
  const handleAssetClick = (asset) => {
    setPendingAsset({ ...asset });
  };

  // Helper: check if pointer is near any asset (for mobile touch tolerance)
  function isPointerNearAnyAsset(pointer, tolerance = 24) {
    if (!pointer) return false;
    for (const lm of landmarks) {
      const x1 = lm.x - tolerance;
      const y1 = lm.y - tolerance;
      const x2 = (lm.x + (lm.width || 48) + tolerance);
      const y2 = (lm.y + (lm.height || 48) + tolerance);
      if (pointer.x >= x1 && pointer.x <= x2 && pointer.y >= y1 && pointer.y <= y2) {
        return true;
      }
    }
    return false;
  }

  // Place asset on canvas at pointer or center
  const handleCanvasClick = (e) => {
    if (pendingAsset) {
      const stage = stageRef.current.getStage();
      const pointer = stage.getPointerPosition();
      let x = pointer ? pointer.x : CANVAS_WIDTH / 2;
      let y = pointer ? pointer.y : CANVAS_HEIGHT / 2;
      let assetToPlace;
      if (toolMode === 'point') {
        // Place as a point (small dot or special icon)
        assetToPlace = {
          ...pendingAsset,
          x,
          y,
          width: 18,
          height: 18,
          icon: '+', // Use a dot, or change to any icon you want
        };
      } else {
        assetToPlace = { ...pendingAsset, x, y, width: 48, height: 48 };
      }
      if (assetToPlace.icon && assetToPlace.icon.startsWith('http')) {
        const img = new window.Image();
        img.src = assetToPlace.icon;
        img.onload = () => {
          assetToPlace._imgObj = img;
          setLandmarks((prev) => [...prev, assetToPlace]);
        };
      } else {
        setLandmarks((prev) => [...prev, assetToPlace]);
      }
      setPendingAsset(null);
      setPointerPos(null);
    } else {
      // On mobile, only unselect if not near any asset
      const stage = stageRef.current.getStage();
      const pointer = stage.getPointerPosition();
      if (isMobile()) {
        if (!isPointerNearAnyAsset(pointer, 24)) {
          setSelectedAssetIdx(null);
        }
      } else {
        setSelectedAssetIdx(null);
      }
    }
  };

  // Track pointer position for marker while placing asset
  const handleStageMouseMove = (e) => {
    if (pendingAsset && stageRef.current) {
      const stage = stageRef.current.getStage();
      const pointer = stage.getPointerPosition();
      setPointerPos(pointer);
    }
  };
  const handleStageTouchMove = (e) => {
    if (pendingAsset && stageRef.current) {
      const stage = stageRef.current.getStage();
      const pointer = stage.getPointerPosition();
      setPointerPos(pointer);
    }
  };

  // Asset selection and editing logic
  const handleSelectAsset = (idx) => setSelectedAssetIdx(idx);
  const handleEditAsset = (idx) => openLabelPopup(idx);
  const handleDeleteAsset = (idx) => deleteLandmark(idx);
  // Update asset position after drag
  const handleDragAsset = (idx, updated) => setLandmarks(lms => lms.map((l, i) => i === idx ? updated : l));
  // Update asset size after resize
  const handleResizeAsset = (idx, updated) => setLandmarks(lms => lms.map((l, i) => i === idx ? updated : l));

  // Map name editing logic
  const handleMapNameEdit = () => setEditingMapName(true);
  const handleMapNameSave = (e) => {
    e.preventDefault();
    setEditingMapName(false);
  };

  // Simulate a GPS route (for demo/testing)
  const handleSimulateRoute = () => {
    const route = [
      { x: 100, y: 400 },
      { x: 200, y: 350 },
      { x: 300, y: 300 },
      { x: 400, y: 250 },
      { x: 500, y: 200 },
      { x: 600, y: 180 },
      { x: 700, y: 160 },
    ];
    setGpsPath(route);
    setGpsStatus('SIM');
  };
  // Start GPS tracking (uses Kalman filter for smoothing)
  const handleStartGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsTracking(true);
    setGpsStatus('ON');
    setGpsPath([]);
    setGpsOrigin(null);
    gpsOriginRef.current = null;
    gpsLatKalman.current = new SimpleKalmanFilter();
    gpsLngKalman.current = new SimpleKalmanFilter();
    if (gpsWatchId) {
      navigator.geolocation.clearWatch(gpsWatchId);
      setGpsWatchId(null);
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (!gpsOriginRef.current) {
          setGpsOrigin({ lat, lng });
          gpsOriginRef.current = { lat, lng };
        }
        // Apply Kalman filter
        const smoothLat = gpsLatKalman.current.filter(lat);
        const smoothLng = gpsLngKalman.current.filter(lng);
        const origin = gpsOriginRef.current || { lat, lng };
        const pt = latLngToCanvas(smoothLat, smoothLng, origin);
        setGpsPath((prev) => [...prev, pt]);
      },
      (err) => {
        alert('Error getting GPS position: ' + err.message);
        setGpsTracking(false);
        setGpsStatus('OFF');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    setGpsWatchId(watchId);
  };

  // Stop GPS tracking
  const handleStopGps = () => {
    setGpsTracking(false);
    setGpsStatus('OFF');
    if (gpsWatchId) {
      navigator.geolocation.clearWatch(gpsWatchId);
      setGpsWatchId(null);
    }
  };

  // Reset GPS and map state
  const handleReset = () => {
    setGpsPath([]);
    setGpsOrigin(null);
    gpsOriginRef.current = null;
    gpsLatKalman.current = null;
    gpsLngKalman.current = null;
    setGpsTracking(false);
    setGpsStatus('OFF');
    if (gpsWatchId) {
      navigator.geolocation.clearWatch(gpsWatchId);
      setGpsWatchId(null);
    }
  };

  // Zoom controls (factor > 1 to zoom in, < 1 to zoom out)
  const handleZoom = (factor) => {
    setZoom(z => Math.max(0.5, Math.min(4, z * factor)));
  };
  // Update stage position after drag
  const handleStageDragEnd = (e) => {
    setStagePos({ x: e.target.x(), y: e.target.y() });
  };

  // Export menu state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [qrLink, setQrLink] = useState('');
  const [showQR, setShowQR] = useState(false);

  // Export map data as JSON
  const handleExportJSON = () => {
    const data = {
      name: mapName,
      gpsPath,
      landmarks,
      theme: currentTheme,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (mapName ? mapName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'property-map') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Export map as image
  const handleExportImage = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = (mapName ? mapName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'property-map') + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setShowExportMenu(false);
  };

  // Export map as QR
  const handleExportQR = async () => {
    const data = {
      name: mapName,
      gpsPath,
      landmarks,
      theme: currentTheme?._id,
    };
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/maps/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.link) {
        setQrLink(result.link);
        setShowQR(true);
      }
    } catch (err) {
      alert('Failed to export map as QR.');
    }
    setShowExportMenu(false);
  };

  // Get assets from theme (emoji or image)
  const assets = currentTheme?.assets?.length
    ? currentTheme.assets
    : currentTheme?.toolset || [];

  // Font for map name and labels
  const fontFamily = currentTheme?.fonts?.[0] || 'Poppins, Arial, sans-serif';

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="flex flex-col items-center py-4 font-sans">
        <div className="flex items-center gap-2 text-3xl font-bold font-serif ">
          <span role="img" aria-label="map">🗺️</span>
          <span className=" text-[oklch(78.9%_0.154_211.53)]">Pathix</span>
        </div>
        <div className="subtitle text-gray-400 dark:text-blue-100 text-m mt-1 ml-2 font-sans">Design, annotate, and export property maps with ease</div>
      </header>
      {/* Main Layout */}
      <div className="main-layout flex flex-col md:flex-row max-w-6xl mx-auto w-full gap-4 px-2 font-sans">
        {/* Map Area */}
        <div className="map-area flex-1 flex flex-col items-center bg-white/10 dark:bg-gray-900/80 rounded-2xl shadow-lg m-2 p-2 border border-white/10 dark:border-gray-700">
          {/* Toolbar */}
          <div className="toolbar flex flex-wrap items-center gap-3 mb-4 w-full justify-center">
            <label className="font-semibold text-blue-100 font-sans">Theme:</label>
            <ThemeSwitcher />
            {/* Pointer/Grab icon button */}
            <button
              className={`rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${toolMode === 'grab' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'}`}
              onClick={togglePointerPan}
              title={toolMode === 'grab' ? 'Pan Tool' : 'Pointer Tool'}
              type="button"
            >
              {toolMode === 'grab' ? (
                <span role="img" aria-label="Hand">🤚</span>
              ) : (
                <span role="img" aria-label="Pointer">🖱️</span>
              )}
            </button>
            {/* Point Tool icon button */}
            <button
              className={`rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${toolMode === 'point' ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={activatePointTool}
              title="Point Tool"
              type="button"
            >
              <span role="img" aria-label="Point">📍</span>
            </button>
            <button className="rounded-xl bg-blue-600 text-white py-2 px-5 font-bold shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400" onClick={handleStartGps} disabled={gpsTracking}>Start GPS Tracking</button>
            <button className="rounded-xl bg-blue-600 text-white py-2 px-5 font-bold shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400" onClick={handleStopGps} disabled={!gpsTracking}>Stop GPS Tracking</button>
            <div className="relative inline-block">
              <button className="rounded-xl bg-blue-600 text-white py-2 px-5 font-bold shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400" onClick={() => setShowExportMenu(v => !v)}>
                Export
              </button>
              {showExportMenu && (
                <div className="absolute z-10 right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                  <button className="block w-full text-left px-4 py-2 hover:bg-blue-100 dark:hover:bg-gray-800" onClick={handleExportImage}>Save as Image</button>
                  <button className="block w-full text-left px-4 py-2 hover:bg-blue-100 dark:hover:bg-gray-800" onClick={handleExportJSON}>Export as JSON</button>
                  <button className="block w-full text-left px-4 py-2 hover:bg-blue-100 dark:hover:bg-gray-800" onClick={handleExportQR}>Create QR</button>
                </div>
              )}
            </div>
            <button className="rounded-xl bg-blue-600 text-white py-2 px-5 font-bold shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400" onClick={handleSimulateRoute}>Simulate Route</button>
            <button className="rounded-xl bg-red-500 text-white py-2 px-5 font-bold shadow-lg transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400" onClick={handleReset}>Reset</button>
            <div className={`gps-status flex items-center gap-1 ml-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold ${gpsStatus === 'ON' ? 'text-green-400' : gpsStatus === 'SIM' ? 'text-yellow-400' : 'text-gray-400'}`}>
              <span className="dot w-2 h-2 rounded-full inline-block" style={{ background: gpsStatus === 'ON' ? '#16a34a' : gpsStatus === 'SIM' ? '#facc15' : '#9ca3af' }}></span>
              GPS Tracking: {gpsStatus}
            </div>
          </div>
          {/* Map Canvas Card */}
          <div className="map-canvas-card relative w-full flex justify-center items-center rounded-2xl shadow-lg border border-white/10 dark:border-gray-700 bg-white/10 dark:bg-gray-900/80 overflow-hidden" style={{ minHeight: CANVAS_HEIGHT + 40 }}>
            {/* Zoom controls (mobile) */}
            {isMobile() && (
              <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                <button className="rounded-full bg-blue-600 text-white w-12 h-12 text-2xl shadow hover:bg-blue-700" onClick={() => handleZoom(1.1)}>+</button>
                <button className="rounded-full bg-blue-600 text-white w-12 h-12 text-2xl shadow hover:bg-blue-700" onClick={() => handleZoom(0.9)}>-</button>
              </div>
            )}
            {/* Konva Stage */}
            <Stage
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              scaleX={zoom}
              scaleY={zoom}
              x={stagePos.x}
              y={stagePos.y}
              ref={stageRef}
              draggable={toolMode === 'grab' && !assetDragging}
              onDragEnd={handleStageDragEnd}
              className="rounded-lg border shadow"
              style={{ background: 'transparent', cursor: toolMode === 'grab' ? 'grab' : 'default' }}
              onContentDrop={handleAssetDragEnd}
              onContentMouseUp={handleAssetDragEnd}
              onClick={toolMode === 'pointer' || toolMode === 'point' ? handleCanvasClick : undefined}
              onTap={toolMode === 'pointer' || toolMode === 'point' ? handleCanvasClick : undefined}
              onMouseMove={handleStageMouseMove}
              onTouchMove={handleStageTouchMove}
            >
              <Layer>
                {/* Background image */}
                {bgImageObj && (
                  <KonvaImage image={bgImageObj} x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
                )}
                {/* Canvas Scale Reference (bottom left) */}
                {/* 100 meters scale bar, adjust gpsScale if needed */}
                <Group x={30} y={CANVAS_HEIGHT - 40}>
                  <Line
                    points={[0, 0, 100, 0]}
                    stroke="#fff"
                    strokeWidth={4}
                    shadowBlur={2}
                    shadowColor="#232946"
                  />
                  <Text
                    text="100 m"
                    x={0}
                    y={8}
                    fontSize={16}
                    fill="#fff"
                    fontStyle="bold"
                    shadowColor="#232946"
                    shadowBlur={2}
                  />
                </Group>
                {/* Editable Map Name */}
                <Text
                  text={mapName}
                  x={CANVAS_WIDTH / 2 - 100}
                  y={15}
                  width={200}
                  align="center"
                  fontSize={30}
                  fontFamily={fontFamily}
                  fill="#888"
                  onClick={handleMapNameEdit}
                  style={{ cursor: 'pointer' }}
                />
                {/* GPS Road Path */}
                {gpsPath.length > 1 && (
                  <Line
                    points={gpsPath.flatMap(pt => [pt.x, pt.y])}
                    stroke={currentTheme?.roadStyle?.color || '#eebbc3'}
                    strokeWidth={currentTheme?.roadStyle?.width || 8}
                    lineCap={currentTheme?.roadStyle?.lineCap || 'round'}
                    lineJoin={currentTheme?.roadStyle?.lineJoin || 'round'}
                  />
                )}
                {/* Placed assets (landmarks) */}
                {landmarks.map((lm, idx) => (
                  <PlacedAsset
                    key={idx}
                    asset={lm}
                    selected={toolMode === 'pointer' && selectedAssetIdx === idx}
                    onSelect={toolMode === 'pointer' ? () => handleSelectAsset(idx) : undefined}
                    onEdit={toolMode === 'pointer' ? () => handleEditAsset(idx) : undefined}
                    onDelete={toolMode === 'pointer' ? () => handleDeleteAsset(idx) : undefined}
                    onDrag={toolMode === 'pointer' ? updated => handleDragAsset(idx, updated) : undefined}
                    onResize={toolMode === 'pointer' ? updated => handleResizeAsset(idx, updated) : undefined}
                    onDragStart={() => setAssetDragging(true)}
                    onDragEnd={() => setAssetDragging(false)}
                  />
                ))}
                {/* Marker for asset placement anchor */}
                {pendingAsset && pointerPos && (
                  <Group x={pointerPos.x} y={pointerPos.y}>
                    <Line points={[-10,0,10,0]} stroke="#e11d48" strokeWidth={2} />
                    <Line points={[0,-10,0,10]} stroke="#e11d48" strokeWidth={2} />
                    <Text text="Anchor" x={12} y={-8} fontSize={14} fill="#e11d48" />
                  </Group>
                )}
              </Layer>
            </Stage>
          </div>
        </div>
        {/* Asset Panel (side on desktop only) */}
        <div className="hidden md:block w-80 rounded-2xl shadow-lg bg-white/10 dark:bg-gray-900/80 border border-white/10 dark:border-gray-700 mt-0">
          <AssetPanel assets={assets} onDragStart={handleAssetClick} />
        </div>
      </div>
      {/* Asset Panel (below map on mobile only) */}
      <div className="block md:hidden w-full mt-2 px-2">
        <AssetPanel assets={assets} onDragStart={handleAssetClick} />
      </div>
      {/* Landmark Label Popup */}
      {selectedLandmark !== null && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-lg w-80 max-w-full">
            <div className="font-bold mb-2">Edit Place Label</div>
            <input
              className="w-full p-2 rounded border mb-2"
              type="text"
              value={labelInput}
              onChange={e => setLabelInput(e.target.value)}
              placeholder="Enter name or description..."
            />
            <div className="flex gap-2 justify-end">
              <button className="btn" onClick={() => saveLandmarkLabel(selectedLandmark)}>Save</button>
              <button className="btn" onClick={closeLabelPopup}>Cancel</button>
              <button className="btn text-red-600" onClick={() => deleteLandmark(selectedLandmark)}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {/* Map Name Edit Popup */}
      {editingMapName && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <form className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-lg w-80 max-w-full" onSubmit={handleMapNameSave}>
            <div className="font-bold mb-2">Edit Map Name</div>
            <input
              className="w-full p-2 rounded border mb-2"
              type="text"
              value={mapName}
              onChange={e => setMapName(e.target.value)}
              placeholder="Enter map name..."
            />
            <div className="flex gap-2 justify-end">
              <button className="btn" type="submit">Save</button>
              <button className="btn" type="button" onClick={() => setEditingMapName(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {/* Login Modal (for Save) */}
      {showLogin && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-lg w-80 max-w-full">
            <div className="font-bold mb-2">Login to Save Map</div>
            <input className="w-full p-2 rounded border mb-2" type="text" placeholder="Username" />
            <input className="w-full p-2 rounded border mb-2" type="password" placeholder="Password" />
            <div className="flex gap-2 justify-end">
              <button className="btn" onClick={() => setShowLogin(false)}>Login</button>
              <button className="btn" onClick={() => setShowLogin(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-lg w-80 max-w-full flex flex-col items-center">
            <div className="font-bold mb-2">Scan to View Map</div>
            {qrLink && (
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrLink)}`} alt="QR Code" />
            )}
            <div className="mt-2 break-all text-xs text-blue-600 dark:text-blue-300">{qrLink}</div>
            <button className="btn mt-4" onClick={() => setShowQR(false)}>Close</button>
          </div>
        </div>
      )}
      {/* Footer */}
      <footer className="text-center text-gray-400 text-xs my-4">&copy; 2024 Pathix &mdash; Crafted with <span className="text-pink-500">&#10084;&#65039;</span></footer>
    </div>
  );
};

export default DrawMap; 