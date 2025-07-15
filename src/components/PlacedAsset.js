// PlacedAsset.js
// This component renders a draggable, resizable, and selectable asset (icon or image) on a Konva canvas.
// It supports selection, editing, deletion, and resizing via handles, and displays a menu when selected.
// Props:
//   asset: {icon, name, label, x, y, width, height, _imgObj} - the asset to render
//   selected: boolean - whether this asset is currently selected
//   onSelect: function - called when asset is selected
//   onEdit: function - called when edit button is clicked
//   onDelete: function - called when delete button is clicked
//   onDrag: function - called when asset is dragged
//   onResize: function - called when asset is resized
//   stageScale: number - current canvas scale (for future use)
//
import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Group, Rect, Text, Image as KonvaImage } from 'react-konva';

/**
 * PlacedAsset renders a draggable, resizable, selectable asset on the canvas.
 * - Shows border and menu (edit, delete, drag handle) when selected.
 * - Resize handles at corners.
 * - Works with mouse and touch.
 * - Props: asset (icon, name, label, x, y, width, height), selected, onSelect, onEdit, onDelete, onDrag, onResize.
 */
const HANDLE_SIZE = 18; // Size of the resize handles
const MIN_SIZE = 32;    // Minimum width/height for resizing

const PlacedAsset = ({
  asset,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onDrag,
  onResize,
  stageScale = 1,
  onDragStart, // new prop
  onDragEnd,   // new prop
}) => {
  const groupRef = useRef();
  const [dragging, setDragging] = useState(false); // Track if asset is being dragged
  const [resizing, setResizing] = useState(false); // Track if asset is being resized
  const [resizeDir, setResizeDir] = useState(null); // Which corner is being resized

  // Asset size (default to 48x48 if not specified)
  const width = asset.width || 48;
  const height = asset.height || 48;

  // Handler for drag end: update asset position and stop dragging
  const handleDragMove = (e) => {
    if (onDrag) {
      const { x, y } = e.target.position();
      onDrag({ ...asset, x, y });
    }
  };
  const handleDragEnd = (e) => {
    setDragging(false);
    if (onDragEnd) onDragEnd();
    if (e && e.evt) {
      e.evt.preventDefault && e.evt.preventDefault();
      e.cancelBubble = true;
    }
  };
  // Handler for drag handle mouse/touch down: start dragging
  const handleDragHandleDown = (e) => {
    e.cancelBubble = true; // Prevent event from bubbling to parent
    setDragging(true);
    if (onDragStart) onDragStart();
  };

  // Handlers for resizing logic
  // Start resizing from a given corner
  const handleResizeStart = (dir) => {
    setResizing(true);
    setResizeDir(dir);
  };
  // While resizing, update width/height and position
  const handleResizeMove = (e) => {
    if (!resizing || !resizeDir) return;
    const pointer = e.target.getStage().getPointerPosition();
    let newWidth = width;
    let newHeight = height;
    let newX = asset.x;
    let newY = asset.y;
    if (resizeDir === 'se') {
      newWidth = Math.max(MIN_SIZE, pointer.x - asset.x);
      newHeight = Math.max(MIN_SIZE, pointer.y - asset.y);
    } else if (resizeDir === 'ne') {
      newWidth = Math.max(MIN_SIZE, pointer.x - asset.x);
      newHeight = Math.max(MIN_SIZE, asset.y + height - pointer.y);
      newY = pointer.y;
    } else if (resizeDir === 'sw') {
      newWidth = Math.max(MIN_SIZE, asset.x + width - pointer.x);
      newHeight = Math.max(MIN_SIZE, pointer.y - asset.y);
      newX = pointer.x;
    } else if (resizeDir === 'nw') {
      newWidth = Math.max(MIN_SIZE, asset.x + width - pointer.x);
      newHeight = Math.max(MIN_SIZE, asset.y + height - pointer.y);
      newX = pointer.x;
      newY = pointer.y;
    }
    if (onResize) {
      onResize({ ...asset, x: newX, y: newY, width: newWidth, height: newHeight });
    }
  };
  // End resizing
  const handleResizeEnd = () => {
    setResizing(false);
    setResizeDir(null);
  };

  // Menu button positions (distribute around asset)
  // Edit: top-right, Delete: top-left, Drag: bottom-center
  const editBtn = { x: width - 16, y: -40 };
  const deleteBtn = { x: -16, y: -40 };
  const dragBtn = { x: width / 2 - 16, y: height + 12 };

  // Render the asset icon (emoji or image)
  const renderIcon = () => {
    if (asset.icon && asset.icon.startsWith('http')) {
      // Render image icon
      return <KonvaImage image={asset._imgObj} x={0} y={0} width={width} height={height} />;
    }
    // Render emoji/icon as text
    return <Text text={asset.icon} fontSize={width * 0.7} x={0} y={0} width={width} height={height} align="center" verticalAlign="middle" />;
  };

  // Define the four resize handles (corners)
  const handles = [
    { dir: 'nw', x: 0, y: 0 },
    { dir: 'ne', x: width, y: 0 },
    { dir: 'sw', x: 0, y: height },
    { dir: 'se', x: width, y: height },
  ];

  return (
    // Group wraps the asset and all controls, and is draggable only when dragging
    <Group
      ref={groupRef}
      x={asset.x}
      y={asset.y}
      draggable={dragging}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={onSelect}
      onTap={onSelect}
      onTouchStart={onSelect}
    >
      {/* Show border if selected */}
      {selected && (
        <Rect
          x={-4}
          y={-4}
          width={width + 8}
          height={height + 8}
          stroke="#3b82f6"
          strokeWidth={2}
          cornerRadius={12}
          dash={[8, 4]}
        />
      )}
      {/* Render the asset icon/image */}
      {renderIcon()}
      {/* Asset name below icon */}
      <Text text={asset.name} y={height + 4} width={width} align="center" fontSize={14} fill="#fff" />
      {/* Menu (edit, delete, drag handle) - only if selected, distributed around asset */}
      {selected && (
        <>
          {/* Edit button (top-right) */}
          <Group x={editBtn.x} y={editBtn.y}>
            <Rect x={0} y={0} width={32} height={32} fill="#fff" cornerRadius={16} shadowBlur={2} onClick={onEdit} onTap={onEdit} />
            <Text text="✏️" x={0} y={0} width={32} height={32} align="center" verticalAlign="middle" fontSize={18} onClick={onEdit} onTap={onEdit} />
          </Group>
          {/* Delete button (top-left) */}
          <Group x={deleteBtn.x} y={deleteBtn.y}>
            <Rect x={0} y={0} width={32} height={32} fill="#fff" cornerRadius={16} shadowBlur={2} onClick={onDelete} onTap={onDelete} />
            <Text text="🗑️" x={0} y={0} width={32} height={32} align="center" verticalAlign="middle" fontSize={18} onClick={onDelete} onTap={onDelete} />
          </Group>
          {/* Drag handle (bottom-center) */}
          <Group x={dragBtn.x} y={dragBtn.y}>
            <Rect x={0} y={0} width={32} height={32} fill="#fff" cornerRadius={16} shadowBlur={2}
              onMouseDown={handleDragHandleDown}
              onTouchStart={handleDragHandleDown}
            />
            <Text text="⠿" x={0} y={0} width={32} height={32} align="center" verticalAlign="middle" fontSize={18}
              onMouseDown={handleDragHandleDown}
              onTouchStart={handleDragHandleDown}
            />
          </Group>
        </>
      )}
      {/* Render resize handles at corners if selected */}
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
          onMouseDown={() => handleResizeStart(h.dir)}
          onTouchStart={() => handleResizeStart(h.dir)}
          onMouseMove={handleResizeMove}
          onTouchMove={handleResizeMove}
          onMouseUp={handleResizeEnd}
          onTouchEnd={handleResizeEnd}
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
  onDrag: PropTypes.func,
  onResize: PropTypes.func,
  stageScale: PropTypes.number,
  onDragStart: PropTypes.func, // new prop
  onDragEnd: PropTypes.func,   // new prop
};

export default PlacedAsset; // Export the component 