import { expect } from 'chai';
import angular from 'angular';
import injular from '../src/injular';
import {
  MODULE_NAME,
  createRootElement,
  removeRootElement,
} from './testHelpers';

describe('.ejectComponent', () => {
  let rootElement;

  beforeEach(() => {
    rootElement = createRootElement();
  });

  afterEach(() => {
    removeRootElement(rootElement);
  });

  it('should remove component from service', () => {
    const injularData = {};

    angular.module(MODULE_NAME, [])
    .run(($injector) => {
      injularData.$injector = $injector;
    })
    .directive('testComponent', () => ({
      bindToController: {},
      controller: function TestComponent() { this.msg = 'foo'; },
      controllerAs: '$ctrl',
      restrict: 'E',
      scope: true,
      template: '{{$ctrl.msg}}',
    }));

    rootElement.innerHTML = '<test-component></test-component>';
    angular.bootstrap(rootElement, [MODULE_NAME]);

    expect(rootElement.textContent).to.equal('foo');

    injular.ejectComponent('testComponent', injularData);

    expect(rootElement.textContent).to.equal('');
  });
});
