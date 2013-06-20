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

	//Validate and sanitize the data
	this.validateData();

	//Compile the primitive objects in the theme, render, isInside, etc. in Aristochart.Primitive
	this.compilePrimitives();

	//Create it's own registry
	this.registry = new Aristochart.Registry(this);

	//Create Aristochart's render engine
	this.engine = new Aristochart.Engine(this, this.update, this.render);
	//Check to see if the graph is not static and start the engine
	if(!this.options.static) this.engine.start();

	//Bind the events
	var that = this;
	this.canvas.addEventListener("click", function(event) {
		console.log(that.registry.objectUnder(event.offsetX, event.offsetY));
	});
};

/**
 * Some enviornment variables
 */
Aristochart.DEBUG = true;
Aristochart.supported = ["pie", "line"];

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

Aristochart.prototype.update = function() {

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
	var args =Array.prototype.filter.call(arguments, function() { return true; });
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
	 * 		y: [int, ..., int],
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
		this.rotation = 0;
		this.scale = 1;
		this.opacity = 0;
		this.transitions = [];

		this.canvas = canvas;
		this.ctx = ctx;

		this.box = {

		};

		//Merge
		if(data) Aristochart._deepMerge(data, this)
	};

	Primitive.prototype.update = function() {

	};

	/**
	 * Transition a property on a primitive
	 * @param  {string} property The property to transition
	 * @param  {int} frames   The frames for the transition to span
	 * @param  {string} easing   Easing function
	 * @param  {function} callback   Callback on complete
	 * @return {null}
	 */
	Primitive.prototype.transition = function(property, frames, easing, callback) {

	};

	//Create the class with the variable methods
	Primitive.events = obj.events;
	Primitive.prototype.render = obj.render;
	Primitive.prototype.isInside = obj.isInside;
	Primitive.prototype.getBoundingBox = obj.getBoundingBox;

	return Primitive;
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
	 * objectUnder -- Test to see if there is a primitive at coord x, y
	 * @param  {int} x The x coordinate (raster)
	 * @param  {int} y The y coordinate (raster)
	 * @return {array}   Array of objects if any
	 */
	objectUnder: function(x, y) {
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
		this.registry.push(obj);
	},

	/**
	 * remove -- Remove an object from the registry
	 * @param  {Object} obj The object/primitive to remove
	 * @return {null}     
	 */
	remove: function(obj) {

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
			this.registry[i].render();
		}
	}
};

/**
 * Aristochart's theme store.
 * @type {Object}
 */
Aristochart.Themes = {};
Aristochart.Themes.default = {
	static: false,
	background: "#fff",

	line: {
		point: {
			render: function() {
				this.ctx.fillStyle = "#000";
				this.ctx.fillRect(this.x, this.y, 10, 10);
			},

			getBoundingBox: function() {

			},

			isInside: function(x, y) {
				if(x > this.x && x < (this.x + 10) && y > this.x && y < (this.y + 10)) return true;
				else return false;
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
				//per slice styling etc.
				y: {
					a: 1
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