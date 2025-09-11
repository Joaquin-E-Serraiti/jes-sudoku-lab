export class SudokuLab {

    constructor(sudokuString = "000000000000000000000000000000000000000000000000000000000000000000000000000000000", visualizationTool = undefined) {

        this.visualizer = visualizationTool;
        this.sudokuString = sudokuString;
        this.cells = Array(81).fill(0);

        // Boxes, rows and columns bitmasks. 27 bitmasks, each has 9 bits (1 per digit)
        this.boxBits = [0,0,0,0,0,0,0,0,0]
        this.rowBits = [0,0,0,0,0,0,0,0,0]
        this.colBits = [0,0,0,0,0,0,0,0,0]

        // Triplets bitmasks. 1 bitmask per triplet (9 bits)
        this.horizontalTripletsBits = Array(81).fill(27);
        this.verticalTripletsBits = Array(81).fill(27);

        // Look up tables for indices
        this.cellRow = [];
        this.cellCol = [];
        this.cellBand = [];
        this.cellStack = [];
        this.cellBox = [];
        this.cellHTriplet = []; // Horizontal Triplet
        this.cellVTriplet = []; // Vertical Triplet

        // Ordered right to left, top to bottom
        this.horizontalTriplets = Array.from({length:27}, () => []);
        this.verticalTriplets = Array.from({length:27}, () => []);
        this.boxes = Array.from({length:9}, () => []);

        // Indices of horizontal and vertical triplets per box
        this.boxesHTriplets = Array.from({length:9}, () => []);
        this.boxesVTriplets = Array.from({length:9}, () => []);

        // Indices of boxes per band and stack
        this.bandBoxes = [[0, 1, 2], [3, 4, 5], [6, 7, 8]];
        this.stackBoxes = [[0, 3, 6], [1, 4, 7], [2, 5, 8]];

        this.fillLookUpTables();
        
        // Grid info
        this.isGridValid = true;
        this.isGridComplete = true;

        this.setNewGrid(sudokuString);

        this.gridsGenerated = [];
        this.transformations = {
            "tripletSwaps": [],
            "digitSwaps1": [],
            "digitSwaps2": [],
            "digitSwaps3": []}

        // Colors for visualization
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
    }

    fillLookUpTables() {
        for (let i = 0; i < 81; i++) {
            this.cellRow.push(Math.floor(i/9));
            this.cellCol.push(i%9);
            this.cellBand.push(Math.floor(i/27));
            this.cellStack.push(Math.floor((i%9)/3));
            this.cellBox.push((this.cellBand[i]*3)+this.cellStack[i]);
            this.cellHTriplet.push((this.cellRow[i]*3)+this.cellStack[i]);
            this.cellVTriplet.push((this.cellBand[i]*9)+this.cellCol[i]);

            this.horizontalTriplets[this.cellHTriplet[i]].push(i);
            this.verticalTriplets[this.cellVTriplet[i]].push(i);
            this.boxes[this.cellBox[i]].push(i);
        }
        for (let i = 0; i<27; i++) {
            const hTripletBox = (i % 3)+(Math.floor(i/9)*3);
            const vTripletBox = Math.floor(i/3);
            this.boxesHTriplets[hTripletBox].push(i);
            this.boxesVTriplets[vTripletBox].push(i);
        }
    }

    resetGridData() {
        this.cells = Array(81).fill(0);
        this.boxBits = [0,0,0,0,0,0,0,0,0];
        this.rowBits = [0,0,0,0,0,0,0,0,0];
        this.colBits = [0,0,0,0,0,0,0,0,0];
        this.horizontalTripletsBits = Array(27).fill(0);
        this.verticalTripletsBits = Array(27).fill(0);
        this.isGridValid = true;
        this.isGridComplete = true;
        this.transformations = {
            "tripletSwaps": [],
            "digitSwaps1": [],
            "digitSwaps2": [],
            "digitSwaps3": []}
    }

    setNewGrid(sudokuString) {
        const result = this.processSudokuString(sudokuString);
        if (!result) {
            this.resetGridData()
            console.log("Grid construction failed.")
        } else {
            //console.log("Grid constructed successfully")
        }
    }

    processSudokuString(sudokuString) {
        if (!(sudokuString instanceof String || typeof sudokuString === "string")) {
            console.log("Invalid sudoku string format.");
            return false
        }
        if (sudokuString.length != 81) {
            console.log("Sudoku string must contain exactly 81 characters. Current: ", sudokuString.length,".");
            return false
        }

        this.resetGridData()
        const validChars = {"1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
            "6": 6, "7": 7, "8": 8, "9": 9, "0": 0, ".": 0};
        for (let cellIndex = 0; cellIndex < 81; cellIndex++) {
            const char = sudokuString[cellIndex]
            if (!(char in validChars)) {
                console.log("Invalid characters in sudoku string. Valid characters are 1,2,3,4,5,6,7,8,9 and 0 or . for empty cells.");
                return false
            }
            const digit = validChars[char]
            if (digit === 0) {
                this.isGridComplete = false;
                continue
            }
            if (this.isDigitRepeated(cellIndex,digit)) {
                this.isGridValid = false;
            }
            this.addOrRemoveDigit(cellIndex,digit);
        }
        return true
    }

    addOrRemoveDigit(cellIndex,digit,remove=false) {
        const bit = 1 << (digit-1);
        const boxIndex = this.cellBox[cellIndex];
        const rowIndex = this.cellRow[cellIndex];
        const colIndex = this.cellCol[cellIndex];
        const hTripletIndex = this.cellHTriplet[cellIndex];
        const vTripletIndex = this.cellVTriplet[cellIndex];

        if (!remove) {
            this.boxBits[boxIndex] |= bit;
            this.rowBits[rowIndex] |= bit;
            this.colBits[colIndex] |= bit;
            this.horizontalTripletsBits[hTripletIndex] |= bit;
            this.verticalTripletsBits[vTripletIndex] |= bit;
            this.cells[cellIndex] = digit;
        } else {
            this.boxBits[boxIndex] &= ~bit;
            this.rowBits[rowIndex] &= ~bit;
            this.colBits[colIndex] &= ~bit;
            this.horizontalTripletsBits[hTripletIndex] &= ~bit;
            this.verticalTripletsBits[vTripletIndex] &= ~bit;
            this.cells[cellIndex] = 0;
        }
    }

    digitsAvailable(cellIndex) {
        const boxIndex = this.cellBox[cellIndex];
        const rowIndex = this.cellRow[cellIndex];
        const colIndex = this.cellCol[cellIndex];
        return ~(this.boxBits[boxIndex] | this.rowBits[rowIndex] | this.colBits[colIndex]) & 0b111111111;
    }

    isDigitRepeated(cellIndex,digit) {
        return !(this.digitsAvailable(cellIndex) & (1 << (digit-1)));
    }

    digitsBitsToList(digitsBits) {
        if (digitsBits > 0b111111111) {
            console.log("digitsBits out of range");
            return
        }
        const digitsList = [];
        if (digitsBits == 0) {
            return digitsList
        }
        while (digitsBits) {
            const lsb = digitsBits & ~(digitsBits-1); // Least Significant Bit
            const digit = Math.log2(lsb)+1;
            digitsList.push(digit);
            digitsBits &= (digitsBits-1);
        }
        return digitsList
    }
    digitsListToBits(digitsList=[]){
        let bits = 0
        for (const digit of digitsList){
            bits |= 1 << (digit-1)
        }
        return bits}

    isOnlyOneBitSet(bits) {
        return !(bits & (bits-1));
    }

    countSetBits(bitmask) {
        let count = 0;
        while (bitmask) {
            count++;
            bitmask &= (bitmask-1);
        }
        return count
    }

    listToString(list) {
        return list.join("");
    }
    getSudokuString() {
        return this.listToString(this.cells)
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    generateRandomGrids(numberOfGridsToGenerate) {
        const colBits = [...this.colBits];
        const rowBits = [...this.rowBits];
        const boxBits = [...this.boxBits];
        const hTripletsBits = [...this.horizontalTripletsBits];
        const vTripletsBits = [...this.verticalTripletsBits];
        const gridCells = [...this.cells];
        const isGridValid = this.isGridValid;
        const isGridComplete = this.isGridComplete;        
        for (let i = 0; i < numberOfGridsToGenerate; i++) {
            this.resetGridData();
            this.randomGridGenerator();
        }
        const gridsGenerated = this.gridsGenerated;
        this.gridsGenerated = [];
        this.cells = gridCells;
        this.colBits = colBits;
        this.rowBits = rowBits;
        this.boxBits = boxBits;
        this.horizontalTripletsBits = hTripletsBits;
        this.verticalTripletsBits = vTripletsBits;
        this.isGridComplete = isGridComplete;
        this.isGridValid = isGridValid;
        return gridsGenerated
    }

    randomGridGenerator(cell = 0) {
        if (cell == 81) {
            this.gridsGenerated.push(this.listToString([...this.cells]));
            return true
        }
        if (this.cells[cell] !== 0) {
            return this.randomGridGenerator(cell+1);
        }
        let availableDigits = this.digitsBitsToList(this.digitsAvailable(cell));
        availableDigits = this.shuffle(availableDigits);
        for (const randomDigit of availableDigits) {
            this.addOrRemoveDigit(cell,randomDigit);
            const result = this.randomGridGenerator(cell+1);
            this.addOrRemoveDigit(cell,randomDigit,true);
            if (result) {
                return true
            }
        }
        return false
    }


    async analyzeTriplets(tripletGroup, orientation, visualization = false) {
        if (!this.isGridComplete || !this.isGridValid) {return}

        const tripletDigitSetCount = {};
        const tripletDigitSetColors = {}
        let repeatedTripletSets = 0;

        let counter = 0;
        for (const triplet of tripletGroup) {
            
            let key = 0;
            for (const cellIndex of triplet) {
                const digit = this.cells[cellIndex];
                key |= 1 << (digit - 1);
            }
            tripletDigitSetCount[key] = (tripletDigitSetCount[key] || 0) + 1;
            tripletDigitSetColors[key] = tripletDigitSetColors[key] || this.colors[Object.keys(tripletDigitSetCount).length-1];

            if (visualization && this.visualizer) {
                await this.visualizer.delay(130);
                this.visualizer.drawTriplet(tripletDigitSetColors[key],counter,orientation)
            }
            counter++

            if (tripletDigitSetCount[key] === 2) {
                if (visualization && this.visualizer){await this.visualizer.delay(50)};
                repeatedTripletSets += 2;
            } else if (tripletDigitSetCount[key] > 2) {
                if (visualization && this.visualizer){await this.visualizer.delay(50)};
                repeatedTripletSets += 1;
            }
        }
        if (visualization && this.visualizer) {
            await this.visualizer.delay(3000);
            this.visualizer.clearCanvas();
        }
        return [repeatedTripletSets, Object.keys(tripletDigitSetCount).length];
    }

    async analyzeIntraBoxPosition(visualization = false) {
        if (!this.isGridComplete || !this.isGridValid) {return}

        // 1 bitmask per digit. Length = 9 bits (1 per intra-box position)
        const intraBoxPositions = [0,0,0,0,0,0,0,0,0];
        let repeatedIBPositions = 0;
        let digitsInRepeatedIBPositions = {};

        const bandIBPos = [{},{},{},{},{},{},{},{},{}]; // Band Intra-Box Positions
        const stackIBPos = [{},{},{},{},{},{},{},{},{}]; // Stack Intra-Box Positions
        
        let repeatedVerticalIBPos = 0;
        let repeatedHorizontalIBPos = 0;
        let cellsWithRepeatedIBPos = [];

        for (let cellIndex = 0; cellIndex < 81; cellIndex++) {
            const digit = this.cells[cellIndex];
            const digitIndex = digit-1; //Index to access arrays elements based on digit.

            const hIBPos = this.cellCol[cellIndex] % 3; // Horizontal Intra-Box Position
            const vIBPos = this.cellRow[cellIndex] % 3; // Vertical Intra-Box Position
            const intraBoxPosition = hIBPos + (vIBPos)*3; // 9 possible positions (0-8)

            // IBPA analysis logic 
            const bandDigitKey = ((this.cellBand[cellIndex] << 2) | hIBPos);
            const stackDigitKey = ((this.cellStack[cellIndex] << 2) | vIBPos);
            
            bandIBPos[digitIndex][bandDigitKey] = (bandIBPos[digitIndex][bandDigitKey] || 0) + 1;
            stackIBPos[digitIndex][stackDigitKey] = (stackIBPos[digitIndex][stackDigitKey] || 0) + 1;

            if (visualization && this.visualizer) {
                for (const cellWRIBP of cellsWithRepeatedIBPos) { 
                    // cellWRIBP = cell with repeated intra-box position
                    //this.visualizer.drawTriplet("rgba(253, 57, 57, 0.1)",this.cellHTriplet[cellWRIBP],"horizontal");
                    //this.visualizer.drawTriplet("rgba(253, 57, 57, 0.1)",this.cellVTriplet[cellWRIBP],"vertical");
                    this.visualizer.drawCell("rgba(232, 44, 44, 0.32)",cellWRIBP);
                }
                this.visualizer.drawBandOrStack("rgba(102, 186, 255, 0.20)", this.cellBand[cellIndex], "horizontal");
                this.visualizer.drawBandOrStack("rgba(102, 186, 255, 0.20)", this.cellStack[cellIndex], "vertical");
                this.visualizer.drawTriplet("rgba(57, 80, 253, 0.20)",this.cellHTriplet[cellIndex],"horizontal");
                this.visualizer.drawTriplet("rgba(57, 80, 253, 0.20)",this.cellVTriplet[cellIndex],"vertical");
                await this.visualizer.delay(130);
                this.visualizer.clearCanvas()
            }

            if (bandIBPos[digitIndex][bandDigitKey] === 2) {
                repeatedHorizontalIBPos+=2;
            } else if (bandIBPos[digitIndex][bandDigitKey] > 2) {
                repeatedHorizontalIBPos+=1;
            }
            if (stackIBPos[digitIndex][stackDigitKey] === 2) {
                repeatedVerticalIBPos+=2;
            } else if (stackIBPos[digitIndex][stackDigitKey] > 2) {
                repeatedVerticalIBPos+=1;
            }

            // IBPU analysis logic
            if (intraBoxPositions[digitIndex] & (0b1 << intraBoxPosition)) {
                const digitIBPosKey = digit << 4 | intraBoxPosition;
                if (digitIBPosKey in digitsInRepeatedIBPositions) {
                    repeatedIBPositions += 1;
                } else {
                    digitsInRepeatedIBPositions[digitIBPosKey] = true;
                    repeatedIBPositions += 2;
                }
                cellsWithRepeatedIBPos.push(cellIndex);
            }
            intraBoxPositions[digitIndex] |= (0b1 << intraBoxPosition);
        }

        if (visualization && this.visualizer) {
            for (const cellWRIBP of cellsWithRepeatedIBPos) {
                //this.visualizer.drawTriplet("rgba(253, 57, 57, 0.1)",this.cellHTriplet[cellWRIBP],"horizontal");
                //this.visualizer.drawTriplet("rgba(253, 57, 57, 0.1)",this.cellVTriplet[cellWRIBP],"vertical");
                this.visualizer.drawCell("rgba(232, 44, 44, 0.32)",cellWRIBP);
            }
            if (cellsWithRepeatedIBPos.length > 0) {await this.visualizer.delay(1700)}
            else {await this.visualizer.delay(500)}
            this.visualizer.clearCanvas();
        }
        return [repeatedIBPositions, repeatedHorizontalIBPos, repeatedVerticalIBPos]
    }

    async analyzeDAC(visualization=false) {
        if (!this.isGridComplete || !this.isGridValid) {return}

        // 4 bitmasks (up, right, down, left) per digit. Each bitmask stores digits 1 to 9.
        const adjacentDigits = {1: [0, 0, 0, 0], 2: [0, 0, 0, 0], 3: [0, 0, 0, 0],
                                4: [0, 0, 0, 0], 5: [0, 0, 0, 0], 6: [0, 0, 0, 0],
                                7: [0, 0, 0, 0], 8: [0, 0, 0, 0], 9: [0, 0, 0, 0]};
        
        let repeatedAdjacentDigits = 0;
        let uniqueAdjacentDigits = 0;

        let boxIndex = 0;
        for (const box of this.boxes) {
            for (let i = 0; i < 9; i++) {
                const cellIndex = box[i];
                const digit = this.cells[cellIndex];
                // 0 = up, 1 = right, 2 = down, 3 = left

                if (visualization && this.visualizer) {
                    this.visualizer.drawBox("rgba(102, 186, 255, 0.17)", boxIndex);
                    this.visualizer.drawCell("rgba(57, 80, 253, 0.33)", cellIndex);
                }

                for (let direction = 0; direction < 4; direction++) {
                    let adjacentIndex = undefined;
                    switch (direction) {
                        case 0: 
                            adjacentIndex = i-3
                            break
                        case 1: 
                            adjacentIndex = i+1
                            break
                        case 2: 
                            adjacentIndex = i+3
                            break
                        case 3: 
                            adjacentIndex = i-1
                            break
                    }
                    if (adjacentIndex > 8 || adjacentIndex < 0){continue}

                    const adjacentCellIndex = box[adjacentIndex];
                    const cellCol = this.cellCol[cellIndex];
                    const adjacentCellCol = this.cellCol[adjacentCellIndex];
                    const cellRow = this.cellRow[cellIndex];
                    const adjacentCellRow = this.cellRow[adjacentCellIndex];

                    if ((cellCol != adjacentCellCol) && (cellRow != adjacentCellRow)) {continue}
                    
                    let isAdjacentDigitRepeated = false;
                    const adjacentDigit = this.cells[adjacentCellIndex];
                    if (adjacentDigits[digit][direction] & (1 << (adjacentDigit-1))) {
                            repeatedAdjacentDigits += 1;
                            isAdjacentDigitRepeated = true
                    }
                    
                    if (visualization && this.visualizer) {
                        if (isAdjacentDigitRepeated) {
                            this.visualizer.drawCell("rgba(57, 253, 168, 0.24)", adjacentCellIndex);
                        } else {
                            this.visualizer.drawCell("rgba(253, 57, 83, 0.18)", adjacentCellIndex);
                        }
                    }
                    
                    adjacentDigits[digit][direction] |= (1 << (adjacentDigit-1));
                }

                if (visualization && this.visualizer) {
                    await this.visualizer.delay(150);
                    this.visualizer.clearCanvas();
                }
            }
            boxIndex++;
        }

        for (let digit = 1; digit < 10; digit++) {
            for (let direction = 0; direction < 4; direction++) {
                uniqueAdjacentDigits += this.countSetBits(adjacentDigits[digit][direction])
            }
        }

        // Maximum of 180 repeated adjacent digits. Don't know the minimum (it's equal to or higher than 0).
        // Minimum of 36 unique adjacent digits. Don't know the maximum, but it is equal to or lower than 324 (324 = 9 digits x 4 directions x 9 digits, as if each digit had 9 unique adjacent digits in each one of the 4 directions).
        return [repeatedAdjacentDigits, uniqueAdjacentDigits]

    }

    calculateDACPercentage(repeatedAdjacentDigits) {
        return (100/180)*repeatedAdjacentDigits
    }

    calculateTDCPercentage(uniqueTripletSets,repeatedTripletSets) {
        const repeatedTripletSetsPercentage = 100*(repeatedTripletSets/54)
        const uniqueTripletSetsPercentage = 100*((54-uniqueTripletSets)/48)
        return (uniqueTripletSetsPercentage+repeatedTripletSetsPercentage)/2
    }

    async analysisReport(visualization = false) {
        if (!this.isGridComplete || !this.isGridValid) {return}

        const IBPResults = await this.analyzeIntraBoxPosition(visualization);
        if (visualization){await this.visualizer.delay(300)}
        const TDCHorizontalResults = await this.analyzeTriplets(this.horizontalTriplets,"horizontal",visualization);
        if (visualization){await this.visualizer.delay(300)}
        const TDCVerticalResults = await this.analyzeTriplets(this.verticalTriplets,"vertical",visualization);
        if (visualization){await this.visualizer.delay(300)}
        const DACResults = await this.analyzeDAC(visualization);

        // Horizontal + vertical
        const uniqueTripletSets = TDCHorizontalResults[1]+TDCVerticalResults[1];
        const repeatedTripletSets = TDCHorizontalResults[0]+TDCVerticalResults[0];

        const report = {
            "IBPU":{
                "percentage": Math.floor((100-((100*IBPResults[0])/81))*100)/100,
                "metrics":[
                    // Repeated digits in intra-box positions
                    IBPResults[0]
                ]
            },
            "IBPA":{
                "percentage":Math.floor((100*((IBPResults[1]+IBPResults[2])/162))*100)/100,
                "metrics":[
                    // Repeated digits in horizontal intra-box positions along bands
                    IBPResults[1],
                    // Repeated digits in vertical intra-box positions along stacks
                    IBPResults[2]
                ]
            },
            "TDC":{
                "percentage": Math.floor(this.calculateTDCPercentage(uniqueTripletSets,repeatedTripletSets)*100)/100,
                "metrics":[
                    // Unique horizontal triplet sets
                    TDCHorizontalResults[1],
                    // Unique vertical triplet sets
                    TDCVerticalResults[1],
                    // Repeated horizontal triplet sets
                    TDCHorizontalResults[0],
                    // Repeated vertical triplet sets
                    TDCVerticalResults[0],
                ]
            },
            "DAC": {
                "percentage": Math.floor(this.calculateDACPercentage(DACResults[0])*100)/100,
                "metrics": [
                    // Repeated adjacent digits
                    DACResults[0],
                    // Unique adjacent digits
                    DACResults[1]
                ]
            }
        }
        return report;
    }


    tripletTargetCells(tripletCellsIndices, digitPairBits) {
        const targetCells = [];
        for (const cellIndex of tripletCellsIndices) {
            const digit = this.cells[cellIndex];
            if (digitPairBits & (1 << (digit-1))){
                targetCells.push(cellIndex);
            }
        }
        return targetCells
    }

    twoBitsShared(bitmask1, bitmask2) {
        return (this.countSetBits(bitmask1 & bitmask2) == 2)
    }

    getOrientationData(orientation="horizontal") {
        const orientationData = {};
        if (orientation == "horizontal"){
            orientationData["boxTriplets"] = this.boxesHTriplets;
            orientationData["tripletsBits"] = this.horizontalTripletsBits;
            orientationData["tripletsCellsIndices"] = this.horizontalTriplets;
            orientationData["bandOrStackBoxes"] = this.stackBoxes;
        } else if (orientation == "vertical") {
            orientationData["boxTriplets"] = this.boxesVTriplets;
            orientationData["tripletsBits"] = this.verticalTripletsBits;
            orientationData["tripletsCellsIndices"] = this.verticalTriplets;
            orientationData["bandOrStackBoxes"] = this.bandBoxes;
        }
        return orientationData
    }
    
    tripletSwaps(targetBoxIndex, triplet0Index, orientationData) {
        const triplet0Bits = orientationData["tripletsBits"][triplet0Index]
        for (const triplet1Index of orientationData["boxTriplets"][targetBoxIndex]) {
            const triplet1Bits = orientationData["tripletsBits"][triplet1Index]
            if (triplet0Bits == triplet1Bits) {
                const triplet0Cells = orientationData["tripletsCellsIndices"][triplet0Index]
                const triplet1Cells = orientationData["tripletsCellsIndices"][triplet1Index]
                const cellPair1 = [triplet0Cells[0], triplet1Cells[0]]
                const cellPair2 = [triplet0Cells[1], triplet1Cells[1]]
                const cellPair3 = [triplet0Cells[2], triplet1Cells[2]]
                this.transformations["tripletSwaps"].push(
                    [cellPair1, cellPair2, cellPair3])
                return triplet1Index
            }
        }
        return null
    }

    digitSwaps1( bandOrStackIndex, triplet0Index, orientationData) {
        const triplet0Bits = orientationData["tripletsBits"][triplet0Index];
        const bandOrStackBoxes = orientationData["bandOrStackBoxes"][bandOrStackIndex];
        const box1Index = bandOrStackBoxes[1];
        const box2Index = bandOrStackBoxes[2];
        const box1Triplets = orientationData["boxTriplets"][box1Index];;
        const box2Triplets = orientationData["boxTriplets"][box2Index]

        for (const triplet1Index of box1Triplets) {
            const triplet1Bits = orientationData["tripletsBits"][triplet1Index]
            const sharedDigitsNumber = this.countSetBits(triplet0Bits & triplet1Bits);
            if (!(sharedDigitsNumber>=2)) {continue}
            if (sharedDigitsNumber == 3) {
                for (const skippedCellIndex of [0,1,2]) {
                    const triplet0Copy = [...orientationData["tripletsCellsIndices"][triplet0Index]];
                    triplet0Copy.splice(skippedCellIndex,1);
                    const triplet0Bits2 = this.digitsListToBits([this.cells[triplet0Copy[0]],this.cells[triplet0Copy[1]]]);
                    const skippedDigitBit = 1<<(this.cells[orientationData["tripletsCellsIndices"][triplet0Index][skippedCellIndex]]-1)
                    const digitPairBits2 = triplet0Bits2 & (triplet1Bits-skippedDigitBit);

                    for (const triplet2Index of box2Triplets) {
                        const triplet2Bits = orientationData["tripletsBits"][triplet2Index];
                        if (!this.twoBitsShared(digitPairBits2, triplet2Bits)) {
                            continue
                        }
                        const triplet0Cells = this.tripletTargetCells(orientationData["tripletsCellsIndices"][triplet0Index],digitPairBits2);
                        const triplet1Cells = this.tripletTargetCells(orientationData["tripletsCellsIndices"][triplet1Index],digitPairBits2);
                        const triplet2Cells = this.tripletTargetCells(orientationData["tripletsCellsIndices"][triplet2Index],digitPairBits2);
        
                        this.transformations["digitSwaps1"].push([
                            this.tripletTargetCells(triplet0Cells, digitPairBits2),
                            this.tripletTargetCells(triplet1Cells, digitPairBits2),
                            this.tripletTargetCells(triplet2Cells, digitPairBits2)
                        ]);
                    }
                }
                continue
            }
            const digitPairBits = triplet0Bits & triplet1Bits;
            for (const triplet2Index of box2Triplets) {
                const triplet2Bits = orientationData["tripletsBits"][triplet2Index];
                if (this.twoBitsShared(digitPairBits, triplet2Bits)) {

                    const triplet0Cells = this.tripletTargetCells(orientationData["tripletsCellsIndices"][triplet0Index],digitPairBits);
                    const triplet1Cells = this.tripletTargetCells(orientationData["tripletsCellsIndices"][triplet1Index],digitPairBits);
                    const triplet2Cells = this.tripletTargetCells(orientationData["tripletsCellsIndices"][triplet2Index],digitPairBits);

                    this.transformations["digitSwaps1"].push([
                        this.tripletTargetCells(triplet0Cells, digitPairBits),
                        this.tripletTargetCells(triplet1Cells, digitPairBits),
                        this.tripletTargetCells(triplet2Cells, digitPairBits)
                    ]);

                    if (sharedDigitsNumber == 2) {return [triplet1Index, triplet2Index]}
                    
                }
            }
        }
        return null
    }

    digitSwaps2(targetBoxIndex, triplet0Index, skippedCellIndex, orientationData) {
        const triplet0 = orientationData["tripletsCellsIndices"][triplet0Index];
        const triplet0TargetCells = [...triplet0];
        triplet0TargetCells.splice(skippedCellIndex,1);
        const triplet0DigitPair = [
            this.cells[triplet0TargetCells[0]],
            this.cells[triplet0TargetCells[1]]];
        const triplet0Bits = this.digitsListToBits(triplet0DigitPair);
        for (const triplet1Index of orientationData["boxTriplets"][targetBoxIndex]) {
            const triplet1CellIndices = orientationData["tripletsCellsIndices"][triplet1Index];
            const triplet1TargetCells = [...triplet1CellIndices];
            triplet1TargetCells.splice(skippedCellIndex,1);
            const triplet1DigitPair = [
                this.cells[triplet1TargetCells[0]],
                this.cells[triplet1TargetCells[1]]];
            const triplet1Bits = this.digitsListToBits(triplet1DigitPair);
            if (triplet0Bits == triplet1Bits) {
                this.transformations["digitSwaps2"].push(
                    [triplet0TargetCells, triplet1TargetCells]);
                return triplet1Index
            }
        }
        return null
    }

    digitSwaps3(bandOrStackIndex, triplet0Index, skippedCellIndex, orientationData) {
        const triplet0 = orientationData["tripletsCellsIndices"][triplet0Index];
        const triplet0TargetCells = [...triplet0];
        triplet0TargetCells.splice(skippedCellIndex,1);
        const triplet0DigitPair = [this.cells[triplet0TargetCells[0]],
                                this.cells[triplet0TargetCells[1]]];
        const triplet0Bits = this.digitsListToBits(triplet0DigitPair);
        const bandOrStackBoxes = orientationData["bandOrStackBoxes"][bandOrStackIndex];
        const box1Index = bandOrStackBoxes[1];
        const box2Index = bandOrStackBoxes[2];
        const box1Triplets = orientationData["boxTriplets"][box1Index];
        const box2Triplets = orientationData["boxTriplets"][box2Index];

        for (const triplet1Index of box1Triplets) {
            const triplet1 = orientationData["tripletsCellsIndices"][triplet1Index];
            const triplet1TargetCells = [...triplet1];
            triplet1TargetCells.splice(skippedCellIndex,1);
            const triplet1DigitPair = [this.cells[triplet1TargetCells[0]],
                                    this.cells[triplet1TargetCells[1]]];
            const triplet1Bits = this.digitsListToBits(triplet1DigitPair);
            if (!(this.countSetBits(triplet0Bits & triplet1Bits) == 1)){continue}
            for (const triplet2Index of box2Triplets) {
                const triplet2 = orientationData["tripletsCellsIndices"][triplet2Index];
                const triplet2TargetCells = [...triplet2];
                triplet2TargetCells.splice(skippedCellIndex,1);
                const triplet2DigitPair = [this.cells[triplet2TargetCells[0]],
                                        this.cells[triplet2TargetCells[1]]];
                const triplet2Bits = this.digitsListToBits(triplet2DigitPair);

                if ((triplet0Bits ^ triplet1Bits) == triplet2Bits) {
                    this.transformations["digitSwaps3"].push(
                        [triplet0TargetCells,
                         triplet1TargetCells,
                         triplet2TargetCells]
                    );
                    return [triplet1Index, triplet2Index]
                }
            }
        }
        return null
    }

    findTransformations() {
        this.transformations = {
            "tripletSwaps": [],
            "digitSwaps1": [],
            "digitSwaps2": [],
            "digitSwaps3": []}
        for (const horizontalOrVertical of ["horizontal", "vertical"]) {
            const orientationData = this.getOrientationData(horizontalOrVertical);
            for (const banOrStackIndex of [0,1,2]) {
                for (const tripletBoxIndex of [0,1,2]) {
                    const bandOrStackBoxes = orientationData["bandOrStackBoxes"];
                    const Box0Index = bandOrStackBoxes[banOrStackIndex][0];
                    const Box1Index = bandOrStackBoxes[banOrStackIndex][1];

                    // Triplet Swaps Logic
                    let triplet0Index = orientationData["boxTriplets"][Box0Index][tripletBoxIndex];
                    this.tripletSwaps(
                        bandOrStackBoxes[banOrStackIndex][1], triplet0Index, orientationData);
                    this.tripletSwaps(
                        bandOrStackBoxes[banOrStackIndex][2], triplet0Index, orientationData);
                    triplet0Index = orientationData["boxTriplets"][Box1Index][tripletBoxIndex];
                    this.tripletSwaps(
                        bandOrStackBoxes[banOrStackIndex][2], triplet0Index, orientationData);

                    // Digit Swaps 1 Logic
                    triplet0Index = orientationData["boxTriplets"][Box0Index][tripletBoxIndex];
                    this.digitSwaps1(banOrStackIndex,triplet0Index, orientationData);

                    for (const skippedCellIndex of [0,1,2]) {
                        // Digit Swaps 2 Logic
                        this.digitSwaps2(
                            bandOrStackBoxes[banOrStackIndex][1], triplet0Index, skippedCellIndex, orientationData);
                        this.digitSwaps2(
                            bandOrStackBoxes[banOrStackIndex][2], triplet0Index, skippedCellIndex, orientationData);
                        triplet0Index = orientationData["boxTriplets"][Box1Index][tripletBoxIndex];
                        this.digitSwaps2(
                            bandOrStackBoxes[banOrStackIndex][2], triplet0Index, skippedCellIndex, orientationData);

                        // Digit Swaps 3 Logic
                        triplet0Index = orientationData["boxTriplets"][Box0Index][tripletBoxIndex];
                        this.digitSwaps3(
                            banOrStackIndex, triplet0Index, skippedCellIndex, orientationData);
                    }
                }
            }
        }
    }

    applyTransformation(cellPairs){
        const swappedCellPairsDigits = [];
        for (const cellPair of cellPairs) {
            const cellDigit1 = this.cells[cellPair[0]];
            const cellDigit2 = this.cells[cellPair[1]];
            swappedCellPairsDigits.push([cellDigit2, cellDigit1]);
            this.addOrRemoveDigit(cellPair[0], cellDigit1, true);
            this.addOrRemoveDigit(cellPair[1], cellDigit2, true);
        }
        let counter = 0
        for (const cellPair of cellPairs){
            const cellDigit1 = swappedCellPairsDigits[counter][0];
            const cellDigit2 = swappedCellPairsDigits[counter][1];
            this.addOrRemoveDigit(cellPair[0], cellDigit1, false);
            this.addOrRemoveDigit(cellPair[1], cellDigit2, false);
            counter++;
        }
    }
}
