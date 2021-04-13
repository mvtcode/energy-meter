const HexToBytes = hex => {
	const arr = [];
	for(let i = 0; i < hex.length / 2; i++) {
		arr.push(parseInt(hex.substring(i * 2, i * 2 + 2), 16));
	}
	return arr;
};

const string2Hex = s => {
	let hex = '';
	for(let i = 0; i < s.length; i++) {
		hex += s.charCodeAt(i).toString(16);
	}
	return hex;
};

const toHex = arr => {
	let hex = '';
	for(let i = 0; i < arr.length; i++) {
		hex += arr[i].toString(16);
	}
	return hex;
}

module.exports.elsterEncrypt = (password, seed) => {
	const s = HexToBytes(seed);
	const crypted = [];
	for(let i = 0; i < 8; i++) {
		crypted.push(password.charCodeAt(i) ^ s[i]);
	}
	let last = crypted[7];
	for(let i = 0; i < 8; i++) {
		crypted[i] = (crypted[i] + last) & 0xFF;
		last = crypted[i];
	}

	return string2Hex(toHex(crypted)).toUpperCase();
}