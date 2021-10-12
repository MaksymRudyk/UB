UB.i18nExtend({
  "NMInstallExtensionFirefox": "<p>Барои идома додани кор, шумо бояд як тавсеаи <b>\"UBExtension\"</b> барои браузери Firefox-ро насб кунед.</p> " +
    "<p>Истинодро пахш кунед <a href=\"https://addons.mozilla.org/addon/ub-extension/\" target=\"_blank\">БАРНОМАИ ЁРИДАХАНДА-ро </a> " +
    " барои гузаштан ба мағозаи Firefox</p>" +
    "<p> Дар равзанаи кушодашуда <b>+Илова кардан ба Firefox</b>-ро пахш кунед.</p>" +
    "<p>Илова кардани барномаи ёридиҳандаро тасдиқ кунед.</p>" +
    "<p>Пас аз насб кардани тавсеаи <b>\"UBExtension\"</b> <b>браузери худро аз нав кушоед!</b></p>",
  "NMInstallExtensionChrome": "<p>Барои идома додани кор, шумо бояд як тавсеаи <b>\"UBExtension\"</b> браузери Google Chrome-ро насб кунед.</p> " +
    "<p>Истинодро клик кунед <a href=\"https://chrome.google.com/webstore/detail/ubextension/{3}\" target=\"_blank\">БАРНОМАИ ЁРИДАХАНДА-ро</a> " +
    " барои гузаштан ба мағозаи Google</p>" +
    "<p> Дар равзанаи мағоза тугмаи <img src=\"models/adminui-pub/ub-extension/ChromePlusFreeEn.png\"/> -ро пахш кунед (шояд <b>+РОЙГОН</b>)</p>" +
    "<p>Равзана пайдо мешавад, ки насби васеъшавиро тасдиқ мекунад - \"Илова\" -ро клик кунед (Add).</p>" +
    "<p>Васеъ насб карда мешавад ва тугмаи <b>+FREE</b> сабз хоҳад шуд:  <img src=\"models/adminui-pub/ub-extension/ChromeAddedEn.png\"/> " +
    "<p>Пас аз насб кардани васеъкунӣ <b>браузери худро аз нав дароред! </b></p>",
  "NMInstallExtensionOpera": "<p>Барои идома додан, шумо бояд васеъкуниро насб кунед <b>\"UBExtension\"</b> барои браузери Opera.</p> " +
    "<p>Истинодро клик кунед <a href=\"models/adminui-pub/ub-extension/UBExtension.crx\" target=\"_blank\">БАРНОМАИ ЁРИДАХАНДА-ро</a>.</p>" +
    "<p>Браузер тамдидро зеркашӣ мекунад ва ба шумо дар болои экран паём медиҳад. " +
    "Дар панели огоҳӣ тугмачаи \"Go\" -ро (Гузаштан) пахш кунед- Opera саҳифаеро бо васеъкунакҳо насб мекунад. Он ҷо \"UBExtension\" -ро ёбед ва \"Install\" -ро (Насб) пахш намоед.</p> " +
    "<p>Баъд аз ин, насб ба анҷом расидааст ва шумо бояд браузерро аз нав оғоз кунед.</p>",
  "NMUpdateExtensionChrome": "<p>Барои идома додан, шумо бояд навсозӣ кунед <b>{0}</b> то версия-и <i>{2}</i>.</p> " +
    "<p>Одатан браузери Google Chrome васеъкуниҳоро ба таври худкор нав мекунад. Кӯшиш кунед, бори дигар тугмачаи пӯшед / кушоед пахш намоед." +
    " Барои навсозиҳои дастӣ ба мағозаи Google бо ин пайванд <a href=\"https://chrome.google.com/webstore/detail/ubextension/{3}\" target=\"_blank\">гузаред</a> </p>",
  "NMUpdateExtensionOpera": "<p>Барои идома додан, шумо бояд навсозӣ кунед <b>{0}</b> то версияи <i>{2}</i>.</p> " +
    "<p>Одатан, браузери Opera васеъшавиро ба таври худкор навсозӣ мекунад. Кӯшиш кунед, бори дигар браузерро пӯшед / кушоед пахш намоед. " +
    " Барои навсозии дастӣ, ба <a href=\"models/adminui-pub/ub-extension/UBExtension.crx\" target=\"_blank\">ин истинод клик кунед</a> </p>",
  "NMInstallFeature": "<p>Барои истифодаи ин функсия, шумо бояд насб кунед <b>{0}</b>.</p> " +
    "<p>Истинодро клик кунед <a href=\"{3}\" target=\"_blank\">ЗАГРУЗИТЬ ИНСТАЛЛЯЦИЮ</a>. Пас аз он, ки зеркашӣ анҷом ёфтааст, насбкуниро оғоз кунед ва мувофиқи дастурҳо амал намоед.</p>" +
    "<p>Пас аз он ки насбкунӣ ба анҷом расад, шумо бояд браузерро аз нав ба кор дароред.</p>",
  "NMUpdateFeature": "<p>Версияи нав таҳия карда шуд <i>{1}</i> приложения <b>{0}</b>.</p> " +
    "<p>Истинодро клик кунед <a href=\"{3}\" target=\"_blank\">ЗАГРУЗИТЬ ОБНОВЛЕНИЕ</a>.  Пас аз он, ки зеркашӣ тамом мешавад, навсозиро оғоз кунед ва мувофиқи дастурҳо иҷро намоед.</p>" +
    "<p>Пас аз навсозӣ ба анҷом расида, шумо бояд браузерро аз нав оғоз намоед.</p>"
})

if (typeof Ext !== 'undefined') {
  Ext.onReady(function () {
    if (Ext.Updater) {
      Ext.Updater.defaults.indicatorText = '<div class="loading-indicator">Идет загрузка...</div>'
    }

    if (Ext.view.View) {
      Ext.view.View.prototype.emptyText = '&lt Маълумот нест &gt'
    }

    if (Ext.grid.Panel) {
      Ext.grid.Panel.prototype.ddText = '{0} сатрҳои интихобшуда'
    }

    if (Ext.TabPanelItem) {
      Ext.TabPanelItem.prototype.closeText = 'Ин ҷадвалро пӯшед'
    }

    if (Ext.form.field.Base) {
      Ext.form.field.Base.prototype.invalidText = 'Маъно дар ин ҳошия нодуруст аст'
    }

    if (Ext.LoadMask) {
      Ext.LoadMask.prototype.msg = 'Боркунӣ...'
      Ext.LoadMask.msg = 'Боркунӣ...'
    }

    if (Ext.Date) {
      Ext.Date.monthNames = [
        'Январ',
        'Феврал',
        'Март',
        'Апрел',
        'Май',
        'Июн',
        'Июл',
        'Август',
        'Сентябр',
        'Октябр',
        'Ноябр',
        'Декабр'
      ]

      Ext.Date.shortMonthNames = [
        'Янв',
        'Февр',
        'Март',
        'Апр',
        'Май',
        'Июн',
        'Июл',
        'Авг',
        'Сент',
        'Окт',
        'Нояб',
        'Дек'
      ]

      Ext.Date.getShortMonthName = function (month) {
        return Ext.Date.shortMonthNames[month]
      }

      // noinspection NonAsciiCharacters
      Ext.Date.monthNumbers = {
        'Янв': 0,
        'Фев': 1,
        'Мар': 2,
        'Апр': 3,
        'Май': 4,
        'Июн': 5,
        'Июл': 6,
        'Авг': 7,
        'Сен': 8,
        'Окт': 9,
        'Ноя': 10,
        'Дек': 11
      }

      Ext.Date.getMonthNumber = function (name) {
        return Ext.Date.monthNumbers[name.substring(0, 1).toUpperCase() + name.substring(1, 3).toLowerCase()]
      }

      Ext.Date.dayNames = [
         'Якшанбе ',
         'Душанбе',
         'Сешанбе',
         'Чоршанбе',
         'Панҷшанбе',
         'Ҷумъа',
         'Шанбе'
      ]

      Ext.Date.getShortDayName = function (day) {
        return Ext.Date.dayNames[day].substring(0, 3)
      }
    }

    if (Ext.MessageBox) {
      Ext.MessageBox.buttonText = {
        ok: 'OK',
        cancel: 'Бекор кардан',
        yes: 'Ҳа',
        no: 'Не'
      }
      Ext.MessageBox.titleText = {
        confirm: 'Тасдиқ додан',
        prompt: 'Маълумот',
        wait: 'Ҷамъоварӣ ...',
        alert: 'Огоҳ'
      }
    }

    if (Ext.view.AbstractView) {
      Ext.view.AbstractView.prototype.loadingText = 'Боркунӣ...'
    }

    if (Ext.util.Format) {
      Ext.apply(Ext.util.Format, {
        thousandSeparator: ' ',
        decimalSeparator: ',',
        currencySign: '',
        dateFormat: 'd.m.Y',
        timeFormat: 'G:i:s',
        datetimeFormat: 'd.m.Y H:i'
      })
    }

    Ext.define('Ext.ru.ux.DateTimePicker', {
      override: 'Ext.ux.DateTimePicker',
      todayText: 'Имруз',
      timeLabel: 'ЧЧ  мм'
    })

    if (Ext.picker.Date) {
      Ext.apply(Ext.picker.Date.prototype, {
        todayText: 'Имруз',
        minText: 'Ин сана аз санаи ҳадди аққал барвақттар аст.',
        maxText: 'Ин сана дертар аз санаи максималӣ мебошад.',
        disabledDaysText: '',
        disabledDatesText: '',
        monthNames: Ext.Date.monthNames,
        dayNames: Ext.Date.dayNames,
        nextText: 'Моҳи оянда (Control+Ба тарафи рост)',
        prevText: 'Моҳи гузашта (Control+Ба тарафи чап)',
        monthYearText: 'Интихоби моҳ (Control+Барои интихоб кардани сол ба боло / поён )',
        todayTip: '{0} (Пробел)',
        format: 'd.m.Y',
        altFormats: 'dmY|dmy|d.m.y|d/m/Y|j/m/y|d/n/y|j/m/Y|d/n/Y|d-m-y|d/m|d-m|dm|dmy|dmY|d',
        startDay: 1
      })
    }

    if (Ext.picker.Month) {
      Ext.apply(Ext.picker.Month.prototype, {
        okText: '&#160;OK&#160;',
        cancelText: 'Бекор кардан'
      })
    }

    if (Ext.toolbar.Paging) {
      Ext.apply(Ext.PagingToolbar.prototype, {
        beforePageText: 'Саҳифа',
        afterPageText: 'аз {0}',
        firstText: 'Саҳифаи аввал',
        prevText: 'Саҳифаи гузашта',
        nextText: 'Саҳифаи навбатӣ',
        lastText: 'Саҳифаи охирин',
        refreshText: 'Навсозӣ',
        displayMsg: 'Намоиши вурудот аз {0} то {1}, ҳамагӣ {2}',
        emptyMsg: 'Ягон маълумот барои нишон додан нест'
      })
    }

    if (Ext.form.field.Text) {
      Ext.apply(Ext.form.field.Text.prototype, {
        minLengthText: 'Дарозии ҳадди аққали ин соҳа {0}',
        maxLengthText: 'Дарозии максималии ин соҳа {0}',
        blankText: 'Ин ҳошия барои пур кардан ҳатмӣ аст',
        regexText: '',
        emptyText: null
      })
    }

    if (Ext.form.field.Number) {
      Ext.apply(Ext.form.field.Number.prototype, {
        minText: 'Арзиши ин соҳа набояд аз он камтар бошад {0}',
        maxText: 'Арзиши ин соҳа набояд аз бузургтар бошад {0}',
        nanText: '{0} рақам нест'
      })
    }

    if (Ext.form.field.Date) {
      Ext.apply(Ext.form.field.Date.prototype, {
        disabledDaysText: 'Дастрас нест',
        disabledDatesText: 'Дастрас нест',
        minText: 'Сана дар ин майдон бояд дертар бошад.{0}',
        maxText: 'Сана бояд дар ин майдон пештар бошад. {0}',
        invalidText: '{0} санаи дуруст нест - сана бояд дар формат зерин бошад {1}',
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
        loadingText: 'Боркунӣ...'
      })
    }

    if (Ext.form.field.VTypes) {
      Ext.apply(Ext.form.field.VTypes, {
        emailText: 'Ин майдон бояд суроғаи почтаи электронӣ дошта бошад дар формати зерин "user@example.com"',
        urlText: 'Ин майдон бояд формати URL дошта бошад "http:/' + '/www.example.com"',
        alphaText: 'Ин майдон бояд танҳо ҳарфҳои лотинӣ ва лақаби зерро дар бар гирад "_"',
        alphanumText: 'Ин майдон бояд танҳо ҳарфҳои лотинӣ, рақамҳо ва лақаби зерро дар бар гирад "_"'
      })
    }

    if (Ext.form.field.HtmlEditor) {
      Ext.apply(Ext.form.field.HtmlEditor.prototype, {
        createLinkText: 'Суроғаро ворид кунед:',
        buttonTips: {
          bold: {
            title: 'Нимғафс (Ctrl+B)',
            text: 'Истифодаи шакли нимғафс дар матни ҷудокардашуда.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          italic: {
            title: 'Шакли моил (Ctrl+I)',
            text: 'Истифодаи шакли моил дар матни ҷудокардашуда.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          underline: {
            title: 'Ба зераш хаткашидашуда (Ctrl+U)',
            text: 'Ба зери матни ҷудокардашуда хат кашидан.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          increasefontsize: {
            title: 'Калон кардани андозаи чопӣ',
            text: 'Калон кардани андозаи ҳарфи чопӣ.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          decreasefontsize: {
            title: 'Хурд кардани ҳарфи чопӣ',
            text: 'Хурд кардани ҳарфи чопӣ.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          backcolor: {
            title: 'Анбоштан',
            text: 'Тағйир додани ранги замина барои матн ё сарсатри ҷудокардашуда.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          forecolor: {
            title: 'Ранги матн',
            text: 'Тағйир додани ранги матн.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifyleft: {
            title: 'Баробар кардани матн аз канори чап',
            text: 'Баробар кардани матн аз канори чап.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifycenter: {
            title: 'Дар байн',
            text: 'Мутобиқ кардани матн дар байн.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifyright: {
            title: 'Баробар кардани матн аз канори рост',
            text: 'Баробар кардани матн аз канори чап рост.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          insertunorderedlist: {
            title: 'Нишонгарҳо',
            text: 'НРӯйхати нишонгузоришуда оғоз гардад.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          insertorderedlist: {
            title: 'Рақамгузорӣ',
            text: 'Рӯйхати рақамгузоришуда оғоз гардад.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          createlink: {
            title: 'Гиперистинод гузошта шавад',
            text: 'Сохтани истинод, аз ҷудокардашуда матн.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          sourceedit: {
            title: 'Рамзи аввалия',
            text: 'Ба рамзи аввалия гузашта шавад.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          }
        }
      })
    }

    if (Ext.grid.header.Container) {
      Ext.apply(Ext.grid.header.Container.prototype, {
        sortAscText: 'Аз рӯи афзоиш дараҷабандӣ шавад',
        sortDescText: 'Аз рӯи коҳиш дараҷабандӣ шавад',
        lockText: 'Сутун маҳкам карда шавад',
        unlockText: 'Маҳкам кардани сутун бардошта шавад',
        columnsText: 'Сутунҳо'
      })
    }

    if (Ext.grid.feature.Grouping) {
      Ext.apply(Ext.grid.feature.Grouping.prototype, {
        emptyGroupText: '(Холӣ)',
        groupByText: 'Аз рӯи ин соҳа гурӯҳбандӣ кунед',
        showGroupsText: 'Намоиш аз ҷониби гурӯҳ'
      })
    }

    if (Ext.grid.PropertyColumnModel) {
      Ext.apply(Ext.grid.PropertyColumnModel.prototype, {
        nameText: 'Номгуй',
        valueText: 'Арзиш',
        dateFormat: 'd.m.Y'
      })
    }

    if (Ext.SplitLayoutRegion) {
      Ext.apply(Ext.SplitLayoutRegion.prototype, {
        splitTip: 'Барои тағйир додани андоза бикашед.',
        collapsibleSplitTip: 'Барои тағйир додани андоза бикашед. Ҳуппоки дукарата панелро пинҳон мекунад.'
      })
    }

    if (Ext.layout.BorderLayout && Ext.layout.BorderLayout.SplitRegion) {
      Ext.apply(Ext.layout.BorderLayout.SplitRegion.prototype, {
        splitTip: 'Барои тағйир додани андоза бикашед.',
        collapsibleSplitTip: 'Барои тағйир додани андоза бикашед. Ҳуппоки дукарата панелро пинҳон мекунад.'
      })
    }

    if (Ext.form.CheckboxGroup) {
      Ext.apply(Ext.form.CheckboxGroup.prototype, {
        blankText: 'Шумо бояд ҳадди аққал як мавқеъро дар гурӯҳ интихоб кунед'
      })
    }

    if (Ext.tab.Tab) {
      Ext.apply(Ext.tab.Tab.prototype, {
        closeText: 'Варақаи иловагӣ баста шавад'
      })
    }

    if (Ext.form.Basic) {
      Ext.form.Basic.prototype.waitTitle = 'Лутфан, мунтазир шавед...'
    }
  })
}
