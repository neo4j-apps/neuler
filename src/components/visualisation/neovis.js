import * as neo4j from 'neo4j-driver'
import * as vis from 'vis'
import { defaults } from './defaults'


export default class NeoVis {

  /**
   *
   * @constructor
   * @param {object} config - configures the visualization and Neo4j server connection
   *  {
   *    container:
   *    server_url:
   *    server_password?:
   *    server_username?:
   *    labels:
   *
   *  }
   *
   */

  constructor(config, driver) {
    console.log(config);
    console.log(defaults);

    this._config = config;
    this._encrypted = config.encrypted || defaults['neo4j']['encrypted'];
    this._trust = config.trust || defaults.neo4j.trust;
    this._driver = driver || neo4j.driver(config.server_url || defaults.neo4j.neo4jUri, neo4j.auth.basic(config.server_user || defaults.neo4j.neo4jUser, config.server_password || defaults.neo4j.neo4jPassword), {encrypted: this._encrypted, trust: this._trust});
    this._query =   config.initial_cypher || defaults.neo4j.initialQuery;
    this._nodes = {};
    this._edges = {};
    this._data = {};
    this._network = null;
    this._container = document.getElementById(config.container_id);

  }

  _addNode(node) {
    this._nodes[node.id] = node;
  }

  _addEdge(edge) {
    this._edges[edge.id] = edge;
  }

  /**
   * Build node object for vis from a neo4j Node
   * FIXME: use config
   * FIXME: move to private api
   * @param n
   * @returns {{}}
   */
  buildNodeVisObject(n) {

    var self = this;
    let node = {};
    let label = n.labels[0];

    let captionKey   = this._config && this._config.labels && this._config.labels[label] && this._config.labels[label]['caption'],
      sizeKey = this._config && this._config.labels && this._config.labels[label] && this._config.labels[label]['size'],
      sizeCypher = this._config && this._config.labels && this._config.labels[label] && this._config.labels[label]['sizeCypher'],
      communityKey = this._config && this._config.labels && this._config.labels[label] && this._config.labels[label]['community'];

    node['id'] = n.identity.toInt();

    // node size

    if (sizeCypher) {
      // use a cypher statement to determine the size of the node
      // the cypher statement will be passed a parameter {id} with the value
      // of the internal node id

      let session = this._driver.session();
      session.run(sizeCypher, {id: neo4j.int(node['id'])})
        .then(function(result) {
          result.records.forEach(function(record) {
            record.forEach(function(v,k,r) {
              if (typeof v === "number") {
                self._addNode({id: node['id'], value: v});
              } else if (neo4j.isInt(v)) {
                self._addNode({id: node['id'], value: v.toNumber()})
              }
            })
          })
        })


    } else if (typeof sizeKey === "number") {
      node['value'] = sizeKey;
    } else {

      let sizeProp = n.properties[sizeKey];

      if (sizeProp && typeof sizeProp === "number") {
        // propety value is a number, OK to use
        node['value'] = sizeProp;
      } else if (sizeProp && typeof sizeProp === "object" && neo4j.isInt(sizeProp)) {
        // property value might be a Neo4j Integer, check if we can call toNumber on it:
        if (sizeProp.inSafeRange()) {
          node['value'] = sizeProp.toNumber();
        } else {
          // couldn't convert to Number, use default
          node['value'] = 1.0;
        }
      } else {
        node['value'] = 1.0;
      }
    }

    // node caption
    if (typeof captionKey === "function") {
      node['label'] = captionKey(n);
    }
    else {
      node['label'] = n.properties[captionKey] || label || "";
    }

    // community
    // behavior: color by value of community property (if set in config), then color by label
    if (!communityKey) {
      node['group'] = label;
    } else {
      try {
        if (n.properties[communityKey]) {
          node['group'] = n.properties[communityKey].toNumber() || label || 0;  // FIXME: cast to Integer

        }
        else {
          node['group'] = 0;
        }

      } catch(e) {
        node['group'] = 0;
      }


    }


    // set all properties as tooltip
    node['title'] = "";
    for (let key in n.properties) {
      node['title'] += "<strong>" + key + ":</strong>" + " " + n.properties[key] + "<br>";
    }
    return node;
  }

  /**
   * Build edge object for vis from a neo4j Relationship
   * @param r
   * @returns {{}}
   */
  buildEdgeVisObject(r) {

    let weightKey = this._config && this._config.relationships && this._config.relationships[r.type] && this._config.relationships[r.type]['thickness'],
      captionKey = this._config && this._config.relationships && this._config.relationships[r.type] && this._config.relationships[r.type]['caption'];

    let edge = {};
    edge['id'] = r.identity.toInt();
    edge['from'] = r.start.toInt();
    edge['to'] = r.end.toInt();

    // hover tooltip. show all properties in the format <strong>key:</strong> value
    edge['title'] = "";
    for (let key in r.properties) {
      edge['title'] += "<strong>" + key + ":</strong>" + " " + r.properties[key] + "<br>";
    }

    // set relationship thickness
    if (weightKey && typeof weightKey === "string") {
      edge['value'] = r.properties[weightKey] * 0.2;
    } else if (weightKey && typeof weightKey === "number") {
      edge['value'] = weightKey * 0.2;
    } else {
      edge['value'] = 0.2;
    }

    // set caption

    edge['label'] = "";

   /* if (typeof captionKey === "boolean") {
      if (!captionKey) {
        edge['label'] = "";
      } else {
        edge['label'] = r.type;
      }
    } else if (captionKey && typeof captionKey === "string") {
      edge['label']  = r.properties[captionKey] || "";
    } else {
      edge['label'] = r.type;
    }*/

    return edge;
  }

  // public API

  render(onDone) {

    // connect to Neo4j instance
    // run query

    let self = this;

    let session = this._driver.session();
    session
      .run(this._query, {limit: 30})
      .subscribe({
        onNext: function (record) {

          record.forEach(function(v, k, r) {
            if (v instanceof neo4j.types.Node) {
              let node = self.buildNodeVisObject(v);

              try {
                self._addNode(node);
              } catch(e) {
                console.log(e);
              }

            }
            else if (v instanceof neo4j.types.Relationship) {

              let edge = self.buildEdgeVisObject(v);

              try {
                self._addEdge(edge);
              } catch(e) {
                console.log(e);
              }

            }
            else if (v instanceof neo4j.types.Path) {
              let n1 = self.buildNodeVisObject(v.start);
              let n2 = self.buildNodeVisObject(v.end);

              self._addNode(n1);
              self._addNode(n2);

              v.segments.forEach((obj) => {

                self._addNode(self.buildNodeVisObject(obj.start));
                self._addNode(self.buildNodeVisObject(obj.end))
                self._addEdge(self.buildEdgeVisObject(obj.relationship))
              });

            }
            else if (Array.isArray(v)) {
              v.forEach(function(obj) {
                if (v instanceof neo4j.types.Node) {
                  let node = self.buildNodeVisObject(obj);

                  try {
                    self._addNode(node);
                  } catch(e) {
                    console.log(e);
                  }
                }
                else if (v instanceof neo4j.types.Relationship) {
                  let edge = self.buildEdgeVisObject(obj);

                  try {
                    self._addEdge(edge);
                  } catch(e) {
                    console.log(e);
                  }
                }
              });
            }

          })
        },
        onCompleted: function () {
          session.close();
          self._options = {
            nodes: {
              shape: 'dot',
              font: {
                size: 26,
                strokeWidth: 7
              },
              scaling: {
                label: {
                  enabled: true
                }
              }
            },
            edges: {
              arrows: {
                to: {enabled: self._config.arrows || false } // FIXME: handle default value
              },
              length: 200
            },
            layout: {
              improvedLayout: false,
              hierarchical: {
                enabled: self._config.hierarchical || false,
                sortMethod: self._config.hierarchical_sort_method || "hubsize"

              }
            },
            physics: { // TODO: adaptive physics settings based on size of graph rendered
              // enabled: true,
              // timestep: 0.5,
              // stabilization: {
              //     iterations: 10
              // }

              adaptiveTimestep: true,
              // barnesHut: {
              //     gravitationalConstant: -8000,
              //     springConstant: 0.04,
              //     springLength: 95
              // },
              stabilization: {
                iterations: 200,
                fit: true
              }

            }
          };

          var container = self._container;
          self._data = {
            "nodes": new vis.DataSet(Object.values(self._nodes)),
            "edges": new vis.DataSet(Object.values(self._edges))

          }

          console.log("NODES", self._data.nodes);
          console.log(self._data.edges);

          // Create duplicate node for any self reference relationships
          // NOTE: Is this only useful for data model type data
          // self._data.edges = self._data.edges.map(
          //     function (item) {
          //          if (item.from == item.to) {
          //             var newNode = self._data.nodes.get(item.from)
          //             delete newNode.id;
          //             var newNodeIds = self._data.nodes.add(newNode);
          //             console.log("Adding new node and changing self-ref to node: " + item.to);
          //             item.to = newNodeIds[0];
          //          }
          //          return item;
          //     }
          // );

          self._network = new vis.Network(container, self._data, self._options);

          self._network.on("afterDrawing", () => {
            console.log("afterDrawing");
            onDone && onDone()
          })

          console.log("completed");
          setTimeout(() => { self._network.stopSimulation(); }, 10000);

        },
        onError: function (error) {
          console.log(error);
        }

      })
  };

  /**
   * Clear the data for the visualization
   */
  clearNetwork() {
    this._nodes = {}
    this._edges = {};
    this._network.setData([]);
  }


  /**
   * Reset the config object and reload data
   * @param config
   */
  reinit(config) {

  };

  /**
   * Fetch live data form the server and reload the visualization
   */
  reload() {
    this.clearNetwork();
    this.render();
  };

  setSize(width, height) {
    this._network.setSize(width, height)
    this._network.redraw()
  }

  setContainerId (containerId) {
    this._container = document.getElementById(containerId);
    this._network = new vis.Network(this._container, this._data, this._options);
    setTimeout(() => { this._network.stopSimulation(); }, 10000);
    console.log('container set')
  }

  redraw() {
    this._network.redraw()
  }

  /**
   * Stabilize the visuzliation
   */
  stabilize() {
    this._network.stopSimulation();
    console.log("Calling stopSimulation");
  }

  /**
   * Execute an arbitrary Cypher query and re-render the visualization
   * @param query
   */
  renderWithCypher(query) {

    //self._config.initial_cypher = query;

    this.clearNetwork();
    this._query = query;
    this.render();

  };

  // configure exports based on environment (ie Node.js or browser)
  //if (typeof exports === 'object') {
  //    module.exports = NeoVis;
  //} else {
  //    define (function () {return NeoVis;})
  //}

}