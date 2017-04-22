import { expect } from 'chai';
import angular from 'angular';
import injular from '../src/injular';

const MODULE_NAME = 'testModule';

describe('injular', () => {
  describe('.injectComponent', () => {
    it('should inject component with new scope', () => {
      const injularData = {};

      angular.module(MODULE_NAME, [])
      .run(($injector) => {
        injularData.$injector = $injector;
      })
      .component('testComponent', {
        controller: function TestComponent() { this.msg = 'foo'; },
        template: '{{$ctrl.msg}}',
      });

      const element = document.createElement('div');
      element.innerHTML = '<test-component></test-component>';
      angular.bootstrap(element, [MODULE_NAME]);

      expect(element.textContent).to.equal('foo');

      injular.injectComponent('testComponent', {
        controller: function TestComponent() { this.msg = 'bar'; },
        template: '{{$ctrl.msg}}',
      }, injularData);

      expect(element.textContent).to.equal('bar');
    });
  });

  describe('.injectDirective', () => {
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

      const element = document.createElement('div');
      element.innerHTML = '<test-component>{{$ctrl.msg}}</test-component>';
      angular.bootstrap(element, [MODULE_NAME]);

      expect(element.textContent).to.equal('foo');

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

      expect(element.textContent).to.equal('bar');
    });
  });
});
