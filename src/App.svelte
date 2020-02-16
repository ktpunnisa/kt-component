<script type="text/javascript">
  export let name = "ktpunnisa";
  import "./components/Button/Button.svelte";
  import "./components/Link/Link.svelte";
</script>

<style type="text/scss" lang="scss">
  @import "./styles/theme.scss";

  h1 {
    color: $main-color;
  }

  div {
    background: green;

    > p {
      color: #fff;
    }
  }
</style>

<svelte:options tag="kt-app" />

<h1>{name}</h1>
<my-link name="svelte" url="https://svelte.dev/" />
<div>
  <p>SASS is working!</p>
</div>
<my-button {name} bgcolor="blue" fontcolor="white" />
