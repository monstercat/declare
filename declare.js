
const EvRouteChanged = "routechanged"
const EvViewRender   = "viewrender"
const EvViewRendered = "viewrendered"
const EvModelChanged = "modelchanged"
const EvModelError   = "modelerror"
const EvModelFetch   = "modelfetch"
const EvModelFetched = "modelfetched"
const EvModelSave    = "modelsave"
const EvModelSaved   = "modelsaved"

/**
 * @callback requestCallback
 * @param {Error} err An error if any occurred.
 * @param {string} text The response body of the XHR request.
 * @param {XMLHttpRequest} xhr The XHR object used.
 */

/**
 * @param {Object} opts
 * @param {string} opts.url The resource to hit, required
 * @param {?string} opts.method The HTTP method to use
 * @param {?Object.<string, string>} opts.headers An object of HTTP headers
 * @param {?boolean} opts.cors Enable CORS on the request
 * @param {?boolean} opts.withCredentials Same as opts.cors
 * @param {?boolean} opts.autoSend Sends request immediately, default true
 * @param {?*} opts.data
 * @param {?int} opts.delay
 * @param {requestCallback} done
 * @returns {XMLHttpRequest}
 */
function request(opts, done) {
	if (typeof opts.url !== "string") {
		console.warn("Request URL not provided.")
		return done(Error("URL not provided."), "", null)
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

	let xhr = new XMLHttpRequest()
	xhr.onreadystatechange = function onReadyStateChange() {
		if (xhr.readyState !== XMLHttpRequest.DONE) {
			return
		}
		let obj, err
		let responseContentType = xhr.getResponseHeader("Content-Type")

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
		Object.keys(opts.headers).forEach(key => {
			xhr.setRequestHeader(key, opts.headers[key])
		})
	}
	xhr.withCredentials = !!opts.withCredentials || !!opts.cors
	if (opts.autoSend !== false) {
		xhr.send(opts.data)
	}
	return xhr
}

/**
 * Finds a node by template name using data-template attribute.
 * @param {string} name
 * @returns {HTMLElement}
 */
function findTemplate(name) {
	return findOne(`[data-template="${name}"]`)
}

/**
 * Wrapper for querySelector.
 *
 * @param {string} pattern The CSS string pattern.
 * @param {Node} [context] The context to query on.
 */
function findOne(pattern, context) {
	return (context || document).querySelector(pattern)
}

/**
 * Wrapper for querySelectorAll.
 *
 * @param {string} pattern The CSS string pattern.
 * @param {Node} [context] The context to query on.
 * @returns {Array.<Node>}
 */
function findAll(pattern, context) {
	Array.from((context || document).querySelectorAll(pattern))
}

/**
 * Finds an element in the tree from the desired depth point that matches the
 * given CSS selector or function check.
 * @param {Node} node
 * @param {string|Function} matcher CSS selector or custom function
 * @param {boolean} [checkThis]
 * @returns {Node}
 */
function findParent(node, matcher, checkThis) {
	let check = typeof matcher === 'function' ? matcher : matchElement.bind(null, matcher)
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
 * @param {string} selector
 * @param {HTMLElement} node
 * @returns {boolean}
 */
function matchElement(selector, node) {
	if (node && typeof node.matches === 'function') {
		return node.matches(selector)
	}
	return false
}

/**
 * Gets the value from an object using target dot string syntax.
 * Example of dot string syntax: "address.street"
 * @param {*} target
 * @param {string} dotPath
 * @returns {*}
 */
function dotGet(target, dotPath) {
	if (!dotPath || typeof dotPath !== 'string') {
		return undefined
	}
	let pieces = dotPath.split('.')
	let parent = target
	let value
	for (let i = 0; i < pieces.length; i++) {
		value = parent[pieces[i]]
		if (!value && i !== pieces.length - 1) {
			return undefined
		}
		parent = value
	}
	return value
}

/**
 * Get the window's location URLSearchParameters.
 * @returns {URLSearchParams}
 */
function searchStringToObject() {
	return new URLSearchParams(window.location.search)
}

/**
 * Generate a new UUID v4 string.
 * @returns {string}
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * @typedef {HTMLElement} View
 * @property {Map.<string, Model>} models
 * @property {Map.<string, View>} views
 * @property {string} template
 * @property {Function} bind
 * @property {Function} unbind
 * @property {Function} add
 * @property {Function} remove
 * @property {Function} attachViews
 * @property {Function} detachViews
 * @property {Function} render
 * @property {Function} renderer
 * @property {Function} getScope
 */

/**
 * @param {Object} opts
 * @param {*} [node]
 * @returns {View}
 */
function mkView(opts, node) {
	if (node === undefined) {
		node = document.createElement("div")
	}
	if (!node.viewId || typeof node.viewId !== "string") {
		node.viewId = uuidv4()
	}
	node.models = new Map()
	node.views = new Map()
	node.bind = (opts.bind || viewBind).bind(undefined, node)
	node.unbind = (opts.unbind || viewUnbind).bind(undefined, node)
	node.add = viewAdd.bind(undefined, node)
	node.remove = viewRemove.bind(undefined, node)
	node.attachViews = viewAttachViews.bind(undefined, node)
	node.detachViews = viewDetachViews.bind(undefined, node)
	node.render = viewRender.bind(undefined, node)
	node.renderer = opts.renderer || viewDefaultRenderer
	node.getScope = viewGetScope.bind(undefined, node)
	node.template = opts.template
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

/**
 * @param {View} self
 * @returns {Object.<string, Model>}
 */
function viewGetScope(self) {
	const m = {}
	const keys = self.models.keys()
	for (let key of keys) {
		m[key] = self.models.get(key)
	}
	return m
}

/**
 * @param {View} self
 * @param {string} key
 * @param {Model} model
 */
function viewBind(self, key, model) {
	viewUnbind(self, self.models[key])
	self.models.set(key, model)
	model.addEventListener(EvModelError, self.render)
	model.addEventListener(EvModelChanged, self.render)
}

/**
 * @param {View} self
 * @param {Model} model
 */
function viewUnbind(self, model) {
	if (!model) {
		return
	}
	model.removeEventListener(EvModelError, self.render)
	model.removeEventListener(EvModelChanged, self.render)
}

/**
 * @param {View} self
 * @param {string} sel
 * @param {View} view
 */
function viewAdd(self, sel, view) {
	const arr = self.views.get(sel) || []
	arr.push(view)
	self.views.set(sel, arr)
	findOne(sel, self).appendChild(view)
}

/**
 * @param {View} self
 * @param {string} sel
 * @param {View} view
 */
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
	const parent = findOne(sel, self)
	if (parent === view.parentElement) {
		parent.removeChild(view)
	}
}

/**
 * Removes all views from their parents.
 * @param {View} self
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
 * @param {View} self
 */
function viewAttachViews(self) {
	const keys = self.views.keys()
	for (let key of keys) {
		const root = findOne(key, self)
		const arr = self.views.get(key)
		arr.forEach(view => {
			root.appendChild(view)
		})
	}
}

/**
 * Detaches views, renders, reattaches views, and triggers events.
 * @param {View} self
 * @param {Event} ev
 */
function viewRender(self, ev) {
	//console.log(`${Date.now()} view ${self.viewId} rendering`)
	if (typeof self.template !== "string") {
		return
	}
	self.dispatchEvent(new CustomEvent(EvViewRender))
	self.detachViews()
	let html = ""
	try {
		html = self.renderer(ev, self)
	} catch (e) {
		console.warn(e)
		html = e
	}
	self.innerHTML = html
	self.attachViews()
	self.dispatchEvent(new CustomEvent(EvViewRendered))
}

/**
 * Default renderer stub. Does nothing.
 * @param {View} view
 * @returns {string}
 */
function viewDefaultRenderer(view) {
	console.warn("Please define your own rendering.")
	return "No renderer provided."
}

/**
 * @typedef {EventTarget} Model
 * @property {string} url
 * @property {Object} data
 * @property {XMLHttpRequest} xhrFetch
 * @property {XMLHttpRequest} xhrSave
 * @property {Function} fetch
 * @property {Function} save
 * @property {Function} set
 * @property {Function} get
 * @property {Function} getUrl
 */

/**
 * Makes a model from the provided target.
 * @param {Object} opts
 * @param {*} [target]
 * @returns {Model}
 */
function mkModel(opts, target) {
	if (target === undefined) {
		target = document.createElement("div")
	}
	target.url = opts.url || ""
	target.fetch = (opts.fetch || modelFetch).bind(undefined, target, {
		cors: opts.cors,
	})
	target.save = (opts.save || modelSave).bind(undefined, target, {
		cors: opts.cors,
		method: opts.method,
	})
	target.set = (opts.set || modelSet).bind(undefined, target)
	target.get = (opts.get || modelGet).bind(undefined, target)
	target.getUrl = (opts.getUrl || modelGetUrl).bind(undefined, target)
	target.data = opts.data || {}
	return target
}

/**
 * Fetches data from the server and updates the model.
 * @param {Model} self
 * @param {Object} opts
 * @param {Function} fn
 */
function modelFetch(self, opts, fn) {
	if (self.xhrFetch) {
		self.xhrFetch.abort()
	}
	self.dispatchEvent(new CustomEvent(EvModelFetch))
	self.xhrFetch = request({
		url: self.getUrl(),
		cors: opts.cors,
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
 * @param {Model} self
 * @param {Object} opts
 * @param {Function} fn
 */
function modelSave(self, opts, fn) {
	this.dispatchEvent(new CustomEvent(EvModelSave))
	return request({
		url: self.getUrl(),
		method: opts.method || "POST",
		cors: opts.cors,
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
 * @param {Model} self
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
 * Returns the value found on the models data property using a dot path.
 * @param {Model} self
 * @param {string} path
 * @returns {*}
 */
function modelGet(self, path) {
	if (!path) {
		return self.data
	}
	return dotGet(self.data, path)
}

/**
 * The default way to grab the model's resource url
 * @param {Model} self
 * @returns {string}
 */
function modelGetUrl(self) {
	return self.url
}

/**
 * Trigger a new history state and dispatch an event.
 * @param {string} url
 * @param {Object} state
 * @param {string} title
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
 * @param {Map.<RegExp, Function>} m
 * @param {string} path
 * @returns {boolean}
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
 * navigation. Returns undefined if not intercepted.
 * @param {MouseEvent} ev
 * @returns {Node}
 */
function interceptClick(ev) {
	if ((ev.button !== undefined && ev.button !== 0) || ev.metaKey) {
		return undefined
	}
	if (ev.ctrlKey) {
		return undefined
	}
	const node = findParent(ev.target, "A", true)
	const isAnchor = !!node
	if (!isAnchor ||
		!node.hasAttribute("href") ||
		node.hasAttribute("download")) {
		return undefined
	}
	// Use this instead of node.href to get the actual input string
	const href = node.getAttribute("href")
	if (!isRelativeUrl(href)) {
		return undefined
	}
	return node
}

/**
 * @param {string} url
 * @returns {boolean}
 */
function isRelativeUrl(url) {
	return !(url.indexOf("http") === 0 || url.indexOf("javascript:") === 0)
}