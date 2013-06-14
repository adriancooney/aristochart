/**
 * @theme Orange
 * @author Adrian Cooney <cooney.adrian@gmail.com> (http://adriancooney.ie)
 * @license http://opensource.org/licenses/MIT
 */
Aristochart.themes.orange = {
	style: {
		// Per graph styling
		y1: {
			point: {
				fill: "#f55939"
			},

			line: {
				fill: "#df9036"
			}
		},

		y2: {
			point: {
				fill: "#f5d539"
			}
		},

		y3: {
			point: {
				fill: "#00f"
			}
		},

		default: {
			line: {
				stroke: "#332e2e",
				width: 2,
				fill: "rgba(245, 159, 57, 0.5)"
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