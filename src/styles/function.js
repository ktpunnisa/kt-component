import chroma from 'chroma-js';

export function mixColorShade(color, shade, opacity) {
  if (shade === 'light' || shade === 'lighter' || shade === 'lightest') {
    return chroma.mix(color, 'white', opacity);
  } else if (shade === 'dark' || shade === 'darker') {
    return chroma.mix(color, 'black', opacity);
  }
  return color;
}

export function getColorOpacity(color, opacity) {
  return chroma(color).alpha(opacity);
}

export function getBorderCSS(width, style, color) {
  return `${width}px ${style} ${color}`;
}

export function getBoxShadowCSS(x, y, blur, spread, color) {
  return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
}
