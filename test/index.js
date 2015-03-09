var d = require('../define-module-name');
var expect = require('chai').expect;

describe('define', function () {

    beforeEach(function () {
        d.define.clear();
    });

    it('should define a module', function () {
        var calls = 0;
        d.define('test', [], function () {
            calls++;
            return 1;
        });

        var num = 0;

        d.require(['test'], function (test) {
            num++;
            expect(test).to.equal(1);
        });

        d.require(['test']);

        expect(d.require('test')).to.equal(1);

        expect(calls).to.equal(1);
        expect(num).to.equal(1);
    });

    it('should return require, exports and module', function () {
        d.define('x', [], function () {
            return 1;
        });

        var num = 0;

        d.define('test', ['module', 'exports', 'require', 'x'], function (m, e, req, x) {
            num++;

            expect(m.exports).to.equal(e);
            expect(req).to.equal(d.require);
            expect(x).to.equal(1);
            expect(req('x')).to.equal(1);

            e.test = 1;

            return 2;
        });

        expect(d.require('test')).to.deep.equal({test: 1});
    });

    it('should handle recursion', function () {
        var num = 0;

        d.define('x', ['test'], function (test) {
            num++;

            expect(test).to.equal(3);
            return 1;
        });

        d.define('test', ['module', 'x'], function (m, x) {
            num++;

            expect(x).to.be.undefined;

            m.exports = 3;

            return 2;
        });

        expect(d.require('x')).to.equal(1);
        expect(num).to.equal(2);
    });

    it('should handle name', function () {
        var num = 0;

        d.define('test');

        d.define([], function () {
            num++;
            return 1;
        });

        d.define('x');

        d.define([], function () {
            num++;
            return 2;
        });

        d.define('y');
        d.define('z');

        d.define(['x'], function (x) {
            num++;

            expect(x).to.equal(2);

            return 3;
        });

        d.define(['test', 'y'], function (t, y) {
            num++;

            expect(t).to.equal(1);
            expect(y).to.equal(3);

            return 4;
        });

        expect(d.require('test')).to.equal(1);
        expect(d.require('x')).to.equal(2);
        expect(d.require('y')).to.equal(3);
        expect(d.require('z')).to.equal(4);

        expect(num).to.equal(4);
    });

    it('should overwrite name', function () {
        var num = 0;

        d.define('test');

        d.define('x', [], function () {
            num++;
            return 1;
        });

        expect(d.require('test')).to.equal(1);

        try {
            d.require('x');
        }
        catch(e) {
            num++;
            expect(e.message).to.equal('Undefined module: x');
        }

        expect(num).to.equal(2);
    });

    it('should handle name and function only', function () {
        var num = 0;

        d.define('test');

        d.define(function (req, e, m) {
            num++;

            expect(req).to.equal(d.require);
            expect(e).to.be.object;
            expect(e).to.equal(m.exports);

            m.exports = 1;
        });

        expect(d.require('test')).to.equal(1);
        expect(d.require('test')).to.equal(1);
        expect(num).to.equal(1);
    });
    
    it('should throw error if already defined', function () {
        num = 0;

        d.define('test', [], function () {
            return 1;
        });

        try {
            d.define('test');
        }
        catch (e) {
            num++;
            expect(e.message).to.equal('Module already defined: test');
        }
        
        try {
            d.define('test', [], function () {
                return 2;
            });
        }
        catch (e) {
            num++;
            expect(e.message).to.equal('Module already defined: test');
        }

        expect(num).to.equal(2);
        expect(d.require('test')).to.equal(1);
    });

});