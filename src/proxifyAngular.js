/* eslint-disable no-param-reassign, no-underscore-dangle */


function injularDirective(name, directiveFactory) {
  this._injular.injectDirective(name, directiveFactory, this._injularData);
  return this;
}


function injularComponent(name, options) {
  this._injular.injectComponent(name, options, this._injularData);
  return this;
}


function injularModule(name, requires, configFn) {
  const module = this._nonInjularModule(name, requires, configFn);
  this._injularModules.push(module);
  module._injular = this._injular;
  module._injularData = this._injularData;
  module._nonInjularDirective = module.directive;
  module.directive = injularDirective;
  module._nonInjularComponent = module.component;
  module.component = injularComponent;
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


export default function proxifyAngular(angular, injularData) {
  if ('_injular' in angular) return;
  angular._injular = this;
  angular._injularData = injularData;
  angular._injularModules = [];
  angular.$injularUnproxify = injularUnproxify;
  angular._nonInjularModule = angular.module;
  angular.module = injularModule;
}
