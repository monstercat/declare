# Declare

This project provides a simplified library of methods that you can use in your
web applications either if it's a single page app or a static page app that you
need to fetch external data for on the client.

## Basic Usage 

The prime way to use this library is to delcare a data source in your html and
use the library to load the data you wish to see. See example:

HTML

```
<div 
  data-source="https://connect.monstercat.com/api/catalog/browse?limit=25"
  data-process="doBrowse">
</div>
```

JS

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

## Mustache Rendering

TODO

## Browser History State

In `state.js` there are methods provided to help with navigation and rendering
page content based on the browser location.

TODO
