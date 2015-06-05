(function() {
  "use strict";
  var RADIANS, arity_1, arity_2_commutative, line_intersects_line,
      polygon_intersects_line, polygon_intersects_polygon,
      polygon_overlaps_box, polygon_overlaps_polygon, type;

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

  arity_1 = function(point, box, polygon) {
    return function(shape) {
      switch(type(shape) & 3) {
        case 0:
          throw new TypeError("invalid shape");

        case 1: return point(shape);
        case 2: return box(shape);
        case 3: return polygon(shape);
      }
    };
  };

  arity_2_commutative = function(
    point_point,
    box_point,
    box_box,
    polygon_point,
    polygon_box,
    polygon_polygon
  ) {
    return function(a, b) {
      switch((((type(b) & 3) << 2) | (type(a) & 3)) & 15) {
        case  0:
        case  1:
        case  2:
        case  3:
        case  4:
        case  8:
        case 12:
          throw new Error("invalid shape");

        case  5: return point_point(a, b);
        case  6: return box_point(a, b);
        case  7: return polygon_point(a, b);
        case  9: return box_point(b, a);
        case 10: return box_box(a, b);
        case 11: return polygon_box(a, b);
        case 13: return polygon_point(b, a);
        case 14: return polygon_box(b, a);
        case 15: return polygon_polygon(a, b);
      }
    };
  };

  /* A line intersects a polygon if it intersects any of its line segments. */
  polygon_intersects_line = function(polygon, line) {
    var segment, i;

    segment[0] = polygon[0];
    segment[1] = polygon[1];

    for(i = polygon.length; i; ) {
      segment[3] = segment[1];
      segment[2] = segment[0];
      segment[1] = polygon[--i];
      segment[0] = polygon[--i];

      if(line_intersects_line(line, segment)) {
        return true;
      }
    }

    return false;
  };

  /* Two polygons intersect if any of the lines of one of them intersects the
   * other polygon. */
  polygon_intersects_polygon = function(a, b) {
    var segment, i;

    segment[0] = a[0];
    segment[1] = a[1];

    for(i = a.length; i; ) {
      segment[3] = segment[1];
      segment[2] = segment[0];
      segment[1] = a[--i];
      segment[0] = a[--i];

      if(polygon_intersects_line(b, segment)) {
        return true;
      }
    }

    return false;
  };

  /* This is just a fancy hack that tests the winding of the points to
   * determine which side of each line the points are on. */
  line_intersects_line = function(a, b) {
    var alat, alon, blat, blon;

    alat = a[2] - a[0];
    alon = a[3] - a[1];
    blat = b[2] - b[0];
    blon = b[3] - b[1];

    return (
      ((b[1] - a[1]) * alat > (b[0] - a[0]) * alon) !==
      ((b[3] - a[1]) * alat > (b[2] - a[0]) * alon) &&
      ((a[1] - b[1]) * blat > (a[0] - b[0]) * blon) !==
      ((a[3] - b[1]) * blat > (a[2] - b[0]) * blon)
    );
  };

  polygon_overlaps_box = function(polygon, box) {
    return polygon_overlaps_polygon(polygon, [
      box[0], box[1],
      box[2], box[1],
      box[2], box[3],
      box[0], box[3]
    ]);
  };

  polygon_overlaps_polygon = function(a, b) {
    return polygon_intersects_polygon(a, b) ||
           polygon_contains_point(a, b) ||
           polygon_contains_point(b, a);
  };

  /* Return the area of a shape as a percentage of the entire globe's area. */
  exports.area = arity_1(
    /* A point has no area. Euclid's Elements, Book 1, Definition 1. */
    function(point) {
      return 0.0;
    },
    /* The area of a quadrangle is the intersection of a lune and a zone. A
     * lune's area is just the difference in longitudes divided by 360 degrees
     * (that is, the percentage of the globe they bound). A zone's area is more
     * complex, see: http://mathworld.wolfram.com/Zone.html */
    (function() {
      var INV_720;

      INV_720 = 1.0 / 720.0;

      return function(box) {
        return INV_720 *
               (box[3] - box[1]) *
               (Math.sin(RADIANS * box[2]) -
                 Math.sin(RADIANS * box[0]));
      }
    })(),
    /* The area of a spherical polygon is actually fairly complex. The
     * below algorithm is from Graphics Gems IV, "Computing the Area of a
     * Spherical Polygon," Robert D. Miller.
     * 
     * https://web.archive.org/web/20120302213241/
     *   http://tog.acm.org/resources/GraphicsGems/gemsiv/sph_poly.c */
    function(polygon) {
      var a, area, b, c, cos1, cos2, e, i, lat1, lat2, lon1, lon2, s;

      area = 0.0;

      lon1 = RADIANS * polygon[1];
      lat1 = RADIANS * polygon[0];
      cos1 = Math.cos(lat1);

      for(i = polygon.length; i; ) {
        lon2 = lon1;
        lat2 = lat1;
        cos2 = cos1;

        lon1 = RADIANS * polygon[--i];
        lat1 = RADIANS * polygon[--i];
        cos1 = Math.cos(lat1);

        if(lon1 !== lon2) {
          a = Math.asin(Math.SQRT1_2 * Math.sqrt((1.0 - Math.cos(lat2 - lat1)) + cos1 * cos2 * (1.0 - Math.cos(lon2 - lon1))));
          b = 0.25 * Math.PI - 0.5 * lat2;
          c = 0.25 * Math.PI - 0.5 * lat1;
          s = 0.5 * (a + b + c);

          e = Math.abs(Math.atan(Math.sqrt(Math.abs(Math.tan(s) * Math.tan(s - a) * Math.tan(s - b) * Math.tan(s - c)))));
          if(lon2 < lon1) {
            e = -e;
          }

          area += e;
        }
      }

      return Math.abs(area) / Math.PI;
    }
  );

  exports.bounds = arity_1(
    /* A point has a very small bounding box... */
    function(point) {
      return [point[0], point[1], point[0], point[1]];
    },
    /* A box is it's own bounding box.
     * 
     * "The container cannot contain itself." "Does not every container contain
     * itself? If it did not, what would contain it?" */
    function(box) {
      return box;
    },
    /* A polygon's bounding box is straightforward to compute. */
    function(polygon) {
      var bounds, i, lat, lon;

      i = polygon.length;

      lon = polygon[--i];
      lat = polygon[--i];

      bounds = [lat, lon, lat, lon];

      while(i) {
        lon = polygon[--i];
        lat = polygon[--i];

        bounds[0] = Math.min(bounds[0], lat);
        bounds[1] = Math.min(bounds[1], lon);
        bounds[2] = Math.max(bounds[2], lat);
        bounds[3] = Math.max(bounds[3], lon);
      }

      return bounds;
    }
  );

  exports.overlaps = arity_2_commutative(
    /* Two points overlap if they are exactly equal. */
    function(a, b) {
      return a[0] === b[0] && a[1] === b[1];
    },
    /* A point and a box overlap if the point is within the box. */
    function(box, point) {
      return box[0] <= point[0] && box[1] <= point[1] &&
             box[2] >= point[0] && box[3] >= point[1];
    },
    /* Computing whether two boxes overlap is straightforward. */
    function(a, b) {
      return a[0] <= b[2] && a[1] <= b[3] && a[2] >= b[0] && a[3] >= b[1];
    },
    /* A point and a polygon overlap if the point is within the polygon. See:
     * http://paulbourke.net/geometry/polygonmesh/#insidepoly */
    function(polygon, point) {
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
    },
    polygon_overlaps_box,
    polygon_overlaps_polygon
  );
})();
