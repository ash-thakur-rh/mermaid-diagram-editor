import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';

function getSvgDimensions(svgElement) {
  let width = null;
  let height = null;

  console.log('[getSvgDimensions] Raw attributes:', {
    width: svgElement.getAttribute('width'),
    height: svgElement.getAttribute('height'),
    viewBox: svgElement.getAttribute('viewBox'),
    styleWidth: svgElement.style.width,
    styleMaxWidth: svgElement.style.maxWidth,
    clientWidth: svgElement.clientWidth
  });

  // Priority 1: viewBox (gives true diagram dimensions regardless of CSS)
  const viewBox = svgElement.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.split(/\s+/);
    if (parts.length === 4) {
      width = parseFloat(parts[2]);
      height = parseFloat(parts[3]);
      console.log('[getSvgDimensions] Using viewBox:', { width, height });
    }
  }

  // Priority 2: Explicit width/height attributes
  if (!width || !height) {
    const attrWidth = svgElement.getAttribute('width');
    const attrHeight = svgElement.getAttribute('height');

    if (attrWidth) width = parseFloat(attrWidth);
    if (attrHeight) height = parseFloat(attrHeight);

    if (width || height) {
      console.log('[getSvgDimensions] Using attributes:', { width, height });
    }
  }

  // Priority 3: Temporarily remove CSS constraints and measure natural size
  if (!width || !height) {
    const originalMaxWidth = svgElement.style.maxWidth;
    const originalWidth = svgElement.style.width;

    svgElement.style.maxWidth = 'none';
    svgElement.style.width = 'auto';

    const rect = svgElement.getBoundingClientRect();
    width = width || rect.width;
    height = height || rect.height;

    // Restore original styles
    svgElement.style.maxWidth = originalMaxWidth;
    svgElement.style.width = originalWidth;

    console.log('[getSvgDimensions] Using natural size:', { width, height });
  }

  // Final fallback: getBBox
  if (!width || !height) {
    try {
      const bbox = svgElement.getBBox();
      width = width || bbox.width;
      height = height || bbox.height;
      console.log('[getSvgDimensions] Using getBBox:', { width, height });
    } catch (e) {
      console.warn('[getSvgDimensions] getBBox failed:', e);
    }
  }

  console.log('[getSvgDimensions] Final dimensions:', { width, height });

  return { width, height };
}

export async function exportPNG(svgElement, filename, options = {}) {
  if (!svgElement) {
    alert('No diagram to export. Please create a diagram first.');
    return;
  }

  try {
    const scale = options.scale || 2;
    const dims = getSvgDimensions(svgElement);
    const width = options.width || dims.width;
    const height = options.height || dims.height;

    console.log('[exportPNG] SVG element:', svgElement);
    console.log('[exportPNG] Dimensions:', { width, height, scale, dims });
    console.log('[exportPNG] Options:', options);

    // Ensure SVG has explicit width/height attributes for html-to-image
    const originalWidth = svgElement.getAttribute('width');
    const originalHeight = svgElement.getAttribute('height');

    svgElement.setAttribute('width', width);
    svgElement.setAttribute('height', height);

    const toPngOptions = {
      quality: 1.0,
      pixelRatio: scale,
      backgroundColor: options.backgroundColor || '#ffffff',
      width: width,
      height: height
    };

    console.log('[exportPNG] toPng options:', toPngOptions);

    const dataUrl = await toPng(svgElement, toPngOptions);
    console.log('[exportPNG] Data URL length:', dataUrl?.length);

    // Restore original attributes
    if (originalWidth !== null) {
      svgElement.setAttribute('width', originalWidth);
    } else {
      svgElement.removeAttribute('width');
    }
    if (originalHeight !== null) {
      svgElement.setAttribute('height', originalHeight);
    } else {
      svgElement.removeAttribute('height');
    }

    const blob = await (await fetch(dataUrl)).blob();
    console.log('[exportPNG] Blob size:', blob.size, 'type:', blob.type);
    saveAs(blob, filename);
  } catch (error) {
    console.error('PNG export failed:', error);
    alert(`Failed to export PNG: ${error.message}`);
  }
}

export async function exportSVG(svgElement, filename, options = {}) {
  if (!svgElement) {
    alert('No diagram to export. Please create a diagram first.');
    return;
  }

  try {
    const clonedSvg = svgElement.cloneNode(true);

    if (options.width) {
      clonedSvg.setAttribute('width', options.width);
    }
    if (options.height) {
      clonedSvg.setAttribute('height', options.height);
    }

    const styles = Array.from(document.styleSheets)
      .filter(sheet => {
        try {
          return sheet.cssRules;
        } catch (e) {
          return false;
        }
      })
      .flatMap(sheet => Array.from(sheet.cssRules))
      .filter(rule => rule instanceof CSSStyleRule)
      .map(rule => rule.cssText)
      .join('\n');

    const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleElement.textContent = styles;
    clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });

    saveAs(blob, filename);
  } catch (error) {
    console.error('SVG export failed:', error);
    alert(`Failed to export SVG: ${error.message}`);
  }
}

export async function generatePreview(svgElement, options = {}) {
  if (!svgElement) {
    return null;
  }

  try {
    const scale = options.scale || 2;
    const dims = getSvgDimensions(svgElement);
    const width = options.width || dims.width;
    const height = options.height || dims.height;

    console.log('[generatePreview] SVG element:', svgElement);
    console.log('[generatePreview] Dimensions:', { width, height, scale, dims });
    console.log('[generatePreview] Options:', options);

    // Ensure SVG has explicit width/height attributes for html-to-image
    const originalWidth = svgElement.getAttribute('width');
    const originalHeight = svgElement.getAttribute('height');

    svgElement.setAttribute('width', width);
    svgElement.setAttribute('height', height);

    const toPngOptions = {
      quality: 1.0,
      pixelRatio: scale,
      backgroundColor: options.backgroundColor || '#ffffff',
      width: width,
      height: height
    };

    console.log('[generatePreview] toPng options:', toPngOptions);

    const dataUrl = await toPng(svgElement, toPngOptions);
    console.log('[generatePreview] Data URL length:', dataUrl?.length);

    // Restore original attributes
    if (originalWidth !== null) {
      svgElement.setAttribute('width', originalWidth);
    } else {
      svgElement.removeAttribute('width');
    }
    if (originalHeight !== null) {
      svgElement.setAttribute('height', originalHeight);
    } else {
      svgElement.removeAttribute('height');
    }

    return dataUrl;
  } catch (error) {
    console.error('Preview generation failed:', error);
    return null;
  }
}

export function generateFilename(baseName, extension) {
  const date = new Date().toISOString().split('T')[0];
  const safeName = baseName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  return `${safeName}-${date}.${extension}`;
}
