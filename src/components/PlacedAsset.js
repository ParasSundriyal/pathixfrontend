// PlacedAsset.js
// This component renders a draggable, resizable, and selectable asset (icon or image) on a Konva canvas.
// It supports selection, editing, deletion, moving, and resizing via handles, and displays a menu when selected.
// Enhanced for better mobile support with improved touch handling and visual feedback.

import React, { useRef, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Group, Rect, Text, Image as KonvaImage, Circle } from 'react-konva';

const HANDLE_SIZE = 18; // Size of the resize handles
const MIN_SIZE = 32;    // Minimum width/height for resizing

// Utility: Detect if running on a mobile device
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

const PlacedAsset = ({
  asset,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onMove,
  onDrag,
  onResize,
  stageScale = 1,
  onDragStart,
  onDragEnd,
}) => {
  const groupRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState(null);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const wasDraggedOrResized = useRef(false);

  // Asset size (default to 48x48 if not specified)
  const width = asset.width || 48;
  const height = asset.height || 48;

  // Store latest values in refs for use in global handlers
  const assetRef = useRef(asset);
  const widthRef = useRef(width);
  const heightRef = useRef(height);
  const resizeDirRef = useRef(resizeDir);
  const resizingRef = useRef(resizing);

  useEffect(() => { assetRef.current = asset; }, [asset]);
  useEffect(() => { widthRef.current = width; }, [width]);
  useEffect(() => { heightRef.current = height; }, [height]);
  useEffect(() => { resizeDirRef.current = resizeDir; }, [resizeDir]);
  useEffect(() => { resizingRef.current = resizing; }, [resizing]);

  // Handler for drag end
  const handleDragEnd = (e) => {
    setDragging(false);
    if (onDragEnd) onDragEnd();
    if (e && e.evt) {
      e.evt.preventDefault && e.evt.preventDefault();
      e.cancelBubble = true;
    }
  };

  // Handler for drag handle mouse/touch down
  const handleDragHandleDown = (e) => {
    e.cancelBubble = true;
    setDragging(true);
    if (onDragStart) onDragStart();
  };

  // Start resizing from a given corner
  const handleResizeStart = (dir, e) => {
    e.cancelBubble = true;
    setResizing(true);
    setResizeDir(dir);
    if (e && e.evt) e.evt.preventDefault && e.evt.preventDefault();
    
    // Add global listeners
    window.addEventListener('mousemove', handleResizeMoveGlobal);
    window.addEventListener('touchmove', handleResizeMoveGlobal, { passive: false });
    window.addEventListener('mouseup', handleResizeEndGlobal);
    window.addEventListener('touchend', handleResizeEndGlobal);
  };

  // Global move handler
  const handleResizeMoveGlobal = useCallback((event) => {
    wasDraggedOrResized.current = true;
    if (!resizingRef.current || !resizeDirRef.current) return;
    
    const stage = groupRef.current.getStage();
    const pointer = stage.getPointerPosition();
    
    let newWidth = widthRef.current;
    let newHeight = heightRef.current;
    let newX = assetRef.current.x;
    let newY = assetRef.current.y;
    
    if (resizeDirRef.current === 'se') {
      newWidth = Math.max(MIN_SIZE, pointer.x - assetRef.current.x);
      newHeight = Math.max(MIN_SIZE, pointer.y - assetRef.current.y);
    } else if (resizeDirRef.current === 'ne') {
      newWidth = Math.max(MIN_SIZE, pointer.x - assetRef.current.x);
      newHeight = Math.max(MIN_SIZE, assetRef.current.y + heightRef.current - pointer.y);
      newY = pointer.y;
    } else if (resizeDirRef.current === 'sw') {
      newWidth = Math.max(MIN_SIZE, assetRef.current.x + widthRef.current - pointer.x);
      newHeight = Math.max(MIN_SIZE, pointer.y - assetRef.current.y);
      newX = pointer.x;
    } else if (resizeDirRef.current === 'nw') {
      newWidth = Math.max(MIN_SIZE, assetRef.current.x + widthRef.current - pointer.x);
      newHeight = Math.max(MIN_SIZE, assetRef.current.y + heightRef.current - pointer.y);
      newX = pointer.x;
      newY = pointer.y;
    }
    
    if (onResize) {
      onResize({ ...assetRef.current, x: newX, y: newY, width: newWidth, height: newHeight });
    }
  }, [onResize]);

  // Global end handler
  const handleResizeEndGlobal = useCallback(() => {
    setResizing(false);
    setResizeDir(null);
    window.removeEventListener('mousemove', handleResizeMoveGlobal);
    window.removeEventListener('touchmove', handleResizeMoveGlobal);
    window.removeEventListener('mouseup', handleResizeEndGlobal);
    window.removeEventListener('touchend', handleResizeEndGlobal);
  }, [handleResizeMoveGlobal]);

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleResizeMoveGlobal);
      window.removeEventListener('touchmove', handleResizeMoveGlobal);
      window.removeEventListener('mouseup', handleResizeEndGlobal);
      window.removeEventListener('touchend', handleResizeEndGlobal);
    };
  }, [handleResizeMoveGlobal, handleResizeEndGlobal]);

  // Improved button positioning for mobile
  const buttonSize = isMobile() ? 40 : 32;
  const buttonOffset = isMobile() ? 20 : 16;
  
  // Menu button positions - spread them out more on mobile
  const editBtn = { x: width + buttonOffset, y: -buttonOffset };
  const deleteBtn = { x: -buttonOffset - buttonSize, y: -buttonOffset };
  const moveBtn = { x: width / 2 - buttonSize / 2, y: height + buttonOffset };
  const dragBtn = { x: -buttonOffset - buttonSize, y: height + buttonOffset };

  // Render the asset icon (emoji or image)
  const renderIcon = () => {
    if (asset.icon && asset.icon.startsWith('http')) {
      return <KonvaImage image={asset._imgObj} x={0} y={0} width={width} height={height} />;
    }
    return (
      <Text 
        text={asset.icon} 
        fontSize={width * 0.7} 
        x={0} 
        y={0} 
        width={width} 
        height={height} 
        align="center" 
        verticalAlign="middle" 
      />
    );
  };

  // Define the four resize handles (corners) - only show on desktop or when not mobile
  const handles = !isMobile() ? [
    { dir: 'nw', x: 0, y: 0 },
    { dir: 'ne', x: width, y: 0 },
    { dir: 'sw', x: 0, y: height },
    { dir: 'se', x: width, y: height },
  ] : [];

  // Selection handler with improved mobile support
  const handleSelect = (e) => {
    if (dragging || resizing) return;
    e.cancelBubble = true;
    if (onSelect) onSelect(e);
  };

  // Touch handling for mobile
  const handleTouchStart = (e) => {
    setTouchStartTime(Date.now());
    wasDraggedOrResized.current = false;
    e.cancelBubble = true;
  };

  const handleTouchEnd = (e) => {
    const touchDuration = Date.now() - touchStartTime;
    
    // Only select if it was a quick tap (not a drag) and we haven't moved
    if (!wasDraggedOrResized.current && touchDuration < 300 && !dragging && !resizing) {
      if (onSelect) onSelect(e);
    }
    e.cancelBubble = true;
  };

  // Drag move handler
  const handleDragMove = (e) => {
    wasDraggedOrResized.current = true;
    if (onDrag) {
      const { x, y } = e.target.position();
      onDrag({ ...asset, x, y });
    }
  };

  // Button click handlers with improved mobile support
  const handleEditClick = (e) => {
    e.cancelBubble = true;
    if (onEdit) onEdit();
  };

  const handleDeleteClick = (e) => {
    e.cancelBubble = true;
    if (onDelete) onDelete();
  };

  const handleMoveClick = (e) => {
    e.cancelBubble = true;
    if (onMove) onMove();
  };

  return (
    <Group
      ref={groupRef}
      x={asset.x - width / 2}
      y={asset.y - height / 2}
      draggable={dragging}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleSelect}
      onTap={handleSelect}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Show selection indicator if selected */}
      {selected && (
        <>
          {/* Selection border */}
          <Rect
            x={-4}
            y={-4}
            width={width + 8}
            height={height + 8}
            stroke="#3b82f6"
            strokeWidth={3}
            cornerRadius={12}
            dash={[8, 4]}
          />
          
          {/* Selection highlight for mobile */}
          {isMobile() && (
            <Circle
              x={width / 2}
              y={height / 2}
              radius={Math.max(width, height) / 2 + 8}
              stroke="#3b82f6"
              strokeWidth={2}
              dash={[5, 5]}
              opacity={0.3}
            />
          )}
        </>
      )}

      {/* Asset background for better visibility on mobile */}
      {isMobile() && (
        <Rect
          x={-2}
          y={-2}
          width={width + 4}
          height={height + 4}
          fill="rgba(255, 255, 255, 0.8)"
          cornerRadius={8}
          shadowColor="rgba(0, 0, 0, 0.3)"
          shadowBlur={4}
          shadowOffsetX={2}
          shadowOffsetY={2}
        />
      )}

      {/* Render the asset icon/image */}
      {renderIcon()}

      {/* Show label below icon if present */}
      {asset.label && (
        <Text
          text={asset.label}
          y={height + 4}
          width={width}
          align="center"
          fontSize={isMobile() ? 14 : 16}
          fill="#fff"
          fontStyle="bold"
          shadowColor="#232946"
          shadowBlur={3}
        />
      )}

      {/* Control buttons - only show when selected */}
      {selected && (
        <>
          {/* Edit button */}
          <Group x={editBtn.x} y={editBtn.y}>
            <Circle
              x={buttonSize / 2}
              y={buttonSize / 2}
              radius={buttonSize / 2}
              fill="#4ade80"
              stroke="#16a34a"
              strokeWidth={2}
              shadowBlur={4}
              shadowColor="rgba(0, 0, 0, 0.3)"
              onClick={handleEditClick}
              onTap={handleEditClick}
            />
            <Text 
              text="✏️" 
              x={0} 
              y={0} 
              width={buttonSize} 
              height={buttonSize} 
              align="center" 
              verticalAlign="middle" 
              fontSize={isMobile() ? 18 : 16}
              onClick={handleEditClick}
              onTap={handleEditClick}
            />
          </Group>

          {/* Delete button */}
          <Group x={deleteBtn.x} y={deleteBtn.y}>
            <Circle
              x={buttonSize / 2}
              y={buttonSize / 2}
              radius={buttonSize / 2}
              fill="#f87171"
              stroke="#dc2626"
              strokeWidth={2}
              shadowBlur={4}
              shadowColor="rgba(0, 0, 0, 0.3)"
              onClick={handleDeleteClick}
              onTap={handleDeleteClick}
            />
            <Text 
              text="🗑️" 
              x={0} 
              y={0} 
              width={buttonSize} 
              height={buttonSize} 
              align="center" 
              verticalAlign="middle" 
              fontSize={isMobile() ? 18 : 16}
              onClick={handleDeleteClick}
              onTap={handleDeleteClick}
            />
          </Group>

          {/* Move button */}
          <Group x={moveBtn.x} y={moveBtn.y}>
            <Circle
              x={buttonSize / 2}
              y={buttonSize / 2}
              radius={buttonSize / 2}
              fill="#fbbf24"
              stroke="#d97706"
              strokeWidth={2}
              shadowBlur={4}
              shadowColor="rgba(0, 0, 0, 0.3)"
              onClick={handleMoveClick}
              onTap={handleMoveClick}
            />
            <Text 
              text="📍" 
              x={0} 
              y={0} 
              width={buttonSize} 
              height={buttonSize} 
              align="center" 
              verticalAlign="middle" 
              fontSize={isMobile() ? 18 : 16}
              onClick={handleMoveClick}
              onTap={handleMoveClick}
            />
          </Group>

          {/* Drag handle (desktop only) */}
          {!isMobile() && (
            <Group x={dragBtn.x} y={dragBtn.y}>
              <Circle
                x={buttonSize / 2}
                y={buttonSize / 2}
                radius={buttonSize / 2}
                fill="#94a3b8"
                stroke="#475569"
                strokeWidth={2}
                shadowBlur={4}
                shadowColor="rgba(0, 0, 0, 0.3)"
                onMouseDown={handleDragHandleDown}
                onTouchStart={handleDragHandleDown}
              />
              <Text 
                text="⠿" 
                x={0} 
                y={0} 
                width={buttonSize} 
                height={buttonSize} 
                align="center" 
                verticalAlign="middle" 
                fontSize={16}
                onMouseDown={handleDragHandleDown}
                onTouchStart={handleDragHandleDown}
              />
            </Group>
          )}
        </>
      )}

      {/* Render resize handles at corners (desktop only) */}
      {selected && handles.map(h => (
        <Rect
          key={h.dir}
          x={h.x - HANDLE_SIZE / 2}
          y={h.y - HANDLE_SIZE / 2}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
          fill="#fff"
          stroke="#3b82f6"
          strokeWidth={2}
          cornerRadius={9}
          draggable={false}
          onMouseDown={e => handleResizeStart(h.dir, e)}
          onTouchStart={e => handleResizeStart(h.dir, e)}
        />
      ))}
    </Group>
  );
};

PlacedAsset.propTypes = {
  asset: PropTypes.shape({
    icon: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    label: PropTypes.string,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    width: PropTypes.number,
    height: PropTypes.number,
    _imgObj: PropTypes.object, // for image icons
  }).isRequired,
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onMove: PropTypes.func, // new prop for move functionality
  onDrag: PropTypes.func,
  onResize: PropTypes.func,
  stageScale: PropTypes.number,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
};

export default PlacedAsset;