export default class BetterPromise {
  static defer = () => {
    const deferred = {};
    deferred.promise = new Promise((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });
    return deferred;
  };

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
      if (this.state === 'rejected') return;

      if (state === 'fulfilled' && this.state !== 'pending') return;

      this.state = state;
      this.value = value;
      const {handlers} = this;
      if (!handlers.length && state === 'rejected') {
        this.throwTimeout = setTimeout(() => { throw value; });
      }
      let handler;
      while (handler = handlers.shift()) {
        try { handler[state](value); } catch (er) {
          handlers.unshift(handler);
          complete('rejected', er);
        }
      }
    };

    const resolve = value => {
      if (BetterPromise.isPromise(value)) return value.then(resolve, reject);

      complete('fulfilled', value);
    };

    const reject = reason => complete('rejected', reason);

    this.state = 'pending';
    this.handlers = [];
    try { callback(resolve, reject); } catch (er) { reject(er); }
  }

  then(onFulfilled, onRejected) {
    const {handlers, state, value} = this;
    if (this.throwTimeout) {
      clearTimeout(this.throwTimeout);
      delete this.throwTimeout;
    }
    return new BetterPromise((resolve, reject) => {
      const wrapHandler = fn =>
        value => { try { resolve(fn(value)); } catch (er) { reject(er); } };

      const runFulfilled = onFulfilled ? wrapHandler(onFulfilled) : resolve;
      if (state === 'fulfilled') return runFulfilled(value);

      const runRejected = onRejected ? wrapHandler(onRejected) : reject;
      if (state === 'rejected') return runRejected(value);

      handlers.push({fulfilled: runFulfilled, rejected: runRejected});
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }
}
