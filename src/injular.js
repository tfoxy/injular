const DIRECTIVE_SUFFIX = 'Directive';

function assign(target) {
  if (target == null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  const to = Object(target);

  for (let index = 1; index < arguments.length; index += 1) {
    // eslint-disable-next-line prefer-rest-params
    const nextSource = arguments[index];
    if (nextSource != null) {
      // eslint-disable-next-line no-restricted-syntax
      for (const nextKey in nextSource) {
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }
  return to;
}

const SNAKE_CASE_REGEXP = /[A-Z]/g;
function kebabCase(name) {
  return name.replace(SNAKE_CASE_REGEXP, (letter, pos) =>
    (pos ? '-' : '') + letter.toLowerCase(),
  );
}


const CNTRL_REG = /^(\S+)(\s+as\s+([\w$]+))?$/;
function identifierForController(controller) {
  if (typeof controller === 'string') {
    const match = CNTRL_REG.exec(controller);
    if (match) return match[3];
  }
  return undefined;
}


function instantiateDirective(name, directiveFactory, $injector) {
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


function removeReplaceableDirectiveProperties(directive) {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in directive) {
    if (key !== 'index') {
      // eslint-disable-next-line no-param-reassign
      delete directive[key];
    }
  }
}


function injectDirective(name, directiveFactory, injularData) {
  const { $injector } = injularData;
  const directives = $injector.get(`${name}${DIRECTIVE_SUFFIX}`);
  const directive = directives[0];
  const newDirective = instantiateDirective(name, directiveFactory, $injector);
  removeReplaceableDirectiveProperties(directive);
  assign(directive, newDirective);
  const $compile = $injector.get('$compile');
  const $rootElement = $injector.get('$rootElement');
  const kebabName = kebabCase(name);
  const $componentElements = $rootElement.find(kebabName);
  for (let i = 0; i < $componentElements.length; i += 1) {
    const $componentElement = $componentElements.eq(i);
    const scope = $componentElement.scope();
    const isolateScope = $componentElement.isolateScope();
    const componentScope = isolateScope || scope;
    const parentScope = isolateScope ? scope : scope.$parent;
    componentScope.$destroy();
    let componentTemplate;
    if (directive.template) {
      $componentElement.children().remove();
      componentTemplate = $componentElement[0].outerHTML;
    } else {
      componentTemplate = $componentElement[0].$injularTemplate;
    }
    const $newComponentElement = $compile(componentTemplate)(parentScope);
    $componentElement.replaceWith($newComponentElement);
    $newComponentElement.scope().$digest();
  }
}


function injectComponent(name, options, injularData) {
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

  return this.injectDirective(name, factory, injularData);
}


const injular = {
  injectComponent,
  injectDirective,
};

export default injular;
