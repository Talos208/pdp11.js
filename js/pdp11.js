var fetch = function(cont,ope) {
	var result = cont.mem[cont.pc++] | cont.mem[cont.pc++] << 8;
	ope.val.push(result);
	return result;
}

// 16ビット数を16進4桁で表示
var uint16hex = function(v) {
	var result = "000" + v.toString(16);
	return result.slice(-4);
}

// 8ビット数を16進2桁で表示
var uint8hex = function(v) {
	var result = "0" + v.toString(16);
	return result.slice(-2);
}

// オペランドのデコード
var operand = function(v,cont,ope) {
	var reg = v & 7;
	if (reg == 7) {
		switch ((v >> 3) & 0x7) {
			case 0x2:
				var v = fetch(cont,ope);
				return "#" + uint16hex(v);
				break;
			case 0x3:
				var v = fetch(cont,ope);
				return "@#" + uint16hex(v);
				break;
			case 0x6:
				var v = fetch(cont,ope);
				return uint16hex(v);
				break;
			case 0x7:
				var v = fetch(cont,ope);
				return "@" + uint16hex(v);
				break;
		}
	} else if (reg == 6) {
		// SP
		switch (v & 0x38) {
			case 8:
				return "(SP)";
				break;
			case 0x10:
				return "(SP)+";
				break;
			case 0x18:
				return "@(SP)+";
				break;
			case 0x20:
				return "-(SP)+";
				break;
			case 0x30:
				var v = fetch(cont,ope);
				return uint16hex(v) + "(SP)";
				break;
			case 0x38:
				var v = fetch(cont,ope);
				return "@" + uint16hex(v) + "(SP)";
				break;
		}
	} else {
		// その他レジスタ
		switch (v & 0x38) {
			case 0:
				return "R" + reg;
				break;
			case 8:
				return "(R" + reg + ")";
				break;
			case 0x10:
				return "(R" + reg + ")+";
				break;
			case 0x18:
				return "@(R" + reg + ")+";
				break;
			case 0x20:
				return "-(R" + reg + ")";
				break;
			case 0x28:
				return "@-(R" + reg + ")";
				break;
			case 0x30:
				var v = fetch(cont,ope);
				return uint16hex(v) + "(R" + reg + ")";
				break;
			case 0x38:
				var v = fetch(cont,ope);
				return "@" + uint16hex(v) + "(R" + reg + ")";
				break;
		}
	}

	return null;
}

// 命令デコード
var decode_ope = function (cont) {
	ope = {};
	ope.addr = cont.pc;
	ope.val = [];

	// オペコード解釈
	var opc = fetch(cont,ope);
	var nim = "???";
	var byteFlg = opc >> 15;
	var opc1 = (opc >> 12) & 7;

	if (opc1 != 0 && opc1 < 6) {
		// 2オペランド命令
		var nims = ["???", "MOV", "CMP", "BIT", "BIC", "BIS"];
		nim = nims[opc1];
		if (byteFlg) {
			nim += "B";
		}
		var src = operand(opc >> 6 & 0x3f, cont, ope);
		var dst = operand(opc      & 0x3f, cont, ope);

		nim += " " + src + "," + dst;
	} else if (opc1 == 6) {
		if (byteFlg) {
			nim = "SUB";
		} else {
			nim = "ADD";
		}
		var src = operand(opc >> 6 & 0x3f, cont, ope);
		var dst = operand(opc      & 0x3f, cont, ope);

		nim += " " + src + "," + dst;
	} else if (opc1 == 0) {
		var opc2 = (opc >> 9) & 7;
		var opc3 = (opc >> 6) & 7;
		switch (opc2) {
			case 5:
				// 算術演算
				var nims = ["CLR" ,"COM" ,"INC" ,"DEC" ,"NEG" ,"ADC" ,"SBC", "TST"];
				nim = nims[opc3];
				var dst = operand(opc      & 0x3f, cont, ope);
				nim += " " + src + "," + dst;
				break;

			case 6:
				// ビット演算
				var nims = ["ROR", "ROL", "ASR", "ASL", "MARK","MFPI","MTPI","???"];
				nim = nims[opc3];
				var dst = operand(opc      & 0x3f, cont, ope);
				nim += " " + src + "," + dst;
				break;

			case 4:
				// JSR
				if (!byteFlg) {
					nim = "JSR";
					var reg = "R" + (opc >> 6) & 7;
					var dst = operand(opc      & 0x3f, cont, ope);

					nim += " " + reg + "," + dst;
				} else {
					// TRAP/EMT
					if (opc & 0x100) {
						nim = "EMT"
					} else {
						nim = "TRAP"
					}

					nim += " " + uint8hex(opc & 0xff);
				}

				break;

			default:
				if ((opc >> 6) == 0) {
					// HALT系
					var nims = ["HALT","WAIT","RTI","BPT","IOT","RESET","RTT","???"];
					nim = nims[opc & 7];
				} else if ((opc >> 6) == 1) {
					// JMP

					nim = "JMP " + uint8hex(opc & 0xff);
				} else {
					if (!byteFlg) {
						// Bxx系
						// 0*04 	BR
						// 0*10 	BNE
						// 0*14 	BEQ
						// 0*20 	BGE
						// 0*24 	BLT
						// 0*30 	BGT
						// 0*34 	BLE		branch less equal
						var nims = ["HALT","BR","BNE","BEQ","BGE","BLT","BGT","BLE"];
						nim = nims[opc >> 6 & 0x3f];
					} else {
						// 1*00 	BPL		branch plus
						// 1*04 	BMI		branch minus 
						// 1*10 	BHI		branch higher
						// 1*14 	BLOS	branch low or same
						// 1*20 	BVC		branch oVerflow Clear
						// 1*24 	BVS		branch oVerflow Set
						// 1*30 	BCC		branch Carry Clear
						// 1*34 	BCS		branch Carry Set
						var nims = ["HALT","BR","BNE","BEQ","BGE","BLT","BGT","BLE"];
						nim = nims[opc >> 6 & 0x3f];
					}
				}
		}
	} else if (opc1 == 7) {
		var reg = "R" + (opc >> 6) & 7;
		var nims = ["MUL","DIV","ASH","ASHC","XOR","???","???","SOB"];

		nim = nims[opc2] + " " + reg;
	}

	ope.nim = nim;

	return ope;
}
