;(function () {

    /** @global */
    var window = typeof exports === 'object' ? exports : this;

    define.version = '1.4.0';

    window.define = define;
    window.require = require;

    define.amd = {
        jQuery: true
    };

    define.clear = clear;
    define.end = end;
    define.timeout = 1000;

    require.config = function () {};
    require.specified = specified;

    var modules, names, pending;

    clear();

    /**
     * @global
     * @param {String|Array|Function} name
     * @param {Array|Function} deps
     * @param {Function} cb
     */
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

        timeoutEnd();
    }

    /**
     * @global
     * @param {String|Array} deps
     * @param {Function} cb
     * @param {Function} [err]
     */
    function require(deps, cb, err) {
        if (arguments.length === 1) {
            switch (typeof deps) {
                case 'string':
                    return moduleResult(deps);

                case 'object':
                    cb = function () {};
                    break;
            }
        }

        if (!end.called && !specified(deps)) {
            pending.push({
                cb: cb,
                deps: deps,
                err: err
            });

            timeoutEnd();

            return;
        }

        try {
            cb.apply(null, deps.map(moduleResult));
        }
        catch (e) {
            if (err) {
                err(e);
            }
            else {
                throw e;
            }
        }
    }

    function moduleResult(name) {
        if (typeof name !== 'string') return name;

        switch (name) {
            case 'require':
                return require;
        }

        if (!specified(name)) {
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

            module.result = typeof result !== 'undefined' ? result : (hasModuleExports ? moduleExports.exports : result);

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
        pending = define.pending = [];
        end.called = false;
        clearTimeout(timeoutEnd.timer);
    }

    function specified(names) {
        if (typeof names === 'string') {
            return has(modules, names);
        }

        return names.every(specified);
    }

    function end() {
        end.called = true;

        pending.forEach(function (item) {
            require(item.deps, item.cb, item.err);
        });

        pending = [];
    }

    function timeoutEnd() {
        clearTimeout(timeoutEnd.timer);
        timeoutEnd.timer = setTimeout(end, define.timeout);
    }

    function has(obj, field) {
        return obj && Object.prototype.hasOwnProperty.call(obj, field);
    }

}());