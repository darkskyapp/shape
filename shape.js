(function() {
  "use strict";
  var arity_1, arity_2_commutative, box_area, box_bounds, box_contains_point,
      box_overlaps_box, line_intersects_line, point_area, point_bounds,
      point_equals_point, polygon_area, polygon_bounds, polygon_contains_point,
      polygon_intersects_line, polygon_intersects_polygon,
      polygon_overlaps_box, polygon_overlaps_polygon, spherical_angle, type;

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

  /* Returns the spherical angle between line `a` and line `b`. */
  spherical_angle = function(a, b) {
    var ax, ay, az, bx, by, bz, lat, lon, ux, uy, uz, vx, vy, vz;

    /* Find the normal of the hyperplane defined by `a`. */
    lat = a[0] * Math.PI / 180.0;
    lon = a[1] * Math.PI / 180.0;
    ux = Math.cos(lat) * Math.cos(lon);
    uy = Math.sin(lat);
    uz = Math.cos(lat) * Math.sin(lon);

    lat = a[2] * Math.PI / 180.0;
    lon = a[3] * Math.PI / 180.0;
    vx = Math.cos(lat) * Math.cos(lon);
    vy = Math.sin(lat);
    vz = Math.cos(lat) * Math.sin(lon);

    ax = uy * vz - uz * vy;
    ay = uz * vx - ux * vz;
    az = ux * vy - uy * vx;

    /* Find the normal of the hyperplane defined by `b`. */
    lat = b[0] * Math.PI / 180.0;
    lon = b[1] * Math.PI / 180.0;
    ux = Math.cos(lat) * Math.cos(lon);
    uy = Math.sin(lat);
    uz = Math.cos(lat) * Math.sin(lon);

    lat = b[2] * Math.PI / 180.0;
    lon = b[3] * Math.PI / 180.0;
    vx = Math.cos(lat) * Math.cos(lon);
    vy = Math.sin(lat);
    vz = Math.cos(lat) * Math.sin(lon);

    bx = uy * vz - uz * vy;
    by = uz * vx - ux * vz;
    bz = ux * vy - uy * vx;

    /* cos(angle) = dot(a, b) */
    return Math.acos(ax * bx + ay * by + az * bz);
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

  /* http://mathworld.wolfram.com/SphericalPolygon.html */
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

  exports.area = arity_1(
    point_area,
    box_area,
    polygon_area
  );

  exports.bounds = arity_1(
    point_bounds,
    box_bounds,
    polygon_bounds
  );

  exports.overlaps = arity_2_commutative(
    point_equals_point,
    box_contains_point,
    box_overlaps_box,
    polygon_contains_point,
    polygon_overlaps_box,
    polygon_overlaps_polygon
  );
})();
