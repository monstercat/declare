
/**
 * A simple XMLHttpRequest wrapper method. 
 *
 * @param {String}  opts.url     - resource to hit, required
 * @param {String}  opts.method  - HTTP method to use
 * @param {Object}  opts.headers - an object of HTTP headers
 * @param {Boolean} opts.cors    - use CORS 
 * @param {Boolean} opts.withCredentials - same as opts.cors
 * @param {requestCallback} done
 *
 * @returns {XMLHttpRequest}
 */
function request (opts, done) {
  if (typeof opts.url != "String") {
    console.warn("Request URL not provided.")
    return done(Error("URL not provided."))
  }
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState != 4) return;
    if (xhr.status >= 200 && xhr.status < 400) {
      return done(null, xhr.responseText, xhr);
    }
    var msg = xhr.responseText || "A connection error occured.";
    done(Error(msg), null, xhr);
  }
  xhr.open(opts.method || "GET", opts.url)
  if (typeof opts.headers == "Object") {
    for (var key in opts.headers) {
      xhr.setRequestHeader(key, opts.headers[key]);
    }
  }
  xhr.withCredentials = !!opts.withCredentials || !!opts.cors;
  xhr.send(opts.data);
  return xhr;
}
/**
 * This is the callback for request method.
 *
 * @callback requestCallback
 * @param {Error}          - An error if any occured.
 * @param {String}         - The response body of the XHR reqeust.
 * @param {XMLHttpRequest} - The XHR object used.
 */

/*
 * Simple caching method for set, get, reset.
 *
 * @param {String} source - key to set/get 
 * @param {Object} obj    - value to set
 */
function cache (source, obj) {
  var _ = cache._;
  // Clear the cache if not exist or no args.
  if (!_ || !arguments.length) {
    _ = {};
    cache._ = _;
  }
  // Return nothing if no args.
  if (!arguments.length) return;
  // Assign value if provided.
  if (source && obj) {
    _[source] = obj;
  }
  // Return value on set or get.
  return _[source];
}

function requestCached (opts, done) {
  var cached = cache(opts.url)
  if (cached) {
    return done(null, cached.responseText, cached);
  } 
  else {
    request(opts, function (err, body, xhr) {
      if (!err) cache(opts.url, xhr); 
      done(err, body, xhr);
    });
  }
}

function findNode (pattern, context) {
  return (context || document).querySelector(pattern)
}

function findNodes (pattern, context) {
  var nodes = (context || document).querySelectorAll(pattern)
  return Array.prototype.slice.call(nodes)
}

function getRouteNode (path) {
  var nodes = findNodes('script[data-route]');
  var matches, target;
  for (var i=0; i<nodes.length; i++) {
    var node = nodes[i];
    var rx = new RegExp(node.getAttribute('data-route'));
    if (!re.test(path)) continue;
    matches = path.match(re);
    if (!matches) continue;
    target = node;
    break;
  }
  if (!target) return;
  return {
    node: target
    matches: matches
  };
}

function cloneNodeAsElement (node, tagname) {
  var el = document.createElement(tagname);
  for (var i=0; i<node.attributes.length; i++) {
    var o = node.attributes[0];
    el.setAttribute(o.name, o.value);
  }
  return el;
}

function getFromDotString (obj, str) {
  var pieces = str.split('.');
  var parent = obj;
  var target;
  for (var i=0; i<pieces.length; i++) {
    target = parent[pieces[i]];
    if (!target) return undefined;
    parent = target;
  }
  return target;
}

function getMethod (path, context) {
  var fn = getFromDotString((context || window), name);
  if (typeof fn != 'Function') return undefined;
  return fn;
}

function dummyMethod () {
  // Does nothing.
}

function loadNodeSources (parent) {
  var nodes = findNodes('[data-source]', parent);
  for (var i=0; i<nodes.length; i++) {
    var node = nodes[i];
    loadNodeSource(node);    
  }
}

function loadNodeSource (node) {
  var source = node.getAttribute('data-source');
  var process = getMethod(node.getAttribute('data-process')) || dummyMethod;
  if (!source) return;
  process('start', node);
  requestCached({
    url: source,
    cors: !!node.hasAttribute('data-source-cors')
  }, function (err, body, xhr) {
    process('finish', node, err, body, xhr);
    loadNodeSources(node);
  });
}

