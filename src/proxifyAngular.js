/* eslint-disable no-param-reassign, no-underscore-dangle */
import { assign } from './helpers';


function injularDirective(name, directiveFactory) {
  const { $injector, loadingApp, currentFile, newComponentsByFile } = this._injularData;
  if (!loadingApp && this.name in $injector.modules) {
    this._injular.injectDirective(name, directiveFactory, this._injularData);
  } else {
    this._nonInjularDirective(name, directiveFactory);
  }
  if (currentFile) {
    let moduleDirectives = newComponentsByFile[currentFile];
    if (!moduleDirectives) {
      moduleDirectives = [];
      newComponentsByFile[currentFile] = moduleDirectives;
    }
    moduleDirectives.push(name);
  }
  return this;
}


function injularComponent(name, options) {
  const { $injector, loadingApp, currentFile, newComponentsByFile } = this._injularData;
  if (!loadingApp && this.name in $injector.modules) {
    this._injular.injectComponent(name, options, this._injularData);
  } else {
    this._nonInjularComponent(name, options);
  }
  if (currentFile) {
    let moduleDirectives = newComponentsByFile[currentFile];
    if (!moduleDirectives) {
      moduleDirectives = [];
      newComponentsByFile[currentFile] = moduleDirectives;
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
  } else if (requires) {
    const modulesToLoad = requires.filter(require =>
      !(require in modulesMap),
    );
    const modulesToUnload = module.requires.filter(
      require => requires.indexOf(require) < 0,
    );
    modulesToLoad.forEach((moduleName) => {
      const moduleInstance = this.module(moduleName);
      modulesMap[moduleName] = moduleInstance;
      moduleInstance._invokeQueue.forEach(([, method, args]) => {
        moduleInstance[method].apply(moduleInstance, args);
      });
    });
    modulesToUnload.forEach((moduleName) => {
      const moduleInstance = this.module(moduleName);
      modulesMap[moduleName] = moduleInstance;
      moduleInstance._invokeQueue.forEach(([, method, args]) => {
        if (method === 'directive' || method === 'component') {
          const componentName = args[0];
          this._injular.ejectComponent(componentName, this._injularData);
        }
      });
    });
  }
  if (module._injular) return module;
  this._injularModules.push(module);
  module._injular = this._injular;
  module._injularData = this._injularData;
  module._nonInjularDirective = module.directive;
  module.directive = injularDirective;
  module._nonInjularComponent = module.component;
  module.component = injularComponent;
  return module;
}


function injularFlushChanges() {
  const injular = this._injular;
  const injularData = this._injularData;
  const {
    loadingApp,
    loadedFiles,
    newComponentsByFile,
  } = injularData;
  let componentsByFile = injularData.componentsByFile;
  if (!componentsByFile) {
    componentsByFile = Object.create(null);
    injularData.componentsByFile = componentsByFile;
  }
  if (!loadingApp && loadedFiles) {
    loadedFiles.forEach((currentFile) => {
      const previousComponents = componentsByFile[currentFile];
      if (!previousComponents) return;
      const fileComponents = newComponentsByFile[currentFile] || [];
      previousComponents.filter(d => fileComponents.indexOf(d)).forEach((d) => {
        injular.ejectComponent(d, injularData);
      });
    });
  }
  assign(injularData.componentsByFile, injularData.newComponentsByFile);
  injularData.newComponentsByFile = Object.create(null);
  injularData.loadedFiles = [];
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
  injularData.newComponentsByFile = Object.create(null);
  angular._injular = this;
  angular._injularData = injularData;
  angular._injularModules = [];
  angular.$injularUnproxify = injularUnproxify;
  angular.$injularFlushChanges = injularFlushChanges;
  angular._nonInjularModule = angular.module;
  angular.module = injularModule;
}
