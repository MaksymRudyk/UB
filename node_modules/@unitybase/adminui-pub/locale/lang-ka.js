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
    if (Ext.Updater) {
      Ext.Updater.defaults.indicatorText = '<div class="loading-indicator">ჩატვირთვა...</div>'
    }
    if (Ext.view.View) {
      Ext.view.View.prototype.emptyText = '&lt ფურცელი ცარიელია&gt'
    }

    if (Ext.grid.Panel) {
      Ext.grid.Panel.prototype.ddText = '{0} სტრიქონი მონიშნული'
    }

    if (Ext.TabPanelItem) {
      Ext.TabPanelItem.prototype.closeText = 'ამ ჩანართის დახურვა'
    }

    if (Ext.form.field.Base) {
      Ext.form.field.Base.prototype.invalidText = 'ეს ველი შეიცავს არასწორ მნიშვნელობას'
    }

    if (Ext.LoadMask) {
      Ext.LoadMask.prototype.msg = 'ჩატვირთვა...'
      Ext.LoadMask.msg = 'ჩატვირთვა...'
    }

    if (Ext.Date) {
      Ext.Date.monthNames = [
        'იანვარი',
        'თებერვალი',
        'მარტი',
        'აპრილი',
        'მაისი',
        'ივნისი',
        'ივლისი',
        'აგვისტო',
        'სექტემბერი',
        'ოქტომბერი',
        'ნოემბერი',
        'დეკემბერი'
      ]

      Ext.Date.shortMonthNames = [
        'იანვ',
        'თებ',
        'მარტ',
        'აპრ',
        'მაის',
        'ივნ',
        'ივლ',
        'აგვ',
        'სექ',
        'ოქტ',
        'ნოემბ',
        'დეკ'
      ]

      Ext.Date.getShortMonthName = function (month) {
        return Ext.Date.shortMonthNames[month]
      }

      Ext.Date.monthNumbers = {
        'იანვ': 0,
        'თებ': 1,
        'მარტ': 2,
        'აპრ': 3,
        'მაისი': 4,
        'ივნ': 5,
        'ივლ': 6,
        'აგვ': 7,
        'სექ': 8,
        'ოქტ': 9,
        'ნოე': 10,
        'დეკ': 11
      }

      Ext.Date.getMonthNumber = function (name) {
        return Ext.Date.monthNumbers[name.substring(0, 1).toUpperCase() + name.substring(1, 3).toLowerCase()]
      }

      Ext.Date.dayNames = [
        'კვირა',
        'ორშაბათი',
        'სამშაბათი',
        'ოთხშაბათი',
        'ხუთშაბათი',
        'პარასკევი',
        'შაბათი'
      ]

      Ext.Date.getShortDayName = function (day) {
        return Ext.Date.dayNames[day].substring(0, 3)
      }
    }

    if (Ext.MessageBox) {
      Ext.MessageBox.buttonText = {
        ok: 'OK',
        yes: 'კი',
        no: 'არა',
        cancel: 'გაუქმება'
      }
      Ext.MessageBox.titleText = {
        confirm: 'დადასტურება',
        prompt: 'დაუყოვნებლივ',
        wait: 'იტვირთება...',
        alert: 'ყურადღება'
      }
    }

    if (Ext.view.AbstractView) {
      Ext.view.AbstractView.prototype.loadingText = 'იტვირთება...'
    }

    if (Ext.util.Format) {
      Ext.apply(Ext.util.Format, {
        dateFormat: 'm/d/Y',
        timeFormat: 'H:i:s',
        datetimeFormat: 'm/d/Y H:i',
        thousandSeparator: ' ',
        decimalSeparator: ',',
        currencySign: ''
      })
    }

    Ext.define('Ext.uk.ux.DateTimePicker', {
      override: 'Ext.ux.DateTimePicker',
      todayText: 'დღევანდელი დღე',
      timeLabel: 'დრო'
    })

    if (Ext.picker.Date) {
      Ext.apply(Ext.picker.Date.prototype, {
        todayText: 'დღეს',
        minText: 'მინიმალური თარიღისთვის ეს თარიღი ნაკლებია',
        maxText: 'ეს თარიღი უფრო მეტია, ვიდრე მაქსიმალური თარიღი',
        disabledDaysText: '',
        disabledDatesText: '',
        monthNames: Ext.Date.monthNames,
        dayNames: Ext.Date.dayNames,
        nextText: 'შემდეგი თვე (Control+Right)',
        prevText: 'წინა თვე (Control+Left)',
        monthYearText: 'არჩევა თვე (Control+Up/Down არჩევის წლის)',
        todayTip: '{0} (Space)',
        format: Ext.util.Format ? Ext.util.Format.dateFormat : 'm/d/Y',
        altFormats: 'dmY|dmy|d.m.y|d/m/Y|j/m/y|d/n/y|j/m/Y|d/n/Y|d-m-y|d/m|d-m|dm|dmy|dmY|d',
        startDay: 1
      })
    }

    if (Ext.picker.Month) {
      Ext.apply(Ext.picker.Month.prototype, {
        okText: '&#160;OK&#160;',
        cancelText: 'გაუქმება'
      })
    }

    if (Ext.toolbar.Paging) {
      Ext.apply(Ext.PagingToolbar.prototype, {
        beforePageText: 'გვერდი',
        afterPageText: '-დან {0}',
        firstText: 'პირველი გვერდი',
        prevText: 'წინა გვერდი',
        nextText: 'შემდეგი გვერდი',
        lastText: 'ბოლო გვერდი',
        refreshText: 'განახლება',
        displayMsg: 'ჩვენების რიგები {0} -დან {1} -მდე, სულ {2}',
        emptyMsg: 'მონაცემები არ არის ნაჩვენები'
      })
    }

    if (Ext.form.field.Text) {
      Ext.apply(Ext.form.field.Text.prototype, {
        minLengthText: 'ამ მინიმუმის სიგრძე არის {0}',
        maxLengthText: 'ამ ველის მაქსიმალური სიგრძეა {0}',
        blankText: 'ეს აუცილებელი ველია',
        regexText: '',
        emptyText: null
      })
    }

    if (Ext.form.field.Number) {
      Ext.apply(Ext.form.field.Number.prototype, {
        minText: 'საველე ღირებულება არ შეიძლება იყოს ნაკლები {0}',
        maxText: 'საველე ღირებულება ვერ იქნება {0}',
        nanText: '{0} არ არის ნომერი'
      })
    }

    if (Ext.form.field.Date) {
      Ext.apply(Ext.form.field.Date.prototype, {
        disabledDaysText: 'არ არის ხელმისაწვდომი',
        disabledDatesText: 'არ არის ხელმისაწვდომი',
        minText: 'თარიღი ამ სფეროში უნდა იყოს უფრო დიდი {0}',
        maxText: 'თარიღი ამ სფეროში უნდა იყოს ნაკლები {0}',
        invalidText: '{0} არ არის სწორი. თარიღი უნდა იყოს ფორმატში {1}',
        format: Ext.util.Format ? Ext.util.Format.dateFormat : 'm/d/Y',
        startDay: 1,
        altFormats: 'dmY|dmy|d.m.y|d/m/Y|j/m/y|d/n/y|j/m/Y|d/n/Y|d-m-y|d/m|d-m|dm|dmy|dmY|d'
      })
    }

    if (Ext.form.field.ComboBox) {
      Ext.apply(Ext.form.field.ComboBox.prototype, {
        valueNotFoundText: undefined
      })
      Ext.apply(Ext.form.field.ComboBox.prototype.defaultListConfig, {
        loadingText: 'იტვირთება...'
      })
    }

    if (Ext.form.field.VTypes) {
      Ext.apply(Ext.form.field.VTypes, {
        emailText: 'ეს ველი უნდა შეიცავდეს ელფოსტის მისამართს ფორმატში "user@example.com"',
        urlText: 'ეს ველი უნდა შეიცავდეს ელფოსტის მისამართს URL ფორმატში "http:/' + '/www.example.com"',
        alphaText: 'ლათინური ასოები და ხაზგასმული სიმბოლოები "_"',
        alphanumText: 'ეს ველი უნდა შეიცავდეს მხოლოდ ლათინურ ასოებს, ციფრებს და ხაზსგასმულ სიმბოლოებს "_"'
      })
    }

    if (Ext.form.field.HtmlEditor) {
      Ext.apply(Ext.form.field.HtmlEditor.prototype, {
        createLinkText: 'გთხოვთ შეიყვანოთ მისამართი:',
        buttonTips: {
          bold: {
            title: 'მსხვილი შრიფტი (Ctrl+B)',
            text: 'შერჩეული ტექსტისთვის მსხვილი შრიფტის გამოყენება.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          italic: {
            title: 'ესთეტიკური სტილი (Ctrl+I)',
            text: 'შერჩეული ტექსტისთვის ესთეტიკური სტილის გამოყენება.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          underline: {
            title: 'ხაგასმა (Ctrl+U)',
            text: 'ხაზგასმულია შერჩეული ტექსტი',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          increasefontsize: {
            title: 'ზომის გაზრდა',
            text: 'შრიფტის ზომის გაზრდა.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          decreasefontsize: {
            title: 'ზომის შემცირება',
            text: 'შრიფტის ზომის შემცირება.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          backcolor: {
            title: 'შრიფტის ფონი',
            text: 'შეცვალეთ ფონის ფერი შერჩეული ტექსტი ან პუნქტი..',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          forecolor: {
            title: 'შრიფტის ფერი',
            text: 'შეცვალეთ პლანზე ფერის შერჩეული ტექსტი ან პუნქტი.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifyleft: {
            title: 'ტექსტის მარცხნივ განლაგება',
            text: 'ტექსტის გასწორება მარცხნივ.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifycenter: {
            title: 'ტექსტის ცენტრში მოთავსება',
            text: 'ტექსტის გაერთიანება ცენტრში.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifyright: {
            title: 'ტექსტის მარჯვნივ განლაგება',
            text: 'ტექსტის გასწორება მარჯვნივ.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          insertunorderedlist: {
            title: 'სია',
            text: 'ტექსტის სიაში გამოყოფა.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          insertorderedlist: {
            title: 'ნუმერაცია',
            text: 'დანომრილი სია.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          createlink: {
            title: 'ჰიპერბმულის ჩასმა',
            text: 'შექმნა ჰიპერბმულის შერჩეული ტექსტი.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          sourceedit: {
            title: 'კოდის კოდი',
            text: 'კოდის შეცვლა.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          }
        }
      })
    }

    if (Ext.grid.header.Container) {
      Ext.apply(Ext.grid.header.Container.prototype, {
        sortAscText: 'ზრდადობის მიხედვით სორტირება',
        sortDescText: 'კლებადობის მიხედვით სორტირება',
        lockText: 'სტოპ-კადრი',
        unlockText: 'წაშლა გაყინული სვეტი',
        columnsText: 'სვეტი'
      })
    }

    if (Ext.grid.feature.Grouping) {
      Ext.apply(Ext.grid.feature.Grouping.prototype, {
        emptyGroupText: '(ცარიელი)',
        groupByText: 'გრუპირება ველის მიხედვით',
        showGroupsText: 'ჩვენება დაჯგუფების მიხედვით'
      })
    }

    if (Ext.grid.PropertyColumnModel) {
      Ext.apply(Ext.grid.PropertyColumnModel.prototype, {
        nameText: 'სახელი',
        valueText: 'მნიშვნელობა',
        dateFormat: 'd.m.Y'
      })
    }

    if (Ext.SplitLayoutRegion) {
      Ext.apply(Ext.SplitLayoutRegion.prototype, {
        splitTip: 'გადაიტანეთ ზომა.',
        collapsibleSplitTip: 'გადაიტანეთ ზომის შესაცვლელად. ორმაგი დაჭერით დაფარავთ პანელს.'
      })
    }

    if (Ext.layout.BorderLayout && Ext.layout.BorderLayout.SplitRegion) {
      Ext.apply(Ext.layout.BorderLayout.SplitRegion.prototype, {
        splitTip: 'გადაიტანეთ ზომის შესაცვლელად.',
        collapsibleSplitTip: 'გადაიტანეთ ზომის შესაცვლელად. ორმაგი დაჭერით დაფარავთ პანელს.'
      })
    }

    if (Ext.form.CheckboxGroup) {
      Ext.apply(Ext.form.CheckboxGroup.prototype, {
        blankText: 'გთხოვთ, აირჩიოთ ჯგუფში მინიმუმ ერთი ელემენტი'
      })
    }

    if (Ext.tab.Tab) {
      Ext.apply(Ext.tab.Tab.prototype, {
        closeText: 'ჩანართის დახურვა'
      })
    }

    if (Ext.form.Basic) {
      Ext.form.Basic.prototype.waitTitle = 'გთხოვთ დაელოდოთ...'
    }
  })
}
