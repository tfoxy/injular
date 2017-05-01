import { instantiateDirective } from './ngHelpers';


export function injularCompile($compileNode, templateAttrs, childTranscludeFn) {
  const node = $compileNode[0];
  node.$injularTemplate = node.outerHTML;
  // eslint-disable-next-line no-underscore-dangle, max-len
  return this._nonInjularCompile && this._nonInjularCompile($compileNode, templateAttrs, childTranscludeFn);
}


function registerInjularDirective(name, directiveFactory) {
  // eslint-disable-next-line no-underscore-dangle
  return this._nonInjularDirective(name, ['$injector', ($injector) => {
    const directive = instantiateDirective(name, directiveFactory, $injector);
    if (!directive.template && directive.restrict === 'E') {
      // eslint-disable-next-line no-underscore-dangle,
      directive._nonInjularCompile = directive.compile;
      directive.compile = injularCompile;
    }
    return directive;
  }]);
}


export function attachToModule(module, injularData) {
  /* eslint-disable no-param-reassign, no-underscore-dangle */
  if (module.$injularAttached) return;
  module.$injularAttached = true;
  injularData.loadingApp = true;
  module.config(['$compileProvider', ($compileProvider) => {
    if ('_nonInjularDirective' in $compileProvider) return;
    $compileProvider._nonInjularDirective = $compileProvider.directive;
    $compileProvider.directive = registerInjularDirective;
    injularData.$compileProvider = $compileProvider;
  }]).run(['$injector', ($injector) => {
    injularData.$injector = $injector;
    injularData.loadingApp = false;
  }]);
  /* eslint-enable no-param-reassign, no-underscore-dangle */
}
