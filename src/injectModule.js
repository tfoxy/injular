import {
  ejectComponent,
  injectComponent,
  injectDirective,
} from './injectDirective';

const injectMethods = {
  component: injectComponent,
  directive: injectDirective,
};

const ejectMethods = {
  component: ejectComponent,
  directive: ejectComponent,
};

export function injectModuleRequires(module, newRequires, injularData, angular) {
  const { $injector } = injularData;
  const modulesMap = $injector.modules;
  const previousRequires = module.requires;
  module.requires = newRequires;
  const modulesToLoad = newRequires.filter(require =>
    !(require in modulesMap),
  );
  const modulesToUnload = previousRequires.filter(
    require => !Object.keys(modulesMap).some(
      moduleName => modulesMap[moduleName].requires.indexOf(require) >= 0,
    ),
  );
  modulesToLoad.forEach((moduleName) => {
    const moduleInstance = angular.module(moduleName);
    modulesMap[moduleName] = moduleInstance;
    moduleInstance._invokeQueue.forEach(([, method, args]) => {
      const callArgs = Array.prototype.slice.call(args);
      callArgs.push(injularData);
      injectMethods[method].apply(null, callArgs);
    });
  });
  modulesToUnload.forEach((moduleName) => {
    const moduleInstance = angular.module(moduleName);
    modulesMap[moduleName] = moduleInstance;
    moduleInstance._invokeQueue.forEach(([, method, args]) => {
      const name = args[0];
      ejectMethods[method](name, injularData);
    });
  });
}
