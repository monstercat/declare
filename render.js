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
function render (name, scope, el, partials) {
  var tmpl = getTemplate(name);
  partials = partials || render.defaultPartials
  if (!tmpl) return;
  el = el || cloneNodeAsElement(tmpl, tmpl.getAttribute('data-tagname') || 'div');

  if (window.Mustache && window.Mustache.render) {
    el.innerHTML = Mustache.render(tmpl.textContent, scope, partials);
  }
  else if(window.Handlebars) {
    var template = Handlebars.compile(tmpl.textContent)
    el.innerHTML = template(scope)
  }
  else {
    el.innerHTML = tmpl.textContent;
  }
  return el;
}
render.defaultPartials = {}

/**
 * Finds all the partial views that your app has and registers them.
 * 
 */
function registerPartials () {
  var partials = getPartials()
  console.log('partials', partials);
  if(window.Handlebars) {
    for(var key in partials) {
      Handlebars.registerPartial(key, partials[key])
    }
  }
  else if(window.Mustache) {
    render.defaultPartials = partials
  }
}