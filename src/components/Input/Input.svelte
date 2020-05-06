<script>
  import chroma from "chroma-js";
  import cssVars from "../../svelte-css-vars.js";
  import colorToken from "../../style-tokens/color.js";
  import inputToken from "../../style-tokens/input.js";
  import { mixColorShade, getBorderCSS } from "../../styles/function.js";
  import { current_component } from "svelte/internal";
  import { getEventsAction } from "../../utils/utils.js";
  import { createEventDispatcher } from "svelte";
  import { get_current_component } from "svelte/internal";

  const component = get_current_component();
  const svelteDispatch = createEventDispatcher();
  const dispatch = (label, value) => {
    svelteDispatch(value);
    component.dispatchEvent &&
      component.dispatchEvent(new CustomEvent(label, { value }));
  };

  export let size = "medium";
  export let type = "default";
  export let disabled = false;
  export let error = false;
  export let label = "";
  export let placeholder = "";
  export let value = "";

  let isFocused = false;

  const onFocus = () => (isFocused = true);
  const onBlur = () => (isFocused = false);

  $: labelShape = inputToken.shape.label;
  $: inputShape = inputToken.shape.input;
  $: labelSize = inputToken.sizes[size].label;
  $: inputSize = inputToken.sizes[size].input;
  $: dInputType = inputToken.types[type];

  function getBaseColor(state, type, style, color) {
    return dInputType[state][type][style].type === "fixed"
      ? colorToken.themes[dInputType[state][type][style].color]
      : colorToken.themes[color];
  }

  function getColorShade(type, state, style) {
    if (dInputType[state][type][style].type === "transparent") {
      return "transparent";
    }
    const mainColor = dInputType[state].mainColor;
    const color = getBaseColor(state, type, style, mainColor);
    const shade = dInputType[state][type][style].shade;
    const opacity = colorToken.shades[dInputType[state][type][style].shade];
    return mixColorShade(color, shade, opacity);
  }

  $: styleVars = {
    // shape
    labelmarginbottom: `${labelShape.margin.bottom}px`,
    inputradius: `${inputShape.borderRadius}px`,

    // size
    labelfontsize: `${labelSize.fontSize}px`,
    labelfontWeight: labelSize.fontWeight,
    inputfontsize: `${inputSize.fontSize}px`,
    inputpadding: `${inputSize.padding.top}px ${inputSize.padding.right}px ${inputSize.padding.bottom}px ${inputSize.padding.left}px`,

    // type
    labelfontcolor: getColorShade("label", "normal", "font"),
    inputfontcolor: getColorShade("input", "normal", "font"),
    inputbgcolor: getColorShade("input", "normal", "background"),
    inputborder: getBorderCSS(
      inputShape.borderWidth,
      inputShape.borderStyle,
      getColorShade("input", "normal", "border")
    ),

    // type:focus
    labelfontcolorfocus: getColorShade("label", "focus", "font"),
    inputfontcolorfocus: getColorShade("input", "focus", "font"),
    inputbgcolorfocus: getColorShade("input", "focus", "background"),
    inputborderfocus: getBorderCSS(
      inputShape.borderWidth,
      inputShape.borderStyle,
      getColorShade("input", "focus", "border")
    ),

    // type:disabled
    labelfontcolordisabled: getColorShade("label", "disabled", "font"),
    inputfontcolordisabled: getColorShade("input", "disabled", "font"),
    inputbgcolordisabled: getColorShade("input", "disabled", "background"),
    inputborderdisabled: getBorderCSS(
      inputShape.borderWidth,
      inputShape.borderStyle,
      getColorShade("input", "disabled", "border")
    ),

    // type:error
    labelfontcolorerror: getColorShade("label", "error", "font"),
    inputfontcolorerror: getColorShade("input", "error", "font"),
    inputbgcolorerror: getColorShade("input", "error", "background"),
    inputbordererror: getBorderCSS(
      inputShape.borderWidth,
      inputShape.borderStyle,
      getColorShade("input", "error", "border")
    )
  };
</script>

<style type="text/scss" lang="scss">
  @mixin label-shape($marginbottom) {
    margin-bottom: $marginbottom;
  }

  @mixin input-shape($radius) {
    border-radius: $radius;
  }

  @mixin label-size($fontsize, $fontweight) {
    font-size: $fontsize;
    font-weight: $fontweight;
  }

  @mixin input-size($fontsize, $padding) {
    font-size: $fontsize;
    padding: $padding;
  }

  @mixin label-state($fontcolor) {
    color: $fontcolor;
  }

  @mixin input-state($fontcolor, $bgcolor, $border) {
    color: $fontcolor;
    background: $bgcolor;
    border: $border;
  }

  .label {
    @include label-shape(var(--labelmarginbottom));
    @include label-size(var(--labelfontsize), var(--labelfontweight));
    text-align: start;
  }

  .label-normal {
    @extend .label;
    @include label-state(var(--labelfontcolor));
  }

  .label-focus {
    @extend .label;
    @include label-state(var(--labelfontcolorfocus));
  }

  .label-disabled {
    @extend .label;
    @include label-state(var(--labelfontcolordisabled));
  }

  .label-error {
    @extend .label;
    @include label-state(var(--labelfontcolorerror));
  }

  input {
    @include input-shape(var(--inputradius));
    @include input-size(var(--inputfontsize), var(--inputpadding));

    &:focus {
      outline: 0;
    }
  }

  .input-normal {
    @include input-state(
      var(--inputfontcolor),
      var(--inputbgcolor),
      var(--inputborder)
    );

    &:focus {
      @include input-state(
        var(--inputfontcolorfocus),
        var(--inputbgcolorfocus),
        var(--inputborderfocus)
      );
    }

    &:disabled {
      @include input-state(
        var(--inputfontcolordisabled),
        var(--inputbgcolordisabled),
        var(--inputborderdisabled)
      );
    }
  }

  .input-error {
    @include input-state(
      var(--inputfontcolorerror),
      var(--inputbgcolorerror),
      var(--inputbordererror)
    );
  }
</style>

<svelte:options tag="kt-input" />

{#if disabled}
  <div class="label-disabled" use:cssVars={styleVars}>{label}</div>
{:else if error}
  <div class="label-error" use:cssVars={styleVars}>{label}</div>
{:else if isFocused}
  <div class="label-focus" use:cssVars={styleVars}>{label}</div>
{:else}
  <div class="label-normal" use:cssVars={styleVars}>{label}</div>
{/if}

<input
  class:input-normal={!error}
  class:input-error={error}
  use:cssVars={styleVars}
  on:focus={onFocus}
  on:blur={onBlur}
  bind:value
  {disabled}
  {placeholder} />
