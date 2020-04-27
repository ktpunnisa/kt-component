export default {
  sizes: {
    small: {
      fontSize: 14,
    },
    medium: {
      fontSize: 16,
    },
    large: {
      fontSize: 18,
    },
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
      visited: {
        font: { type: 'custom', color: '', shade: 'base' },
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
      visited: {
        font: { type: 'fixed', color: 'black', shade: 'base' },
        textDecoration: 'none',
      },
    },
  },
};
