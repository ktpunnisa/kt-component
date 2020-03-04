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
</style>

<svelte:options tag="kt-component" />

<h1>kt-component</h1>
<!-- <my-link url="https://www.facebook.com/ktpunnisa">{name}</my-link>s -->
<!-- <my-button {name} bgcolor="red" fontcolor="white" padding="12" /> -->
<!-- <my-button big="true">{name}</my-button>
<my-button ghost>{name}</my-button>
<my-button ghost="true">{name}</my-button> -->
<!-- <my-button>read more</my-button> -->

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
  <kt-palette color="custom" colorcode="red" shade="dark" shadeamount="30%" />
</div>

<h2>Color shade</h2>
<div class="palette">
  <kt-palette color="primaryLightest" />
  <kt-palette color="primaryLighter" />
  <kt-palette color="primaryLight" />
  <kt-palette color="primary" />
  <kt-palette color="primaryDark" />
  <kt-palette color="primaryDarker" />
</div>

<div class="palette">
  <kt-palette color="secondaryLightest" />
  <kt-palette color="secondaryLighter" />
  <kt-palette color="secondaryLight" />
  <kt-palette color="secondary" />
  <kt-palette color="secondaryDark" />
  <kt-palette color="secondaryDarker" />
</div>

<div class="palette">
  <kt-palette color="successLightest" />
  <kt-palette color="successLighter" />
  <kt-palette color="successLight" />
  <kt-palette color="success" />
  <kt-palette color="successDark" />
  <kt-palette color="successDarker" />
</div>

<div class="palette">
  <kt-palette color="infoLightest" />
  <kt-palette color="infoLighter" />
  <kt-palette color="infoLight" />
  <kt-palette color="info" />
  <kt-palette color="infoDark" />
  <kt-palette color="infoDarker" />
</div>

<div class="palette">
  <kt-palette color="warningLightest" />
  <kt-palette color="warningLighter" />
  <kt-palette color="warningLight" />
  <kt-palette color="warning" />
  <kt-palette color="warningDark" />
  <kt-palette color="warningDarker" />
</div>

<div class="palette">
  <kt-palette color="dangerLightest" />
  <kt-palette color="dangerLighter" />
  <kt-palette color="dangerLight" />
  <kt-palette color="danger" />
  <kt-palette color="dangerDark" />
  <kt-palette color="dangerDarker" />
</div>

<div class="palette">
  <kt-palette color="grayLightest" />
  <kt-palette color="grayLighter" />
  <kt-palette color="grayLight" />
  <kt-palette color="gray" />
  <kt-palette color="grayDark" />
  <kt-palette color="grayDarker" />
</div>

<h2>button shape</h2>
<kt-button>default button</kt-button>
<kt-button disabled="true">disabled button</kt-button>
<kt-button size="small">small button</kt-button>
<kt-button size="medium">medium button</kt-button>
<kt-button size="large">large button</kt-button>
<kt-button
  size="custom"
  fontsize="20"
  radius="20"
  pt="16"
  pr="28"
  pb="16"
  pl="28">
  custom button
</kt-button>

<h2>----------</h2>
