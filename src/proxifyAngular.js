/* eslint-disable no-param-reassign, no-underscore-dangle */


function injularDirective(name, directiveFactory) {
  const { $injector, loadingApp, currentFile, componentsByFile } = this._injularData;
  if (!loadingApp && this.name in $injector.modules) {
    this._injular.injectDirective(name, directiveFactory, this._injularData);
  } else {
    this._nonInjularDirective(name, directiveFactory);
  }
  if (currentFile) {
    let moduleDirectives = componentsByFile[currentFile];
    if (!moduleDirectives) {
      moduleDirectives = [];
      componentsByFile[currentFile] = moduleDirectives;
    }
    moduleDirectives.push(name);
  }
  return this;
}


function injularComponent(name, options) {
  const { $injector, loadingApp, currentFile, componentsByFile } = this._injularData;
  if (!loadingApp && this.name in $injector.modules) {
    this._injular.injectComponent(name, options, this._injularData);
  } else {
    this._nonInjularComponent(name, options);
  }
  if (currentFile) {
    let moduleDirectives = componentsByFile[currentFile];
    if (!moduleDirectives) {
      moduleDirectives = [];
      componentsByFile[currentFile] = moduleDirectives;
    }
    moduleDirectives.push(name);
  }
  return this;
}


function injularModule(name, requires, configFn) {
  const { $injector } = this._injularData;
  const modulesMap = $injector ? $injector.modules : null;
  let module = modulesMap ? modulesMap[name] : null;
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


function injularFlushChanges() {
  const injular = this._injular;
  const injularData = this._injularData;
  const {
    loadingApp,
    loadedFiles,
    previousComponentsByFile,
    componentsByFile,
  } = injularData;
  if (!loadingApp && loadedFiles) {
    loadedFiles.forEach((currentFile) => {
      const previousComponents = previousComponentsByFile[currentFile];
      const fileComponents = componentsByFile[currentFile] || [];
      previousComponents.filter(d => fileComponents.indexOf(d)).forEach((d) => {
        injular.ejectComponent(d, injularData);
      });
    });
  }
  injularData.previousComponentsByFile =
    injularData.componentsByFile || Object.create(null);
  injularData.componentsByFile = Object.create(null);
}


function injularUnproxify() {
  this.$injularFlushChanges();
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
  injularData.componentsByFile = Object.create(null);
  angular._injular = this;
  angular._injularData = injularData;
  angular._injularModules = [];
  angular.$injularUnproxify = injularUnproxify;
  angular.$injularFlushChanges = injularFlushChanges;
  angular._nonInjularModule = angular.module;
  angular.module = injularModule;
}
