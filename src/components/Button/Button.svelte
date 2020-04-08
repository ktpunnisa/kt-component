<script>
  import chroma from "chroma-js";
  import cssVars from "../../svelte-css-vars.js";
  import colorToken from "../../styles/color.js";
  import buttonToken from "../../styles/button.js";
  import {
    mixColorShade,
    getColorOpacity,
    getBorderCSS,
    getBoxShadowCSS
  } from "../../styles/function.js";

  export let size = "medium";
  export let type = "default";
  export let color = "primary";
  export let colorcode = "#ff8879";
  export let disabled = false;
  export let radius = 4;
  export let fontsize = 16;
  export let pt = 12;
  export let pr = 20;
  export let pb = 12;
  export let pl = 20;

  const colorTheme = Object.keys(colorToken.themes);
  $: colorcode = colorTheme.includes(color) ? colorToken.themes[color] : color;

  $: btnShape = buttonToken.shape;
  $: btnSize = buttonToken.sizes[size];
  $: btnType = buttonToken.types[type];

  function getBaseColor(state, style, colorcode) {
    return btnType[state][style].type === "fixed"
      ? colorToken.themes[btnType[state][style].color]
      : colorcode;
  }

  function getColorShade(state, style, colorcode) {
    if (btnType[state][style].type === "transparent") {
      return "transparent";
    }
    const color = getBaseColor(state, style, colorcode);
    const shade = btnType[state][style].shade;
    const opacity = colorToken.shades[btnType[state][style].shade];
    return mixColorShade(color, shade, opacity);
  }

  function getColorBoxShadow(boxShadow, colorcode) {
    if (boxShadow.type === "transparent") {
      return "transparent";
    }
    const color =
      boxShadow.type === "fixed"
        ? colorToken.themes[boxShadow.color]
        : colorcode;
    const opacity = boxShadow.opacity;
    return getColorOpacity(color, opacity);
  }

  function getBoxShadow(state) {
    let boxShadowCSS = "";
    btnType[state]["boxShadows"].forEach(boxShadow => {
      const color = getColorBoxShadow(boxShadow, colorcode);
      const style = getBoxShadowCSS(
        boxShadow.x,
        boxShadow.y,
        boxShadow.blur,
        boxShadow.spread,
        color
      );
      boxShadowCSS =
        boxShadowCSS === "" ? `${style}` : `${style}, ${boxShadowCSS}`;
    });
    return boxShadowCSS;
  }

  $: styleVars = {
    // shape
    radius: size != "custom" ? `${btnShape.borderRadius}px` : `${radius}px`,

    // size
    fontsize: size != "custom" ? `${btnSize.fontSize}px` : `${fontsize}px`,
    padding:
      size != "custom"
        ? `${btnSize.padding.top}px ${btnSize.padding.right}px ${btnSize.padding.bottom}px ${btnSize.padding.left}px`
        : `${pt}px ${pr}px ${pb}px ${pl}px`,
    colorcode,

    // type
    fontcolor: getColorShade("normal", "font", colorcode),
    bgcolor: getColorShade("normal", "background", colorcode),
    border: getBorderCSS(
      btnShape.borderWidth,
      btnShape.borderStyle,
      getColorShade("normal", "border", colorcode)
    ),
    boxshadow: getBoxShadow("normal"),

    // type:hover
    fontcolorhover: getColorShade("hover", "font", colorcode),
    bgcolorhover: getColorShade("hover", "background", colorcode),
    borderhover: getBorderCSS(
      btnShape.borderWidth,
      btnShape.borderStyle,
      getColorShade("hover", "border", colorcode)
    ),
    boxshadowhover: getBoxShadow("hover"),

    // type:pressed
    fontcolorpressed: getColorShade("pressed", "font", colorcode),
    bgcolorpressed: getColorShade("pressed", "background", colorcode),
    borderpressed: getBorderCSS(
      btnShape.borderWidth,
      btnShape.borderStyle,
      getColorShade("pressed", "border", colorcode)
    ),
    boxshadowpressed: getBoxShadow("pressed"),

    // type:disabled
    fontcolordisabled: getColorShade("disabled", "font", colorcode),
    bgcolordisabled: getColorShade("disabled", "background", colorcode),
    borderdisabled: getBorderCSS(
      btnShape.borderWidth,
      btnShape.borderStyle,
      getColorShade("disabled", "border", colorcode)
    ),
    boxshadowdisabled: getBoxShadow("disabled")
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
