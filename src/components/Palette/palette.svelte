<script>
  import cssVars from "../../svelte-css-vars.js";
  export let width = "100";
  export let height = "40";
  export let radius = "8";
  export let color = "primary";
  export let colorcode = "#5c80ff";
  export let shade = "light";
  export let opacity = "30%";
  $: styleVars = {
    width: `${width}px`,
    height: `${height}px`,
    radius: `${radius}px`,
    color,
    colorcode,
    shade,
    opacity
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
  }
  .primary-lightest {
    background-color: color-shade("primary", "lightest");
  }
  .primary-lighter {
    background-color: color-shade("primary", "lighter");
  }
  .primary-light {
    background-color: color-shade("primary", "light");
  }
  .primary {
    background-color: color-shade("primary", "default");
  }
  .primary-dark {
    background-color: color-shade("primary", "dark");
  }
  .primary-darker {
    background-color: color-shade("primary", "darker");
  }
  /* -------------------------------------------------------- */
  .secondary-lightest {
    background-color: color-shade("secondary", "lightest");
  }
  .secondary-lighter {
    background-color: color-shade("secondary", "lighter");
  }
  .secondary-light {
    background-color: color-shade("secondary", "light");
  }
  .secondary {
    background-color: color-shade("secondary", "default");
  }
  .secondary-dark {
    background-color: color-shade("secondary", "dark");
  }
  .secondary-darker {
    background-color: color-shade("secondary", "darker");
  }
  /* -------------------------------------------------------- */
  .success-lightest {
    background-color: color-shade("success", "lightest");
  }
  .success-lighter {
    background-color: color-shade("success", "lighter");
  }
  .success-light {
    background-color: color-shade("success", "light");
  }
  .success {
    background-color: color-shade("success", "default");
  }
  .success-dark {
    background-color: color-shade("success", "dark");
  }
  .success-darker {
    background-color: color-shade("success", "darker");
  }
  /* -------------------------------------------------------- */
  .info-lightest {
    background-color: color-shade("info", "lightest");
  }
  .info-lighter {
    background-color: color-shade("info", "lighter");
  }
  .info-light {
    background-color: color-shade("info", "light");
  }
  .info {
    background-color: color-shade("info", "default");
  }
  .info-dark {
    background-color: color-shade("info", "dark");
  }
  .info-darker {
    background-color: color-shade("info", "darker");
  }
  /* -------------------------------------------------------- */
  .warning-lightest {
    background-color: color-shade("warning", "lightest");
  }
  .warning-lighter {
    background-color: color-shade("warning", "lighter");
  }
  .warning-light {
    background-color: color-shade("warning", "light");
  }
  .warning {
    background-color: color-shade("warning", "default");
  }
  .warning-dark {
    background-color: color-shade("warning", "dark");
  }
  .warning-darker {
    background-color: color-shade("warning", "darker");
  }
  /* -------------------------------------------------------- */
  .danger-lightest {
    background-color: color-shade("danger", "lightest");
  }
  .danger-lighter {
    background-color: color-shade("danger", "lighter");
  }
  .danger-light {
    background-color: color-shade("danger", "light");
  }
  .danger {
    background-color: color-shade("danger", "default");
  }
  .danger-dark {
    background-color: color-shade("danger", "dark");
  }
  .danger-darker {
    background-color: color-shade("danger", "darker");
  }
  /* -------------------------------------------------------- */
  .white {
    background-color: color-shade("white", "default");
  }
  /* -------------------------------------------------------- */
  .gray-lightest {
    background-color: color-shade("gray", "lightest");
  }
  .gray-lighter {
    background-color: color-shade("gray", "lighter");
  }
  .gray-light {
    background-color: color-shade("gray", "light");
  }
  .gray {
    background-color: color-shade("gray", "default");
  }
  .gray-dark {
    background-color: color-shade("gray", "dark");
  }
  .gray-darker {
    background-color: color-shade("gray", "darker");
  }
  /* -------------------------------------------------------- */
  .black {
    background-color: color-shade("black", "default");
  }
  /* -------------------------------------------------------- */
  .custom {
    // background-color: custom-color-shade(
    //   var(--colorcode),
    //   var(--shade),
    //   var(--opacity)
    // );
    background-color: custom-color-shade(#5c80ff, light, 30%);
  }
</style>

<svelte:options tag="kt-palette" />
<div
  use:cssVars={styleVars}
  class:primary-lightest={color === 'primaryLightest'}
  class:primary-lighter={color === 'primaryLighter'}
  class:primary-light={color === 'primaryLight'}
  class:primary={color === 'primary'}
  class:primary-dark={color === 'primaryDark'}
  class:primary-darker={color === 'primaryDarker'}
  class:secondary-lightest={color === 'secondaryLightest'}
  class:secondary-lighter={color === 'secondaryLighter'}
  class:secondary-light={color === 'secondaryLight'}
  class:secondary={color === 'secondary'}
  class:secondary-dark={color === 'secondaryDark'}
  class:secondary-darker={color === 'secondaryDarker'}
  class:success-lightest={color === 'successLightest'}
  class:success-lighter={color === 'successLighter'}
  class:success-light={color === 'successLight'}
  class:success={color === 'success'}
  class:success-dark={color === 'successDark'}
  class:success-darker={color === 'successDarker'}
  class:info-lightest={color === 'infoLightest'}
  class:info-lighter={color === 'infoLighter'}
  class:info-light={color === 'infoLight'}
  class:info={color === 'info'}
  class:info-dark={color === 'infoDark'}
  class:info-darker={color === 'infoDarker'}
  class:warning-lightest={color === 'warningLightest'}
  class:warning-lighter={color === 'warningLighter'}
  class:warning-light={color === 'warningLight'}
  class:warning={color === 'warning'}
  class:warning-dark={color === 'warningDark'}
  class:warning-darker={color === 'warningDarker'}
  class:danger-lightest={color === 'dangerLightest'}
  class:danger-lighter={color === 'dangerLighter'}
  class:danger-light={color === 'dangerLight'}
  class:danger={color === 'danger'}
  class:danger-dark={color === 'dangerDark'}
  class:danger-darker={color === 'dangerDarker'}
  class:white={color === 'white'}
  class:gray-lightest={color === 'grayLightest'}
  class:gray-lighter={color === 'grayLighter'}
  class:gray-light={color === 'grayLight'}
  class:gray={color === 'gray'}
  class:gray-dark={color === 'grayDark'}
  class:gray-darker={color === 'grayDarker'}
  class:black={color === 'black'}
  class:custom={color === 'custom'} />
