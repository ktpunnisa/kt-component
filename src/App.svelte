<script type="text/javascript">
  import "./components/Button/button.svelte";
  import "./components/Link/Link.svelte";
  import "./components/Palette/palette.svelte";
  import "./components/Input/Input.svelte";

  let value = "test";

  function handleValue(event) {
    value = event.detail.value;
  }
</script>

<style type="text/scss" lang="scss">
  h1 {
    color: black;
  }
  .row {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 0 auto;
  }

  kt-button,
  kt-input {
    margin: 4px;
  }

  .input-display {
    width: 50%;
  }
</style>

<svelte:options tag="kt-component" />

<h1>kt-component</h1>

<h2>Color</h2>
<div class="row">
  <kt-palette color="primary" />
  <kt-palette color="secondary" />
  <kt-palette color="success" />
  <kt-palette color="info" />
  <kt-palette color="warning" />
  <kt-palette color="danger" />
</div>

<div class="row">
  <kt-palette color="white" />
  <kt-palette color="gray" />
  <kt-palette color="black" />
  <!-- <kt-palette color="#8E44AD" shade="dark" opacity="0.2" /> -->
</div>

<h2>Color shade</h2>

<div class="row">
  <kt-palette color="primary" shade="lightest" />
  <kt-palette color="primary" shade="lighter" />
  <kt-palette color="primary" shade="light" />
  <kt-palette color="primary" />
  <kt-palette color="primary" shade="dark" />
  <kt-palette color="primary" shade="darker" />
</div>

<div class="row">
  <kt-palette color="secondary" shade="lightest" />
  <kt-palette color="secondary" shade="lighter" />
  <kt-palette color="secondary" shade="light" />
  <kt-palette color="secondary" />
  <kt-palette color="secondary" shade="dark" />
  <kt-palette color="secondary" shade="darker" />
</div>

<div class="row">
  <kt-palette color="success" shade="lightest" />
  <kt-palette color="success" shade="lighter" />
  <kt-palette color="success" shade="light" />
  <kt-palette color="success" />
  <kt-palette color="success" shade="dark" />
  <kt-palette color="success" shade="darker" />
</div>

<div class="row">
  <kt-palette color="info" shade="lightest" />
  <kt-palette color="info" shade="lighter" />
  <kt-palette color="info" shade="light" />
  <kt-palette color="info" />
  <kt-palette color="info" shade="dark" />
  <kt-palette color="info" shade="darker" />
</div>

<div class="row">
  <kt-palette color="warning" shade="lightest" />
  <kt-palette color="warning" shade="lighter" />
  <kt-palette color="warning" shade="light" />
  <kt-palette color="warning" />
  <kt-palette color="warning" shade="dark" />
  <kt-palette color="warning" shade="darker" />
</div>

<div class="row">
  <kt-palette color="danger" shade="lightest" />
  <kt-palette color="danger" shade="lighter" />
  <kt-palette color="danger" shade="light" />
  <kt-palette color="danger" />
  <kt-palette color="danger" shade="dark" />
  <kt-palette color="danger" shade="darker" />
</div>

<div class="row">
  <kt-palette color="gray" shade="lightest" />
  <kt-palette color="gray" shade="lighter" />
  <kt-palette color="gray" shade="light" />
  <kt-palette color="gray" />
  <kt-palette color="gray" shade="dark" />
  <kt-palette color="gray" shade="darker" />
</div>

<h2>button shape</h2>
<div class="row">
  <kt-button>default button</kt-button>
  <kt-button disabled="true">disabled button</kt-button>
  <!-- <kt-button
    size="custom"
    fontsize="20"
    radius="20"
    pt="16"
    pr="24"
    pb="16"
    pl="24"
    color="#8E44AD">
    custom button
  </kt-button> -->
</div>

<div class="row">
  <kt-button size="small">small button</kt-button>
  <kt-button size="medium">medium button</kt-button>
  <kt-button size="large">large button</kt-button>
</div>

<div class="row">
  <kt-button type="default">default button</kt-button>
  <kt-button type="outline">outline button</kt-button>
  <kt-button type="ghost">ghost button</kt-button>
</div>

<div class="row">
  <kt-button type="default" color="info" size="small" disabled="true">
    default button
  </kt-button>
  <kt-button type="outline" color="info" size="small" disabled="true">
    outline button
  </kt-button>
  <kt-button type="ghost" color="info" size="small" disabled="true">
    ghost button
  </kt-button>
</div>

<h2>Link</h2>
<kt-link color="info" size="small">Click me</kt-link>
<kt-link color="info" size="medium">Click me</kt-link>
<kt-link color="info" size="large">Click me</kt-link>
<kt-link href="https://www.facebook.com/ktpunnisa" type="nav" size="large">
  Header line
</kt-link>

<h2>Input</h2>

<div class="input-display">
  <kt-input label="name" placeholder="name" {value} on:change={handleValue} />
  <kt-input label="name" placeholder="name" disabled="true" />
  <kt-input
    label="name"
    placeholder="name"
    {value}
    error="true"
    on:change={handleValue} />
</div>
<div class="row">
  <kt-input label="name" placeholder="name" {value} on:change={handleValue} />
  <kt-input
    label="name"
    placeholder="name"
    disabled="true"
    on:change={handleValue} />
  <kt-input
    label="name"
    placeholder="name"
    {value}
    error="true"
    on:change={handleValue} />
</div>

<div class="row">
  <kt-input label="name" placeholder="name" size="small" />
  <kt-input label="name" placeholder="name" size="medium" />
  <kt-input label="name" placeholder="name" size="large" />
</div>
{value}
<h2>----------</h2>
