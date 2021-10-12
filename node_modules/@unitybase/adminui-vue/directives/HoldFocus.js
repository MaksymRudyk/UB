module.exports = {
  name: 'HoldFocus',

  bind (el) {
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault()
        // get all element which can focus by tab
        const tabableEls = [...el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        const index = tabableEls.findIndex(el => el === document.activeElement)
        const isUnfocus = index === -1
        // if shift pushed tab to prev el else next
        if (e.shiftKey) {
          const isFirst = index === 0
          if (isFirst || isUnfocus) {
            tabableEls[tabableEls.length - 1].focus()
          } else {
            tabableEls[index - 1].focus()
          }
        } else {
          const isLast = tabableEls.length - 1 === index
          if (isLast || isUnfocus) {
            tabableEls[0].focus()
          } else {
            tabableEls[index + 1].focus()
          }
        }
      }
    })
  }
}
