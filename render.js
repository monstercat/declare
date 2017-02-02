/**
 * Simple function to retrieve a template node.
 *
 * @arg {String} name The name of the template to look up.
 *
 * @returns {Element}
 */
function getTemplate (name) {
  return findOne('[data-template="'+name+'"]');
}

/**
 * Returns all templates that are tagged as partials using "data-partial".
 *
 * @returns {Element[]}
 */
function getPartials () {
  var els = findAll('[data-partial]');
  var obj = {};
  for(var i=0; i<els.length; i++) {
    obj[els[i].getAttribute('data-template')] = els[i].textContent;
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
function render (name, scope, el, paritals) {
  var tmpl = getTemplate(name);
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
