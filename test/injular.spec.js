import { expect } from 'chai';
import angular from 'angular';
import injular from '../src/injular';

describe('injular', () => {
  it('should be a function', () => {
    expect(injular).to.be.a('function');
  });
});

describe('angular', () => {
  it('should be an object', () => {
    expect(angular).to.be.an('object');
  });
});
