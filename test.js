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

      it("should return the bounding box of a polygon", function() {
        assert.deepEqual(
          [0, 0, 2, 3],
          shape.bounds([0, 0, 0, 3, 2, 0])
        );
      });
    });

    describe("overlaps", function() {
      it("should fail if the first argument is invalid", function() {
        assert.throws(function() {
          shape.overlaps([190, 0], [10, 0]);
        });
      });

      it("should fail if the second argument is invalid", function() {
        assert.throws(function() {
          shape.overlaps([0, 0, 10, 10], [10, 10, 0, 0]);
        });
      });

      it("should fail if both arguments are invalid", function() {
        assert.throws(function() {
          shape.overlaps([80, 360], [100, 0]);
        });
      });

      it("should return false for two points that do not match", function() {
        assert.strictEqual(
          false,
          shape.overlaps([0, 1], [1, 0])
        );
      });

      it("should return true for two points that match", function() {
        assert.strictEqual(
          true,
          shape.overlaps([0, 1], [0, 1])
        );
      });


      it("should return false for a point outside of a box", function() {
        assert.strictEqual(
          false,
          shape.overlaps([-1, -1, +1, +1], [2, 0])
        );

        assert.strictEqual(
          false,
          shape.overlaps([2, 0], [-1, -1, +1, +1])
        );
      });

      it("should return true for a point inside of a box", function() {
        assert.strictEqual(
          true,
          shape.overlaps([-1, -1, +1, +1], [0, 0])
        );

        assert.strictEqual(
          true,
          shape.overlaps([0, 0], [-1, -1, +1, +1])
        );
      });

      it("should return false for two boxes that do not overlap", function() {
        assert.strictEqual(
          false,
          shape.overlaps([-2, -2, -1, -1], [1, 1, 2, 2])
        );
      });

      it("should return true for two boxes that overlap", function() {
        assert.strictEqual(
          true,
          shape.overlaps([-1, -1, 0, 0], [0, 0, 1, 1])
        );
      });

      it(
        "should return false for a polygon that does not contain a point",
        function() {
          var point, polygon;

          point = [0, 0];

          polygon = [
            -2,  0,
             0, -2,
             2,  0,
             0,  2,
            -2,  0,
            -1,  0,
             0,  1,
             1,  0,
             0, -1,
            -1,  0
          ];

          assert.strictEqual(false, shape.overlaps(point, polygon));
          assert.strictEqual(false, shape.overlaps(polygon, point));
        }
      );

      it("should return true for a polygon that does contain a point");

      it("should return false for a polygon that does not overlap a box");

      it("should return true for a polygon that does overlap a box");

      it("should return false for two polygons that do not overlap");

      it("should return true for two polygons that overlap");
    });
  });
})();
