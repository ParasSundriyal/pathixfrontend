import React from 'react';
import { useTheme } from './ThemeContext';

const ToolPanel = () => {
  const { currentTheme } = useTheme();
  if (!currentTheme || !currentTheme.toolset) return <div>No tools available</div>;

  return (
    <div
      className="tool-panel flex flex-col gap-4"
      style={{ background: currentTheme.colors?.toolPanelBg || undefined }}
    >
      {currentTheme.toolset.map((tool, idx) => (
        <div
          key={tool.name}
          className="flex items-center gap-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
        >
          <img
            src={tool.icon}
            alt={tool.name}
            className="w-6 h-6 object-contain"
            style={{ filter: currentTheme.colors?.toolIcon ? `drop-shadow(0 0 2px ${currentTheme.colors.toolIcon})` : undefined }}
          />
          <span className="font-medium">{tool.name}</span>
        </div>
      ))}
    </div>
  );
};

export default ToolPanel; 