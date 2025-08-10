export class Grid {

  static validDigits = new Set([1,2,3,4,5,6,7,8,9]);

  constructor(gridDigits, visualizationTool = undefined) {

    this.visualizer = visualizationTool;

    this.gridDigits = gridDigits;
    this.cells = [];
    this.bands = Array.from({length:3}, () => []);
    this.stacks = Array.from({length:3}, () => []);
    this.columns = Array.from({length:9}, () => []);
    this.rows = Array.from({length:9}, () => []);
    this.boxes = Array.from({length:9}, () => []);
    this.horizontalTriplets = Array.from({length:27}, () => []);
    this.verticalTriplets = Array.from({length:27}, () => []);
    this.bitGroups = {
      "boxes":[0,0,0,0,0,0,0,0,0],
      "rows":[0,0,0,0,0,0,0,0,0],
      "columns":[0,0,0,0,0,0,0,0,0]
    }
    this.isGridValid = true;
    this.isGridComplete = true;

    this.colors = [
      "rgba(255, 109, 109, 0.36)",
      "rgba(255, 178, 96, 0.36)",
      "rgba(255, 229, 98, 0.36)",
      "rgba(124, 255, 107, 0.36)",
      "rgba(228, 228, 228, 0.36)",
      "rgba(102, 255, 255, 0.36)",
      "rgba(102, 132, 255, 0.36)",
      "rgba(162, 96, 255, 0.36)",
      "rgba(255, 101, 216, 0.36)",
      "rgba(227, 0, 0, 0.36)",
      "rgba(221, 114, 0, 0.36)",
      "rgba(216, 180, 0, 0.36)",
      "rgba(45, 226, 0, 0.36)",
      "rgba(135, 135, 135, 0.36)",
      "rgba(0, 211, 190, 0.36)",
      "rgba(0, 28, 214, 0.36)",
      "rgba(86, 0, 208, 0.36)",
      "rgba(222, 0, 166, 0.36)",
      "rgba(112, 0, 0, 0.36)",
      "rgba(121, 62, 0, 0.36)",
      "rgba(129, 107, 0, 0.36)",
      "rgba(32, 127, 0, 0.36)",
      "rgba(48, 48, 48, 0.36)",
      "rgba(0, 134, 120, 0.36)",
      "rgba(0, 17, 128, 0.36)",
      "rgba(54, 0, 129, 0.36)",
      "rgba(129, 0, 96, 0.36)",
    ];
    
    for (let i = 0; i < 81; i++) {
      const row = Math.floor(i/9);
      const col = i%9;
      const bandIndex = Math.floor(row/3);
      const stackIndex = Math.floor(col/3);
      const boxIndex = (bandIndex*3)+stackIndex;
      const horizontalTripletIndex = (row*3)+stackIndex;
      const verticalTripletIndex = (bandIndex*9)+col;

      const cell = {
        index:i, 
        row:row, 
        column:col, 
        box:boxIndex,
        band:bandIndex,
        stack:stackIndex,
        horizontalTriplet:horizontalTripletIndex,
        verticalTriplet:verticalTripletIndex,
        digit:this.gridDigits[i]
      }

      this.checkDigit(cell.digit, col, row, boxIndex);

      this.cells.push(cell);
      this.bands[bandIndex].push(cell);
      this.stacks[stackIndex].push(cell);
      this.columns[col].push(cell);
      this.rows[row].push(cell);
      this.boxes[boxIndex].push(cell);
      this.horizontalTriplets[horizontalTripletIndex].push(cell);
      this.verticalTriplets[verticalTripletIndex].push(cell)
    }
  }

  checkDigit(digit, col, row, box) {
    if (digit === 0) {
      this.isGridComplete = false;
      return
    } // Empty cell, no need to check

    if (!Grid.validDigits.has(digit)) {
      console.log("Not a valid digit at column",col,"and row",row);
      this.isGridValid = false;
    }

    const bit = 0b1 << (digit-1);
    if (this.bitGroups["boxes"][box] & bit) {
      console.log("Digit",digit,"repeated in box",box);
      this.isGridValid = false;
    }
    if (this.bitGroups["columns"][col] & bit) {
      console.log("Digit",digit,"repeated in column",col);
      this.isGridValid = false;
    }
    if (this.bitGroups["rows"][row] & bit) {
      console.log("Digit",digit,"repeated in row",row);
      this.isGridValid = false;
    }

    this.bitGroups["boxes"][box] |= bit;
    this.bitGroups["columns"][col] |= bit;
    this.bitGroups["rows"][row] |= bit;
  }

  validateGrid() {
    this.bitGroups = {
      "boxes":[0,0,0,0,0,0,0,0,0],
      "rows":[0,0,0,0,0,0,0,0,0],
      "columns":[0,0,0,0,0,0,0,0,0]
    }
    this.isGridComplete = true;
    this.isGridValid = true;
    for (const cell of this.cells) {
      this.checkDigit(cell.digit,cell.column,cell.row,cell.box);
    }
  }

  toFlatArray() {
    return this.cells.map((c) => c.digit);
  }

  async analyzeTriplets(tripletGroup, orientation, visualization = false) {
    if (!this.isGridComplete || !this.isGridValid) {return}

    const tripletDigitSetCount = {};
    const tripletDigitSetColors = {}
    let repeatedTripletSets = 0;

    let counter = 0;
    for (const triplet of tripletGroup) {
      
      let bitmask = 0;
      for (const c of triplet) {
        bitmask |= 1 << (c.digit - 1);
      }
      const key = bitmask;
      tripletDigitSetCount[key] = (tripletDigitSetCount[key] || 0) + 1;
      tripletDigitSetColors[key] = tripletDigitSetColors[key] || this.colors[Object.keys(tripletDigitSetCount).length-1];

      if (visualization && this.visualizer) {
        await this.visualizer.delay(130);
        this.visualizer.drawTriplet(tripletDigitSetColors[key],counter,orientation)
      }
      counter++

      if (tripletDigitSetCount[key] <= 1) {continue};
      if (tripletDigitSetCount[key] === 2) {
        if (visualization && this.visualizer){await this.visualizer.delay(180)};
        repeatedTripletSets+=2;
      } else {
        if (visualization && this.visualizer){await this.visualizer.delay(180)};
        repeatedTripletSets+=1;
      }
    }
    if (visualization && this.visualizer) {
      await this.visualizer.delay(1700);
      this.visualizer.clearCanvas();
    }
    return [repeatedTripletSets, Object.keys(tripletDigitSetCount).length];
  }

  async analyzeIntraBoxPosition(visualization = false) {
    if (!this.isGridComplete || !this.isGridValid) {return}

    const intraBoxPositions = [0,0,0,0,0,0,0,0,0];
    let digitsInRepeatedIBPositions = {};
    const bandIBPos = [{},{},{},{},{},{},{},{},{}]; // Band Intra-Box Positions
    const stackIBPos = [{},{},{},{},{},{},{},{},{}]; // Stack Intra-Box Positions
    let repeatedIBPositions = 0;
    let repeatedVerticalIBPos = 0;
    let repeatedHorizontalIBPos = 0;
    let cellsWithRepeatedIBPos = [];

    for (const cell of this.cells) {
      const digitIndex = cell.digit-1; //Index to access arrays elements based on digit.
      const vIBPosition = cell.row%3; // Vertical Intra-Box Position
      const hIBPosition = cell.column%3; // Horizontal Intra-Box Position
      const intraBoxPosition = hIBPosition + (vIBPosition)*3; // 9 possible positions (0-8)

      const bandDigitKey = ((cell.band << 2) | hIBPosition);
      const stackDigitKey = ((cell.stack << 2) | vIBPosition);
      
      bandIBPos[digitIndex][bandDigitKey] = (bandIBPos[digitIndex][bandDigitKey] || 0) + 1;
      stackIBPos[digitIndex][stackDigitKey] = (stackIBPos[digitIndex][stackDigitKey] || 0) + 1;

      if (visualization && this.visualizer) {
        for (const cellWRIBP of cellsWithRepeatedIBPos) {
          this.visualizer.drawTriplet("rgba(253, 57, 57, 0.1)",cellWRIBP.horizontalTriplet,"horizontal");
          this.visualizer.drawTriplet("rgba(253, 57, 57, 0.1)",cellWRIBP.verticalTriplet,"vertical");
          this.visualizer.drawCell("rgba(253, 57, 57, 0.2)",cellWRIBP.index);
        }
        this.visualizer.drawBandOrStack("rgba(102, 186, 255, 0.20)", cell.band, "horizontal");
        this.visualizer.drawBandOrStack("rgba(102, 186, 255, 0.20)", cell.stack, "vertical");
        this.visualizer.drawTriplet("rgba(57, 80, 253, 0.20)",cell.horizontalTriplet,"horizontal");
        this.visualizer.drawTriplet("rgba(57, 80, 253, 0.20)",cell.verticalTriplet,"vertical");
        await this.visualizer.delay(130);
        this.visualizer.clearCanvas()
      }

      if (bandIBPos[digitIndex][bandDigitKey] === 2) {
        repeatedHorizontalIBPos+=2;
      } else if (bandIBPos[digitIndex][bandDigitKey] > 1) {
        repeatedHorizontalIBPos+=1;
      }
      if (stackIBPos[digitIndex][stackDigitKey] === 2) {
        repeatedVerticalIBPos+=2;
      } else if (stackIBPos[digitIndex][stackDigitKey] > 1) {
        repeatedVerticalIBPos+=1;
      }

      if (intraBoxPositions[digitIndex] & (0b1 << intraBoxPosition)) {
        const digitIBPosKey = cell.digit << 4 | hIBPosition << 2 | vIBPosition;
        if (digitsInRepeatedIBPositions[digitIBPosKey]) {
          repeatedIBPositions += 1;
        } else {
          repeatedIBPositions += 2;
        }
        digitsInRepeatedIBPositions[digitIBPosKey] = true;
        cellsWithRepeatedIBPos.push(cell);
      }
      intraBoxPositions[digitIndex] |= (0b1 << intraBoxPosition);
    }

    if (visualization && this.visualizer) {
      for (const cellWRIBP of cellsWithRepeatedIBPos) {
        this.visualizer.drawTriplet("rgba(253, 57, 57, 0.1)",cellWRIBP.horizontalTriplet,"horizontal");
        this.visualizer.drawTriplet("rgba(253, 57, 57, 0.1)",cellWRIBP.verticalTriplet,"vertical");
        this.visualizer.drawCell("rgba(253, 57, 57, 0.2)",cellWRIBP.index);
      }
      if (cellsWithRepeatedIBPos.length > 0) {await this.visualizer.delay(1700)}
      else {await this.visualizer.delay(500)}
      this.visualizer.clearCanvas();
    }
    return [repeatedIBPositions, repeatedHorizontalIBPos, repeatedVerticalIBPos]
  }

  calculateTDCPercentage(uniqueTripletSets,repeatedTripletSets) {
    let repeatedTripletSetsPercentage = 100*(repeatedTripletSets/54);
    let uniqueTripletSetsPercentage;
    if (uniqueTripletSets <= 6) {
      uniqueTripletSetsPercentage = 100*(uniqueTripletSets/6);
    } else {
      uniqueTripletSetsPercentage = 100*((54-uniqueTripletSets)/48);
    }
    return (uniqueTripletSetsPercentage/2)+(repeatedTripletSetsPercentage/2);
  }

  async analysisReport(visualization = false) {
    if (!this.isGridComplete || !this.isGridValid) {return}

    const IBPResults = await this.analyzeIntraBoxPosition(visualization);
    if (visualization){await this.visualizer.delay(300)}
    const TDCHorizontalResults = await this.analyzeTriplets(this.horizontalTriplets,"horizontal",visualization);
    if (visualization){await this.visualizer.delay(300)}
    const TDCVerticalResults = await this.analyzeTriplets(this.verticalTriplets,"vertical",visualization)

    const uniqueTripletSetsAmount = TDCHorizontalResults[1]+TDCVerticalResults[1];
    const repeatedTripletSetsAmount = TDCHorizontalResults[0]+TDCVerticalResults[0];

    const report = {
      IBPU:{
        percentage: 100-((100*IBPResults[0])/81),
        metric1:["Repeated digits in intra-box positions",IBPResults[0]]
      },
      IBPA:{
        percentage:100*((IBPResults[1]+IBPResults[2])/162),
        metric1:["Repeated digits in horizontal intra-box positions along bands",IBPResults[1]],
        metric2:["Repeated digits in vertical intra-box positions along stacks",IBPResults[2]],
      },
      TDC:{
        percentage: this.calculateTDCPercentage(uniqueTripletSetsAmount,repeatedTripletSetsAmount),
        metric1:["Unique triplet sets",TDCHorizontalResults[1]+TDCVerticalResults[1]],
        metric2:["Repeated triplet sets",TDCHorizontalResults[0]+TDCVerticalResults[0]],
      },
    }
    return report;
  }
}


