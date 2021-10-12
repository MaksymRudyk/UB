# Icons for `ub-icons` font

Content of this folder is combined into the font files + css using `webfont-webpack-plugin`.

To avoid updates conflicts each file name MUST starts from icon 
Unicode code ([private codes range](https://codepoints.net/U+f0001) what starts with `F` should be used.
The file name format is `${icon.unicode}-${icon.name}.svg`.

In case you need to add a new icon - use last number + 1 as a unicode prefix. For example in case last code is `uF096-someFile.svg` then
new icon should be `UF097-newIcon.svg`.

Do not use (or change) existed unicode codes. See [svgicons2svgfont](https://github.com/nfroidure/svgicons2svgfont) for details.