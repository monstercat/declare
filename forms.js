/**
 * Found at https://github.com/christianalfoni/form-data-to-object
 *
 * @arg {FormData} formData The form data to convert to an object.
 *
 * @returns {Object}
 */
function formDataToObject(formData) {
  var source = {}
  for(var pair of formData.entries()) {
    source[pair[0]] = pair[1]
  }
  return Object.keys(source).reduce(function (output, key) {
    var parentKey = key.match(/[^\[]*/i);
    var paths = key.match(/\[.*?\]/g) || [];
    paths = [parentKey[0]].concat(paths).map(function (key) {
      return key.replace(/\[|\]/g, '');
    });
    var currentPath = output;
    while (paths.length) {
      var pathKey = paths.shift();
      if (pathKey in currentPath) {
        currentPath = currentPath[pathKey];
      } else {
        currentPath[pathKey] = paths.length ? isNaN(paths[0]) ? {} : [] : source[key];
        currentPath = currentPath[pathKey];
      }
    }

    return output;
  }, {});
}

/**
* Fixes form data objects with numberic keys where some may have been removed
* This turns {data: {0: 'one', 2: 'three'}} into data {0: 'one', 1: 'three'}
* And also turns {itemOne: '1', itemEight: '1'} into ['itemOne', 'itemEight']
* @returns {Object}
*/
function fixFormDataIndexes (formData, fields) {
  fields.forEach(function (name) {
    var ev = 'var value = formData.' + name
    eval(ev)

    if(value != undefined) {
      var newVal = []
      //This is for arrays that might have messed up indexes
      //this happens when nodes are deleted from the DOM
      //then FormData is used to get data
      if(value instanceof Array) {
        for(var k in value) {
          newVal.push(value[k])
        }
      }
      //
      //{gold: 1, sync: 1}
      //
      //['gold', 'sync']
      else if(typeof (value) == 'object') {
        for(var key in value) {
          if(value[key] && parseInt(value[key]) != 0) {
            newVal.push(key)
          }
        }
      }
      var set = 'formData.' + name + ' = newVal'
      eval(set)
    }
  })
  return formData
}

/**
 * Wrapper to convert form element data to object.
 *
 * @arg {Element} form The form to get data from.
 *
 * @returns {Object}
 */
function formToObject (form) {
  return formDataToObject(new FormData(form))
}
