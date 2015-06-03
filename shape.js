(function() {
  "use strict";
  var arity_1, arity_2_commutative, box_area, box_bounds, box_contains_point,
      box_overlaps_box, line_intersects_line, point_area, point_bounds,
      point_equals_point, polygon_area, polygon_bounds, polygon_contains_point,
      polygon_intersects_line, polygon_intersects_polygon,
      polygon_overlaps_box, polygon_overlaps_polygon;

  arity_1 = function(point, box, polygon) {
    return function(vertices) {
      if(Array.isArray(vertices)) {
        if(vertices.length === 2) {
          return point(vertices);
        }

        else if(vertices.length === 4) {
          return box(vertices);
        }

        else if(vertices.length >= 6 && !(vertices.length & 1)) {
          return polygon(vertices);
        }
      }

      throw new Error("not a valid shape");
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
      if(Array.isArray(a) && Array.isArray(b)) {
        if(a.length === 2) {
          if(b.length === 2) {
            return point_point(a, b);
          }

          else if(b.length === 4) {
            return box_point(b, a);
          }

          else if(b.length >= 6 && !(b.length & 1)) {
            return polygon_point(b, a);
          }
        }

        else if(a.length === 4) {
          if(b.length === 2) {
            return box_point(a, b);
          }

          else if(b.length === 4) {
            return box_box(a, b);
          }

          else if(b.length >= 6 && !(b.length & 1)) {
            return polygon_box(b, a);
          }
        }

        else if(a.length >= 6 && !(a.length & 1)) {
          if(b.length === 2) {
            return polygon_point(a, b);
          }

          else if(b.length === 4) {
            return polygon_box(a, b);
          }

          else if(b.length >= 6 && !(b.length & 1)) {
            return polygon_polygon(a, b);
          }
        }
      }

      throw new Error("not a valid shape");
    };
  };

  /* Points have no area, dummy. Euclid said so. */
  point_area = function(point) {
    return 0.0;
  };

  /* This assumes that the earth is a sphere with a surface area of 1. */
  box_area = function(box) {
    return (1.0 / 720.0) *
           (box[3] - box[1]) *
           (Math.sin((Math.PI / 180.0) * box[2]) -
             Math.sin((Math.PI / 180.0) * box[0]));
  };

  polygon_area = function(polygon) {
    /* FIXME */
    return NaN;
  };

  /* The bounds on a point are clearly very tight. */
  point_bounds = function(point) {
    return [point[0], point[1], point[0], point[1]];
  };

  /* "The container cannot contain itself." "Does not every container contain
   * itself? If it did not, what would contain it?" */
  box_bounds = function(box) {
    return box;
  };

  polygon_bounds = function(polygon) {
    var bounds, i, lat, lon;

    bounds = [
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.NEGATIVE_INFINITY
    ];

    for(i = polygon.length; i; ) {
      lon = polygon[--i];
      lat = polygon[--i];

      bounds[0] = Math.min(bounds[0], lat);
      bounds[1] = Math.min(bounds[1], lon);
      bounds[2] = Math.max(bounds[2], lat);
      bounds[3] = Math.max(bounds[3], lon);
    }

    return bounds;
  };

  box_contains_point = function(box, point) {
    return box[0] <= point[0] && box[1] <= point[1] &&
           box[2] >= point[0] && box[3] >= point[1];
  };

  polygon_contains_point = function(polygon, point) {
    /* FIXME */
    return false;
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

  point_equals_point = function(a, b) {
    return a[0] === b[0] && a[1] === b[1];
  };

  box_overlaps_box = function(a, b) {
    return a[0] <= b[2] && a[1] <= b[3] && a[2] >= b[0] && a[3] >= b[1];
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

  module.exports = {
    area: arity_1(
      point_area,
      box_area,
      polygon_area
    ),
    bounds: arity_1(
      point_bounds,
      box_bounds,
      polygon_bounds
    ),
    overlaps: arity_2_commutative(
      point_equals_point,
      box_contains_point,
      box_overlaps_box,
      polygon_contains_point,
      polygon_overlaps_box,
      polygon_overlaps_polygon
    )
  };
})();
