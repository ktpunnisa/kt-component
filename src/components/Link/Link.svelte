<script>
  import chroma from "chroma-js";
  import cssVars from "../../svelte-css-vars.js";
  import colorToken from "../../style-tokens/color.js";
  import linkToken from "../../style-tokens/link.js";
  import { mixColorShade } from "../../styles/function.js";

  export let size = "medium";
  export let type = "default";
  export let color = "primary";
  export let href = "";
  export let fontsize = 16;
  export let fontweight = 600;
  export let colorcode = "#ff8879";

  const colorTheme = Object.keys(colorToken.themes);
  $: colorcode = colorTheme.includes(color) ? colorToken.themes[color] : color;

  $: linkSize = linkToken.sizes[size];
  $: linkType = linkToken.types[type];

  function getBaseColor(state, style, colorcode) {
    return linkType[state][style].type === "fixed"
      ? colorToken.themes[linkType[state][style].color]
      : colorcode;
  }

  function getColorShade(state, style, colorcode) {
    if (linkType[state][style].type === "transparent") {
      return "transparent";
    }
    const color = getBaseColor(state, style, colorcode);
    const shade = linkType[state][style].shade;
    const opacity = colorToken.shades[linkType[state][style].shade];
    return mixColorShade(color, shade, opacity);
  }

  $: styleVars = {
    // size
    fontsize: size != "custom" ? `${linkSize.fontSize}px` : `${fontsize}px`,
    fontweight: size != "custom" ? linkSize.fontWeight : fontweight,
    colorcode,

    // type
    fontcolor: getColorShade("normal", "font", colorcode),
    textdecoration: linkType["normal"]["textDecoration"],

    // type:hover
    fontcolorhover: getColorShade("hover", "font", colorcode),
    textdecorationhover: linkType["hover"]["textDecoration"],

    // type:pressed
    fontcolorpressed: getColorShade("pressed", "font", colorcode),
    textdecorationpressed: linkType["pressed"]["textDecoration"]
  };
</script>

<style type="text/scss" lang="scss">
  @mixin link-size($fontsize, $fontweight) {
    font-size: $fontsize;
    font-weight: $fontweight;
  }

  @mixin link-state($fontcolor, $textdecoration) {
    color: $fontcolor;
    text-decoration: $textdecoration;
  }

  a {
    @include link-size(var(--fontsize), var(--fontweight));
    @include link-state(var(--fontcolor), var(--textdecoration));

    &:hover {
      @include link-state(var(--fontcolorhover), var(--textdecorationhover));
    }

    &:active {
      @include link-state(
        var(--fontcolorpressed),
        var(--textdecorationpressed)
      );
    }
  }
</style>

<svelte:options tag="kt-link" />

<a {href} use:cssVars={styleVars}>
  <slot />
</a>
