function DxfCreator() 
{

	this.createFileHeader = function(){
		var hdr = "";
		//Header section
		hdr += DXF("VeloCamera");
		hdr += SECTION();
		hdr += HEADER();
		hdr += ACADVER();
		hdr += INSBASE();
		hdr += EXTMIN(0.0,0.0);
		hdr += EXTMAX(1000.0, 1000.0);
		hdr += LINMIN();
		hdr += LINMAX();
		hdr += ENDSEC();
		//Table section
		hdr += SECTION();
		hdr += TABLES();
		hdr += TABLE_LTYPE();
		hdr += TABLE_LAYER();
		hdr += TABLE_STYLE();
		hdr += ENDSEC();
		// Blocks section
		hdr += SECTION();
		hdr += BLOCKS();
		hdr += ENDSEC();
		//Entities section
		// hdr += SECTION();
		// hdr += ENTITIES();
		
		// hdr += ENDSEC();
		return hdr;				
	}
	this.createEOF = function(){
		var record = "0\n";
		record += "EOF\n"
		return record;
	}
	this.startEntitySection = function(){
		var record = SECTION();
		record += ENTITIES();
		return record;
	}
	this.endEntitySection = function(){
		var record = ENDSEC();
		return record;
	}
	this.createLineEntity = function LINE(layer, color, point1, point2){
		var record = "0\n";
		record += "LINE\n";
		record += "8\n";
		record += layer + "\n";
		record += "62\n";
		record += color + "\n";
		record += "10\n";
		record += point1.x + "\n";
		record += "20\n";
		record += point1.y + "\n";
		record += "30\n";
		record += point1.z + "\n";
		record += "11\n";
		record += point2.x + "\n";
		record += "21\n";
		record += point2.y + "\n";
		record += "31\n";
		record += point2.z + "\n";		
		return record;
	}

	function DXF(program){
		var record = "999\n";
		record += "DXF created from " + program + "\n";
		return record;
	}
	function SECTION(){
		var record = "0\n";
		record += "SECTION\n";
		return record;
	}
	function HEADER(){
		var record = "2\n";
		record += "HEADER\n";
		return record;
	}
	function ACADVER(){
		var record = "9\n";
		record += "$ACADVER\n";
		record += "1\n";
		record += "AC1006\n";
		return record;
	}
	function INSBASE(){
		var record = "9\n";
		record += "$INSBASE\n";
		record += "10\n";
		record += "0.0\n";
		record += "20\n";
		record += "0.0\n";
		record += "30\n";
		record += "0.0\n";
		return record; 
	}
	function EXTMIN(xmin, ymin){
		var record = "9\n";
		record += "$EXTMIN\n";
		record += "10\n";
		record += xmin + "\n";
		record += "20\n";
		record += ymin + "\n";
		return record;
	}
	function EXTMAX(xmax, ymax){
		var record = "9\n";
		record += "$EXTMAX\n";
		record += "10\n";
		record += xmax + "\n";
		record += "20\n";
		record += ymax + "\n";
		return record;
	}
	function LINMIN(){
		var record = "9\n";
		record += "$LINMIN\n";
		record += "10\n";
		record += "0.0\n";
		record += "20\n";
		record += "0.0\n";
		return record;
	}
	function LINMAX(){
		var record = "9\n";
		record += "$LINMAX\n";
		record += "10\n";
		record += "1000.0\n";
		record += "20\n";
		record += "1000.0\n";
		return record;
	}
	function ENDSEC(){
		var record = "0\n";
		record += "ENDSEC\n";
		return record;
	}
	function TABLES(){
		var record = "2\n";
		record += "TABLES\n"
		return record;
	}
	function TABLE_LTYPE(){
		var record = "0\n";
		record += "TABLE\n";
		record += "2\n";		
		record += "LTYPE\n";
		record += "70\n";
		record += "1\n";
		record += "0\n";
		record += "LTYPE\n";
		record += "2\n";
		record += "CONTINUOUS\n";
		record += "70\n";
		record += "64\n";
		record += "3\n";
		record += "Solid line\n";
		record += "72\n";
		record += "65\n";
		record += "73\n";
		record += "0\n";
		record += "40\n";
		record += "0.000000\n";
		record += "0\n";
		record += "ENDTAB\n";
		
		return record;
	}
	function TABLE_LAYER(){
		var record = "0\n";
		record += "TABLE\n";
		record += "2\n";
		record += "LAYER\n";
		record += "70\n";
		record += "6\n";
		record += "0\n";
		record += "LAYER\n";
		record += "2\n";
		record += "1\n";
		record += "70\n";
		record += "64\n";
		record += "62\n";
		record += "7\n";
		record += "6\n";
		record += "CONTINUOUS\n";
		record += "0\n";
		record += "LAYER\n";
		record += "2\n";
		record += "2\n";
		record += "70\n";
		record += "64\n";
		record += "62\n";
		record += "7\n";
		record += "6\n";
		record += "CONTINUOUS\n";
		record += "0\n";
		record += "ENDTAB\n";
		return record;
	}
	function TABLE_STYLE(){
		var record = "0\n";
		record += "TABLE\n";
		record += "2\n";
		record += "STYLE\n";
		record += "70\n";
		record += "0\n";
		record += "0\n";
		record += "ENDTAB\n";
		return record;
	}
	function BLOCKS(){
		var record = "2\n";
		record += "BLOCKS\n";
		return record;
	}
	function ENTITIES(){
		var record = "2\n";
		record += "ENTITIES\n";
		return record;
	}
}