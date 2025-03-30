declare global {
  interface Array<T> {
    random(): T;
  }
}
  
Array.prototype.random = function <T>(): T {
  const randomIdx = Math.floor(Math.random() * this.length);
  return this[randomIdx];
};