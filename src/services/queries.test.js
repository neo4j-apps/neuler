import {centralityParams, filterParameters, onePoint5PathFindingParams, pre1Point5PathFindingParams} from './queries';

test('only keep allowed properties', () => {
  const raw = {mark: [1,2,3], irfan: [4,5,6], michael: 2}
  const allowed = ["irfan", "michael"]
  expect(filterParameters(raw, allowed)).toEqual({irfan: [4,5,6], michael: 2})
});

test('nodeProjection always required', () => {
  const params = centralityParams({requiredProperties:[], label: "Foo"})
  expect(params.config).toEqual({nodeProjection: "Foo", relationshipProjection: {relType: {type: "*", orientation: "NATURAL"}}})
});

test('relationshipProjection defaults to NATURAL', () => {
  const params = centralityParams({requiredProperties:[], label: "Foo", relationshipType: "BAR"})
  expect(params.config).toEqual({nodeProjection: "Foo", relationshipProjection: {relType: {type: "BAR", orientation: "NATURAL", properties: {}}}})
});

test('relationshipProjection uses direction', () => {
  const params = centralityParams({requiredProperties:[], label: "Foo", relationshipType: "BAR", direction: "Reverse"})
  expect(params.config).toEqual({nodeProjection: "Foo", relationshipProjection: {relType: {type: "BAR", orientation: "REVERSE", properties: {}}}})
});

test('relationshipProjection has optional weight property', () => {
  const params = centralityParams({
    requiredProperties:[], label: "Foo", relationshipType: "BAR", direction: "Reverse", weightProperty: "distance"
  })
  expect(params.config).toEqual({nodeProjection: "Foo", relationshipProjection: {
      relType: {
      type: "BAR",
      orientation: "REVERSE",
      properties: {
        distance: {property: "distance", defaultValue: null}
      }
    }
  }
  })
});

test('(1.5) path finding have optional node lat/long properties', () => {
  const params = onePoint5PathFindingParams({
    requiredProperties:["latitudeProperty", "longitudeProperty"],
    label: "Foo", relationshipType: "BAR", direction: "Reverse",
    weightProperty: "distance", latitudeProperty: "foo1", longitudeProperty: "foo2"
  })
  expect(params.config).toEqual({
    nodeProjection: {
      nodeLabel: {
        label: "Foo",
        properties: ["foo1", "foo2"]
      }
    },
    relationshipProjection: {
      relType: {
        type: "BAR",
        orientation: "REVERSE",
        properties: {
          distance: {property: "distance", defaultValue: null},
        }
      }
    },
    latitudeProperty: "foo1",
    longitudeProperty: "foo2",
  })
});

test('(pre 1.5) path finding have optional node lat/long properties', () => {
  const params = pre1Point5PathFindingParams({
    requiredProperties:["propertyKeyLat", "propertyKeyLon"],
    label: "Foo", relationshipType: "BAR", direction: "Reverse",
    weightProperty: "distance", propertyKeyLat: "foo1", propertyKeyLon: "foo2"
  })
  expect(params.config).toEqual({
    nodeProjection: {
      nodeLabel: {
        label: "Foo",
        properties: ["foo1", "foo2"]
      }
    },
    relationshipProjection: {
      relType: {
        type: "BAR",
        orientation: "REVERSE",
        properties: {
          distance: {property: "distance", defaultValue: null},
        }
      }
    },
    propertyKeyLat: "foo1",
    propertyKeyLon: "foo2",
  })
});


test('relationshipProjection has optional weight property even if it is an empty string', () => {
  const params = centralityParams({requiredProperties:[], label: "Foo", relationshipType: "BAR", direction: "Reverse", weightProperty: ""})
  expect(params.config).toEqual({nodeProjection: "Foo", relationshipProjection: {
      relType: {
        type: "BAR",
        orientation: "REVERSE",
        properties: {
         }
      }
    }
  })
});

test('relationshipProjection of * = all', () => {
  const params = centralityParams({requiredProperties:[], label: "Foo", relationshipType: "*", direction: "Reverse"})
  expect(params.config).toEqual({nodeProjection: "Foo", relationshipProjection: {relType: {type: "*", orientation: "REVERSE", properties: {}}}})
});

test('relationshipProjection removes spaces', () => {
  const params = centralityParams({requiredProperties:[], label: "Foo", relationshipType: "BLAH BLAH", direction: "Reverse"})
  expect(params.config).toEqual({nodeProjection: "Foo", relationshipProjection: {relType: {type: "BLAH BLAH", orientation: "REVERSE", properties: {}}}})
});

test('relationshipProjection removes hyphens', () => {
  const params = centralityParams({requiredProperties:[], label: "Foo", relationshipType: "BLAH-BLAH", direction: "Reverse"})
  expect(params.config).toEqual({nodeProjection: "Foo", relationshipProjection: {relType: {type: "BLAH-BLAH", orientation: "REVERSE", properties: {}}}})
});


test('writeProperty if persist is true', () => {
  const params = centralityParams({requiredProperties:["writeProperty"], persist: true, writeProperty: "foo"})
  const config = params.config;
  expect(config.writeProperty).toEqual("foo")
});


test('no writeProperty if persist is false', () => {
  const params = centralityParams({requiredProperties:["writeProperty"], persist: false, writeProperty: "foo"})
  const config = params.config;
  expect(config.writeProperty).toEqual(undefined)
});
