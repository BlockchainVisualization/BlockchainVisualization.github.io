var map;
var hits = 0;
var tps = 0;
var seconds = 0;
var highest = {
	"amount" : 0,
	"hash" : 0
};
var countries = {};

$(document).ready(function() {
	init();
});

$(window).resize(function() {
	setWindowSize();
});

function init() {
	setWindowSize();
	setupWebSocket();
	
	var t = setInterval(timer, 1000);

	var aboutButton = document.getElementById("aboutButton");
	aboutButton.addEventListener("click", function() {
		if ($('#aboutPopup').css("visibility") == "hidden") {
			$('#aboutPopup').css("visibility", "visible");
		} else {
			$('#aboutPopup').css("visibility", "hidden");
		}
	});

	document.getElementById('map').addEventListener("click", function() {
		$('#aboutPopup').css("visibility", "hidden");
	});
}

var timer = function() {
	seconds += 1;
	tps = hits / seconds;
	var transDom = document.getElementById("transactions");
	transDom.innerHTML = "Transactions: " + hits;

	var tpsDom = document.getElementById("tps");
	tpsDom.innerHTML = "Transactions Per Second: " + tps.toFixed(3);

	var highestDom = document.getElementById("highest");
	if (highest.hash != 0) {
		blockchainLink = "https://blockchain.info/tx/" + highest.hash;
		innerText = (highest.amount / 100000000).toFixed(5) + " BTC";
		highestDom.innerHTML = "Largest Transaction: <a href='" + blockchainLink + "' target='_blank'>" + innerText + "</a>";
	} else {
		highestDom.innerHTML = "Largest Transaction: " + (highest.amount / 100000000).toFixed(5) + " BTC";
	}
}

function setupMap() {
	var mapOptions = {
	    zoom: 2,
	    center: {lat: 0, lng: 0},
	    disableDefaultUI: true,
	    zoomControl: false,
	    mapTypeControl: false,
	    scaleControl: false,
	    streetViewControl: false,
	    rotateControl: false
  	}
	map = new google.maps.Map(document.getElementById('map'), mapOptions);
}

function setupWebSocket() {
	var bitcoinSocket = new WebSocket("wss://ws.blockchain.info/inv");
	bitcoinSocket.onopen = function (event) {
		var msg = {
			op: "unconfirmed_sub"
		};
		bitcoinSocket.send(JSON.stringify(msg));
	}

	bitcoinSocket.onmessage = function (event) {
		hits += 1;
		var data = jQuery.parseJSON(event.data);
		var ip = data.x.relayed_by;
		if (ip != undefined && ip != "127.0.0.1") {
			findIPLocation(ip);
		}
		var amounts = data.x.out;
		for (var i = 0; i < amounts.length; i++) {
			var val = amounts[i]['value'];
			if (val != undefined && val > highest.amount) {
				highest.amount = val;
				highest.hash = data.x.hash;
			}
		}
	}
}

// Telize API, convert ip address to Lat/Lng approximation
function findIPLocation(ip) {
	$.getJSON("https://freegeoip.net/json/" + ip,
		function(json) {
			if ("latitude" in json && "longitude" in json) {
				plotAddress([json.latitude, json.longitude]);
			}
			if (json.country_name in countries) {
				countries[json.country_name] += 1;
			} else {
				countries[json.country_name] = 1;
			}
		}
	);
}

function plotAddress(loc) {
	var lat = parseFloat(loc[0]);
	var lng = parseFloat(loc[1]);
	var latlng = {lat : lat, lng : lng};
	var marker = new google.maps.Marker({
		position: latlng,
	});

	marker.setMap(map);
}

function setWindowSize() {
	var width = document.body.clientWidth;
	var height = document.body.clientHeight;

	$('body').css('height', (height - 50) + "px");

	var pos = $('#aboutButton').offset();
	$('#aboutPopup').css('left', pos.left - $('#aboutPopup').width() / 4);
	$('#aboutPopup').css('top', height - 50 - $('#aboutPopup').height());
}