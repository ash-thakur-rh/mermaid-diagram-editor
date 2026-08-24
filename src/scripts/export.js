import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';

export async function exportPNG(svgElement, filename, options = {}) {
  if (!svgElement) {
    alert('No diagram to export. Please create a diagram first.');
    return;
  }

  try {
    const scale = options.scale || 2;
    const width = options.width || svgElement.clientWidth;
    const height = options.height || svgElement.clientHeight;

    const dataUrl = await toPng(svgElement, {
      quality: 1.0,
      pixelRatio: scale,
      backgroundColor: options.backgroundColor || '#ffffff',
      width: width,
      height: height
    });

    const blob = await (await fetch(dataUrl)).blob();
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
    const width = options.width || svgElement.clientWidth;
    const height = options.height || svgElement.clientHeight;

    const toPngOptions = {
      quality: 1.0,
      pixelRatio: scale,
      backgroundColor: options.backgroundColor || '#ffffff'
    };

    // Only add width/height if specified to avoid html-to-image issues
    if (options.width) {
      toPngOptions.width = width;
    }
    if (options.height) {
      toPngOptions.height = height;
    }

    const dataUrl = await toPng(svgElement, toPngOptions);
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
