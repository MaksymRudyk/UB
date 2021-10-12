# PDF Document builder

Create PDF documents on server / in browser with Unicode fonts support.

Used by {@link module:@unitybase/ubs#module:UBServerReport} for transformation
report rendered as HTML to PDF

## Unicode font generation
Font JSON can be generated from TTF using [PDF Font importer](https://git-pub.intecracy.com/unitybase/ub-tools/-/tree/master/PdfFontImporter) 

## Font mapping
Font mapping can be defined in `uiSettings.adminUI.pdfFontMapping` sections as such:

```json
{
  "adminUI": {
    "pdfFontMapping": {
      "TimesNewRoman": "TimesNewRoman_Cyr"
    }
  }
}
```

in this case every call to 
```PDF.csPrintToPdf.requireFonts({ fontName: 'TimesNewRoman', fontStyle: '...' },```
will actually load a `TimesNewRoman_Cyr` font.

