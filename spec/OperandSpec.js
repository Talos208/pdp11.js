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
				Oprand.R0 | Oprand.Imm,
				Oprand.R1 | Oprand.Imm,
				Oprand.R2 | Oprand.Imm,
				Oprand.R3 | Oprand.Imm,
				Oprand.R4 | Oprand.Imm,
				Oprand.R5 | Oprand.Imm,
			];
			for (var i = 00; i <= 05; i++) {
				var opr = Oprand.decode(i ,cont ,ope);

				expect(opr.code).toEqual(results[i]);
			};
		});

		it("06ならばSP Immidiateとなる", function(){
			var opr = Oprand.decode(6 ,cont ,ope);

			expect(opr.code).toEqual(Oprand.SP | Oprand.Imm);
		});

		it("07ならば未定義となる", function(){
			var opr = Oprand.decode(7 ,cont ,ope);

			expect(opr.code).toEqual(Oprand.UNDEF);
		});

		it("010ならばR0 Indirectとなる", function(){
			var opr = Oprand.decode(010 ,cont ,ope);

			expect(opr.code).toEqual(Oprand.R0 | Oprand.Ind);
		});

		it("017ならば未定義となる", function(){
			var opr = Oprand.decode(017 ,cont ,ope);

			expect(opr.code).toEqual(Oprand.UNDEF);
		});

		it("020ならばR0 auto-incrementとなる", function(){
			var opr = Oprand.decode(020 ,cont ,ope);

			expect(opr.code).toEqual(Oprand.R0 | Oprand.Inc);
		});

		it("027ならばPC Immidiateとなる", function(){
			cont.load([0, 0, 0x34, 0x12]);
			ope = cont.fetch();
			var opr = Oprand.decode(027 ,cont ,ope);

			expect(opr.code).toEqual(Oprand.PC | Oprand.Imm);
			expect(opr.append).toEqual( 0x1234 );
		});

		it("030ならばR0 Indirect Auto-increment となる", function(){
			var opr = Oprand.decode(030 ,cont ,ope);

			expect(opr.code).toEqual(Oprand.R0 | Oprand.IndInc);
		});

		it("037ならばPC Absoluteとなる", function(){
			cont.load([0, 0, 0x34, 0x12]);
			ope = cont.fetch();
			var opr = Oprand.decode(037 ,cont ,ope);

			expect(opr.code).toEqual(Oprand.PC | Oprand.Abs)
			expect(opr.append).toEqual( 0x1234 );
		});

		it("040ならばR0 Auto-decrement となる", function(){
			var opr = Oprand.decode(040 ,cont ,ope);

			expect(opr.code).toEqual(Oprand.R0 | Oprand.Dec);
		});

		it("047ならば未定義となる", function(){
			cont.load([0, 0, 0x34, 0x12]);
			ope = cont.fetch();
			var opr = Oprand.decode(047 ,cont ,ope);

			expect(opr.code).toEqual(Oprand.UNDEF);
		});

		it("050ならばR0 Indirect Auto-decrement となる", function(){
			var opr = Oprand.decode(050 ,cont ,ope);

			expect(opr.code).toEqual(Oprand.R0 | Oprand.IndDec);
		});

		it("057ならば未定義となる", function(){
			cont.load([0, 0, 0x34, 0x12]);
			ope = cont.fetch();
			var opr = Oprand.decode(057 ,cont ,ope);

			expect(opr.code).toEqual(Oprand.UNDEF);
		});

		it("060ならばR0 オフセットとなる", function(){
			cont.load([0, 0, 0x78, 0x56]);
			ope = cont.fetch();
			var opr = Oprand.decode(060 ,cont ,ope);

			expect(opr.code).toEqual(Oprand.R0 | Oprand.Off);
			expect(opr.append).toEqual( 0x5678 );
		});

		it("067ならばPC Relativeとなる", function(){
			cont.load([0, 0, 0xbc, 0x9a]);
			ope = cont.fetch();
			var opr = Oprand.decode(067 ,cont ,ope);

			expect(opr.code).toEqual(Oprand.PC | Oprand.Rel);
			expect(opr.append).toEqual( 0x9abc );
		});

		it("070ならばR0 オフセット間接 となる", function(){
			cont.load([0, 0, 0xef, 0xcd]);
			ope = cont.fetch();
			var opr = Oprand.decode(070 ,cont ,ope);

			expect(opr.code).toEqual(Oprand.R0 | Oprand.IndOff);
			expect(opr.append).toEqual( 0xcdef );
		});

		it("077ならばPC 間接Relativeとなる", function(){
			cont.load([0, 0, 0x23, 0x01]);
			ope = cont.fetch();
			var opr = Oprand.decode(077 ,cont ,ope);

			expect(opr.code).toEqual(Oprand.PC | Oprand.RelDef);
			expect(opr.append).toEqual( 0x0123 );
		});
	});

	describe('文字列化時に', function() {
		it("レジスタ直値が文字列化できる", function() {
			opr = new Oprand();
			opr.code = Oprand.R0 | Oprand.Imm;

			var result = opr.toString();

			expect(result).toEqual("R0");
		});

		it("レジスタ間接が文字列化できる", function() {
			opr = new Oprand();
			opr.code = Oprand.R1 | Oprand.Ind;

			var result = opr.toString();

			expect(result).toEqual("(R1)");
		});

		it("レジスタオートインクリメントが文字列化できる", function() {
			opr = new Oprand();
			opr.code = Oprand.R2 | Oprand.Inc;

			var result = opr.toString();

			expect(result).toEqual("(R2)+");
		});

		it("レジスタ相対オートインクリメントが文字列化できる", function() {
			opr = new Oprand();
			opr.code = Oprand.R3 | Oprand.IndInc;

			var result = opr.toString();

			expect(result).toEqual("@(R3)+");
		});

		it("レジスタオートデクリメントが文字列化できる", function() {
			opr = new Oprand();
			opr.code = Oprand.R4 | Oprand.Dec;

			var result = opr.toString();

			expect(result).toEqual("-(R4)");
		});

		it("レジスタ相対オートデクリメントが文字列化できる", function() {
			opr = new Oprand();
			opr.code = Oprand.R5 | Oprand.IndDec;

			var result = opr.toString();

			expect(result).toEqual("@-(R5)");
		});

		it("インデックス付きレジスタ相対が文字列化できる", function() {
			opr = new Oprand();
			opr.code = Oprand.SP | Oprand.Off;
			opr.append = 0x10;

			var result = opr.toString();

			expect(result).toEqual("0010(SP)");
		});

		it("インデックス付きレジスタ相対間接が文字列化できる", function() {
			opr = new Oprand();
			opr.code = Oprand.SP | Oprand.IndOff;
			opr.append = 0x55aa;

			var result = opr.toString();

			expect(result).toEqual("@55aa(SP)");
		});


		it("直値が文字列化できる", function() {
			opr = new Oprand();
			opr.code = Oprand.PC | Oprand.Imm;
			opr.append = 0x3;

			var result = opr.toString();

			expect(result).toEqual("#0003");
		});

		it("絶対アドレスが文字列化できる", function() {
			opr = new Oprand();
			opr.code = Oprand.PC | Oprand.Abs;
			opr.append = 0x634;

			var result = opr.toString();

			expect(result).toEqual("#@0634");
		});

		it("インデックス付きPCが文字列化できる", function() {
			opr = new Oprand();
			opr.code = Oprand.PC | Oprand.Rel;
			opr.append = 0xa;

			var result = opr.toString();

			expect(result).toEqual("000a");
		});

		it("インデックス付きPC間接が文字列化できる", function() {
			opr = new Oprand();
			opr.code = Oprand.PC | Oprand.RelDef;
			opr.append = 0xbeef;

			var result = opr.toString();

			expect(result).toEqual("@beef");
		});	});
});