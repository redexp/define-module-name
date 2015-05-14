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

        d.require(['test'], function () {

        });

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

    it('should handle define after require', function () {
        var y1 = 0;

        d.require(['test', 'test2'], function (test, test2) {
            y1++;
            if (y1 > 1) {
                done(new Error('Called ' + y1 + ' times'));
                return;
            }
            expect(test).to.equal(1);
            expect(test2).to.equal(2);
        });

        var y2 = 0;

        d.require(['test', 'test2'], function (test, test2) {
            y2++;
            if (y2 > 1) {
                throw new Error('Called ' + y2 + ' times');
            }
            expect(test).to.equal(1);
            expect(test2).to.equal(2);
        });

        var y3 = 0;

        d.define('test', ['sub-test'], function () {
            y3++;
            if (y3 > 1) {
                throw new Error('Called ' + y3 + ' times');
            }

            return 1;
        });

        var y4 = 0;

        d.define('sub-test', ['sub-sub-test'], function () {
            y4++;
            if (y4 > 1) {
                throw new Error('Called ' + y4 + ' times');
            }

            return 1;
        });

        var y5 = 0;

        d.define('test2', ['sub-test2'], function () {
            y5++;
            if (y5 > 1) {
                throw new Error('Called ' + y5 + ' times');
            }

            return 2;
        });

        var y6 = 0;

        d.define('sub-sub-test', [], function () {
            y6++;
            if (y6 > 1) {
                throw new Error('Called ' + y6 + ' times');
            }

            return 1;
        });

        var y7 = 0;

        d.define('sub-test2', [], function () {
            y7++;
            if (y7 > 1) {
                throw new Error('Called ' + y7 + ' times');
            }

            return 1;
        });

        expect(y1 + y2 + y3 + y4 + y5 + y6 + y7).to.equal(7);
    });

    it('chould throw error if still pending', function () {
        d.require(['test'], function () {

        });

        try {
            d.define.end();
            throw new Error('Should not be here');
        }
        catch (e) {
            expect(e.message).to.equal('Undefined module: test');
        }
    });

    it('should handle cb as not function', function () {
        var x = {};
        d.define('test', [], x);

        expect(d.require('test')).to.equal(x);
    });

    it('should have prdefined modules', function () {
        d.define('bb', ['test2', 'require', 'exports', 'module'], function (t, req, e, m) {
            expect(req).to.equal(d.require);
            expect(e).to.be.object;
            expect(e).to.equal(m.exports);

            return 1;
        });

        d.define('test2', [], function () {

        });

        d.define('test', ['bb'], function (req, e, m) {
            return 1;
        });

        d.require(['test'], function (t) {
            expect(t).to.equal(1);
        });

        d.define.end();
    });
});