import React from 'react';
import PropTypes from 'prop-types';

/**
 * AssetPanel displays a grid of draggable assets (icons + names) for map annotation.
 * - Accepts assets (array of {name, icon}) and onDragStart callback as props.
 * - Handles both emoji and image icons.
 * - Responsive: grid on mobile, vertical on desktop.
 * - Modern, card-like style inspired by Demo.html.
 */
const AssetPanel = ({ assets, onDragStart }) => {
  return (
    <aside className="w-full md:w-72 max-h-[40vh] md:max-h-[70vh] overflow-y-auto p-2 md:p-4">
      <div className="text-lg font-semibold text-blue-200 mb-4 ml-1">Assets</div>
      <div className="grid grid-cols-3 md:grid-cols-1 gap-3">
        {assets.map((asset, idx) => (
          <div
            key={asset.name + idx}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/10 dark:bg-gray-700/60 hover:bg-blue-100/20 dark:hover:bg-blue-900/30 cursor-pointer shadow"
            draggable
            onDragStart={() => onDragStart(asset)}
            onTouchStart={() => onDragStart(asset)}
            title={asset.name}
          >
            {/* Support both emoji and image icons */}
            {asset.icon && asset.icon.startsWith('http') ? (
              <img src={asset.icon} alt={asset.name} className="w-8 h-8 object-contain mb-1" />
            ) : (
              <span className="text-2xl mb-1">{asset.icon}</span>
            )}
            <span className="font-medium text-xs text-white dark:text-blue-100 text-center">{asset.name}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button className="upload-btn text-xs px-3 py-1 rounded bg-blue-100/20 dark:bg-blue-900/30 text-blue-400">Upload</button>
        <span className="text-gray-400 text-xs">(Coming soon)</span>
      </div>
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