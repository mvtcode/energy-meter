const SerialPort = require('serialport');
const utils = require('./utils');

const serialport = new SerialPort("COM6", {
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
let result = ""
serialport.open((err) => {
	console.log(`Port open: ${err ? err : "ok"}`);
});

serialport.on('data', (data) => {
	const string = data.toString();
	console.log("=>", data.toString('hex'), string);
	// step++;
	if (step === 0) {
		result += string
		if (string.match('\n')) {
			step++;
			console.log(result)
			result = ""
		}
	}

	if (step === 1) {
		if (result == "") {
			readCommand();
			result += " "
		} else {
			result += string
			if (string.match(ETX)) {
				step++;
				console.log(result)
				result = "";
			}
		}
	}
	if (step === 2) {
		if (result == "") {
			enterPassword();
			result += " "
		} else {
			result += string
			if (string.match(ACK)) {
				step++;
				result = "";
			}
		}
		// enterPassword();
	}
	if (step === 3) {
		readData()
		step++;
	}
});

serialport.on('open', () => {
	wakeupCommand();
});

const wakeupCommand = () => {
	serialport.write(Buffer.from(`/?!${EL}`), err => {
		if (err) console.err(err);
		else console.log("wakeup:");
	});
};

const readCommand = () => {
	const passwordHEX = utils.string2Hex(utils.toHex("051")).toUpperCase()
	console.log(passwordHEX);
	serialport.write(Buffer.from(`${ACK}051${EL}`), err => {
		if (err) console.err(err);
		else console.log("Read:");
	});
};

const enterPassword = () => {
	console.log('P:', "M_KH_DOC");
	const BCC =utils.bcc(`P2${STX}(M_KH_DOC)${ETX}`)
	const command =`${SOH}P2${STX}(M_KH_DOC)${ETX}${BCC}`
	serialport.write(command, err => {
		if (err) console.err(err);
		else console.log("Password: ",command);
	});
};

const readData = () => {
	const BCC =utils.bcc(`R1${STX}2(00000000)${ETX}`)
	const command = `${SOH}R1${STX}2(00000000)${ETX}${BCC}`
	serialport.write(command, err => {
		if (err) console.err(err);
		else console.log(`Read Data 1: ==> `,command);
	});
};

process.on('SIGINT', function () {
	serialport.close((err) => {
		console.log('close', err);
	});
});