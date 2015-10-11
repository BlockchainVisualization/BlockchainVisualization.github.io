var IP_URL = "http://45.55.27.243:3000/ip/"
var width;
var height;
var map;
var geocoder;
var countries = {};
var hits = 0;
var tps = 0;
var seconds = 0;
var highest = 0;

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
	highestDom.innerHTML = "Largest Transaction: " + (highest / 100000000).toFixed(5) + " BTC";
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
	geocoder = new google.maps.Geocoder;
}

function setupWebSocket() {
	var bitcoinSocket = new WebSocket("wss://ws.blockchain.info/inv");
	bitcoinSocket.onopen = function (event) {
		console.log("Socket opened");
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
			if (val != undefined && val > highest) {
				highest = val;
			}
		}
	}
}

function findIPLocation(ip) {
	$.get(IP_URL + ip, "json").done(function(data) {
		console.log(data);
		plotAddress(data.split(","));
	});
}

function plotAddress(loc) {
	var lat = parseFloat(loc[0]);
	var lng = parseFloat(loc[1]);
	var latlng = {lat : lat, lng : lng};
	var marker = new google.maps.Marker({
		position: latlng,
	});

	marker.setMap(map);

	//getCountry(latlng);
}

function getCountry(latlng) {
	geocoder.geocode({'location':latlng}, function(results, status) {
		if (status === google.maps.GeocoderStatus.OK) {
			if (results[1]) {
				if (results[1].address_components[5] != undefined) {
					var countryName = results[1].address_components[5].long_name;
					console.log(countryName);
					if (countryName in countries) {
						countries[countryName] += 1;
					} else {
						countries[countryName] = 1;
					}
					updateCountryChart();
				}
			}
		}
	});

}

function updateCountryChart() {
	$('#countries').empty();
	var cList = $('#countries');
	$.each(countries, function(key, value) {
		var li = $('<li/>')
			.appendTo(cList);
		var e = $('<p/>')
			.text(key + " : " + value)
			.appendTo(li);
	});
}

function setWindowSize() {
	width = document.body.clientWidth;
	height = document.body.clientHeight;

	$('body').css('height', (height - 50) + "px");

	var pos = $('#aboutButton').offset();
	$('#aboutPopup').css('left', pos.left - $('#aboutPopup').width() / 4);
	$('#aboutPopup').css('top', height - 50 - $('#aboutPopup').height());
}