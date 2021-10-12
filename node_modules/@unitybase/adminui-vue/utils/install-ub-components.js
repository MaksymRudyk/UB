module.exports = {
  install (Vue) {
    // below we export and register each component separately to allow WebStorm IDE correctly recognize registered U* components
    const UFormContainer = require('../components/controls/UFormContainer.vue').default
    const USelectEntity = require('../components/controls/USelectEntity.vue').default
    const USelectMany = require('../components/controls/USelectMany.vue').default
    const UFormRow = require('../components/controls/UFormRow.vue').default
    const UCodeMirror = require('../components/controls/UCodeMirror.vue').default
    const USelectEnum = require('../components/controls/USelectEnum.vue').default
    const UInput = require('../components/controls/UInput/UInput.vue').default
    const UToolbar = require('../components/UToolbar/UToolbar.vue').default
    const UToolbarButton = require('../components/UToolbar/UToolbarButton.vue').default
    const UAutoField = require('../components/UAutoField.vue').default
    const USelectMultiple = require('../components/controls/USelectMultiple.vue').default
    const USelectCollection = require('../components/controls/USelectCollection.vue').default
    const UBaseInput = require('../components/controls/UBaseInput.vue').default
    const UTable = require('../components/controls/UTable/UTable.vue').default
    const UTableEntity = require('../components/UTableEntity/UTableEntity.vue').default
    const UIconPicker = require('../components/controls/UIconPicker.vue').default
    const UDropdown = require('../components/controls/UDropdown/UDropdown.vue').default
    const UDropdownItem = require('../components/controls/UDropdown/UDropdownItem.vue').default
    const UFile = require('../components/controls/UFile/UFile.vue').default
    const UFileMultiple = require('../components/controls/UFile/UFileMultiple.vue').default
    const UFileCollection = require('../components/controls/UFile/UFileCollection.vue').default
    const UFileInput = require('../components/controls/UFile/UFileInput.vue').default
    const UFileAddButton = require('../components/controls/UFile/buttons/UFileAddButton.vue').default
    const UFileDownloadButton = require('../components/controls/UFile/buttons/UFileDownloadButton.vue').default
    const UFileRemoveButton = require('../components/controls/UFile/buttons/UFileRemoveButton.vue').default
    const UFilePreviewButton = require('../components/controls/UFile/buttons/UFilePreviewButton.vue').default
    const UFileScanButton = require('../components/controls/UFile/buttons/UFileScanButton.vue').default
    const UFileScanSettingsButton = require('../components/controls/UFile/buttons/UFileScanSettingsButton.vue').default
    const UFileWebcamButton = require('../components/controls/UFile/buttons/UFileWebcamButton.vue').default
    const UFileFullscreenButton = require('../components/controls/UFile/buttons/UFileFullscreenButton.vue').default
    const SignatureVerificationResult = require('../components/SignatureVerificationResult.vue').default
    const UGrid = require('../components/controls/UGrid.vue').default
    const UMasterDetailView = require('../components/UMasterDetailView/UMasterDetailView.vue').default
    const UButton = require('../components/controls/UButton.vue').default
    const UIcon = require('../components/controls/UIcon.vue').default
    const UDatePicker = require('../components/controls/UDatePicker.vue').default
    const UButtonGroup = require('../components/controls/UButtonGroup.vue').default
    const UCrop = require('../components/controls/UCrop.vue').default
    Vue.component(UFormContainer.name, UFormContainer)
    Vue.component(USelectEntity.name, USelectEntity)
    Vue.component(USelectMany.name, USelectMany)
    Vue.component(UFormRow.name, UFormRow)
    Vue.component(UCodeMirror.name, UCodeMirror)
    Vue.component(USelectEnum.name, USelectEnum)
    Vue.component(UInput.name, UInput)
    Vue.component(UToolbar.name, UToolbar)
    Vue.component(UToolbarButton.name, UToolbarButton)
    Vue.component(UAutoField.name, UAutoField)
    Vue.component(USelectMultiple.name, USelectMultiple)
    Vue.component(USelectCollection.name, USelectCollection)
    Vue.component(UBaseInput.name, UBaseInput)
    Vue.component(UIconPicker.name, UIconPicker)
    Vue.component(UTableEntity.name, UTableEntity)
    Vue.component(UTable.name, UTable)
    Vue.component(UDropdown.name, UDropdown)
    Vue.component(UDropdownItem.name, UDropdownItem)
    Vue.component(UFile.name, UFile)
    Vue.component(UFileMultiple.name, UFileMultiple)
    Vue.component(UFileCollection.name, UFileCollection)
    Vue.component(UFileInput.name, UFileInput)
    Vue.component(UFileAddButton.name, UFileAddButton)
    Vue.component(UFileDownloadButton.name, UFileDownloadButton)
    Vue.component(UFileRemoveButton.name, UFileRemoveButton)
    Vue.component(UFilePreviewButton.name, UFilePreviewButton)
    Vue.component(UFileScanButton.name, UFileScanButton)
    Vue.component(UFileScanSettingsButton.name, UFileScanSettingsButton)
    Vue.component(UFileWebcamButton.name, UFileWebcamButton)
    Vue.component(UFileFullscreenButton.name, UFileFullscreenButton)
    Vue.component(SignatureVerificationResult.name, SignatureVerificationResult)
    Vue.component(UGrid.name, UGrid)
    Vue.component(UMasterDetailView.name, UMasterDetailView)
    Vue.component(UButton.name, UButton)
    Vue.component(UIcon.name, UIcon)
    Vue.component(UDatePicker.name, UDatePicker)
    Vue.component(UButtonGroup.name, UButtonGroup)
    Vue.component(UCrop.name, UCrop)

    const HoldFocus = require('../directives/HoldFocus')
    Vue.directive(HoldFocus.name, HoldFocus)

    // dirty hack to retrieve a Clickoutside directive not exposed by Elements
    const Clickoutside = Vue.options.components.ElDropdown.options.directives.Clickoutside
    Vue.directive('Clickoutside', Clickoutside)
  }
}
