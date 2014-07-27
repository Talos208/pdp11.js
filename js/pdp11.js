function Opcode() {
	this.addr = 0;
	this.val = [];
}
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
})(Opcode);

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
	this.value = [];
	this.code = 0;
	this.append = null;
}
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
})(Oprand);

// オペランドのデコード
Oprand.decode = function(v, cont, ope) {
	var reg = v & 7;
	var addr = (v >> 3) & 0x7;

	var result = new Oprand();

	if (reg == 7) {
		result.code = Oprand.PC;
		switch (addr) {
			case 2:
				result.code |= Oprand.Imm;
				result.append = cont.fetch(ope);
				break;
			case 3:
				result.code |= Oprand.Abs;
				result.append = cont.fetch(ope);
				break;
			case 6:
				result.code |= Oprand.Rel;
				result.append = cont.fetch(ope);
				break;
			case 7:
				result.code |= Oprand.RelDef;
				result.append = cont.fetch(ope);
				break;
			default:
				result.code = Oprand.UNDEF;
		}
	} else {
		if (reg == 6) {
			// スタックポインタ
			result.code = Oprand.SP;
		} else {
			// その他レジスタ
			result.code = Oprand.R0 + reg << 4;
		}
		switch (addr) {
			case 0:
				result.code |= Oprand.Imm;
				break;
			case 1:
				result.code |= Oprand.Ind;
				break;
			case 2:
				result.code |= Oprand.Inc;
				break;
			case 3:
				result.code |= Oprand.IndInc;
				break;
			case 4:
				result.code |= Oprand.Dec;
				break;
			case 5:
				result.code |= Oprand.IndDec;
				break;
			case 6:
				result.code |= Oprand.Off;
				result.append = cont.fetch(ope);
				break;
			case 7:
				result.code |= Oprand.IndOff;
				result.append = cont.fetch(ope);
				break;
		}
	}

	return result;
}

Oprand.prototype.toString = function() {
	// console.log(ope);
	var v = this.code;
	var reg = v & 0xf0;
	var ope = v & 0xf;
	if (reg == Oprand.PC) {
		switch (ope)  {
			case Oprand.Imm:
				return "#" + uint16hex(this.append);
				break;
			case Oprand.Abs:
				return "#@" + uint16hex(this.append);
				break;
			case Oprand.Rel:
				return uint16hex(this.append);
				break;
			case Oprand.RelDef:
				return '@' + uint16hex(this.append);
				break;
		}
	} else {
		if (reg == Oprand.SP) {
			reg = "SP";
		} else {
			reg = "R" + (reg >> 4);
		}
		switch (ope)  {
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
				return uint16hex(this.append) + '(' + reg + ')'
				break;
			case Oprand.IndOff:
				return '@' + uint16hex(this.append) + '(' + reg + ')'
				break;
		}
	}
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
