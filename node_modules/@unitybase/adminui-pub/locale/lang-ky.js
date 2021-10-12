UB.i18nExtend({
  "NMInstallExtensionFirefox": "<p>To use this application Firefox extension <b>\"UBExtension\"</b> must be installed.</p> " +
    "<p>Follow <a href=\"https://addons.mozilla.org/addon/ub-extension/\" target=\"_blank\">ADD EXTENSION</a> " +
    " to go to the Firefox add-ons</p>" +
    "<p> At the add-on window click button <b>+Add to Firefox</b></p>" +
    "<p>Confirm adding a new extension.</p>" +
    "<p>After installing the extension <b>restart your browser!</b></p>",
  "NMInstallExtensionChrome": "<p>Для продолжения работы необходима установка расширения <b>\"UBExtension\"</b> для браузера Google Chrome.</p> " +
    "<p>Нажмите на ссылку <a href=\"https://chrome.google.com/webstore/detail/ubextension/{3}\" target=\"_blank\">УСТАНОВИТЬ РАСШИРЕНИЕ</a> " +
    " для перехода в магазин Google</p>" +
    "<p> В окне магазина нажмите кнопку <img src=\"models/adminui-pub/ub-extension/ChromePlusFreeEn.png\"/> (может быть <b>+БЕСПЛАТНО</b>)</p>" +
    "<p>Появится окно с подтверждением установки расширения - нажмите \"Добавить\" (Add).</p>" +
    "<p>Расширение будет установлено и кнопка <b>+FREE</b> изменит свой цвет на зелёный: <img src=\"models/adminui-pub/ub-extension/ChromeAddedEn.png\"/> " +
    "<p>После установки расширения <b>перезапустите браузер!</b></p>",
  "NMInstallExtensionOpera": "<p>Для продолжения работы необходима установка расширения <b>\"UBExtension\"</b> для браузера Opera.</p> " +
    "<p>Нажмите на ссылку <a href=\"models/adminui-pub/ub-extension/UBExtension.crx\" target=\"_blank\">УСТАНОВИТЬ РАСШИРЕНИЕ</a>.</p>" +
    "<p>Браузер загрузит расширение и выдаст Вам сообщение в верхней части єкрана. " +
    "На панели с предупреждением нажмите кнопку \"Go\"(перейти)- Opera откроет страницу с установленными расширениями. Найдите там \"UBExtension\" и нажмите \"Install\"(Установить)</p> " +
    "<p>После этого установка закончена и необходимо перезапустить браузер.</p>",
  "NMUpdateExtensionChrome": "<p>Для продолжения работы необходимо обновить <b>{0}</b> до версии <i>{2}</i>.</p> " +
    "<p>Обычно браузер Google Chrome обновляет расширения автоматически. Попробуйте закрыть/открыть браузер. " +
    " Для ручного обновления перейдите в магазин Google <a href=\"https://chrome.google.com/webstore/detail/ubextension/{3}\" target=\"_blank\">по этой ссылке</a> </p>",
  "NMUpdateExtensionOpera": "<p>Для продолжения работы необходимо обновить <b>{0}</b> до версии <i>{2}</i>.</p> " +
    "<p>Обычно браузер Opera обновляет расширения автоматически. Попробуйте закрыть/открыть браузер. " +
    " Для ручного обновления перейдите <a href=\"models/adminui-pub/ub-extension/UBExtension.crx\" target=\"_blank\">по этой ссылке</a> </p>",
  "NMInstallFeature": "<p>Для использования этого функционала необходимо установить <b>{0}</b>.</p> " +
    "<p>Нажмите на ссылку <a href=\"{3}\" target=\"_blank\">ЗАГРУЗИТЬ ИНСТАЛЛЯЦИЮ</a>. После завершения загрузки запустите инсталляцию и следуйте подсказкам.</p>" +
    "<p>После завершения инсталляции необходимо перезапустить браузер.</p>",
  "NMUpdateFeature": "<p>Разработана новая версия <i>{1}</i> приложения <b>{0}</b>.</p> " +
    "<p>Нажмите на ссылку <a href=\"{3}\" target=\"_blank\">ЗАГРУЗИТЬ ОБНОВЛЕНИЕ</a>. После завершения загрузки запустите обновление и следуйте подсказкам.</p>" +
    "<p>После завершения обновления необходимо перезапустить браузер.</p>"
})

/* ExtJS Kyrgyz translation */
if (typeof Ext !== 'undefined') {
  Ext.onReady(function () {
    if (Ext.Updater) {
      Ext.Updater.defaults.indicatorText = '<div class="loading-indicator">Идет загрузка...</div>'
    }

    if (Ext.view.View) {
      Ext.view.View.prototype.emptyText = '&lt Нет данных &gt'
    }

    if (Ext.grid.Panel) {
      Ext.grid.Panel.prototype.ddText = '{0} выбранных строк'
    }

    if (Ext.TabPanelItem) {
      Ext.TabPanelItem.prototype.closeText = 'Закрыть эту вкладку'
    }

    if (Ext.form.field.Base) {
      Ext.form.field.Base.prototype.invalidText = 'Значение в этом поле неверное'
    }

    if (Ext.LoadMask) {
      Ext.LoadMask.prototype.msg = 'Загрузка...'
      Ext.LoadMask.msg = 'Загрузка...'
    }

    if (Ext.Date) {
      Ext.Date.monthNames = [
        'Январь',
        'Февраль',
        'Март',
        'Апрель',
        'Май',
        'Июнь',
        'Июль',
        'Август',
        'Сентябрь',
        'Октябрь',
        'Ноябрь',
        'Декабрь'
      ]

      Ext.Date.shortMonthNames = [
        'Янв',
        'Февр',
        'Март',
        'Апр',
        'Май',
        'Июнь',
        'Июль',
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
        'Воскресенье',
        'Понедельник',
        'Вторник',
        'Среда',
        'Четверг',
        'Пятница',
        'Суббота'
      ]

      Ext.Date.getShortDayName = function (day) {
        return Ext.Date.dayNames[day].substring(0, 3)
      }
    }

    if (Ext.MessageBox) {
      Ext.MessageBox.buttonText = {
        ok: 'OK',
        cancel: 'Отмена',
        yes: 'Да',
        no: 'Нет'
      }
      Ext.MessageBox.titleText = {
        confirm: 'Подтверждение',
        prompt: 'Информация',
        wait: 'Загрузка...',
        alert: 'Внимание'
      }
    }

    if (Ext.view.AbstractView) {
      Ext.view.AbstractView.prototype.loadingText = 'Загрузка...'
    }

    if (Ext.util.Format) {
      Ext.apply(Ext.util.Format, {
        thousandSeparator: ' ',
        decimalSeparator: ',',
        currencySign: '', // \u0440\u0443\u0431',  // Russian Ruble
        dateFormat: 'd.m.Y',
        timeFormat: 'G:i:s',
        datetimeFormat: 'd.m.Y H:i'
      })
    }

    Ext.define('Ext.ru.ux.DateTimePicker', {
      override: 'Ext.ux.DateTimePicker',
      todayText: 'Сегодня',
      timeLabel: 'ЧЧ  мм'
    })

    if (Ext.picker.Date) {
      Ext.apply(Ext.picker.Date.prototype, {
        todayText: 'Сегодня',
        minText: 'Эта дата раньше минимальной даты',
        maxText: 'Эта дата позже максимальной даты',
        disabledDaysText: '',
        disabledDatesText: '',
        monthNames: Ext.Date.monthNames,
        dayNames: Ext.Date.dayNames,
        nextText: 'Следующий месяц (Control+Вправо)',
        prevText: 'Предыдущий месяц (Control+Влево)',
        monthYearText: 'Выбор месяца (Control+Вверх/Вниз для выбора года)',
        todayTip: '{0} (Пробел)',
        format: 'd.m.Y',
        altFormats: 'dmY|dmy|d.m.y|d/m/Y|j/m/y|d/n/y|j/m/Y|d/n/Y|d-m-y|d/m|d-m|dm|dmy|dmY|d',
        startDay: 1
      })
    }

    if (Ext.picker.Month) {
      Ext.apply(Ext.picker.Month.prototype, {
        okText: '&#160;OK&#160;',
        cancelText: 'Отмена'
      })
    }

    if (Ext.toolbar.Paging) {
      Ext.apply(Ext.PagingToolbar.prototype, {
        beforePageText: 'Страница',
        afterPageText: 'из {0}',
        firstText: 'Первая страница',
        prevText: 'Предыдущая страница',
        nextText: 'Следующая страница',
        lastText: 'Последняя страница',
        refreshText: 'Обновить',
        displayMsg: 'Отображаются записи с {0} по {1}, всего {2}',
        emptyMsg: 'Нет данных для отображения'
      })
    }

    if (Ext.form.field.Text) {
      Ext.apply(Ext.form.field.Text.prototype, {
        minLengthText: 'Минимальная длина этого поля {0}',
        maxLengthText: 'Максимальная длина этого поля {0}',
        blankText: 'Это поле обязательно для заполнения',
        regexText: '',
        emptyText: null
      })
    }

    if (Ext.form.field.Number) {
      Ext.apply(Ext.form.field.Number.prototype, {
        minText: 'Значение этого поля не может быть меньше {0}',
        maxText: 'Значение этого поля не может быть больше {0}',
        nanText: '{0} не является числом'
      })
    }

    if (Ext.form.field.Date) {
      Ext.apply(Ext.form.field.Date.prototype, {
        disabledDaysText: 'Не доступно',
        disabledDatesText: 'Не доступно',
        minText: 'Дата в этом поле должна быть позже {0}',
        maxText: 'Дата в этом поле должна быть раньше {0}',
        invalidText: '{0} не является корректной датой - дата должна быть указана в формате {1}',
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
        loadingText: 'Загрузка...'
      })
    }

    if (Ext.form.field.VTypes) {
      Ext.apply(Ext.form.field.VTypes, {
        emailText: 'Это поле должно содержать адрес электронной почты в формате "user@example.com"',
        urlText: 'Это поле должно содержать URL в формате "http:/' + '/www.example.com"',
        alphaText: 'Это поле должно содержать только латинские буквы и символ подчеркивания "_"',
        alphanumText: 'Это поле должно содержать только латинские буквы, цифры и символ подчеркивания "_"'
      })
    }

    if (Ext.form.field.HtmlEditor) {
      Ext.apply(Ext.form.field.HtmlEditor.prototype, {
        createLinkText: 'Пожалуйста, введите адрес:',
        buttonTips: {
          bold: {
            title: 'Полужирный (Ctrl+B)',
            text: 'Применение полужирного начертания к выделенному тексту.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          italic: {
            title: 'Курсив (Ctrl+I)',
            text: 'Применение курсивного начертания к выделенному тексту.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          underline: {
            title: 'Подчёркнутый (Ctrl+U)',
            text: 'Подчёркивание выделенного текста.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          increasefontsize: {
            title: 'Увеличить размер',
            text: 'Увеличение размера шрифта.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          decreasefontsize: {
            title: 'Уменьшить размер',
            text: 'Уменьшение размера шрифта.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          backcolor: {
            title: 'Заливка',
            text: 'Изменение цвета фона для выделенного текста или абзаца.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          forecolor: {
            title: 'Цвет текста',
            text: 'Изменение цвета текста.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifyleft: {
            title: 'Выравнять текст по левому краю',
            text: 'Выравнивание текста по левому краю.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifycenter: {
            title: 'По центру',
            text: 'Выравнивание текста по центру.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifyright: {
            title: 'Выравнять текст по правому краю',
            text: 'Выравнивание текста по правому краю.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          insertunorderedlist: {
            title: 'Маркеры',
            text: 'Начать маркированный список.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          insertorderedlist: {
            title: 'Нумерация',
            text: 'Начать нумерованный список.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          createlink: {
            title: 'Вставить гиперссылку',
            text: 'Создание ссылки из выделенного текста.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          sourceedit: {
            title: 'Исходный код',
            text: 'Переключиться на исходный код.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          }
        }
      })
    }

    if (Ext.grid.header.Container) {
      Ext.apply(Ext.grid.header.Container.prototype, {
        sortAscText: 'Сортировать по возрастанию',
        sortDescText: 'Сортировать по убыванию',
        lockText: 'Закрепить столбец',
        unlockText: 'Снять закрепление столбца',
        columnsText: 'Столбцы'
      })
    }

    if (Ext.grid.feature.Grouping) {
      Ext.apply(Ext.grid.feature.Grouping.prototype, {
        emptyGroupText: '(Пусто)',
        groupByText: 'Группировать по этому полю',
        showGroupsText: 'Отображать по группам'
      })
    }

    if (Ext.grid.PropertyColumnModel) {
      Ext.apply(Ext.grid.PropertyColumnModel.prototype, {
        nameText: 'Название',
        valueText: 'Значение',
        dateFormat: 'd.m.Y'
      })
    }

    if (Ext.SplitLayoutRegion) {
      Ext.apply(Ext.SplitLayoutRegion.prototype, {
        splitTip: 'Тяните для изменения размера.',
        collapsibleSplitTip: 'Тяните для изменения размера. Двойной щелчок спрячет панель.'
      })
    }

    if (Ext.layout.BorderLayout && Ext.layout.BorderLayout.SplitRegion) {
      Ext.apply(Ext.layout.BorderLayout.SplitRegion.prototype, {
        splitTip: 'Тяните для изменения размера.',
        collapsibleSplitTip: 'Тяните для изменения размера. Двойной щелчок спрячет панель.'
      })
    }

    if (Ext.form.CheckboxGroup) {
      Ext.apply(Ext.form.CheckboxGroup.prototype, {
        blankText: 'Необходимо выбрать хотя бы одну позицию в группе'
      })
    }

    if (Ext.tab.Tab) {
      Ext.apply(Ext.tab.Tab.prototype, {
        closeText: 'Закрыть вкладку'
      })
    }

    if (Ext.form.Basic) {
      Ext.form.Basic.prototype.waitTitle = 'Пожалуйста, подождите...'
    }
  })
}
