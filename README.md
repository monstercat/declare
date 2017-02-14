# Declare

This project provides a simplified library of methods that you can use in your
web applications either if it's a single page app or a static page app that you
need to fetch external data for on the client.

The philosophy for this project is to use what the browser gives you and build on top of that. Thus praticies like using "onclick" javascript attributes are expected. You are to build your own functionality around that and be able to pick pieces of tools you wish to use. Most of the code in this repo is optional.

## Basic Usage 

The prime way to use this library is to declare a data source in your html and
use the library to load the data you wish to see. See example:

##### Example

###### HTML

```
<div 
  data-source="https://connect.monstercat.com/api/catalog/browse?limit=25"
  data-process="doBrowse">
</div>
```

###### JS

```
function onBrowse(state, node, err, text, xhr) {
  if (state == 'start') {
    // Show loading...
    return
  }
  else {
    // Play with data here... 
  }
}
```

## Browser History State

In `state.js` there are methods provided to help with navigation and rendering
page content based on the browser location.

##### Example

```
window.addEventListener('changestate', function (el) {
  docuemnt.body.removeChild(document.body.firstElement);
  document.body.appendChild(el);
});
startState();
```

## Rendering (Mustache Supported)

Using render.js you get a few methods to help you render reusable templates. The
render method also assumes that you will want to use the Mustache rendering, if
not it resorts to plain text of the template.

The common use scenario is describing your templates as scripts in your html using
the "data-template" attribute. Providing "data-partial" indicates that your
template can also be used as a partial.

The following is an example of a setup you may implement.

##### Example

###### HTML

```
<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Title</th>
      <th>Album</th>
      <th>Artist</th>
    </tr>
  </thead>
  <tbody
    data-source="https://connect.monstercat.com/api/catalog/browse?limit=25"
    data-process="doBrowse">
    <tr>
      <td colspan=4>Loading...</td>
    </tr>
  </tbody>
</table>
<script type="text/template" data-template="browse">
{{#error}}
<tr>
  <td colspan=4>{{message}}</td>
</tr>
{{/error}}
{{#results}}
<tr>
  <td>{{track_number}}</td>
  <td>{{title}}</td>
  <td>{{album}}</td>
  <td>{{artist}}</td>
</tr>
{{#results}}
</script>
```

###### JS

```
var tbody = findNode("tbody");
loadNodeSource(tbody);

function onBrowse(state, node, err, text, xhr) {
  if (state != 'finish') return;
  var obj = {
    error: err,
    results: err ? undefined : JSON.parse(text)
  }
  render('browse', obj, node);
}
```

