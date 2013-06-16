/**
 * @theme Default
 * @author Adrian Cooney <cooney.adrian@gmail.com> (http://adriancooney.ie)
 * @license http://opensource.org/licenses/MIT
 */

//Given as an example. This is already included in Aristochart.js
Aristochart.themes.default = {
	width: 640,
	height: 400,
	margin: 70,
	padding: 20,
	render: true, //Automatically render

	fill: {
		index: 0,
		render: Aristochart.line.fill,
		fillToBaseLine: true,
	},

	axis: {
		index: 1,
		render: Aristochart.axis.line,

		x: {
			steps: 5,
			render: Aristochart.axis.line,
		},

		y: {
			steps: 10,
			render: Aristochart.axis.line,
		}
	},

	tick: {
		index: 2,
		render: Aristochart.tick.line
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
				fill: "rgba(150, 215, 226, 0.4)",
				visible: true
			},

			axis: {
				stroke: "#ddd",
				width: 3,
				visible: true,

				x: {
					visible: true,
					fixed: true
				},

				y: {
					visible: true,
					fixed: true
				}
			},

			tick: {
				align: "middle", //"outside", "inside",
				stroke: "#ddd",
				width: 2,
				minor: 10,
				major: 15,
				visible: true,

				x: {
					fixed: true
				},

				y: {
					fixed: true	
				}
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
					offsetX: 3,
					visible: true,
					fixed: true
				},

				y: {
					font: "Helvetica",
					fontSize: 10,
					fontStyle: "normal",
					color: "#000",
					align: "center",
					baseline: "bottom",
					offsetY: 8,
					offsetX: 8,
					visible: true,
					fixed: true
				}
			},

			title: {
				color: "#777",
				font: "georgia",
				fontSize: "16",
				fontStyle: "italic",
				visible: true,

				x: {
					offsetX: 0,
					offsetY: 120,
					visible: true
				},

				y: {
					offsetX: -135,
					offsetY: 10,
					visible: true
				}
			}
		}
	}
};