var SPI = require( "spi" );
var sleep =require("sleep");
var request = require("request")

var Stopwatch = require("node-stopwatch").Stopwatch;

var stopwatch = Stopwatch.create();


function sendConsumptionDataToEnergyUsageService(amps,consumption){

// JSON to be passed to the QPX Express API
    var requestData = {
      "amps" : 0,
      "consumption" : 0,
      "customerId" : "1234",
      "date" : new Date().toJSON().slice(0,10).replace(/-/g,'/')
    }

    // QPX REST API URL (I censored my api key)
    url = "http://energy-usage-673ec232-1.8254f0a7.cont.dockerapp.io:32772/api/energy-usage"

    // fire request
    request({
        url: url,
        json: true,
        multipart: {
            chunked: false,
            data: [
                {
                    'content-type': 'application/json',
                    body: requestData
                }
            ]
        }
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
        }
        else {

            console.log("error: " + error)
            console.log("response.statusCode: " + response.statusCode)
            console.log("response.statusText: " + response.statusText)
        }
    })
}

var options = {
	'mode' : SPI.MODE['MODE_0'],
	'chipSelect' : SPI.CS['none']
};

console.log('setting up SPI device');

var spi = new SPI.Spi('/dev/spidev0.0',options, function(s) { s.open();});

console.log('setting up buffers');

var txbuf = new Buffer([0x80,0x00]);
var rxbuf = new Buffer([0x00,0x00]);

stopwatch.start();

var lastseconds = stopwatch.elapsed.seconds;
var totalKwh = 0;

while (true) {
 // console.log(simplespi.send( "80" )); // 128
 console.log('Checking current energy usage');
 spi.transfer(txbuf,rxbuf,function(device, buf){
		var b1 = buf[0];
		var b2 = buf[1];

		var amps = (b1*256+b2) - 332;
		if (amps < 0)
			amps = 0;

		amps = (amps / 1714) * 100;
		amps = Math.round(amps);

		var kw = (240 * amps) / 1000;

		kwh = kw * (stopwatch.elapsed.seconds - lastseconds) / (60*60);

		lastseconds = stopwatch.elapsed.seconds;

		totalKwh += kwh;

    sendConsumptionDataToEnergyUsageService(amps,kw);
		console.log("Current consumption = " + amps + " apms");
		console.log("Current consumption = " + kw + " kw");
		console.log("Total consumption = " + totalKwh.toFixed(2) + " kwh");

		sleep.sleep(30);
	});
}
