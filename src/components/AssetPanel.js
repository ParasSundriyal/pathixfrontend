import React, { useState } from 'react';
import PropTypes from 'prop-types';

// Utility: Detect if running on a mobile device
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * AssetPanel displays a grid of selectable assets (icons + names) for map annotation.
 * - Accepts assets (array of {name, icon}) and onDragStart callback as props.
 * - Handles both emoji and image icons.
 * - Responsive: grid on mobile, vertical on desktop.
 * - Enhanced mobile support with better touch handling.
 */
const AssetPanel = ({ assets, onDragStart }) => {
  const [search, setSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  const filteredAssets = assets.filter(
    asset =>
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      (asset.icon && asset.icon.toLowerCase().includes(search.toLowerCase()))
  );

  // Handle asset selection/click
  const handleAssetClick = (asset, index) => {
    if (isMobile()) {
      // On mobile, provide visual feedback and call onDragStart
      setSelectedAsset(index);
      setTimeout(() => setSelectedAsset(null), 200); // Brief highlight
      onDragStart(asset);
    } else {
      // On desktop, handle as before
      onDragStart(asset);
    }
  };

  // Handle drag start for desktop
  const handleDragStart = (asset) => {
    if (!isMobile()) {
      onDragStart(asset);
    }
  };

  // Handle touch events for mobile
  const handleTouchStart = (asset, index) => {
    if (isMobile()) {
      setSelectedAsset(index);
    }
  };

  const handleTouchEnd = (asset, index) => {
    if (isMobile()) {
      setTimeout(() => setSelectedAsset(null), 150);
      onDragStart(asset);
    }
  };

  return (
    <aside className="w-full md:w-72 max-h-[40vh] md:max-h-[70vh] overflow-y-auto p-2 md:p-4">
      <div className="text-lg font-semibold text-blue-200 mb-4 ml-1">Assets</div>
      
      {/* Search input */}
      <input
        type="text"
        placeholder="Search assets..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-3 p-2 rounded bg-white/20 dark:bg-gray-700/40 text-blue-900 dark:text-blue-100 text-xs outline-none focus:ring-2 focus:ring-blue-400"
      />
      
      {/* Instructions for mobile */}
      {isMobile() && (
        <div className="mb-3 p-2 rounded bg-blue-100/20 dark:bg-blue-900/30 text-blue-200 text-xs">
          📱 Tap an asset, then tap on the map to place it
        </div>
      )}
      
      {/* Assets grid */}
      <div className="grid grid-cols-3 md:grid-cols-1 gap-3">
        {filteredAssets.map((asset, idx) => (
          <div
            key={asset.name + idx}
            className={`
              flex flex-col items-center gap-1 p-3 rounded-xl cursor-pointer shadow transition-all duration-200
              ${selectedAsset === idx 
                ? 'bg-blue-500/40 dark:bg-blue-600/50 scale-95 ring-2 ring-blue-400' 
                : 'bg-white/10 dark:bg-gray-700/60 hover:bg-blue-100/20 dark:hover:bg-blue-900/30'
              }
              ${isMobile() ? 'active:scale-95 active:bg-blue-500/40' : ''}
            `}
            draggable={!isMobile()}
            onDragStart={() => handleDragStart(asset)}
            onClick={() => handleAssetClick(asset, idx)}
            onTouchStart={() => handleTouchStart(asset, idx)}
            onTouchEnd={() => handleTouchEnd(asset, idx)}
            title={asset.name}
            style={{
              minHeight: isMobile() ? '80px' : '70px',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
          >
            {/* Asset icon */}
            <div className="flex items-center justify-center flex-1">
              {asset.icon && asset.icon.startsWith('http') ? (
                <img 
                  src={asset.icon} 
                  alt={asset.name} 
                  className={`object-contain mb-1 ${isMobile() ? 'w-10 h-10' : 'w-8 h-8'}`}
                  draggable={false}
                />
              ) : (
                <span className={`mb-1 ${isMobile() ? 'text-3xl' : 'text-2xl'}`}>
                  {asset.icon}
                </span>
              )}
            </div>
            
            {/* Asset name */}
            <span className={`
              font-medium text-white dark:text-blue-100 text-center leading-tight
              ${isMobile() ? 'text-xs' : 'text-xs'}
            `}>
              {asset.name}
            </span>
            
            {/* Selected indicator for mobile */}
            {isMobile() && selectedAsset === idx && (
              <div className="absolute inset-0 rounded-xl border-2 border-blue-400 bg-blue-400/20 pointer-events-none" />
            )}
          </div>
        ))}
      </div>
      
      {/* No assets message */}
      {filteredAssets.length === 0 && (
        <div className="text-center text-gray-400 text-sm mt-4">
          No assets found matching "{search}"
        </div>
      )}
      
      {/* Upload section */}
      <div className="mt-4 flex items-center gap-2">
        <button className={`
          upload-btn text-xs px-3 py-1 rounded bg-blue-100/20 dark:bg-blue-900/30 text-blue-400 
          transition-colors hover:bg-blue-200/30 dark:hover:bg-blue-800/40
          ${isMobile() ? 'py-2 px-4' : ''}
        `}>
          Upload
        </button>
        <span className="text-gray-400 text-xs">(Coming soon)</span>
      </div>
      
      {/* Desktop instructions */}
      {!isMobile() && (
        <div className="mt-3 p-2 rounded bg-gray-100/10 dark:bg-gray-800/30 text-gray-300 text-xs">
          🖱️ Drag assets to the map or click to select for placement
        </div>
      )}
    </aside>
  );
};

AssetPanel.propTypes = {
  assets: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
    })
  ).isRequired,
  onDragStart: PropTypes.func.isRequired,
};

export default AssetPanel;