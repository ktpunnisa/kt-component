export default {
  sizes: {
    small: { fontSize: 14, fontWeight: 500 },
    medium: {
      fontSize: 16,
      fontWeight: 600,
    },
    large: {
      fontSize: 18,
      fontWeight: 700,
    },
  },
  types: {
    default: {
      normal: {
        font: { type: 'custom', color: '', shade: 'default' },
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
      visited: {
        font: { type: 'custom', color: '', shade: 'default' },
        textDecoration: 'underline',
      },
    },
    nav: {
      normal: {
        font: { type: 'fixed', color: 'black', shade: 'default' },
        textDecoration: 'none',
      },
      hover: {
        font: { type: 'custom', color: '', shade: 'default' },
        textDecoration: 'underline',
      },
      pressed: {
        font: { type: 'custom', color: '', shade: 'dark' },
        textDecoration: 'underline',
      },
      visited: {
        font: { type: 'fixed', color: 'black', shade: 'default' },
        textDecoration: 'none',
      },
    },
  },
};
