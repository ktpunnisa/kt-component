<script>
  import cssVars from "../../svelte-css-vars.js";
  import colorStyle from "../../styles/color.js";
  import buttonStyle from "../../styles/button.js";
  export let size = "medium";
  export let type = "default";
  export let color = "primary";
  export let colorcode = "#ff8879";
  export let disabled = false;
  export let radius = "4px";
  export let fontsize = "16px";
  export let padding = "12px 20px 12px 20px";

  $: styleVars = {
    radius: size != "custom" ? buttonStyle.borderRadius : radius,
    fontsize: size != "custom" ? buttonStyle.size[size].fontSize : fontsize,
    padding: size != "custom" ? buttonStyle.size[size].padding : padding,
    colorcode: color !== "custom" ? colorStyle.colors[color] : colorcode
  };
</script>

<style type="text/scss" lang="scss">
  @import "../../styles/theme.scss";
  @import "../../styles/function.scss";

  @mixin button-shape($radius) {
    border-radius: $radius;
  }

  @mixin button-size($fontsize, $padding) {
    font-size: $fontsize;
    padding: $padding;
  }

  @mixin button-state($font, $bg, $border, $boxshadow) {
    // color: map-get($font, "color");
    // @if map-deep-get($font, "type") == "fixed" {
    //   color: map-deep-get($font, "color");
    // }
    // color: $fontcolor;
    // background: $bgcolor;
    // border: $border;
    // box-shadow: $boxshadow;
  }

  button {
    // button-shape($radius)
    // button-size($fontsize, $padding)
    @include button-shape(var(--radius));
    @include button-size(var(--fontsize), var(--padding));

    &:focus {
      outline: 0;
    }
  }

  .default {
    // button-state($fontcolor, $bgcolor, $border, $boxshadow)
    @include button-state(
      map-deep-get($button, "type", "default", "normal", "font"),
      map-deep-get($button, "type", "default", "normal", "background"),
      map-deep-get($button, "type", "default", "normal", "border"),
      map-deep-get($button, "type", "default", "normal", "box-shadow")
    );

    &:hover {
      // button-state($fontcolor, $bgcolor, $border, $boxshadow)
      @include button-state(
        map-deep-get($button, "type", "default", "hover", "font-color"),
        map-deep-get($button, "type", "default", "hover", "background-color"),
        map-deep-get($button, "type", "default", "hover", "border"),
        map-deep-get($button, "type", "default", "hover", "box-shadow")
      );
    }

    &:active {
      // button-state($fontcolor, $bgcolor, $border, $boxshadow)
      @include button-state(
        map-deep-get($button, "type", "default", "pressed", "font-color"),
        map-deep-get($button, "type", "default", "pressed", "background-color"),
        map-deep-get($button, "type", "default", "pressed", "border"),
        map-deep-get($button, "type", "default", "pressed", "box-shadow")
      );
    }

    &:disabled {
      // button-state($fontcolor, $bgcolor, $border, $boxshadow)
      @include button-state(
        map-deep-get($button, "type", "default", "disabled", "font-color"),
        map-deep-get(
          $button,
          "type",
          "default",
          "disabled",
          "background-color"
        ),
        map-deep-get($button, "type", "default", "disabled", "border"),
        map-deep-get($button, "type", "default", "disabled", "box-shadow")
      );
    }
  }
</style>

<svelte:options tag="kt-button" />

<button use:cssVars={styleVars} class:default={type === 'default'} {disabled}>
  <slot />
</button>
