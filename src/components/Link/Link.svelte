<script>
  export let fontcolor = "blue";
  export let url = "https://www.facebook.com/ktpunnisa";
</script>

<style type="text/scss" lang="scss">
  a {
    color: var(--fontColor);
  }
</style>

<svelte:options tag="my-link" />

<a href={url} style="--fontColor: {fontcolor}">
  <slot />
</a>
