<script>
  // export let name = "ktpunnisa";
  // export let bgcolor = "pink";
  // export let fontcolor = "black";
  // export let padding = "4";
  export let big = false;
  export let ghost = false;
  export let type = "filled";
  export let color = "success";
  export let size = "medium";
  export let fontcolor = "white";
</script>

<style type="text/scss" lang="scss">
  @import "../../styles/theme.scss";
  @use "sass:meta";

  button {
    padding: 0.5rem;
    background: map-get($colors, primary);
    color: var(--fontcolor);
    .primary {
      color: map-get($colors, primary);
    }
    .success {
      color: map-get($colors, success);
    }
    .error {
      color: map-get($colors, error);
    }
  }

  // .primary {
  //   background: $color-primary
  //   border-color: $color-primary;
  //   color: #fff;
  // }
  // .primary:active {
  //   background: dodgerblue;
  // }
  // .success {
  //   background: $color-success;
  //   border-color: $color-success;
  //   color: #fff;
  // }
  // .success:active {
  //   background: lime;
  // }
</style>

<svelte:options tag="my-button" />

<!-- <button
  style="--bgColor: {bgcolor}; --fontColor: {fontcolor}; --padding: {padding}px">
  {name}
</button> -->

<!-- <button
  class="button"
  class:primary={color === 'primary'}
  class:success={color === 'success'}>
  <slot />
</button> -->

<button style="--color: {color}; --fontcolor: {fontcolor}">
  <slot />
</button>
