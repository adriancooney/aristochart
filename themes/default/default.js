/**
 * @theme Default
 * @author Adrian Cooney <cooney.adrian@gmail.com> (http://adriancooney.ie)
 * @license http://opensource.org/licenses/MIT
 */

//Given as an example. This is already included in Aristochart.js
Aristochart.themes.default = {
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
		y: {
			line: {
				stroke: "#298281"
			}
		},

		y1: {
			line: {
				stroke: "#49bfbf"
			}
		},

		y2: {
			line: {
				stroke: "#49bfd4"
			}
		},

		default: {
			point: {
				stroke: "#000",
				fill: "#fff",
				radius: 4,
				width: 3,
				visible: true
			},

			line: {
				stroke: "#f00",
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