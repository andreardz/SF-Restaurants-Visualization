// Set up size
var mapWidth = 750;
var mapHeight = 750;

// Set up projection that the map is using
var projection = d3.geoMercator()
	.center([-122.433701, 37.767683]) // San Francisco, roughly
	.scale(225000)
	.translate([mapWidth / 2, mapHeight / 2]);

// This is the mapping between <longitude, latitude> position to <x, y> pixel position on the map
// projection is a function and it has an inverse:
// projection([lon, lat]) returns [x, y]
// projection.invert([x, y]) returns [lon, lat]

// Add an SVG element to the DOM
var svg = d3.select('body').append('svg')
.attr('width', mapWidth)
.attr('height', mapHeight);

// Add SVG map at correct size, assuming map is saved in a subdirectory called `data`
svg.append('image')
.attr('width', mapWidth)
.attr('height', mapHeight)
.attr('xlink:href', 'data/sf-map.svg');

//Load data
d3.csv("/data/restaurant_scores.csv", parse).then(load_data);

//parse .csv rows to array
function parse (buf) {
	return {
		business_id : buf.business_id,
		business_name : buf.business_name,
		business_longitude : +buf.business_longitude,
		business_latitude : +buf.business_latitude,
		inspection_score : +buf.inspection_score
	};
}

//Callback for d3.csv (all data related tasks go here)
function load_data(data){
	data.forEach(function(point) {
		point.proj = projection([point.business_longitude, point.business_latitude]);
	});
	visualize(data);
};

 //Generate visualization using parsed data from CSV (array of objects)
 function visualize(csvdata){
 	//groups for points
 	var cursorGroupA =	svg.append("g"); // POI A draggable points
	var cursorGroupB =	svg.append("g"); // POI B draggable points
	var backgroundGroup = svg.append("g"); // all restaurants in background
	var plotGroup = svg.append("g"); // highlighted restaurants
	var plotGroupA = svg.append("g"); // highlighted restaurants
	var plotGroupB = svg.append("g"); // highlighted restaurants
	var sliderA =	svg.append("g");
	var sliderB =	svg.append("g");
	var sliderScore =	svg.append("g");
	//POI A and B variables
	var posA = [{x: 100, y: 100}]; // POI A initial position
	var posB = [{x: 100, y: 100}]; // POI B initial position
	var radiusA_mi = 1; // POI A radius
	var radiusB_mi = 1; // POI A radius
	var degreesPerPixel = projection.invert([1,1])[0] - projection.invert([2,1])[0];//change in degrees per 1 pixel change in longitude
	var radiusA_px = get_radius_px(radiusA_mi, degreesPerPixel); // radius around A in pixels
	var radiusB_px = get_radius_px(radiusB_mi, degreesPerPixel); // radius around B in pixels
	//Variables for Slider nav bar
	var xMin = 600; //position
	var xMax = 700;
	var sliderRadiusRange = 4;
	var sliderScoreRange = 100;
	var minScore = 0;
	var ySliderA = 100; 
	var ySliderB = 200;
	var posSliderA = [-(radiusA_mi*(xMin - xMax)/sliderRadiusRange - xMin)];
	var posSliderB = [-(radiusB_mi*(xMin - xMax)/sliderRadiusRange - xMin)];
	var sliderScorePos = [-(minScore*(xMin - xMax)/sliderScoreRange - xMin)];
	var currentRadius;
	var sliderACircle;
	var filteredPoints = csvdata;
	// Slider A
	sliderA.append("line") //bar
	.attr("x1", xMin)
	.attr("x2", xMax)
	.attr("y1", ySliderA)
	.attr("y2", ySliderA)
	.attr("class", "navBar")
	sliderA.append("text") //bar label
	.attr("x",  xMin - 20)
	.attr("y",  ySliderA - 14)
	.text("Point of Interest A Radius (mi)")
	sliderA.append("text") //min mile radius
	.attr("x",	xMin - 15)
	.attr("y",	ySliderA + 4)
	.text("0")
	sliderA.append("text") //max mile radius
	.attr("x",	xMax + 6)
	.attr("y",	ySliderA + 5)
	.text(sliderRadiusRange)
	currentRadius = sliderA.append("text") //value on slider
	.attr("x",	posSliderA[0])
	.attr("y",	ySliderA + 25)
	.text(radiusA_mi)
	sliderACircle = sliderA.append("circle") //point on slider
	.attr("r", 5)
	.attr("cx", posSliderA)
	.attr("cy", ySliderA)
	.call(d3.drag().on("drag",	update_sliderA));
	// Slider B
	sliderB.append("line") //bar
	.attr("class", "navBar")
	.attr("x1", xMin)
	.attr("x2", xMax)
	.attr("y1", ySliderB)
	.attr("y2", ySliderB)
	sliderB.append("text") //bar label
	.attr("x",  xMin - 20)
	.attr("y",  ySliderB - 14)
	.text("Point of Interest B Radius (mi)")
	sliderB.append("text") //min mile radius
	.attr("x",	xMin - 15)
	.attr("y",	ySliderB + 4)
	.text("0")
	sliderB.append("text") //max mile radius
	.attr("x",	xMax + 6)
	.attr("y",	ySliderB + 5)
	.text(sliderRadiusRange)
	var currentRadiusB = sliderB.append("text") //value on slider
	.attr("x",	posSliderB[0])
	.attr("y",	ySliderB + 25)
	.style("text-anchor", "middle")
	.text(radiusB_mi)
	var sliderBCircle = sliderB.append("circle") //point on slider
	.attr("r", 5)
	.attr("cx", posSliderB)
	.attr("cy", ySliderB)
	.call(d3.drag().on("drag",	update_sliderB));
	update_range_restaurants(filteredPoints, backgroundGroup)
	// Slider Score
	var ySliderScore = 300;
	sliderScore.append("line") //bar
	.attr("class", "navBar")
	.attr("x1", xMin)
	.attr("x2", xMax)
	.attr("y1", ySliderScore)
	.attr("y2", ySliderScore)
	sliderScore.append("text") //bar label
	.attr("x",  xMin - 20)
	.attr("y",  ySliderScore - 14)
	.text("Miniumum Inspection Score")
	sliderScore.append("text") //min label
	.attr("x",	xMin - 18)
	.attr("y",	ySliderScore + 7)
	.text("0")
	sliderScore.append("text") //max label
	.attr("x",	xMax + 5)
	.attr("y",	ySliderScore + 5)
	.text(sliderScoreRange)
	var currentMinScore = sliderB.append("text") //cur score
	.attr("x",	sliderScorePos[0])
	.attr("y",	ySliderScore + 25)
	.text(minScore)
	var sliderScoreCircle = sliderScore.append("circle")
	.attr("r", 5)
	.attr("cx", sliderScorePos)
	.attr("cy", ySliderScore)
	.call(d3.drag().on("drag",	update_sliderScore));
	// Draw spotlights
	// Point of interest B
	console.log(radiusA_px)
	outerCircleA = cursorGroupA.append("circle") // spotlight radius
	.attr("class", "outerRadius")
	.style("fill",	"red")
	.style("stroke", 1)
	.attr("r",	radiusA_px)
	.attr("cx",	posA[0].x)
	.attr("cy",	posA[0].y)
	.call(d3.drag().on("drag", update_A));
	innerCircleA = cursorGroupA.append("circle") // POI A
	.attr("class", "pointOfInterest")
	.attr("fill", "red")
	.text("Miniumum Inspection Score")
	.attr("cx",	posA[0].x)
	.attr("cy",	posA[0].y)
	.call(d3.drag().on("drag",	update_A));
	// Point of interest B
	outerCircleB = cursorGroupB.append("circle") // spotlight radius
	.attr("class", "outerRadius")
	.style("fill", "blue")
	.style("stroke", 1)
	.attr("r",	radiusB_px)
	.attr("cx",	posB[0].x)
	.attr("cy",	posB[0].y)
	.call(d3.drag().on("drag", update_B));
	innerCircleB = cursorGroupB.append("circle") // POI B
	.attr("class", "pointOfInterest")
	.attr("cx",	posB[0].x)
	.attr("cy",	posB[0].y)
	.call(d3.drag().on("drag", update_B));
	// Update functions
	// Slider A is dragged
	function update_sliderA(d) {
		if (d3.event.x < xMin) {
			posSliderA = [xMin];
		} else if (xMax < d3.event.x) {
			posSliderA = [xMax];
		} else {
			posSliderA = [d3.event.x];
		}
		radiusA_mi = ((xMin - posSliderA[0])*sliderRadiusRange)/(xMin - xMax)
		radiusA_px = get_radius_px(radiusA_mi, degreesPerPixel);
		sliderACircle.attr("cx", posSliderA)
		currentRadius.attr("x", posSliderA)
		.text(radiusA_mi)
		outerCircleA.attr("r", radiusA_px)
		closePoints = get_points(filteredPoints, radiusA_px, radiusB_px, posA, posB)
		update_restaurants(closePoints, plotGroup)
		return radiusA_px
	}
	// Slider B is dragged
	function update_sliderB(d) {
		if (d3.event.x < xMin) {
			posSliderB = [xMin];
		} else if (xMax < d3.event.x) {
			posSliderB = [xMax];
		} else {
			posSliderB = [d3.event.x];
		}
		radiusB_mi = ((xMin - posSliderB[0])*sliderRadiusRange)/(xMin - xMax)
		radiusB_px = get_radius_px(radiusB_mi, degreesPerPixel);
		sliderBCircle.attr("cx", posSliderB)
		currentRadiusB.attr("x", posSliderB)
		.text(radiusB_mi)
		outerCircleB.attr("r", radiusB_px)
		closePoints = get_points(filteredPoints, radiusA_px, radiusB_px, posA, posB)
		update_restaurants(closePoints, plotGroup)
		console.log(radiusB_px)
	}
	// Slider score is dragged
	function update_sliderScore(d) {
		if (d3.event.x < xMin) {
			sliderScorePos = [xMin];
		} else if (xMax < d3.event.x) {
			sliderScorePos = [xMax];
		} else {
			sliderScorePos = [d3.event.x];
		}
		minScore = ((xMin - sliderScorePos[0])*sliderScoreRange)/(xMin - xMax)
		sliderScoreCircle.attr("cx", sliderScorePos)
		currentMinScore.attr("x", sliderScorePos)
		.text(minScore)
		filteredPoints = filter_score(csvdata, minScore)
		update_range_restaurants(filteredPoints, backgroundGroup)
		closePoints = get_points(filteredPoints, radiusA_px, radiusB_px, posA, posB)
		update_restaurants(closePoints, plotGroup)
	}
	// Point A is dragged
	function update_A(d) {
		posA = [{x: d3.event.x, y: d3.event.y}];
		cursorGroupA.selectAll("circle")
		.attr("cx", d3.event.x)
		.attr("cy", d3.event.y);
		closePoints = get_points(filteredPoints, radiusA_px, radiusB_px, posA, posB)
		update_restaurants(closePoints, plotGroup)
	}
	// Point B is dragged
	function update_B(d) {
		cursorGroupB.selectAll("circle")
		.attr("cx", d3.event.x)
 		.attr("cy", d3.event.y);
		posB = [{x: d3.event.x, y: d3.event.y}];
		closePoints = get_points(filteredPoints, radiusA_px, radiusB_px, posA, posB)
		update_restaurants(closePoints, plotGroup)
	}
};

// Update restaurants and highlight any intersecting restaurant points
function update_restaurants(closePoints, plotGroup) {
	var circles = plotGroup.selectAll("circle")
	.data(closePoints)
	circles.enter().append("circle")
	.merge(circles)
	.attr("class", "highlightedRestaurants")
	.attr("cx", function (d) {return d.proj[0];})
	.attr("cy", function (d) {return d.proj[1];})
	circles.exit().remove();
}
// Plot all restaurants in given range
function update_range_restaurants(filteredPoints, backgroundGroup) {
	var circles = backgroundGroup.selectAll("circle")
	.data(filteredPoints)
	circles.enter().append("circle")
	.merge(circles)
	.attr("class", "allRestaurants")
	.attr("cx", function (d) {return d.proj[0];})
	.attr("cy", function (d) {return d.proj[1];})
	circles.exit().remove();
}

// Returns distance in miles between 2 points
function get_dist(loc1, loc2){
	var radians = d3.geoDistance(loc1, loc2);
	var earth_radius = 3959;  // miles
	var dist = earth_radius * radians;
	return dist;
}

// Returns radius in pixels given a radius in miles
function get_radius_px(radius, degreesPx){
	var earth_radius = 3959;  // miles
	var radians = radius/earth_radius;
	var degrees = (radians * 180)/3.14
	var radiusPx = Math.abs(degrees/degreesPx);
	return radiusPx;
}

// Get points within a given distance
function get_points(data, radiusA_px, radiusB_px, posA, posB){
	var closePoints = data.filter(function (d) {
		var distA = Math.abs(Math.sqrt(
			Math.pow((d.proj[0] - posA[0].x), 2) + Math.pow((d.proj[1] - posA[0].y),2)
			));
		var distB = Math.abs(Math.sqrt(Math.pow((d.proj[0] - posB[0].x), 2) + Math.pow((d.proj[1] - posB[0].y),2)
			));
		return (distA < radiusA_px && distB < radiusB_px);
	});
	return closePoints;
}

// Filter scores that are not at or above minimum score
function filter_score(data, min) {
	var filteredPoints = data.filter(function (d) {
		return d.inspection_score >= min
	});
	return filteredPoints
}