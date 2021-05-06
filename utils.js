const HexToBytes = hex => {
  const arr = [];
  for (let i = 0; i < hex.length / 2; i++) {
    arr.push(parseInt(hex.substring(i * 2, i * 2 + 2), 16));
  }
  return arr;
};

module.exports.string2Hex = s => {
  let hex = '';
  for (let i = 0; i < s.length; i++) {
    hex += s.charCodeAt(i).toString(16);
  }
  return hex;
};

module.exports.toHex = arr => {
  let hex = '';
  for (let i = 0; i < arr.length; i++) {
    hex += arr[i].toString(16);
  }
  return hex;
}

module.exports.elsterEncrypt = (password, seed) => {
  const s = HexToBytes(seed);
  const crypted = [];
  for (let i = 0; i < 8; i++) {
    crypted.push(password.charCodeAt(i) ^ s[i]);
  }
  let last = crypted[7];
  for (let i = 0; i < 8; i++) {
    crypted[i] = (crypted[i] + last) & 0xFF;
    last = crypted[i];
  }

  return string2Hex(toHex(crypted)).toUpperCase();
}

module.exports.bcc = (s) => {
  let result = s.charCodeAt(0)
  for (let i = 1; i < s.length; i++) {
    result = result ^ s.charCodeAt(i)
  }
  return String.fromCharCode(result)
}

const hex2Dec = (s) => {
  return parseInt(s, 16);
}

const getDataFormMess = (result) => {
  return result.split("(")[1].split(")")[0]
}
const reverseString = (s) => {
  const result = s.match((/..?/g)).reverse().join("");
  return result
}

module.exports.getTimeFormMess = (result) => {
  const dataByte = getDataFormMess(result)
  const timeData = HexToBytes(dataByte)
  const length = timeData.length
  const time = new Date(`20${timeData[length - 1]}`, timeData[length - 2] - 1, timeData[length - 3], timeData[length - 4], timeData[length - 5], timeData[length - 6])
  return time
}

module.exports.getId = (result) => {
  const dataByte = getDataFormMess(result)
  const reverseData = reverseString(dataByte);
  const idData = hex2Dec(reverseData)
  return idData
}

module.exports.getDataEnergy = (result) => {
  const dataByte = getDataFormMess(result)
  const perData = dataByte.match(/........?/g)
  console.log(perData);
  const lengthPer = perData.length
  const kq = []
  for (let i = 0; i < lengthPer; i++) {
    kq.push(getNumberFormData(hex2Dec(reverseString(perData[i])),2))
  }
  return kq
}



module.exports.getDataMeter = (result) => {
  const dataByte = getDataFormMess(result)
  console.log(dataByte);
  const perData = dataByte.match(/........?/g)
  console.log(perData);
  const lengthPer = perData.length
  const kq = []
  for (let i = 0; i < lengthPer; i++) {
    if (i == lengthPer - 1 || i==lengthPer - 2) {
      const twoByte = perData[i].match(/....?/g )
      kq.push(getNumberFormData((hex2Dec(reverseString(twoByte[0]))), 2))
      kq.push(getNumberFormData((hex2Dec(reverseString(twoByte[1]))), 2))
    }else if(i==1){
      kq.push(getNumberFormData((hex2Dec(reverseString(perData[i]))), 3))
    } else {
      kq.push(getNumberFormData((hex2Dec(reverseString(perData[i]))), 2))
    }
  }
  return kq
}

module.exports.getDataMeter1 = (result) => {
  const dataByte = getDataFormMess(result)
  
  const perData = dataByte.match(/..?/g)
  console.log(perData);
  const lengthPer = perData.length
  const kq = []
  for (let i = 0; i < lengthPer; i++) {
    console.log(i);
    if (i == 1) {
      console.log(i);
      kq.push(getNumberFormData((hex2Dec(reverseString(perData[i]))), 4))
    } else {
      kq.push(getNumberFormData((hex2Dec(reverseString(perData[i]))), 2))
    }
  }
  return kq
}

module.exports.getW = (result) => {
  const dataByte = getDataFormMess(result)

  console.log(dataByte);
 
  return dataByte
}

const getNumberFormData = (number, decimal) => {
  return number / (Math.pow(10, decimal))
}