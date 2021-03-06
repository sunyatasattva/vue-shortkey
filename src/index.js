let ShortKey = {}
let mapFunctions = {}
let objAvoided = []
let elementAvoided = []
let keyPressed = false

ShortKey.install = (Vue, options) => {
  elementAvoided = [...(options && options.prevent ? options.prevent : [])]
  Vue.directive('shortkey', {
    bind: (el, binding, vnode) => {
      // Mapping the commands
      let b = typeof binding.value === 'string' ? JSON.parse(binding.value.replace(/\'/gi, '"')) : binding.value
      let persistent = binding.modifiers.persistent === true
      let pushButton = binding.modifiers.push === true
      let avoid = binding.modifiers.avoid === true
      let focus = binding.modifiers.focus === true
      let once = binding.modifiers.once === true
      if (pushButton) { delete b.push }
      if (avoid) {
        objAvoided.push(el)
      } else {
        let k = b.join('')
        mapFunctions[k] = {
          'pr': persistent,
          'ps': pushButton,
          'oc': once,
          'fn': !focus,
          'el': vnode.elm
        }
      }
    },
    unbind: (el, binding) => {
      let b = []
      b = typeof binding.value === 'string' ? JSON.parse(binding.value.replace(/\'/gi, '"')) : binding.value
      let pushButton = binding.modifiers.push === true
      if (pushButton) { delete b.push }
      let k = b.join('')
      if (mapFunctions[k].el === el) delete mapFunctions[k]

      objAvoided.filter((itm) => {
        return itm === el ? false : true
      })
    }
  })
}

ShortKey.decodeKey = (pKey) => {
  let k = ''
  if (pKey.key === 'Shift' || pKey.shiftKey) { k += 'shift' }
  if (pKey.key === 'Control' || pKey.ctrlKey) { k += 'ctrl' }
  if (pKey.key === 'Meta'|| pKey.metaKey) { k += 'meta' }
  if (pKey.key === 'Alt' || pKey.altKey) { k += 'alt' }
  if (pKey.key === 'ArrowUp') { k += 'arrowup' }
  if (pKey.key === 'ArrowLeft') { k += 'arrowleft' }
  if (pKey.key === 'ArrowRight') { k += 'arrowright' }
  if (pKey.key === 'ArrowDown') { k += 'arrowdown' }
  if (pKey.key === 'AltGraph') { k += 'altgraph' }
  if (pKey.key === 'Escape') { k += 'esc' }
  if (pKey.key === 'Enter') { k += 'enter' }
  if (pKey.key === 'Tab') { k += 'tab' }
  if ((pKey.key && pKey.key.length === 1) || /F\d{1,2}/g.test(pKey.key)) k += pKey.key.toLowerCase()
  return k
}

ShortKey.keyDown = (pKey) => {
  if ((!mapFunctions[pKey].oc && !mapFunctions[pKey].ps)|| (mapFunctions[pKey].ps && !keyPressed)) {
    const e = document.createEvent('HTMLEvents')
    e.initEvent('shortkey', true, true)
    mapFunctions[pKey].el.dispatchEvent(e)
  }
}
ShortKey.keyUp = (pKey) => {
  const e = document.createEvent('HTMLEvents')
  e.initEvent('shortkey', true, true)
  mapFunctions[pKey].el.dispatchEvent(e)
}

if (process.env.NODE_ENV !== 'test') {
  ;(function () {
    document.addEventListener('keydown', (pKey) => {
      const decodedKey = ShortKey.decodeKey(pKey)

      // Check evict
      if (filteringElement(pKey)) {
        pKey.preventDefault()
        pKey.stopPropagation()
        if (mapFunctions[decodedKey].fn) {
          ShortKey.keyDown(decodedKey)
          keyPressed = true
        } else if (!keyPressed) {
          mapFunctions[decodedKey].el.focus()
          keyPressed = true
        }
      }
    }, true)

    document.addEventListener('keyup', (pKey) => {
      const decodedKey = ShortKey.decodeKey(pKey)
      if (filteringElement(pKey)) {
        pKey.preventDefault()
        pKey.stopPropagation()
        if (mapFunctions[decodedKey].oc || mapFunctions[decodedKey].ps) {
          ShortKey.keyUp(decodedKey)
        }
      }
      keyPressed = false
    }, true)
  })()
}

const filteringElement = (pKey) => {
  const decodedKey = ShortKey.decodeKey(pKey)
  const objectAvoid = objAvoided.find(r => r === document.activeElement)
  const elementSeparate = checkElementType()
  const elementTypeAvoid = elementSeparate.avoidedTypes
  const elementClassAvoid = elementSeparate.avoidedClasses
  const filterTypeAvoid = elementTypeAvoid.find(r => r === document.activeElement.tagName.toLowerCase())
  const filterClassAvoid = elementClassAvoid.find(r => r === '.' + document.activeElement.className.toLowerCase())
  return mapFunctions[decodedKey] && !filterTypeAvoid && !filterClassAvoid
}

const checkElementType = () => {
  let elmTypeAvoid = []
  let elmClassAvoid = []
  elementAvoided.forEach(r => {
    const dotPosition = r.indexOf('.')
    if (dotPosition === 0) {
      elmClassAvoid.push(r)
    } else if (dotPosition > 0) {
      elmTypeAvoid.push(r.split('.')[0])
      elmClassAvoid.push('.' + r.split('.')[1])
    } else {
      elmTypeAvoid.push(r)
    }
  })

  return {avoidedTypes: elmTypeAvoid, avoidedClasses: elmClassAvoid}
}

// export default ShortKey

if (typeof module != 'undefined' && module.exports) {
  module.exports = ShortKey;
} else if (typeof define == 'function' && define.amd) {
  define( function () { return ShortKey; } );
} else {
  window.ShortKey = ShortKey;
}
