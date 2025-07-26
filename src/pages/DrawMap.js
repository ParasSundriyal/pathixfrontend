// DrawMap.js
// Professional property mapping application with enhanced GPS tracking, asset placement, and path editing tools.
// Features: Asset placement, GPS route tracking with editing capabilities, professional UI design.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Line, Text, Group, Image as KonvaImage, Circle } from 'react-konva';
import { Link, useNavigate } from 'react-router-dom';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { useTheme } from '../components/ThemeContext';
import AssetPanel from '../components/AssetPanel';
import PlacedAsset from '../components/PlacedAsset';
import logo from '../logo.svg'

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

// Utility: Detect if running on a mobile device
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Simple Kalman filter for smoothing noisy GPS data
class SimpleKalmanFilter {
  constructor(R = 0.00001, Q = 0.0001, A = 1, B = 0, C = 1) {
    this.R = R; this.Q = Q; this.A = A; this.B = B; this.C = C;
    this.cov = NaN; this.x = NaN;
  }
  filter(z, u = 0) {
    if (isNaN(this.x)) {
      this.x = (1 / this.C) * z;
      this.cov = (1 / this.C) * this.Q * (1 / this.C);
    } else {
      const predX = (this.A * this.x) + (this.B * u);
      const predCov = ((this.A * this.cov) * this.A) + this.R;
      const K = predCov * this.C / ((this.C * predCov * this.C) + this.Q);
      this.x = predX + K * (z - (this.C * predX));
      this.cov = predCov - (K * this.C * predCov);
    }
    return this.x;
  }
}

const DrawMap = () => {
  // Tool modes: 'select', 'pan', 'point', 'place', 'move', 'path-edit', 'path-delete'
  const [toolMode, setToolMode] = useState('select');
  const [originalLandmarks, setOriginalLandmarks] = useState([]);
  const [pointerPos, setPointerPos] = useState(null);
  
  // Theme and UI state
  const { currentTheme } = useTheme();
  const [mapName, setMapName] = useState('Property Map');
  const [editingMapName, setEditingMapName] = useState(false);
  
  // Assets and selection
  const [landmarks, setLandmarks] = useState([]);
  const [selectedLandmark, setSelectedLandmark] = useState(null);
  const [selectedAssetIdx, setSelectedAssetIdx] = useState(null);
  const [pendingAsset, setPendingAsset] = useState(null);
  const [movingAssetIdx, setMovingAssetIdx] = useState(null);
  
  // GPS tracking
  const [gpsTracking, setGpsTracking] = useState(false);
  const [gpsPaused, setGpsPaused] = useState(false);
  const [gpsPath, setGpsPath] = useState([]);
  const [gpsSegments, setGpsSegments] = useState([]);
  const [gpsStatus, setGpsStatus] = useState('OFF');
  
  // Path editing
  const [pathPoints, setPathPoints] = useState([]); // Editable path points
  const [selectedPathPoint, setSelectedPathPoint] = useState(null);
  const [editingSegmentIdx, setEditingSegmentIdx] = useState(null);
  
  // Canvas state
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [bgImageObj, setBgImageObj] = useState(null);
  const [assetDragging, setAssetDragging] = useState(false);
  
  // GPS refs
  const stageRef = useRef();
  const [gpsOrigin, setGpsOrigin] = useState(null);
  const [gpsWatchId, setGpsWatchId] = useState(null);
  const gpsOriginRef = useRef(null);
  const gpsLatKalman = useRef(null);
  const gpsLngKalman = useRef(null);
  
  // Export state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [qrLink, setQrLink] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [labelInput, setLabelInput] = useState("");

  // Tool handlers
  const setSelectTool = () => {
    setToolMode('select');
    clearPendingOperations();
  };

  const setPanTool = () => {
    setToolMode('pan');
    clearPendingOperations();
  };

  const setPointTool = () => {
    if (toolMode === 'point') {
      setLandmarks(originalLandmarks.length ? originalLandmarks : landmarks);
      setToolMode('select');
      setOriginalLandmarks([]);
    } else {
      setOriginalLandmarks(landmarks.map(lm => ({ ...lm })));
      setLandmarks(landmarks => landmarks.map(lm => ({
        ...lm, width: 18, height: 18, icon: '●'
      })));
      setToolMode('point');
    }
    clearPendingOperations();
  };

  const setPathEditTool = () => {
    if (toolMode === 'path-edit') {
      setToolMode('select');
      setPathPoints([]);
      setEditingSegmentIdx(null);
    } else {
      setToolMode('path-edit');
      // Convert current paths to editable points
      const allPoints = [];
      [...gpsSegments, gpsPath].forEach((segment, segIdx) => {
        segment.forEach((point, ptIdx) => {
          allPoints.push({ ...point, segmentIdx: segIdx, pointIdx: ptIdx });
        });
      });
      setPathPoints(allPoints);
    }
    clearPendingOperations();
  };

  const clearPendingOperations = () => {
    setPendingAsset(null);
    setMovingAssetIdx(null);
    setPointerPos(null);
    setSelectedAssetIdx(null);
    setSelectedPathPoint(null);
  };

  // Utility functions
  const gpsScale = 100000;
  function latLngToCanvas(lat, lng, origin = gpsOriginRef.current) {
    if (!origin) return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
    const x = CANVAS_WIDTH / 2 + (lng - origin.lng) * gpsScale;
    const y = CANVAS_HEIGHT / 2 - (lat - origin.lat) * gpsScale;
    return { x, y };
  }

  function getStagePointerPosition() {
    const stage = stageRef.current?.getStage();
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    return transform.point(pointer);
  }

  // Background image loading
  useEffect(() => {
    if (currentTheme?.backgroundImage) {
      const img = new window.Image();
      img.src = currentTheme.backgroundImage;
      img.onload = () => setBgImageObj(img);
    } else {
      setBgImageObj(null);
    }
  }, [currentTheme]);

  // Asset placement - Fixed for both mobile and desktop
  const handleAssetClick = useCallback((asset) => {
    setPendingAsset({ ...asset });
    setToolMode('place');
    setMovingAssetIdx(null);
  }, []);

  // Canvas interaction handlers
  const handleCanvasClick = useCallback((e) => {
    const stagePoint = getStagePointerPosition();
    if (!stagePoint) return;

    if (toolMode === 'place' && pendingAsset) {
      // Place new asset
      const assetToPlace = {
        ...pendingAsset,
        x: stagePoint.x,
        y: stagePoint.y,
        width: pendingAsset.width || 48,
        height: pendingAsset.height || 48,
        label: ''
      };

      if (assetToPlace.icon && assetToPlace.icon.startsWith('http')) {
        const img = new window.Image();
        img.src = assetToPlace.icon;
        img.onload = () => {
          assetToPlace._imgObj = img;
          setLandmarks(prev => [...prev, assetToPlace]);
        };
      } else {
        setLandmarks(prev => [...prev, assetToPlace]);
      }

      setPendingAsset(null);
      setToolMode('select');
      setPointerPos(null);
      
    } else if (toolMode === 'move' && movingAssetIdx !== null) {
      // Move existing asset
      setLandmarks(landmarks => landmarks.map((lm, i) => 
        i === movingAssetIdx ? { ...lm, x: stagePoint.x, y: stagePoint.y } : lm
      ));
      setMovingAssetIdx(null);
      setToolMode('select');
      setPointerPos(null);
      
    } else if (toolMode === 'path-edit') {
      // Add new path point
      const newPoint = { x: stagePoint.x, y: stagePoint.y, segmentIdx: 0, pointIdx: pathPoints.length };
      setPathPoints(prev => [...prev, newPoint]);
      
    } else if (toolMode === 'select') {
      // Check for asset selection
      let foundAsset = false;
      for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i];
        const w = lm.width || 48;
        const h = lm.height || 48;
        if (Math.abs(stagePoint.x - lm.x) < w/2 + 10 && 
            Math.abs(stagePoint.y - lm.y) < h/2 + 10) {
          setSelectedAssetIdx(i);
          foundAsset = true;
          break;
        }
      }
      if (!foundAsset) {
        setSelectedAssetIdx(null);
      }
    }
  }, [toolMode, pendingAsset, movingAssetIdx, landmarks, pathPoints]);

  // Mouse/touch move handler
  const handleStageMouseMove = useCallback((e) => {
    if ((toolMode === 'place' && pendingAsset) || (toolMode === 'move' && movingAssetIdx !== null)) {
      const stagePoint = getStagePointerPosition();
      setPointerPos(stagePoint);
    }
  }, [toolMode, pendingAsset, movingAssetIdx]);

  // Asset manipulation handlers
  const handleSelectAsset = useCallback((idx) => {
    setSelectedAssetIdx(idx);
  }, []);

  const handleEditAsset = useCallback((idx) => {
    setSelectedLandmark(idx);
    setLabelInput(landmarks[idx]?.label || "");
  }, [landmarks]);

  const handleDeleteAsset = useCallback((idx) => {
    setLandmarks(landmarks => landmarks.filter((_, i) => i !== idx));
    setSelectedAssetIdx(null);
  }, []);

  const handleMoveAsset = useCallback((idx) => {
    setMovingAssetIdx(idx);
    setToolMode('move');
    setSelectedAssetIdx(null);
  }, []);

  const handleDragAsset = useCallback((idx, updated) => {
    setLandmarks(lms => lms.map((l, i) => i === idx ? updated : l));
  }, []);

  const handleResizeAsset = useCallback((idx, updated) => {
    setLandmarks(lms => lms.map((l, i) => i === idx ? updated : l));
  }, []);

  // Label popup handlers
  useEffect(() => {
    if (selectedLandmark !== null) {
      setLabelInput(landmarks[selectedLandmark]?.label || "");
    }
  }, [selectedLandmark, landmarks]);

  const saveLandmarkLabel = (idx) => {
    setLandmarks(landmarks => landmarks.map((lm, i) => i === idx ? { ...lm, label: labelInput } : lm));
    setSelectedLandmark(null);
  };

  const closeLabelPopup = () => setSelectedLandmark(null);

  // Path editing handlers
  const handlePathPointClick = (pointIdx) => {
    setSelectedPathPoint(pointIdx);
  };

  const handlePathPointDrag = (pointIdx, newPos) => {
    setPathPoints(points => points.map((p, i) => 
      i === pointIdx ? { ...p, x: newPos.x, y: newPos.y } : p
    ));
  };

  const deletePathPoint = (pointIdx) => {
    setPathPoints(points => points.filter((_, i) => i !== pointIdx));
    setSelectedPathPoint(null);
  };

  const applyPathChanges = () => {
    // Convert edited points back to segments
    const newSegments = [];
    const segmentMap = {};
    
    pathPoints.forEach(point => {
      if (!segmentMap[point.segmentIdx]) {
        segmentMap[point.segmentIdx] = [];
      }
      segmentMap[point.segmentIdx].push({ x: point.x, y: point.y });
    });
    
    Object.keys(segmentMap).forEach(segIdx => {
      newSegments.push(segmentMap[segIdx]);
    });
    
    setGpsSegments(newSegments);
    setGpsPath([]);
    setToolMode('select');
    setPathPoints([]);
  };

  // GPS tracking functions
  const handleStartGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGpsTracking(true);
    setGpsPaused(false);
    setGpsStatus('ON');
    
    if (gpsPath.length === 0) {
      setGpsPath([]);
      setGpsSegments([]);
      setGpsOrigin(null);
      gpsOriginRef.current = null;
      gpsLatKalman.current = new SimpleKalmanFilter();
      gpsLngKalman.current = new SimpleKalmanFilter();
    }

    if (gpsWatchId) {
      navigator.geolocation.clearWatch(gpsWatchId);
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (gpsPaused) return;
        const { latitude: lat, longitude: lng } = pos.coords;
        if (!gpsOriginRef.current) {
          setGpsOrigin({ lat, lng });
          gpsOriginRef.current = { lat, lng };
        }
        const smoothLat = gpsLatKalman.current.filter(lat);
        const smoothLng = gpsLngKalman.current.filter(lng);
        const pt = latLngToCanvas(smoothLat, smoothLng, gpsOriginRef.current);
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

  const handlePauseGps = () => {
    if (gpsTracking && !gpsPaused) {
      setGpsPaused(true);
      setGpsStatus('PAUSED');
      if (gpsPath.length > 0) {
        setGpsSegments(prev => [...prev, [...gpsPath]]);
        setGpsPath([]);
      }
    } else if (gpsTracking && gpsPaused) {
      setGpsPaused(false);
      setGpsStatus('ON');
    }
  };

  const handleStopGps = () => {
    setGpsTracking(false);
    setGpsPaused(false);
    setGpsStatus('OFF');
    
    if (gpsPath.length > 0) {
      setGpsSegments(prev => [...prev, [...gpsPath]]);
      setGpsPath([]);
    }
    
    if (gpsWatchId) {
      navigator.geolocation.clearWatch(gpsWatchId);
      setGpsWatchId(null);
    }
  };

  const handleSimulateRoute = () => {
    const route = [
      { x: 100, y: 400 }, { x: 200, y: 350 }, { x: 300, y: 300 },
      { x: 400, y: 250 }, { x: 500, y: 200 }, { x: 600, y: 180 }, { x: 700, y: 160 }
    ];
    setGpsPath(route);
    setGpsSegments([route]);
    setGpsStatus('SIM');
  };

  const handleReset = () => {
    setGpsPath([]);
    setGpsSegments([]);
    setPathPoints([]);
    setGpsOrigin(null);
    gpsOriginRef.current = null;
    setGpsTracking(false);
    setGpsPaused(false);
    setGpsStatus('OFF');
    if (gpsWatchId) {
      navigator.geolocation.clearWatch(gpsWatchId);
      setGpsWatchId(null);
    }
  };

  // Export functions
  const handleExportJSON = () => {
    const data = {
      name: mapName,
      gpsPath,
      gpsSegments,
      landmarks,
      theme: currentTheme,
      gpsOrigin: gpsOriginRef.current,
      gpsScale: gpsScale,
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

  // Zoom and pan
  const handleZoom = (factor) => {
    setZoom(z => Math.max(0.5, Math.min(4, z * factor)));
  };

  const handleStageDragEnd = (e) => {
    setStagePos({ x: e.target.x(), y: e.target.y() });
  };

  // Get theme assets
  const assets = currentTheme?.assets?.length ? currentTheme.assets : currentTheme?.toolset || [];
  const fontFamily = currentTheme?.fonts?.[0] || 'Inter, system-ui, sans-serif';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Professional Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">

              <div>
                      <Link to="/" className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-200 rounded-xl flex items-center justify-center">
                        <img src={logo} alt="Pathix Logo" className="h-8 w-8 sm:h-10 sm:w-10 drop-shadow-[0_0_12px_#f6d365]" /></div>
                        {/* <span className="text-xl sm:text-3xl font-extrabold font-sans bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_#f6d365] tracking-wide ml-1 sm:ml-2">Pathix</span> */}
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pathix</h1>
                      </Link>
                
                <p className="text-sm text-slate-600 dark:text-slate-400">Professional Property Mapping</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                gpsStatus === 'ON' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                gpsStatus === 'PAUSED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                gpsStatus === 'SIM' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  gpsStatus === 'ON' ? 'bg-green-500' :
                  gpsStatus === 'PAUSED' ? 'bg-yellow-500' :
                  gpsStatus === 'SIM' ? 'bg-blue-500' : 'bg-slate-400'
                }`} />
                GPS {gpsStatus}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 gap-6 grid grid-cols-1 lg:grid-cols-4">
        {/* Toolbar */}
        <div className="lg:col-span-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Tool Selection */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  toolMode === 'select' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                onClick={setSelectTool}
              >
                <span className="mr-2">🔍</span>Select
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  toolMode === 'pan' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                onClick={setPanTool}
              >
                <span className="mr-2">🤚</span>Pan
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  toolMode === 'point' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                onClick={setPointTool}
              >
                <span className="mr-2">📍</span>Point
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  toolMode === 'path-edit' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                onClick={setPathEditTool}
              >
                <span className="mr-2">✏️</span>Edit Path
              </button>
            </div>

            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

            {/* GPS Controls */}
            <div className="flex items-center gap-2">
              <button 
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                onClick={handleStartGps} 
                disabled={gpsTracking && !gpsPaused}
              >
                {gpsTracking ? 'Resume' : 'Start GPS'}
              </button>
              <button 
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                onClick={handlePauseGps} 
                disabled={!gpsTracking}
              >
                {gpsPaused ? 'Resume' : 'Pause'}
              </button>
              <button 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                onClick={handleStopGps} 
                disabled={!gpsTracking}
              >
                Stop
              </button>
            </div>

            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

            {/* Utility Buttons */}
            <button 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              onClick={handleSimulateRoute}
            >
              Simulate
            </button>
            <button 
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
              onClick={handleReset}
            >
              Reset
            </button>

            {/* Export Menu */}
            <div className="relative ml-auto">
              <button 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                Export
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                  <button 
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                    onClick={handleExportImage}
                  >
                    📸 Save as Image
                  </button>
                  <button 
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                    onClick={handleExportJSON}
                  >
                    📄 Export JSON
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Status Indicators */}
          {(toolMode === 'place' && pendingAsset) && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="mr-2">📍</span>Click on the map to place: <strong>{pendingAsset.name}</strong>
              </p>
            </div>
          )}
          {(toolMode === 'move' && movingAssetIdx !== null) && (
            <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                <span className="mr-2">🎯</span>Click on the map to move: <strong>{landmarks[movingAssetIdx]?.name}</strong>
              </p>
            </div>
          )}
          {toolMode === 'path-edit' && (
            <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  <span className="mr-2">✏️</span>Path editing mode - Click to add points, drag to move, right-click to delete
                </p>
                <button 
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium"
                  onClick={applyPathChanges}
                >
                  Apply Changes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Asset Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
            <AssetPanel assets={assets} onDragStart={handleAssetClick} />
          </div>
        </div>

        {/* Map Canvas */}
        <div className="lg:col-span-3">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            {/* Map Name */}
            <div className="mb-4 text-center">
              {editingMapName ? (
                <form onSubmit={(e) => { e.preventDefault(); setEditingMapName(false); }} className="inline-block">
                  <input
                    type="text"
                    value={mapName}
                    onChange={(e) => setMapName(e.target.value)}
                    className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 text-center outline-none text-slate-900 dark:text-white"
                    autoFocus
                    onBlur={() => setEditingMapName(false)}
                  />
                </form>
              ) : (
                <h2 
                  className="text-2xl font-bold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={() => setEditingMapName(true)}
                >
                  {mapName}
                </h2>
              )}
            </div>

            {/* Canvas Container */}
            <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              {/* Zoom Controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <button 
                  className="w-10 h-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-md border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold transition-colors"
                  onClick={() => handleZoom(1.2)}
                >
                  +
                </button>
                <button 
                  className="w-10 h-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-md border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold transition-colors"
                  onClick={() => handleZoom(0.8)}
                >
                  −
                </button>
                <div className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1">
                  {Math.round(zoom * 100)}%
                </div>
              </div>

              {/* Konva Stage */}
              <Stage
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                scaleX={zoom}
                scaleY={zoom}
                x={stagePos.x}
                y={stagePos.y}
                ref={stageRef}
                draggable={toolMode === 'pan' && !assetDragging}
                onDragEnd={handleStageDragEnd}
                onClick={handleCanvasClick}
                onTap={handleCanvasClick}
                onMouseMove={handleStageMouseMove}
                onTouchMove={handleStageMouseMove}
                style={{ cursor: toolMode === 'pan' ? 'grab' : 'default' }}
              >
                <Layer>
                  {/* Background */}
                  {bgImageObj ? (
                    <KonvaImage image={bgImageObj} x={0} y={0} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
                  ) : (
                    <Group>
                      {/* Grid pattern */}
                      {Array.from({ length: Math.floor(CANVAS_WIDTH / 50) }, (_, i) => (
                        <Line
                          key={`v-${i}`}
                          points={[i * 50, 0, i * 50, CANVAS_HEIGHT]}
                          stroke="rgba(148, 163, 184, 0.1)"
                          strokeWidth={1}
                        />
                      ))}
                      {Array.from({ length: Math.floor(CANVAS_HEIGHT / 50) }, (_, i) => (
                        <Line
                          key={`h-${i}`}
                          points={[0, i * 50, CANVAS_WIDTH, i * 50]}
                          stroke="rgba(148, 163, 184, 0.1)"
                          strokeWidth={1}
                        />
                      ))}
                    </Group>
                  )}

                  {/* Scale Reference */}
                  <Group x={20} y={CANVAS_HEIGHT - 60}>
                    <Line
                      points={[0, 0, 100, 0]}
                      stroke="#1e293b"
                      strokeWidth={3}
                    />
                    <Line points={[0, -5, 0, 5]} stroke="#1e293b" strokeWidth={3} />
                    <Line points={[100, -5, 100, 5]} stroke="#1e293b" strokeWidth={3} />
                    <Text
                      text="100m"
                      x={0}
                      y={8}
                      fontSize={12}
                      fill="#1e293b"
                      fontFamily={fontFamily}
                      fontStyle="600"
                    />
                  </Group>

                  {/* GPS Path Segments */}
                  {gpsSegments.map((segment, idx) => 
                    segment.length > 1 && (
                      <Line
                        key={`segment-${idx}`}
                        points={segment.flatMap(pt => [pt.x, pt.y])}
                        stroke={currentTheme?.roadStyle?.color || '#3b82f6'}
                        strokeWidth={currentTheme?.roadStyle?.width || 6}
                        lineCap="round"
                        lineJoin="round"
                        shadowColor="rgba(0,0,0,0.2)"
                        shadowBlur={4}
                        shadowOffsetY={2}
                      />
                    )
                  )}

                  {/* Current GPS Path */}
                  {gpsPath.length > 1 && (
                    <Line
                      points={gpsPath.flatMap(pt => [pt.x, pt.y])}
                      stroke={gpsPaused ? '#f59e0b' : (currentTheme?.roadStyle?.color || '#3b82f6')}
                      strokeWidth={currentTheme?.roadStyle?.width || 6}
                      lineCap="round"
                      lineJoin="round"
                      dash={gpsPaused ? [10, 5] : undefined}
                      shadowColor="rgba(0,0,0,0.2)"
                      shadowBlur={4}
                      shadowOffsetY={2}
                    />
                  )}

                  {/* Path Edit Points */}
                  {toolMode === 'path-edit' && pathPoints.map((point, idx) => (
                    <Circle
                      key={`path-point-${idx}`}
                      x={point.x}
                      y={point.y}
                      radius={selectedPathPoint === idx ? 8 : 6}
                      fill={selectedPathPoint === idx ? '#ef4444' : '#3b82f6'}
                      stroke="#ffffff"
                      strokeWidth={2}
                      draggable
                      onDragMove={(e) => handlePathPointDrag(idx, { x: e.target.x(), y: e.target.y() })}
                      onClick={() => handlePathPointClick(idx)}
                      onTap={() => handlePathPointClick(idx)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}

                  {/* Placed Assets */}
                  {landmarks.map((lm, idx) => (
                    <PlacedAsset
                      key={`asset-${idx}`}
                      asset={lm}
                      selected={toolMode === 'select' && selectedAssetIdx === idx}
                      onSelect={() => handleSelectAsset(idx)}
                      onEdit={() => handleEditAsset(idx)}
                      onDelete={() => handleDeleteAsset(idx)}
                      onMove={() => handleMoveAsset(idx)}
                      onDrag={(updated) => handleDragAsset(idx, updated)}
                      onResize={(updated) => handleResizeAsset(idx, updated)}
                      onDragStart={() => setAssetDragging(true)}
                      onDragEnd={() => setAssetDragging(false)}
                    />
                  ))}

                  {/* Placement/Movement Crosshair */}
                  {((toolMode === 'place' && pendingAsset) || (toolMode === 'move' && movingAssetIdx !== null)) && pointerPos && (
                    <Group x={pointerPos.x} y={pointerPos.y}>
                      <Circle
                        radius={20}
                        stroke="#ef4444"
                        strokeWidth={2}
                        dash={[5, 5]}
                      />
                      <Line points={[-15, 0, 15, 0]} stroke="#ef4444" strokeWidth={2} />
                      <Line points={[0, -15, 0, 15]} stroke="#ef4444" strokeWidth={2} />
                      <Circle radius={2} fill="#ef4444" />
                      <Text
                        text={toolMode === 'move' ? 'Move Here' : 'Place Here'}
                        x={25}
                        y={-8}
                        fontSize={12}
                        fill="#ef4444"
                        fontFamily={fontFamily}
                        fontStyle="600"
                      />
                    </Group>
                  )}
                </Layer>
              </Stage>
            </div>

            {/* Map Info */}
            <div className="mt-4 flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
              <div>
                Assets: {landmarks.length} | Zoom: {Math.round(zoom * 100)}%
              </div>
              <div>
                Path Points: {[...gpsSegments, gpsPath].reduce((acc, seg) => acc + seg.length, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Path Edit Controls */}
      {toolMode === 'path-edit' && selectedPathPoint !== null && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 z-50">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Point {selectedPathPoint + 1} selected
            </span>
            <button
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              onClick={() => deletePathPoint(selectedPathPoint)}
            >
              Delete Point
            </button>
          </div>
        </div>
      )}

      {/* Label Edit Modal */}
      {selectedLandmark !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Edit Asset Label
            </h3>
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Enter description or name..."
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                onClick={() => saveLandmarkLabel(selectedLandmark)}
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                onClick={closeLabelPopup}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                onClick={() => {
                  handleDeleteAsset(selectedLandmark);
                  closeLabelPopup();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Scan QR Code
            </h3>
            {qrLink && (
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrLink)}`} 
                alt="QR Code" 
                className="mx-auto mb-4 rounded-lg"
              />
            )}
            <div className="text-xs text-slate-500 dark:text-slate-400 break-all mb-4">
              {qrLink}
            </div>
            <button
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              onClick={() => setShowQR(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Professional Footer */}
      <footer className="mt-12 text-center text-slate-500 dark:text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 border-t border-slate-200 dark:border-slate-700">
          © 2024 Pathix • Professional Property Mapping Solution
        </div>
      </footer>
    </div>
  );
};

export default DrawMap;