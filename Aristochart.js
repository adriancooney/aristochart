
/**
 * Aristochart.js
 * 
 * I am sick of all those sucky-overcomplicated 2D charting libraries
 * This will be a basic ridiculously customizable library that makes
 * things simple.
 *
 * @param {Object} element The DOM element container or canvas to use
 * @param {Object} options See Options.
 * @param {Object} theme A theme object. See Aristochart.themes.
 */
var Aristochart = function(element, options, theme) {
	// Sort out the default parameters
	if(!element || !element.DOCUMENT_NODE) options = element, element = document.createElement("canvas");

	// Make sure all good options are there
	if(!options || !options.data) throw new Error("Please provide some data to plot.");
	if(!options.data.y || !options.data.x) throw new Error("Please provide some data.x and data.y");

	// The default options.
	this.defaults = {
		width: 640,
		height: 400,
		margin: 70,
		padding: 20,	

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
			render: Aristochart.label.text,
			x: {
				step: 1
			},
			y: {
				step: 1
			}
		},

		title: {
			index: 6,
			render: Aristochart.title.text,
			x: "x",
			y: "y"
		},

		style: {
			default: {
				point: {
					stroke: "#000",
					fill: "#fff",
					radius: 4,
					width: 3,
					visible: true
				},

				line: {
					stroke: "#298281",
					width: 3,
					fill: "rgba(150, 215, 226, 0.4)"
				},

				axis: {
					stroke: "#ddd",
					width: 3
				},

				tick: {
					align: "middle", //"outside", "inside",
					stroke: "#ddd",
					width: 2,
					minor: 10,
					major: 15
				},

				label: {
					x: {
						font: "Helvetica",
						fontSize: 14,
						fontStyle: "normal",
						color: "#000",
						align: "center",
						baseline: "bottom",
						offsetY: 8,
						offsetX: 3
					},

					y: {
						font: "Helvetica",
						fontSize: 10,
						fontStyle: "normal",
						color: "#000",
						align: "center",
						baseline: "bottom",
						offsetY: 8,
						offsetX: 8
					}
				},

				title: {
					color: "#777",
					font: "georgia",
					fontSize: "16",
					fontStyle: "italic",

					x: {
						offsetX: 0,
						offsetY: 120
					},

					y: {
						offsetX: -135,
						offsetY: 10
					}
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
	["fill", "axis", "tick", "line", "point", "label", "title"].forEach(function(feature) {
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

/**
 * Refresh the graph y bounds from the supplied data.
 * @return {null} 
 */
Aristochart.prototype.refreshBounds = function() {
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

/**
 * Render the graph and data
 * @return {null} 
 */
Aristochart.prototype.render = function() {

	// Apply the scale to all the dimensions
	var scale = this.scale;
	this.options.margin *= scale;
	this.options.padding *= scale;
	this.options.width *= scale;
	this.options.height *= scale;

	// Calculate the bounding box
	this.box = {
		x: this.options.margin, 
		y: this.options.margin, 
		x1: this.options.width - (2*this.options.margin), 
		y1: this.options.height - (2*this.options.margin)
	};

	// Refresh the maxes
	this.refreshBounds();

	var that = this,
		lines = this.getPoints(),
		defaults = that.options.style.default;
	// Clear the canvas
	this.canvas.width = this.canvas.width;

	// Iterate over indexes and render the features appropriately 
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
				that.options.axis.x.render.call(that, defaults, box.x - padding, box.y + box.y1 + padding, that.box.x + box.x1 + padding, box.y + box.y1 + padding, "x");
				that.options.axis.y.render.call(that, defaults, box.x - padding, box.y - padding, box.x - padding, box.y + box.y1 + padding, "y");
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

				for(var i = 0; i < (stepX + 1); i++) that.options.tick.render.call(that, defaults, that.box.x  + (disX * i), that.box.y + that.box.y1 + that.options.padding, "x", i);
				for(var i = 0; i < (stepY + 1); i++) that.options.tick.render.call(that, defaults, that.box.x - that.options.padding, that.box.y + (disY * i), "y", i);
			break;

			case "label":
				var stepX = that.options.axis.x.steps,
					stepY = that.options.axis.y.steps,
					disX = that.box.x1/(stepX),
					disY = that.box.y1/(stepY); 

				for(var i = 0; i < (stepX + 1); i++) 
					that.options.label.render.call(that, defaults, that.data.x[0] + ((that.data.x[1]/stepX) * i), that.box.x  + (disX * i), that.box.y + that.box.y1 + that.options.padding, "x", i);
				for(var i = 0; i < (stepY + 1); i++) 
					that.options.label.render.call(that, defaults, that.yMax - (that.yMin + ((that.yMax/stepY) * i)), that.box.x - that.options.padding, that.box.y + (disY * i), "y", i);

			break;

			case "fill":
				for(var line in lines)
					that.options.fill.render.call(that, defaults, lines[line]);
			break;

			case "title":
				// X an y title
				var xLabel = that.options.title.x,
					yLabel = that.options.title.y;

				that.options.title.render.call(that, defaults, xLabel, (that.box.x*2 + that.box.x1)/2, that.box.y + that.box.y1, "x");
				that.options.title.render.call(that, defaults, yLabel, (that.box.x), (that.box.y*2 + that.box.y1)/2, "y");
			break;
		}
	});
};

/**
 * Get the points from each graph and returns the <line> vs x.
 * @param  {Function} callback (optional) Run a function over a point.
 * @return {Object}            The lines store <name> : <point array> where a point is {rx (raster x), ry, x (actual x point), y}
 */
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

/**
 * Simple proxy for Aristochart.getPoints
 * @param  {Function} callback See getPoints
 * @return {null}            
 */
Aristochart.prototype.iterateOverPoints = function(callback) {
	this.getPoints(callback);
};

/**
 * Normalize the points on an axis
 * @param  {int} val The input value to be normalized 
 * @param  {"y"|"x"} val The axis to normalize against
 * @return {int}     Normalized value
 */
Aristochart.prototype.normalize = function(val, axis) {
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
	text: function(style, text, x, y, type, i) {
		if(i % this.options.label[type].step == 0) {
			var label = style.label[type];
			if(type == "x") y = y + (style.tick.major + label.offsetY)*this.scale;
			if(type == "y") x = x - (style.tick.major + label.offsetX)*this.scale, y += label.offsetY*this.scale;

			this.ctx.font = label.fontStyle + " " + (label.fontSize*this.scale) + "px " + label.font;
			this.ctx.fillStyle = label.color;
			this.ctx.textAlign = label.align;
			this.ctx.textBaseline = label.baseline;

			var substr = /(\d+(\.\d)?)/.exec(text);
			this.ctx.fillText(substr[0], x, y);
		}
	}
};

Aristochart.title = {
	text: function(style, text, x, y, type) {
		this.ctx.save();

		if(type == "x") y += style.title.x.offsetY,
			x += style.title.x.offsetX;
		if(type == "y") y += style.title.y.offsetY,
			x += style.title.y.offsetX;

		this.ctx.font = style.title.fontStyle + " " + (style.title.fontSize*this.scale) + "px " + style.title.font;
		this.ctx.fillStyle = style.title.color;

		this.ctx.translate(x, y);
		if(type == "y") this.ctx.rotate(Math.PI/2);

		this.ctx.fillText(text, 0, 0);
		this.ctx.restore();
	}
}

/**
 * Aristochart theme object
 * @type {Object}
 */
Aristochart.themes = {};