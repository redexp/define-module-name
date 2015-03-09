;(function (root) {

    define.version = '1.2.0';

    root.define = define;
    root.require = require;

    define.amd = {
        jQuery: true
    };

    define.clear = clear;

    require.config = function () {};
    require.specified = specified;

    var modules, names;

    clear();

    function define(name, deps, cb) {
        if (arguments.length === 1) {
            switch (typeof name) {
                case 'string':
                    nextName(name);
                    return;

                case 'function':
                    cb = name;
                    name = nextName();
                    deps = ['require', 'exports', 'module'];
                    break;

                case 'object':
                    var result = name;
                    name = nextName();
                    deps = [];
                    cb = function () {
                        return result;
                    };
                    break;

                default:
                    throw new Error('Unknown one argument type: ' + typeof name);
            }
        }
        else if (arguments.length === 2) {
            cb = deps;
            deps = name;
            name = nextName();
        }
        else if (names.length > 0) {
            name = nextName();
        }

        if (typeof name !== 'string') {
            throw new Error('Invalid module name type: ' + typeof name);
        }

        if (specified(name)) {
            throw new Error('Module already defined: ' + name);
        }

        modules[name] = {
            callback: cb,
            deps: deps,
            called: false,
            pending: false,
            result: null
        };
    }

    function require(deps, cb) {
        if (arguments.length === 1) {
            switch (typeof deps) {
                case 'string':
                    return moduleResult(deps);

                case 'object':
                    cb = function () {};
                    break;
            }
        }

        cb.apply(null, deps.map(moduleResult));
    }

    function moduleResult(name) {
        if (typeof name !== 'string') return name;

        switch (name) {
            case 'require':
                return require;
        }

        if (!has(modules, name)) {
            throw new Error('Undefined module: ' + name);
        }

        var module = modules[name];

        if (!module.called) {
            if (module.pending) return;

            module.pending = true;

            var moduleExports = {exports: {}},
                hasModuleExports = false;

            var exportsIndex = module.deps.indexOf('exports');
            if (exportsIndex > -1) {
                hasModuleExports = true;
                module.deps.splice(exportsIndex, 1, moduleExports.exports);
            }

            var moduleIndex = module.deps.indexOf('module');
            if (moduleIndex > -1) {
                hasModuleExports = true;
                module.deps.splice(moduleIndex, 1, moduleExports);
            }

            var result = module.callback.apply(null, module.deps.map(moduleResult));

            module.result = hasModuleExports ? moduleExports.exports : result;

            module.called = true;
            module.pending = false;
        }

        return modules[name].result;
    }

    function nextName(name) {
        if (name && specified(name)) {
            throw new Error('Module already defined: ' + name);
        }

        return name ? names.push(name) : names.shift();
    }

    function clear() {
        modules = define.modules = {};
        names = define.names = [];
    }

    function specified(name) {
        return has(modules, name);
    }

    function has(obj, field) {
        return Object.prototype.hasOwnProperty.call(obj, field);
    }

}(typeof exports === 'object' ? exports : this));