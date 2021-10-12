UB.i18nExtend({
  "NMInstallExtensionFirefox": "<p>İşi davam etdirmək üçün Firefox brauzeri üçün <b>\"UBExtension\"</b> genişlənməsini quraşdırmaq lazımdır.</p> " +
    "<p> \"Google\" mağazasına keçmək üçün <a href=\"https://addons.mozilla.org/addon/ub-extension/\" target=\"_blank\">GENİŞLƏNMƏNİ QURAŞDIR</a> keçidi üzərində vurun</p>" +
    "<p>Genişlənməni quraşdırdıqdan sonra <b>brauzeri söndürüb yandırın!</b></p>",
  "NMInstallExtensionChrome": "<p>İşi davam etdirmək üçün \"Google Chrome\" brauzeri üçün <b>\"UBExtension\"</b> genişlənməsini quraşdırmaq lazımdır.</p> " +
    "<p> \"Google\" mağazasına keçmək üçün <a href=\"https://chrome.google.com/webstore/detail/ubextension/{3}\" target=\"_blank\">GENİŞLƏNMƏNİ QURAŞDIR</a> keçidi üzərində vurun</p>" +
    "<p> Mağaza pəncərəsində <img src=\"models/adminui-pub/ub-extension/ChromePlusFreeEn.png\"/> düyməsini(ola bilər ki, <b>+ÖDƏNİŞSİZ</b>) sıxın </p>" +
    "<p>Genişlənmənin quraşdırıldığını təsdiq edən pəncərə açıldıqda \"Əlavə et\" (Add) üzərində vurun.</p>" +
    "<p>Genişlənmə quraşdırılacaq və <b>+FREE</b> düyməsi yaşıl rəng alacaq: <img src=\"models/adminui-pub/ub-extension/ChromeAddedEn.png\"/> " +
    "<p>Genişlənməni quraşdırdıqdan sonra <b>brauzeri söndürüb yandırın!</b></p>",
  "NMInstallExtensionOpera": "<p>İşi davam etdirmək üçün \"Opera\" brauzeri üçün <b>\"UBExtension\"</b> genişlənməsini quraşdırmaq lazımdır.</p> " +
    "<p><a href=\"models/adminui-pub/ub-extension/UBExtension.crx\" target=\"_blank\">GENİŞLƏNMƏNİ QURAŞDIR</a> keçidi üzərində vurun.</p>" +
    "<p>Brauzer genişlənməni yükləyəcək və ekranın yuxarı hissəsində ismarış görsənəcək. " +
    "Xəbərdarlığın əks olunduğu paneldə \"Go\"(keçid) düyməsini sıxın, bu zaman \"Opera\" quraşdırılmış genişlənmələrin əks olunduğu səhifəni açacaq. Burada \"UBExtension\" tapıb \"Install\"(Quraşdır) əmri üzərində vurun</p> " +
    "<p>Artıq quraşdırma başa çatmışdır və brauzeri söndürüb yandırmaq olar.</p>",
  "NMUpdateExtensionChrome": "<p>İşi davam etdirmək üçün <b>{0}</b>ni <i>{2}</i> versiyasınadək yeniləmək lazımdır.</p> " +
    "<p>Adətən \"Google Chrome\" brauzeri genişlənmələri avtomatik olaraq yeniləyir. Brauzeri bağlamağa/açmağa cəhd edin. " +
    " Əllə yeniləmək üçün <a href=\"https://chrome.google.com/webstore/detail/ubextension/{3}\" target=\"_blank\"> keçidindən istifadə edərək \"Google\" mağazasına keçin</a> </p>",
  "NMUpdateExtensionOpera": "<p>İşi davam etdirmək üçün <b>{0}</b>ni <i>{2}</i> versiyasınadək yeniləmək lazımdır.</p> " +
    "<p>Adətən \"Opera\" brauzeri genişlənmələri avtomatik olaraq yeniləyir. Brauzeri bağlamağa/açmağa cəhd edin. " +
    " Əllə yeniləmək üçün <a href=\"models/adminui-pub/ub-extension/UBExtension.crx\" target=\"_blank\"> keçidindən istifadə edərək \"Google\" mağazasına keçin</a> </p>",
  "NMInstallFeature": "<p>Bu funksionaldan istifadə etmək üçün <b>{0}</b> quraşdırmaq lazımır.</p> " +
    "<p><a href=\"{3}\" target=\"_blank\">QURAŞDIRMANI YÜKLƏ</a> keçidi üzərində vurun. Yüklənmə başa çatdıqdan sonra quraşdırmanı işə salıb yarımçı məsləhətlərə riayət edin.</p>" +
    "<p>Quraşdırma başa çatdıqdan sonra brauzeri söndürüb yandırmaq lazımdır.</p>",
  "NMUpdateFeature": "<p> <b>{0}</b> tətbiq proqramının yeni <i>{1}</i>  versiyası işlənib hazırlanmışdır.</p> " +
    "<p> <a href=\"{3}\" target=\"_blank\">YENİLƏNMƏNİ YÜKLƏ</a> keçidi üzərində vurun. Yüklənmə başa çatdıqdan sonra yenilənməni işə salıb yarımçı məsləhətlərə riayət edin.</p>" +
    "<p>Quraşdırma başa çatdıqdan sonra brauzeri söndürüb yandırmaq lazımdır.</p>"
})

/* ExtJS Translation into Azerbaijani */
if (typeof Ext !== 'undefined') {
  Ext.onReady(function () {
    if (Ext.Updater) {
      Ext.Updater.defaults.indicatorText = '<div class="loading-indicator">Yüklənir ...</div>'
    }

    if (Ext.view.View) {
      Ext.view.View.prototype.emptyText = '&lt Məlumat yoxdur &gt'
    }

    if (Ext.grid.Panel) {
      Ext.grid.Panel.prototype.ddText = 'seçilmiş {0} sətir'
    }

    if (Ext.MessageBox) {
      Ext.MessageBox.buttonText = {
        ok: 'OK',
        cancel: 'Ləğv et',
        yes: 'Bəli',
        no: 'Xeyr'
      }
      Ext.MessageBox.titleText = {
        confirm: 'Təsdiq',
        prompt: 'Məlumat',
        wait: 'Yüklənmə...',
        alert: 'Diqqət'
      }
    }

    if (Ext.view.AbstractView) {
      Ext.view.AbstractView.prototype.loadingText = 'Yüklənir...'
    }

    if (Ext.util.Format) {
      Ext.apply(Ext.util.Format, {
        thousandSeparator: ' ',
        decimalSeparator: ',',
        currencySign: '', // 'AZM',
        timeFormat: 'H:i:s',
        datetimeFormat: 'd.m.Y H:i',
        dateFormat: 'd.m.Y'
      })
    }

    Ext.define('Ext.az.ux.DateTimePicker', {
      override: 'Ext.ux.DateTimePicker',
      todayText: 'Bugün',
      timeLabel: 'Vaxt'
    })

    if (Ext.picker.Date) {
      Ext.apply(Ext.picker.Date.prototype, {
        todayText: 'Bugün',
        minText: 'Bu tarix  mümkün ən kiçik tarixdən daha kiçikdir',
        maxText: 'Bu tarix  mümkün ən böyük tarixdən daha böyükdür',
        disabledDaysText: '',
        disabledDatesText: '',
        monthNames: Ext.Date.monthNames,
        dayNames: Ext.Date.shortDayNames,
        nextText: 'Gelecek Ay (Control+Right)',
        prevText: 'Ã–nceki Ay (Control+Left)',
        monthYearText: 'Bir ay sŸeçiniz (Yýlý artýrmak/azaltmak için Control+Up/Down)',
        todayTip: '{0} (BoþŸluk TuþŸu - Spacebar)',
        format: 'd.m.Y',
        altFormats: 'dmY|dmy|d.m.y|d/m/Y|j/m/y|d/n/y|j/m/Y|d/n/Y|d-m-y|d/m|d-m|dm|dmy|dmY|d',
        startDay: 1
      })
    }

    if (Ext.picker.Month) {
      Ext.apply(Ext.picker.Month.prototype, {
        okText: '&#160;Tamam&#160;',
        cancelText: 'Ləğv et'
      })
    }

    if (Ext.form.field.Number) {
      Ext.apply(Ext.form.field.Number.prototype, {
        minText: 'Ən az giriş sayı {0} olmalıdır',
        maxText: 'Ən çox giriş sayı {0} olmalıdır',
        nanText: '{0} ola bilməz'
      })
    }

    if (Ext.toolbar.Paging) {
      Ext.apply(Ext.PagingToolbar.prototype, {
        beforePageText: 'Sayfa',
        afterPageText: ' / {0}',
        firstText: 'İlk səhifə',
        prevText: 'Əvvəlki səhifə',
        nextText: 'Sonrakı səhifə',
        lastText: 'Son səhifə',
        refreshText: 'Yenilə',
        displayMsg: 'Göstərilən {0} - {1} / {2}',
        emptyMsg: 'Boşdur'
      })
    }

    if (Ext.form.field.Text) {
      Ext.apply(Ext.form.field.Text.prototype, {
        minLengthText: 'Minimal uzunluq {0} olmalıdır',
        maxLengthText: 'Maksimal uzunluq {0} olmalıdır',
        blankText: 'Bu xana mütləq doldurulmalıdır',
        regexText: '',
        emptyText: null
      })
    }

    Ext.define('Ext.locale.az.view.View', {
      override: 'Ext.view.View',
      emptyText: ''
    })

    Ext.define('Ext.locale.az.grid.Grid', {
      override: 'Ext.grid.Grid',
      ddText: 'Sətir sayı : {0}'
    })

    Ext.define('Ext.locale.az.TabPanelItem', {
      override: 'Ext.TabPanelItem',
      closeText: 'Bağla'
    })

    Ext.define('Ext.locale.az.form.field.Base', {
      override: 'Ext.form.field.Base',
      invalidText: 'Bu xanadakı qiymət uyğun deyil'
    })

    // changing the msg text below will affect the LoadMask
    Ext.define('Ext.locale.az.view.AbstractView', {
      override: 'Ext.view.AbstractView',
      msg: 'Yüklənir ...'
    })

    if (Ext.LoadMask) {
      Ext.LoadMask.prototype.msg = 'Yüklənir...'
      Ext.LoadMask.msg = 'Yüklənir...'
    }

    if (Ext.Date) {
      Ext.Date.monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr']

      Ext.Date.getShortMonthName = function (month) {
        return Ext.Date.monthNames[month].substring(0, 3)
      }

      Ext.Date.monthNumbers = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11
      }

      Ext.Date.getMonthNumber = function (name) {
        return Ext.Date.monthNumbers[name.substring(0, 1).toUpperCase() + name.substring(1, 3).toLowerCase()]
      }

      Ext.Date.dayNames = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə']

      Ext.Date.shortDayNames = ['B', 'B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş']

      Ext.Date.getShortDayName = function (day) {
        return Ext.Date.shortDayNames[day]
      }

      Ext.picker.Date.prototype.getDayInitial = function (value) {
        return Ext.Date.shortDayNames[Ext.Date.dayNames.indexOf(value)]
      }
    }

    if (Ext.form.field.Date) {
      Ext.apply(Ext.form.field.Date.prototype, {
        disabledDaysText: 'De-aktiv edilmişdir',
        disabledDatesText: 'De-aktiv edilmişdir',
        minText: 'Bu tarix, {0} tarixindən daha sonra olmalıdır',
        maxText: 'Bu tarix, {0} tarixindən daha əvvəl olmalıdır',
        invalidText: '{0} ola bilməz - tarix formatı{1} kimi olmalıdır',
        format: 'd.m.Y',
        startDay: 1,
        altFormats: 'dmY|dmy|d.m.y|d/m/Y|j/m/y|d/n/y|j/m/Y|d/n/Y|d-m-y|d/m|d-m|dm|dmy|dmY|d'
      })
    }

    if (Ext.form.field.ComboBox) {
      Ext.apply(Ext.form.field.ComboBox.prototype, {
        valueNotFoundText: undefined
      })
      Ext.apply(Ext.form.field.ComboBox.prototype.defaultListConfig, {
        loadingText: 'Yükleniyor ...'
      })
    }

    if (Ext.form.field.VTypes) {
      Ext.apply(Ext.form.field.VTypes, {
        emailText: 'Bu alan "user@example.com" þŸeklinde elektronik posta formatýnda olmalýdýr',
        urlText: '"http://www.example.com" þŸeklinde URL adres formatýnda olmalýdýr',
        alphaText: 'Bu alan sadece harf ve _ içermeli',
        alphanumText: 'Bu alan sadece harf, sayý ve _ içermeli'
      })
    }

    if (Ext.form.field.HtmlEditor) {
      Ext.apply(Ext.form.field.HtmlEditor.prototype, {
        createLinkText: 'Xahiş edirik, lazımi URL ünvanından istifadə edin:',
        buttonTips: {
          bold: {
            title: 'Kalýn(Bold) (Ctrl+B)',
            text: 'Þžeçili yazýyý kalýn yapar.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          italic: {
            title: 'Ä°talik(Italic) (Ctrl+I)',
            text: 'Þžeçili yazýyý italik yapar.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          underline: {
            title: 'Alt Ã‡izgi(Underline) (Ctrl+U)',
            text: 'Þžeçili yazýnýn altýný çizer.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          increasefontsize: {
            title: 'Fontu büyült',
            text: 'Yazý fontunu büyütür.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          decreasefontsize: {
            title: 'Fontu küçült',
            text: 'Yazý fontunu küçültür.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          backcolor: {
            title: 'Arka Plan Rengi',
            text: 'Seçili yazýnýn arka plan rengini deðiþŸtir.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          forecolor: {
            title: 'Yazý Rengi',
            text: 'Seçili yazýnýn rengini deðiþŸtir.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifyleft: {
            title: 'Sola Daya',
            text: 'Yazýyý sola daya.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifycenter: {
            title: 'Ortala',
            text: 'Yazýyý editörde ortala.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifyright: {
            title: 'Saða daya',
            text: 'Yazýyý saða daya.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          insertunorderedlist: {
            title: 'Noktalý Liste',
            text: 'Noktalý listeye baþŸla.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          insertorderedlist: {
            title: 'Numaralý Liste',
            text: 'Numaralý lisyeye baþŸla.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          createlink: {
            title: 'Web Adresi(Hyperlink)',
            text: 'Seçili yazýyý web adresi(hyperlink) yap.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          sourceedit: {
            title: 'Kaynak kodu Düzenleme',
            text: 'Kaynak kodu düzenleme moduna geç.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          }
        }
      })
    }

    if (Ext.grid.header.Container) {
      Ext.apply(Ext.grid.header.Container.prototype, {
        sortAscText: 'Artan sýrada sýrala',
        sortDescText: 'Azalan sýrada sýrala',
        lockText: 'Kolonu kilitle',
        unlockText: 'Kolon kilidini kaldýr',
        columnsText: 'Kolonlar'
      })
    }

    if (Ext.grid.feature.Grouping) {
      Ext.apply(Ext.grid.feature.Grouping.prototype, {
        emptyGroupText: '(Yok)',
        groupByText: 'Bu xanaya əsasən qruplaşdır',
        showGroupsText: 'Gruplar Halinde Göster'
      })
    }

    if (Ext.grid.PropertyColumnModel) {
      Ext.apply(Ext.grid.PropertyColumnModel.prototype, {
        nameText: 'Ad',
        valueText: 'Dəyər',
        dateFormat: 'd.m.Y'
      })
    }

    if (Ext.SplitLayoutRegion) {
      Ext.apply(Ext.SplitLayoutRegion.prototype, {
        splitTip: 'Ölçüsünü üçün sürükleyin.',
        collapsibleSplitTip: 'Ölçüsünü üçün sürükleyin. Gizlətmək üçün cüt basın.'
      })
    }

    if (Ext.layout.BorderLayout && Ext.layout.BorderLayout.SplitRegion) {
      Ext.apply(Ext.layout.BorderLayout.SplitRegion.prototype, {
        splitTip: 'Ölçüsünü üçün sürükleyin.',
        collapsibleSplitTip: 'Ölçüsünü üçün sürükleyin. Gizlətmək üçün cüt basın.'
      })
    }

    if (Ext.form.CheckboxGroup) {
      Ext.apply(Ext.form.CheckboxGroup.prototype, {
        blankText: 'Qrupda heç olmasa bir vəzifə seçmək lazımdır'
      })
    }

    if (Ext.tab.Tab) {
      Ext.apply(Ext.tab.Tab.prototype, {
        closeText: 'Əlavni bağla'
      })
    }

    if (Ext.form.Basic) {
      Ext.form.Basic.prototype.waitTitle = 'Xahiş edirik gözləyin...'
    }
  })
}
