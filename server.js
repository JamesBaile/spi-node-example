var SPI = require( "spi" );
var sleep =require("sleep");
var request = require("sync-request");

var Stopwatch = require("node-stopwatch").Stopwatch;

var stopwatch = Stopwatch.create();


function sendConsumptionDataToEnergyUsageService(amps,consumption){
  var d = new Date().toLocaleString();


  var requestData = {
      "amps" : 10,
      "consumption" : 1.2,
      "customerId" : "2000",
      "date" : d
    }

  url = "http://energy-usage-673ec232-1.8254f0a7.cont.dockerapp.io:32772/api/energy-usage"

  console.log('Sending data to ' + url);

    var res = request('POST', url, {
        json: requestData
      });
    return res;
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

while (true) {

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

    var response = sendConsumptionDataToEnergyUsageService(amps,kw);

    console.log('response status code ' + response.statusCode);
    sleep.sleep(30);
	});
}
