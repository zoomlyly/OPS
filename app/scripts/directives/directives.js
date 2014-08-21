'use strict';

/**
 * @ngdoc function
 * @name myApp.directive:mainDir
 * @description
 * # mainDir
 * Directive of the myApp
 */
angular.module('myApp.directives', [])
    .directive('checkboxDirective', function() {
        var mydirective = {
            template: "<div class='form-group' ng-repeat='feature in features'><label class='control-label col-md-3'>{{feature.Name}}：</label><div class='checkbox-list col-md-9'><label class='checkbox-inline' ng-repeat='featurename in feature.Features'><input type='checkbox' value='{{featurename.Name}}' ng-checked='selection.indexOf(featurename.Name)>-1' ng-click='toggleSelection(featurename)' >{{featurename.Name}}</label></div></div>",
            replace: false,
            restrict: 'ACEM',
            link: function(scope, el, attr) {
                Metronic.init();
                
            },
        };
        return mydirective;
    });
