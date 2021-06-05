const axios = require('axios');
const SerialPort = require('serialport');
const utils = require('./utils');
const urlApi = "http://localhost:9000"
const serialport = new SerialPort("/dev/ttyUSB0", {
  baudRate: 9600,
  autoOpen: false,
});
const timeout = []
const EL = '\r\n';
const SOH = String.fromCharCode(1);
const STX = String.fromCharCode(2);
const ETX = String.fromCharCode(3);
const ACK = String.fromCharCode(6);

let step = 0;
let result = ""

const dataSend = {
  time: "",
  meterId: "",
  v: 0,
  a: 0,
  kWh: 0,
  w: 0,
  event: {

  }
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

  // //date time
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


  // // data 
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
        dataSend.a = dataMeter[1]
        dataSend.w = dataMeter[3]
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

  //event
  if (step === 7) {
    const typeEvent = 1
    if (result == "") {
      readEvent(typeEvent);
      result += " "
    } else {
      result += string
      if (string.match(ETX)) {
        console.log("Event: ", utils.getEvent(result))
        dataSend.event[`${typeEvent}`] = utils.getEvent(result)
        step++;
        result = ""
      }
    }
  }

  if (step === 8) {
    const typeEvent = 2
    if (result == "") {
      readEvent(typeEvent);
      result += " "
    } else {
      result += string
      if (string.match(ETX)) {
        console.log("Event: ", utils.getEvent(result));
        dataSend.event[`${typeEvent}`] = utils.getEvent(result)
        step++;
        result = ""
      }
    }
  }

  if (step === 9) {
    const typeEvent = 3
    if (result == "") {
      readEvent(typeEvent);
      result += " "
    } else {
      result += string
      if (string.match(ETX)) {
        console.log("Event: ", utils.getEvent(result));
        dataSend.event[`${typeEvent}`] = utils.getEvent(result)
        step++;
        result = ""
      }
    }
  }

  if (step === 10) {
    const typeEvent = 8
    if (result == "") {
      readEvent(typeEvent);
      result += " "
    } else {
      result += string
      if (string.match(ETX)) {
        console.log("Event: ", utils.getEvent(result));
        dataSend.event[`${typeEvent}`] = { ...utils.getEvent(result) }
        step++;
        result = ""
      }
    }
  }

  if (step === 11) {
    const typeEvent = 1
    if (result == "") {
      readEventValue(typeEvent);
      result += " "
    } else {
      result += string
      if (string.match(ETX)) {
        console.log("Event: ", utils.getEventValue(result))
        const value = utils.getEventValue(result)
        dataSend.event[`${typeEvent}`] = { ...dataSend.event[`${typeEvent}`], ...value }
        step++;
        result = ""
      }
    }
  }

  if (step === 12) {
    const typeEvent = 2
    if (result == "") {
      readEventValue(typeEvent);
      result += " "
    } else {
      result += string
      if (string.match(ETX)) {
        console.log("Event: ", utils.getEventValue(result))
        const value = utils.getEventValue(result)
        dataSend.event[`${typeEvent}`] = { ...dataSend.event[`${typeEvent}`], ...value }
        step++;
        result = ""
      }
    }
  }
  if (step === 13) {
    const typeEvent = 3
    if (result == "") {
      readEventValue(typeEvent);
      result += " "
    } else {
      result += string
      if (string.match(ETX)) {
        console.log("Event: ", utils.getEventValue(result))
        const value = utils.getEventValue(result)
        dataSend.event[`${typeEvent}`] = { ...dataSend.event[`${typeEvent}`], ...value }
        step++;
        result = ""
      }
    }
  }

  if (step === 14) {
    if (result == "") {
      close();
      console.log(dataSend);
      axios.post(`${urlApi}/meter`, {
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
      timeout.push(setTimeout(wakeupCommand, 60000))
      step = 0;
    }

  }



});

serialport.on('open', () => {
  wakeupCommand();
});


const wakeupCommand = () => {
  serialport.write(`/?!${EL}`, err => {
    if (err) console.err(err);
    else console.log(`wakeup: /?!${EL}`);
  });
};

const readCommand = () => {
  serialport.write(`${ACK}051${EL}`, err => {
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
  const BCC = utils.bcc(`R1${STX}1(00000000)${ETX}`)
  const command = `${SOH}R1${STX}1(00000000)${ETX}${BCC}`
  serialport.write(command, err => {
    if (err) console.err(err);
    else console.log(`Read Data Time: ==> `, command);
  });
};

const readMeterId = () => {
  const BCC = utils.bcc(`R1${STX}0(00000000)${ETX}`)
  const command = `${SOH}R1${STX}0(00000000)${ETX}${BCC}`
  serialport.write(command, err => {
    if (err) console.err(err);
    else console.log(`Read Data Id meter: ==> `, command);
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

const readDataMeter = () => {
  const BCC = utils.bcc(`R1${STX}<(03000000)${ETX}`)
  const command = `${SOH}R1${STX}<(03000000)${ETX}${BCC}`
  serialport.write(command, err => {
    if (err) console.err(err);
    else console.log(`Read Data Meter: ==> `, command);
  });
};

const readEvent = (typeEvent) => {
  const BCC = utils.bcc(`R1${STX}U(000${typeEvent}0000)${ETX}`)
  const command = `${SOH}R1${STX}U(000${typeEvent}0000)${ETX}${BCC}`
  serialport.write(command, err => {
    if (err) console.err(err);
    else console.log(`Read Data Meter: ==> `, command);
  });
};

const readEventValue = (typeEvent) => {
  const BCC = utils.bcc(`R1${STX}k(000${typeEvent}0000)${ETX}`)
  const command = `${SOH}R1${STX}k(000${typeEvent}0000)${ETX}${BCC}`
  serialport.write(command, err => {
    if (err) console.err(err);
    else console.log(`Read Data Meter: ==> `, command);
  });
};

const close = () => {
  const BCC = utils.bcc(`B0${STX}()${ETX}`)
  const command = `${SOH}B0${STX}()${ETX}${BCC}`
  serialport.write(command, err => {
    if (err) console.err(err);
    else console.log(`Logout: ==> `, command);
  });
};


process.on('SIGINT', function () {
  for (let i = 0; i < timeout.length; i++) {
    clearTimeout(timeout[i])
  }
  serialport.close((err) => {
    console.log('close', err);
  });
});