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

<svelte:options tag="kt-component" />

<h1>kt-component</h1>
<my-link {name} url="https://www.facebook.com/ktpunnisa" />
<my-button {name} bgcolor="blue" fontcolor="white" />
