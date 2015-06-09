/* global exports */

(function() {
  "use strict";
  var RADIANS, type;

  RADIANS = Math.PI / 180.0;

  type = function(shape) {
    var i, val;

    /* A shape must be an array. */
    if(!Array.isArray(shape)) {
      return 0;
    }

    /* A shape must have a nonzero, even length. */
    i = shape.length;
    if(i === 0 || (i & 1) === 1) {
      return 0;
    }

    /* A shape must consist of correctly-bounded latitudes and longitudes. */
    while(i) {
      val = shape[--i];
      if(!(val >= -180.0 && val <= +180.0)) {
        return 0;
      }

      val = shape[--i];
      if(!(val >= -90.0 && val <= +90.0)) {
        return 0;
      }
    }

    /* A shape with a single vertex is a point. */
    if(shape.length === 2) {
      return 1;
    }

    /* A shape with two vertices is a box. */
    else if(shape.length === 4) {
      /* A box's first vertex must be smaller than it's second vertex. */
      if(!(shape[0] <= shape[2] && shape[1] <= shape[3])) {
        return 0;
      }

      else {
        return 2;
      }
    }

    /* A shape with three or more vertices is a polygon. */
    else {
      return 3;
    }
  };

  (function() {
    var arity_1;

    arity_1 = function(point, box, polygon) {
      return function(shape) {
        switch(type(shape) & 3) {
          case 0: throw new TypeError("invalid shape");

          case 1: return point(shape);
          case 2: return box(shape);
          case 3: return polygon(shape);
        }
      };
    };

    /* Return the area of a shape as a percentage of the globe's area. */
    exports.area = arity_1(
      /* A point has no area. Euclid's Elements, Book 1, Definition 1. */
      function(point) {
        return 0.0;
      },
      /* The area of a quadrangle is the intersection of a lune and a zone. A
       * lune's area is just the difference in longitudes divided by 360
       * degrees (that is, the percentage of the globe they bound). A zone's
       * area is more complex, see: http://mathworld.wolfram.com/Zone.html */
      (function() {
        var INV_720, sin;

        INV_720 = 1.0 / 720.0;

        sin = Math.sin;

        return function(box) {
          return INV_720 *
                 (box[3] - box[1]) *
                 (sin(RADIANS * box[2]) - sin(RADIANS * box[0]));
        };
      })(),
      /* The area of a spherical polygon is actually fairly complex. The
       * below algorithm is from Graphics Gems IV, "Computing the Area of a
       * Spherical Polygon," Robert D. Miller.
       * 
       * https://web.archive.org/web/20120302213241/
       *   http://tog.acm.org/resources/GraphicsGems/gemsiv/sph_poly.c */
      (function() {
        var INV_PI, SQRT1_2, QUARTER_PI, abs, asin, atan, cos, sqrt, tan;

        INV_PI     = 1.0 / Math.PI;
        SQRT1_2    = Math.SQRT1_2;
        QUARTER_PI = 0.25 * Math.PI;

        abs  = Math.abs;
        asin = Math.asin;
        atan = Math.atan;
        cos  = Math.cos;
        sqrt = Math.sqrt;
        tan  = Math.tan;

        return function(polygon) {
          var a, area, b, c, cos1, cos2, e, i, lat1, lat2, lon1, lon2, s;

          area = 0.0;

          lon1 = RADIANS * polygon[1];
          lat1 = RADIANS * polygon[0];
          cos1 = cos(lat1);

          for(i = polygon.length; i; ) {
            lon2 = lon1;
            lat2 = lat1;
            cos2 = cos1;

            lon1 = RADIANS * polygon[--i];
            lat1 = RADIANS * polygon[--i];
            cos1 = cos(lat1);

            if(lon1 !== lon2) {
              a = asin(SQRT1_2 * sqrt(
                (1.0 - cos(lat2 - lat1)) +
                  cos1 * cos2 * (1.0 - cos(lon2 - lon1))
              ));
              b = QUARTER_PI - 0.5 * lat2;
              c = QUARTER_PI - 0.5 * lat1;
              s = 0.5 * (a + b + c);

              e = abs(atan(sqrt(abs(
                tan(s) * tan(s - a) * tan(s - b) * tan(s - c)
              ))));
              if(lon2 < lon1) {
                e = -e;
              }

              area += e;
            }
          }

          return INV_PI * abs(area);
        };
      })()
    );

    exports.bounds = arity_1(
      /* A point has a very small bounding box... */
      function(point) {
        return [point[0], point[1], point[0], point[1]];
      },
      /* A box is it's own bounding box.
       * 
       * "The container cannot contain itself." "Does not every container
       * contain itself? If it did not, what would contain it?" */
      function(box) {
        return box;
      },
      /* A polygon's bounding box is straightforward to compute. */
      (function() {
        var max, min;

        max = Math.max;
        min = Math.min;

        return function(polygon) {
          var bounds, i, lat, lon;

          i = polygon.length;

          lon = polygon[--i];
          lat = polygon[--i];

          bounds = [lat, lon, lat, lon];

          while(i) {
            lon = polygon[--i];
            lat = polygon[--i];

            bounds[0] = min(bounds[0], lat);
            bounds[1] = min(bounds[1], lon);
            bounds[2] = max(bounds[2], lat);
            bounds[3] = max(bounds[3], lon);
          }

          return bounds;
        };
      })()
    );
  })();

  (function() {
    var arity_2, box_contains_shape, box_to_polygon, point_contains_shape,
        polygon_contains_point, polygon_intersects_polygon;

    arity_2 = function(
      point_point,
      point_box,
      point_polygon,
      box_point,
      box_box,
      box_polygon,
      polygon_point,
      polygon_box,
      polygon_polygon
    ) {
      return function(a, b) {
        switch((((type(a) & 3) << 2) | (type(b) & 3)) & 15) {
          case  0:
          case  1:
          case  2:
          case  3:
          case  4:
          case  8:
          case 12: throw new Error("invalid shape");

          case  5: return point_point(a, b);
          case  6: return point_box(a, b);
          case  7: return point_polygon(a, b);
          case  9: return box_point(a, b);
          case 10: return box_box(a, b);
          case 11: return box_polygon(a, b);
          case 13: return polygon_point(a, b);
          case 14: return polygon_box(a, b);
          case 15: return polygon_polygon(a, b);
        }
      };
    };

    box_to_polygon = function(box) {
      return [
        box[0], box[1],
        box[2], box[1],
        box[2], box[3],
        box[1], box[3]
      ];
    };

    point_contains_shape = function(point, shape) {
      var i;

      for(i = shape.length; i; ) {
        if(point[1] !== shape[--i] || point[0] !== shape[--i]) {
          return false;
        }
      }

      return true;
    };

    box_contains_shape = function(box, shape) {
      var i, value;

      for(i = shape.length; i; ) {
        value = shape[--i];
        if(value < box[1] || value > box[3]) {
          return false;
        }

        value = shape[--i];
        if(value < box[0] || value > box[2]) {
          return false;
        }
      }

      return true;
    };

    /* A point and a polygon overlap if the point is within the polygon. See:
     * http://paulbourke.net/geometry/polygonmesh/#insidepoly */
    polygon_contains_point = function(polygon, point) {
      var contains, i, lat, lat1, lat2, lon, lon1, lon2;

      contains = false;

      lat = point[0];
      lon = point[1];

      lon1 = polygon[1];
      lat1 = polygon[0];

      for(i = polygon.length; i; ) {
        lon2 = lon1;
        lat2 = lat1;

        lon1 = polygon[--i];
        lat1 = polygon[--i];

        if(((lon1 <= lon && lon < lon2) || (lon2 <= lon && lon < lon1)) &&
           (lat < (lat2 - lat1) * (lon - lon1) / (lon2 - lon1) + lat1)) {
          contains = !contains;
        }
      }

      return contains;
    };

    /* Two polygons intersect if any of the lines of one of them intersects the
     * other polygon. */
    polygon_intersects_polygon = function(a, b) {
      var alat1, alat2, alon1, alon2, blat1, blat2, blon1, blon2, i, j;

      alon1 = a[1];
      alat1 = a[0];

      for(i = a.length; i; ) {
        alon2 = alon1;
        alat2 = alat1;
        alon1 = a[--i];
        alat1 = a[--i];

        blon1 = b[1];
        blat1 = b[0];

        for(j = b.length; j; ) {
          blon2 = blon1;
          blat2 = blat1;
          blon1 = b[--j];
          blat1 = b[--j];

          if(((blon1 - alon1) * (alat2 - alat1) >
                (blat1 - alat1) * (alon2 - alon1)) !==
             ((blon2 - alon1) * (alat2 - alat1) >
                (blat2 - alat1) * (alon2 - alon1)) &&
             ((alon1 - blon1) * (blat2 - blat1) >
                (alat1 - blat1) * (blon2 - blon1)) !==
             ((alon2 - blon1) * (blat2 - blat1) >
                (alat2 - blat1) * (blon2 - blon1))) {
            return true;
          }
        }
      }

      return false;
    };

    (function() {
      var arity_2_commutative, polygon_overlaps_polygon;

      arity_2_commutative = function(
        point_point,
        box_point,
        box_box,
        polygon_point,
        polygon_box,
        polygon_polygon
      ) {
        return arity_2(
          point_point,
          function(point, box) {
            return box_point(box, point);
          },
          function(point, polygon) {
            return polygon_point(polygon, point);
          },
          box_point,
          box_box,
          function(box, polygon) {
            return polygon_box(polygon, box);
          },
          polygon_point,
          polygon_box,
          polygon_polygon
        );
      };

      polygon_overlaps_polygon = function(a, b) {
        return polygon_contains_point(a, b) ||
               polygon_contains_point(b, a) ||
               polygon_intersects_polygon(a, b);
      };

      exports.overlaps = arity_2_commutative(
        point_contains_shape,
        box_contains_shape,
        function(a, b) {
          return a[0] <= b[2] && a[1] <= b[3] && a[2] >= b[0] && a[3] >= b[1];
        },
        polygon_contains_point,
        function(polygon, box) {
          return polygon_overlaps_polygon(polygon, box_to_polygon(box));
        },
        polygon_overlaps_polygon
      );
    })();

    (function() {
      var polygon_contains_polygon;

      polygon_contains_polygon = function(a, b) {
        return polygon_contains_point(a, b) &&
               !polygon_intersects_polygon(a, b);
      };

      export.contains = arity_2(
        point_contains_shape,
        point_contains_shape,
        point_contains_shape,
        box_contains_shape,
        box_contains_shape,
        box_contains_shape,
        polygon_contains_point,
        function(polygon, box) {
          return polygon_contains_polygon(polygon, box_to_polygon(box));
        },
        polygon_contains_polygon
      );
    })();
  })();
})();
