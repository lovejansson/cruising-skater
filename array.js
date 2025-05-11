/**
 * Adds a `random` method to the Array prototype, which returns a random element from the array.
 * @returns {*} A random element from the array.
 */
Array.prototype.random = function () {
  const randomIdx = Math.floor(Math.random() * this.length);
  return this[randomIdx];
};