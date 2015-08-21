#v0.1.2

* First version (that worked)

#v0.2.0

* Numbers and other non-string value types are concatenated as strings for the non-`exactly` variants
  This means `Button was clicked {clickCount} times` expressions can be checked using a simple string check
  e.g.
```js
  expect(renderer, 'to have rendered', '<span>Button was clicked 5 times</span>');
```

