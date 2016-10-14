import {expect} from 'chai';

const {describe, it} = global;

import Promise from '.';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('BetterPromise', () => {
  it('can sync resolve', () => {
    let foo = 'bar';
    Promise.resolve('baz').then(val => foo = val);
    expect(foo).to.equal('baz');
  });

  it('can sync reject', () => {
    let foo = 'bar';
    Promise.reject('baz').catch(val => foo = val);
    expect(foo).to.equal('baz');
  });

  it('can reject if the initial callback throws', () => {
    let foo = 'bar';
    new Promise(() => { throw 'baz'; }).catch(val => foo = val);
    expect(foo).to.equal('baz');
  });

  it('can chain', done => {
    new Promise(resolve => resolve(Promise.resolve('foo')))
      .then(val => {
        expect(val).to.equal('foo');
        return 'bar';
      })
      .then(val => {
        expect(val).to.equal('bar');
        throw 'baz';
      })
      .catch(val => {
        expect(val).to.equal('baz');
        const p = new Promise(resolve => setTimeout(resolve));
        p.then(() => { throw 'buz'; })
          .catch(er => expect(er).to.equal('buz'))
          .then(() => done(), done);
      });
  });

  it('resolves in order', done => {
    Promise.all([
      new Promise(resolve => setTimeout(() => resolve('foo'))),
      Promise.resolve('bar'),
      new Promise(resolve => setTimeout(() => resolve('baz')))
    ]).then(val => {
      expect(val).to.deep.equal(['foo', 'bar', 'baz']);
      done();
    }).catch(done);
  });

  it('bails on race early', done => {
    Promise.race([
      sleep(10).then(() => { throw 'foo'; }),
      sleep(20)
    ]).then(() => { throw 'should not reach this branch'; })
      .catch(er => { expect(er).to.equal('foo'); })
      .then(done, done);
  });

  it('can promisify callbacks', done => {
    const wait = (ms, cb) => setTimeout(cb, ms);
    Promise.promisify(wait)(10).then(() => done()).catch(done);
  });

  it('can promisify failed callbacks', done => {
    const fail = cb => cb(new Error());
    Promise.promisify(fail)()
      .catch(er => { expect(er).to.be.an.instanceOf(Error); })
      .then(done, done);
  });
});
