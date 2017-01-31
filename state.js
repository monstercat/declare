function go (url, state, title) {
  state = state || {};
  title = title || {};
  history.pushState(state, title, url);
  changeState(url, state, title);
}

function changeState (url, state, title) {
  var el = readState();
  var ev = new CustomEvent("changestate", {
    detail: {
      element: el,
      state: state,
      title: title,
      url: url
    }
  });
  window.dispatch(ev);
}

function readState () {
  cache();
  var str = location.pathname.substr(1);
  var result = getRouteNode(str);
  if (!result) return;
  var node = cloneNodeAsElement(result.node, 'div'); 
  node.innerHTML = result.node.textContent;
  loadNodeSource(node);
  return node;
}

function startState (fn) {
  function on (e) {
    changeState(e.state);
  }
  document.addEventListener("DOMContentLoaded", function (e) {
    window.addEventListener("popstate", on);
    on();
  });
}

function addEventPath(e) {
  e.path = [];
  var elem = e.target;
  while (elem) {
    e.path.push(elem);
    elem = elem.parentElement;
  }
}

function interceptClick (e) {
  if ((e.button != undefined && e.button != 0) || e.metaKey) {
    return true;
  }
  if (e.ctrlKey) return;
  if (!e.path) addEventPath(e);
  var isAnchor = false;
  for (var i = 0; i < e.path.length; i++) {
    t = e.path[i];
    if (t.tagName == "A") {
      isAnchor = true;
      break;
    }
  }
  if (!isAnchor || !t.hasAttribute('href')) return;
  var url = t.getAttribute("href");
  if (url.indexOf('http') == 0) return;
  e.preventDefault();
  go(url);
}
