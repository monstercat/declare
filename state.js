/**
 * A helper method to push the new location to the window history and then
 * change the state.
 *
 * @arg {String} url The path used to change the state.
 * @arg {Object} state The state object used for the path.
 * @arg {String} title The title of the state.
 */
function go (url, aState, aTitle) {
  const state = aState || {}
  const title = aTitle || {}

  history.pushState(state, title, url)
  changeState(url, state, title)
}

/**
 * This method can be used to fire a manual page change. Dispatches the
 * "changestate" event on the window.
 *
 * @arg {String} url The path used to change the state.
 * @arg {Object} state The state object used for the path.
 * @arg {String} title The title of the state.
 */
function changeState (url, state, aTitle) {

  const el = readState()
  let title = aTitle

  if (el) {
    title = typeof (title) == 'string' ? title : el.dataset.title
  }
  var ev = new CustomEvent("changestate", {
    detail: {
      element: el,
      state: state,
      title: title,
      url: url
    }
  })

  window.dispatchEvent(ev)
}

/**
 * Clears the cache, finds the node for the current location, and loads it.
 */
function readState () {
  cache()
  var str = location.pathname.substr(1)
  var result = getRouteNode(str)

  if (!result) {
    const ev = new CustomEvent("routenotfound", {
      detail: {
        path: str
      }
    })

    window.dispatchEvent(ev)
    return
  }
  var node = cloneNodeAsElement(result.node, 'div')

  node.innerHTML = result.node.textContent
  loadNodeSource(node, result.matches)
  return node
}

/**
 * Gets the route node that has regex that matches the path. Object return
 *
 * @arg {String} path The path regex is tested on.
 *
 * @returns {Object} Object that contains "node" and it's "matches".
 */
function getRouteNode (path) {
  var nodes = findNodes('[data-route]')
  var matches, target

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i]
    var rx = new RegExp(node.dataset.route)

    if (!rx.test(path)) {
      continue
    }
    matches = path.match(rx)
    if (!matches) {
      continue
    }
    target = node
    break
  }
  if (!target) {
    return
  }
  return {
    node: target,
    matches: matches
  }
}

/**
 * If the object does not have a path and does have a target it creates it. For
 * browser compatability.
 *
 * @arg {Event} e The event to create a path on.
 */
function addEventPath(e) {
  if (e.path) {
    return
  }
  var arr = []
  var i = e.target

  while (i) {
    arr.push(i)
    i = i.parentElement
  }
  e.path = arr
}

/**
 * Simple method for overriding clicking on anchor tags to drive the go method.
 * Good to use for single page apps. Will only work for relative URLs.
 *
 * @arg {Event} e The event used to intercept.
 */
function interceptClick (e) {
  addEventPath(e)
  if ((e.button != undefined && e.button != 0) || e.metaKey) {
    return true
  }
  if (e.ctrlKey) {
    return
  }
  var isAnchor = false

  for (var i = 0; i < e.path.length; i++) {
    t = e.path[i]
    if (t.tagName == "A") {
      isAnchor = true
      break
    }
  }
  if (!isAnchor || !t.hasAttribute("href")) {
    return
  }
  if (t.hasAttribute("download")) {
    return
  }
  var url = t.getAttribute("href")

  if (!isRelativeUrl(url)) {
    return
  }
  e.preventDefault()
  go(url)
}

function isRelativeUrl (url) {
  if (url.indexOf("http") == 0) {
    return false
  }
  if (url.indexOf("javascript:") == 0) {
    return false
  }
  return true
}

/**
 * Set the page title
 *
 * @arg {String} title Title to set the page too
 */
function setPageTitle (title) {
  document.title = title
  history.replaceState(history.state, title, window.location.toString())
}
