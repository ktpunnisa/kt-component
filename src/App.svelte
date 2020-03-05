<script type="text/javascript">
  import "./components/Button/button.svelte";
  import "./components/Link/Link.svelte";
  import "./components/Palette/palette.svelte";
</script>

<style type="text/scss" lang="scss">
  @import "./styles/theme.scss";

  h1 {
    color: black;
  }
  .palette {
    display: flex;
    flex-direction: row;
  }

  kt-button {
    margin: 4px;
  }
</style>

<svelte:options tag="kt-component" />

<h1>kt-component</h1>
<!-- <my-link url="https://www.facebook.com/ktpunnisa">{name}</my-link>s -->

<h2>Color</h2>
<div class="palette">
  <kt-palette color="primary" />
  <kt-palette color="secondary" />
  <kt-palette color="success" />
  <kt-palette color="info" />
  <kt-palette color="warning" />
  <kt-palette color="danger" />
</div>

<div class="palette">
  <kt-palette color="white" />
  <kt-palette color="gray" />
  <kt-palette color="black" />
  <kt-palette color="custom" colorcode="#8528CE" shade="light" opacity="0.3" />
</div>

<h2>Color shade</h2>

<div class="palette">
  <kt-palette color="primary" shade="lightest" />
  <kt-palette color="primary" shade="lighter" />
  <kt-palette color="primary" shade="light" />
  <kt-palette color="primary" />
  <kt-palette color="primary" shade="dark" />
  <kt-palette color="primary" shade="darker" />
</div>

<div class="palette">
  <kt-palette color="secondary" shade="lightest" />
  <kt-palette color="secondary" shade="lighter" />
  <kt-palette color="secondary" shade="light" />
  <kt-palette color="secondary" />
  <kt-palette color="secondary" shade="dark" />
  <kt-palette color="secondary" shade="darker" />
</div>

<div class="palette">
  <kt-palette color="success" shade="lightest" />
  <kt-palette color="success" shade="lighter" />
  <kt-palette color="success" shade="light" />
  <kt-palette color="success" />
  <kt-palette color="success" shade="dark" />
  <kt-palette color="success" shade="darker" />
</div>

<div class="palette">
  <kt-palette color="info" shade="lightest" />
  <kt-palette color="info" shade="lighter" />
  <kt-palette color="info" shade="light" />
  <kt-palette color="info" />
  <kt-palette color="info" shade="dark" />
  <kt-palette color="info" shade="darker" />
</div>

<div class="palette">
  <kt-palette color="warning" shade="lightest" />
  <kt-palette color="warning" shade="lighter" />
  <kt-palette color="warning" shade="light" />
  <kt-palette color="warning" />
  <kt-palette color="warning" shade="dark" />
  <kt-palette color="warning" shade="darker" />
</div>

<div class="palette">
  <kt-palette color="danger" shade="lightest" />
  <kt-palette color="danger" shade="lighter" />
  <kt-palette color="danger" shade="light" />
  <kt-palette color="danger" />
  <kt-palette color="danger" shade="dark" />
  <kt-palette color="danger" shade="darker" />
</div>

<div class="palette">
  <kt-palette color="gray" shade="lightest" />
  <kt-palette color="gray" shade="lighter" />
  <kt-palette color="gray" shade="light" />
  <kt-palette color="gray" />
  <kt-palette color="gray" shade="dark" />
  <kt-palette color="gray" shade="darker" />
</div>

<h2>button shape</h2>
<kt-button>default button</kt-button>
<kt-button disabled="true">disabled button</kt-button>
<kt-button size="small">small button</kt-button>
<kt-button size="medium">medium button</kt-button>
<kt-button size="large">large button</kt-button>
<kt-button size="custom" fontsize="20px" radius="20px" padding="20px 24px">
  custom button
</kt-button>

<h2>----------</h2>
