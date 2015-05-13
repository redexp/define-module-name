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
        });

        expect(d.require('test')).to.deep.equal({test: 1});
    });

    it('should handle recursion', function () {
        var num = 0;

        d.define('x', ['test'], function (test) {
            num++;

            expect(test).to.equal(2);
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

        d.define('x');

        d.define(function (req, e, m) {
            num++;

            e.test = 2;

            return 2;
        });

        d.define('y');

        d.define(function (req, e, m) {
            num++;

            e.test = 3;
        });

        expect(d.require('test')).to.equal(1);
        expect(d.require('test')).to.equal(1);
        expect(d.require('x')).to.equal(2);
        expect(d.require('y')).to.deep.equal({test: 3});
        expect(num).to.equal(3);
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

    it('should throw error if module undefined', function () {
        d.require(
            ['test'],
            function () {
                throw new Error('Should not be here');
            }
        );

        try {
            d.define.end();
        }
        catch (e) {
            expect(e.message).to.equal('Undefined module: test');
        }
    });

    it('should throw undefined module error immediately', function () {
        try {
            d.require('test');
            throw new Error('Error not thrown');
        }
        catch (err) {
            expect(err.message).to.equal('Undefined module: test');
        }
    });

    it('should handle define after require', function (done) {
        var num = 0;

        d.require(['test', 'test2'], function (test, test2) {
            num++;
            if (num > 1) {
                done(new Error('Called ' + num + ' times'));
                return;
            }
            expect(test).to.equal(1);
            expect(test2).to.equal(2);
        });

        var y = 0;

        d.require(['test', 'test2'], function (test, test2) {
            y++;
            if (y > 1) {
                done(new Error('Called ' + y + ' times'));
                return;
            }
            expect(test).to.equal(1);
            expect(test2).to.equal(2);
        });

        setTimeout(function () {
            d.define('test', ['sub-test'], function () {
                return 1;
            });

            setTimeout(function () {
                d.define('test2', [], function () {
                    return 2;
                });

                d.define('sub-test', [], function () {
                    return 3;
                });

                d.define.end();

                done();
            }, 250);
        }, 250);
    });

    it('should handle cb as not function', function () {
        var x = {};
        d.define('test', [], x);

        expect(d.require('test')).to.equal(x);
    });

});