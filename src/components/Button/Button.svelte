<script>
  import chroma from "chroma-js";
  import cssVars from "../../svelte-css-vars.js";
  import colorStyle from "../../styles/color.js";
  import buttonStyle from "../../styles/button.js";
  import { mixColorShade, getColorOpacity } from "../../styles/function.js";
  export let size = "medium";
  export let type = "default";
  export let color = "primary";
  export let colorcode = "#ff8879";
  export let disabled = false;
  export let radius = "4px";
  export let fontsize = "16px";
  export let padding = "12px 20px 12px 20px";

  const colorTheme = Object.keys(colorStyle.colors);
  $: colorcode = colorTheme.includes(color) ? colorStyle.colors[color] : color;

  $: btnSize = buttonStyle.size[size];
  $: btnType = buttonStyle.type[type];

  function getBaseColor(state, style, colorcode) {
    return btnType[state][style].type === "fixed"
      ? colorStyle.colors[btnType[state][style].color]
      : colorcode;
  }

  function getColorShade(state, style, colorcode) {
    if (btnType[state][style].type === "transparent") {
      return "transparent";
    }
    const color = getBaseColor(state, style, colorcode);
    const shade = btnType[state][style].shade;
    const opacity = colorStyle.shades[btnType[state][style].shade];
    return mixColorShade(color, shade, opacity);
  }

  function getColorRGBA(state, style, colorcode) {
    if (btnType[state][style].type === "transparent") {
      return "transparent";
    }
    const color = getBaseColor(state, style, colorcode);
    const opacity = btnType[state][style].opacity;
    return getColorOpacity(color, opacity);
  }

  $: styleVars = {
    // shape
    radius: size != "custom" ? buttonStyle.borderRadius : radius,
    // size
    fontsize: size != "custom" ? btnSize.fontSize : fontsize,
    padding: size != "custom" ? btnSize.padding : padding,
    colorcode,
    // type
    fontcolor: getColorShade("normal", "font", colorcode),
    bgcolor: getColorShade("normal", "background", colorcode),
    border: `${btnType["normal"]["border"].style} ${getColorShade(
      "normal",
      "border",
      colorcode
    )}`,
    boxshadow: `${btnType["normal"]["boxShadow"].style} ${getColorRGBA(
      "normal",
      "boxShadow"
    )}`,
    // type:hover
    fontcolorhover: getColorShade("hover", "font", colorcode),
    bgcolorhover: getColorShade("hover", "background", colorcode),
    borderhover: `${btnType["hover"]["border"].style} ${getColorShade(
      "hover",
      "border",
      colorcode
    )}`,
    boxshadowhover: `${btnType["hover"]["boxShadow"].style} ${getColorRGBA(
      "hover",
      "boxShadow"
    )}`,
    // type:pressed
    fontcolorpressed: getColorShade("pressed", "font", colorcode),
    bgcolorpressed: getColorShade("pressed", "background", colorcode),
    borderpressed: `${btnType["pressed"]["border"].style} ${getColorShade(
      "pressed",
      "border",
      colorcode
    )}`,
    boxshadowpressed: `${btnType["pressed"]["boxShadow"].style} ${getColorRGBA(
      "pressed",
      "boxShadow"
    )}`,
    // type:disabled
    fontcolordisabled: getColorShade("disabled", "font", colorcode),
    bgcolordisabled: getColorShade("disabled", "background", colorcode),
    borderdisabled: `${btnType["disabled"]["border"].style} ${getColorShade(
      "disabled",
      "border",
      colorcode
    )}`,
    boxshadowdisabled: `${
      btnType["disabled"]["boxShadow"].style
    } ${getColorRGBA("disabled", "boxShadow")}`
  };
</script>

<style type="text/scss" lang="scss">
  @mixin button-shape($radius) {
    border-radius: $radius;
  }

  @mixin button-size($fontsize, $padding) {
    font-size: $fontsize;
    padding: $padding;
  }

  @mixin button-state($fontcolor, $bgcolor, $border, $boxshadow) {
    color: $fontcolor;
    background: $bgcolor;
    border: $border;
    box-shadow: $boxshadow;
  }

  button {
    @include button-shape(var(--radius));
    @include button-size(var(--fontsize), var(--padding));
    @include button-state(
      var(--fontcolor),
      var(--bgcolor),
      var(--border),
      var(--boxshadow)
    );

    &:hover {
      @include button-state(
        var(--fontcolorhover),
        var(--bgcolorhover),
        var(--borderhover),
        var(--boxshadowhover)
      );
    }

    &:active {
      @include button-state(
        var(--fontcolorpressed),
        var(--bgcolorpressed),
        var(--borderpressed),
        var(--boxshadowpressed)
      );
    }

    &:disabled {
      @include button-state(
        var(--fontcolordisabled),
        var(--bgcolordisabled),
        var(--borderdisabled),
        var(--boxshadowdisabled)
      );
    }

    &:focus {
      outline: 0;
    }
  }
</style>

<svelte:options tag="kt-button" />

<button use:cssVars={styleVars} {disabled}>
  <slot />
</button>
