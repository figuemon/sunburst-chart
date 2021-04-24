'use strict';

var d3Selection = require('d3-selection');
var d3Scale = require('d3-scale');
var d3Hierarchy = require('d3-hierarchy');
var d3Shape = require('d3-shape');
var d3Path = require('d3-path');
var d3Interpolate = require('d3-interpolate');
var d3Transition = require('d3-transition');
var Kapsule = require('kapsule');
var accessorFn = require('accessor-fn');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var Kapsule__default = /*#__PURE__*/_interopDefaultLegacy(Kapsule);
var accessorFn__default = /*#__PURE__*/_interopDefaultLegacy(accessorFn);

function styleInject(css, ref) {
  if (ref === void 0) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') {
    return;
  }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = ".sunburst-viz .slice path {\r\n  cursor: pointer;\r\n}\r\n\r\n.sunburst-viz text {\r\n  font-family: sans-serif;\r\n  font-size: 12px;\r\n  dominant-baseline: middle;\r\n  text-anchor: middle;\r\n  pointer-events: none;\r\n  fill: #222;\r\n}\r\n\r\n.sunburst-viz .text-contour {\r\n  fill: none;\r\n  stroke: white;\r\n  stroke-width: 5;\r\n  stroke-linejoin: 'round';\r\n}\r\n\r\n.sunburst-viz .main-arc {\r\n  stroke-width: 1px;\r\n  transition: opacity .4s;\r\n}\r\n\r\n.sunburst-viz .main-arc:hover {\r\n  opacity: 0.85;\r\n  transition: opacity .05s;\r\n}\r\n\r\n.sunburst-viz .hidden-arc {\r\n  fill: none;\r\n}\r\n\r\n.sunburst-viz {\r\n  position: relative;\r\n}\r\n\r\n.sunburst-tooltip {\r\n  display: none;\r\n  position: absolute;\r\n  max-width: 320px;\r\n  white-space: nowrap;\r\n  padding: 5px;\r\n  border-radius: 3px;\r\n  font: 12px sans-serif;\r\n  color: #eee;\r\n  background: rgba(0,0,0,0.65);\r\n  pointer-events: none;\r\n}\r\n\r\n.sunburst-tooltip .tooltip-title {\r\n  font-weight: bold;\r\n  text-align: center;\r\n  margin-bottom: 5px;\r\n}\r\n";
styleInject(css_248z);

var TRANSITION_DURATION = 750;
var CHAR_PX_WIDTH = 7;
var CHAR_PX_HEIGHT = 14;
var sunburst = Kapsule__default['default']({
  props: {
    width: {
      "default": window.innerWidth
    },
    height: {
      "default": window.innerHeight
    },
    data: {
      onChange: function onChange(_, state) {
        state.needsReparse = true;
      }
    },
    children: {
      "default": 'children',
      onChange: function onChange(_, state) {
        state.needsReparse = true;
      }
    },
    sort: {
      onChange: function onChange(_, state) {
        state.needsReparse = true;
      }
    },
    label: {
      "default": function _default(d) {
        return d.name;
      }
    },
    labelOrientation: {
      "default": 'auto'
    },
    // angular, radial, auto
    size: {
      "default": 'value',
      onChange: function onChange(_, state) {
        state.needsReparse = true;
      }
    },
    color: {
      "default": function _default(d) {
        return 'lightgrey';
      }
    },
    strokeColor: {
      "default": function _default(d) {
        return 'white';
      }
    },
    minSliceAngle: {
      "default": .2
    },
    maxLevels: {},
    outerColors: {
      "default": function _default(d) {
        switch (d) {
          case "added":
            return "#38B03D";

          case "splitted":
            return "#C700BA";

          case "merged":
            return "#FFA452";

          case "renamed":
            return "#1700E7";

          case "removed":
            return "#D50000";

          default:
            return "#09D3D3";
        }
      }
    },
    excludeRoot: {
      "default": false,
      onChange: function onChange(_, state) {
        state.needsReparse = true;
      }
    },
    centerRadius: {
      "default": 0.1
    },
    radiusScaleExponent: {
      "default": 0.5
    },
    // radius decreases quadratically outwards to preserve area
    showLabels: {
      "default": true
    },
    tooltipContent: {
      "default": function _default(d) {
        return '';
      },
      triggerUpdate: false
    },
    tooltipTitle: {
      "default": null,
      triggerUpdate: false
    },
    showTooltip: {
      "default": function _default(d) {
        return true;
      },
      triggerUpdate: false
    },
    focusOnNode: {
      onChange: function onChange(d, state) {
        if (d && state.initialised) {
          moveStackToFront(d.__dataNode);
        }

        function moveStackToFront(elD) {
          state.svg.selectAll('.slice').filter(function (d) {
            return d === elD;
          }).each(function (d) {
            this.parentNode.appendChild(this);

            if (d.parent) {
              moveStackToFront(d.parent);
            }
          });
        }
      }
    },
    onClick: {
      triggerUpdate: false
    },
    onHover: {
      triggerUpdate: false
    }
  },
  methods: {
    _parseData: function _parseData(state) {
      if (state.data) {
        var hierData = d3Hierarchy.hierarchy(state.data, accessorFn__default['default'](state.children)).sum(accessorFn__default['default'](state.size));

        if (state.sort) {
          hierData.sort(state.sort);
        }

        d3Hierarchy.partition().padding(0)(hierData);

        if (state.excludeRoot) {
          // re-scale y values if excluding root
          var yScale = d3Scale.scaleLinear().domain([hierData.y1 - hierData.y0, 1]);
          hierData.descendants().forEach(function (d) {
            d.y0 = yScale(d.y0);
            d.y1 = yScale(d.y1);
          });
        }

        hierData.descendants().forEach(function (d, i) {
          d.id = i; // Mark each node with a unique ID

          d.data.__dataNode = d; // Dual-link data nodes
        });
        state.layoutData = hierData.descendants();
      }
    }
  },
  aliases: {
    onNodeClick: 'onClick'
  },
  init: function init(domNode, state) {
    var _this = this;

    state.chartId = Math.round(Math.random() * 1e12); // Unique ID for DOM elems

    state.radiusScale = d3Scale.scalePow();
    state.angleScale = d3Scale.scaleLinear().domain([0, 10]) // For initial build-in animation
    .range([0, 2 * Math.PI]).clamp(true);
    state.originalAngleScale = d3Scale.scaleLinear().domain([0, 10]) // For initial build-in animation
    .range([0, 2 * Math.PI]).clamp(true);
    state.arc = d3Shape.arc().startAngle(function (d) {
      return state.angleScale(d.x0);
    }).endAngle(function (d) {
      return state.angleScale(d.x1);
    }).innerRadius(function (d) {
      return Math.max(0, state.radiusScale(d.y0));
    }).outerRadius(function (d) {
      return Math.max(0, state.radiusScale(d.y1));
    });
    state.outerArc = d3Shape.arc().startAngle(function (d) {
      return state.originalAngleScale(d.x0);
    }).endAngle(function (d) {
      return state.originalAngleScale(d.x1);
    }).innerRadius(function (d) {
      return Math.max(0, state.radiusScale(d.y0));
    }).outerRadius(function (d) {
      return Math.max(0, state.radiusScale(d.y1));
    });
    var el = d3Selection.select(domNode).append('div').attr('class', 'sunburst-viz');
    state.svg = el.append('svg');
    state.canvas = state.svg.append('g'); // tooltips

    state.tooltip = el.append('div').attr('class', 'sunburst-tooltip');
    el.on('mousemove', function (ev) {
      var mousePos = d3Selection.pointer(ev);
      state.tooltip.style('left', mousePos[0] + 'px').style('top', mousePos[1] + 'px').style('transform', "translate(-".concat(mousePos[0] / state.width * 100, "%, 21px)")); // adjust horizontal position to not exceed canvas boundaries
    }); // Reset focus by clicking on canvas

    state.svg.on('click', function () {
      return (state.onClick || _this.focusOnNode)(null);
    }) // By default reset zoom when clicking on canvas
    .on('mouseover', function () {
      return state.onHover && state.onHover(null);
    });
  },
  update: function update(state) {
    var _this2 = this;

    if (state.needsReparse) {
      this._parseData();

      state.needsReparse = false;
    }

    var maxRadius = Math.min(state.width - 100, state.height - 100) / 2;
    state.radiusScale.range([maxRadius * Math.max(0, Math.min(1, state.centerRadius)), maxRadius]);
    state.radiusScaleExponent > 0 && state.radiusScale.exponent(state.radiusScaleExponent);
    var adjustHeight = state.height + 100;
    var adjustWidth = state.height + 100;
    state.svg.style('width', adjustWidth + 'px').style('height', adjustHeight + 'px').attr('viewBox', "".concat(-adjustWidth / 2, " ").concat(-adjustHeight / 2, " ").concat(adjustWidth, " ").concat(adjustHeight)); //  .startAngle(d => state.angleScale(d.x0))
    // .endAngle(d => state.angleScale(d.x1))
    // .innerRadius(d => Math.max(0, state.radiusScale(d.y0)))
    // .outerRadius(d => Math.max(0, state.radiusScale(d.y1)));

    state.outerRing = state.svg.append('g');
    var topRight = state.outerRing.append('g').style('display', 'none');
    var bottomRight = state.outerRing.append('g').style('display', 'none');
    var bottomLeft = state.outerRing.append('g').style('display', 'none');
    var topLeft = state.outerRing.append('g').style('display', 'none');

    function populateOuterRing(d) {
      topRight.style('display', 'none');
      bottomRight.style('display', 'none');
      topLeft.style('display', 'none');
      bottomLeft.style('display', 'none');

      if (d.data.changes) {
        var maxScope = Object.values(d.data.changes).reduce(function (a, b) {
          return a + b;
        });
        var keys = Object.keys(d.data.changes);
        var middle = (d.x0 + d.x1) / 2;
        var base = 0;
        var panel;

        if (middle <= 0.25) {
          topRight.style('display', 'block');
          panel = topRight;
        }

        if (middle > 0.25 && middle <= 0.5) {
          base = 2.5;
          bottomRight.style('display', 'block');
          panel = bottomRight;
        }

        if (middle > 0.5 && middle <= 0.75) {
          base = 5;
          bottomLeft.style('display', 'block');
          panel = bottomLeft;
        }

        if (middle > 0.75) {
          base = 7.5;
          topLeft.style('display', 'block');
          panel = topLeft;
        }

        panel.html("");
        keys.forEach(function (element) {
          var percentage = d.data.changes[element] / maxScope;
          var distance = 2.5 * percentage;
          var displayP = Number(percentage * 100).toFixed(1);
          var arc = {
            x0: base,
            x1: base + distance,
            y0: 1.1,
            y1: 1.3
          };
          panel.append('path').attr('d', state.outerArc(arc)).attr('id', element + d.data.name).attr('fill', state.outerColors(element)).style('display', 'block');

          if (percentage > 0.04) {
            panel.append('text').attr("class", "text-contour").attr("transform", function (d) {
              return "translate(" + state.outerArc.centroid(arc) + ")rotate(" + computeTextRotation(arc) + ")";
            }) // <-- 3
            .attr("dx", "-1") // <-- 4
            .attr("dy", ".5em") // <-- 5
            .text(function (d) {
              return displayP + "%";
            });
            panel.append('text').attr("class", "text-stroke").attr("transform", function (d) {
              return "translate(" + state.outerArc.centroid(arc) + ")rotate(" + computeTextRotation(arc) + ")";
            }) // <-- 3
            .attr("dx", "-1") // <-- 4
            .attr("dy", ".5em") // <-- 5
            .text(function (d) {
              return displayP + "%";
            });
          }

          base = base + distance;
        });
      }
    }

    if (!state.layoutData) return;
    var focusD = state.focusOnNode && state.focusOnNode.__dataNode.y0 >= 0 && state.focusOnNode.__dataNode || {
      x0: 0,
      x1: 1,
      y0: 0,
      y1: 1
    };
    var slice = state.canvas.selectAll('.slice').data(state.layoutData.filter(function (d) {
      return (// Show only slices with a large enough angle and within the max levels
        d.x1 >= focusD.x0 && d.x0 <= focusD.x1 && (d.x1 - d.x0) / (focusD.x1 - focusD.x0) > state.minSliceAngle / 360 && (!state.maxLevels || d.depth - (focusD.depth || (state.excludeRoot ? 1 : 0)) < state.maxLevels) && (d.y0 >= 0 || focusD.parent)
      );
    } // hide negative layers on top level
    ), function (d) {
      return d.id;
    });
    var nameOf = accessorFn__default['default'](state.label);
    var colorOf = accessorFn__default['default'](state.color);
    var strokeColorOf = accessorFn__default['default'](state.strokeColor);
    accessorFn__default['default'](state.outerColors);
    var transition = d3Transition.transition().duration(TRANSITION_DURATION);
    var levelYDelta = state.layoutData[0].y1 - state.layoutData[0].y0;
    var maxY = Math.min(1, focusD.y0 + levelYDelta * Math.min(focusD.hasOwnProperty('height') ? focusD.height + 1 : Infinity, state.maxLevels || Infinity)); // Apply zoom

    state.svg.transition(transition).tween('scale', function () {
      var xd = d3Interpolate.interpolate(state.angleScale.domain(), [focusD.x0, focusD.x1]);
      var yd = d3Interpolate.interpolate(state.radiusScale.domain(), [focusD.y0, maxY]);
      return function (t) {
        state.angleScale.domain(xd(t));
        state.radiusScale.domain(yd(t));
      };
    }); // Exiting

    var oldSlice = slice.exit().transition(transition).style('opacity', 0).remove();
    oldSlice.select('path.main-arc').attrTween('d', function (d) {
      return function () {
        return state.arc(d);
      };
    });
    oldSlice.select('path.hidden-arc').attrTween('d', function (d) {
      return function () {
        return middleArcLine(d);
      };
    }); // Entering

    var newSlice = slice.enter().append('g').attr('class', 'slice').style('opacity', 0).on('click', function (ev, d) {
      ev.stopPropagation();

      (state.onClick || _this2.focusOnNode)(d.data);
    }).on('mouseover', function (ev, d) {
      ev.stopPropagation();
      state.onHover && state.onHover(d.data);
      state.tooltip.style('display', state.showTooltip(d.data, d) ? 'inline' : 'none');
      populateOuterRing(d);
      state.tooltip.html("<div class=\"tooltip-title\">".concat(state.tooltipTitle ? state.tooltipTitle(d.data, d) : getNodeStack(d).slice(state.excludeRoot ? 1 : 0).map(function (d) {
        return nameOf(d.data);
      }).join(' &rarr; '), "</div>").concat(state.tooltipContent(d.data, d)));
    }).on('mouseout', function () {
      state.tooltip.style('display', 'none');
    });
    newSlice.append('path').attr('class', 'main-arc').style('stroke', function (d) {
      return strokeColorOf(d.data, d.parent);
    }).style('fill', function (d) {
      return colorOf(d.data, d.parent);
    });
    newSlice.append('path').attr('class', 'hidden-arc').attr('id', function (d) {
      return "hidden-arc-".concat(state.chartId, "-").concat(d.id);
    }); // angular label

    var angularLabel = newSlice.append('text').attr('class', 'angular-label'); // Add white contour

    angularLabel.append('textPath').attr('class', 'text-contour').attr('startOffset', '50%').attr('xlink:href', function (d) {
      return "#hidden-arc-".concat(state.chartId, "-").concat(d.id);
    });
    angularLabel.append('textPath').attr('class', 'text-stroke').attr('startOffset', '50%').attr('xlink:href', function (d) {
      return "#hidden-arc-".concat(state.chartId, "-").concat(d.id);
    }); // radial label

    var radialLabel = newSlice.append('g').attr('class', 'radial-label');
    radialLabel.append('text').attr('class', 'text-contour'); // white contour

    radialLabel.append('text').attr('class', 'text-stroke'); // Entering + Updating

    var allSlices = slice.merge(newSlice);
    allSlices.style('opacity', 1);
    allSlices.select('path.main-arc').transition(transition).attrTween('d', function (d) {
      return function () {
        return state.arc(d);
      };
    }).style('stroke', function (d) {
      return strokeColorOf(d.data, d.parent);
    }).style('fill', function (d) {
      return colorOf(d.data, d.parent);
    });
    var computeAngularLabels = state.showLabels && ['angular', 'auto'].includes(state.labelOrientation.toLowerCase());
    var computeRadialLabels = state.showLabels && ['radial', 'auto'].includes(state.labelOrientation.toLowerCase());

    if (computeAngularLabels) {
      allSlices.select('path.hidden-arc').transition(transition).attrTween('d', function (d) {
        return function () {
          return middleArcLine(d);
        };
      });
    } // Ensure propagation of data to labels children


    allSlices.selectAll('text.angular-label').select('textPath.text-contour');
    allSlices.selectAll('text.angular-label').select('textPath.text-stroke');
    allSlices.selectAll('g.radial-label').select('text.text-contour');
    allSlices.selectAll('g.radial-label').select('text.text-stroke'); // Show/hide labels

    allSlices.select('.angular-label').transition(transition).styleTween('display', function (d) {
      return function () {
        return computeAngularLabels && (state.labelOrientation === 'auto' ? autoPickLabelOrientation(d) === 'angular' : angularTextFits(d)) ? null : 'none';
      };
    });
    allSlices.select('.radial-label').transition(transition).styleTween('display', function (d) {
      return function () {
        return computeRadialLabels && (state.labelOrientation === 'auto' ? autoPickLabelOrientation(d) === 'radial' : radialTextFits(d)) ? null : 'none';
      };
    }); // Set labels

    computeAngularLabels && allSlices.selectAll('text.angular-label').selectAll('textPath').text(function (d) {
      return nameOf(d.data);
    });
    computeRadialLabels && allSlices.selectAll('g.radial-label').selectAll('text').text(function (d) {
      return nameOf(d.data);
    }).transition(transition).attrTween('transform', function (d) {
      return function () {
        return radialTextTransform(d);
      };
    }); //

    function computeTextRotation(d) {
      var angle = (state.originalAngleScale(d.x0) + state.originalAngleScale(d.x1)) / Math.PI * 90; // <-- 1
      // Avoid upside-down labels

      return angle < 90 || angle > 270 ? angle : angle + 180; // <--2 "labels aligned with slices"
      // Alternate label formatting
      //return (angle < 180) ? angle - 90 : angle + 90;  // <-- 3 "labels as spokes"
    }

    function middleArcLine(d) {
      var halfPi = Math.PI / 2;
      var angles = [state.angleScale(d.x0) - halfPi, state.angleScale(d.x1) - halfPi];
      var r = Math.max(0, (state.radiusScale(d.y0) + state.radiusScale(d.y1)) / 2);
      if (!r || !(angles[1] - angles[0])) return '';
      var middleAngle = (angles[1] + angles[0]) / 2;
      var invertDirection = middleAngle > 0 && middleAngle < Math.PI; // On lower quadrants write text ccw

      if (invertDirection) {
        angles.reverse();
      }

      var path = d3Path.path();
      path.arc(0, 0, r, angles[0], angles[1], invertDirection);
      return path.toString();
    }

    function radialTextTransform(d) {
      var middleAngle = (state.angleScale(d.x0) + state.angleScale(d.x1) - Math.PI) / 2;
      var r = Math.max(0, (state.radiusScale(d.y0) + state.radiusScale(d.y1)) / 2);
      var x = r * Math.cos(middleAngle);
      var y = r * Math.sin(middleAngle);
      var rot = middleAngle * 180 / Math.PI;
      middleAngle > Math.PI / 2 && middleAngle < Math.PI * 3 / 2 && (rot += 180); // prevent upside down text

      return "translate(".concat(x, ", ").concat(y, ") rotate(").concat(rot, ")");
    }

    function angularTextFits(d) {
      var deltaAngle = state.angleScale(d.x1) - state.angleScale(d.x0);
      var r = Math.max(0, (state.radiusScale(d.y0) + state.radiusScale(d.y1)) / 2);
      var perimeter = r * deltaAngle;
      return nameOf(d.data).toString().length * CHAR_PX_WIDTH < perimeter;
    }

    function radialTextFits(d) {
      var availableHeight = state.radiusScale(d.y0) * (state.angleScale(d.x1) - state.angleScale(d.x0));
      if (availableHeight < CHAR_PX_HEIGHT) return false; // not enough angular space

      var availableLength = state.radiusScale(d.y1) - state.radiusScale(d.y0);
      return nameOf(d.data).toString().length * CHAR_PX_WIDTH < availableLength;
    }

    function autoPickLabelOrientation(d) {
      // prefer mode that keeps text most horizontal
      var angle = (state.angleScale(d.x0) + state.angleScale(d.x1)) / 2 % Math.PI;
      var preferRadial = angle > Math.PI / 4 && angle < Math.PI * 3 / 4;
      return preferRadial ? radialTextFits(d) ? 'radial' : angularTextFits(d) ? 'angular' : null : angularTextFits(d) ? 'angular' : radialTextFits(d) ? 'radial' : null;
    }

    function getNodeStack(d) {
      var stack = [];
      var curNode = d;

      while (curNode) {
        stack.unshift(curNode);
        curNode = curNode.parent;
      }

      return stack;
    }
  }
});

module.exports = sunburst;
