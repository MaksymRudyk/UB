### Basic usage
  ```vue
  <template>
    <u-file
      entity-name="req_request"
      attribute-name="document"
      v-model="document"
    />
  </template>
  <script>
    const {mapInstanceFields} = require('@unitybase/adminui-vue')

    export default {
      computed: mapInstanceFields(['document'])
    }
  </script>
  ```

  ### Disabled
  ```vue
  <template>
    <u-file
      entity-name="req_request"
      attribute-name="document"
      disabled
      v-model="document"
    />
  </template>
  <script>
    const {mapInstanceFields} = require('@unitybase/adminui-vue')

    export default {
      computed: mapInstanceFields(['document'])
    }
  </script>
  ```

  ### Preview mode
  ```vue
  <template>
    <u-file
      entity-name="req_request"
      attribute-name="document"
      preview-mode
      v-model="document"
    />
  </template>
  <script>
    const {mapInstanceFields} = require('@unitybase/adminui-vue')

    export default {
      computed: mapInstanceFields(['document'])
    }
  </script>
  ```

  ### Preview mode with size
  ```vue
  <template>
    <u-file
      entity-name="req_request"
      :preview-mode="{
        height: 400,
        width: 300
      }"
      attribute-name="document"
      v-model="document"
    />
  </template>
  <script>
    const {mapInstanceFields} = require('@unitybase/adminui-vue')

    export default {
      computed: mapInstanceFields(['document'])
    }
  </script>
  ```

  ### Custom additional button
  ```vue
  <template>
    <u-file
      entity-name="req_request"
      v-model="document"
      attribute-name="document"
    >
      <u-button
        appearance="inverse"
        icon="u-icon-send"
      >
        Test
      </u-button>
    </u-file>
  </template>
  <script>
    const {mapInstanceFields} = require('@unitybase/adminui-vue')

    export default {
      computed: mapInstanceFields(['document'])
    }
  </script>
  ```

  ### Remove default buttons

  ```vue
  <template>
    <u-file
      entity-name="req_request"
      v-model="document"
      attribute-name="document"
      remove-default-buttons
    />
  </template>
  <script>
    const {mapInstanceFields} = require('@unitybase/adminui-vue')

    export default {
      computed: mapInstanceFields(['document'])
    }
  </script>
  ```

  To remove one or few buttons pass array with buttons names
  Buttons names:
   - add
   - webcam
   - scan
   - scanSettings
   - download
   - remove
   - preview
   - fullscreen

  ```vue
  <template>
    <u-file
      entity-name="req_request"
      v-model="document"
      attribute-name="document"
      :remove-default-buttons="['add', 'preview']"
    />
  </template>
  <script>
    const {mapInstanceFields} = require('@unitybase/adminui-vue')

    export default {
      computed: mapInstanceFields(['document'])
    }
  </script>
  ```
