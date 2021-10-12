UB.i18nExtend({
  "NMInstallExtensionFirefox": "<p>Для продовження роботи необхідно встановити розширення <b>\"UBExtension\"</b> для браузера.</p> " +
    "<p>Натисніть на посилання <a href=\"https://addons.mozilla.org/addon/ub-extension/\" target=\"_blank\">ВСТАНОВИТИ РОЗШИРЕННЯ</a> " +
    " для переходу до сайту Firefox add-ons</p>" +
    "<p> Натисніть кнопку <b>+Add to Firefox</b></p>" +
    "<p>З`явиться вікно з підтвердженням встановлення розширення - натисніть \"Додати\"</p>" +
    "<p>Після встановлення розширення <b>перезапустіть браузер!</b></p>",
  "NMInstallExtensionChrome": "<p>Для продовження роботи необхідно встановити розширення <b>\"UBExtension\"</b> для браузера Google Chrome.</p> " +
    "<p>Натисніть на посилання <a href=\"https://chrome.google.com/webstore/detail/ubextension/{3}\" target=\"_blank\">ВСТАНОВИТИ РОЗШИРЕННЯ</a> " +
    " для переходу до магазину Google</p>" +
    "<p> У вікні магазину натисніть кнопку <img src=\"models/adminui-pub/ub-extension/ChromePlusFreeEn.png\"/> (може бути <b>+БЕСПЛАТНО</b> або <b>+БЕСКОШТОВНО</b>)</p>" +
    "<p>З`явиться вікно з підтвердженням встановлення розширення - натисніть \"Додати\" (Add).</p>" +
    "<p>Розширення буде встановлено й кнопка <b>+FREE</b> змінить свій колір на зелений: <img src=\"models/adminui-pub/ub-extension/ChromeAddedEn.png\"/> " +
    "<p>Після встановлення розширення <b>перезапустіть браузер!</b></p>",
  "NMInstallExtensionOpera": "<p>Для продовження роботи необхідно встановити розширення <b>\"UBExtension\"</b> для браузера Opera.</p> " +
    "<p>Натисніть на посилання <a href=\"models/adminui-pub/ub-extension/UBExtension.crx\" target=\"_blank\">ВСТАНОВИТИ РОЗШИРЕННЯ</a>.</p>" +
    "<p>Браузер завантажить розширення та видасть Вам попередження в верхній частині екрану. " +
    "На панелі з попередженням натисніть кнопку \"Go\"(перейти) - Opera відкриє сторінку з встановленими розширеннями. Знайдіть там \"UBExtension\" на натисніть \"Install\"(встановити)</p> " +
    "<p>На цьому встановлення закінчено й Вам варто перезапустити браузер.</p>",
  "NMUpdateExtensionChrome": "<p>Для продовження роботи необхідно оновити <b>{0}</b> до версії <i>{2}</i>.</p> " +
    "<p>Зазвичай браузер Google Chrome здійснює такі оновлення автоматично протягом кількох годин. Спробуйте закрити/відкрити браузер. " +
    " Для ручного оновлення перейдіть до магазину Google <a href=\"https://chrome.google.com/webstore/detail/ubextension/{3}\" target=\"_blank\">по цьому посиланню</a> </p>",
  "NMUpdateExtensionOpera": "<p>Для продовження роботи необхідно оновити <b>{0}</b> до версії <i>{2}</i>.</p> " +
    "<p>Зазвичай браузер Opera здійснює такі оновлення автоматично протягом кількох годин. Спробуйте закрити/відкрити браузер. " +
    " Для ручного оновлення перейдіть <a href=\"models/adminui-pub/ub-extension/UBExtension.crx\" target=\"_blank\">по цьому посиланню</a> </p>",
  "NMInstallFeature": "<p>Для використання цього функціоналу необхідно встановити <b>{0}</b>.</p> " +
    "<p>Натисніть на посилання <a href=\"{3}\" target=\"_blank\">ЗАВАНТАЖИТИ ІНСТАЛЯЦІЮ</a>. Запустіть інсталяцію, що завантажилася, й слідуйте підказкам.</p>" +
    "<p>По закінченню інсталяції Вам варто перезапустити браузер.</p>",
  "NMUpdateFeature": "<p>Наявна нова версія <i>{1}</i> додатку <b>{0}</b>.</p> " +
    "<p>Натисніть на посилання <a href=\"{3}\" target=\"_blank\">ЗАВАНТАЖИТИ ОНОВЛЕННЯ</a>. Запустіть оновлення, що завантажилося, й слідуйте підказкам.</p>" +
    "<p>По закінченню оновлення Вам варто перезапустити браузер.</p>"
})

if (typeof Ext !== 'undefined') {
  Ext.onReady(function () {
    if (Ext.Updater) {
      Ext.Updater.defaults.indicatorText = '<div class="loading-indicator">Завантаження...</div>'
    }
    if (Ext.view.View) {
      Ext.view.View.prototype.emptyText = '&lt Немає даних &gt'
    }

    if (Ext.grid.Panel) {
      Ext.grid.Panel.prototype.ddText = '{0} обраних рядків'
    }

    if (Ext.TabPanelItem) {
      Ext.TabPanelItem.prototype.closeText = 'Закрити цю вкладку'
    }

    if (Ext.form.field.Base) {
      Ext.form.field.Base.prototype.invalidText = 'Хибне значення в цьому полі'
    }

    if (Ext.LoadMask) {
      Ext.LoadMask.prototype.msg = 'Завантаження...'
      Ext.LoadMask.msg = 'Завантаження...'
    }

    if (Ext.Date) {
      // noinspection NonAsciiCharacters
      Ext.Date.monthNumbers = {
        Січ: 0,
        Лют: 1,
        Бер: 2,
        Кві: 3,
        Тра: 4,
        Чер: 5,
        Лип: 6,
        Сер: 7,
        Вер: 8,
        Жов: 9,
        Лис: 10,
        Гру: 11
      }
      Ext.Date.monthNames = [
        'Січень',
        'Лютий',
        'Березень',
        'Квітень',
        'Травень',
        'Червень',
        'Липень',
        'Серпень',
        'Вересень',
        'Жовтень',
        'Листопад',
        'Грудень'
      ]

      Ext.Date.dayNames = [
        'Неділя',
        'Понеділок',
        'Вівторок',
        'Середа',
        'Четвер',
        'П’ятниця',
        'Субота'
      ]
    }

    if (Ext.MessageBox) {
      Ext.MessageBox.buttonText = {
        ok: 'OK',
        cancel: 'Відміна',
        yes: 'Так',
        no: 'Ні'
      }
      Ext.MessageBox.titleText = {
        confirm: 'Підтвердження',
        prompt: 'Інформація',
        wait: 'Завантаження...',
        alert: 'Увага'
      }
    }

    if (Ext.view.AbstractView) {
      Ext.view.AbstractView.prototype.loadingText = 'Завантаження...'
    }

    if (Ext.util.Format) {
      Ext.apply(Ext.util.Format, {
        thousandSeparator: ' ',
        decimalSeparator: ',',
        currencySign: '',
        dateFormat: 'd.m.Y',
        timeFormat: 'H:i:s',
        datetimeFormat: 'd.m.Y H:i'
      })
    }

    Ext.define('Ext.uk.ux.DateTimePicker', {
      override: 'Ext.ux.DateTimePicker',
      todayText: 'Сьогодні',
      timeLabel: 'Час'
    })

    if (Ext.picker.Date) {
      Ext.apply(Ext.picker.Date.prototype, {
        todayText: 'Сьогодні',
        minText: 'Ця дата менша за мінімально допустиму дату',
        maxText: 'Ця дата більша за максимально допустиму дату',
        disabledDaysText: '',
        disabledDatesText: '',
        monthNames: Ext.Date.monthNames,
        dayNames: Ext.Date.dayNames,
        nextText: 'Наступний місяць (Control+Вправо)',
        prevText: 'Попередній місяць (Control+Вліво)',
        monthYearText: 'Вибір місяця (Control+Вгору/Вниз для вибору року)',
        todayTip: '{0} (Пробіл)',
        format: 'd.m.Y',
        altFormats: 'dmY|dmy|d.m.y|d/m/Y|j/m/y|d/n/y|j/m/Y|d/n/Y|d-m-y|d/m|d-m|dm|dmy|dmY|d',
        startDay: 1
      })
    }

    if (Ext.picker.Month) {
      Ext.apply(Ext.picker.Month.prototype, {
        okText: '&#160;OK&#160;',
        cancelText: 'Відміна'
      })
    }

    if (Ext.toolbar.Paging) {
      Ext.apply(Ext.PagingToolbar.prototype, {
        beforePageText: 'Сторінка',
        afterPageText: 'з {0}',
        firstText: 'Перша сторінка',
        prevText: 'Попередня сторінка',
        nextText: 'Наступна сторінка',
        lastText: 'Остання сторінка',
        refreshText: 'Оновити',
        displayMsg: 'Відображення записів з {0} по {1}, всього {2}',
        emptyMsg: 'Дані для відображення відсутні'
      })
    }

    if (Ext.form.field.Text) {
      Ext.apply(Ext.form.field.Text.prototype, {
        minLengthText: 'Мінімальна довжина цього поля {0}',
        maxLengthText: 'Максимальна довжина цього поля {0}',
        blankText: 'Це поле є обов’язковим для заповнення',
        regexText: '',
        emptyText: null
      })
    }

    if (Ext.form.field.Number) {
      Ext.apply(Ext.form.field.Number.prototype, {
        minText: 'Значення у цьому полі не може бути менше {0}',
        maxText: 'Значення у цьому полі не може бути більше {0}',
        nanText: '{0} не є числом'
      })
    }

    if (Ext.form.field.Date) {
      Ext.apply(Ext.form.field.Date.prototype, {
        disabledDaysText: 'Не доступно',
        disabledDatesText: 'Не доступно',
        minText: 'Дата у цьому полі повинна бути більша {0}',
        maxText: 'Дата у цьому полі повинна бути менша {0}',
        invalidText: '{0} невірна дата - дата повинна бути вказана у форматі {1}',
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
        loadingText: 'Завантаження...'
      })
    }

    if (Ext.form.field.VTypes) {
      Ext.apply(Ext.form.field.VTypes, {
        emailText: 'Це поле повинно містити адресу електронної пошти у форматі "user@example.com"',
        urlText: 'Це поле повинно містити URL у форматі "http:/' + '/www.example.com"',
        alphaText: 'Це поле повинно містити виключно латинські літери та символ підкреслення "_"',
        alphanumText: 'Це поле повинно містити виключно латинські літери, цифри та символ підкреслення "_"'
      })
    }

    if (Ext.form.field.HtmlEditor) {
      Ext.apply(Ext.form.field.HtmlEditor.prototype, {
        createLinkText: 'Будь ласка, введіть адресу:',
        buttonTips: {
          bold: {
            title: 'Напівжирний (Ctrl+B)',
            text: 'Зробити напівжирним виділений текст.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          italic: {
            title: 'Курсив (Ctrl+I)',
            text: 'Зробити курсивом виділений текст.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          underline: {
            title: 'Підкреслений (Ctrl+U)',
            text: 'Зробити підкресленим виділений текст.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          increasefontsize: {
            title: 'Збільшити розмір',
            text: 'Збільшити розмір шрифта.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          decreasefontsize: {
            title: 'Зменшити розмір',
            text: 'Зменшити розмір шрифта.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          backcolor: {
            title: 'Заливка',
            text: 'Змінити колір фону для виділеного тексту або абзацу.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          forecolor: {
            title: 'Колір тексту',
            text: 'Змінити колір виділеного тексту або абзацу.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifyleft: {
            title: 'Вирівняти текст по лівому полю',
            text: 'Вирівнювання тексту по лівому полю.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifycenter: {
            title: 'Вирівняти текст по центру',
            text: 'Вирівнювання тексту по центру.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifyright: {
            title: 'Вирівняти текст по правому полю',
            text: 'Вирівнювання тексту по правому полю.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          insertunorderedlist: {
            title: 'Маркери',
            text: 'Почати маркерований список.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          insertorderedlist: {
            title: 'Нумерація',
            text: 'Почати нумерований список.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          createlink: {
            title: 'Вставити гіперпосилання',
            text: 'Створення посилання з виділеного тексту.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          sourceedit: {
            title: 'Вихідний код',
            text: 'Режим редагування вихідного коду.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          }
        }
      })
    }

    if (Ext.grid.header.Container) {
      Ext.apply(Ext.grid.header.Container.prototype, {
        sortAscText: 'Сортувати за зростанням',
        sortDescText: 'Сортувати за спаданням',
        lockText: 'Закріпити стовпець',
        unlockText: 'Відкріпити стовпець',
        columnsText: 'Стовпці'
      })
    }

    if (Ext.grid.feature.Grouping) {
      Ext.apply(Ext.grid.feature.Grouping.prototype, {
        emptyGroupText: '(Порожньо)',
        groupByText: 'Групувати по цьому полю',
        showGroupsText: 'Відображати по групах'
      })
    }

    if (Ext.grid.PropertyColumnModel) {
      Ext.apply(Ext.grid.PropertyColumnModel.prototype, {
        nameText: 'Назва',
        valueText: 'Значення',
        dateFormat: 'd.m.Y'
      })
    }

    if (Ext.SplitLayoutRegion) {
      Ext.apply(Ext.SplitLayoutRegion.prototype, {
        splitTip: 'Тягніть для зміни розміру.',
        collapsibleSplitTip: 'Тягніть для зміни розміру. Подвійний клік сховає панель.'
      })
    }

    if (Ext.layout.BorderLayout && Ext.layout.BorderLayout.SplitRegion) {
      Ext.apply(Ext.layout.BorderLayout.SplitRegion.prototype, {
        splitTip: 'Тягніть для зміни розміру.',
        collapsibleSplitTip: 'Тягніть для зміни розміру. Подвійний клік сховає панель.'
      })
    }

    if (Ext.form.CheckboxGroup) {
      Ext.apply(Ext.form.CheckboxGroup.prototype, {
        blankText: 'Необхідно вибрати щонайменше одну позицію в групі'
      })
    }

    if (Ext.tab.Tab) {
      Ext.apply(Ext.tab.Tab.prototype, {
        closeText: 'Закрити вкладку'
      })
    }

    if (Ext.form.Basic) {
      Ext.form.Basic.prototype.waitTitle = 'Зачекайте, будь ласка...'
    }
  })
}
