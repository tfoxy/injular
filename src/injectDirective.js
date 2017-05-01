import { assign, kebabCase } from './helpers';
import {
  DIRECTIVE_SUFFIX,
  instantiateDirective,
  removeReplaceableDirectiveProperties,
  transformComponentOptionsToDirectiveFactory,
} from './ngHelpers';
import { injularCompile } from './attachToModule';


function rerenderComponent(name, injularData) {
  const { $injector } = injularData;
  const $compile = $injector.get('$compile');
  const $rootElement = $injector.get('$rootElement');
  const rootElement = $rootElement[0];
  const document = rootElement.ownerDocument;
  const window = document.defaultView;
  const angular = injularData.angular || window.angular;
  const kebabName = kebabCase(name);
  const componentElements = document.querySelectorAll(`.ng-scope ${kebabName}`);
  for (let i = 0; i < componentElements.length; i += 1) {
    const componentElement = componentElements[i];
    const $componentElement = angular.element(componentElement);
    const hasScope = $componentElement.hasClass('ng-scope');
    const scope = $componentElement.scope();
    const isolateScope = $componentElement.isolateScope();
    const parentScope = (isolateScope || !hasScope) ? scope : scope.$parent;
    if (hasScope) {
      const componentScope = isolateScope || scope;
      componentScope.$destroy();
    }
    let componentTemplate = componentElement.$injularTemplate;
    if (!componentTemplate) {
      $componentElement.children().remove();
      $componentElement.text('');
      componentElement.className =
        componentElement.className.replace(/(?!:^|\W)ng-\w+\W*/g, '').trim();
      componentTemplate = componentElement.outerHTML;
    }
    const $newComponentElement = $compile(componentTemplate)(parentScope);
    $componentElement.replaceWith($newComponentElement);
    parentScope.$digest();
  }
}


export function injectDirective(name, directiveFactory, injularData) {
  const { $injector } = injularData;
  const directiveServiceName = `${name}${DIRECTIVE_SUFFIX}`;
  const directiveExists = $injector.has(directiveServiceName);
  if (directiveExists) {
    const directives = $injector.get(directiveServiceName);
    const directive = directives[0];
    const newDirective = instantiateDirective(name, directiveFactory, $injector);
    removeReplaceableDirectiveProperties(directive);
    assign(directive, { compile: injularCompile }, newDirective);
  } else {
    const { $compileProvider } = injularData;
    $compileProvider.directive(name, directiveFactory);
  }
  rerenderComponent(name, injularData);
}


export function injectComponent(name, options, injularData) {
  const factory = transformComponentOptionsToDirectiveFactory(options);
  return injectDirective(name, factory, injularData);
}


export function ejectComponent(name, injularData) {
  const { $injector } = injularData;
  const directiveServiceName = `${name}${DIRECTIVE_SUFFIX}`;
  const directives = $injector.get(directiveServiceName);
  directives.length = 0;
  rerenderComponent(name, injularData);
}
