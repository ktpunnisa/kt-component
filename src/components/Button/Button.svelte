<script>
  export let name = "ktpunnisa";
  export let bgcolor = "pink";
  export let fontcolor = "black";
  export let padding = "4";
</script>

<style type="text/scss" lang="scss">
  button {
    background-color: var(--bgColor);
    color: var(--fontColor);
    padding: var(--padding);
  }
</style>

<svelte:options tag="my-button" />

<button
  style="--bgColor: {bgcolor}; --fontColor: {fontcolor}; --padding: {padding}px">
  {name}
</button>
