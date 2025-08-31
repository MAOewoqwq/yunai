// Minimal shim for '@emotion/is-prop-valid'
// Always returns true, allowing all props to be forwarded to DOM elements.
// If you need stricter filtering, replace this with a more complete implementation.

export default function isPropValid(propName) {
  // Common non-DOM props can be filtered if desired:
  // const blocked = new Set(['theme', 'as', 'css']);
  // return !blocked.has(propName);
  return true;
}

