# Aristochart
## [http://dunxrion.github.com/aristochart](http://dunxrion.github.com/aristochart)
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

## Documentation
Aristochart's documentation is locacated at [http://dunxrion.github.com/aristochart](http://dunxrion.github.com/aristochart).

## License
The MIT License (MIT)

Copyright (c) 2013 Adrian Cooney <cooney.adrian@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.