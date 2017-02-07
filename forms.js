function getElementValue (el) {
  var type = el.getAttribute('type')
  return parseElementValue(el, el.value)
}

function getElementInitialValue (el) {
  if (!el.hasAttribute('initial-value')) return
  return parseElementValue(el, el.getAttribute('initial-value'))
}

function isNumberString (str) {
  if (!isNumberString.test) isNumberString.regexp = /^\d+(\.\d+)?$/g
  return isNumberString.regexp.test(str.trim())
}

function parseElementValue (el, value) {
  var type  = (el.getAttribute('type') || "").toLowerCase()
  if (type == 'radio') {
    if (el.checked) return value
    return ''
  }
  if (type == 'checkbox') {
    if (el.checked) {
      if (el.value == '1')
        return true
      return el.value
    }
    else {
      return false
    }
  }
  if (typeof value == 'string' && isNumberString(value)) {
    return Number(value)
  }
  return value
}

function getDataSet (el, checkInitial, ignoreEmpty) {
  var obj = {}
  var els = el.querySelectorAll('[name]')
  for (var i = 0; i < els.length; i++) {
    var kel     = els[i]
    var key     = kel.getAttribute('name')
    var ival    = getElementInitialValue(kel)
    var val     = getElementValue(kel)
    var isRadio = kel.getAttribute('type') == 'radio'
    var isList = el.querySelectorAll('[name="' + key + '"]').length > 0 && key.indexOf('[]') > -1

    if (isList && !(obj[key] instanceof Array)) {
      obj[key] = []
    }

    if (ignoreEmpty && val === '') {
      continue
    } else if (obj && obj[key] && !isRadio) {
      if (!(obj[key] instanceof Array)) {
        obj[key] = [obj[key]]
      }
      if(!isList) {
        obj[key].push(val)
      } else {
        if (val !== false) {
          obj[key].push(val)
        }
      }
    } else if (!checkInitial || (checkInitial && val != ival)) {
      if (!obj) obj = {}
      if (obj[key] && isRadio) continue
      obj[key] = val
    }
  }
  return obj
}

function getTargetDataSet (el, checkInitial, ignoreEmpty) {
  var target = getDataSetTargetElement(el)
  if (!target) return
  return getDataSet(target, checkInitial, ignoreEmpty)
}

function getDataSetTargetElement (el) {
  if(!el) {
    return null
  }
  var target = el.getAttribute('data-set-target')
  if(!target && el.getAttribute('data-set')) {
    return el
  }
  return findNode('[data-set="' + target + '"]')
}

function resetTargetInitialValues (el, obj) {
  var target = getDataSetTargetElement(el)
  if (!target) return
  resetInitialValues(target, obj)
}

function resetInitialValues (el, obj) {
  els = el.querySelectorAll('[initial-value]')
  for (var i = 0; i < els.length; i++) {
    var el    = els[i]
    var value = obj[el.getAttribute('name')]
    // TODO handle radio
    if (value == undefined || value == null)
      value = ""
    el.setAttribute('initial-value', value)
  }
}
