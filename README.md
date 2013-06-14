# Aristochart
### Sophisticated and simplified Javascript 2D line charts
Every find yourself looking for a chart library that isn't so damn huge and doesn't have any dependencies? I did too and couldn't find any so I decided to create my own. Aristochart is small but it's robust and made to be hacked. The main focus was customization so the library is incredibly extensible.

## Usage
Aristochart has a simple enough interface. Simple plug in the canvas element (or parent) along with some data and your good to go.

	new Aristochart(document.getElementById("canvas"), {
		data: {
			x: [1, 2, 3, 4, 5, 6, 7],
			y: [1, 2, 3, 4, 5, 6, 6, 5, 4, 3, 3, 4, 5, 6, 7, 8, 9, 10]
		}
	}, Aristochart.themes.orange);

![Basic](/examples/basic/basic.png "Basic")

## Themes
Currently only one theme has been implemented so far.

### Orange
`Aristochart.themes.orange`
![Orange Theme](/themes/screenies/orange.png "Orange")