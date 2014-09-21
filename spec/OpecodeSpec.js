describe("Opcodeは", function() {
	beforeEach(function() {
	});

	describe("デコード時に", function() {
		beforeEach(function() {
			cont = new Continuation();
			// ope = cont.fetch();
		});
		$.each([
			// 2オペランド
			{code:"010011", nim:"MOV R0,(R1)"}, 
			{code:"122233", nim:"CMPB (R2)+,@(R3)+"}, 
			{code:"034455", nim:"BIT -(R4),@-(R5)"}, 
			{code:"146677 012345 012345", nim:"BICB 14e5(SP),@14e5"}, 
			{code:"050011", nim:"BIS R0,(R1)"}, 
			// 算術演算
			{code:"005000", nim:"CLR R0"}, 
			{code:"105010", nim:"CLRB (R0)"},
			{code:"005120", nim:"COM (R0)+"},
			{code:"105130", nim:"COMB @(R0)+"},
			// ビット演算
			{code:"006000", nim:"ROR R0"},
			{code:"106010", nim:"RORB (R0)"},
			// JSR/TRAP
			{code:"004172 012345", nim:"JSR R1,@14e5(R2)"},
			// 特殊命令
			{code:"0", 		nim:"HALT"},
			{code:"000001", nim:"WAIT"},
			{code:"000002", nim:"RTI"},
			{code:"000003", nim:"BPT"},
			{code:"000004", nim:"IOT"},
			{code:"000005", nim:"RESET"},
			{code:"000006", nim:"RTT"},
			// JMP（含む条件分岐）
			{code:'000116', nim:'JMP (SP)'},
			{code:'001077', nim:'BNE 3f'},
			{code:'001437', nim:'BEQ 1f'},
			{code:'002036', nim:'BGE 1e'},
			{code:'002435', nim:'BLT 1d'},
			{code:'003034', nim:'BGT 1c'},
			{code:'003433', nim:'BLE 1b'},
			{code:'100032', nim:'BPL 1a'},
			{code:'100431', nim:'BMI 19'},
			{code:'102030', nim:'BVC 18'},
			{code:'102427', nim:'BVS 17'},
			{code:'103026', nim:'BCC 16'},
			{code:'103425', nim:'BCS 15'},
			{code:'101024', nim:'BHI 14'},
			{code:'101423', nim:'BLOS 13'},

			// その他
			{code:'070631', nim:'MUL SP,@(R1)+'},
			{code:'071112', nim:'DIV R1,(R2)'},
			{code:'072324', nim:'ASH R3,(R4)+'},
			{code:'073435', nim:'ASHC R4,@(R5)+'},
			{code:'074001', nim:'XOR R0,R1'},
		], function(i,e) {
			it(e.code + "をデコードすると" + e.nim + "になる", function() {
				cont.load(e.code);
				var result = decode_ope(cont);

				expect(result.nim).toEqual(e.nim);
			})
		});
	});
});