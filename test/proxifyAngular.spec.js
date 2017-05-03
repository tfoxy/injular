import { expect } from 'chai';
import angular from 'angular';
import { assign } from '../src/helpers';
import injular from '../src/injular';
import {
  MODULE_NAME,
  AUX_MODULE_NAME,
  INJULAR_MODULE_NAME,
  createRootElement,
  removeRootElement,
} from './testHelpers';

describe('.proxifyAngular', () => {
  let rootElement;
  let angularCopy;

  beforeEach(() => {
    rootElement = createRootElement();
    angularCopy = assign({}, angular);
  });

  afterEach(() => {
    removeRootElement(rootElement);
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

  it('should not inject component that is not part of the application module', () => {
    const injularData = {};

    angular.module(INJULAR_MODULE_NAME, [])
    .run(($injector) => {
      injularData.$injector = $injector;
    });

    angular.module(MODULE_NAME, []);

    function registerModule(angularInstance, msg) {
      angularInstance.module(AUX_MODULE_NAME, [])
      .component('testComponent', {
        controller: function TestComponent() { this.msg = msg; },
        template: '{{$ctrl.msg}}',
      });
    }
    registerModule(angular, 'foo');

    rootElement.innerHTML = '<test-component></test-component>';
    angular.bootstrap(rootElement, [INJULAR_MODULE_NAME, MODULE_NAME]);

    expect(rootElement.textContent).to.equal('');

    injular.proxifyAngular(angularCopy, injularData);
    registerModule(angularCopy, 'bar');

    expect(rootElement.textContent).to.equal('');
  });

  it('should inject component inside new module requirement', () => {
    const injularData = {};

    angular.module(INJULAR_MODULE_NAME, [])
    .config(($compileProvider) => {
      injularData.$compileProvider = $compileProvider;
    })
    .run(($injector) => {
      injularData.$injector = $injector;
    });
    angular.module(MODULE_NAME, []);
    angular.module(AUX_MODULE_NAME, [])
    .component('testComponent', {
      controller: function TestComponent() { this.msg = 'foo'; },
      template: '{{$ctrl.msg}}',
    });

    rootElement.innerHTML = '<test-component></test-component>';
    angular.bootstrap(rootElement, [INJULAR_MODULE_NAME, MODULE_NAME]);

    expect(rootElement.textContent).to.equal('');

    injular.proxifyAngular(angularCopy, injularData);
    angularCopy.module(MODULE_NAME, [AUX_MODULE_NAME]);

    expect(rootElement.textContent).to.equal('foo');
  });

  it('should not inject old component inside new module requirement', () => {
    const injularData = {};

    angular.module(INJULAR_MODULE_NAME, [])
    .config(($compileProvider) => {
      injularData.$compileProvider = $compileProvider;
    })
    .run(($injector) => {
      injularData.$injector = $injector;
    });
    angular.module(MODULE_NAME, []);
    angular.module(AUX_MODULE_NAME, [])
    .component('testComponent', {
      controller: function TestComponent() { this.msg = 'foo'; },
      template: '{{$ctrl.msg}}',
    });

    rootElement.innerHTML = '<test-component></test-component>';
    angular.bootstrap(rootElement, [INJULAR_MODULE_NAME, MODULE_NAME]);

    expect(rootElement.textContent).to.equal('');

    injular.proxifyAngular(angularCopy, injularData);
    angularCopy.module(AUX_MODULE_NAME, []);
    angularCopy.module(MODULE_NAME, [AUX_MODULE_NAME]);

    expect(rootElement.textContent).to.equal('');
  });

  it('should inject new component inside new module requirement', () => {
    const injularData = {};

    angular.module(INJULAR_MODULE_NAME, [])
    .config(($compileProvider) => {
      injularData.$compileProvider = $compileProvider;
    })
    .run(($injector) => {
      injularData.$injector = $injector;
    });
    angular.module(MODULE_NAME, []);
    angular.module(AUX_MODULE_NAME, [])
    .component('testComponent', {
      controller: function TestComponent() { this.msg = 'foo'; },
      template: '{{$ctrl.msg}}',
    });

    rootElement.innerHTML = '<test-component></test-component>';
    angular.bootstrap(rootElement, [INJULAR_MODULE_NAME, MODULE_NAME]);

    expect(rootElement.textContent).to.equal('');

    injular.proxifyAngular(angularCopy, injularData);
    angularCopy.module(AUX_MODULE_NAME, [])
    .component('testComponent', {
      controller: function TestComponent() { this.msg = 'bar'; },
      template: '{{$ctrl.msg}}',
    });
    angularCopy.module(MODULE_NAME, [AUX_MODULE_NAME]);

    expect(rootElement.textContent).to.equal('bar');
  });

  it('should remove previous component when calling $injularUnproxify', () => {
    const injularData = {
      loadingApp: true,
      currentFile: 1,
      loadedFiles: [1],
    };

    injular.proxifyAngular(angularCopy, injularData);
    angularCopy.module(INJULAR_MODULE_NAME, [])
    .run(($injector) => {
      injularData.$injector = $injector;
      injularData.loadingApp = false;
    });
    angularCopy.module(MODULE_NAME, [])
    .component('testComponent', {
      controller: function TestComponent() { this.msg = 'foo'; },
      template: '{{$ctrl.msg}}',
    });
    angularCopy.$injularFlushChanges();

    rootElement.innerHTML = '<test-component></test-component>';
    angular.bootstrap(rootElement, [INJULAR_MODULE_NAME, MODULE_NAME]);

    expect(rootElement.textContent).to.equal('foo');

    injularData.loadedFiles = [1];
    angularCopy.module(MODULE_NAME, []);
    angularCopy.$injularUnproxify();

    expect(rootElement.textContent).to.equal('');
  });

  it('should remove unregistered module component when calling $injularUnproxify', () => {
    const injularData = {
      loadingApp: true,
      loadedFiles: [INJULAR_MODULE_NAME, AUX_MODULE_NAME, MODULE_NAME],
    };

    injular.proxifyAngular(angularCopy, injularData);
    injularData.currentFile = INJULAR_MODULE_NAME;
    angularCopy.module(INJULAR_MODULE_NAME, [])
    .run(($injector) => {
      injularData.$injector = $injector;
      injularData.loadingApp = false;
    });
    injularData.currentFile = AUX_MODULE_NAME;
    angularCopy.module(AUX_MODULE_NAME, [])
    .component('testComponent', {
      controller: function TestComponent() { this.msg = 'foo'; },
      template: '{{$ctrl.msg}}',
    });
    injularData.currentFile = MODULE_NAME;
    angularCopy.module(MODULE_NAME, [AUX_MODULE_NAME]);
    angularCopy.$injularFlushChanges();

    rootElement.innerHTML = '<test-component></test-component>';
    angular.bootstrap(rootElement, [INJULAR_MODULE_NAME, MODULE_NAME]);

    expect(rootElement.textContent).to.equal('foo');

    injularData.loadedFiles = [MODULE_NAME];
    angularCopy.module(MODULE_NAME, []);
    angularCopy.$injularUnproxify();

    expect(rootElement.textContent).to.equal('');
  });
});
