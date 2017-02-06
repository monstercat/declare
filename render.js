/**
 * Simple function to retrieve a template node.
 *
 * @arg {String} name The name of the template to look up.
 *
 * @returns {Element}
 */
function getTemplate (name) {
  return findNode('[data-template="'+name+'"]');
}

/**
 * Returns all templates that are tagged as partials using "data-partial".
 *
 * @returns {Element[]}
 */
function getPartials () {
  var els = findNodes('[data-partial]');
  var obj = {};
  for(var i=0; i<els.length; i++) {
    obj[els[i].getAttribute('data-partial')] = els[i].textContent;
  }
  return obj;
}

/**
 * Renders the content of a template. Supports mustache templates if detected.
 *
 * @arg {String}  name The name of template to look up.
 * @arg {Object}  scope The object of data to use to render with.
 * @arg {Element} el The parent element to render in. If none provided
 *                   one will be created. Use "data-tagname" to specify
 *                   tag in template.
 * @arg {Object}  partials The partials to be used in rendering.
 * 
 * @returns {Element}
 */
function render (name, scope, el, partials) {
  var tmpl = getTemplate(name);
  partials = partials || getPartials()
  if (!tmpl) return;
  el = el || cloneNodeAsElement(tmpl, tmpl.getAttribute('data-tagname') || 'div');
  if (Mustache && Mustache.render) {
    el.innerHTML = Mustache.render(tmpl.textContent, scope, partials);
  }
  else {
    el.innerHTML = tmpl.textContent;
  }
  return el;
}

/**
 * Renders the content of a template into the [role=content] element
 *
 * @arg {String}  name The name of template to look up.
 * @arg {Object}  scope The object of data to use to render with.
 * @arg {Object}  partials The partials to be used in rendering.
 * 
 * @returns {Element}
 */
function renderContent (name, scope, partials) {
  return render(name, scope, findNode('[role=content]'), partials)
}