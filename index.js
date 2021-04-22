const axios = require('axios');
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

let step = 0;
let result = ""

const dataSend = {
  time: "",
  meterId: "",
  v: 0,
  a: 0,
  kWh: 0,
  w: 0
}
serialport.open((err) => {
  console.log(`Port open: ${err ? err : "ok"}`);
});

serialport.on('data', (data) => {
  const string = data.toString();
  console.log("=>", data.toString('hex'), string);

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
  }

  // meter ID
  if (step === 3) {
    if (result == "") {
      readMeterId();
      result += " "
    } else {
      result += string
      if (string.match(ETX)) {
        console.log("Id:", utils.getId(result));
        dataSend.meterId = utils.getId(result)
        step++;
        result = ""
      }
    }
  }

  //date time
  if (step === 4) {
    if (result == "") {
      readDataTime();
      result += " "
    } else {
      result += string
      if (string.match(ETX)) {
        console.log(result);
        console.log("Time: ", utils.getTimeFormMess(result));
        dataSend.time = utils.getTimeFormMess(result)
        step++;
        result = ""

      }
    }
  }


  // data 
  if (step === 5) {
    if (result == "") {
      readDataMeter();
      result += " "
    } else {
      result += string
      if (string.match(ETX)) {
        console.log("Data: ", utils.getDataMeter(result));
        const dataMeter = utils.getDataMeter(result)
        dataSend.v = dataMeter[0]
        dataSend.a = dataMeter[2] / 10
        step++;
        result = ""
      }
    }
  }
  if (step === 6) {
    if (result == "") {
      readDataEnergy();
      result += " "
    } else {
      result += string
      if (string.match(ETX)) {
        console.log("Energy: ", utils.getDataEnergy(result));
        const dataEnergy = utils.getDataMeter(result)
        dataSend.kWh = dataEnergy[0]
        step++;
        result = ""
      }
    }
  }

  if (step === 7) {
    if (result == "") {
      close();
      console.log(dataSend);
      axios.post('http://localhost:9000/meter', {
        ...dataSend
      })
        .then(function (response) {
          // handle success
          console.log("Send Success");
        })
        .catch(function (error) {
          // handle error
          console.log(error.message);
        })
        .then(function () {
          // always executed
        });
      setTimeout(wakeupCommand, 30000)
      step = 0;
    }

  }

  // if (step === 5) {
  // 	if (result == "") {
  // 		readW();
  // 		result += " "
  // 	} else {
  // 		result += string
  // 		if (string.match(ETX)) {
  // 			console.log("Energy: ",utils.getW(result));
  //       const dataEnergy = utils.getW(result)
  // 			step++;
  // 			result=""
  // 		}
  // 	}
  // }
});

serialport.on('open', () => {
  wakeupCommand();
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
  const BCC = utils.bcc(`P2${STX}(M_KH_DOC)${ETX}`)
  const command = `${SOH}P2${STX}(M_KH_DOC)${ETX}${BCC}`
  serialport.write(command, err => {
    if (err) console.err(err);
    else console.log("Password: ", command);
  });
};

const readDataTime = () => {
  const BCC = utils.bcc(`R1${STX}1${ETX}`)
  const command = `${SOH}R1${STX}1${ETX}${BCC}`
  serialport.write(command, err => {
    if (err) console.err(err);
    else console.log(`Read Data Time: ==> `, command);
  });
};

const readMeterId = () => {
  const BCC = utils.bcc(`R1${STX}0${ETX}`)
  const command = `${SOH}R1${STX}0${ETX}${BCC}`
  serialport.write(command, err => {
    if (err) console.err(err);
    else console.log(`Read Data Id meter: ==> `, command);
  });
};
const readDataEnergy1 = () => {
  const BCC = utils.bcc(`R1${STX}6${ETX}`)
  const command = `${SOH}R1${STX}6${ETX}${BCC}`
  serialport.write(command, err => {
    if (err) console.err(err);
    else console.log(`Read Data Meter: ==> `, command);
  });
};

const readDataEnergy = () => {
  const BCC = utils.bcc(`R1${STX}6(00000000)${ETX}`)
  const command = `${SOH}R1${STX}6(00000000)${ETX}${BCC}`
  serialport.write(command, err => {
    if (err) console.err(err);
    else console.log(`Read Data Meter: ==> `, command);
  });
};

const readW = () => {
  const BCC = utils.bcc(`R1${STX}P(00000000)${ETX}`)
  const command = `${SOH}R1${STX}P(00000000)${ETX}${BCC}`
  serialport.write(command, err => {
    if (err) console.err(err);
    else console.log(`Read Data Meter: ==> `, command);
  });
};

const readDataMeter = () => {
  const BCC = utils.bcc(`R1${STX}<(00000000)${ETX}`)
  const command = `${SOH}R1${STX}<(00000000)${ETX}${BCC}`
  serialport.write(command, err => {
    if (err) console.err(err);
    else console.log(`Read Data Meter: ==> `, command);
  });
};
const reset = () => {
  serialport.on('open', () => {
    wakeupCommand();
  });
}
const close = () => {
  const BCC = utils.bcc(`B0${STX}()${ETX}`)
  const command = `${SOH}B0${STX}()${ETX}${BCC}`
  serialport.write(command, err => {
    if (err) console.err(err);
    else console.log(`Logout: ==> `, command);
  });
};

const readDataMeter1 = () => {
  const BCC = utils.bcc(`R1${STX}<(03000000)${ETX}`)
  const command = `${SOH}R1${STX}<(03000000)${ETX}${BCC}`
  serialport.write(command, err => {
    if (err) console.err(err);
    else console.log(`Read Data Meter: ==> `, command);
  });
};

process.on('SIGINT', function () {
  serialport.close((err) => {
    console.log('close', err);
  });
});