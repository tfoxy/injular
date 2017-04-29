/* eslint-disable no-param-reassign, no-underscore-dangle */


function injularDirective(name, directiveFactory) {
  if (this.name in this._injularData.$injector.modules) {
    this._injular.injectDirective(name, directiveFactory, this._injularData);
  } else {
    this._nonInjularDirective(name, directiveFactory);
  }
  return this;
}


function injularComponent(name, options) {
  if (this.name in this._injularData.$injector.modules) {
    this._injular.injectComponent(name, options, this._injularData);
  } else {
    this._nonInjularComponent(name, options);
  }
  return this;
}


function injularModule(name, requires, configFn) {
  const modulesMap = this._injularData.$injector.modules;
  let module = modulesMap[name];
  const moduleCreated = !module;
  if (moduleCreated) {
    module = this._nonInjularModule(name, requires, configFn);
  }
  if (module._injular) return module;
  this._injularModules.push(module);
  module._injular = this._injular;
  module._injularData = this._injularData;
  module._nonInjularDirective = module.directive;
  module.directive = injularDirective;
  module._nonInjularComponent = module.component;
  module.component = injularComponent;
  if (!moduleCreated && requires) {
    const modulesToLoad = requires.filter(require =>
      !(require in modulesMap),
    );
    modulesToLoad.forEach((moduleName) => {
      const moduleInstance = this.module(moduleName);
      modulesMap[moduleName] = moduleInstance;
      moduleInstance._invokeQueue.forEach(([, method, args]) => {
        moduleInstance[method].apply(moduleInstance, args);
      });
    });
  }
  return module;
}


function injularUnproxify() {
  delete this._injular;
  delete this._injularData;
  this._injularModules.forEach((module) => {
    delete module._injular;
    delete module._injularData;
    module.directive = module._nonInjularDirective;
    delete module._nonInjularDirective;
    module.component = module._nonInjularComponent;
    delete module._nonInjularComponent;
  });
  delete this._injularModules;
  delete this.$injularUnproxify;
  this.module = this._nonInjularModule;
  delete this._nonInjularModule;
}


export function proxifyAngular(angular, injularData) {
  if ('_injular' in angular) return;
  angular._injular = this;
  angular._injularData = injularData;
  angular._injularModules = [];
  angular.$injularUnproxify = injularUnproxify;
  angular._nonInjularModule = angular.module;
  angular.module = injularModule;
}
