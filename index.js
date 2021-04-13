const SerialPort = require('serialport');
const utils = require('./utils');

const serialport = new SerialPort("/dev/ttyUSB0", {
	baudRate: 9600,
	autoOpen: false,
});

const EL = '\r\n';
const SOH = String.fromCharCode(1);
const STX = String.fromCharCode(2);
const ETX = String.fromCharCode(3);
const ACK = String.fromCharCode(6);
const SUB = String.fromCharCode(26);
let seed = '';
let step = 0;

serialport.open((err) => {
	console.log(`Port open: ${err? err : "ok"}`);
});

serialport.on('data', (data) => {
	const string = data.toString();
	console.log("=>", data.toString('hex'), string);
	step++;

	if (step === 1) {
		readCommand();
	}

	if (step === 2) {
		seed = string.substring(5);
	}

	if (step === 3) {
		seed += string;
		enterPassword(seed);
	}
});

serialport.on('open', () => {
	wakeupCommand();
});

const wakeupCommand = () => {
	serialport.write(`/?!${EL}`, err => {
		if (err) console.err(err);
		else console.log("wakeup:");
	});
};

const readCommand = () => {
	serialport.write(`${ACK}051${EL}`, err => {
		if (err) console.err(err);
		else console.log("Read:");
	});
};

const enterPassword = (seed) => {
	const password = utils.elsterEncrypt('M_KH_DOC', seed);
	console.log('P:', password);
	serialport.write(`${SOH}P2${STX}(${password})${ETX}`, err => {
		if (err) console.err(err);
		else console.log("Password:");
	});
};

process.on('SIGINT', function () {
	serialport.close((err) => {
		console.log('close', err);
	});
});