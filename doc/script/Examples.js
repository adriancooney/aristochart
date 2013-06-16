/*
 * Examples.js
 *
 * Outputs the code of the examples on the screen.
 */
window.addEventListener("DOMContentLoaded", function() {
	var code = document.getElementById("example-code");

	if(!code) return alert("Please place the code for the example on the page and give the script tag the class 'example-code'.");

	document.getElementById("input-code").innerText = code.innerText.substr(1, code.innerText.length - 1); //Chop off that first newline	
});