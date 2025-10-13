// Figma Spacing Grid - Content Script
// Visualizes spacing between elements with dimension lines

let spacingGridActive = false;
let svgOverlay = null;
let fontInfoContainer = null;
let gridOverlay = null;
let colorInfoContainer = null;
let effectsInfoContainer = null;
let isDrawing = false;
let scrollTimeout = null;
let showSpacing = false;
let showDimensions = false;
let showFontInfo = false;
let showGrid = false;
let showColors = false;
let showEffects = false;

// Initialize extension
chrome.storage.local.get('isActive', (data) => {
  spacingGridActive = data.isActive || false;

  if (spacingGridActive) {
    initSpacingGrid();
  }
});

// Listen for messages from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle') {
    spacingGridActive = request.isActive;

    if (spacingGridActive) {
      initSpacingGrid();
    } else {
      removeSpacingGrid();
    }

    sendResponse({ success: true });
  }

  return true;
});

function initSpacingGrid() {
  // Create SVG overlay
  createSVGOverlay();

  // Create font info container
  createFontInfoContainer();

  // Create grid overlay
  createGridOverlay();

  // Create color info container
  createColorInfoContainer();

  // Create effects info container
  createEffectsInfoContainer();

  // Add keyboard listener for toggle
  document.addEventListener('keydown', handleKeyDown, true);

  // Add scroll listener to update positions
  window.addEventListener('scroll', handleScroll, true);
  window.addEventListener('resize', handleScroll, true);

  console.log('Pixel Perfect: Initialized (1:dimensions 2:spacing 3:fonts 4:grid 5:colors 6:effects)');
}

function handleScroll() {
  if (!spacingGridActive || (!showSpacing && !showDimensions && !showFontInfo && !showColors && !showEffects) || isDrawing) return;

  // Clear previous timeout
  if (scrollTimeout) {
    cancelAnimationFrame(scrollTimeout);
  }

  // Use requestAnimationFrame for smooth updates
  scrollTimeout = requestAnimationFrame(() => {
    if (spacingGridActive && (showSpacing || showDimensions || showFontInfo || showColors || showEffects) && !isDrawing) {
      drawAllMeasurements();
    }
  });
}

function handleKeyDown(event) {
  if (!spacingGridActive) return;

  // Don't trigger in input fields
  if (event.target.matches('input, textarea, [contenteditable="true"]')) return;

  // Press 1 to toggle dimensions
  if (event.key === '1') {
    event.preventDefault();
    showDimensions = !showDimensions;

    if (showSpacing || showDimensions || showFontInfo || showColors || showEffects) {
      drawAllMeasurements();
    } else {
      clearMeasurements();
    }

    showToggleIndicator(showDimensions ? 'Dimensions ON' : 'Dimensions OFF');
  }

  // Press 2 to toggle spacing
  if (event.key === '2') {
    event.preventDefault();
    showSpacing = !showSpacing;

    if (showSpacing || showDimensions || showFontInfo || showColors || showEffects) {
      drawAllMeasurements();
    } else {
      clearMeasurements();
    }

    showToggleIndicator(showSpacing ? 'Spacing ON' : 'Spacing OFF');
  }

  // Press 3 to toggle font info
  if (event.key === '3') {
    event.preventDefault();
    showFontInfo = !showFontInfo;

    if (showSpacing || showDimensions || showFontInfo || showColors || showEffects) {
      drawAllMeasurements();
    } else {
      clearMeasurements();
    }

    showToggleIndicator(showFontInfo ? 'Font Info ON' : 'Font Info OFF');
  }

  // Press 4 to toggle grid
  if (event.key === '4') {
    event.preventDefault();
    showGrid = !showGrid;

    if (showGrid) {
      drawGrid();
    } else {
      clearGrid();
    }

    showToggleIndicator(showGrid ? 'Grid ON' : 'Grid OFF');
  }

  // Press 5 to toggle colors
  if (event.key === '5') {
    event.preventDefault();
    showColors = !showColors;

    if (showSpacing || showDimensions || showFontInfo || showColors || showEffects) {
      drawAllMeasurements();
    } else {
      clearMeasurements();
    }

    showToggleIndicator(showColors ? 'Colors ON' : 'Colors OFF');
  }

  // Press 6 to toggle effects
  if (event.key === '6') {
    event.preventDefault();
    showEffects = !showEffects;

    if (showSpacing || showDimensions || showFontInfo || showColors || showEffects) {
      drawAllMeasurements();
    } else {
      clearMeasurements();
    }

    showToggleIndicator(showEffects ? 'Effects ON' : 'Effects OFF');
  }
}

function showToggleIndicator(message) {
  // Remove existing indicator
  const existing = document.getElementById('spacing-toggle-indicator');
  if (existing) existing.remove();

  // Create indicator
  const indicator = document.createElement('div');
  indicator.id = 'spacing-toggle-indicator';
  indicator.textContent = message;
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: Monaco, monospace;
    font-size: 14px;
    font-weight: bold;
    z-index: 2147483646;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;

  document.body.appendChild(indicator);

  // Auto remove after 1.5 seconds
  setTimeout(() => {
    indicator.remove();
  }, 1500);
}

function showHint(message) {
  // Remove existing hint
  const existing = document.getElementById('spacing-hint');
  if (existing) existing.remove();

  // Create hint
  const hint = document.createElement('div');
  hint.id = 'spacing-hint';
  hint.textContent = message;
  hint.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(59, 130, 246, 0.95);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: Monaco, monospace;
    font-size: 14px;
    font-weight: bold;
    z-index: 2147483646;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;

  document.body.appendChild(hint);

  // Auto remove after 3 seconds
  setTimeout(() => {
    hint.remove();
  }, 3000);
}

function createSVGOverlay() {
  if (svgOverlay) return;

  svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgOverlay.id = 'spacing-grid-overlay';
  svgOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483647;
  `;

  document.body.appendChild(svgOverlay);
}

function createFontInfoContainer() {
  if (fontInfoContainer) return;

  fontInfoContainer = document.createElement('div');
  fontInfoContainer.id = 'font-info-container';
  fontInfoContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483646;
  `;

  document.body.appendChild(fontInfoContainer);
}

function createGridOverlay() {
  if (gridOverlay) return;

  gridOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  gridOverlay.id = 'grid-overlay';
  gridOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483645;
  `;

  document.body.appendChild(gridOverlay);
}

function createColorInfoContainer() {
  if (colorInfoContainer) return;

  colorInfoContainer = document.createElement('div');
  colorInfoContainer.id = 'color-info-container';
  colorInfoContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483646;
  `;

  document.body.appendChild(colorInfoContainer);
}

function createEffectsInfoContainer() {
  if (effectsInfoContainer) return;

  effectsInfoContainer = document.createElement('div');
  effectsInfoContainer.id = 'effects-info-container';
  effectsInfoContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483646;
  `;

  document.body.appendChild(effectsInfoContainer);
}

function drawAllMeasurements() {
  if (!svgOverlay || isDrawing) return;

  isDrawing = true;

  try {
    svgOverlay.innerHTML = '';

    let svgContent = '';
    let measurementCount = 0;
    const maxMeasurements = 100; // Limit total measurements
    const maxDimensions = 100; // Limit element dimensions (increased from 50)

    // Find all visible containers with multiple children
    const allElements = document.querySelectorAll('body *');
    const processedPairs = new Set();
    const processedDimensions = new Set();

    for (const element of allElements) {
      if (measurementCount >= maxMeasurements) break;

      // Skip invisible or excluded elements (removed SVG from exclusion list)
      if (element.offsetWidth === 0 ||
          element.offsetHeight === 0 ||
          ['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK', 'TITLE'].includes(element.tagName)) {
        continue;
      }

      const rect = element.getBoundingClientRect();

      // Skip elements outside viewport
      if (rect.bottom < 0 || rect.top > window.innerHeight ||
          rect.right < 0 || rect.left > window.innerWidth) {
        continue;
      }

      // Draw element dimensions (width and height) for some elements
      if (showDimensions && processedDimensions.size < maxDimensions) {
        const dimKey = `${rect.left}-${rect.top}-${rect.width}-${rect.height}`;
        // Lowered minimum size from 50x50 to 20x20 to catch more elements like <p>, <span>, etc.
        if (!processedDimensions.has(dimKey) && rect.width > 20 && rect.height > 20) {
          svgContent += getElementDimensionsHTML(rect);
          processedDimensions.add(dimKey);
        }
      }

      // Find next sibling
      if (showSpacing) {
        let nextSibling = element.nextElementSibling;
        while (nextSibling) {
          if (nextSibling.offsetWidth > 0 &&
              nextSibling.offsetHeight > 0 &&
              !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(nextSibling.tagName)) {

            const pairKey = `${element.tagName}-${nextSibling.tagName}-${rect.left}-${rect.top}`;

            if (!processedPairs.has(pairKey)) {
              const siblingRect = nextSibling.getBoundingClientRect();
              svgContent += getDistanceLinesHTML(rect, siblingRect);
              processedPairs.add(pairKey);
              measurementCount++;
              break;
            }
          }
          nextSibling = nextSibling.nextElementSibling;
        }
      }
    }

    svgOverlay.innerHTML = svgContent;
    console.log(`Drew ${measurementCount} measurements and ${processedDimensions.size} dimensions`);

    // Draw font info if enabled
    if (showFontInfo) {
      drawFontInfo();
    } else {
      if (fontInfoContainer) fontInfoContainer.innerHTML = '';
    }

    // Draw colors if enabled
    if (showColors) {
      drawColors();
    } else {
      if (colorInfoContainer) colorInfoContainer.innerHTML = '';
    }

    // Draw effects if enabled
    if (showEffects) {
      drawEffects();
    } else {
      if (effectsInfoContainer) effectsInfoContainer.innerHTML = '';
    }

  } finally {
    isDrawing = false;
  }
}

function getColorForSpacing(value) {
  // Red if not divisible by 8, green otherwise
  return value % 8 !== 0 ? '#ef4444' : '#10b981';
}

function getElementDimensionsHTML(rect) {
  let html = '';

  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  const dimensionColor = '#3b82f6'; // Always blue for dimensions

  // Draw width dimension (top of element)
  const widthY = rect.top - 20;
  const widthX1 = rect.left;
  const widthX2 = rect.right;
  const widthMid = (widthX1 + widthX2) / 2;

  // Width line
  html += `<line x1="${widthX1}" y1="${widthY}" x2="${widthX2}" y2="${widthY}" stroke="${dimensionColor}" stroke-width="2"/>`;

  // Width arrows
  html += getArrowHTML(widthX1, widthY, 'right', dimensionColor);
  html += getArrowHTML(widthX2, widthY, 'left', dimensionColor);

  // Width text
  html += getTextHTML(widthMid, widthY, width, dimensionColor);

  // Draw height dimension (left of element)
  const heightX = rect.left - 20;
  const heightY1 = rect.top;
  const heightY2 = rect.bottom;
  const heightMid = (heightY1 + heightY2) / 2;

  // Height line
  html += `<line x1="${heightX}" y1="${heightY1}" x2="${heightX}" y2="${heightY2}" stroke="${dimensionColor}" stroke-width="2"/>`;

  // Height arrows
  html += getArrowHTML(heightX, heightY1, 'down', dimensionColor);
  html += getArrowHTML(heightX, heightY2, 'up', dimensionColor);

  // Height text
  html += getTextHTML(heightX, heightMid, height, dimensionColor);

  return `<g class="element-dimensions">${html}</g>`;
}

function getDistanceLinesHTML(rect1, rect2) {
  let html = '';

  // Check horizontal distance
  const horizontalGap = getHorizontalGap(rect1, rect2);
  if (horizontalGap !== null && horizontalGap >= 0) {
    html += getDimensionLineHTML(horizontalGap, 'horizontal', rect1, rect2);
  }

  // Check vertical distance
  const verticalGap = getVerticalGap(rect1, rect2);
  if (verticalGap !== null && verticalGap >= 0) {
    html += getDimensionLineHTML(verticalGap, 'vertical', rect1, rect2);
  }

  return html;
}


function getHorizontalGap(rect1, rect2) {
  // Check if elements overlap vertically
  const overlapVertically = !(rect1.bottom < rect2.top || rect1.top > rect2.bottom);

  if (!overlapVertically) return null;

  // Element 2 is to the right of element 1
  if (rect2.left >= rect1.right) {
    return rect2.left - rect1.right;
  }

  // Element 2 is to the left of element 1
  if (rect2.right <= rect1.left) {
    return rect1.left - rect2.right;
  }

  return null;
}

function getVerticalGap(rect1, rect2) {
  // Check if elements overlap horizontally
  const overlapHorizontally = !(rect1.right < rect2.left || rect1.left > rect2.right);

  if (!overlapHorizontally) return null;

  // Element 2 is below element 1
  if (rect2.top >= rect1.bottom) {
    return rect2.top - rect1.bottom;
  }

  // Element 2 is above element 1
  if (rect2.bottom <= rect1.top) {
    return rect1.top - rect2.bottom;
  }

  return null;
}

function getDimensionLineHTML(distance, orientation, rect1, rect2) {
  let x1, y1, x2, y2, textX, textY;
  const roundedDistance = Math.round(distance);
  const color = getColorForSpacing(roundedDistance); // Green if divisible by 8, red otherwise

  if (orientation === 'horizontal') {
    // Horizontal measurement line
    const yPos = Math.max(rect1.top, rect2.top) + Math.min(rect1.height, rect2.height) / 2;

    if (rect2.left > rect1.right) {
      x1 = rect1.right;
      x2 = rect2.left;
    } else {
      x1 = rect2.right;
      x2 = rect1.left;
    }

    y1 = y2 = yPos;
    textX = (x1 + x2) / 2;
    textY = yPos;

    const arrows = getArrowHTML(x1, y1, 'left', color) + getArrowHTML(x2, y2, 'right', color);
    const line = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2"/>`;
    const text = getTextHTML(textX, textY, roundedDistance, color);

    return `<g class="spacing-dimension">${line}${arrows}${text}</g>`;

  } else {
    // Vertical measurement line
    const xPos = Math.max(rect1.left, rect2.left) + Math.min(rect1.width, rect2.width) / 2;

    if (rect2.top > rect1.bottom) {
      y1 = rect1.bottom;
      y2 = rect2.top;
    } else {
      y1 = rect2.bottom;
      y2 = rect1.top;
    }

    x1 = x2 = xPos;
    textX = xPos;
    textY = (y1 + y2) / 2;

    const arrows = getArrowHTML(x1, y1, 'up', color) + getArrowHTML(x2, y2, 'down', color);
    const line = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2"/>`;
    const text = getTextHTML(textX, textY, roundedDistance, color);

    return `<g class="spacing-dimension">${line}${arrows}${text}</g>`;
  }
}

function getArrowHTML(x, y, direction, color = '#ef4444') {
  const arrowSize = 6;
  let points;

  switch(direction) {
    case 'left':
      points = `${x},${y} ${x+arrowSize},${y-arrowSize} ${x+arrowSize},${y+arrowSize}`;
      break;
    case 'right':
      points = `${x},${y} ${x-arrowSize},${y-arrowSize} ${x-arrowSize},${y+arrowSize}`;
      break;
    case 'up':
      points = `${x},${y} ${x-arrowSize},${y+arrowSize} ${x+arrowSize},${y+arrowSize}`;
      break;
    case 'down':
      points = `${x},${y} ${x-arrowSize},${y-arrowSize} ${x+arrowSize},${y-arrowSize}`;
      break;
  }

  return `<polygon points="${points}" fill="${color}"/>`;
}

function getTextHTML(x, y, distance, color = '#ef4444') {
  const text = `${distance}`;
  const textWidth = text.length * 7;
  const bgX = x - (textWidth / 2);
  const bgY = y - 8;

  return `
    <rect x="${bgX}" y="${bgY}" width="${textWidth}" height="16" fill="rgba(255, 255, 255, 0.95)" rx="3"/>
    <text x="${x}" y="${y + 4}" fill="${color}" font-size="12" font-weight="bold" font-family="Monaco, monospace" text-anchor="middle">${text}</text>
  `;
}

function drawFontInfo() {
  if (!fontInfoContainer) return;

  // Clear previous font info
  fontInfoContainer.innerHTML = '';

  const allElements = document.querySelectorAll('body *');
  const processedElements = new Set();
  const maxFontInfo = 50; // Limit number of font info cards
  let fontInfoCount = 0;
  const cardPositions = []; // Track card positions to avoid overlaps

  for (const element of allElements) {
    if (fontInfoCount >= maxFontInfo) break;

    // Skip non-text or invisible elements
    if (element.offsetWidth === 0 ||
        element.offsetHeight === 0 ||
        ['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK', 'TITLE', 'SVG', 'PATH', 'G'].includes(element.tagName)) {
      continue;
    }

    // Check if element has text content (not just children)
    const hasDirectText = Array.from(element.childNodes).some(node =>
      node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
    );

    if (!hasDirectText) continue;

    const rect = element.getBoundingClientRect();

    // Skip elements outside viewport
    if (rect.bottom < 0 || rect.top > window.innerHeight ||
        rect.right < 0 || rect.left > window.innerWidth) {
      continue;
    }

    // Skip very small elements
    if (rect.width < 20 || rect.height < 10) continue;

    const posKey = `${Math.round(rect.left)}-${Math.round(rect.top)}`;
    if (processedElements.has(posKey)) continue;

    const fontInfo = getFontInfo(element);
    const cardData = createFontInfoCard(rect, fontInfo, cardPositions);

    if (cardData) {
      fontInfoContainer.appendChild(cardData.element);
      cardPositions.push(cardData.bounds);
      processedElements.add(posKey);
      fontInfoCount++;
    }
  }

  console.log(`Drew ${fontInfoCount} font info cards`);
}

function getFontInfo(element) {
  const styles = window.getComputedStyle(element);

  return {
    fontFamily: styles.fontFamily,
    fontSize: styles.fontSize,
    fontWeight: styles.fontWeight,
    lineHeight: styles.lineHeight,
    color: styles.color,
    letterSpacing: styles.letterSpacing
  };
}

function createFontInfoCard(rect, fontInfo, existingCards) {
  const card = document.createElement('div');

  const fontSize = parseFloat(fontInfo.fontSize);
  const lineHeight = fontInfo.lineHeight === 'normal' ? 'normal' : parseFloat(fontInfo.lineHeight);
  const lineHeightDisplay = lineHeight === 'normal' ? 'normal' : Math.round(lineHeight);
  const letterSpacing = fontInfo.letterSpacing === 'normal' ? '0' : fontInfo.letterSpacing;

  // Compact font family name
  const fontFamily = fontInfo.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
  const shortFontFamily = fontFamily.length > 18 ? fontFamily.substring(0, 18) + '...' : fontFamily;

  // Estimate card dimensions (compact)
  const cardWidth = 160;
  const cardHeight = 85;

  // Try positions: right, left, below, above
  let cardX = rect.right + 10;
  let cardY = rect.top;

  const positions = [
    { x: rect.right + 10, y: rect.top }, // right
    { x: rect.left - cardWidth - 10, y: rect.top }, // left
    { x: rect.right + 10, y: rect.bottom + 5 }, // below-right
    { x: rect.left, y: rect.bottom + 5 }, // below-left
  ];

  let finalPosition = null;

  for (const pos of positions) {
    const testBounds = {
      left: pos.x,
      top: pos.y,
      right: pos.x + cardWidth,
      bottom: pos.y + cardHeight
    };

    // Check if position is in viewport
    if (testBounds.right > window.innerWidth || testBounds.left < 0) continue;

    // Check for overlaps with existing cards
    const overlaps = existingCards.some(existing =>
      !(testBounds.right < existing.left ||
        testBounds.left > existing.right ||
        testBounds.bottom < existing.top ||
        testBounds.top > existing.bottom)
    );

    if (!overlaps) {
      finalPosition = { x: pos.x, y: pos.y, bounds: testBounds };
      break;
    }
  }

  // If all positions overlap, skip this card
  if (!finalPosition) return null;

  card.style.cssText = `
    position: absolute;
    left: ${finalPosition.x}px;
    top: ${finalPosition.y}px;
    background: rgba(0, 0, 0, 0.92);
    color: white;
    padding: 6px 8px;
    border-radius: 3px;
    font-family: Monaco, monospace;
    font-size: 10px;
    line-height: 1.4;
    pointer-events: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.15);
    white-space: nowrap;
  `;

  card.innerHTML = `
    <div style="color: #fbbf24; font-weight: bold; font-size: 11px; margin-bottom: 3px;">${shortFontFamily}</div>
    <div><span style="color: #64748b;">${Math.round(fontSize)}px</span> · <span style="color: #64748b;">w${fontInfo.fontWeight}</span></div>
    <div><span style="color: #64748b;">lh:</span>${lineHeightDisplay} · <span style="color: #64748b;">ls:</span>${letterSpacing}</div>
    <div style="color: ${fontInfo.color}; font-size: 9px; margin-top: 2px;">■ ${fontInfo.color}</div>
  `;

  return {
    element: card,
    bounds: finalPosition.bounds
  };
}

function clearMeasurements() {
  if (svgOverlay) {
    svgOverlay.innerHTML = '';
  }
  if (fontInfoContainer) {
    fontInfoContainer.innerHTML = '';
  }
  if (colorInfoContainer) {
    colorInfoContainer.innerHTML = '';
  }
  if (effectsInfoContainer) {
    effectsInfoContainer.innerHTML = '';
  }
}

function removeSpacingGrid() {
  // Remove event listeners
  document.removeEventListener('keydown', handleKeyDown, true);
  window.removeEventListener('scroll', handleScroll, true);
  window.removeEventListener('resize', handleScroll, true);

  // Clear any pending scroll updates
  if (scrollTimeout) {
    cancelAnimationFrame(scrollTimeout);
    scrollTimeout = null;
  }

  // Remove SVG overlay
  if (svgOverlay) {
    svgOverlay.remove();
    svgOverlay = null;
  }

  // Remove font info container
  if (fontInfoContainer) {
    fontInfoContainer.remove();
    fontInfoContainer = null;
  }

  // Remove grid overlay
  if (gridOverlay) {
    gridOverlay.remove();
    gridOverlay = null;
  }

  // Remove color info container
  if (colorInfoContainer) {
    colorInfoContainer.remove();
    colorInfoContainer = null;
  }

  // Remove effects info container
  if (effectsInfoContainer) {
    effectsInfoContainer.remove();
    effectsInfoContainer = null;
  }

  // Remove all indicators
  const indicator = document.getElementById('spacing-toggle-indicator');
  if (indicator) indicator.remove();

  const hint = document.getElementById('spacing-hint');
  if (hint) hint.remove();

  spacingGridActive = false;
  isDrawing = false;
  showSpacing = false;
  showDimensions = false;
  showFontInfo = false;
  showGrid = false;
  showColors = false;
  showEffects = false;

  console.log('Pixel Perfect: Removed');
}

// Grid functions
function drawGrid() {
  if (!gridOverlay) return;

  const gridSize = 8; // 8px grid
  const width = window.innerWidth;
  const height = window.innerHeight;

  let gridContent = '';

  // Draw vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    gridContent += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="rgba(255, 0, 255, 0.15)" stroke-width="1"/>`;
  }

  // Draw horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    gridContent += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(255, 0, 255, 0.15)" stroke-width="1"/>`;
  }

  gridOverlay.innerHTML = gridContent;
  console.log(`Drew 8px grid overlay`);
}

function clearGrid() {
  if (!gridOverlay) return;
  gridOverlay.innerHTML = '';
}

// Color functions
function drawColors() {
  if (!colorInfoContainer) return;

  // Clear previous colors
  colorInfoContainer.innerHTML = '';

  const allElements = document.querySelectorAll('body *');
  const colorMap = new Map(); // color -> count
  const maxColors = 20;

  // Collect colors
  for (const element of allElements) {
    if (element.offsetWidth === 0 || element.offsetHeight === 0) continue;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK', 'TITLE'].includes(element.tagName)) continue;

    const styles = window.getComputedStyle(element);
    const bgColor = styles.backgroundColor;
    const textColor = styles.color;

    // Skip transparent
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      colorMap.set(bgColor, (colorMap.get(bgColor) || 0) + 1);
    }
    if (textColor && textColor !== 'rgba(0, 0, 0, 0)' && textColor !== 'transparent') {
      colorMap.set(textColor, (colorMap.get(textColor) || 0) + 1);
    }
  }

  // Sort by frequency
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors);

  // Create color palette panel
  const panel = document.createElement('div');
  panel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.92);
    color: white;
    padding: 12px;
    border-radius: 6px;
    font-family: Monaco, monospace;
    font-size: 10px;
    max-height: 600px;
    overflow-y: auto;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.15);
    z-index: 2147483646;
  `;

  let paletteHTML = '<div style="color: #fbbf24; font-weight: bold; margin-bottom: 8px; font-size: 11px;">Color Palette</div>';

  sortedColors.forEach(([color, count]) => {
    const hexColor = rgbToHex(color);
    paletteHTML += `
      <div style="display: flex; align-items: center; margin-bottom: 6px;">
        <div style="width: 24px; height: 24px; background: ${color}; border: 1px solid rgba(255,255,255,0.3); margin-right: 8px; border-radius: 3px;"></div>
        <div style="flex: 1;">
          <div style="color: white;">${hexColor}</div>
          <div style="color: #64748b; font-size: 9px;">${color}</div>
        </div>
        <div style="color: #64748b; font-size: 9px; margin-left: 8px;">${count}×</div>
      </div>
    `;
  });

  panel.innerHTML = paletteHTML;
  colorInfoContainer.appendChild(panel);

  console.log(`Drew ${sortedColors.length} colors`);
}

function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return rgb;

  const r = parseInt(result[0]);
  const g = parseInt(result[1]);
  const b = parseInt(result[2]);

  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Effects functions
function drawEffects() {
  if (!effectsInfoContainer) return;

  // Clear previous effects
  effectsInfoContainer.innerHTML = '';

  const allElements = document.querySelectorAll('body *');
  const processedElements = new Set();
  const maxEffects = 30;
  let effectsCount = 0;
  const cardPositions = [];

  for (const element of allElements) {
    if (effectsCount >= maxEffects) break;

    if (element.offsetWidth === 0 || element.offsetHeight === 0) continue;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK', 'TITLE', 'SVG', 'PATH', 'G'].includes(element.tagName)) continue;

    const rect = element.getBoundingClientRect();

    // Skip elements outside viewport
    if (rect.bottom < 0 || rect.top > window.innerHeight ||
        rect.right < 0 || rect.left > window.innerWidth) {
      continue;
    }

    // Skip very small elements
    if (rect.width < 30 || rect.height < 30) continue;

    const posKey = `${Math.round(rect.left)}-${Math.round(rect.top)}`;
    if (processedElements.has(posKey)) continue;

    const styles = window.getComputedStyle(element);
    const boxShadow = styles.boxShadow;
    const borderRadius = styles.borderRadius;
    const border = styles.border;

    // Check if element has effects
    const hasEffects = (boxShadow && boxShadow !== 'none') ||
                       (borderRadius && borderRadius !== '0px') ||
                       (border && border !== 'none' && !border.startsWith('0px'));

    if (!hasEffects) continue;

    const effectsInfo = {
      boxShadow: boxShadow !== 'none' ? boxShadow : null,
      borderRadius: borderRadius !== '0px' ? borderRadius : null,
      border: border !== 'none' && !border.startsWith('0px') ? border : null
    };

    const cardData = createEffectsCard(rect, effectsInfo, cardPositions);

    if (cardData) {
      effectsInfoContainer.appendChild(cardData.element);
      cardPositions.push(cardData.bounds);
      processedElements.add(posKey);
      effectsCount++;
    }
  }

  console.log(`Drew ${effectsCount} effects cards`);
}

function createEffectsCard(rect, effectsInfo, existingCards) {
  const card = document.createElement('div');

  const cardWidth = 180;
  const cardHeight = 100;

  const positions = [
    { x: rect.right + 10, y: rect.top },
    { x: rect.left - cardWidth - 10, y: rect.top },
    { x: rect.right + 10, y: rect.bottom + 5 },
    { x: rect.left, y: rect.bottom + 5 },
  ];

  let finalPosition = null;

  for (const pos of positions) {
    const testBounds = {
      left: pos.x,
      top: pos.y,
      right: pos.x + cardWidth,
      bottom: pos.y + cardHeight
    };

    if (testBounds.right > window.innerWidth || testBounds.left < 0) continue;

    const overlaps = existingCards.some(existing =>
      !(testBounds.right < existing.left ||
        testBounds.left > existing.right ||
        testBounds.bottom < existing.top ||
        testBounds.top > existing.bottom)
    );

    if (!overlaps) {
      finalPosition = { x: pos.x, y: pos.y, bounds: testBounds };
      break;
    }
  }

  if (!finalPosition) return null;

  card.style.cssText = `
    position: absolute;
    left: ${finalPosition.x}px;
    top: ${finalPosition.y}px;
    background: rgba(0, 0, 0, 0.92);
    color: white;
    padding: 6px 8px;
    border-radius: 3px;
    font-family: Monaco, monospace;
    font-size: 9px;
    line-height: 1.4;
    pointer-events: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.15);
    white-space: nowrap;
    max-width: ${cardWidth}px;
  `;

  let effectsHTML = '<div style="color: #a78bfa; font-weight: bold; font-size: 10px; margin-bottom: 3px;">Effects</div>';

  if (effectsInfo.boxShadow) {
    effectsHTML += `<div><span style="color: #64748b;">Shadow:</span> ${shortenValue(effectsInfo.boxShadow, 25)}</div>`;
  }
  if (effectsInfo.borderRadius) {
    effectsHTML += `<div><span style="color: #64748b;">Radius:</span> ${effectsInfo.borderRadius}</div>`;
  }
  if (effectsInfo.border) {
    effectsHTML += `<div><span style="color: #64748b;">Border:</span> ${shortenValue(effectsInfo.border, 25)}</div>`;
  }

  card.innerHTML = effectsHTML;

  return {
    element: card,
    bounds: finalPosition.bounds
  };
}

function shortenValue(value, maxLength) {
  if (value.length <= maxLength) return value;
  return value.substring(0, maxLength) + '...';
}
