# Figma Spacing Grid - Chrome Extension

Visualize distances between elements on any webpage with dimension lines and arrows, like architectural drawings.

## Features

- **Independent Measurement Modes**:
  - Press `1` to toggle spacing between elements
  - Press `2` to toggle element dimensions (width/height)
  - Press `3` to toggle font information display
  - All modes can be active simultaneously
- **Smart Color Coding**:
  - **Blue**: Element dimensions (width/height) - always blue
  - **Green**: Spacing between elements divisible by 8
  - **Red**: Spacing NOT divisible by 8 (highlights spacing violations)
- **Dimension Lines**: Shows exact measurements with arrows at both ends
- **Clean Display**: All measurements shown as numbers (pixels)
- **Auto-Update on Scroll**: Measurements update automatically when scrolling or resizing (when visible)
- **Clean by Default**: No clutter - measurements hidden until you press 1, 2, or 3
- **Simple Toggle**: One-click ON/OFF via extension icon
- **Performance Optimized**: Smooth rendering even on complex pages (max: 50 element dimensions + 100 spacing measurements + 50 font info cards)

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `spacing-grid-extension` folder
5. The extension icon will appear in your toolbar

## Usage

1. Click the extension icon to activate/deactivate
2. Badge shows "ON" (green) or "OFF" (red)
3. When active, use keyboard shortcuts:
   - **Press `1`** to toggle spacing measurements (between elements)
   - **Press `2`** to toggle dimension measurements (width/height)
   - **Press `3`** to toggle font information (shows font family, size, weight, line-height, etc.)
   - **All modes can be active at the same time**
4. Color-coded measurements:
   - **Blue lines**: Element dimensions (width on top, height on left) - always blue
   - **Green lines**: Spacing between elements that follows 8px grid (divisible by 8)
   - **Red lines**: Spacing that violates 8px grid (NOT divisible by 8)
   - Updates automatically when you scroll or resize
5. Press the same key again to hide that mode's measurements
6. Click the extension icon again to fully deactivate

## How It Works

The extension:
- Creates an SVG overlay on top of the page (initially empty)
- Waits for you to press `1` (spacing), `2` (dimensions), and/or `3` (font info)
- **Press `1` - Spacing Mode**:
  - Scans all visible elements in the viewport
  - For adjacent sibling elements, calculates distances between element bounding boxes
  - Draws spacing dimension lines
  - Color: Green if divisible by 8, Red if not (8px grid validation)
- **Press `2` - Dimensions Mode**:
  - Scans all visible elements in the viewport (width/height > 50px)
  - Draws blue dimension lines showing width (top) and height (left)
  - Always blue, regardless of value
- **Press `3` - Font Info Mode**:
  - Scans all text elements in the viewport
  - Displays compact information cards showing:
    - Font family (truncated if long)
    - Font size (px) and weight
    - Line height and letter spacing
    - Color (with visual indicator)
  - Smart positioning: tries multiple positions (right, left, below) to avoid overlaps
  - Skips cards that would overlap with existing ones
- **All modes can be active simultaneously** - press any combination to see different measurements
- All dimension lines have arrows at both ends like technical drawings
- Shows exact pixel measurements in real-time
- Red color highlights spacing that doesn't follow 8px grid system
- Automatically updates positions on scroll and resize events (when measurements are visible)
- Uses `requestAnimationFrame` for smooth 60fps updates
- Optimized for performance (limits: 50 element dimensions + 100 spacing measurements + 50 font info cards)
- Press the same key again to hide that mode's measurements

## Files Structure

```
spacing-grid-extension/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker with badge toggle
├── contentScript.js       # Main spacing detection logic
├── spacing-grid.css       # Styling for spacing grid
└── README.md              # This file
```

## Notes

- The extension works on all websites (`<all_urls>` permission)
- Spacing values are calculated from computed styles in real-time
- The grid updates automatically when new elements are added to the page
- Simple ON/OFF toggle via extension icon click
- Badge shows current state: "ON" (green) or "OFF" (red)
- Use `1` for spacing measurements, `2` for dimension measurements, `3` for font information
- All modes work independently and can be active at the same time

## Version

v1.0.0 - Initial release
