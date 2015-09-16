
#v0.3.1

* Improved output when the actual is a string, and the expected is a component
  Previously, the actual text was quoted, which was inaccurate

#v0.3.0

* Internal refactor
* Fixed error when handling and improved output for strings-that-should-be-components, and vice versa.

e.g.
```js
renderer.render(
  <div>
     <span>abc</span>
  </div>
);

expect(renderer, 'to have rendered',
  <div>
     abc
  </div>
);
```

The `<span>` should actually just a straight string `'abc'`, rather than `'abc'` wrapped in a `<span>`.
Works both ways round.

#v0.2.0

* Numbers and other non-string value types are concatenated as strings for the non-`exactly` variants
  This means `Button was clicked {clickCount} times` expressions can be checked using a simple string check
  e.g.
```js
  expect(renderer, 'to have rendered', '<span>Button was clicked 5 times</span>');
```

#v0.1.2

* First version (that worked)
