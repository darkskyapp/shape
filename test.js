(function() {
  "use strict";
  var assert, assertCloseTo, shape, wyoming;

  assert  = require("assert");
  shape   = require("./");
  wyoming = require("./wyoming.json");

  assertCloseTo = function(expected, actual, tolerance) {
    assert(
      Math.abs(actual - expected) <= tolerance,
      "expected " + expected + " to be close to " + actual +
        " (+/- " + tolerance + ")"
    );
  };

  describe("shape", function() {
    describe("area", function() {
      it("should throw an error given a non-shape", function() {
        assert.throws(function() {
          shape.area(null);
        });
      });

      it("should return 0 given a point", function() {
        assert.strictEqual(0.0, shape.area([0.0, 0.0]));
      });

      it("should return 1 given a box covering the globe", function() {
        assert.strictEqual(1.0, shape.area([-90.0, -180.0, +90.0, +180.0]));
      });

      it("should return 0.5 given a box covering the northern hemisphere", function() {
        assert.strictEqual(0.5, shape.area([-90.0, -180.0, 0.0, +180.0]));
      });

      it("should return 0.5 given a box covering the western hemisphere", function() {
        assert.strictEqual(0.5, shape.area([-90.0, -180.0, +90.0, 0.0]));
      });

      it("should return the correct box area of Wyoming", function() {
        assertCloseTo(
          253348.0,
          510072000.0 * shape.area([41.0, -111.05, 45.0, -104.05]),
          500.0
        );
      });

      it("should return the correct polygonal area of Wyoming", function() {
        assertCloseTo(
          253348.0,
          510072000.0 * shape.area(wyoming),
          500.0
        );
      });
    });

    describe("bounds", function() {
      it("should fail given an invalid shape", function() {
        assert.throws(function() {
          shape.bounds([]);
        });
      });

      it("should return a zero-area bounding box given a point", function() {
        assert.deepEqual(
          [42, -73, 42, -73],
          shape.bounds([42, -73])
        );
      });

      it("should return a box verbatim", function() {
        var box;

        box = [42, -73, 43, -72];
        assert.strictEqual(box, shape.bounds(box));
      });

      it("should return the bounding box of a polygon");
    });

    describe("overlaps", function() {
    });
  });
})();
