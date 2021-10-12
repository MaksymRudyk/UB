## all-fa-icons

all-fa-icons is made from executing a script (in console)

Page https://fontawesome.com/cheatsheet/free/regular

```javascript
var names = new Set();
var icons = document.getElementsByClassName('icon');
for (const icon of icons) {
  const name = icon.getElementsByTagName('dd')[0].innerText;
  names.add('far fa-' + name);
}
console.log(JSON.stringify(Array.from(names)));
```

page https://fontawesome.com/cheatsheet/free/solid and 
```javascript
var names = new Set();
var icons = document.getElementsByClassName('icon');
for (const icon of icons) {
  const name = icon.getElementsByTagName('dd')[0].innerText;
  names.add('fas fa-' + name);
}
console.log(JSON.stringify(Array.from(names)));
```