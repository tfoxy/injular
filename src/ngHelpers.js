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
