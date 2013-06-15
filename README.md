# Aristochart
### Sophisticated and simplified static Javascript 2D line charts
Every find yourself looking for a chart library that isn't so damn huge and doesn't have any dependencies? I did too and couldn't find any so I decided to create my own. Aristochart is small but it's robust and made to be hacked. The main focus was customization so the library is incredibly extensible.

## Features
* Highly customizable, extensible and flexible.
* Multiple graph ability.
* Automatic data scaling.
* Custom labelling.
* Retina scaling.

## Usage
Aristochart has a simple enough interface. Plug in the canvas element (or placeholder) along with some data and you're good to go.

	new Aristochart(document.body, {
		data: {
			x: 10,
			y: [0, 1, 2, 3, 4, 5, 6, 6, 5, 4, 3, 3, 4, 5, 6, 7, 8, 9, 10],
			y1: [10, 9, 8, 7, 7, 6, 2, 1, 1, 1],
			y2: [4, 4, 4, 3, 3, 2, 2, 1, 0, 0, 0, 0]
		}
	});

![Default](/themes/default/screenshot.png "Default Theme")

## TODO
* Documentation.
* Themes.

## Theming
Duplicate the `themes/default` and edit at will. All themes are merged with the defaults where the theme overwrites the defaults so any property omitted in the theme will still be present from the defaults. Take a screenshot of it being used in `examples/basic` and save it in the `themes` folder as "screenshot". Submit a pull request and get yourself on the contributors list. All themes are welcome!

### Concepts
Every feature in Aristochart has a render function whereby the appropriate data is sent and it's up to that functio to render it on screen. Aristochart is more like a data manager and delegates the rendering to the appropriate functions. This table shows the parameters that are sent to the different functions.

## Themes

### Orange
![Orange Theme](/themes/orange/screenshot.png "Orange")

### Dot
![Dot Theme](/themes/dot/screenshot.png "Dot")

### Flat
![Flat Theme](/themes/flat/screenshot.png "Flat")