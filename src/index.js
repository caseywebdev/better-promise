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
      if (this.state !== 'pending') return;

      this.state = state;
      this.value = value;
      let handler;
      while (handler = this.handlers.shift()) {
        try { handler[state](value); } catch (er) {
          if (state === 'fulfilled') handler.rejected(er);
          else throw er;
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
    return new BetterPromise((resolve, reject) => {
      const {handlers, state, value} = this;

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
