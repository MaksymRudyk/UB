UB.i18nExtend({
  "NMInstallExtensionFirefox": "<p>To use this application Firefox extension <b>\"UBExtension\"</b> must be installed.</p> " +
    "<p>Follow <a href=\"https://addons.mozilla.org/addon/ub-extension/\" target=\"_blank\">ADD EXTENSION</a> " +
    " to go to the Firefox add-ons</p>" +
    "<p> At the add-on window click button <b>+Add to Firefox</b></p>" +
    "<p>Confirm adding a new extension.</p>" +
    "<p>After installing the extension <b>restart your browser!</b></p>",
  "NMInstallExtensionChrome": "<p>To use this application Chrome extension <b>\"UBExtension\"</b> must be installed.</p> " +
    "<p>Follow <a href=\"https://chrome.google.com/webstore/detail/ubextension/{3}\" target=\"_blank\">ADD EXTENSION</a> " +
    " to go to the Google store</p>" +
    "<p> At the store windows click button <img src=\"models/adminui-pub/ub-extension/ChromePlusFreeEn.png\"/> (may be <b>+FREE</b>)</p>" +
    "<p>When window with confirmation for extension installation - click \"Add\".</p>" +
    "<p>Extension will be installed and button <b>+FREE</b> changes his color to green: <img src=\"models/adminui-pub/ub-extension/ChromeAddedEn.png\"/> " +
    "<p>After installing the extension <b>restart your browser!</b></p>",
  "NMInstallExtensionOpera": "<p>To use this application Opera extension <b>\"UBExtension\"</b> must be installed.</p> " +
    "<p>Follow <a href=\"models/adminui-pub/ub-extension/UBExtension.crx\" target=\"_blank\">DOWNLOAD EXTENSION</a> link.</p>" +
    "<p>After extension is downloaded you can see \"unknown source\" warning in the upper part of your Opera browser. " +
    "Press \"Go\" button on the message bar - Opera open extension page. On this page you must found \"UBExtension\" and press \"Install\" button twice</p> " +
    "<p>After this installation is complete and better to restart your browser.</p>",
  "NMUpdateExtensionChrome": "<p>To continue you need to update your browser<b>{0}</b> up to version <i>{2}</i>.</p> " +
    "<p>Usually Google Chrome updating extensions automatically. Try to close/open browser. " +
    " For manually updating go to the Google store<a href=\"https://chrome.google.com/webstore/detail/ubextension/{3}\" target=\"_blank\">and follow this link</a> </p>",
  "NMUpdateExtensionOpera": "<p>The new version <i>{2}</i> of the <b>{0}</b> is available and should be installed.</p> " +
    "Read <a href=\"models/adminui-pub/ub-extension/extensionUpdateInstructionOpera.html\" target=\"_blank\">update instruction</a> " +
    " and follow <a href=\"https://chrome.google.com/webstore/detail/ubextension/{3}\" target=\"_blank\">UPDATE</a>. <p>After update is complete - restart your browser.</p>",
  "NMInstallFeature": "<p>To use this feature <b>{0}</b> must be installed.</p> " +
    "<p>Follow <a href=\"{3}\" target=\"_blank\">DOWNLOAD SETUP</a>. After download is complete, run the install and follow the prompts.</p>" +
    "<p>After the installation is complete, restart your browser.</p>",
  "NMUpdateFeature": "<p>The new version <i>{1}</i> of the application <b>{0}</b> is available and should be installed.</p> " +
    "<p>Follow <a href=\"{3}\" target=\"_blank\">DOWNLOAD UPDATE SETUP</a>. After the download is complete, run the install and follow the prompts.</p>" +
    "<p>After the update is complete, restart your browser.</p>"
})

if (typeof Ext !== 'undefined') {
  Ext.onReady(function () {
    if (Ext.util.Format) {
      Ext.apply(Ext.util.Format, {
        dateFormat: 'm/d/Y',
        timeFormat: 'H:i:s',
        datetimeFormat: 'm/d/Y H:i'
      })
    }
    Ext.define('Ext.uk.ux.DateTimePicker', {
      override: 'Ext.ux.DateTimePicker',
      todayText: 'Now',
      timeLabel: 'Time'
    })

    if (Ext.MessageBox) {
      Ext.MessageBox.buttonText = {
        ok: 'OK',
        yes: 'Yes',
        no: 'No',
        cancel: 'Cancel'
      }
      Ext.MessageBox.titleText = {
        confirm: 'Confirm',
        prompt: 'Prompt',
        wait: 'Loading...',
        alert: 'Attention'
      }
    }
  })
}
