test("Constructor exists", function() {
	ok(!!Aristochart, "Aristochart exists.");
});

test("Constructor throws exception with no options", function() {
	throws(function() {
		new Aristochart()
	}, "Error thrown.");
});

test("Constructor throws exception with no chart or data properties", function() {
	throws(function() {
		new Aristochart({});
	}, "Error Thrown");
});