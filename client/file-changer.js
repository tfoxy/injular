(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod);
    global.fileChanger = mod.exports;
  }
})(this, function (module) {
  'use strict';

  module.exports = {
    wrapTemplate: wrapTemplate,
    wrapDirectiveFile: wrapDirectiveFile,
    appendProvideGetter: appendProvideGetter,
    appendAngularModulePatch: appendAngularModulePatch,
    _appendAngularModulePatchFunction: _appendAngularModulePatchFunction
  };

  function wrapTemplate(body, url, options) {
    options = options || {};
    // IE8 does not add injular-start comment
    var ie8Content = '';
    if (options.supportIE8) {
      ie8Content = '<!--[if lt IE 9]><b style="display:none!important" start-injular="' + url + '"></b><![endif]-->';
    }
    return '<!--injular-start ' + url + '-->' + ie8Content + body + '<!--injular-end ' + url + '-->';
  }

  function wrapDirectiveFile(content, url) {
    var jsonUrl = JSON.stringify(url);
    return 'try{window.___injular___.addScriptUrlToDirectives(' + jsonUrl + ');' + content + '\n}finally{window.___injular___.currentDirectiveUrl = null};\n';
  }

  function appendProvideGetter(body, moduleName, options) {
    options = options || {};
    var ie8Content = '';
    if (options.supportIE8) {
      ie8Content = '\n  .directive(\'startInjular\', function() {\n    return {\n      restrict: \'A\',\n      compile: compile\n    };\n\n    function compile(element, attrs) {\n      var prev = element[0].previousSibling;\n      if (prev && prev.nodeType === 8 && prev.data.lastIndexOf(\'injular-start\', 0) === 0) {\n        element.remove();\n      } else {\n        element.replaceWith(\'<!--injular-start \' + attrs.startInjular + \'-->\');\n      }\n    }\n  })';
    }
    var moduleNameString = moduleName ? JSON.stringify(moduleName) : 'document.querySelector(\'[ng-app]\').getAttribute(\'ng-app\')';
    return body += '\n;(function() {\n  angular.module(' + moduleNameString + ')\n  .config([\n  \'$controllerProvider\', \'$compileProvider\', \'$filterProvider\',\n  function($controllerProvider, $compileProvider, $filterProvider) {\n    var auxInjular = window.___injular___;\n    if (!auxInjular) {\n      auxInjular = window.___injular___ = {};\n    }\n    auxInjular.$controllerProvider = $controllerProvider;\n    auxInjular.$compileProvider = $compileProvider;\n    auxInjular.$filterProvider = $filterProvider;\n  }])' + ie8Content + ';\n})();\n';
  }

  function appendAngularModulePatch(body) {
    return body += '\n;(' + _appendAngularModulePatchFunction + ')(angular, window);\n';
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
          angular.forEach(name, function (value, key) {
            name[key] = patchDirectiveFactory(key, value, scriptUrl);
          });
        }

        return directiveFn.call(this, name, directiveFactory);
      }

      function injularAngularFilter(name, filterFactory) {
        if (angular.isString(name)) {
          filterFactory = patchFilterFactory(name, filterFactory);
        } else {
          angular.forEach(name, function (value, key) {
            name[key] = patchFilterFactory(key, value);
          });
        }

        return filterFn.call(this, name, filterFactory);
      }

      function injularAngularComponent(name, options) {
        if (!componentRegistration) {
          var appName = '___injular___';
          angular.module(appName, []).config(['$compileProvider', function ($compileProvider) {
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
      annotations.push(function () {
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
      directive.require = directive.require || directive.controller && directive.name;
      directive.restrict = directive.restrict || 'EA';
      return directive;
    }

    function valueFn(value) {
      return function () {
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
});
