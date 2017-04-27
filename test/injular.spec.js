import { expect } from 'chai';
import angular from 'angular';
import { assign } from '../src/helpers';
import injular from '../src/injular';

const MODULE_NAME = 'testModule';
const INJULAR_MODULE_NAME = 'injularModule';

describe('injular', () => {
  let rootElement;

  beforeEach(() => {
    rootElement = document.createElement('div');
    rootElement.style.display = 'none';
    document.body.appendChild(rootElement);
  });

  afterEach(() => {
    document.body.removeChild(rootElement);
  });

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

      rootElement.innerHTML = '<test-component></test-component>';
      angular.bootstrap(rootElement, [MODULE_NAME]);

      expect(rootElement.textContent).to.equal('foo');

      injular.injectComponent('testComponent', {
        controller: function TestComponent() { this.msg = 'bar'; },
        template: '{{$ctrl.msg}}',
      }, injularData);

      expect(rootElement.textContent).to.equal('bar');
    });

    it('should inject component that was created outside root element', () => {
      const injularData = {};

      angular.module(MODULE_NAME, [])
      .run(($injector, $compile, $rootScope) => {
        const newScope = $rootScope.$new();
        injularData.$injector = $injector;
        $compile(rootElement.lastChild)(newScope);
      })
      .component('testComponent', {
        controller: function TestComponent() { this.msg = 'foo'; },
        template: '{{$ctrl.msg}}',
      });

      rootElement.innerHTML = '<div></div><div><test-component></test-component></div>';
      angular.bootstrap(rootElement.firstChild, [MODULE_NAME]);

      expect(rootElement.textContent).to.equal('foo');

      injular.injectComponent('testComponent', {
        controller: function TestComponent() { this.msg = 'bar'; },
        template: '{{$ctrl.msg}}',
      }, injularData);

      expect(rootElement.textContent).to.equal('bar');
    });

    it('should inject component with binding that does not exists in the dom', () => {
      const injularData = {};
      let $scope;

      angular.module(MODULE_NAME, [])
      .run(($injector, $rootScope) => {
        $scope = $rootScope;
        injularData.$injector = $injector;
      })
      .component('testComponent', {
        bindings: { in: '@' },
        controller: function TestComponent() { this.msg = 'foo'; },
        template: '{{$ctrl.in}}{{$ctrl.msg}}',
      });

      rootElement.innerHTML = '<div ng-if="show"><test-component in="foo"></test-component></div>';
      angular.bootstrap(rootElement, [MODULE_NAME]);

      expect(rootElement.textContent).to.equal('');

      injular.injectComponent('testComponent', {
        bindings: { in: '@' },
        controller: function TestComponent() { this.msg = 'bar'; },
        template: '{{$ctrl.in}}{{$ctrl.msg}}',
      }, injularData);

      $scope.show = true;
      $scope.$digest();

      expect(rootElement.textContent).to.equal('foobar');
    });

    it('should inject component that was not registered before', () => {
      const injularData = {};

      angular.module(MODULE_NAME, [])
      .config(($compileProvider) => {
        injularData.$compileProvider = $compileProvider;
      })
      .run(($injector) => {
        injularData.$injector = $injector;
      });

      rootElement.innerHTML = '<test-component></test-component>';
      angular.bootstrap(rootElement, [MODULE_NAME]);

      expect(rootElement.textContent).to.equal('');

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

  describe('.attachToModule', () => {
    it('should add $injector and $compileProvider to injularData after bootstrapping module', () => {
      const injularData = {};

      const module = angular.module(INJULAR_MODULE_NAME, []);
      injular.attachToModule(module, injularData);

      angular.bootstrap(rootElement, [INJULAR_MODULE_NAME]);

      expect(injularData).to.have.property('$injector').to.be.an('object');
      expect(injularData.$injector).to.have.property('get').to.be.a('function');
      expect(injularData).to.have.property('$compileProvider').to.be.an('object');
      expect(injularData.$compileProvider).to.have.property('directive').to.be.a('function');
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

      const template = '<test-component>{{$ctrl.msg}}</test-component>';
      rootElement.innerHTML = template;
      angular.bootstrap(rootElement, [INJULAR_MODULE_NAME, MODULE_NAME]);

      expect(rootElement.firstChild).to.have.property('$injularTemplate', template);
    });
  });

  describe('.proxifyAngular', () => {
    let angularCopy;
    beforeEach(() => {
      angularCopy = assign({}, angular);
    });

    it('should replace component recipe function in order to inject them', () => {
      const injularData = {};

      angular.module(INJULAR_MODULE_NAME, [])
      .run(($injector) => {
        injularData.$injector = $injector;
      });

      function registerModule(angularInstance, msg) {
        angularInstance.module(MODULE_NAME, [])
        .component('testComponent', {
          controller: function TestComponent() { this.msg = msg; },
          template: '{{$ctrl.msg}}',
        });
      }
      registerModule(angular, 'foo');

      rootElement.innerHTML = '<test-component></test-component>';
      angular.bootstrap(rootElement, [INJULAR_MODULE_NAME, MODULE_NAME]);

      expect(rootElement.textContent).to.equal('foo');

      injular.proxifyAngular(angularCopy, injularData);
      registerModule(angularCopy, 'bar');

      expect(rootElement.textContent).to.equal('bar');
    });

    it('should add $injularUnproxify method to remove injular proxy', () => {
      const injularData = {};
      const moduleFn = angular.module;

      angular.module(INJULAR_MODULE_NAME, [])
      .run(($injector) => {
        injularData.$injector = $injector;
      });

      function registerModule(angularInstance) {
        return angularInstance.module(MODULE_NAME, [])
        .component('testComponent', {
          controller: function TestComponent() { this.msg = 'foo'; },
          template: '{{$ctrl.msg}}',
        });
      }
      const module = registerModule(angular);
      const componentRecipe = module.component;

      angular.bootstrap(rootElement, [INJULAR_MODULE_NAME, MODULE_NAME]);

      injular.proxifyAngular(angularCopy, injularData);
      const newModule = registerModule(angularCopy);
      // eslint-disable-next-line no-underscore-dangle
      const newComponentRecipe = newModule._nonInjularComponent;
      angularCopy.$injularUnproxify();

      expect(angularCopy.module).to.equal(moduleFn);
      expect(module.component).to.equal(componentRecipe);
      expect(newModule.component).to.equal(newComponentRecipe);
    });
  });
});
