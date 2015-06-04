shape
=====

A collection of utility functions for geographical regions:

*   `area(shape)`: returns the geographical area of a shape, as a percentage of
    the planet's surface area.
*   `bounds(shape)`: returns the bounding quadrangle of a shape (which is,
    itself, a shape). (This is useful because most functions are much faster
    for a quadrangle than they are for a polygon.)
*   `overlaps(shape1,shape2)`: returns a boolean representing whether or not
    two polygons overlap each other. (That is, whether they have at least a
    point in common.)

A *shape* is an `Array` of number pairs, representing the latitude and
longitude of a point on a planet's surface. The length of the array affects the
how the library interprets the shape:

*   An array of length 2 is a point (in the Euclidean sense).
*   An array of length 4 is a quadrangle bounded by the latitudes and
    longitudes of two points. The latitude and longitude of the first point are
    assumed to be less than the latitude and longitude of the second.
*   An array of length 6 or more is a polygon bounded the points in order. No
    particular winding order is assumed, though it is assumed that the polygon
    is closed: that is, that the first and last points are connected by an
    edge. (Said another way, one does not need to manually "close" a polygon by
    specifying the first point at both the beginning and end of the polygon.)
