<script>
  import cssVars from "../../svelte-css-vars.js";
  import colorToken from "../../styles/color.js";
  import { mixColorShade } from "../../styles/function.js";
  export let width = "100";
  export let height = "40";
  export let radius = "8";
  export let color = "primary";
  export let colorcode = "#ff8879";
  export let shade = "base";
  export let opacity = 0;

  const colorTheme = Object.keys(colorToken.themes);
  $: colorcode = colorTheme.includes(color) ? colorToken.themes[color] : color;
  $: opacity = colorTheme.includes(color) ? colorToken.shades[shade] : opacity;

  $: styleVars = {
    width: `${width}px`,
    height: `${height}px`,
    radius: `${radius}px`,
    color: mixColorShade(colorcode, shade, opacity)
  };
</script>

<style type="text/scss" lang="scss">
  div {
    width: var(--width);
    height: var(--height);
    border-radius: var(--radius);
    margin: 4px;
    background: var(--color);
  }
</style>

<svelte:options tag="kt-palette" />
<div use:cssVars={styleVars} />
