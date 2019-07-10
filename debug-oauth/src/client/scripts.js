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

    var AuthorizeViewModel = {
        template: "#tpl-authorize",
        data: function () {
            return {
                editors: {
                    user: null,
                    request: null,
                    options: null,
                },
                defaults: {
                    user: {
                        user_id: "user1",
                        email: "user1@example.org",
                        email_verified: false,
                        name: "User I",
                    },
                    full_user: {
                        user_id: "user1",
                        email: "user1@example.org",
                        email_verified: false,
                        name: "User I",
                        given_name: "User",
                        family_name: "I",
                        gender: "male",
                        locale: "pt-PT",
                        nickname: "u-one",
                        birthdate: "0000-01-01"
                    },
                    request: {
                        redirect_uri: "http://example.com",
                    },
                    options: {
                        issue_refresh_token: true,
                        errors: {
                            at_authorize: {},
                            at_token: {},
                        }
                    }
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

            vm.editors.request = new JSONEditor(document.getElementById("request"), { mode: "code" });

            if (Object.keys(qs).length > 0) {
                vm.editors.request.set(qs);
            } else {
                vm.editors.request.set(vm.defaults.request);
            }

            vm.editors.user = new JSONEditor(document.getElementById("user"), { mode: "code" });
            vm.editors.user.set(vm.defaults.user);

            vm.editors.options = new JSONEditor(document.getElementById("options"), { mode: "code" });
            vm.editors.options.set(vm.defaults.options);

            $("#user textarea").on("blur", function () {
                sessionStorage.setItem("e_user", JSON.stringify(vm.editors.user.get()));
            });

            $("#options textarea").on("blur", function () {
                Cookies.set("settings", JSON.stringify(vm.editors.options.get()));
            });

            var user = sessionStorage.getItem("e_user");

            if (user) {
                vm.editors.user.set(JSON.parse(user));
            }

            var settings = Cookies.get("settings");

            if (settings) {
                vm.editors.options.set(JSON.parse(settings));
            }
        },
        methods: {
            authorize: function () {
                var payload = this.editors.request.get();
                var user = this.editors.user.get();

                var html = Object.keys(payload).map(k => `<input type="hidden" name="${k}" value="${payload[k]}" />`).join("");

                html += `<input type="hidden" name="user" value="${Helpers.encodeBase64Url(JSON.stringify(user))}" />`;

                $("<form>", { "html": html, "method": "post" }).appendTo(document.body).submit();
            },
            reset: function () {
                var vm = this;

                vm.editors.user.set(vm.defaults.user);
                sessionStorage.setItem("e_user", JSON.stringify(vm.defaults.user));

                vm.editors.options.set(vm.defaults.options);
                Cookies.set("settings", JSON.stringify(vm.editors.options.get()));
            },
            profile: function (name) {
                var vm = this;

                var profile = vm.defaults[name] || vm.defaults.user;

                vm.editors.user.set(profile);
                sessionStorage.setItem("e_user", JSON.stringify(profile));
            }
        }
    };

    var routes = {
        "#/authorize": AuthorizeViewModel,
    };

    var app = new Vue({
        el: "#app",
        data: {
            route: window.location.hash
        },
        computed: {
            getView: function () { return routes[this.route] || AuthorizeViewModel; }
        },
        render: function (createElement) { return createElement(this.getView); }
    });
})();
