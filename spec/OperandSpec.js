describe("Oprandは", function() {
	beforeEach(function() {

	});

	it("0の時にR0 Immidiateとなる", function(){
		var cont = {};
		cont.pc = 1;
		cont.mem = new Uint8Array(1);
		cont.mem.set([0]);

		ope = {};
		ope.addr = cont.pc;
		ope.val = [];

		var opr = decodeOpr(0,cont,ope);

		expect(opr).toEqual([Oprand.R0 | Oprand.Imm]);
	});
});