/* global describe */
/* global it */
/* global require */

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

      it(
        "should return 0.5 given a box covering the northern hemisphere",
        function() {
          assert.strictEqual(0.5, shape.area([-90.0, -180.0, 0.0, +180.0]));
        }
      );

      it(
        "should return 0.5 given a box covering the western hemisphere",
        function() {
          assert.strictEqual(0.5, shape.area([-90.0, -180.0, +90.0, 0.0]));
        }
      );

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

      it(
        "should return true for a polygon that does contain a point",
        function() {
          var point, polygon;

          point = [-1.5, 0];

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

          assert.strictEqual(true, shape.overlaps(point, polygon));
          assert.strictEqual(true, shape.overlaps(polygon, point));
        }
      );

      it(
        "should return false for a polygon that does not overlap a box",
        function() {
          var box, polygon;

          box = [-0.4, -0.4, 0.4, 0.4];

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

          assert.strictEqual(false, shape.overlaps(box, polygon));
          assert.strictEqual(false, shape.overlaps(polygon, box));
        }
      );

      it("should return true for a polygon that overlaps a box", function() {
        var box, polygon;

        box = [-0.6, -0.6, 0.6, 0.6];

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

        assert.strictEqual(true, shape.overlaps(box, polygon));
        assert.strictEqual(true, shape.overlaps(polygon, box));
      });

      it(
        "should return false for two polygons that do not overlap",
        function() {
          assert.strictEqual(
            false,
            shape.overlaps(
              [-1, 0, -2, 1, -2, -1],
              [0, 0, -2, -2, 2, -2, 2, 2, -2, 2]
            )
          );
        }
      );

      it("should return true for two polygons that intersect", function() {
        assert.strictEqual(
          true,
          shape.overlaps(
            [ 1, 0, -1,  2, -3, 0, -1, -2],
            [-1, 0,  1, -2,  3, 0,  1,  2]
          )
        );
      });

      it("should return true for a polygon that contains another", function() {
        var a, b;

        a = [-1, 0, 0, -1, 1, 0, 0, 1];
        b = [-2, 0, 0, -2, 2, 0, 0, 2];

        assert.strictEqual(true, shape.overlaps(a, b));
        assert.strictEqual(true, shape.overlaps(b, a));
      });
    });

    describe("contains", function() {
      it("should return true for two equal points", function() {
        assert.strictEqual(true, shape.contains([0, 0], [0, 0]));
      });

      it("should return false for two unequal points", function() {
        assert.strictEqual(false, shape.contains([1, 0], [0, 1]));
      });

      it(
        "should return true for a point that contains a very tiny box",
        function() {
          assert.strictEqual(true, shape.contains([0, 0], [0, 0, 0, 0]));
        }
      );

      it(
        "should return false for a point and a box that contains it",
        function() {
          assert.strictEqual(false, shape.contains([0, 0], [-1, -1, 1, 1]));
        }
      );

      it("should return false for a disjoint point and box", function() {
        assert.strictEqual(false, shape.contains([0, -2], [-1, -1, 1, 1]));
      });

      it(
        "should return true for a point that contains a very tiny polygon",
        function() {
          assert.strictEqual(true, shape.contains([0, 0], [0, 0, 0, 0, 0, 0]));
        }
      );

      it(
        "should return false for a point and a polygon that contains it",
        function() {
          assert.strictEqual(
            false,
            shape.contains([0, 0], [0, -1, -1, 1, 1, 1])
          );
        }
      );

      it("should return false for a disjoint point and polygon", function() {
        assert.strictEqual(false, shape.contains([0, 0], [0, 1, -1, 3, 1, 3]));
      });

      it("should return true for a box that contains a point", function() {
        assert.strictEqual(true, shape.contains([-1, -1, 1, 1], [0, 0]));
      });

      it(
        "should return false for a box that does not contain a point",
        function() {
          assert.strictEqual(false, shape.contains([-1, -1, 1, 1], [2, 0]));
        }
      );

      it("should return true for a box that contains another", function() {
        assert.strictEqual(
          true,
          shape.contains([-1, -1, 2, 2], [0, 0, 1, 1])
        );
      });

      it(
        "should return false for a box that is contained by another",
        function() {
          assert.strictEqual(
            false,
            shape.contains([0, 0, 1, 1], [-1, -1, 2, 2])
          );
        }
      );

      it("should return false for two boxes that intersect", function() {
        assert.strictEqual(
          false,
          shape.contains([-1, -1, 1, 1], [0, 0, 2, 2])
        );
      });

      it("should return false for two disjoint boxes", function() {
        assert.strictEqual(
          false,
          shape.contains([-1, -1, 0, 0], [1, 1, 2, 2])
        );
      });

      it("should return true for a box that contains a polygon", function() {
        assert.strictEqual(
          true,
          shape.contains([-2, -2, 2, 2], [0, -1, -1, 1, 1, 1])
        );
      });

      it(
        "should return false for a box that is contained by a polygon",
        function() {
          assert.strictEqual(
            false,
            shape.contains([-1, -1, 1, 1], [0, -8, -8, 8, 8, 8])
          );
        }
      );

      it(
        "should return false for a box that intersects a polygon",
        function() {
          assert.strictEqual(
            false,
            shape.contains([-1, -1, 1, 1], [0, -2, 2, 0, 0, 2, -2, 0])
          );
        }
      );

      it("should return false for a disjoint box and polygon", function() {
        assert.strictEqual(
          false,
          shape.contains([-2, -2, -1, -1], [0, 2, -1, 3, 1, 3])
        );
      });

      it("should return true for a polygon that contains a point", function() {
        assert.strictEqual(
          true,
          shape.contains([0, -2, 2, 0, 0, 2, -2, 0], [0, 0])
        );
      });

      it(
        "should return false for a polygon that surrounds a point",
        function() {
          assert.strictEqual(
            false,
            shape.contains(
              [
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
              ],
              [0, 0]
            )
          );
        }
      );

      it("should return false for a polygon far from a point", function() {
        assert.strictEqual(false, shape.contains([2, 0, 3, -1, 3, 1], [0, 0]));
      });

      it("should return true for a polygon that contains a box", function() {
        assert.strictEqual(
          true,
          shape.contains([0, -4, 4, 0, 0, 4, -4, 0], [-1, -1, 1, 1])
        );
      });

      it("should return false for a polygon that surrounds a box", function() {
        assert.strictEqual(
          true,
          shape.contains(
            [
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
            ],
            [0, 0, 0, 0]
          )
        );
      });

      it(
        "should return false for a polygon that intersects a box",
        function() {
          assert.strictEqual(
            false,
            shape.contains(
              [-2, 0, 0, -2, 2, 0, 0, 2],
              [-1, -1, 1, 1]
            )
          );
        }
      );

      it("should return false for a polygon far from a box", function() {
        assert.strictEqual(
          false,
          shape.contains(
            [0, -1, -1, 1, 1, 1],
            [5, -1, 7, 1]
          )
        );
      });

      it("should return true for a polygon that contains another", function() {
        assert.strictEqual(
          true,
          shape.contains(
            [0, -4, -4, 4, 4, 4],
            [0, -1, -1, 1, 1, 1]
          )
        );
      });

      it(
        "should return false for a polygon that surrounds another",
        function() {
          assert.strictEqual(
            false,
            shape.contains(
              [
                -3,  0,
                 0, -3,
                 3,  0,
                 0,  3,
                -3,  0,
                -2,  0,
                 0,  2,
                 2,  0,
                 0, -2,
                -2,  0
              ],
              [-1, 0, 0, -1, 1, 0, 0, 1]
            )
          );
        }
      );

      it(
        "should return false for a polygon that intersects another",
        function() {
          assert.strictEqual(
            false,
            shape.contains(
              [-1, -2, 1, 0, -1, 2],
              [ 1, -2, 1, 2, -1, 0]
            )
          );
        }
      );

      it("should return false for two disjoint polygons", function() {
        assert.strictEqual(
          false,
          shape.contains(
            [-3, -2, -1, 0, -3, 2],
            [ 3, -2,  3, 2,  1, 0]
          )
        );
      });
    });
  });
})();
