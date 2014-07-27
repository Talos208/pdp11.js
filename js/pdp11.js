function Opcode() {
	(function (self) {
		var opcode_base = [
			"MOV", "MOVB","CMP", "CMPB","BIT", "BITB","BIC", "BICB","BIS", "BISB",
			"SUB", "ADD", "CLR", "COM", "INC", "DEC", "NEG", "ADC", "SBC", "TST", 
			"ROR", "ROL", "ASR", "ASL", "MARK","MFPI","MTPI","JSR", "EMT", "TRAP",
			"HALT","WAIT","RTI", "BPT", "IOT","RESET","RTT", "BR",  "BNE", "BEQ", 
			"BGE", "BLT", "BGT", "BLE", "BPL", "BMI", "BHI", "BLOS","BVC", "BVS", 
			"BCC", "BCS", "MUL", "DIV", "ASH", "ASHC","XOR", "SOB", "NOP"
		];
		for (var i = 0; i < opcode_base.length;i++) {
			Object.defineProperty(self, opcode_base[i],{value: i, enumerable: true, configurable: false, writeble: false});
		}
		Object.defineProperty(self, "UNDEF",{value: 255, enumerable: true, configurable: false, writeble: false});
	})(this);

	this.addr = 0;
	this.val = [];
}

function Continuation() {
	this.mem = [];
	this.pc = 0;
}

Continuation.prototype.load = function(data) {
	if ($.isArray(data)) {
		this.mem = new Uint8Array(data.length);
		this.mem.set(data);
	} else if (data instanceof Uint8Array) {
		this.mem = data;
	}
	this.pc = 0;
}

Continuation.prototype.fetch = function(ope) {
	ope = ope ? ope : new Opcode();
	ope.addr = this.pc
	var result = this.mem[this.pc++] | this.mem[this.pc++] << 8;
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

function Oprand() {
	(function(self){
		Object.defineProperties(self,{
			"R0":{value:    0,writable: false},
			"R1":{value: 0x10,writable: false},
			"R2":{value: 0x20,writable: false},
			"R3":{value: 0x30,writable: false},
			"R4":{value: 0x40,writable: false},
			"R5":{value: 0x50,writable: false},
			"SP":{value: 0x60,writable: false},
			"PC":{value: 0x70,writable: false}
		});
		Object.defineProperties(self, {
			"Imm":   {value:  0,writable: false},
			"Ind":   {value:  1,writable: false},
			"Inc":   {value:  2,writable: false},
			"IndInc":{value:  3,writable: false},
			"Dec":   {value:  4,writable: false},
			"IndDec":{value:  5,writable: false},
			"Off":   {value:  6,writable: false},
			"IndOff":{value:  7,writable: false},
			"Dec":   {value:  8,writable: false},
			"Abs":   {value:  9,writable: false},
			"Rel":   {value: 10,writable: false},
			"RelDef":{value: 11,writable: false}
		});
		Object.defineProperty(self, "UNDEF",{value: 255, enumerable: true, configurable: false, writeble: false});
	})(this);

	this.value = [];
}

// オペランドのデコード
Oprand.decode = function(v, cont, ope) {
	var reg = v & 7;
	var addr = (v >> 3) & 0x7;

	var result = 0;
	var resarry = [0];

	if (reg == 7) {
		result = Oprand.PC;
		switch (addr) {
			case 2:
				result |= Oprand.Imm;
				var v = cont.fetch(ope);
				resarry.push(v);
				break;
			case 3:
				result |= Oprand.Abs;
				var v = cont.fetch(ope);
				resarry.push(v);
				break;
			case 6:
				result |= Oprand.Rel;
				var v = cont.fetch(ope);
				resarry.push(v);
				break;
			case 7:
				result |= Oprand.RelDef;
				var v = cont.fetch(ope);
				resarry.push(v);
				break;
			default:
				result = Oprand.UNDEF;
		}
	} else {
		if (reg == 6) {
			// スタックポインタ
			result = Oprand.SP;
		} else {
			// その他レジスタ
			result = Oprand.R0 + reg << 4;
		}
		switch ((v >> 3) & 7) {
			case 0:
				result |= Oprand.Imm;
				break;
			case 1:
				result |= Oprand.Ind;
				break;
			case 2:
				result |= Oprand.Inc;
				break;
			case 3:
				result |= Oprand.IndInc;
				break;
			case 4:
				result |= Oprand.Dec;
				break;
			case 5:
				result |= Oprand.IndDec;
				break;
			case 6:
				resarry[1]= cont.fetch(ope);
				result |= Oprand.Off;
				break;
			case 7:
				resarry[1]= cont.fetch(ope);
				result |= Oprand.IndOff;
				break;
		}
	}

	resarry[0] = result;
	return resarry;
}

var oprToS = function(ope) {
	// console.log(ope);
	var v = ope[0];
	var reg = v & 0xf;
	if (reg == 7) {
		switch (v >> 4)  {
			case Oprand.Imm:
				return "#" + uint16hex(ope[1]);
				break;
			case Oprand.Abs:
				return "#@" + uint16hex(ope[1]);
				break;
			case Oprand.Rel:
				return uint16hex(ope[1]);
				break;
			case Oprand.RelDef:
				return '@' + uint16hex(ope[1]);
				break;
		}
	} else {
		var reg = "R" + reg;
		if (reg == 6) {
			reg = "SP";
		}
		switch (v >> 4)  {
			case Oprand.Imm:
				return reg;
				break;
			case Oprand.Ind:
				return '(' + reg + ')';
				break;
			case Oprand.Inc:
				return '(' + reg + ')+';
				break;
			case Oprand.IndInc:
				return '@(' + reg + ')+';
				break;
			case Oprand.Dec:
				return '-(' + reg + ')';
				break;
			case Oprand.IndDec:
				return '@-(' + reg + ')';
				break;
			case Oprand.Off:
				return uint16hex(ope[1]) + '(' + reg + ')'
				break;
			case Oprand.IndOff:
				return '@' + uint16hex(ope[1]) + '(' + reg + ')'
				break;
		}
	}
}

// オペランドのデコード
var Oprand0 = function(v,cont,ope) {
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
				return "-(SP)";
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
		var src = decodeOpr(opc >> 6 & 0x3f, cont, ope);
		var dst = decodeOpr(opc      & 0x3f, cont, ope);

		nim += " " + oprToS(src) + "," + oprToS(dst);
	} else if (opc1 == 6) {
		if (byteFlg) {
			nim = "SUB";
		} else {
			nim = "ADD";
		}
		var src = decodeOpr(opc >> 6 & 0x3f, cont, ope);
		var dst = decodeOpr(opc      & 0x3f, cont, ope);

		nim += " " + oprToS(src) + "," + oprToS(dst);
	} else if (opc1 == 0) {
		var opc2 = (opc >> 9) & 7;
		var opc3 = (opc >> 6) & 7;
		switch (opc2) {
			case 5:
				// 算術演算
				var nims = ["CLR" ,"COM" ,"INC" ,"DEC" ,"NEG" ,"ADC" ,"SBC", "TST"];
				nim = nims[opc3];
				var dst = decodeOpr(opc      & 0x3f, cont, ope);
				nim += " " + oprToS(dst);
				break;

			case 6:
				// ビット演算
				var nims = ["ROR", "ROL", "ASR", "ASL", "MARK","MFPI","MTPI","???"];
				nim = nims[opc3];
				var dst = decodeOpr(opc      & 0x3f, cont, ope);
				nim += " " + oprToS(dst);
				break;

			case 4:
				// JSR
				if (!byteFlg) {
					nim = "JSR";
					var reg = "R" + (opc >> 6) & 7;
					var dst = decodeOpr(opc      & 0x3f, cont, ope);

					nim += " " + reg + "," + oprToS(dst);
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
						var nims = ["BPL","BMI","BHI","BLOS","BVC","BVS","BCC","BCS"];
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
