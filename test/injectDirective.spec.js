import { expect } from 'chai';
import angular from 'angular';
import injular from '../src/injular';
import {
  MODULE_NAME,
  createRootElement,
  removeRootElement,
} from './testHelpers';

describe('.injectDirective', () => {
  let rootElement;

  beforeEach(() => {
    rootElement = createRootElement();
  });

  afterEach(() => {
    removeRootElement(rootElement);
  });

  it('should inject component-like directive with no template and isolated scope', () => {
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
      compile: ($el) => {
        const el = $el[0];
        el.$injularTemplate = el.outerHTML;
      },
    }));

    rootElement.innerHTML = '<test-component>{{$ctrl.msg}}</test-component>';
    angular.bootstrap(rootElement, [MODULE_NAME]);

    expect(rootElement.textContent).to.equal('foo');

    injular.injectDirective('testComponent', () => ({
      bindToController: {},
      controller: function TestComponent() { this.msg = 'bar'; },
      controllerAs: '$ctrl',
      restrict: 'E',
      scope: true,
      compile: ($el) => {
        const el = $el[0];
        el.$injularTemplate = el.outerHTML;
      },
    }), injularData);

    expect(rootElement.textContent).to.equal('bar');
  });

  it('should inject component-like directive with no template and isolated scope with an $injularTemplate property', () => {
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
      compile: ($el) => {
        const el = $el[0];
        el.$injularTemplate = el.outerHTML;
      },
    }));

    const template = '<test-component>{{$ctrl.msg}}</test-component>';
    rootElement.innerHTML = template;
    angular.bootstrap(rootElement, [MODULE_NAME]);

    expect(rootElement.textContent).to.equal('foo');

    injular.injectDirective('testComponent', () => ({
      bindToController: {},
      controller: function TestComponent() { this.msg = 'bar'; },
      controllerAs: '$ctrl',
      restrict: 'E',
      scope: true,
    }), injularData);

    expect(rootElement.firstChild).to.have.property('$injularTemplate', template);
  });
});
