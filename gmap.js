// create generic icon
var icon = new GIcon();
icon.image = "dot.png";
icon.shadow = "dot.png";
icon.iconSize = new GSize(14, 14);
icon.shadowSize = new GSize(14, 14);
icon.iconAnchor = new GPoint(10, 10);
icon.infoWindowAnchor = new GPoint(10, 10);

function load() {
	if (GBrowserIsCompatible()) {
		var map = new GMap2(document.getElementById("map"));
		
		var bus_stops = [];

		// ============================================================
		// == Create the GTileLayer ===================================
		var tilelayers = [new GTileLayer(new GCopyrightCollection("Albany CDTA Bus Map"),7,14)];

		tilelayers[0].getTileUrl = function (a,b) {			
			return "http://www.fyrebolt.org/gmap_ua/maptiles/"+b+"_"+(a.x)+"_"+(a.y)+".gif";
		};

		tilelayers[0].getCopyright = function(a,b) {
			return {prefix:"Map: ", copyrightTexts:["CDTA Bus"]};
		};

		tilelayers[0].getOpacity = function(a) {
			return 1;
		};

		// ==============================================================
		// ====== Create a two layer "CDTA Streets" layer ===============

		// === It has two layers; one is the "CDTA" map and the other is the top layer from G_HYBRID_MAP
		var htilelayers = [
			G_NORMAL_MAP.getTileLayers()[0],  // a reference to the NORMAL tile layer 
			tilelayers[0]                     // a reference to the tile layer from the custom map
		];

		var custommap2 = new GMapType(htilelayers, G_HYBRID_MAP.getProjection(), "CDTA Streets", {maxResolution:18,minResolution:7,errorMessage:_mMapError});

		// === Add it to the list of map types ===
		map.addMapType(custommap2);

		map.addControl(new GMapTypeControl());
		map.addControl(new GSmallMapControl());

		map.setCenter(new GLatLng(42.6877352419141,-73.75980377197266), 12, custommap2);
		
		var request = GXmlHttp.create();
		request.open("GET", "xml/bus_stops.xml", true);
		request.onreadystatechange = function() {
			if (request.readyState == 4) {
				var xmlDoc = request.responseXML;
			
				// obtain the array of markers and loop through it
				var stops = xmlDoc.documentElement.getElementsByTagName('stop');

				for (var i = 0; i < stops.length; i++) {
					// create a point
					var latlng = stops[i].getElementsByTagName('coord');
					var point = new GPoint(parseFloat(latlng[0].getAttribute("lng")), parseFloat(latlng[0].getAttribute("lat")));
					
					var add = stops[i].getElementsByTagName('address')[0].firstChild.nodeValue;
//					alert(add);
					var aText = ["<div id='infowindow' style='white-space: nowrap;'><span class='stationname'>", add, "</span><br/>"];
					var aTip = ["<div class='markerTooltip'><span class='stationname_sm'>", add, "</span><br/>"];

					// get line images
					var mybus = stops[i].getElementsByTagName('busline');
					var count = mybus.length;
					for (k=0;k<count; k++){
						var buspic = mybus[k].getAttribute("image");
						aText.push('<a style="text-decoration:none;" href="http://www.cdta.org/', mybus[k].getAttribute("url"), '" target="_blank"><img style="border:none; padding-top:2px;" src="images/', buspic, '" width="31" height="30" alt=""></a>');
						aTip.push('<img style="border:none; padding-top:2px;" src="images/', buspic, '" width="16" height="15" alt="">');
					}

					aText.push("<br/><i>click&nbsp;on&nbsp;the&nbsp;icon&nbsp;for&nbsp;CDTA&nbsp;info</i></div>");
					aTip.push("<br/></div>");

					var m = new GxMarker(point, icon);
					m.setTooltip( aTip.join("") );
					var n = bus_stops.length;
					
//					bus_stops[n] = {};
//					bus_stops[n].n = n;
					
					bus_stops[n] = m;

					GEvent.addListener(m, "click", function() {
						m.OpenInfoWindowHtml(aText.join(""));
					});
					
					// create the marker
					map.addOverlay(m);
					
//					alert(bus_stops[n].aText.join(""));
				}
			}
			// ================================================
		}
	      	request.send(null);

	}
}


// A function to create a tabbed marker and set up the event window
// This version accepts a variable number of tabs, passed in the arrays htmls[] and labels[]
function createTabbedMarker(point,tabs,icon,customTip) {

	var marker = new GMarker(point,icon); 

        marker.tooltip = 'customTip';  // <-- ToolTip

        var marker_num = bus_stops.length;

        marker.marker_num = marker_num;
        marker.tabs = tabs;
        bus_stops[marker_num] = marker;
        
        GEvent.addListener(bus_stops[marker_num], "click", function() {
		marker.openInfoWindowTabsHtml(bus_stops[marker_num].tabs);
        });
        
//        map.addOverlay(marker);

	//--------------- ToolTip
	//  ======  The new marker "mouseover" and "mouseout" listeners  ======
	GEvent.addListener(bus_stops[marker_num],"mouseover", function() {
		showTooltip(bus_stops[marker_num]);
	});        
	GEvent.addListener(bus_stops[marker_num],"mouseout", function() {
		tooltip.style.visibility="hidden"
	});        
	//--------------- ToolTip End

	return marker;
}

// A function to create a non-tabbed marker and set up the event window
function createTabbedMarker(point,icon,customHtml,customTip) {

	var marker = new GMarker(point,icon); 

        marker.tooltip = 'customTip';  // <-- ToolTip

        var marker_num = bus_stops.length;

        marker.marker_num = marker_num;
        marker.tabs = tabs;
        bus_stops[marker_num] = marker;
        
        GEvent.addListener(bus_stops[marker_num], "click", function() {
		marker.openInfoWindowHtml(customHtml);
        });

	//--------------- ToolTip
	//  ======  The new marker "mouseover" and "mouseout" listeners  ======
	GEvent.addListener(bus_stops[marker_num],"mouseover", function() {
		showTooltip(bus_stops[marker_num]);
	});        
	GEvent.addListener(bus_stops[marker_num],"mouseout", function() {
		tooltip.style.visibility="hidden"
	});        
	//--------------- ToolTip End

	return marker;
}

// ====== This function displays the tooltip ======
// it can be called from an icon mousover or a sidebar mouseover
function showTooltip(marker) {
	tooltip.innerHTML = bus_stops[marker_num].tooltip;
	
	var point = marker.getPoint();
	var offset=map.getCurrentMapType().getProjection().fromLatLngToPixel(marker.getPoint(),map.getZoom());
	var anchor=marker.getIcon().iconAnchor;
	var width=marker.getIcon().iconSize.width;
	var height=tooltip.clientHeight;
	var pos = new GControlPosition(G_ANCHOR_TOP_LEFT, new GSize(offset.x - point.x - anchor.x + width, offset.y - point.y -anchor.y -height)); 
	pos.apply(tooltip);
	tooltip.style.visibility="visible";
}

// This function picks up the click and opens the corresponding info window
function myclick(i) {
	GEvent.trigger(bus_stops[i], "click");
}

function getNodeValue(Element) {
if ((Element.length>0) && Element[0] && Element[0].firstChild && Element[0].firstChild.nodeValue)
   return Element[0].firstChild.nodeValue;
}