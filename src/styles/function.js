import chroma from 'chroma-js';

export function mixColorShade(color, shade, opacity) {
  if (shade === 'light' || shade === 'lighter' || shade === 'lightest') {
    return chroma.mix(color, 'white', opacity);
  } else if (shade === 'dark' || shade === 'darker') {
    return chroma.mix(color, 'black', opacity);
  }
  return color;
}

export function getColorOpacity(hex, opacity) {
  let r = '0x' + hex[1] + hex[2];
  let g = '0x' + hex[3] + hex[4];
  let b = '0x' + hex[5] + hex[6];
  return `rgba(${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(
    b,
    16
  )},${opacity})`;
}
