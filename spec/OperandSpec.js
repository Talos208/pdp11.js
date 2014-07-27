describe("Oprandは", function() {
	beforeEach(function() {
	});

	describe("デコード時に", function() {
		beforeEach(function() {
			cont = new Continuation();
			cont.load([0, 0]);
			ope = cont.fetch();
		});

		it("00～05ならばR0～R5 Immidiateとなる", function(){

			var results = [
				[Oprand.R0 | Oprand.Imm],
				[Oprand.R1 | Oprand.Imm],
				[Oprand.R2 | Oprand.Imm],
				[Oprand.R3 | Oprand.Imm],
				[Oprand.R4 | Oprand.Imm],
				[Oprand.R5 | Oprand.Imm],
			];
			for (var i = 00; i <= 05; i++) {
				var opr = Oprand.decode(i ,cont ,ope);

				expect(opr).toEqual(results[i]);
			};
		});

		it("06ならばSP Immidiateとなる", function(){
			var opr = Oprand.decode(6 ,cont ,ope);

			expect(opr).toEqual([Oprand.SP | Oprand.Imm]);
		});

		it("07ならば未定義となる", function(){
			var opr = Oprand.decode(7 ,cont ,ope);

			expect(opr).toEqual([Oprand.UNDEF]);
		});

		it("010ならばR0 Indirectとなる", function(){
			var opr = Oprand.decode(010 ,cont ,ope);

			expect(opr).toEqual([Oprand.R0 | Oprand.Ind]);
		});

		it("017ならば未定義となる", function(){
			var opr = Oprand.decode(017 ,cont ,ope);

			expect(opr).toEqual([Oprand.UNDEF]);
		});

		it("020ならばR0 auto-incrementとなる", function(){
			var opr = Oprand.decode(020 ,cont ,ope);

			expect(opr).toEqual([Oprand.R0 | Oprand.Inc]);
		});

		it("027ならばPC Immidiateとなる", function(){
			cont.load([0, 0, 0x34, 0x12]);
			ope = cont.fetch();
			var opr = Oprand.decode(027 ,cont ,ope);

			expect(opr).toEqual([Oprand.PC | Oprand.Imm, 0x1234]);
		});

		it("030ならばR0 Indirect Auto-increment となる", function(){
			var opr = Oprand.decode(030 ,cont ,ope);

			expect(opr).toEqual([Oprand.R0 | Oprand.IndInc]);
		});

		it("037ならばPC Absoluteとなる", function(){
			cont.load([0, 0, 0x34, 0x12]);
			ope = cont.fetch();
			var opr = Oprand.decode(037 ,cont ,ope);

			expect(opr).toEqual([Oprand.PC | Oprand.Abs, 0x1234]);
		});

		it("040ならばR0 Auto-decrement となる", function(){
			var opr = Oprand.decode(040 ,cont ,ope);

			expect(opr).toEqual([Oprand.R0 | Oprand.Dec]);
		});

		it("047ならば未定義となる", function(){
			cont.load([0, 0, 0x34, 0x12]);
			ope = cont.fetch();
			var opr = Oprand.decode(047 ,cont ,ope);

			expect(opr).toEqual([Oprand.UNDEF]);
		});

		it("050ならばR0 Indirect Auto-decrement となる", function(){
			var opr = Oprand.decode(050 ,cont ,ope);

			expect(opr).toEqual([Oprand.R0 | Oprand.IndDec]);
		});

		it("057ならば未定義となる", function(){
			cont.load([0, 0, 0x34, 0x12]);
			ope = cont.fetch();
			var opr = Oprand.decode(057 ,cont ,ope);

			expect(opr).toEqual([Oprand.UNDEF]);
		});

		it("060ならばR0 オフセットとなる", function(){
			cont.load([0, 0, 0x78, 0x56]);
			ope = cont.fetch();
			var opr = Oprand.decode(060 ,cont ,ope);

			expect(opr).toEqual([Oprand.R0 | Oprand.Off, 0x5678]);
		});

		it("067ならばPC Relativeとなる", function(){
			cont.load([0, 0, 0xbc, 0x9a]);
			ope = cont.fetch();
			var opr = Oprand.decode(067 ,cont ,ope);

			expect(opr).toEqual([Oprand.PC | Oprand.Rel, 0x9abc]);
		});

		it("070ならばR0 オフセット間接 となる", function(){
			cont.load([0, 0, 0xef, 0xcd]);
			ope = cont.fetch();
			var opr = Oprand.decode(070 ,cont ,ope);

			expect(opr).toEqual([Oprand.R0 | Oprand.IndOff, 0xcdef]);
		});

		it("067ならばPC 間接Relativeとなる", function(){
			cont.load([0, 0, 0x23, 0x01]);
			ope = cont.fetch();
			var opr = Oprand.decode(077 ,cont ,ope);

			expect(opr).toEqual([Oprand.PC | Oprand.RelDef, 0x0123]);
		});
	});

	describe('文字列化時に', function() {

	});
});