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

/**
 * Same as "request" but caches the XMLHttpRequest. Useful for when you may have
 * the same source in many elements.
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

/**
 * Wrapper for querySelector.
 *
 * @arg {String} pattern - CSS string pattern.
 * @arg {Node}   context - the context to query on.
 */
function findNode (pattern, context) {
  return (context || document).querySelector(pattern)
}

/**
 * Wrapper for querySelectorAll.
 *
 * @arg {String} pattern - CSS string pattern.
 * @arg {Node}   context - the context to query on.
 *
 * @returns {Node[]}
 */
function findNodes (pattern, context) {
  var nodes = (context || document).querySelectorAll(pattern)
  return Array.prototype.slice.call(nodes)
}

/**
 * Gets the route node that has regex that matches the path. Object return
 *
 * @arg {String} path - The path regex is tested on.
 *
 * @returns {Object} Object that contains "node" and it's "matches". 
 */
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

/**
 * Creates a new element and copies the attributes of the provided node.
 *
 * @arg {Node}   node    - The node to copy attributes from.
 * @arg {String} tagname - The tagname to use.
 *
 * @returns {Element}
 */
function cloneNodeAsElement (node, tagname) {
  var el = document.createElement(tagname);
  for (var i=0; i<node.attributes.length; i++) {
    var o = node.attributes[0];
    el.setAttribute(o.name, o.value);
  }
  return el;
}

/**
 * Gets the value from an object using a dot string syntax.
 *
 * @arg {Object} obj - The Object to query.
 * @arg {String} str - The dot string path.
 * 
 * @returns {Object}
 */
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

/**
 * Gets a valid function from the context.
 *
 * @arg {String} path    - The dot string query to use.
 * @arg {Object} context - The context object to query.
 *
 * @returns {Function}
 */
function getMethod (path, context) {
  var fn = getFromDotString((context || window), name);
  if (typeof fn != 'Function') return undefined;
  return fn;
}

/**
 * This method does nothing!
 */
function dummyMethod () {
  // Does nothing.
}

/**
 * Finds all nodes of the node provided who have "data-source" attribute and
 * runs loadNodeSource on them.
 *
 * @arg {Node} parent - The node to find children with the attribute.
 */
function loadNodeSources (parent) {
  var nodes = findNodes('[data-source]', parent);
  for (var i=0; i<nodes.length; i++) {
    var node = nodes[i];
    loadNodeSource(node);    
  }
}

/**
 * Runs a cached request against the node with the "data-source" attribute. You
 * can declare "data-process" attributes which will be ran. Declare the
 * "data-cors" attribute to enable CORS on request.
 *
 * @arg {Node} node - The node to operate on.
 */
function loadNodeSource (node) {
  var source = node.getAttribute('data-source');
  var process = getMethod(node.getAttribute('data-process')) || dummyMethod;
  if (!source) return;
  process('start', node);
  requestCached({
    url: source,
    cors: !!node.hasAttribute('data-cors')
  }, function (err, body, xhr) {
    process('finish', node, err, body, xhr);
    loadNodeSources(node);
  });
}

/**
 * Converts an object to a query string. Only supports flat structured objects.
 *
 * @arg {Object} obj - The Object to convert to a string.
 *
 * returns {String}
 */
function objectToQueryString (obj) {
  return Object.keys(obj).map(function (key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key])
  }).join("&")
}

/**
 * Converts a query string to an object.
 *
 * @arg {String} str - The string to convert an Object.
 *
 * @returns {Object}
 */
function queryStringToObject (str) {
  var obj = {}
  if (!str) return obj
  if (str[0] == "?") str = str.substr(1)
  var arr = str.split("&")
  arr.forEach(function (el) {
    var a = el.split("=")
    obj[decodeURIComponent(a[0])] = decodeURIComponent(a[1])
  })
  return obj
}
