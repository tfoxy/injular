import { expect } from 'chai';
import angular from 'angular';
import injular from '../src/injular';
import {
  MODULE_NAME,
  INJULAR_MODULE_NAME,
  createRootElement,
  removeRootElement,
} from './testHelpers';

describe('.attachToModule', () => {
  let rootElement;

  beforeEach(() => {
    rootElement = createRootElement();
  });

  afterEach(() => {
    removeRootElement(rootElement);
  });

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
