There are two ways to define form validation:
1. General global validation using `Form.validation(...)` block, which configures validation using entity metadata,
   such as `notNull` attribute properties.
   It is possible to override or extent these rules with a validation config parameter.
   This config should be a standard Vue object definition-like with `validations` section.
2. Component-level validation added by `validationMixin`. This validation in the `validations` section of the component.
   This could be useful for validating various popup child dialog of the form.
   The `validationMixin` mixin adds `validator` property to the component. This is an object with useful methods:
   
   - `getValidationState`: returns the current state of validation;
   - `getAttributeCaption`: returns caption by attribute name;
   - `getErrorForAttribute`: returns error text for some first failed validation rule of the attribute;
   - `getIsAttributeRequired`: returns boolean if the attribute has the required rule in the configured validation;
   - `validateForm`: validates form data with the Vuelidate help.
  
   Also, `validationMixin` provides this validator for nested components.

In both cases, form components get access to validation configuration by injecting `validator` object.

Example: *parent-component.vue*
```html
<template>
  <child-component />
</template>
<script>
const { validationMixin } = require('@unitybase/adminui-vue')
const { between } = require('vuelidate/lib/validators')

export default {
  mixins: [
    validationMixin
  ],
  ...,
  validations() {
    return {
      customAttr: {
        between: between(1, 67)
      },
      ...
    }
  }
}
</script>
```

*child-component.vue*
```html
<template>
  <div>
    Error text for customAttr: {{ customAttrError }}
  </div>
</template>
<script>
export default {
  inject: [
    'validator'
  ],

  ...

  computed: {
    ...,
    customAttrError() {
      return this.validator.getErrorForAttribute('customAttr')
    }
  },

  methods: {
    apply() {
      // validate from data before some action
      this.validator.validateForm({showErrorModal: false})
      this.run(...)
    }
  }
}
</script>
```

## Custom rules, custom error text

The `UFormRow` control is integrated with validation mechanism and automatically displays validation error message
for its attribute, using the `validator` object.

To provide custom error message to `UFormRow` or any other component which may need it, define custom validation rules
using the `formHelpers.validateWithErrorText` method.
This method adds `$errorText` parameter for the provided validation rule, so that it will be available for components
like `UFormRow`.

Example:
```html
<template>
  <div>
    <u-form-row
      label="document_form.regNumber"
      attribute-name="regNumber"
    >
      <u-base-input v-model="regNumber" />
    </u-form-row>

    <u-form-row
      label="document_form.systemConfig"
      attribute-name="systemConfig"
    >
      ...
    </u-form-row>
  </div>
</template>

<script>
const { validationMixin, formHelpers } = require('@unitybase/adminui-vue')

export default {
  mixins: [
    validationMixin
  ],

  data () {
    return {
      regNumber: null,
      systemConfig: null
    }
  },

  validations() {
    return {
      regNumber: {
        unique: formHelpers.validateWithErrorText(
          'validation_errors.uniqueRegNumber',

          value => !this.documents.some(doc => doc.regNumber === value)
        )
      },

      systemConfig: {
        json: formHelpers.validateWithErrorText(
          'validation_errors.json',

          value => {
            try {
              JSON.parse(value)
              return true
            } catch (e) {
              return false
            }
          }
        )
      }
    }
  }
}
</script>
```

## Caption for custom attributes

When there are validation errors on a form, and the form cannot be saved, an error message is shown,
where invalid attributes are specified, so that user knows which values to fix.

In most of cases, form validates entity attributes, so entity attribute captions are good to point
which attributes are with invalid values.

But when a custom value validated, which is not an attribute of the form entity, the `attributeCaptions`
section should be used.

This can be an object or function (reactive and dynamic) property.  It is possible to define captions for non-entity
attributes as well as override entity ones.

As a bonus, these captions are used by `UFormRow` to display control label, the `attribute-name` property allows to
get the label, so there is no need to define the same label in two places.

Example:
```js
module.exports.mount = cfg => {
   Form(cfg)
     .processing()
     .validation({
        // other config options goes here,
   
        attributeCaptions () {
           return {
              customAttribute1: 'some.i18n.key.for.customAttribute1',
   
              complexField: {
                 nestedAttribute1: 'some.i18n.key.for.nestedAttribute1',
              }
           }
        }
     })
     .mount()
}
```

## Example of defining some complex validation

```javascript
const { formHelpers } = require('@unitybase/adminui-vue')
const { required, between } = require('vuelidate/lib/validators/index')

const json = formHelpers.validateWithErrorText(
  'validation_errors.json',

  value => {
    try {
      JSON.parse(value)
      return true
    } catch (e) {
      return false
    }
  }
)

module.exports.mount = cfg => {
  Form(cfg)
    .processing()
    .validation({
      computed: {
        ...mapInstanceFields([
          'code',
          'name',
          'someNumber'
        ]),

        dynamicField () {
          return this.$store.state.dynamicField
        }

        processVariables () {
          return this.$store.state.processVariables
        }
      },

      validations () {
        return {
          code: {
            code
          },

          name: {
            required
          },

          someNumber: {
            required,
            between: between(20, 30)
          },

          // define rules for nested validation
          processVariables: {
            emailConfig: {
              json
            },

            objectID: {
              required
            }
          },

          // dynamic part of validation
          ...(this.someNumber > 25
            ? { dynamicField: { required } }
            : {}
          )
        }
      },

      // define captions for non-entity attributes for displaying in error modal
      attributeCaptions() {
       return {
         dynamicField: 'some.i18n.key.for.dynamicField',

         processVariables: {
           emailConfig: 'some.i18n.key.for.processVariables.emailConfig',
           objectID: 'some.i18n.key.for.processVariables.objectID'
         }
       }
      }
    })
    .mount()
}
```

## Example of use of configured rules error texts and attribute captions

```html
<template>
  <!-- error automatically be taken from `$v.name.$params[<firstInvalidParam>].$errorText` -->
  <!-- label automatically be taken from customAttributes or calculated as i18n(`${this.entity}.${this.attributeName}`) -->
  <!-- required automatically calculated if `required` rule is defined for `$v.name` -->
  <u-form-row
    attribute-name="name"
  />

  <!-- overrided default label -->
  <u-form-row
    attribute-name="name"
    label="custom"
  />

  <!-- overrided displayed error -->
  <u-form-row
    attribute-name="name"
    :error="someComputedError"
    required
  />

  <!-- overrided required prop -->
  <u-form-row
    attribute-name="name"
    required
  />

  <!-- to get error message for form can be used validator.getErrorForAttribute(...) method -->
  <u-form-row
    :label="$ut('bpm_Process_form.emailConfig')"
    :error="validator.getErrorForAttribute('email.config.email')"
    required
  />
</template>
```
