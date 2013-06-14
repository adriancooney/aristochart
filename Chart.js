
/**
 * I am sick of all those sucky-overcomplicated 2D charting libraries
 * This will be a basic ridiculously customizable library that makes
 * things simple.
 *
 * new Aristochart({
 * 		width: 640,
 * 		height: 400
 * 
 * 		data: [{
 * 			x: [2, 3, 4, 5, 6, 6, 5, 6, 7, 8],
 * 			y: [1, 2, 3, 4, 5, 6],
 * 			y2: [2, 3, 4, 5, 6, 7, 8, 9, 9]		
 * 		}],
 *
 * 		style: {
 * 			y: {
 * 				color: "#f00",
 * 				point: {
 * 					color: "#f00"
 * 				}
 * 			}
 * 		},
 *
 * 		ticks: { // The lines or slits
 * 			render: function(n, x, y, axes) {
 * 				// n is the iteration, x, y is the point on the axes
 * 				// axes is the axes type
 * 			}
 * 		}
 * 		
 * 		axes: {
 *   		x: {
 * 			 	values: [1, 2, 3, 4, 5, 6],
 *	  			render: function(x, y, x1, y1) {
 *	  			
 *	  			}
 *	  		},
 *
 *	  		y: {
 * 			 	values: [1, 2, 3, 4, 5, 6],
 *	 			render: function(x, y, x1, y1) {
 *	 				// Render the line
 *	 			}
 *	  		},
 *
 * 			render: function(x, y, x1, y1) {
 * 			
 * 			}
 *	  	},
 *
 * 		point: {
 * 			render: function(x, y) {
 * 			
 * 			}
 * 		},
 *
 * 		line: {
 * 			render: function(line) {
 * 				// Array of points
 * 			}
 * 		}
 * })
 * 	
 * @param {Object} options See Options.
 */
var Aristochart = function(element, options, theme) {
	// Sort out the default parameters
	if(!element || !element.DOCUMENT_NODE) options = element, element = document.createElement("canvas");

	// Make sure all good options are there
	if(!options || !options.data) throw new Error("Please provide some data to plot.");
	if(!options.data.y || !options.data.x) throw new Error("Please provide some data.x and data.y");

	this.defaults = {
		width: 640,
		height: 400,
		margin: 40,
		padding: 15,

		fill: {
			index: 0,
			render: Aristochart.line.fill
		},

		axis: {
			index: 1,
			render: Aristochart.axes.line,
			x: {
				steps: 5
			},

			y: {
				steps: 10
			}
		},

		tick: {
			index: 2,
			render: Aristochart.ticks.line
		},

		line: {
			index: 3,
			render: Aristochart.line.line
		},

		point: {
			index: 4,
			render: Aristochart.point.circle
		},

		label: {
			index: 5,
			render: Aristochart.label.text
		},

		style: {
			default: {
				point: {
					stroke: "#000",
					fill: "#000",
					radius: 4,
					width: 3,
					visible: true
				},

				line: {
					stroke: "#f00",
					width: 5,
					fill: "rgba(0,0,0,0.3)"
				},

				axis: {
					stroke: "#ddd",
					width: 3
				},

				tick: {
					align: "outside", //"outside", "inside",
					stroke: "#ddd",
					width: 2,
					minor: 10,
					major: 15
				},

				label: {
					font: "Helvetica",
					fontSize: 14,
					align: "center",
					baseline: "bottom",
					offsetY: 8,
					offsetX: 3
				}
			}
		}
	};

	this.options = options;
	this.canvas = element;
	this.theme = theme;
	this.data = this.options.data;

	// Merge the theme with the options.
	if(this.theme) this.defaults = Aristochart.deepMerge(this.defaults, this.theme);

	// Merge the options with the defaults
	for(var key in this.defaults) this.options = Aristochart.deepMerge(this.defaults, this.options);

	// Merge all the styles with the default style
	for(var style in this.options.style) 
		for(var key in this.options.style["default"]) 
			this.options.style[style] = Aristochart.deepMerge(this.options.style["default"], this.options.style[style]);

	// Feature specific options
	if(!this.options.axis.x) this.options.axis.x = {};
	if(!this.options.axis.x.render) this.options.axis.x.render = this.options.axis.render;
	if(!this.options.axis.y) this.options.axis.y = {};
	if(!this.options.axis.y.render) this.options.axis.y.render = this.options.axis.render;

	// Sort out indexes
	this.indexes = [], that = this;
	["fill", "axis", "tick", "line", "point", "label"].forEach(function(feature) {
		console.log(feature);
		//Set the index to the value
		if(that.indexes[that.options[feature].index]) throw new Error("Conflicting indexes in Aristochart");
		else that.indexes[that.options[feature].index] = feature;
	});

	//Filter out the undefineds
	this.indexes = this.indexes.filter(function(val) {
		if(val) return true;
	});

	// Fix the x range
	if(this.data.x.length == 1 || typeof this.data.x == "number") this.data.x = [0, this.data.x[0] || this.data.x];
	else this.data.x = [this.data.x[0], this.data.x[this.data.x.length - 1]];

	// Calculate the step
	this.data.x.push(this.data.x[1]/this.options.axis.x.steps);


	// Set the canvas
	if(this.canvas.getContext) this.ctx = this.canvas.getContext("2d");
	else {
		var canvas = document.createElement("canvas");
		this.canvas.appendChild(canvas);
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
	}

	// Set the width and height of the canvas
	this.canvas.height = this.options.height;
	this.canvas.width = this.options.width;

	//Fix for retina
	if(window.devicePixelRatio > 1) {
		this.canvas.height = this.options.height * window.devicePixelRatio;
		this.canvas.width = this.options.width * window.devicePixelRatio;
		this.canvas.style.height = this.options.height + "px";
		this.canvas.style.width = this.options.width + "px";
	}

	this.scale = window.devicePixelRatio || 1;

	// And render this bitch
	this.render();
};

Aristochart.prototype.applyScale = function() {
	var scale = this.scale;
	this.options.margin *= scale;
	this.options.padding *= scale;
	this.options.width *= scale;
	this.options.height *= scale;
};

/**
 * Deep merge two object a and b
 * 
 * @param  {Object} a The object to merge with
 * @param  {Object} b The recipient of the merge or the object to be merged into
 * @return {object}   The merged objects
 */
Aristochart.deepMerge = function(defaults, options) {
	// Used "defaults" and "options" to help with the concept in my head
	return (function recur(defaults, options) {
		for(var key in defaults) {
			if(!options[key]) options[key] = defaults[key];
			else if(defaults[key] instanceof Object) options[key] = recur(defaults[key], options[key]);
		}
		return options;
	})(defaults, options)
};

Aristochart.prototype.refreshMaxes = function() {
	// Get absolute max
	this.yMax = -Infinity;
	this.yMin = Infinity;
	for(var key in this.data) {
		if(key !== "x") {
			var max = -Infinity, min = Infinity;
			this.data[key].forEach(function(v) { if(v > max) max = v; if(v < min) min = v; });
			this.yMax = (max > this.yMax) ? max : this.yMax;
			this.yMin = (min < this.yMin) ? min : this.yMin;
		}
	}
}

Aristochart.prototype.render = function() {

	// Apply the scale to all the dimensions
	this.applyScale();

	// Calculate the bounding box
	this.box = {
		x: this.options.margin, 
		y: this.options.margin, 
		x1: this.options.width - (2*this.options.margin), 
		y1: this.options.height - (2*this.options.margin)
	};

	// Refresh the maxes
	this.refreshMaxes();

	var that = this,
		lines = this.getPoints(),
		defaults = that.options.style.default;
	// Clear the canvas
	this.canvas.width = this.canvas.width;

	// Iterate over indexes
	this.indexes.forEach(function(feature) {
		switch(feature) {
			case "point":
				for(var line in lines)
					if((that.options.style[line] || defaults).point.visible)
						lines[line].forEach(function(obj) {
							that.options.point.render.call(that, that.options.style[line] || that.options.style.default, obj.rx, obj.ry, obj.x, obj.y, obj.graph);
						});
			break;

			case "axis":
				var padding = that.options.padding,
					box = that.box;
				that.options.axis.x.render.call(that, that.options.style["line"] || defaults, box.x - padding, box.y + box.y1 + padding, that.box.x + box.x1 + padding, box.y + box.y1 + padding, "x");
				that.options.axis.y.render.call(that, that.options.style["line"] || defaults, box.x - padding, box.y - padding, box.x - padding, box.y + box.y1 + padding, "y");
			break;

			case "line":
				for(var line in lines)
					that.options.line.render.call(that, that.options.style[line] || defaults, lines[line]);
			break;

			case "tick":
				var stepX = that.options.axis.x.steps,
					stepY = that.options.axis.y.steps,
					disX = that.box.x1/(stepX),
					disY = that.box.y1/(stepY);

				for(var i = 0; i < (stepX + 1); i++) that.options.tick.render.call(that, that.options.style["tick"] || defaults, that.box.x  + (disX * i), that.box.y + that.box.y1 + that.options.padding, "x", i);
				for(var i = 0; i < (stepY + 1); i++) that.options.tick.render.call(that, that.options.style["tick"] || defaults, that.box.x - that.options.padding, that.box.y + (disY * i), "y", i);
			break;

			case "label":
				var stepX = that.options.axis.x.steps,
					stepY = that.options.axis.y.steps,
					disX = that.box.x1/(stepX),
					disY = that.box.y1/(stepY); 

				for(var i = 0; i < (stepX + 1); i++) 
					that.options.label.render.call(that, that.options.style["label"] || defaults, that.data.x[0] + ((that.data.x[1]/stepX) * i), that.box.x  + (disX * i), that.box.y + that.box.y1 + that.options.padding, "x", i);
				for(var i = 0; i < (stepY + 1); i++) 
					that.options.label.render.call(that, that.options.style["label"] || defaults, that.yMax - (that.yMin + ((that.yMax/stepY) * i)), that.box.x - that.options.padding, that.box.y + (disY * i), "y", i);

			break;

			case "fill":
				for(var line in lines)
					that.options.fill.render.call(that, that.options.style[line] || that.options.style.default, lines[line]);
			break;
		}
	});
};

Aristochart.prototype.getPoints = function(callback) {
	var lines = {};

	//Iterate over y1, y2 etc.
	for(var key in this.data) {
		if(key !== "x") {
			lines[key] = [];
			var currArr = this.data[key];
			for(var i = 0, cache = this.data[key].length; i < cache; i++) {
				var currArr = this.data[key],
					currY = currArr[i],

					x = (this.data.x[1]/(currArr.length - 1)) * i,
					y = currArr[i],

					x = this.normalize(x),
					y = this.normalize(y),

					// Calculate the raster points
					rx = this.box.x + (this.box.x1*(x/this.data.x[1]));
					ry = this.box.y + (this.box.y1 - (this.box.y1*(y/this.yMax)));

				lines[key].push({x: x, y: y, rx: rx, ry: ry});

				if(callback) callback(rx, ry, x, y, key);
			}
		}
	}
	return lines;
};

Aristochart.prototype.iterateOverPoints = function(callback) {
	this.getPoints(callback);
};

Aristochart.prototype.normalize = function(val) {
	return val;
};

/**
 * Aristochart's default render functions
 */
Aristochart.point = {
	circle: function(style, rx, ry, x, y, graph) {
		this.ctx.save();
		this.ctx.strokeStyle = style.point.stroke;
		this.ctx.lineWidth = style.point.width * this.scale;
		this.ctx.fillStyle = style.point.fill;
		this.ctx.beginPath();
		this.ctx.arc(rx, ry, style.point.radius * this.scale, 0, Math.PI*2, true);
		this.ctx.fill();
		this.ctx.stroke();
		this.ctx.restore();
	}
};

Aristochart.line = {
	line: function(style, points) {
		this.ctx.save();
		this.ctx.strokeStyle = style.line.stroke;
		this.ctx.lineWidth = style.line.width * this.scale;
		this.ctx.beginPath();
		this.ctx.moveTo(points[0].rx, points[0].ry);
		var that = this;
		points.forEach(function(point) {
			that.ctx.lineTo(point.rx, point.ry);
		});
		this.ctx.stroke();
		this.ctx.restore();
	},

	fill: function(style, points) {
		this.ctx.save();
		this.ctx.fillStyle = style.line.fill;
		this.ctx.beginPath();
		this.ctx.moveTo(points[0].rx, points[0].ry);
		var that = this;
		points.forEach(function(point) {
			that.ctx.lineTo(point.rx, point.ry);
		});

		//Find bounding box
		this.ctx.lineTo(points[points.length - 1].rx, this.box.y + this.box.y1 + this.options.padding);
		this.ctx.lineTo(points[0].rx, this.box.y + this.box.y1 + this.options.padding);
		this.ctx.closePath();
		this.ctx.fill();
		this.ctx.restore();

	}
};

Aristochart.ticks = {
	line: function(style, x, y, type, i) {
		this.ctx.save();
		this.ctx.strokeStyle = "#000";
		this.ctx.lineWidth = style.tick.width * this.scale;
		this.ctx.beginPath();

		var length = (i % 2 == 0) ? style.tick.major : style.tick.minor;
			length *= this.scale;

		// Sort out the alignment
		var mx = x, my = y;
		switch(style.tick.align) {
			case "middle":
				if(type == "x") my = y - (length/2);
				if(type == "y") mx = x - (length/2);
			break;

			case "inside":
				if(type == "x") my = y - length;
				mx = x;
			break;

			case "outside":
				if(type == "x") my = y;
				if(type == "y") mx = x - length;
			break;
		}

		this.ctx.moveTo(mx, my)

		if(type == "x") this.ctx.lineTo(mx, my + length);
		else this.ctx.lineTo(mx + length, my);
		this.ctx.stroke();
		this.ctx.restore();
	}
};

Aristochart.axes = {
	line: function(style, x, y, x1, y1, type) {
		this.ctx.save();
		this.ctx.strokeStyle = style.axis.stroke;
		this.ctx.lineWidth = style.axis.width * this.scale;
		this.ctx.beginPath();
		this.ctx.moveTo(x, y);
		this.ctx.lineTo(x1, y1);
		this.ctx.stroke();
		this.ctx.restore();
	}
};

Aristochart.label = {
	text: function(style, text, x, y, type) {
		if(type == "x") y = y + (style.tick.major + style.label.offsetY)*this.scale;
		if(type == "y") x = x - (style.tick.major + style.label.offsetX)*this.scale, y += style.label.offsetY*this.scale;

		this.ctx.font = (style.label.fontSize * this.scale) + "px " + style.label.font;
		this.ctx.textAlign = style.label.align;
		this.ctx.textBaseline = style.label.baseline;

		var substr = /(\d+(\.\d)?)/.exec(text);
		this.ctx.fillText(substr[0], x, y);
	}
}

Aristochart.themes = {};

Aristochart.themes.orange = {
	style: {
		// Per graph styling
		y1: {
			color: "#f00",
			point: {
				fill: "#f00"
			},

			line: {
				fill: "#df9036"
			}
		},

		y2: {
			color: "#f0f",
			point: {
				fill: "#f0f"
			}
		},

		y3: {
			color: "#00f",
			point: {
				color: "#00f"
			}
		},

		default: {
			line: {
				stroke: "#332e2e",
				width: 2,
				fill: "#f59f39"
			},

			point: {
				stroke: "#332e2e",
				width: 2,
				fill: "#fff",
				radius: 3
			},

			tick: {
				align: "middle",
				length: 8
			},

			axis: {
				stroke: "rgba(0,0,0,0.3)",
				width: 2
			}
		}
	}
}