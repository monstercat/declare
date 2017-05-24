/**
 * This is the callback for request method.
 *
 * @callback requestCallback
 * @param {Error} err An error if any occured.
 * @param {String} text The response body of the XHR reqeust.
 * @param {XMLHttpRequest} xhr The XHR object used.
 */

/**
 * A simple XMLHttpRequest wrapper method. 
 *
 * @param {String} opts.url The resource to hit, required
 * @param {String} opts.method The HTTP method to use
 * @param {Object} opts.headers An object of HTTP headers
 * @param {Boolean} opts.cors Enable CORS on the request
 * @param {Boolean} opts.withCredentials Same as opts.cors
 * @param {requestCallback} done
 *
 * @returns {XMLHttpRequest}
 */
function request (opts, done) {
  if (typeof opts.url != "string") {
    console.warn("Request URL not provided.");
    return done(Error("URL not provided."));
  }
  var delay = opts.delay || 0;
  var start = Date.now();
  var fn = function () {
    var now = Date.now();
    var delta = now - start;
    var args = arguments;
    var cb = function () {
      done.apply(this, args)
    }
    if (delta > delay) cb();
    else setTimeout(cb, delay - delta);
  }

  if (typeof opts.headers != 'object') {
    opts.headers = {}
  }

  //Assume if we have no headers set and that we're sending an object that it is JSON
  if(opts.data && typeof(opts.data) == 'object' && !(opts.data instanceof FormData) && !opts.headers['Accept']) {
    opts.headers['Accept'] = 'application/json'
    opts.headers['Content-Type'] = 'application/json'
    opts.data = JSON.stringify(opts.data)
  }

  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState != 4) return;
    var obj, err;
    var responseContentType = xhr.getResponseHeader("Content-Type")
    if (responseContentType && responseContentType.indexOf('application/json') >= 0) {
      try {
        obj = JSON.parse(xhr.responseText);
      } catch (e) {
        console.warn(e)
        err = e
      }
    } else {
      obj = xhr.responseText
    }
    if (xhr.status >= 200 && xhr.status < 300) {
      return fn(err, obj, xhr);
    }
    err = Error("A connection error occured.");
    if (typeof obj == 'object' && typeof obj.message != 'undefined') {
      err.message = obj.message
    } else if (typeof obj != 'undefined' && !!xhr.responseText) {
      err.message = xhr.responseText
    }
    fn(err, null, xhr);
  }
  xhr.open(opts.method || "GET", opts.url)
  if (typeof opts.headers == "object") {
    for (var key in opts.headers) {
      xhr.setRequestHeader(key, opts.headers[key]);
    }
  }
  xhr.withCredentials = !!opts.withCredentials || !!opts.cors;
  xhr.send(opts.data);
  return xhr;
}

/*
 * Simple caching method for set, get, reset.
 *
 * @param {String} source The key to set/get 
 * @param {Object} obj    The value to set
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
 * @param {String} opts.url The resource to hit, required
 * @param {String} opts.method The HTTP method to use
 * @param {Object} opts.headers An object of HTTP headers
 * @param {Boolean} opts.cors Enable CORS on the request
 * @param {Boolean} opts.withCredentials Same as opts.cors
 * @param {requestCallback} done
 *
 * @returns {XMLHttpRequest}
 */
function requestCached (opts, done) {
  var key = opts.method + '_' + opts.url
  var cached = cache(key)
  if (cached) {
    return done(null, cached.body, cached.xhr);
  } 
  else {
    request(opts, function (err, body, xhr) {
      if (!err) {
        cache(key, {
          body: body,
          xhr: xhr
        });
      }
      done(err, body, xhr);
    });
  }
}

/**
 * Wrapper for querySelector.
 *
 * @arg {String} pattern The CSS string pattern.
 * @arg {Node} context The context to query on.
 */
function findNode (pattern, context) {
  return (context || document).querySelector(pattern)
}

/**
 * Wrapper for querySelectorAll.
 *
 * @arg {String} pattern The CSS string pattern.
 * @arg {Node} context The context to query on.
 *
 * @returns {Node[]}
 */
function findNodes (pattern, context) {
  var nodes = (context || document).querySelectorAll(pattern)
  return Array.prototype.slice.call(nodes)
}

/**
 * Wrapper for querySelectorAll.
 *
 * @arg {Node} the child node.
 * @arg {String} the query selector to check against
 * @arg {Bool} whether to check the child for the pattern too
 *
 * @returns {Node}
 */
function findParentWith (child, pattern, checkThis) {
  if(arguments.length == 2) {
    checkThis = true
  }
  if(checkThis) {
    if(child.matches(pattern)) {
      return child
    }
  }
  var curr = child
  do {
    parent = curr.parentNode
    if(parent && parent.matches(pattern)) {
      return parent
    }
    curr = parent
  }
  while(parent)
  return false
}

/**
 * Creates a new element and copies the attributes of the provided node.
 *
 * @arg {Node} node The node to copy attributes from.
 * @arg {String} tagname The tagname to use.
 *
 * @returns {Element}
 */
function cloneNodeAsElement (node, tagname) {
  var el = document.createElement(tagname);
  for (var i=0; i<node.attributes.length; i++) {
    var o = node.attributes[i];
    el.setAttribute(o.name, o.value);
  }
  return el;
}

/**
 * Gets the value from an object using a dot string syntax.
 *
 * @arg {Object} obj The Object to query.
 * @arg {String} str The dot string path.
 * 
 * @returns {Object}
 */
function getFromDotString (obj, str) {
  if(!str) return undefined
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
 * @arg {String} path The dot string query to use.
 * @arg {Object} context The context object to query.
 *
 * @returns {Function}
 */
function getMethod (path, context) {
  var fn = getFromDotString((context || window), path);
  if (typeof fn != 'function') return undefined;
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
 * @arg {Node} parent The node to find children with the attribute.
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
 * @arg {Node} node The node to operate on.
 * @arg {Matches} array The matching $ variables in the source that match the URL
 */
function loadNodeSource (node, matches) {
  if (!matches) matches = {}
  var source = node.getAttribute('data-source')
  var dataProcess = node.getAttribute('data-process')
  var process = getMethod(dataProcess) || dummyMethod;
  process('start', node, null, null, null, matches);
  if (!source) {
    return;
  }
  source = source.replace(/\$(\w+)/g, function (str, a) {
    var match;
    if(!isNaN(parseInt(a))) {
      match = matches[parseInt(a)];
    }
    if (!match) {
      match = getFromDotString(window, a).toString() || a;
    }
    return match;
  })
  requestCached({
    url: source,
    cors: !!node.hasAttribute('data-cors'),
    delay: parseInt(node.getAttribute('data-delay'))
  }, function (err, body, xhr) {
    process('finish', node, err, body, xhr, matches);
    loadNodeSources(node, matches);
  });
}

/**
 * Converts an object to a query string. Only supports flat structured objects.
 *
 * @arg {Object} obj The Object to convert to a string.
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
 * @arg {String} str The string to convert an Object.
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
