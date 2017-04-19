'use strict';

/* global injular */

describe('patchAngularInstance', function() {
  var auxAngular;

  beforeEach(function() {
    auxAngular = window.angular;
    window.angular = window.angular.copy(auxAngular);
  });

  afterEach(function() {
    window.angular = auxAngular;
    window.___injular___ = undefined;
  });

  it('should patch controller recipe', function() {
    var element = angular.element('<div ng-app="app"></div>');
    angular.bootstrap(element, ['app', provideController]);
    var $controller = element.injector().get('$controller');
    injular.setAppElement(element);
    injular.patchAngularInstance(angular);
    angular.module('app', []).controller('FooCtrl', function(){
      this.foo = 'bar';
    });
    var ctrl = $controller('FooCtrl');
    expect(ctrl.foo).to.equal('bar');

    function provideController($controllerProvider) {
      window.___injular___ = {$controllerProvider: $controllerProvider};
      $controllerProvider.register('FooCtrl', function(){
        this.foo = 'foo';
      });
    }
  });

});
