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

  button {
    @include button-shape(map-deep-get($button, "border-radius"));
  }

  .small {
    @include button-size(
      map-deep-get($button, "size", "small", "font-size"),
      map-deep-get($button, "size", "small", "padding", "top"),
      map-deep-get($button, "size", "small", "padding", "right"),
      map-deep-get($button, "size", "small", "padding", "bottom"),
      map-deep-get($button, "size", "small", "padding", "left")
    );
  }

  .medium {
    @include button-size(
      map-deep-get($button, "size", "medium", "font-size"),
      map-deep-get($button, "size", "medium", "padding", "top"),
      map-deep-get($button, "size", "medium", "padding", "right"),
      map-deep-get($button, "size", "medium", "padding", "bottom"),
      map-deep-get($button, "size", "medium", "padding", "left")
    );
  }

  .large {
    @include button-size(
      map-deep-get($button, "size", "large", "font-size"),
      map-deep-get($button, "size", "large", "padding", "top"),
      map-deep-get($button, "size", "large", "padding", "right"),
      map-deep-get($button, "size", "large", "padding", "bottom"),
      map-deep-get($button, "size", "large", "padding", "left")
    );
  }

  .custom {
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
  class:custom={type === 'custom'}>
  <slot />
</button>
