export default {
  shape: {
    label: { margin: { bottom: 4 } },
    input: { borderRadius: 4, borderStyle: 'solid', borderWidth: 2 },
  },
  sizes: {
    small: {
      label: { fontSize: 14, fontWeight: 400 },
      input: {
        fontSize: 16,
        padding: { top: 6, right: 8, bottom: 6, left: 8 },
      },
    },
    medium: {
      label: { fontSize: 14, fontWeight: 500 },
      input: {
        fontSize: 16,
        padding: { top: 8, right: 8, bottom: 8, left: 8 },
      },
    },
    large: {
      label: { fontSize: 16, fontWeight: 500 },
      input: {
        fontSize: 18,
        padding: { top: 12, right: 10, bottom: 12, left: 10 },
      },
    },
  },
  types: {
    default: {
      normal: {
        mainColor: 'primary',
        label: { font: { type: 'fixed', color: 'black', shade: 'default' } },
        input: {
          font: { type: 'fixed', color: 'black', shade: 'default' },
          background: { type: 'fixed', color: 'white', shade: 'default' },
          border: { type: 'fixed', color: 'gray', shade: 'default' },
        },
      },
      focus: {
        mainColor: 'info',
        label: { font: { type: 'custom', color: '', shade: 'default' } },
        input: {
          font: { type: 'fixed', color: 'black', shade: 'default' },
          background: { type: 'fixed', color: 'white', shade: 'default' },
          border: { type: 'custom', color: '', shade: 'default' },
        },
      },
      disabled: {
        mainColor: 'primary',
        label: { font: { type: 'fixed', color: 'gray', shade: 'default' } },
        input: {
          font: { type: 'fixed', color: 'gray', shade: 'light' },
          background: { type: 'fixed', color: 'gray', shade: 'lightest' },
          border: { type: 'fixed', color: 'gray', shade: 'light' },
        },
      },
      error: {
        mainColor: 'danger',
        label: { font: { type: 'custom', color: '', shade: 'default' } },
        input: {
          font: { type: 'fixed', color: 'black', shade: 'default' },
          background: { type: 'custom', color: '', shade: 'lightest' },
          border: { type: 'custom', color: '', shade: 'default' },
        },
      },
    },
  },
};
