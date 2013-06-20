/**
 * Aristchart constructor
 * @param {Object} elem    DOM element
 * @param {Object} options Aristochart options object
 * @param {OBject} theme   Aristochart theme
 *
 * Possible combinations:
 * 	Aristochart(elem, options);
 * 	Aristochart(options, theme);
 * 	Aristochart(options);
 * 	
 */
var Aristochart = function(elem, options, theme) {
	if(!elem) Aristochart.Error("Please provide some options to the Aristochart constructor.");
	if(!elem.nodeName) options = elem, elem = undefined;
	if(!theme) theme = Aristochart.Themes.default;
	if(!options.data) Aristochart.Error("Please provide some data to plot.");
	if(!options.type) Aristochart.Error("Please specify the type of chart you want rendered.");	
	if(Aristochart.supported.indexOf(options.type) == -1) Aristochart.Error("Chart type '" + options.type + "' not supported.");

	//Create the canvas
	if(!elem || elem.nodeName.toLowerCase() !== "canvas") {
		this.wrapper = elem;
		this.canvas = document.createElement("canvas");
		this.ctx = this.canvas.getContext("2d");
	} else {
		this.canvas = elem;
		this.ctx = elem.getContext("2d");
	}

	//Add a debug border
	if(Aristochart.DEBUG) this.canvas.style.border = "3px solid red";

	// Set them to the instance
	this.options = options;
	this.data = options.data;
	this.type = options.type;
	this.theme = theme;

	//Collapse the styles to defaults
	Aristochart.log("Merging the theme with the defaults.");
	this.theme = Aristochart._deepMerge(this.theme, Aristochart.Themes.default);
	Aristochart.log("Merging the options with the theme.");
	this.options = Aristochart._deepMerge(this.options, this.theme);
	Aristochart.log("Flattening out style.");
	this.options = this.flattenStyle(this.options);

	//Append the canvas
	if(this.wrapper) this.wrapper.appendChild(this.canvas);

	//Validate some specific options
	this.validateOptions();

	//Validate and sanitize the data
	this.validateData();

	//Compile the primitive objects in the theme, render, isInside, etc. in Aristochart.Primitive
	this.compilePrimitives();

	//Create it's own registry
	this.registry = new Aristochart.Registry(this);

	//Create Aristochart's render engine
	this.engine = new Aristochart.Engine(this, this.update, this.render);

	//Check to see if the graph is not static, start interactivity
	if(!this.options.static) {
		this.engine.start();

		//Bind the events
		var that = this;
		this.canvas.addEventListener("click", function(event) {
			that.registry.objectsUnder(event.offsetX, event.offsetY).forEach(function(primitive) {
				if(primitive.events.click) primitive.events.click.call(primitive);
			})
		});

		//Handle mousemove over elements
		var buffer = [];
		this.canvas.addEventListener("mousemove", function(event) {
			var current = that.registry.objectsUnder(event.offsetX, event.offsetY);

			//Iterate over the current and call mouseover if not already
			//else call mousemove and put it into a buffer
			current.forEach(function(primitive) {
				if(!primitive._mouseover) {
					if(primitive.events.mouseover) primitive.events.mouseover.call(primitive);
					primitive._mouseover = true;
					buffer.push(primitive);
				} else {
					if(primitive.events.mousemove) primitive.events.mousemove.call(primitive);
				}
			});

			//Check the buffer to see if the elements are still being hovered
			//if not, remove it from the buffer and call mouseout
			buffer.forEach(function(primitive, i) {
				if(current.indexOf(primitive) == -1) {
					if(primitive.events.mouseout) primitive.events.mouseout.call(primitive);
					primitive._mouseover = false;
					buffer.splice(i, 1);
				}
			});
		});
	}
};

/**
 * Some enviornment variables
 */
Aristochart.DEBUG = true;
Aristochart.supported = ["pie", "line"];

/**
 * Validates specific options such as margin or padding
 * @return {null} 
 */
Aristochart.prototype.validateOptions = function() {
	if(typeof this.options.padding == "number") this.options.padding = expand(this.options.padding)
	if(typeof this.options.margin == "number") this.options.margin = expand(this.options.margin)

	function expand(num) {
		return {
			top: num,
			bottom: num,
			left: num,
			right: num
		}
	}
};

/**
 * Validates the inputted data
 */
Aristochart.prototype.validateData = function() {
	var data = this.data;
	switch(this.type) {
		case "line":
			if(!data.x || !data.y) Aristochart.Error("Invalid line data. Please specify an X property and y property and optional y1, y2, yn etc. properties.");
		break;

		case "pie":
			if(Object.key(data).length < 1) Aristochart.Error("Invalid pie data. Please provide some data in the form of sliceName : value.");
		break;
	}

	//Sanitize the data
	this.data = Aristochart.sanitize[this.type](this.data);
};

/**
 * Flatten the style object with it's local defaults
 * @param {Object} theme The theme object to parse
 * @return {Object} Parsed theme
 */
Aristochart.prototype.flattenStyle = function(options) {
	return (function recur(style) {
		for(var key in style) {
			if(style.hasOwnProperty(key)) {
				if(key == "default") continue;

				//Recur if necessary
				if(style[key] instanceof Object) style[key] = recur(style[key]);
				
				//Merge with local default
				if(style.default) style[key] = Aristochart._deepMerge(style[key], style.default);
			}
		}

		return style;
	})(options)
};

/**
 * Compiles the theme's render functions into Aristochart primitives
 * @return {null} 
 */
Aristochart.prototype.compilePrimitives = function() {
	var that = this;
	Aristochart.supported.forEach(function(chart) {
		var feature = that.options[chart];
		for(var key in feature) {
			feature[key] = Aristochart.Primitive(that.canvas, that.ctx, feature[key]);
		}
	});
};

/**
 * Aristochart's main update
 * @return {[type]} [description]
 */
Aristochart.prototype.update = function() {
	this.registry.update();
};

/**
 * The main render function. Renders the registry
 * @return {bull} 
 */
Aristochart.prototype.render = function() {
	//Fill the background
	Aristochart.Tools.background(this.canvas, this.ctx, this.options.background);

	//Render the registry of primitives
	this.registry.render();
};

/**
 * Aristochart Error handling
 * @param {*} error Anything to pass to new Error
 */
Aristochart.Error = function(msg, error) {
	if(Aristochart.DEBUG) throw new Error("Aristochart Error: " + msg, error);
};

/**
 * Error log handling
 * @param {*} data Anything to log
 */
Aristochart.log = function() {
	var args = Array.prototype.filter.call(arguments, function() { return true; });
	args.unshift("Aristochart Debug: ")
	if(Aristochart.DEBUG) console.log.apply(console, args);
};

/**
 * Deep merge two object a and b
 *
 * @private
 * @param  {Object} a The object to merge with
 * @param  {Object} b The recipient of the merge or the object to be merged into
 * @return {object}   The merged objects
 *
 * Still having trouble handling this Adrian?
 * 	_deepMerge(a, b) = I want to merge a into b, overwriting values.
 */
Aristochart._deepMerge = function(options, defaults) {
	if(!options || !defaults) Aristochart.Error("Aristochart._deepMerge: Please provide two object to merge!")
	// Used "defaults" and "options" to help with the concept in my head
	return (function recur(options, defaults) {
		for(var key in options) {
			if(options.hasOwnProperty(key)) {
				if(options[key] instanceof Object && defaults[key] instanceof Object) defaults[key] = recur(options[key], defaults[key]);
				else defaults[key] = options[key];
			}
		}

		return defaults;
	})(options, defaults)
};

/**
 * Aristochart canvas tools
 * @type {Object}
 */
Aristochart.Tools = {
	clear: function(canvas) {
		canvas.width = canvas.width;
	},

	background: function(canvas, ctx, fill) {
		ctx.fillStyle = fill;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}
};

/**
 * Sanitization of the data functions.
 * @type {Object}
 */
Aristochart.sanitize = {
	/**
	 * Line santization:
	 *
	 * Possible input:
	 * 	{
	 * 		x: int || [int] || [int, int] || [int, int, ..., int],
	 * 		y: [int, ..., int] || { fn, start: stop },
	 * 		y1: [int, ..., int],
	 * 		y2: [int, ..., int],
	 * 		       ...
	 * 		yn: [int, ..., int]
	 * 	}
	 */
	line: function(data) {
		var x;

		if(typeof data.x == "number") x = {lower: 0, upper: data.x, range: data.x};
		else if(data.x instanceof Array && data.x.length == 1) x = {lower: 0, upper: data.x[0], range: data.x[0]};
		else if(data.x instanceof Array) x = {lower: data.x[0], upper: data.x[data.x.length - 1], range: data.x[data.x.length -1] - data.x[0]};
		else Aristochart.Error("Bad data. Bad data supplied to the x property.");

		// Make sure the rest are arrays and greater than 1 in length
		for(var line in data) {
			if(line == "x") continue;

			var y = data[line];
			if(!(y instanceof Array)) Aristochart.Error("Bad Data. Please make sure " + line + " is an array of data points");
			else if(y.length < 2) Aristochart.Error("Bad data. Please make sure line " + line + "'s data has more than one data point.");
		}

		//set the x
		data.x = x;
		return data;
	}
};

/**
 * Aristochart Render engine
 * @param {function} update The update function
 * @param {render} render The render function
 */
Aristochart.Engine = function(context, update, render) {
	this.context = context;
	this.update = update;
	this.render = render;
	this.running = false;
	this.frame = 0;
	this.tags = [];
};

/**
 * Start the render engine
 * @return {null}
 */
Aristochart.Engine.prototype.start = function() {
	this.running = true;

	var that = this;
	(function tick() {
		if(that.running) {
			requestAnimFrame(tick);
			that.update.call(that.context);
			that.render.call(that.context);
		}
	})();
};

/**
 * Stop the render engine
 * @return {null} 
 */
Aristochart.Engine.prototype.stop = function() {
	this.running = false;
};

/**
 * Primitive class creator.
 *
 * @protocol Primitive
 *     getBoundingBox
 *     isInside( x, y )
 *     update
 *     render
 */
Aristochart.Primitive = function(canvas, ctx, obj) {
	if(!obj.render) Aristochart.Error("Aristochart.Primitive: Forgot to supply a render function when creating a primitive.");
	if(!obj.isInside && !obj.getBoundingBox) Aristochart.Error("Aristochart.Primitive: Forgot to supply isInside or getBoundingBox functions. Supply both preferably.");

	/**
	 * Primitive Constructor.
	 */
	var Primitive = function(data) {
		this.index = 0;
		this.visible = true;
		this.x = 0;
		this.y = 0;
		this.alpha = 1;
		this.rotation = 0;
		this.scale = 1;
		this.animationBuffer = [];

		//Set the canvas and ctx
		this.canvas = canvas;
		this.ctx = ctx;

		//Add the primitive's events
		this.events = obj.events || {};

		//Merge
		if(data) Aristochart._deepMerge(data, this);

		//Custom initilization
		if(obj.init) obj.init.call(this);
	};

	/**
	 * For debug purposes. Renders a bounding box around an element.
	 * @return {null}
	 */
	Primitive.prototype.drawBoundingBox = function() {
		if(!this.getBoundingBox) Aristochart.Error("Primitive#drawBoundingBox: getBoundingBox not defined. Please define it if you want to draw the bounding box.");

		var box = this.getBoundingBox();
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.strokeStyle = "#f00";
		this.ctx.lineWidth = 3;
		this.ctx.moveTo(box.x, box.y);
		this.ctx.lineTo(box.x1, box.y);
		this.ctx.lineTo(box.x1, box.y1);
		this.ctx.lineTo(box.x, box.y1);
		this.ctx.closePath();
		this.ctx.stroke();
		this.ctx.restore();
	};

	/**
	 * Animate a properties on a primitive
	 * @param  {object} properties The properties to animate eg. { x: value }
	 * @param  {int} frames   The frames for the animate to span
	 * @param  {string} easing   Easing function
	 * @param  {function} callback   Callback on complete
	 * @return {null}
	 */
	Primitive.prototype.animate = function(properties, frames, callback, easing) {
		if(typeof callback == "string") easing = callback;

		for(var prop in properties) {
			if(this[prop] == undefined) { Aristochart.Error("Primitive#Animate: Property '" + prop + "' does not exist."); continue; }
			if(typeof this[prop] !== "number") { Aristochart.Error("Primitive#Animate: Property '" + prop + "' is not a number and is unanimatable"); continue; }
			
			//TODO: Dynamic time calculation based on FPS or per frame calculation
			var frames = frames,
				property = properties[prop],
				range = property - this[prop];

			this.animationBuffer.push({
				update: function(frame, prop, value) {
					this[prop] = value;
				},

				frame: frames,
				length: frames,
				callback: callback,
				property: prop,
				initialValue: this[prop],
				range: range,
				easing: Aristochart.Easing[easing] || Aristochart.Easing.easeInQuad
			});
		}
	};

	Primitive.prototype.transition = function(transition, duration, callback, easing) {
		//Convert the duration to frames
		duration = (duration) ? duration * 60 : 60;

		var animation;

		switch(transition) {
			case "fadeout":
				animation = { alpha: 0 };
			break;

			case "fadein":
				animation = { alpha: 1 };
			break;

			case "fadeinright":
				var cache = this.x;
				this.x = cache - 40;
				animation = { alpha: 1, x: cache };
			break;

			case "fadeinleft":
				var cache = this.x;
				this.x = cache + 40;
				animation = { alpha: 1, x: cache };
			break;
		}


		this.animate(animation, duration, callback, easing)
	};

	Primitive.prototype.update = function() {
		var newBuffer = [];

		//Run any animations in queue
		//Needs to be fast.
		for(var i = 0, length = this.animationBuffer.length; i < length; i++) {
			var animation = this.animationBuffer[i];

			if(animation.frame) {
				var value = animation.easing(undefined, (animation.length - animation.frame) + 1, 0, animation.range, animation.length);
				animation.update.call(this, animation.length - animation.frame, animation.property, animation.initialValue + value);
				animation.frame--;
				newBuffer.push(animation);
			} else {
				if(animation.callback && !animation.callback.called) animation.callback.call(this), animation.callback.called = true;
			}
		}

		//Replace the buffer
		this.animationBuffer = newBuffer;
	};

	Primitive.prototype.render = obj.render;
	Primitive.prototype.isInside = obj.isInside;
	Primitive.prototype.getBoundingBox = obj.getBoundingBox;

	return Primitive;
};

/**
 * Aristochart's color class.
 * @param {string} color Hex, rgb, rgba
 */
Aristochart.Color = function(color) {
	color = this.parse(color);
	this.r = color.r;
	this.g = color.g;
	this.b = color.b;
	this.a = color.a;
};

/**
 * Parse sting colors and outputs {r, g, b, a}
 * @param  {String} color The color string, hex, rgba, rgb
 * @return {Object}       {r, g, b, a}
 */
Aristochart.Color.prototype.parse = function(color) {
	var rgba = /rgb(a)?\s*\(((?:\s*(?:\d+\.\d+|\d+)\s*,?){3,4})\s*\)/;
	var hex = /#(?:([a-f0-9]{6})|([a-f0-9]{3}))/;

	if(rgba.exec(color)) {
		var colors = RegExp.$2.split(",").map(function(val) { return val.trim(); });
		if(RegExp.$1) { // Rgba
			return {
				r: parseInt(colors[0]),
				g: parseInt(colors[1]),
				b: parseInt(colors[2]),
				a: parseFloat(colors[3]) || 1
			}
		} else {
			return {
				r: parseInt(colors[0]),
				g: parseInt(colors[1]),
				b: parseInt(colors[2]),
				a: 1
			}
		}
	} else if(hex.exec(color)) {
		if(RegExp.$1) {
			var hex = RegExp.$1;
			hex = [hex.substr(0, 2), hex.substr(2, 2), hex.substr(4, 2)];
		} else if(RegExp.$2) {
			var hex = RegExp.$2;
			hex = [hex[0] + hex[0], hex[1] + hex[1], hex[2] + hex[2]];
		}

		if(hex) hex = hex.map(function(hexdecimal) {
			return parseInt(hexdecimal, 16);
		});

		return {
			r: hex[0],
			g: hex[1],
			b: hex[2],
			a: 1
		}
	}
};

/**
 * Convert convert color to rgba
 * @return {String} rgba(r, g, b, a)
 */
Aristochart.Color.prototype.toString = function() {
	return "rgba(" + [this.r, this.g, this.b, this.a].join(", ") + ")";
};

/**
 * The Aristochart registry
 * @type {Object}
 */
Aristochart.Registry = function(context) {
	this.registry = [];
	this.context = context;
};

Aristochart.Registry.prototype = {
	/**
	 * objectsUnder -- Test to see if there is a primitive at coord x, y
	 * @param  {int} x The x coordinate (raster)
	 * @param  {int} y The y coordinate (raster)
	 * @return {array}   Array of objects if any
	 */
	objectsUnder: function(x, y) {
		var primitives = [];
		for(var i = 0, cache = this.registry.length; i < cache; i++) {
			if(this.registry[i].isInside(x, y)) primitives.push(this.registry[i]);
		}

		return primitives;
	},

	/**
	 * add -- Adds an primitive to the registry
	 * @param {Object} obj The primitive to add
	 * @return {null}     
	 */
	add: function(obj) {
		if(obj) {
			if(obj instanceof Array) this.registry.concat(obj);
			else this.registry.push(obj);
		}
	},

	/**
	 * remove -- Remove an object from the registry
	 * @param  {Object} obj The object/primitive to remove
	 * @return {null}     
	 */
	remove: function(obj) {
		this.registry.splice(this.registry.indexOf(obj), 1);
	},

	/**
	 * Updates the registry
	 * @return {null} 
	 */
	update: function() {
		for(var i = 0, cache = this.registry.length; i < cache; i++) {
			this.registry[i].update();
		}
	},

	/**
	 * Renders the registry
	 * @return {null} 
	 */
	render: function() {
		for(var i = 0, cache = this.registry.length; i < cache; i++) {
			var primitive = this.registry[i];
			if(Aristochart.DEBUG) primitive.drawBoundingBox();
			primitive.render();
		}
	}
};

/**
 * Awesome Easing functions courtesy of 
 * https://github.com/danro/jquery-easing/blob/master/jquery.easing.js
 *
 * TERMS OF USE - EASING EQUATIONS
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2001 Robert Penner
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 */
Aristochart.Easing = {
	easeInQuad: function (x, t, b, c, d) {
		return c*(t/=d)*t + b;
	},

	easeOutQuad: function (x, t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},

	easeInOutQuad: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t + b;
		return -c/2 * ((--t)*(t-2) - 1) + b;
	},

	easeInCubic: function (x, t, b, c, d) {
		return c*(t/=d)*t*t + b;
	},

	easeOutCubic: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	},

	easeInOutCubic: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t + b;
		return c/2*((t-=2)*t*t + 2) + b;
	},

	easeInQuart: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t + b;
	},

	easeOutQuart: function (x, t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},

	easeInOutQuart: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
		return -c/2 * ((t-=2)*t*t*t - 2) + b;
	},

	easeInQuint: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t*t + b;
	},

	easeOutQuint: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t*t*t + 1) + b;
	},

	easeInOutQuint: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
		return c/2*((t-=2)*t*t*t*t + 2) + b;
	},

	easeInSine: function (x, t, b, c, d) {
		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
	},

	easeOutSine: function (x, t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},

	easeInOutSine: function (x, t, b, c, d) {
		return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
	},

	easeInExpo: function (x, t, b, c, d) {
		return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
	},

	easeOutExpo: function (x, t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	},

	easeInOutExpo: function (x, t, b, c, d) {
		if (t==0) return b;
		if (t==d) return b+c;
		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
	},

	easeInCirc: function (x, t, b, c, d) {
		return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
	},

	easeOutCirc: function (x, t, b, c, d) {
		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
	},

	easeInOutCirc: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
		return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
	},

	easeInElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
	},

	easeOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
	},

	easeInOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
	},

	easeInBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*(t/=d)*t*((s+1)*t - s) + b;
	},

	easeOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	},

	easeInOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158; 
		if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
		return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
	},

	easeInBounce: function (x, t, b, c, d) {
		return c - Aristochart.Easing.easeOutBounce (x, d-t, 0, c, d) + b;
	},

	easeOutBounce: function (x, t, b, c, d) {
		if ((t/=d) < (1/2.75)) {
			return c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
		} else if (t < (2.5/2.75)) {
			return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
		} else {
			return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
		}
	},

	easeInOutBounce: function (x, t, b, c, d) {
		if (t < d/2) return Aristochart.Easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
		return Aristochart.Easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
	}
};

/**
 * Aristochart's theme store.
 * @type {Object}
 */
Aristochart.Themes = {};

/**
 * The default theme.
 * @type {Object}
 */
Aristochart.Themes.default = {
	static: false,
	background: "#fff",

	//Dimensions
	padding: 10,
	margin: 10,

	line: {
		point: {
			init: function() {
				this.side = 10;
			},

			render: function() {
				this.ctx.fillStyle = "rgba(0, 0, 0, " + this.alpha + ")";
				this.ctx.fillRect(this.x, this.y, this.side, this.side);
			},

			getBoundingBox: function() {
				return {
					x: this.x,
					x1: this.x + this.side,
					y: this.y,
					y1: this.y + this.side
				}
			},

			isInside: function(x, y) {
				if(x > this.x && x < (this.x + this.side) && y > this.x && y < (this.y + this.side)) return true;
				else return false;
			},

			events: {
				click: function() {
					console.log("FART!");
					this.highlighted = true;
				},

				mouseover: function() {
					console.log("MOUSEOVER!");
					this.mouseover = true;
					this.x = this.x + 10;
					this.y = this.y + 10;
				},

				mousemove: function() {
					console.log("MOUSEMOVE!");
				},

				mouseout: function() {
					console.log("mouseout");
					this.mouseover = false;
				}
			}
		}
	},

	pie: {
		slice: {
			render: function() {
				//this.ctx blah
			},

			getBoundingBox: function() {

			},

			isInside: function(x, y) {

			},

			events: {
				click: function() {
					this.highlighted = true;
				},

				mouseover: function() {
					this.mouseover = true;
				},

				mouseout: function() {
					this.mouseover = false;
				}
			}
		}
	},

	style: {
		line: {
			tick: {},
			axis: {},
			//etc.

			line: {

				//per line styling
				default: {
					visible: true
				}
			}
		},

		pie: {
			visible: true,

			slice: {
				1: {
					color: "#f00"
				},

				"sliceName": {
					color: "#000"
				},

				default: {
					visible: true,
				}
			}
		}
	}
};

/**
 * Paul Irish's getAnimFrame polyfill
 */
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();