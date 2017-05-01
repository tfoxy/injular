export const DIRECTIVE_SUFFIX = 'Directive';


const CNTRL_REG = /^(\S+)(\s+as\s+([\w$]+))?$/;
export function identifierForController(controller) {
  if (typeof controller === 'string') {
    const match = CNTRL_REG.exec(controller);
    if (match) return match[3];
  }
  return undefined;
}


export function instantiateDirective(name, directiveFactory, $injector) {
  // Code from $compileProvider.directive
  let directive = $injector.invoke(directiveFactory);
  if (typeof directive === 'function') {
    directive = { compile: () => directive };
  } else if (!directive.compile && directive.link) {
    directive.compile = () => directive.link;
  }
  directive.priority = directive.priority || 0;
  directive.name = directive.name || name;
  directive.require = directive.require || (directive.controller && directive.name);
  directive.restrict = directive.restrict || 'EA';
  directive.$$moduleName = directiveFactory.$$moduleName;
  return directive;
}


export function removeReplaceableDirectiveProperties(directive) {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in directive) {
    if (key !== 'index') {
      // eslint-disable-next-line no-param-reassign
      delete directive[key];
    }
  }
}


export function transformComponentOptionsToDirectiveFactory(options) {
  // Code from $compileProvider.component
  // eslint-disable-next-line func-names
  const controller = options.controller || function () {};

  function factory($injector) {
    function makeInjectable(fn) {
      if (typeof fn === 'function' || Array.isArray(fn)) {
        // eslint-disable-next-line func-names
        return function (tElement, tAttrs) {
          return $injector.invoke(fn, this, { $element: tElement, $attrs: tAttrs });
        };
      }
      return fn;
    }

    const template = (!options.template && !options.templateUrl ? '' : options.template);
    const ddo = {
      controller,
      controllerAs: identifierForController(options.controller) || options.controllerAs || '$ctrl',
      template: makeInjectable(template),
      templateUrl: makeInjectable(options.templateUrl),
      transclude: options.transclude,
      scope: {},
      bindToController: options.bindings || {},
      restrict: 'E',
      require: options.require,
    };

    // Copy annotations (starting with $) over to the DDO
    // eslint-disable-next-line no-restricted-syntax
    for (const key in options) {
      if (key.charAt(0) === '$') ddo[key] = options[key];
    }

    return ddo;
  }

  // TODO(pete) remove the following `forEach` before we release 1.6.0
  // The component-router@0.2.0 looks for the annotations on the controller constructor
  // Nothing in Angular looks for annotations on the factory function but we can't remove
  // it from 1.5.x yet.

  // Copy any annotation properties (starting with $
  // )over to the factory and controller constructor functions
  // These could be used by libraries such as the new component router
  // eslint-disable-next-line no-restricted-syntax
  for (const key in options) {
    if (key.charAt(0) === '$') {
      const val = options[key];
      factory[key] = val;
      // Don't try to copy over annotations to named controller
      if (typeof controller === 'function') controller[key] = val;
    }
  }

  factory.$inject = ['$injector'];

  return factory;
}
