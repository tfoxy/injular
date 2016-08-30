'use strict';

module.exports = {
  wrapTemplate,
  wrapDirectiveFile,
  appendProvideGetter,
  appendAngularModulePatch,
  _appendAngularModulePatchFunction
};


function wrapTemplate(body, url, options) {
  options = options || {};
  // IE8 does not add injular-start comment
  let ie8Content = '';
  if (options.supportIE8) {
    ie8Content = 
      `<!--[if lt IE 9]><b style="display:none!important" start-injular="${url}"></b><![endif]-->`;
  }
  return `\
<!--injular-start ${url}-->${ie8Content}\
${body}\
<!--injular-end ${url}-->\
`;
}


function wrapDirectiveFile(content, url) {
  var jsonUrl = JSON.stringify(url);
  return `\
try{window.___injular___.addScriptUrlToDirectives(${jsonUrl});\
${content}
}finally{window.___injular___.currentDirectiveUrl = null};
`;
}


function appendProvideGetter(body, moduleName, options) {
  options = options || {};
  let ie8Content = '';
  if (options.supportIE8) {
    ie8Content = `
  .directive('startInjular', function() {
    return {
      restrict: 'A',
      compile: compile
    };

    function compile(element, attrs) {
      var prev = element[0].previousSibling;
      if (prev && prev.nodeType === 8 && prev.data.lastIndexOf('injular-start', 0) === 0) {
        element.remove();
      } else {
        element.replaceWith('<!--injular-start ' + attrs.startInjular + '-->');
      }
    }
  })`;
  }
  let moduleNameString = moduleName ? JSON.stringify(moduleName) :
    `document.querySelector('[ng-app]').getAttribute('ng-app')`;
  return body += `
;(function() {
  angular.module(${moduleNameString})
  .config([
  '$controllerProvider', '$compileProvider', '$filterProvider',
  function($controllerProvider, $compileProvider, $filterProvider) {
    var auxInjular = window.___injular___;
    if (!auxInjular) {
      auxInjular = window.___injular___ = {};
    }
    auxInjular.$controllerProvider = $controllerProvider;
    auxInjular.$compileProvider = $compileProvider;
    auxInjular.$filterProvider = $filterProvider;
  }])${ie8Content};
})();
`;
}


function appendAngularModulePatch(body) {
  return body += `
;(${_appendAngularModulePatchFunction})(angular, window);
`;
}


function _appendAngularModulePatchFunction(angular, window) {
  var componentRegistration;
  var auxInjular = window.___injular___;
  if (!auxInjular) {
    auxInjular = window.___injular___ = {};
  }
  auxInjular.directivesByUrl = {};
  auxInjular.filtersCache = {};
  auxInjular.addScriptUrlToDirectives = addScriptUrlToDirectives;

  var moduleFn = angular.module;
  angular.module = injularModule;
  if (!('$$annotate' in angular.injector)) {
    angular.injector.$$annotate = angular.injector().annotate;
  }

  function injularModule() {
    var directiveFn, filterFn;
    var module = moduleFn.apply(this, arguments);
    if (!module.___injular___) {
      module.___injular___ = true;
      directiveFn = module.directive;
      filterFn = module.filter;
      module.directive = injularAngularDirective;
      module.filter = injularAngularFilter;
      if ('component' in module) {
        module.component = injularAngularComponent;
      }
    }
    return module;

    function injularAngularDirective(name, directiveFactory) {
      var scriptUrl = auxInjular.currentDirectiveUrl;
      if (!scriptUrl) {
        // Do nothing special with this directive
      } else if (angular.isString(name)) {
        directiveFactory = patchDirectiveFactory(name, directiveFactory, scriptUrl);
      } else {
        angular.forEach(name, function(value, key) {
          name[key] = patchDirectiveFactory(key, value, scriptUrl);
        });
      }

      return directiveFn.call(this, name, directiveFactory);
    }

    function injularAngularFilter(name, filterFactory) {
      if (angular.isString(name)) {
        filterFactory = patchFilterFactory(name, filterFactory);
      } else {
        angular.forEach(name, function(value, key) {
          name[key] = patchFilterFactory(key, value);
        });
      }

      return filterFn.call(this, name, filterFactory);
    }

    function injularAngularComponent(name, options) {
      if (!componentRegistration) {
        var appName = '___injular___';
        angular.module(appName, []).config(['$compileProvider', function($compileProvider) {
          componentRegistration = $compileProvider.component;
        }]);
        angular.bootstrap(window.document.createElement('div'), [appName]);
      }
      return componentRegistration.call(module, name, options);
    }
  }

  function patchDirectiveFactory(name, directiveFactory, scriptUrl) {
    if (!hasOwnProperty(auxInjular.directivesByUrl, scriptUrl)) {
      /* eslint-disable no-console */
      console.error('No directivesByUrl for ' + scriptUrl);
      /* eslint-enable no-console */
      return directiveFactory;
    }
    var directivesByName = auxInjular.directivesByUrl[scriptUrl];
    if (!hasOwnProperty(directivesByName, name)) {
      directiveList = directivesByName[name] = [];
    }
    var directiveList = directivesByName[name];
    var directiveFactoryFn;
    if (angular.isArray(directiveFactory)) {
      directiveFactoryFn = directiveFactory[directiveFactory.length - 1];
    } else {
      directiveFactoryFn = directiveFactory;
    }

    var annotations = angular.injector.$$annotate(directiveFactory);
    annotations.push(function() {
      var directive = directiveFactoryFn.apply(this, arguments);
      directive = instantiateDirective(directive, name);
      directiveList.push(directive);
      return directive;
    });
    return annotations;
  }

  function instantiateDirective(directive, name) {
    // Code from $compileProvider.directive
    if (angular.isFunction(directive)) {
      directive = { compile: valueFn(directive) };
    } else if (!directive.compile && directive.link) {
      directive.compile = valueFn(directive.link);
    }
    directive.priority = directive.priority || 0;
    directive.name = directive.name || name;
    directive.require = directive.require || (directive.controller && directive.name);
    directive.restrict = directive.restrict || 'EA';
    return directive;
  }

  function valueFn(value) {
    return function() {
      return value;
    };
  }

  function patchFilterFactory(name, filterFactory) {
    return function injularFilterFactory($injector) {
      var filter = $injector.invoke(filterFactory);
      auxInjular.filtersCache[name] = filter;
      return function injularFilter() {
        return auxInjular.filtersCache[name].apply(this, arguments);
      };
    };
  }

  function addScriptUrlToDirectives(url) {
    if (!hasOwnProperty(auxInjular.directivesByUrl, url)) {
      auxInjular.directivesByUrl[url] = {};
    }
    auxInjular.currentDirectiveUrl = url;
  }

  function hasOwnProperty(object, property) {
    return window.Object.prototype.hasOwnProperty.call(object, property);
  }

}
