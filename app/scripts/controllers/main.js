'use strict';

/**
 * @ngdoc function
 * @name myApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the myApp
 */
angular.module('myApp.controllers', [])
/*登录Ctrl*/
.controller('LoginCtrl', function($scope, $rootScope, $http, $location, $cookieStore, $state) {
    if ($rootScope.my || $cookieStore.get('tokenState')) {
        $state.go("dashboard");
    }
    $rootScope.lnclass = "ln";
    $scope.user = {};
    if ($cookieStore.get('rmb') == true) {
        $scope.value = true;
        $scope.user.username = $cookieStore.get('username');
        $scope.user.password = $cookieStore.get('password');
    }
    $scope.login = function() {
        $http({
            method: 'POST',
            url: 'http://auth.uppcore.com/UppWin/oauth/token',
            headers: {
                "Authorization": "Basic VXBwV2luQXBwOjF5N09jSUN4d3F5YUNSVWE3dVVBeFc5c3AzdVRubU9JbW9IY3JocDdUOWM="
            },
            data: {
                scope: 'read',
                grant_type: 'password',
                username: $scope.user.username,
                password: $scope.user.password
            }
        })
            .success(function(data) {
                $cookieStore.put('tokenState', data.access_token);
                $rootScope.lnclass = "";
                if ($scope.value == true) {
                    $cookieStore.put('rmb', true);
                    $cookieStore.put('username', $scope.user.username);
                    $cookieStore.put('password', $scope.user.password);
                }
                $location.url('/dashboard');
            })
            .error(function() {
                $location.url('/login');
            });
    }

})
/*登出Ctrl*/
.controller('LogOutCtrl', function($scope, $rootScope, $http, $location, $cookieStore, $state) {
    delete $rootScope.my;
    $cookieStore.remove('tokenState');
    $state.go('login');
})
/*首页Ctrl*/
.controller('DashboardCtrl', function($scope, $rootScope) {
    /*侧边栏内容设置*/
    $rootScope.sideTitles = [{
        name: '首页',
        url: 'dashboard',
        icon: 'icon-home'
    }];
    $scope.welcome = '欢迎登陆管理平台';
})


/*租户管理Ctrl*/
.controller('TenantCtrl', function($scope, $rootScope, $http, $location, $cookieStore) {
    /*<PCModuleST 租户管理 租户管理 TenantManager>*/
    /*侧边栏内容设置*/
    $rootScope.sideTitles = [{
        name: '租户管理',
        url: 'tenant',
        icon: 'icon-user'
    }];
    $scope.pageheader = '租户管理';
    $scope.pageheaderTitle = '租户';
    $scope.pageheaderChildTitle = '租户管理';
    /*表格*/
    var token = '';
    if ($cookieStore.get('tokenState')) {
        token = $cookieStore.get('tokenState');
    }
    $scope.gridAPI = apiUrl + "api/UppTenant/Base/Tenant/";
    $scope.mainGridOptions = {
        dataSource: {
            transport: {
                read: {
                    /*<PCCode GetTenants>*/
                    url: $scope.gridAPI,
                    dataType: "json",
                    beforeSend: function(req) {
                        req.setRequestHeader("Authorization", "Bearer " + token);
                    }
                },
                update: {
                    /*<PCCode PutTenant>*/
                    url: function(data) {
                        return $scope.gridAPI + data.models[0].id;
                    },
                    dataType: "json",
                    type: "PUT",
                    contentType: "application/json",
                    beforeSend: function(req) {
                        req.setRequestHeader("Authorization", "Bearer " + token);
                    }
                },
                destroy: {
                    /*<PCCode DeleteTenant>*/
                    url: function(data) {
                        return $scope.gridAPI + data.models[0].id;
                    },
                    dataType: "json",
                    type: "DELETE",
                    beforeSend: function(req) {
                        req.setRequestHeader("Authorization", "Bearer " + token);
                    }
                },
                create: {
                    url: $scope.gridAPI,
                    dataType: "json",
                    type: "POST",
                    contentType: "application/json",
                    beforeSend: function(req) {
                        req.setRequestHeader("Authorization", "Bearer " + token);
                    }
                },
                parameterMap: function(options, operation) {
                    if (operation !== "read" && options.models) {
                        return {
                            models: kendo.stringify(options.models)
                        };
                    }
                }
            },
            batch: true,
            pageSize: 10,
            schema: {
                model: {
                    id: "id",
                    fields: {
                        id: {
                            editable: false,
                            nullable: true
                        },
                        name: {
                            type: "string",
                            defaultValue: "",
                            nullable: true
                        },
                    }
                }
            }
        },
        height: 400,
        sortable: true,
        detailTemplate: kendo.template($("#template").html()),
        pageable: {
            refresh: true,
            pageSizes: true,
            buttonCount: 5
        },
        selectable: "multiple, row",
        change: onChange,
        autobind: true,
        columns: [{
            field: "id",
            title: "租户ID",
            width: "200px"
        }, {
            field: "name",
            title: "租户名称",
            width: "200px"
        }, {
            command: ["edit", "destroy"],
            title: "&nbsp;",
            width: "100px"
        }, ],
        editable: "inline"
    };
    $scope.detailGridOptions = function(dataItem) {
        return {
            dataSource: {
                transport: {
                    /*<PCCode GetTUsers>*/
                    read: function(options) {
                        $http({
                            method: 'GET',
                            dataType: "json",
                            url: apiUrl + 'api/UppTenant/Base/ACL1/TRole/' + dataItem.id,
                            headers: {
                                "Authorization": "Bearer " + token
                            }
                        }).
                        success(function(result) {
                            for (var i = 0; i < result.length; i++) {
                                $scope.groupId = result[i].id;
                            }
                            /*<PCCode GetTRole>*/
                            $http({
                                method: 'GET',
                                dataType: "json",
                                url: apiUrl + "api/UppTenant/Base/ACL1/TRole/" + dataItem.id + "/" + $scope.groupId + "?user=true",
                                headers: {
                                    "Authorization": "Bearer " + token
                                }
                            }).
                            success(function(result) {
                                var resultData = [];
                                for (var i = 0; i < result.length; i++) {
                                    resultData.push({
                                        admin: result[i],
                                        id: dataItem.id
                                    });
                                }
                                options.success(resultData);
                            }).
                            error(function(result) {
                                options.error(result);
                            });
                        }).
                        error(function(result) {
                            options.error(result);
                        });
                    },
                    update: {
                        url: function(data) {
                            return $scope.gridAPI + data.models[0].id;
                        },
                        dataType: "json",
                        type: "PUT",
                        contentType: "application/json",
                        beforeSend: function(req) {
                            req.setRequestHeader("Authorization", "Bearer " + token);
                        }
                    },
                    destroy: function(options) {
                        /*<PCCode DeleteTenantAdmin>*/
                        $http({
                            method: 'DELETE',
                            url: $scope.gridAPI + dataItem.id + "?admin=" + options.data.admin,
                            headers: {
                                "Authorization": "Bearer " + token
                            }
                        }).
                        success(function(result) {
                            options.success(result);
                        }).
                        error(function(result) {
                            options.error(result);
                        });
                    },
                    create: function(options) {
                        /*<PCCode PostTenantAdmin>*/
                        $http({
                            method: 'POST',
                            dataType: "json",
                            url: $scope.gridAPI + dataItem.id + "?admin=" + options.data.admin,
                            headers: {
                                "Authorization": "Bearer " + token
                            }
                        }).
                        success(function(result) {
                            options.success(result);
                        }).
                        error(function(result) {
                            options.error(result);
                        });
                    },
                    parameterMap: function(options, operation) {
                        if (operation !== "read" && options.models) {
                            return {
                                models: kendo.stringify(options.models)
                            };
                        }
                    }
                },
                pageSize: 10,
                // filter: {
                //     field: "id",
                //     operator: "eq",
                //     value: dataItem.id
                // },
                schema: {
                    model: {
                        id: "id",
                        fields: {
                            id: {
                                editable: false,
                                nullable: true
                            },
                            admin: {
                                type: "string",
                                defaultValue: "",
                                nullable: true
                            },
                        }
                    }
                }
            },
            scrollable: true,
            sortable: true,
            selectable: "multiple, row",
            pageable: {
                refresh: true,
                pageSizes: true,
                buttonCount: 5
            },
            toolbar: ["create"],
            editable: "popup",
            edit: function(e) {
                e.container.data("kendoWindow").title('新增');
            },
            columns: [{
                field: "admin",
                title: "管理员账号",
                width: "200px"
            }, {
                command: ["destroy"],
                title: "&nbsp;",
                width: "50px"
            }],

        };
    };

    /*表格事件*/
    function onChange(e) {
        var item = e.sender.dataItem(e.sender.select());
        $scope.name = item.name;
        $scope.detail = item;
        $scope.$apply();
    }

    /*表单控制*/
    $scope.saved = {};
    $scope.reset = function() {
        $scope.tenant = angular.copy($scope.saved);
    }
    $scope.update = function(tenant) {
        /*<PCCode PostTenant>*/
        var jsonObject = {
            "id": "00000000000000000000000000000000",
            "isActive": "",
            "name": tenant.name,
            "extType": "",
            "extData": ""
        };
        $http({
            method: 'POST',
            url: apiUrl + 'api/UppTenant/Base/Tenant/',
            data: jsonObject,
            headers: {
                "Authorization": "Bearer " + token
            }
        }).
        success(function(data, status, headers, config) {
            $scope.success = data;
            $scope.grid.dataSource.add({
                id: data.id,
                name: data.name
            });
            $scope.grid.dataSource.sync();
        }).
        error(function(data, status, headers, config) {
            $scope.error = data;
        });
    };
    /*<PCModuleED 租户管理>*/
})
/*站点管理Ctrl*/
.controller('TenantAdminCtrl', function($scope, $rootScope, $state, $http, $location, $cookieStore) {
    /*<PCModuleST 站点管理 站点管理 TenantAdminManager>*/
    $rootScope.sideTitles = [{
        name: '站点管理',
        url: 'tenantadmin',
        icon: 'icon-user'
    }, {
        name: '广告管理',
        url: 'adMag',
        icon: 'icon-social-youtube'
    }, ];
    $scope.pageheader = '站点管理';
    $scope.pageheaderTitle = '租户Admin';
    $scope.pageheaderChildTitle = '站点管理';
    var token = '';
    if ($cookieStore.get('tokenState')) {
        token = $cookieStore.get('tokenState');
    }
    $scope.gridAPI = apiUrl + "api/UppTenant/Base/ACL1/Site/" + $rootScope.my.tenants[0].id + "/";
    $scope.mainGridOptions = {
        dataSource: {
            transport: {
                read: {
                    /*<PCCode GetSites>*/
                    url: $scope.gridAPI,
                    dataType: "json",
                    beforeSend: function(req) {
                        req.setRequestHeader("Authorization", "Bearer " + token);
                    }
                },
                update: {
                    /*<PCCode PutSite>*/
                    url: function(data) {
                        return $scope.gridAPI + data.models[0].id;
                    },
                    dataType: "json",
                    type: "PUT",
                    contentType: "application/json",
                    beforeSend: function(req) {
                        req.setRequestHeader("Authorization", "Bearer " + token);
                    }
                },
                destroy: {
                    /*<PCCode DeleteSite>*/
                    url: function(data) {
                        return $scope.gridAPI + data.models[0].id;
                    },
                    dataType: "json",
                    type: "DELETE",
                    beforeSend: function(req) {
                        req.setRequestHeader("Authorization", "Bearer " + token);
                    }
                },
                create: {
                    url: $scope.gridAPI,
                    dataType: "json",
                    type: "POST",
                    contentType: "application/json",
                    beforeSend: function(req) {
                        req.setRequestHeader("Authorization", "Bearer " + token);
                    }
                },
                parameterMap: function(options, operation) {
                    if (operation === "update" && options.models) {
                        var jsonObject = {
                            "id": options.models[0].id,
                            "tenantId": $rootScope.my.tenants[0].id,
                            "name": options.models[0].name,
                            "type": options.models[0].type,
                            "extType": "",
                            "extData": "",
                        };
                        return kendo.stringify(jsonObject);
                    }
                }
            },
            batch: true,
            pageSize: 10,
            schema: {
                model: {
                    id: "id",
                    fields: {
                        id: {
                            editable: false,
                            nullable: true
                        },
                        name: {
                            type: "string",
                            defaultValue: "",
                            nullable: true
                        },
                        type: {
                            type: "string",
                            defaultValue: "",
                            nullable: true
                        },
                    }
                }
            }
        },
        height: 400,
        sortable: true,
        detailTemplate: kendo.template($("#template").html()),
        pageable: {
            refresh: true,
            pageSizes: true,
            buttonCount: 5
        },
        selectable: "multiple, row",
        change: onChange,
        autobind: true,
        columns: [{
            field: "id",
            title: "商户编号",
            width: "200px"
        }, {
            field: "name",
            title: "商户名称",
            width: "200px"
        }, {
            field: "type",
            title: "商户类型",
            width: "200px"
        }, {
            command: ["edit", "destroy"],
            title: "&nbsp;",
            width: "100px"
        }, ],
        editable: "inline"
    };

    $scope.detailGridOptions = function(dataItem) {
        return {
            dataSource: {
                transport: {
                    /*<PCCode GetRoles>*/
                    read: function(options) {
                        $http({
                            method: 'GET',
                            dataType: "json",
                            url: apiUrl + 'api/UppTenant/Base/ACL/Role/' + $rootScope.my.tenants[0].id + "/00000000000000000000000000000000/" + dataItem.id,
                            headers: {
                                "Authorization": "Bearer " + token
                            }
                        }).
                        success(function(result) {
                            for (var i = 0; i < result.length; i++) {
                                $scope.groupId = result[i].id;
                            }
                            /*<PCCode GetRole>*/
                            $http({
                                method: 'GET',
                                dataType: "json",
                                url: apiUrl + 'api/UppTenant/Base/ACL/Role/' + $rootScope.my.tenants[0].id + "/00000000000000000000000000000000/" + dataItem.id + "/" + $scope.groupId + "?user=true",
                                headers: {
                                    "Authorization": "Bearer " + token
                                }
                            }).
                            success(function(result) {
                                var resultData = [];
                                for (var i = 0; i < result.length; i++) {
                                    resultData.push({
                                        admin: result[i],
                                        id: dataItem.id
                                    });
                                }
                                options.success(resultData);
                            }).
                            error(function(result) {
                                options.error(result);
                            });
                        }).
                        error(function(result) {
                            options.error(result);
                        });
                    },
                    update: function(options) {
                        $http({
                            method: 'PUT',
                            url: $scope.gridAPI,
                            headers: {
                                "Authorization": "Bearer " + token
                            }
                        }).
                        success(function(result) {
                            options.success(result);
                        }).
                        error(function(result) {
                            options.error(result);
                        });
                    },
                    destroy: function(options) {
                        /*<PCCode DeleteSiteAdmin>*/
                        $http({
                            method: 'DELETE',
                            url: $scope.gridAPI + dataItem.id + "?admin=" + options.data.admin,
                            headers: {
                                "Authorization": "Bearer " + token
                            }
                        }).
                        success(function(result) {
                            options.success(result);
                        }).
                        error(function(result) {
                            options.error(result);
                        });
                    },
                    create: function(options) {
                        /*<PCCode PostSiteAdmin>*/
                        $http({
                            method: 'POST',
                            dataType: "json",
                            url: $scope.gridAPI + dataItem.id + "?admin=" + options.data.admin,
                            headers: {
                                "Authorization": "Bearer " + token
                            }
                        }).
                        success(function(result) {
                            options.success(result);
                        }).
                        error(function(result) {
                            options.error(result);
                        });
                    },
                    parameterMap: function(options, operation) {
                        if (operation !== "read" && options.models) {
                            return {
                                models: kendo.stringify(options.models)
                            };
                        }
                    }
                },
                pageSize: 10,
                // filter: {
                //     field: "id",
                //     operator: "eq",
                //     value: dataItem.id
                // },
                schema: {
                    model: {
                        id: "id",
                        fields: {
                            id: {
                                editable: false,
                                nullable: true
                            },
                            admin: {
                                type: "string",
                                defaultValue: "",
                                nullable: true
                            },
                        }
                    }
                }
            },
            scrollable: true,
            sortable: true,
            selectable: "multiple, row",
            pageable: {
                refresh: true,
                pageSizes: true,
                buttonCount: 5
            },
            toolbar: ["create"],
            editable: "popup",
            edit: function(e) {
                e.container.data("kendoWindow").title('新增');
            },
            columns: [{
                field: "admin",
                title: "管理员账号",
                width: "200px"
            }, {
                command: ["destroy"],
                title: "&nbsp;",
                width: "50px"
            }],

        };
    };
    /*表格事件*/
    function onChange(e) {
        var item = e.sender.dataItem(e.sender.select());
        $scope.name = item.name;
        $scope.type = item.type;
        $scope.detail = item;
        $scope.$apply();
    }
    /*表单控制*/
    $scope.saved = {};
    $scope.reset = function() {
        $scope.tenant = angular.copy($scope.saved);
    }
    $scope.update = function(tenant) {
        /*<PCCode PostSite>*/
        var jsonObject = {
            "id": "00000000000000000000000000000000",
            "tenantId": $rootScope.my.tenants[0].id,
            "type": tenant.type,
            "name": tenant.name,
            "extType": "",
            "extData": ""
        };
        $http({
            method: 'POST',
            url: $scope.gridAPI,
            data: jsonObject,
            headers: {
                "Authorization": "Bearer " + token
            }
        }).
        success(function(data, status, headers, config) {
            $scope.success = data;
            $scope.grid.dataSource.add({
                id: data.id,
                name: data.name,
                type: data.type
            });
            $scope.grid.dataSource.sync();
        }).
        error(function(data, status, headers, config) {
            $scope.error = data;
        });
    };
    /*<PCModuleED 站点管理>*/
})
/*广告管理Ctrl*/
.controller('AdMagCtrl', function($scope, $rootScope) {
    $scope.pageheader = '广告管理';
    $scope.pageheaderTitle = '租户Admin';
    $scope.pageheaderChildTitle = '广告管理';
})
/*成员管理Ctrl*/
.controller('PeopleCtrl', function($scope, $rootScope, $state, $http, $location, $cookieStore) {
    /*<PCModuleST 成员管理 成员管理 PeopleManager>*/
    /*侧边栏内容设置*/
    $rootScope.sideTitles = [{
        name: '成员管理',
        url: 'people',
        icon: 'icon-users'
    }, {
        name: '角色管理',
        url: 'roleMag',
        icon: 'icon-user-follow'
    }];
    $scope.pageheader = '成员管理';
    $scope.pageheaderTitle = '成员';
    $scope.pageheaderChildTitle = '成员管理';
    var token = '';
    if ($cookieStore.get('tokenState')) {
        token = $cookieStore.get('tokenState');
    }
    $scope.gridAPI = apiUrl + "api/UppTenant/Base/ACL/UserX/" + $rootScope.my.tenants[0].id + "/00000000000000000000000000000000/" + $rootScope.my.sites[0].id + "/";
    $scope.mainGridOptions = {
        dataSource: {
            transport: {
                read: {
                    /*<PCCode GetUsers>*/
                    url: $scope.gridAPI,
                    dataType: "json",
                    beforeSend: function(req) {
                        req.setRequestHeader("Authorization", "Bearer " + token);
                    }
                },
                update: {
                    /*<PCCode PutUser>*/
                    url: function(data) {
                        return $scope.gridAPI + data.models[0].id;
                    },
                    dataType: "json",
                    type: "PUT",
                    contentType: "application/json",
                    beforeSend: function(req) {
                        req.setRequestHeader("Authorization", "Bearer " + token);
                    }
                },
                destroy: {
                    /*<PCCode DeleteUser>*/
                    url: function(data) {
                        return $scope.gridAPI + data.models[0].id;
                    },
                    dataType: "json",
                    type: "DELETE",
                    beforeSend: function(req) {
                        req.setRequestHeader("Authorization", "Bearer " + token);
                    }
                },
                create: {
                    url: $scope.gridAPI,
                    dataType: "json",
                    type: "POST",
                    contentType: "application/json",
                    beforeSend: function(req) {
                        req.setRequestHeader("Authorization", "Bearer " + token);
                    }
                },
                parameterMap: function(options, operation) {
                    if (operation === "update" && options.models) {
                        var jsonObject = {
                            "id": options.models[0].id,
                            "tenantId": $rootScope.my.tenants[0].id,
                            "siteId": $rootScope.my.tenants[0].id,
                            "userName": options.models[0].userName,
                            "phone": options.models[0].phone,
                            "department": options.models[0].department,
                            "extType": "",
                            "extData": "",
                        };
                        return kendo.stringify(jsonObject);
                    }
                }
            },
            batch: true,
            pageSize: 10,
            schema: {
                model: {
                    id: "id",
                    fields: {
                        id: {
                            editable: false,
                            nullable: true
                        },
                        userName: {
                            type: "string",
                            defaultValue: "",
                            nullable: true
                        },
                        phone: {
                            type: "string",
                            defaultValue: "",
                            nullable: true
                        },
                        department: {
                            type: "string",
                            defaultValue: "",
                            nullable: true
                        },
                    }
                }
            }
        },
        height: 400,
        sortable: true,
        pageable: {
            refresh: true,
            pageSizes: true,
            buttonCount: 5
        },
        selectable: "multiple, row",
        change: onChange,
        autobind: true,
        columns: [{
            field: "id",
            title: "成员编号",
            width: "200px"
        }, {
            field: "userName",
            title: "姓名",
            width: "100px"
        }, {
            field: "phone",
            title: "联系方式",
            width: "100px"
        }, {
            field: "department",
            title: "部门",
            width: "100px"
        }, {
            command: ["edit", "destroy"],
            title: "&nbsp;",
            width: "100px"
        }, ],
        editable: "inline"
    };
    /*表格事件*/
    function onChange(e) {
        var item = e.sender.dataItem(e.sender.select());
        $scope.userName = item.userName;
        $scope.phone = item.phone;
        $scope.department = item.department;
        $scope.detail = item;
        $scope.$apply();
    }
    /*表单控制*/
    $scope.saved = {};
    $scope.reset = function() {
        $scope.tenant = angular.copy($scope.saved);
    }
    $scope.update = function(people) {
        /*<PCCode PostSite>*/
        var jsonObject = {
            "id": "00000000000000000000000000000000",
            "tenantId": $rootScope.my.tenants[0].id,
            "siteId": $rootScope.my.sites[0].id,
            "userName": people.userName,
            "phone": people.phone,
            "department": people.department,
            "extType": "",
            "extData": ""
        };
        $http({
            method: 'POST',
            url: $scope.gridAPI,
            data: jsonObject,
            headers: {
                "Authorization": "Bearer " + token
            }
        }).
        success(function(data, status, headers, config) {
            $scope.success = data;
            $scope.grid.dataSource.add({
                id: data.id,
                userName: data.userName,
                phone: data.phone,
                department: data.department
            });
            $scope.grid.dataSource.sync();
        }).
        error(function(data, status, headers, config) {
            $scope.error = data;
        });
    };
    /*<PCModuleED 成员管理>*/
})
/*角色管理Ctrl*/
.controller('RoleMagCtrl', function($scope, $rootScope, $state, $http, $location, $cookieStore) {
    /*事件监听*/
    // $scope.$on('$viewContentLoaded', function() {
    //     Metronic.init();
    // });
    $http({
        method: 'GET',
        url: '/scripts/controllers/Result.json',
    }).
    success(function(data, status, headers, config) {
        $scope.features = data;
    }).
    error(function(data, status, headers, config) {

    });
    $scope.selection = [];
    $scope.toggleSelection = function(featurename) {
        var idx = $scope.selection.indexOf(featurename);
        if (idx > -1) {
            $scope.selection.splice(idx, 1);
        } else {
            $scope.selection.push(featurename);
        }

    }
    /*<PCModuleST 角色管理 角色管理 RoleManager>*/
    $scope.pageheader = '角色管理';
    $scope.pageheaderTitle = '成员';
    $scope.pageheaderChildTitle = '角色管理';
    var token = '';
    if ($cookieStore.get('tokenState')) {
        token = $cookieStore.get('tokenState');
    }
    $scope.gridAPI = apiUrl + "api/UppTenant/Base/ACL/Role/" + $rootScope.my.tenants[0].id + "/00000000000000000000000000000000/" + $rootScope.my.sites[0].id + "/";
    $scope.mainGridOptions = {
        dataSource: {
            transport: {
                read: {
                    /*<PCCode GetRoles>*/
                    url: $scope.gridAPI,
                    dataType: "json",
                    beforeSend: function(req) {
                        req.setRequestHeader("Authorization", "Bearer " + token);
                    }
                },
                update: {
                    /*<PCCode PutRole>*/
                    url: function(data) {
                        return $scope.gridAPI + data.models[0].id;
                    },
                    dataType: "json",
                    type: "PUT",
                    contentType: "application/json",
                    beforeSend: function(req) {
                        req.setRequestHeader("Authorization", "Bearer " + token);
                    }
                },
                destroy: {
                    /*<PCCode DeleteRole>*/
                    url: function(data) {
                        return $scope.gridAPI + data.models[0].id;
                    },
                    dataType: "json",
                    type: "DELETE",
                    beforeSend: function(req) {
                        req.setRequestHeader("Authorization", "Bearer " + token);
                    }
                },
                create: {
                    url: $scope.gridAPI,
                    dataType: "json",
                    type: "POST",
                    contentType: "application/json",
                    beforeSend: function(req) {
                        req.setRequestHeader("Authorization", "Bearer " + token);
                    }
                },
                parameterMap: function(options, operation) {
                    if (operation === "update" && options.models) {
                        var jsonObject = {
                            "id": options.models[0].id,
                            "tenantId": $rootScope.my.tenants[0].id,
                            "siteId": $rootScope.my.sites[0].id,
                            "roleName": options.models[0].roleName,
                            "features": options.models[0].features,
                            "extType": "",
                            "extData": "",
                        };
                        return kendo.stringify(jsonObject);
                    }
                }
            },
            batch: true,
            pageSize: 10,
            schema: {
                model: {
                    id: "id",
                    fields: {
                        id: {
                            editable: false,
                            nullable: true
                        },
                        roleName: {
                            type: "string",
                            defaultValue: "",
                            nullable: true
                        },
                        features: {
                            type: "string",
                            defaultValue: "",
                            nullable: true
                        }
                    }
                }
            }
        },
        height: 400,
        sortable: true,
        detailTemplate: kendo.template($("#template").html()),
        pageable: {
            refresh: true,
            pageSizes: true,
            buttonCount: 5
        },
        selectable: "multiple, row",
        change: onChange,
        autobind: true,
        columns: [{
            field: "id",
            title: "角色编号",
            width: "200px"
        }, {
            field: "roleName",
            title: "角色名称",
            width: "100px"
        }, {
            command: ["edit", "destroy"],
            title: "&nbsp;",
            width: "100px"
        }, ],
        editable: "inline"
    };
    $scope.detailGridOptions = function(dataItem) {
        return {
            dataSource: {
                transport: {
                    /*<PCCode GetRoles>*/
                    read: function(options) {
                        $http({
                            method: 'GET',
                            dataType: "json",
                            url: $scope.gridAPI + dataItem.id + "?user=true",
                            headers: {
                                "Authorization": "Bearer " + token
                            }
                        }).
                        success(function(result) {
                            var resultData = [];
                            for (var i = 0; i < result.length; i++) {
                                var data = {
                                    userName: result[i],
                                    id: dataItem.id
                                }
                                resultData.push(data);
                            }
                            options.success(resultData);
                        }).
                        error(function(result) {
                            options.error(result);
                        });
                    },
                    update: function(options) {
                        $http({
                            method: 'PUT',
                            url: $scope.gridAPI,
                            headers: {
                                "Authorization": "Bearer " + token
                            }
                        }).
                        success(function(result) {
                            options.success(result);
                        }).
                        error(function(result) {
                            options.error(result);
                        });
                    },
                    destroy: function(options) {
                        /*<PCCode DeleteRole>*/
                        $http({
                            method: 'DELETE',
                            url: $scope.gridAPI + dataItem.id + "?user=" + options.data.userName,
                            headers: {
                                "Authorization": "Bearer " + token
                            }
                        }).
                        success(function(result) {
                            options.success(result);
                        }).
                        error(function(result) {
                            options.error(result);
                        });
                    },
                    create: function(options) {
                        /*<PCCode PostRoleUser>*/
                        $http({
                            method: 'POST',
                            dataType: "json",
                            url: $scope.gridAPI + dataItem.id + "?user=" + options.data.userName,
                            headers: {
                                "Authorization": "Bearer " + token
                            }
                        }).
                        success(function(result) {
                            options.success(result);
                        }).
                        error(function(result) {
                            options.error(result);
                        });
                    },
                    parameterMap: function(options, operation) {
                        if (operation !== "read" && options.models) {
                            return {
                                models: kendo.stringify(options.models)
                            };
                        }
                    }
                },
                pageSize: 10,
                // filter: {
                //     field: "id",
                //     operator: "eq",
                //     value: dataItem.id
                // },
                schema: {
                    model: {
                        id: "id",
                        fields: {
                            id: {
                                editable: false,
                                nullable: true
                            },
                            userName: {
                                defaultValue: "",
                            }
                        }
                    }
                }
            },
            scrollable: true,
            sortable: true,
            selectable: "multiple, row",
            pageable: {
                refresh: true,
                pageSizes: true,
                buttonCount: 5
            },
            toolbar: ["create"],
            editable: "popup",
            edit: function(e) {
                e.container.data("kendoWindow").title('分配成员角色');
            },
            columns: [{
                field: "userName",
                title: "成员姓名",
                width: "200px",
                editor: userDropDownEditor,
                template: "#=userName#"
            }, {
                command: ["destroy"],
                title: "&nbsp;",
                width: "50px"
            }],

        };
    };
    /*dropdownlist控件*/
    function userDropDownEditor(container, options) {
        $('<input required data-text-field="userName" data-value-field="userName" data-bind="value:' + options.field + '"/>')
            .appendTo(container)
            .kendoDropDownList({
                optionLabel: "-- 选择成员 --",
                autoBind: false,
                dataSource: {
                    transport: {
                        read: {
                            /*<PCCode GetUsers>*/
                            url: apiUrl + "api/UppTenant/Base/ACL/UserX/" + $rootScope.my.tenants[0].id + "/00000000000000000000000000000000/" + $rootScope.my.sites[0].id + "/",
                            dataType: "json",
                            beforeSend: function(req) {
                                req.setRequestHeader("Authorization", "Bearer " + token);
                            }
                        }
                    }
                }
            });
    }
    /*表格事件*/
    function onChange(e) {
        var item = e.sender.dataItem(e.sender.select());
        $scope.roleName = item.roleName;
        $scope.detail = item;
        $scope.$apply();
    }
    /*表单控制*/
    $scope.saved = {};
    $scope.reset = function() {
        $scope.tenant = angular.copy($scope.saved);
    }
    $scope.update = function(people) {
        /*<PCCode PostRole>*/
        for (var i = 0; i < $scope.selection.length; i++) {
            $scope.selection[i]["Id"] = "00000000000000000000000000000000";
        }
        var jsonObject = {
            "id": "00000000000000000000000000000000",
            "tenantId": $rootScope.my.tenants[0].id,
            "siteId": $rootScope.my.sites[0].id,
            "roleName": people.roleName,
            "features": kendo.stringify($scope.selection),
            "extType": "",
            "extData": ""
        };
        $http({
            method: 'POST',
            url: $scope.gridAPI,
            data: jsonObject,
            headers: {
                "Authorization": "Bearer " + token
            }
        }).
        success(function(data, status, headers, config) {
            $scope.success = data;
            $scope.grid.dataSource.add({
                id: data.id,
                roleName: data.roleName,
            });
            $scope.grid.dataSource.sync();
        }).
        error(function(data, status, headers, config) {
            $scope.error = data;
        });
    };

    /*<PCModuleED 角色管理>*/
});
