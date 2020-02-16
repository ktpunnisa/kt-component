<script>
  export let name = "ktpunnisa";
  export let bgcolor = "pink";
  export let fontcolor = "black";
</script>

<style type="text/scss" lang="scss">
  button {
    background-color: var(--bgColor);
    color: var(--fontColor);
  }
</style>

<svelte:options tag="my-button" />

<button style="--bgColor: {bgcolor}; --fontColor: {fontcolor}">{name}</button>
