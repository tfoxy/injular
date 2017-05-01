import { expect } from 'chai';
import angular from 'angular';
import injular from '../src/injular';
import {
  MODULE_NAME,
  createRootElement,
  removeRootElement,
} from './testHelpers';


describe('.injectComponent', () => {
  let rootElement;

  beforeEach(() => {
    rootElement = createRootElement();
  });

  afterEach(() => {
    removeRootElement(rootElement);
  });

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
