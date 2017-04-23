import { expect } from 'chai';
import angular from 'angular';
import injular from '../src/injular';

const MODULE_NAME = 'testModule';
const INJULAR_MODULE_NAME = 'injularModule';

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

      const rootElement = document.createElement('div');
      rootElement.innerHTML = '<test-component></test-component>';
      angular.bootstrap(rootElement, [MODULE_NAME]);

      expect(rootElement.textContent).to.equal('foo');

      injular.injectComponent('testComponent', {
        controller: function TestComponent() { this.msg = 'bar'; },
        template: '{{$ctrl.msg}}',
      }, injularData);

      expect(rootElement.textContent).to.equal('bar');
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

      const rootElement = document.createElement('div');
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
  });

  describe('.attachToModule', () => {
    it('should add $injector to injularData after bootstrapping module', () => {
      const injularData = {};

      const module = angular.module(INJULAR_MODULE_NAME, []);
      injular.attachToModule(module, injularData);

      const rootElement = document.createElement('div');
      angular.bootstrap(rootElement, [INJULAR_MODULE_NAME]);

      expect(injularData).to.have.property('$injector').to.be.an('object');
    });

    it('should patch directive registration so that $injularTemplate is set to the element when no template is provided', () => {
      const injularData = {};

      const injularModule = angular.module(INJULAR_MODULE_NAME, []);
      injular.attachToModule(injularModule, injularData);

      angular.module(MODULE_NAME, [])
      .directive('testComponent', () => ({
        bindToController: {},
        controller: function TestComponent() { this.msg = 'foo'; },
        controllerAs: '$ctrl',
        restrict: 'E',
        scope: true,
      }));

      const rootElement = document.createElement('div');
      const template = '<test-component>{{$ctrl.msg}}</test-component>';
      rootElement.innerHTML = template;
      angular.bootstrap(rootElement, [INJULAR_MODULE_NAME, MODULE_NAME]);

      expect(rootElement.firstChild).to.have.property('$injularTemplate', template);
    });
  });
});
