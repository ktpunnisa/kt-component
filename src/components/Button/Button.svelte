<script>
  // export let bgcolor = "pink";
  // export let fontcolor = "black";
  // export let big = false;
  // export let ghost = false;
  // export let color = "success";
  // export let fontcolor = "white";
  import cssVars from "../../svelte-css-vars.js";
  export let size = "medium";
  export let type = "default";
  export let disabled = false;

  export let radius = "12";
  export let fontsize = "16";
  export let pt = "12";
  export let pr = "20";
  export let pb = "12";
  export let pl = "20";
  $: styleVars = {
    radius: `${radius}px`,
    fontsize: `${fontsize}px`,
    pt: `${pt}px`,
    pr: `${pr}px`,
    pb: `${pb}px`,
    pl: `${pl}px`
  };
</script>

<style type="text/scss" lang="scss">
  @import "../../styles/theme.scss";
  @import "../../styles/function.scss";
  @use "sass:meta";

  @mixin button-shape($radius) {
    border-radius: $radius;
  }

  @mixin button-size($fontsize, $pt, $pr, $pb, $pl) {
    font-size: $fontsize;
    padding-top: $pt;
    padding-right: $pr;
    padding-bottom: $pb;
    padding-left: $pl;
  }

  @mixin button-state($fontcolor, $bgcolor, $border, $boxshadow) {
    color: $fontcolor;
    background-color: $bgcolor;
    border: $border;
    box-shadow: $boxshadow;
  }

  button {
    // button-shape($radius)
    @include button-shape(map-deep-get($button, "border-radius"));
  }

  button:focus {
    outline: 0;
  }

  .small {
    // button-size($fontsize, $pt, $pr, $pb, $pl)
    @include button-size(
      map-deep-get($button, "size", "small", "font-size"),
      map-deep-get($button, "size", "small", "padding", "top"),
      map-deep-get($button, "size", "small", "padding", "right"),
      map-deep-get($button, "size", "small", "padding", "bottom"),
      map-deep-get($button, "size", "small", "padding", "left")
    );
  }

  .medium {
    // button-size($fontsize, $pt, $pr, $pb, $pl)
    @include button-size(
      map-deep-get($button, "size", "medium", "font-size"),
      map-deep-get($button, "size", "medium", "padding", "top"),
      map-deep-get($button, "size", "medium", "padding", "right"),
      map-deep-get($button, "size", "medium", "padding", "bottom"),
      map-deep-get($button, "size", "medium", "padding", "left")
    );
  }

  .large {
    // button-size($fontsize, $pt, $pr, $pb, $pl)
    @include button-size(
      map-deep-get($button, "size", "large", "font-size"),
      map-deep-get($button, "size", "large", "padding", "top"),
      map-deep-get($button, "size", "large", "padding", "right"),
      map-deep-get($button, "size", "large", "padding", "bottom"),
      map-deep-get($button, "size", "large", "padding", "left")
    );
  }

  .default {
    // button-state($fontcolor, $bgcolor, $border, $boxshadow)
    @include button-state(
      map-deep-get($button, "type", "default", "normal", "font-color"),
      map-deep-get($button, "type", "default", "normal", "background-color"),
      map-deep-get($button, "type", "default", "normal", "border"),
      map-deep-get($button, "type", "default", "normal", "box-shadow")
    );
  }

  .default:hover {
    // button-state($fontcolor, $bgcolor, $border, $boxshadow)
    @include button-state(
      map-deep-get($button, "type", "default", "hover", "font-color"),
      map-deep-get($button, "type", "default", "hover", "background-color"),
      map-deep-get($button, "type", "default", "hover", "border"),
      map-deep-get($button, "type", "default", "hover", "box-shadow")
    );
  }

  .default:active {
    // button-state($fontcolor, $bgcolor, $border, $boxshadow)
    @include button-state(
      map-deep-get($button, "type", "default", "pressed", "font-color"),
      map-deep-get($button, "type", "default", "pressed", "background-color"),
      map-deep-get($button, "type", "default", "pressed", "border"),
      map-deep-get($button, "type", "default", "pressed", "box-shadow")
    );
  }

  .default:disabled {
    // button-state($fontcolor, $bgcolor, $border, $boxshadow)
    @include button-state(
      map-deep-get($button, "type", "default", "disabled", "font-color"),
      map-deep-get($button, "type", "default", "disabled", "background-color"),
      map-deep-get($button, "type", "default", "disabled", "border"),
      map-deep-get($button, "type", "default", "disabled", "box-shadow")
    );
  }

  .custom {
    // button-shape($radius)
    // button-size($fontsize, $pt, $pr, $pb, $pl)
    // button-state($fontcolor, $bgcolor, $border, $boxshadow)
    @include button-shape(var(--radius));
    @include button-size(
      var(--fontsize),
      var(--pt),
      var(--pr),
      var(--pb),
      var(--pl)
    );
  }
</style>

<svelte:options tag="kt-button" />

<button
  use:cssVars={styleVars}
  class:small={size === 'small'}
  class:medium={size === 'medium'}
  class:large={size === 'large'}
  class:custom={type === 'custom'}
  class:default={type === 'default'}
  {disabled}>
  <slot />
</button>
