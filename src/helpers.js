export function assign(target) {
  if (target == null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  const to = Object(target);

  for (let index = 1; index < arguments.length; index += 1) {
    // eslint-disable-next-line prefer-rest-params
    const nextSource = arguments[index];
    if (nextSource != null) {
      // eslint-disable-next-line no-restricted-syntax
      for (const nextKey in nextSource) {
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }
  return to;
}

const SNAKE_CASE_REGEXP = /[A-Z]/g;
export function kebabCase(name) {
  return name.replace(SNAKE_CASE_REGEXP, (letter, pos) =>
    (pos ? '-' : '') + letter.toLowerCase(),
  );
}
