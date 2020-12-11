var geojson = {}

var context;
var projection;
var geoGenerator;

var CANVAS_WIDTH;
var CANVAS_HEIGHT;

var doUpdateTrackingData = false; // if true, then trigger a periodic update from the server
var TRACKING_UPDATE_INTERVAL = 500; // milliseconds


var DISPLAY_INTERVAL = 50; // in milliseconds
var SLEW_INCREMENT = 6;
var latSlewAmount  = 0;
var longSlewAmount = 0;

var BACKGROUND_COLOR = "#ddddcc";

var GRID_COLOR = "#dee";

var LAND_COLOR = "#d0d0d0";
var BOUNDARY_COLOR = "#004";

var WATER_COLOR = "#cde";

var MARKER_COLOR = "#ff3020";
var MARKER_TEXT_COLOR = "#ff3322";

var assetLatitude = NaN;
var assetLongitude = NaN;


var currentRotation = [0.0, 0.0, 0.0]; // yaw, pitch, roll
  // these are the view rotation values used to bring the asset location into view in the display
  // yaw = 0.0 centers Greenwich, England laterally in the display
  //    (yaw -30 centers the Black Sea in the display; yaw +122 centers Seattle)
  // pitch = 0.0 centers the equator vertically in the display
  //    (pitch -45 centers the northern hemisphere, i.e. England, in the display)
  //    (pitch +45 centers the southern hemisphere in the display)

   function start(canvas, width, height) {
      context = canvas.getContext('2d');
      CANVAS_WIDTH = width;
      CANVAS_HEIGHT = height;

      projection = d3.geoOrthographic()
         .scale(300)
         .center([0.0,0.0])
         .translate([CANVAS_WIDTH/2,CANVAS_HEIGHT/2]);

      geoGenerator = d3.geoPath()
         .projection(projection)
         .context(context);

      // issue request for map data
      var mapDataURL = "https://gist.githubusercontent.com/d3indepth"
        + "/f28e1c3a99ea6d84986f35ac8646fac7/raw"
        + "/c58cede8dab4673c91a3db702d50f7447b373d98/ne_110m_land.json";

      d3.json(mapDataURL, function(err, json) {
         geojson = json;
         updateDisplay();
      });
   }



   // this function converts a coordinate in the range -N ... +N to
   // one in the range 0..2N, to simplify logic around coordinate differences
   function normalize( x, size) {
      if (x >= 0) return x;
      else return x + size;
   }


   // When the location changes, it would be easy to snap to a view that makes
   // the new position visible, but that would be visually jarring; much better to
   // pan there so the user's eye can track where the view is headed. That's what
   // this function does.

   function updateViewRotation() {
      var displayLongitude = 0.0 - currentRotation[0];
      var displayLatitude = 0.0 - currentRotation[1];

      if (!isNaN(assetLongitude)) {

         var disparity = normalize(assetLongitude, 360) - normalize(displayLongitude, 360);

         console.log("displayLong=" + displayLongitude + ", assetLong=" + assetLongitude
                   + ", disparity=" + disparity);

         if (Math.abs(disparity) < SLEW_INCREMENT) {
            displayLongitude = assetLongitude;
            longSlewAmount = 0; // stop slewing
         } else if (longSlewAmount != 0) {
            displayLongitude += longSlewAmount;
         } else {
            if ((disparity > 0) && (disparity <= 180)) longSlewAmount = SLEW_INCREMENT;
            else longSlewAmount = 0 - SLEW_INCREMENT;
         }
      }
      currentRotation[0] = 0.0 - displayLongitude; // yaw amount for rotation call


      if (!isNaN(assetLatitude)) {
    
         var disparity = normalize(assetLatitude, 180) - normalize(displayLatitude, 180);

         console.log("displayLat=" + displayLatitude + ", assetLat=" + assetLatitude
                   + ", disparity=" + disparity);

         if (Math.abs(disparity) < SLEW_INCREMENT) {
            displayLatitude = assetLatitude;
            latSlewAmount = 0; // stop slewing
         } else if (latSlewAmount != 0) {
            displayLatitude += latSlewAmount;
         } else {
            if ((disparity > 0) && (disparity <= 180)) latSlewAmount = SLEW_INCREMENT;
            else latSlewAmount = 0 - SLEW_INCREMENT;
         }
      }
      currentRotation[1] = 0.0 - displayLatitude; // pitch amount for rotation call
//console.log("currentRotation = [" + currentRotation[0] + "," + currentRotation[1]
//    + "," + currentRotation[2] + "]");
}


// this is the main event loop for generating the animated globe display

function updateDisplay() {

  updateViewRotation();
  projection.rotate(currentRotation);
  //projection.rotate([-30, -45]); // this would use static values to set the view


  //context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // draw globe background -- this is the ocean color
  context.beginPath();
  context.fillStyle = WATER_COLOR;
  context.arc(CANVAS_WIDTH/2,CANVAS_HEIGHT/2,CANVAS_HEIGHT/2, 0, 2 * Math.PI);
  context.fill();

  context.lineWidth = 0.5;

  // draw map grid lines
  var graticule = d3.geoGraticule();
  context.beginPath();
  geoGenerator(graticule());
  context.strokeStyle = GRID_COLOR;
  context.stroke();


  // draw landmass boundaries
  context.beginPath();
  geoGenerator({type: 'FeatureCollection', features: geojson.features});
  context.fillStyle = LAND_COLOR;
  context.fill();
  context.strokeStyle = BOUNDARY_COLOR;
  context.stroke();

  // draw asset position
  if (!isNaN(assetLatitude) && !isNaN(assetLongitude)) {

    // draw position marker
    context.beginPath();
    var circle = d3.geoCircle()
      .center([assetLongitude, assetLatitude])
      .radius(2);
    geoGenerator(circle());
    context.fillStyle = MARKER_COLOR;
    var oldAlpha = context.globalAlpha;
    context.globalAlpha = 0.6;
    context.fill();
    context.globalAlpha = oldAlpha;

    // draw asset position (numeric)
    context.font = "18px Helvetica";
    context.fillStyle = MARKER_TEXT_COLOR;
    context.fillText("Lat/Lon =", 600, 30);
    var positionText = roundForDisplay(assetLatitude,2) + ","
                     + roundForDisplay(assetLongitude,2);
    context.fillText(positionText, 680, 30);
  }

  setTimeout(updateDisplay, DISPLAY_INTERVAL);
}

function roundForDisplay(x,p){
  console.log(x,p);
  return parseFloat(Math.round(x * Math.pow(10, p)) /Math.pow(10,p)).toFixed(p);
}


// this is used for manual testing, so the user can set coordinates directly

function manualPositionUpdate() {
  var newLatitude = Math.fround(document.getElementById("latitude_entry").value);
  var newLongitude = Math.fround(document.getElementById("longitude_entry").value);
  if (!isNaN(newLatitude) && !isNaN(newLongitude)) {
    console.log("setting new position: " + newLatitude + "," + newLongitude);
    assetLatitude = newLatitude;
    assetLongitude = newLongitude;
  }
}


   function commIndicator(color, offset) {
      context.fillStyle = color;
      context.fillRect( 780 + offset, 590, 5, 5 );
   }

   // AJAX call to get current data from the server
   function getTrackingData()
   {
      if (window.XMLHttpRequest)
      {

          var assetId = document.getElementById("assetId").value;
          console.log("Requesting tracking data for asset " + assetId);
          var request = new XMLHttpRequest();
          request.onreadystatechange = statusUpdateResponse;
          request.open("GET", "http://localhost:8001/asset/" + assetId, true);
          request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
          request.setRequestHeader('Cache-Control', 'no-cache');
          request.setRequestHeader('auth-token', '1D353F86D4A9');
          request.send(null);
          commIndicator("green", 0);

          if (doUpdateTrackingData) { 
             setTimeout(getTrackingData, TRACKING_UPDATE_INTERVAL);
          }
      }
   }

   function toggleTracking() {
      doUpdateTrackingData = !doUpdateTrackingData;
      var trackButton = document.getElementById("trackButton");
      if (doUpdateTrackingData) {
         trackButton.innerText = "\u25FC Stop Tracking";
         getTrackingData();
      } else {
         trackButton.innerText = "\u25B6  Start Tracking";
      }
   }

   // this function is executed when the asynchronous AJAX call finishes and the
   // system status data is ready to be parsed. It's JSON containing several
   // objects with state information.
   function statusUpdateResponse()
   {
       var DONE = this.DONE || 4;
       if (this.readyState === DONE)
       {
          //console.log(this.readyState);
          console.log(this.responseText);

          var responseObj = null;
          try {
             responseObj = JSON.parse(this.responseText);
          } catch(err) {
             commIndicator("red", 10);
             return;
          }

          commIndicator("blue", 10);
          console.log(responseObj);
          if (responseObj != null) {

             updateAssetMetadata( responseObj.id,
                                  responseObj.name,
                                  responseObj.agency,
                                  responseObj.facility,
                                  responseObj.project);

             var lastUpdate = responseObj.lastUpdate;
             console.log("lastUpdate = " + lastUpdate);
             if (lastUpdate != null) {
                updateAssetState( lastUpdate.status,
                                  lastUpdate.latitude, lastUpdate.longitude, lastUpdate.depth);
             }
          }
       }
       else {
          commIndicator("red", 10);
       }
   }

   function updateAssetMetadata(assetId, name, agency, facility, project) {
      document.getElementById("assetDescription").innerText = assetId + " " + name;
      document.getElementById("assetAgency").innerText = agency
      document.getElementById("assetFacility").innerText = facility;
      document.getElementById("assetProject").innerText = project;
   }
   function updateAssetState(status, lat, long, depth) {
      document.getElementById("assetStatus").innerText = status;
      document.getElementById("assetLatitude").innerText = lat;
      document.getElementById("assetLongitude").innerText = long;
      document.getElementById("assetDepth").innerText = depth;

      assetLatitude  = parseFloat(lat);
      assetLongitude = parseFloat(long);

   }