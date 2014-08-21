'use strict';

/**
 * @ngdoc overview
 * @name myApp
 * @description
 * # myApp
 *
 * Main module of the application.
 */
var apiUrl = "http://58.154.51.188/";
var username="";
angular.module('myApp', ['ui.router', 'myApp.controllers','myApp.directives', 'ngCookies', 'kendo.directives'])
	.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
		//判断是否已登陆账户
		var checkLoggedin = function($q, $timeout, $http, $location, $rootScope, $cookieStore) {
			// delete $rootScope.my;
			var deferred = $q.defer();
			var token = '';
			if ($cookieStore.get('tokenState')) {
				token = $cookieStore.get('tokenState');
			}
			$http({
				method: 'GET',
				url: apiUrl + 'api/UppTenant/Base/My',
				headers: {
					"Authorization": "Bearer " + token
				}
			}).
			success(function(data, status, headers, config) {
				$rootScope.my = data;
				$timeout(deferred.resolve, 0);
			}).
			error(function(data, status, headers, config) {
				$timeout(function() {
					deferred.reject();
				}, 0);
				$cookieStore.remove('tokenState');
				$location.url('/login');
			});

			return deferred.promise;
		};

		$httpProvider.responseInterceptors.push(function($q, $location) {
			return function(promise) {
				return promise.then(
					// Success: just return the response
					function(response) {
						return response;
					},
					// Error: check the error status to get only the 401
					function(response) {
						if (response.status === 401)
							$location.url('/login');
						return $q.reject(response);
					}
				);
			};
		});
		//新增路由
		$stateProvider
		/*登录路由*/
		.state('login', {
			url: '/login',
			templateUrl: './views/login/login.html',
			controller: 'LoginCtrl',
		})
		/*登出路由*/
		.state('logout', {
			url: '/logout',
			controller: 'LogOutCtrl',
		})
		/*首页路由*/
		.state('dashboard', {
			url: '/dashboard',
			templateUrl: './views/dashboard/dashboard.html',
			controller: 'DashboardCtrl',
			resolve: {
				loggedin: checkLoggedin //验证登陆状态
			}
		})
		/*租户管理路由*/
		.state('tenant', {
			url: '/tenant',
			templateUrl: './views/tenant/tenant.html',
			controller: 'TenantCtrl',
			resolve: {
				loggedin: checkLoggedin //验证登陆状态
			}
		})
		/*租户Admin管理路由*/
		.state('tenantadmin', {
			url: '/tenantadmin',
			templateUrl: './views/tenantadmin/tenantAdmin.html',
			controller: 'TenantAdminCtrl',
			resolve: {
				loggedin: checkLoggedin //验证登陆状态
			}
		})
		/*广告路由*/
		.state('adMag', {
			url: '/adMag',
			templateUrl: './views/tenantadmin/adMag.html',
			controller: 'AdMagCtrl',
			resolve: {
				loggedin: checkLoggedin //验证登陆状态
			}
		})
		/*成员管理路由*/
		.state('people', {
			url: '/people',
			templateUrl: './views/people/people.html',
			controller: 'PeopleCtrl',
			resolve: {
				loggedin: checkLoggedin //验证登陆状态
			}
		})
		/*角色路由*/
		.state('roleMag', {
			url: '/roleMag',
			templateUrl: './views/people/roleMag.html',
			controller: 'RoleMagCtrl',
			resolve: {
				loggedin: checkLoggedin //验证登陆状态
			}
		})
		// 默认路由
		$urlRouterProvider.otherwise("/dashboard");
	})
	.run(['$rootScope', '$http', '$state', '$stateParams', '$location',
		function($rootScope, $http, $state, $stateParams, $location) { //依赖注入
			$rootScope.$state = $state;
			$rootScope.$stateParams = $stateParams;
			/*导航栏切换*/
			$rootScope.chooseTab = function(e) {
				for (var i = $rootScope.titles.length - 1; i >= 0; i--) {
					$rootScope.titles[i].isActive = false;
				};
				e.title.isActive = true;
			}
			/*首页导航栏设置*/
			$rootScope.titles = [{
				name: '首页',
				url: 'dashboard',
			}, {
				name: '租户OPS',
				url: 'tenant'
			}, {
				name: '成员',
				url: 'people'
			}, 
			{
				name: '租户Admin',
				url: 'tenantadmin'
			}, 
			];
			/*导航栏选中状态*/
			$rootScope.$on('$stateChangeSuccess', function() {			
				var currentId = -1;
				for (var i = 0; i < $rootScope.titles.length; i++) {
					if ($rootScope.titles[i].isActive == true) currentId = i;
					$rootScope.titles[i].isActive = false;
					if ("/" + $rootScope.titles[i].url == $location.$$url) {
						$rootScope.titles[i].isActive = true;
						currentId = -1;
					}
				};
				if (currentId != -1) $rootScope.titles[currentId].isActive = true;
				/*其他路由样式设置*/
				if (!$rootScope.my) {
					$rootScope.lnclass = "ln";
				} else {
					$rootScope.lnclass = "";
				}
			});
			/*登录路由样式设置*/
			if (!$rootScope.my) {
				$rootScope.lnclass = "ln";
			} else {
				$rootScope.lnclass = "";
			}
		}
	])