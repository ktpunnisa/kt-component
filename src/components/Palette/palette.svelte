<script>
  import cssVars from "../../svelte-css-vars.js";
  import colorStyle from "../../styles/color.js";
  export let width = "100";
  export let height = "40";
  export let radius = "8";
  export let color = "primary";
  export let colorcode = "#ff8879";
  export let shade = "base";
  export let opacity = 0;
  $: styleVars = {
    width: `${width}px`,
    height: `${height}px`,
    radius: `${radius}px`,
    color,
    colorcode: color !== "custom" ? colorStyle.colors[color] : colorcode,
    shade,
    opacity: color !== "custom" ? colorStyle.shades[shade] : opacity
  };
</script>

<style type="text/scss" lang="scss">
  @import "../../styles/theme.scss";
  @import "../../styles/function.scss";

  div {
    width: var(--width);
    height: var(--height);
    border-radius: var(--radius);
    margin: 4px;
    background: var(--colorcode);
  }
  .light {
    @include mixw(var(--colorcode), var(--opacity));
  }
  .dark {
    @include mixb(var(--colorcode), var(--opacity));
  }
</style>

<svelte:options tag="kt-palette" />
<div
  use:cssVars={styleVars}
  class:light={shade === 'light' || shade === 'lighter' || shade === 'lightest'}
  class:dark={shade === 'dark' || shade === 'darker'} />
