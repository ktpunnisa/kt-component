export default {
  sizes: {
    small: { fontSize: 14, fontWeight: 500 },
    medium: { fontSize: 16, fontWeight: 600 },
    large: { fontSize: 18, fontWeight: 700 },
  },
  types: {
    default: {
      normal: {
        font: { type: 'custom', color: '', shade: 'base' },
        textDecoration: 'underline',
      },
      hover: {
        font: { type: 'custom', color: '', shade: 'dark' },
        textDecoration: 'underline',
      },
      pressed: {
        font: { type: 'custom', color: '', shade: 'darker' },
        textDecoration: 'underline',
      },
    },
    nav: {
      normal: {
        font: { type: 'fixed', color: 'black', shade: 'base' },
        textDecoration: 'none',
      },
      hover: {
        font: { type: 'custom', color: '', shade: 'base' },
        textDecoration: 'underline',
      },
      pressed: {
        font: { type: 'custom', color: '', shade: 'dark' },
        textDecoration: 'underline',
      },
    },
  },
};
