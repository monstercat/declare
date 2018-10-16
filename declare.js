/**
 * This is the callback for request method.
 *
 * @callback requestCallback
 * @param {Error} err An error if any occurred.
 * @param {String} text The response body of the XHR request.
 * @param {XMLHttpRequest} xhr The XHR object used.
 */

/**
 * A simple XMLHttpRequest wrapper method.
 *
 * @param {Object} opts
 * @param {String} opts.url The resource to hit, required
 * @param {String} opts.method The HTTP method to use
 * @param {Object} opts.headers An object of HTTP headers
 * @param {Boolean} opts.cors Enable CORS on the request
 * @param {Boolean} opts.withCredentials Same as opts.cors
 * @param {Boolean} opts.autosend Sends request immediately, default true
 * @param {requestCallback} done
 *
 * @returns {XMLHttpRequest}
 */
function request(opts, done) {
	if (typeof opts.url !== "string") {
		console.warn("Request URL not provided.")
		return done(Error("URL not provided."))
	}
	let delay = opts.delay || 0
	let start = Date.now()
	let fn = done

	if (opts.delay > 0) {
		fn = function () {
			const now = Date.now()
			const delta = now - start
			if (delta > delay) {
				done.apply(null, arguments)
			} else {
				setTimeout(done.bind(null, arguments), delay - delta)
			}
		}
	}

	if (typeof opts.headers !== 'object') {
		opts.headers = {}
	}

	//Assume if no headers set and that we're sending an obj that it's JSON
	if (opts.data && typeof opts.data === 'object'
		&& !(opts.data instanceof FormData)
		&& !opts.headers.Accept) {
		opts.headers.Accept = 'application/json'
		opts.headers['Content-Type'] = 'application/json'
		opts.data = JSON.stringify(opts.data)
	}

	var xhr = new XMLHttpRequest()

	xhr.onreadystatechange = function onReadyStateChange() {
		if (xhr.readyState !== XMLHttpRequest.DONE) {
			return
		}
		var obj, err
		var responseContentType = xhr.getResponseHeader("Content-Type")

		if (responseContentType && responseContentType.indexOf('application/json') >= 0) {
			try {
				obj = JSON.parse(xhr.responseText)
			} catch (e) {
				console.warn(e)
				err = e
			}
		} else {
			obj = xhr.responseText
		}
		if (xhr.status >= 200 && xhr.status < 400) {
			fn(err, obj, xhr)
			return
		}
		err = Error("A connection error occurred.")
		if (typeof obj === 'object' && typeof obj.message !== 'undefined') {
			err.message = obj.message
		}
		else if (typeof obj !== 'undefined' && !!xhr.responseText) {
			err.message = xhr.responseText
		}
		fn(err, null, xhr)
	}
	xhr.open(opts.method || "GET", opts.url)
	if (typeof opts.headers === "object") {
		for (let key in opts.headers) {
			xhr.setRequestHeader(key, opts.headers[key])
		}
	}
	xhr.withCredentials = !!opts.withCredentials || !!opts.cors
	if (opts.autosend !== false) {
		xhr.send(opts.data)
	}
	return xhr
}

/**
 * Finds a node by template name.
 *
 * @param name
 * @returns {HTMLElement}
 */
function findTemplate(name) {
	return findNode(`[data-template="${name}"]`)
}

/**
 * Wrapper for querySelector.
 *
 * @arg {String} pattern The CSS string pattern.
 * @arg {Node} context The context to query on.
 */
function findNode(pattern, context) {
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
function findNodes(pattern, context) {
	return Array.prototype.slice
		.call((context || document)
			.querySelectorAll(pattern))
}

/**
 * Finds an element in the tree from the desired depth point that matches the
 * given CSS selector or function check
 *
 * @arg {Node} node - The child node to start at.
 * @arg {String|Function} matcher - The CSS selector or function to match with.
 * @arg {Bool} checkThis - Also check the initial node.
 *
 * @returns {Node}
 */
function findNodeParent(node, matcher, checkThis) {
	let check = typeof matcher === 'function' ? matcher : matchNode.bind(null, matcher)
	if (arguments.length === 2) {
		checkThis = true
	}
	if (checkThis && check(node)) {
		return node
	}
	while (node) {
		node = node.parentNode
		if (check(node)) {
			return node
		}
	}
	return undefined
}

/**
 * Stub for node.matches
 *
 * @arg {String} selector - The selector to match with
 * @arg {Node} node - The node to do the selector match on
 *
 * @returns {Boolean}
 */
function matchNode(selector, node) {
	if (node && typeof node.matches === 'function') {
		return node.matches(selector)
	}
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
function cloneNodeAsElement(node, tagname) {
	let el = document.createElement(tagname)
	for (let i = 0; i < node.attributes.length; i++) {
		let o = node.attributes[i]
		el.setAttribute(o.name, o.value)
	}
	return el
}

/**
 * Gets the value from an object using a dot string syntax.
 *
 * @arg {Object} obj The Object to query.
 * @arg {String} str The dot string path.
 *
 * @returns {*}
 */
function getFromDotString(obj, str) {
	if (!str || typeof str !== 'string') {
		return undefined
	}
	let pieces = str.split('.')
	let parent = obj
	let target
	for (var i = 0; i < pieces.length; i++) {
		target = parent[pieces[i]]
		if (!target && i !== pieces.length - 1) {
			return undefined
		}
		parent = target
	}
	return target
}

/**
 * Gets a valid function from the context.
 *
 * @arg {String} path The dot string query to use.
 * @arg {Object} context The context object to query.
 *
 * @returns {Function}
 */
function getMethod(path, context) {
	const fn = getFromDotString((context || window), path)
	if (typeof fn !== 'function') {
		return undefined
	}
	return fn
}

/**
 * Helper wrapper that gets query string object from
 * what's in the current url
 *
 * @returns {Object}
 */
function searchStringToObject() {
	return new URLSearchParams(window.location.search)
}

/**
 * Generate a new UUID v4 string.
 * @return {String}
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/* VIEW */

const EvViewRender   = "viewrender"
const EvViewRendered = "viewrendered"

/**
 * @params {HTMLElement} node
 * @params {Object} opts
 */
function mkView(opts, node) {
	if (node === undefined) {
		node = document.createElement("div")
	}
	node.viewId      = uuidv4()
	node.models      = new Map()
	node.views       = new Map()
	node.bind        = (opts.bind || viewBind).bind(undefined, node)
	node.unbind      = (opts.unbind || viewUnbind).bind(undefined, node)
	node.add         = viewAdd.bind(undefined, node)
	node.remove      = viewRemove.bind(undefined, node)
	node.attachViews = viewAttachViews.bind(undefined, node)
	node.detachViews = viewDetachViews.bind(undefined, node)
	node.render      = viewRender.bind(undefined, node)
	node.renderer    = opts.renderer || viewGlobalRender
	node.getScope    = viewGetScope.bind(undefined, node)
	node.template    = opts.template
	if (opts.templateName) {
		let n = findTemplate(opts.templateName)
		if (n) {
			node.template = n.textContent
		}
	} else if (typeof node.template !== "string") {
		node.template = node.innerHTML
	}
	return node
}

function viewGetScope(self) {
	const m = {}
	const keys = self.models.keys()
	for (let key of keys) {
		m[key] = self.models.get(key).data
	}
	return m
}

function viewBind(self, key, model) {
	viewUnbind(self, self.models[key])
	self.models.set(key, model)
	model.addEventListener(EvModelError, self.render)
	model.addEventListener(EvModelChanged, self.render)
}

function viewUnbind(self, model) {
	if (!model) {
		return
	}
	model.removeEventListener(EvModelError, self.render)
	model.removeEventListener(EvModelChanged, self.render)
}

function viewAdd(self, sel, view) {
	const arr = self.views.get(sel) || []
	arr.push(view)
	self.views.set(sel, arr)
	findNode(sel, self).appendChild(view)
}

function viewRemove(self, sel, view) {
	const arr = self.views.get(sel)
	if (!Array.isArray(arr)) {
		console.warn("View selector not found.", sel, view)
		return
	}
	let index = arr.indexOf(view)
	while (index > -1) {
		arr.splice(index, 1)
		index = arr.indexOf(view)
	}
	self.views.set(sel, arr)
	const parent = findNode(sel, self)
	if (parent == view.parentElement) {
		parent.removeChild(view)
	}
}

/**
 * Removes all views from their parents.
 * @param self
 */
function viewDetachViews(self) {
	for (let arr of self.views) {
		arr.forEach(view => {
			if (view.parentElement) {
				view.parentElement.removeChild(view)
			}
		})
	}
}

/**
 * Appends all target selector children views back to the tree.
 * @param self
 */
function viewAttachViews(self) {
	const keys = self.views.keys()
	for (let key of keys) {
		const root = findNode(key, self)
		const arr = self.views.get(key)
		arr.forEach(view => {
			root.appendChild(view)
		})
	}
}

function viewRender(self, ev) {
	//console.log(`${Date.now()} view ${self.viewId} rendering`)
	if (typeof self.template !== "string") {
		return
	}
	self.dispatchEvent(new CustomEvent(EvViewRender))
	self.detachViews()
	let html = ""
	try {
		html = self.renderer(self)
	} catch (e) {
		console.warn(e)
		html = e
	}
	self.innerHTML = html
	self.attachViews()
	self.dispatchEvent(new CustomEvent(EvViewRendered))
}

function viewGlobalRender(view) {
	console.warn("Please define your own rendering.")
	return "No renderer provided."
}

/* MODEL */

const EvModelChanged = "modelchanged"
const EvModelError   = "modelerror"
const EvModelFetch   = "modelfetch"
const EvModelFetched = "modelfetched"
const EvModelSave    = "modelsave"
const EvModelSaved   = "modelsaved"

/**
 * Makes a model from the provided EventTarget.
 * @params {EventTarget} node
 * @params {Object} opts
 */
function mkModel(opts, node) {
	if (node === undefined) {
		node = document.createElement("div")
	}
	node.url        = opts.url || ""
	node.fetch      = (opts.fetch || modelFetch).bind(undefined, node)
	node.save       = (opts.save || modelSave).bind(undefined, node, "POST")
	node.set        = (opts.set || modelSet).bind(undefined, node)
	node.get        = (opts.get || modelGet).bind(undefined, node)
	node.getUrl     = (opts.getUrl || modelGetUrl).bind(undefined, node)
	node.cors       = !!opts.cors || false
	node.data       = opts.data || {}
	return node
}

/**
 * Fetches data from the server and updates the model.
 * @param self
 * @param {Function} fn
 */
function modelFetch(self, fn) {
	if (self.xhrFetch) {
		self.xhrFetch.abort()
	}
	self.dispatchEvent(new CustomEvent(EvModelFetch))
	self.xhrFetch = request({
		url: self.getUrl(),
		cors: self.cors,
	}, (err, body, xhr) => {
		let ev
		let detail = { detail: {
			properties: body,
			xhr: xhr,
			error: err,
		} }
		if (err) {
			ev = new CustomEvent(EvModelError, detail)
		} else {
			ev = new CustomEvent(EvModelFetched, detail)
			self.set(body)
		}
		self.dispatchEvent(ev)
		fn(err, body, xhr)
	})
	return self.xhrFetch
}

/**
 * Makes a request to the server to save data.
 * @param {Object} self
 * @param {String} method
 * @param {Function} fn
 */
function modelSave(self, method, fn) {
	this.dispatchEvent(new CustomEvent(EvModelSave))
	return request({
		url: self.getUrl(),
		method: method,
		cors: self.cors,
		data: self.data,
	}, (err, body, xhr) => {
		let ev
		let detail = { detail: {
			properties: body,
			xhr: xhr,
			error: err,
		} }
		if (err) {
			ev = new CustomEvent(EvModelError, detail)
		} else {
			ev = new CustomEvent(EvModelSaved, detail)
			self.set(body)
		}
		self.dispatchEvent(ev)
		fn(err, body, xhr)
	})
}

/**
 * Sets a new data object for the model and dispatches an event.
 * @param self
 * @param {Object} obj
 */
function modelSet(self, obj) {
	Object.assign(self.data, obj)
	let ev = new CustomEvent(EvModelChanged, {
		detail: {
			properties: obj,
		}
	})
	self.dispatchEvent(ev)
}

/**
 * Returns the value found on the models data property by the dot path.
 * @param self
 * @param {String} path
 * @returns {*}
 */
function modelGet(self, path) {
	if (!path) {
		return self.data
	}
	return getFromDotString(self.data, path)
}

/**
 * The default way to grab the model's resource url
 * @param self
 * @returns {String}
 */
function modelGetUrl(self) {
	return self.url
}

/* ROUTE */

const EvRouteChanged = "routechanged"

/**
 * Trigger a new history state and dispatch an event.
 * @param {String} url
 * @param {Object} state
 * @param {String} title
 */
function go(url, state = {}, title = "") {
	history.pushState(state, title, url)
	window.dispatchEvent(new CustomEvent(EvRouteChanged, {
		detail: {
			state: state,
			title: title,
			path: location.pathname.substr(1),
		}
	}))
}

/**
 * Execute a function in the map based on the path match.
 * @param {Map<RegExp, Function>} m
 * @param {String}
 */
function changeRoute(m, path) {
	const matchers = m.keys()
	for (const rx of matchers) {
		if (!rx.test(path)) {
			continue
		}
		let matches = path.match(rx)
		if (!matches) {
			continue
		}
		const c = m.get(rx)
		if (typeof c !== "function") {
			console.warn("Execution route is not a function.")
			return
		}
		c(matches)
		return true
	}
	return false
}

/**
 * Intercept clicks on the page and dispatch an event. Useful to override page
 * navigation.
 * @param {ClickEvent} ev
 */
function interceptClick(ev) {
	if ((ev.button != undefined && ev.button != 0) || ev.metaKey) {
		return undefined
	}
	if (ev.ctrlKey) {
		return undefined
	}
	const node = findNodeParent(ev.target, "A", true)
	const isAnchor = !!node
	if (!isAnchor ||
		!node.hasAttribute("href") ||
		node.hasAttribute("download")) {
		return undefined
	}
	// Use this intead of node.href to get the actual input string
	const href = node.getAttribute("href")
	if (!isRelativeUrl(href)) {
		return undefined
	}
	return node
}

/**
 * @param {String} url
 */
function isRelativeUrl(url) {
	if (url.indexOf("http") == 0 ||
		url.indexOf("javascript:") == 0) {
		return false
	}
	return true
}