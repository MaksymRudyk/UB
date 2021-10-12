UB.i18nExtend({
  "NMInstallExtensionFirefox": "Om verder te kunnen werken, moet u de <b>\"UBExtension\" </b> extensie voor de Firefox-browser installeren.</p> " +
    "<p>Klik op de link <a href=\"https://addons.mozilla.org/addon/ub-extension/\" target=\"_blank\">EXTENSIE INSTALEREN</a> " +
    " om naar de installatiepagina van extensies te gaan</p>" +
    "<p> Klik in het geopende venster op <b>+Toevoegen aan Firefox</b></p>" +
    "<p>Bevestig de toevoeging van de nieuwe extensie.</p>" +
    "<p>Nadat u de extensie hebt geïnstalleerd, <b> start u uw browser opnieuw!</b></p>",
  "NMInstallExtensionChrome": "<p>Om door te kunnen werken, moet u de extensie <b>\"UBExtension\"</b> voor Google Chrome installeren.</p> " +
    "<p>Klik op de link <a href=\"https://chrome.google.com/webstore/detail/ubextension/{3}\" target=\"_blank\">EXTENSIE INSTALLEREN</a> " +
    " om naar de Google Store te gaan</p>" +
    "<p> Klik in het winkelvenster op de knop <img src=\"models/adminui-pub/ub-extension/ChromePlusFreeEn.png\"/> (misschien <b>+GRATIS</b>)</p>" +
    "<p>Er verschijnt een venster waarin de installatie van extensies wordt bevestigd - klik op \"Toevoegen (Add)\".</p>" +
    "<p>De extensie wordt geïnstalleerd en de knop <b> + FREE </b> verandert van kleur in groen: <img src=\"models/adminui-pub/ub-extension/ChromeAddedEn.png\"/> " +
    "<p>Nadat u de extensie hebt geïnstalleerd, <b> start u uw browser opnieuw!</b></p>",
  "NMInstallExtensionOpera": "<p>Om door te kunnen werken, moet u de extensie <b>\"UBExtension\"</b> voor de Opera-browser installeren.</p> " +
    "<p>Klik op de link <a href=\"models/adminui-pub/ub-extension/UBExtension.crx\" target=\"_blank\">EXTENSIE INSTALLEREN</a>.</p>" +
    "<p>De browser downloadt de extensie en geeft u een bericht bovenaan het scherm. " +
    "Klik in het waarschuwingspaneel op \"Go\"- Opera opent een pagina met geïnstalleerde extensies. Zoek \"UBExtension\" daar en klik op \"Install\" (Installeren)</p> " +
    "<p>De installatie is nu voltooid en u moet uw browser opnieuw opstarten.</p>",
  "NMUpdateExtensionChrome": "<p>Als u wilt blijven werken, moet u <b> {0} </b> updaten naar versie <i> {2} </i>.</p> " +
    "<p>Gewoonlijk werkt de Google Chrome-browser de extensies automatisch bij. Probeer de browser te sluiten/openen. " +
    " Ga voor een handmatige update naar de Google Store <a href=\"https://chrome.google.com/webstore/detail/ubextension/{3}\" target=\"_blank\">via deze link</a> </p>",
  "NMUpdateExtensionOpera": "<p>Om te blijven werken, moet u <b> {0} </b> updaten naar versie <i>{2}</i>.</p> " +
    "<p>Opera werkt extensies normaal gesproken automatisch bij. Probeer de browser te sluiten / te openen. " +
    " Ga voor handmatige update naar <a href=\"models/adminui-pub/ub-extension/UBExtension.crx\" target=\"_blank\">via deze link</a> </p>",
  "NMInstallFeature": "<p>Om deze functionaliteit te gebruiken, moet u <b>{0}</b> installeren.</p> " +
    "<p>Klik op de link <a href=\"{3}\" target=\"_blank\">INSTALLATIE DOWNLOADEN</a>. Zodra de download is voltooid, voert u de installatie uit en volgt u de aanwijzingen.</p>" +
    "<p>Nadat de installatie is voltooid, moet u uw browser opnieuw opstarten.</p>",
  "NMUpdateFeature": "<p>Er is een nieuwe versie <i> {1} </i> van de applicatie <b> {0}</b> ontwikkeld.</p> " +
    "<p>Klik op de link <a href=\"{3}\" target=\"_blank\">UPDATE DOWNLOADEN</a>. Nadat de download is voltooid, voert u de update uit en volgt u de aanwijzingen.</p>" +
    "<p>Nadat de update is voltooid, moet u uw browser opnieuw opstarten.</p>"
})
if (typeof Ext !== 'undefined') {
  Ext.onReady(function () {
    if (Ext.Updater) {
      Ext.Updater.defaults.indicatorText = '<div class="loading-indicator">Aan het laden...</div>'
    }
    if (Ext.view.View) {
      Ext.view.View.prototype.emptyText = '&lt Geen informatie &gt'
    }

    if (Ext.grid.Panel) {
      Ext.grid.Panel.prototype.ddText = '{0} geselecteerde rijen'
    }

    if (Ext.TabPanelItem) {
      Ext.TabPanelItem.prototype.closeText = 'Dit tabblad sluiten'
    }

    if (Ext.form.field.Base) {
      Ext.form.field.Base.prototype.invalidText = 'De waarde in dit veld is ongeldig'
    }

    if (Ext.LoadMask) {
      Ext.LoadMask.prototype.msg = 'Laden...'
      Ext.LoadMask.msg = 'Laden...'
    }

    if (Ext.Date) {
      Ext.Date.monthNames = [
        'Januari',
        'Februari',
        'Maart',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Augustus',
        'Septemner',
        'Oktober',
        'November',
        'December'
      ]

      Ext.Date.shortMonthNames = [
        'Jan',
        'Feb',
        'Mrt',
        'Apr',
        'Мei',
        'Jun',
        'Jul',
        'Aug',
        'Sept',
        'Okt',
        'Nov',
        'Dec'
      ]

      Ext.Date.getShortMonthName = function (month) {
        return Ext.Date.shortMonthNames[month]
      }

      Ext.Date.monthNumbers = {
        'Jan': 0,
        'Feb': 1,
        'Mrt': 2,
        'Apr': 3,
        'Mei': 4,
        'Jun': 5,
        'Jul': 6,
        'Aug': 7,
        'Sept': 8,
        'Okt': 9,
        'Nov': 10,
        'Dec': 11
      }

      Ext.Date.getMonthNumber = function (name) {
        return Ext.Date.monthNumbers[name.substring(0, 1).toUpperCase() + name.substring(1, 3).toLowerCase()]
      }

      Ext.Date.dayNames = [
        'Zondag',
        'Maandag',
        'Dinsdag',
        'Woensdag',
        'Donderdag',
        'Vrijdag',
        'Zaterdag'
      ]

      Ext.Date.getShortDayName = function (day) {
        return Ext.Date.dayNames[day].substring(0, 3)
      }
    }

    if (Ext.MessageBox) {
      Ext.MessageBox.buttonText = {
        ok: 'OK',
        cancel: 'Annuleren',
        yes: 'Ja',
        no: 'Нет'
      }
      Ext.MessageBox.titleText = {
        confirm: 'Bevestiging',
        prompt: 'Informatie',
        wait: 'Laden...',
        alert: 'Even opletten'
      }
    }

    if (Ext.view.AbstractView) {
      Ext.view.AbstractView.prototype.loadingText = 'Laden...'
    }

    if (Ext.util.Format) {
      Ext.apply(Ext.util.Format, {
        dateFormat: 'd-m-Y',
        timeFormat: 'H:i:s',
        datetimeFormat: 'd-m-Y H:i',
        thousandSeparator: ' ',
        decimalSeparator: ',',
        currencySign: ''
      })
    }

    Ext.define('Ext.ru.ux.DateTimePicker', {
      override: 'Ext.ux.DateTimePicker',
      todayText: 'Vandaag',
      timeLabel: 'UU  mm'
    })

    if (Ext.picker.Date) {
      Ext.apply(Ext.picker.Date.prototype, {
        todayText: 'Vandaag',
        minText: 'Deze datum is eerder dan de minimumdatum',
        maxText: 'Deze datum is later dan de maximale datum',
        disabledDaysText: '',
        disabledDatesText: '',
        monthNames: Ext.Date.monthNames,
        dayNames: Ext.Date.dayNames,
        nextText: 'Volgende maand (Control+Rechts)',
        prevText: 'Vorige maande (Control+Links)',
        monthYearText: 'Maand selecteren (Control+Boven/Onder om jaar te selecteren)',
        todayTip: '{0} (Spatiebalk)',
        format: 'd-m-Y',
        altFormats: 'dmY|dmy|d.m.y|d/m/Y|j/m/y|d/n/y|j/m/Y|d/n/Y|d-m-y|d/m|d-m|dm|dmy|dmY|d',
        startDay: 1
      })
    }

    if (Ext.picker.Month) {
      Ext.apply(Ext.picker.Month.prototype, {
        okText: '&#160;OK&#160;',
        cancelText: 'Annuleren'
      })
    }

    if (Ext.toolbar.Paging) {
      Ext.apply(Ext.PagingToolbar.prototype, {
        beforePageText: 'Pagina',
        afterPageText: 'uit {0}',
        firstText: 'Eerste pagina',
        prevText: 'Vorige pagina',
        nextText: 'Volgende pagina',
        lastText: 'Laatste pagina',
        refreshText: 'Updaten',
        displayMsg: 'Records van {0} tot {1} worden weergegeven, totaal is {2}',
        emptyMsg: 'Geen informatie om te vertonen'
      })
    }

    if (Ext.form.field.Text) {
      Ext.apply(Ext.form.field.Text.prototype, {
        minLengthText: 'De minimale lengte van dit veld is {0}',
        maxLengthText: 'De maximale lengte van dit veld is {0}',
        blankText: 'Dit veld is verplicht',
        regexText: '',
        emptyText: null
      })
    }

    if (Ext.form.field.Number) {
      Ext.apply(Ext.form.field.Number.prototype, {
        minText: 'De waarde van dit veld mag niet kleiner zijn dan {0}',
        maxText: 'De waarde van dit veld kan niet groter zijn dan {0}',
        nanText: '{0} is geen nummer'
      })
    }

    if (Ext.form.field.Date) {
      Ext.apply(Ext.form.field.Date.prototype, {
        disabledDaysText: 'Onbeschikbaar',
        disabledDatesText: 'Onbechikbaar',
        minText: 'De datum in dit veld moet later zijn dan',
        maxText: 'De datum in dit veld moet eerder zijn dan {0}',
        invalidText: '{0} is geen geldige datum - de datum moet het formaat {1} hebben',
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
        loadingText: 'Laden...'
      })
    }

    if (Ext.form.field.VTypes) {
      Ext.apply(Ext.form.field.VTypes, {
        emailText: 'Dit veld moet een e-mailadres bevatten in het formaat "gebruiker@voorbeeld.com"',
        urlText: 'Dit veld moet een URL bevatten in het formaat "http: /' + '/www.example.com"',
        alphaText: 'Dit veld mag alleen Latijnse letters en het onderstrepingsteken "_" bevatten',
        alphanumText: 'Dit veld mag alleen Latijnse letters, cijfers en het onderstrepingsteken "_" bevatten'
      })
    }

    if (Ext.form.field.HtmlEditor) {
      Ext.apply(Ext.form.field.HtmlEditor.prototype, {
        createLinkText: 'Gelieve het adres in te voeren:',
        buttonTips: {
          bold: {
            title: 'Dikgedrukt (Ctrl+B)',
            text: 'Dikdrukken toepassen op geselecteerde tekst.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          italic: {
            title: 'Cursief (Ctrl+I)',
            text: 'Cursief toepassen op geselecteerde tekst.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          underline: {
            title: 'Onderstrepen (Ctrl + U)',
            text: 'Onderstrepen toepassen op geselecteerde tekst.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          increasefontsize: {
            title: 'Vergroten',
            text: 'Letters vergroten.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          decreasefontsize: {
            title: 'Verkleinen',
            text: 'Letters verkleinen.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          backcolor: {
            title: 'Achtergrondvulling',
            text: 'Verander de achtergrondkleur voor de geselecteerde tekst of alinea.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          forecolor: {
            title: 'Tekst kleur',
            text: 'Tekst kleur veranderen.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifyleft: {
            title: 'Tekst links uitlijnen',
            text: 'Lijn de tekst links uit.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifycenter: {
            title: 'Gecentreerd',
            text: 'Tekst centreren.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          justifyright: {
            title: 'Tekst rechts uitlijnen',
            text: 'Lijn de tekst rechts uit.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          insertunorderedlist: {
            title: 'Opsommingstekens',
            text: 'Start lijst met opsommingstekens.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          insertorderedlist: {
            title: 'Nummering',
            text: 'Start genummerde lijst.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          createlink: {
            title: 'Hyperlink invoegen',
            text: 'Maak een link van de geselecteerde tekst.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          },
          sourceedit: {
            title: 'Broncode',
            text: 'Naar broncode overschakkelen.',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
          }
        }
      })
    }

    if (Ext.grid.header.Container) {
      Ext.apply(Ext.grid.header.Container.prototype, {
        sortAscText: 'Oplopend sorteren',
        sortDescText: 'Aflopend sorteren',
        lockText: 'Kolom bevriezen',
        unlockText: 'Kolom ontgrendelen',
        columnsText: 'Kolommen'
      })
    }

    if (Ext.grid.feature.Grouping) {
      Ext.apply(Ext.grid.feature.Grouping.prototype, {
        emptyGroupText: '(Leeg)',
        groupByText: 'Op dit veld groeperen',
        showGroupsText: 'Per groep tonen'
      })
    }

    if (Ext.grid.PropertyColumnModel) {
      Ext.apply(Ext.grid.PropertyColumnModel.prototype, {
        nameText: 'Naam',
        valueText: 'Waarde',
        dateFormat: 'd-m-Y'
      })
    }

    if (Ext.SplitLayoutRegion) {
      Ext.apply(Ext.SplitLayoutRegion.prototype, {
        splitTip: 'Sleep om het formaat te wijzigen.',
        collapsibleSplitTip: 'Sleep om het formaat te wijzigen. Dubbelklikken zal het paneel verbergen.'
      })
    }

    if (Ext.layout.BorderLayout && Ext.layout.BorderLayout.SplitRegion) {
      Ext.apply(Ext.layout.BorderLayout.SplitRegion.prototype, {
        splitTip: 'Sleep om het formaat te wijzigen.',
        collapsibleSplitTip: 'Sleep om het formaat te wijzigen. Dubbelklikken zal het paneel verbergen.'
      })
    }

    if (Ext.form.CheckboxGroup) {
      Ext.apply(Ext.form.CheckboxGroup.prototype, {
        blankText: 'U moet ten minste één positie in de groep selecteren'
      })
    }

    if (Ext.tab.Tab) {
      Ext.apply(Ext.tab.Tab.prototype, {
        closeText: 'Tabblad sluiten'
      })
    }

    if (Ext.form.Basic) {
      Ext.form.Basic.prototype.waitTitle = 'Even wachten...'
    }
  })
}
