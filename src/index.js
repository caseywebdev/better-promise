export default class BetterPromise {
  static isPromise = obj => obj && typeof obj.then === 'function';

  static promisify = (fn, context) => (...args) =>
    new BetterPromise((resolve, reject) =>
      context::fn(...args, (er, val) => er ? reject(er) : resolve(val))
    );

  static resolve = value => new BetterPromise(resolve => resolve(value));

  static reject = reason => new BetterPromise((_, reject) => reject(reason));

  static all = promises =>
    new BetterPromise((resolve, reject) => {
      const {length} = promises;
      const values = [];
      if (!length) return resolve(values);

      let done = 0;
      for (let i = 0; i < length; ++i) {
        BetterPromise.resolve(promises[i]).then(value => {
          values[i] = value;
          if (++done === length) resolve(values);
        }, reject);
      }
    });

  static race = promises =>
    new BetterPromise((resolve, reject) => {
      for (let i = 0, l = promises.length; i < l; ++i) {
        BetterPromise.resolve(promises[i]).then(resolve, reject);
      }
    });

  constructor(callback) {
    const complete = (state, value) => {
      const {handlers, handlers: {length: l}} = this;
      this.state = state;
      this.value = value;
      for (let i = 0; i < l; ++i) handlers[i][state](value);
      handlers.length = 0;
    };

    const resolve = value => {
      if (BetterPromise.isPromise(value)) return value.then(resolve, reject);
      try { complete('fulfilled', value); } catch (er) { reject(er); }
    };

    const reject = reason => complete('rejected', reason);

    this.state = 'pending';
    this.handlers = [];
    try { callback(resolve, reject); } catch (er) { reject(er); }
  }

  then(onFulfilled, onRejected) {
    return new BetterPromise((resolve, reject) => {
      const {handlers, state, value} = this;

      const runFulfilled =
        onFulfilled ? value => resolve(onFulfilled(value)) : resolve;

      const runRejected =
        onRejected ? value => resolve(onRejected(value)) : reject;

      if (state === 'fulfilled') return runFulfilled(value);

      if (state === 'rejected') return runRejected(value);

      handlers.push({fulfilled: runFulfilled, rejected: runRejected});
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }
}
