/**
 * @theme Default
 * @author Adrian Cooney <cooney.adrian@gmail.com> (http://adriancooney.ie)
 * @license http://opensource.org/licenses/MIT
 */

//Given as an example. This is already included in Aristochart.js
Aristochart.themes.dot = {
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
		render: Aristochart.title.text
	},

	style: {

		default: {
			point: {
				fill: "#000",
				radius: 2,
				width: 0
			},

			line: {
				stroke: "#000",
				width: 2,
				fill: false
			},

			axis: {
				stroke: "#ddd",
				width: 3,
				visible: false
			},

			tick: {
				align: "inside", //"outside", "inside",
				stroke: "#ddd",
				width: 2,
				minor: 5,
				major: 5,
				visible: false
			},

			label: {
				x: {
					font: "Helvetica",
					fontSize: 10,
					fontStyle: "normal",
					color: "#ddd",
					align: "center",
					baseline: "bottom",
					offsetY: 14,
					offsetX: 3
				},

				y: {
					font: "Helvetica",
					fontSize: 10,
					fontStyle: "normal",
					color: "#ddd",
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
				visible: false,

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