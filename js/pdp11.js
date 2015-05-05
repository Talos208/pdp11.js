function Opcode() {
	this.addr = 0;
	this.val = [];
	this.opc = 0;
	this.opr = [];
}
(function (self) {
	var opcode_base = [
		"MOV", "MOVB","CMP", "CMPB","BIT", "BITB","BIC", "BICB","BIS", "BISB",
		"SUB", "ADD", 
		"CLR", "CLRB", "COM", "COMB", "INC", "INCB", "DEC", "DECB", "NEG", "NEGB", "ADC", "ADCB", "SBC", "SBCB", "TST", "TSTB", 
		"ROR", "RORB", "ROL", "ROLB", "ASR", "ASRB", "ASL", "ASLB", "MARK", "MARKB","MFPI","MFPIB","MTPI","MTPIB",
		"JMP",
		"JSR", "EMT", "TRAP",
		"HALT","WAIT","RTI", "BPT", "IOT","RESET","RTT", "BR",  "BNE", "BEQ", 
		"BGE", "BLT", "BGT", "BLE", "BPL", "BMI", "BHI", "BLOS","BVC", "BVS", 
		"BCC", "BCS", "MUL", "DIV", "ASH", "ASHC","XOR", "SOB", "NOP"
	];
	for (var i = 0; i < opcode_base.length;i++) {
		Object.defineProperty(self, opcode_base[i],{value: i, enumerable: true, configurable: false, writeble: false});
	}
	Object.defineProperty(self, "UNDEF",{value: 255, enumerable: true, configurable: false, writeble: false});

	self.toString = function(v) {
		if (v < 0 || v >= opcode_base.length) {
			return 'UNDEF';
		}
		return opcode_base[v];
	}
	self.prototype.toString = function() {
		self.toString(val);
	}
})(Opcode);

function Continuation() {
	this.mem = [];
	this.pc = 0;
	this.operations = {}
}

(function(self) {
	self.prototype.load = function(data) {
		if ($.isArray(data)) {
			this.mem = new Uint8Array(data.length);
			this.mem.set(data);
		} else if (typeof data == 'string') {
			data = data.split(' ');
			var res = [];
			data.forEach(function(e, i, a) {
				var v = parseInt(e,8);
				res.push(v & 0xff);
				res.push((v >> 8) & 0xff);
			});
			this.mem = new Uint8Array(res.length);
			this.mem.set(res);
		} else if (data instanceof Uint8Array) {
			this.mem = data;
		}
		this.pc = 0;
	}

	self.prototype.fetch = function(ope) {
		if (!ope) {
			ope = new Opcode();
			ope.addr = this.pc
		}
		var result = this.mem[this.pc++] | this.mem[this.pc++] << 8;
		ope.val.push(result);
		return result;
	}

	self.prototype.set = function(addr, value) {
		if (addr >=	 0) {
			if (addr >= this.mem.length) {
				newMem = new Uint8Array(addr + 1);
				newMem.set(this.mem);
				this.mem = newMem;
			}
			this.mem[addr] = value;
		}
	}
})(Continuation);

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

	// オペランドのデコード
	self.decode = function(v, cont, ope) {
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

	self.prototype.toString = function() {
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
})(Oprand);


// 命令デコード
var decode_ope = function (cont) {
	ope = {};
	ope.addr = cont.pc;
	ope.val = [];

	// オペコード解釈
	var opc = cont.fetch(ope);
	var nim = Opcode.UNDEF;
	var byteFlg = opc >> 15;
	var opc1 = (opc >> 12) & 7;
	var opr = [];

	if (opc1 != 0 && opc1 < 6) {
		// 2オペランド命令
		var nims = [Opcode.UNDEF, Opcode.MOV, Opcode.CMP, Opcode.BIT, Opcode.BIC, Opcode.BIS];
		nim = nims[opc1];
		if (byteFlg) {
			nim += 1;
		}
		var src = Oprand.decode(opc >> 6 & 0x3f, cont, ope);
		var dst = Oprand.decode(opc      & 0x3f, cont, ope);
		opr.push(src);
		opr.push(dst);
	} else if (opc1 == 6) {
		if (byteFlg) {
			nim = Opcode.SUB;
		} else {
			nim = Opcode.ADD;
		}
		var src = Oprand.decode(opc >> 6 & 0x3f, cont, ope);
		var dst = Oprand.decode(opc      & 0x3f, cont, ope);
		opr.push(src);
		opr.push(dst);
	} else {
		var opc2 = (opc >> 9) & 7;
		var opc3 = (opc >> 6) & 7;
		if (opc1 == 0) {
			switch (opc2) {
				case 5:
					// 算術演算
					var nims = [Opcode.CLR ,Opcode.COM ,Opcode.INC ,Opcode.DEC ,Opcode.NEG ,Opcode.ADC ,Opcode.SBC ,Opcode.TST];
					nim = nims[opc3];
					if (byteFlg) {
						nim += 1;
					}
					var dst = Oprand.decode(opc      & 0x3f, cont, ope);
					opr.push(dst);
					break;

				case 6:
					// ビット演算
					var nims = [Opcode.ROR, Opcode.ROL, Opcode.ASR, Opcode.ASL, Opcode.MARK,Opcode.MFPI,Opcode.MTPI,Opcode.UNDEF];
					nim = nims[opc3];
					if (byteFlg) {
						nim += 1;
					}
					var dst = Oprand.decode(opc      & 0x3f, cont, ope);
					opr.push(dst);
					break;

				case 4:
					// JSR
					if (!byteFlg) {
						nim = Opcode.JSR;
						var reg = new Oprand()
						reg.code = Oprand.R0 + ((opc >> 6) & 7) << 4;
						opr.push(reg);
						var dst = Oprand.decode(opc      & 0x3f, cont, ope);
						opr.push(dst);
					} else {
						// TRAP/EMT
						if (opc & 0x100) {
							nim = Opcode.EMT
						} else {
							nim = Opcode.TRAP
						}
						opr.push(uint8hex(opc & 0xff));
					}

					break;

				default:
					if ((opc >> 6) == 0) {
						// HALT系
						var nims = [Opcode.HALT, Opcode.WAIT,Opcode.RTI,Opcode.BPT,Opcode.IOT,Opcode.RESET,Opcode.RTT,Opcode.UNDEF]
						nim = nims[opc & 7];
					} else if ((opc >> 6) == 1) {
						// JMP
						opr.push(Oprand.decode(opc & 0x3f, cont, ope));

						nim = Opcode.JMP;
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
							var nims = [Opcode.UNDEF, Opcode.BR, Opcode.BNE, Opcode.BEQ, Opcode.BGE, Opcode.BLT ,Opcode.BGT, Opcode.BLE];
							nim = nims[opc >> 8 & 0x3f];
						} else {
							// 1*00 	BPL		branch plus
							// 1*04 	BMI		branch minus 
							// 1*10 	BHI		branch higher
							// 1*14 	BLOS	branch low or same
							// 1*20 	BVC		branch oVerflow Clear
							// 1*24 	BVS		branch oVerflow Set
							// 1*30 	BCC		branch Carry Clear
							// 1*34 	BCS		branch Carry Set
							var nims = [Opcode.BPL, Opcode.BMI, Opcode.BHI, Opcode.BLOS, Opcode.BVC, Opcode.BVS, Opcode.BCC, Opcode.BCS];
							nim = nims[opc >> 8 & 0x3f];
						}
						opr.push(uint8hex(opc & 0xff));
					}
			}
		} else if (opc1 == 7) {
			var reg = new Oprand()
			reg.code = Oprand.R0 + ((opc >> 6) & 7) << 4;
			var nim = [Opcode.MUL, Opcode.DIV, Opcode.ASH, Opcode.ASHC,Opcode.XOR, Opcode.UNDEF, Opcode.UNDEF,Opcode.SOB][opc2];
			opr.push(reg);
			opr.push(Oprand.decode(opc & 0x3f, cont, ope));
		}
	}

	var oprs = opr.join(',')
	nim = [Opcode.toString(nim)];
	if (oprs.length > 0) {
		nim.push(oprs)
	}

	ope.nim = nim.join(' ');

	return ope;
}
