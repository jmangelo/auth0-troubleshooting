(function () {
    var Helpers = {};

    Helpers.getRandomBytes = function () {
        var array = new Uint8Array(16);

        var crypto = window.crypto || window.msCrypto;

        if (crypto) {
            array = crypto.getRandomValues(array);
        } else {
            function getRandomInt(min, max) {
                min = Math.ceil(min);
                max = Math.floor(max);

                return Math.floor(Math.random() * (max - min)) + min;
            }

            for (var index = 0; index < array.length; index++) {
                array[index] = getRandomInt(0, 255);
            }
        }

        return array;
    };

    Helpers.encodeBase64Url = function (data) {
        if (typeof data !== "string") {
            data = String.fromCharCode.apply(null, bytes);
        }

        var base64 = btoa(data);

        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
    };

    var DBViewModel = {
        template: "#tpl-db",
        data: function () {
            return {
                editors: {
                    users: null,
                    options: null,
                    conditions: null,
                },
                defaults: {
                    options: {
                        validate_passwords: false
                    },
                    conditions: ['email == "user@example.org" :: 404 :: 0']
                }
            };
        },
        mounted: function () {
            var vm = this;

            var qs = {};

            if (window.location.search) {
                var match,
                    pl = /\+/g, // Regex for replacing addition symbol with a space
                    search = /([^&=]+)=?([^&]*)/g,
                    decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
                    query = window.location.search.substring(1);

                while (match = search.exec(query)) {
                    qs[decode(match[1])] = decode(match[2]);
                }
            }

            vm.editors.options = new JSONEditor(document.getElementById("options"), { mode: "code" });
            vm.editors.options.set(vm.defaults.options);

            vm.editors.users = new JSONEditor(document.getElementById("users"), { mode: "code" });
            vm.editors.users.set([]);

            vm.editors.conditions = ace.edit("conditions");
            vm.editors.conditions.session.setMode("ace/mode/text");

            vm.refresh();
        },
        methods: {
            save: function () {
                var vm = this;

                let users = vm.editors.users.get();

                $.ajax({
                    type: "POST", url: "./api/management/users", data: JSON.stringify(users),
                    contentType: "application/json", success: function () { }
                });

                var settings = vm.editors.options.get();

                settings.conditions = vm.editors.conditions.getValue().split("\n");

                $.ajax({
                    type: "POST", url: "./api/management/settings", data: JSON.stringify(settings),
                    contentType: "application/json", success: function () { }
                });
            },
            reset: function () {
                var vm = this;

                $.ajax({
                    type: "DELETE", url: "./api/management/users",
                    success: function () { }
                });
    
                vm.editors.options.set(vm.defaults.options);
                vm.editors.conditions.setValue(vm.defaults.conditions.join("\n"));

                var settings = vm.editors.options.get();

                settings.conditions = vm.editors.conditions.getValue().split("\n");

                $.ajax({
                    type: "POST", url: "./api/management/settings", data: JSON.stringify(settings),
                    contentType: "application/json", success: function () { }
                });

                $.ajax({
                    type: "GET", url: "./api/management/users",
                    success: function (users) {
                        vm.editors.users.set(users);
                    }
                });
            },
            refresh: function () {
                var vm = this;

                $.ajax({
                    type: "GET", url: "./api/management/users",
                    success: function (users) {
                        vm.editors.users.set(users);
                    }
                });
    
                $.ajax({
                    type: "GET", url: "./api/management/settings",
                    success: function (settings) {
                        var options = Object.assign({}, settings);
    
                        delete options.conditions;
    
                        vm.editors.options.set(options);
                        vm.editors.conditions.setValue(settings.conditions.join("\n"));
                    }
                });
            },
            test: function () {
                var vm = this;

                $.ajax({
                    type: "GET", url: "./api/db/get_user?email=user@example.org",
                    success: function () { }
                });
            },
        }
    };

    var routes = {
        "#/db": DBViewModel,
    };

    var app = new Vue({
        el: "#app",
        data: {
            route: window.location.hash
        },
        computed: {
            getView: function () { return routes[this.route] || DBViewModel; }
        },
        render: function (createElement) { return createElement(this.getView); }
    });
})();
