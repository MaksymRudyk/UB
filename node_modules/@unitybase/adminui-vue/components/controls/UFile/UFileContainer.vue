<template>
  <div class="u-file-container">
    <!-- disable click outside input in case UFile wrapped in UFormRow -->
    <button class="u-file__fake-button"/>
    <div class="u-file-container__toolbar">
      <slot name="toolbar" />
    </div>
    <div class="u-file-container__view">
      <slot name="view" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'UFileContainer'
}
</script>

<style>
  .u-file-container {
    border: 1px solid hsl(var(--hs-border), var(--l-layout-border-default));
    border-radius: var(--border-radius);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .u-file-container__toolbar {
    padding: 4px;
    border-bottom: 1px solid hsl(var(--hs-border), var(--l-layout-border-default));
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }

  .u-file-container__view {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
  }

  .u-file__fake-button {
    display: none;
  }
</style>
