import random


class SudokuLab:
    def __init__(self, sudokuString="000000000000000000000000000000000000000000000000000000000000000000000000000000000"):
        self.sudokuString = sudokuString
        self.cells = [0 for i in range(81)]

        # 1 bitmask (9 bits, 1 per digit) per box
        self.boxBits = [0, 0, 0, 0, 0, 0, 0, 0, 0]
        # 1 bitmask (9 bits, 1 per digit) per column
        self.colBits = [0, 0, 0, 0, 0, 0, 0, 0, 0]
        # 1 bitmask (9 bits, 1 per digit) per row
        self.rowBits = [0, 0, 0, 0, 0, 0, 0, 0, 0]
        # 1 bitmask per digit, 1 bit per intra-box position
        self.intraBoxPositions = [0, 0, 0, 0, 0, 0, 0, 0, 0]
        # 1 bitmask per horizontal triplet (9 bits).
        self.horizontalTripletsBits = [0 for i in range(27)]
        # 1 bitmask per vertical triplet (9 bits).
        self.verticalTripletsBits = [0 for i in range(27)]

        # Look up tables for indices
        self.cellRow = []
        self.cellCol = []
        self.cellBand = []
        self.cellStack = []
        self.cellBox = []
        self.cellHTriplet = []  # Horizontal Triplet
        self.cellVTriplet = []  # Vertical Triplet

        # Ordered right to left, top to bottom
        self.horizontalTriplets = [[] for i in range(27)]
        self.verticalTriplets = [[] for i in range(27)]
        self.boxes = [[] for i in range(9)]

        # Indices of horizontal and vertical triplets per box
        self.boxesHTriplets = [[] for i in range(9)]
        self.boxesVTriplets = [[] for i in range(9)]

        # Indices of boxes per band and stack
        self.bandBoxes = [[0, 1, 2], [3, 4, 5], [6, 7, 8]]
        self.stackBoxes = [[0, 3, 6], [1, 4, 7], [2, 5, 8]]

        self.fillLookUpTables()

        # Grid info
        self.isGridValid = True
        self.isGridComplete = True

        self.setNewGrid(sudokuString)
        self.gridsGenerated = []
        self.transformations = {
            "tripletSwaps": [],
            "digitSwaps1": [],
            "digitSwaps2": [],
            "digitSwaps3": []}

    def fillLookUpTables(self):
        for i in range(81):
            self.cellRow.append((i//9))
            self.cellCol.append(i % 9)
            self.cellBand.append((i//27))
            self.cellStack.append(((i % 9)//3))
            self.cellBox.append((self.cellBand[i]*3) + self.cellStack[i])
            self.cellHTriplet.append((self.cellRow[i]*3) + self.cellStack[i])
            self.cellVTriplet.append((self.cellBand[i]*9) + self.cellCol[i])

            self.horizontalTriplets[self.cellHTriplet[i]].append(i)
            self.verticalTriplets[self.cellVTriplet[i]].append(i)
            self.boxes[self.cellBox[i]].append(i)

        for i in range(27):
            hTripletBox = (i % 3)+((i//9)*3)
            vTripletBox = (i//3)
            self.boxesHTriplets[hTripletBox].append(i)
            self.boxesVTriplets[vTripletBox].append(i)

    def setNewGrid(self, newSudokuString):
        result = self.processSudokuString(newSudokuString)
        if not result:
            self.resetGridData()
            print("Grid construction failed.")
        else:
            pass
            # print("Grid successfully constructed")

    def resetGridData(self):
        self.cells = [0 for i in range(81)]
        self.boxBits = [0, 0, 0, 0, 0, 0, 0, 0, 0]
        self.colBits = [0, 0, 0, 0, 0, 0, 0, 0, 0]
        self.rowBits = [0, 0, 0, 0, 0, 0, 0, 0, 0]
        self.intraBoxPositions = [0, 0, 0, 0, 0, 0, 0, 0, 0]
        self.horizontalTripletsBits = [0 for i in range(27)]
        self.verticalTripletsBits = [0 for i in range(27)]
        self.isGridValid = True
        self.isGridComplete = True
        self.transformations = {
            "tripletSwaps": [],
            "digitSwaps1": [],
            "digitSwaps2": [],
            "digitSwaps3": []}

    def processSudokuString(self, sudokuString):
        if not isinstance(sudokuString, str):
            print("Invalid sudoku string format.")
            return False
        if len(sudokuString) != 81:
            print(
                f"Sudoku string must contain exactly 81 characters. Current: {len(sudokuString)}.")
            return False

        self.resetGridData()
        validChars = {"1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "."}

        for cellIndex in range(81):
            char = sudokuString[cellIndex]
            if char not in validChars:
                print(
                    "Invalid characters in sudoku string. Valid characters are 1,2,3,4,5,6,7,8,9 and 0 or . for empty cells.")
                return False

            digit = 0 if char == "." else int(char)
            if digit == 0:
                self.isGridComplete = False
                continue

            if self.isDigitRepeated(cellIndex, digit):
                self.isGridValid = False
            self.addOrRemoveDigit(cellIndex, digit)

        return True

    def addOrRemoveDigit(self, cellIndex, digit, remove=False):
        bit = 1 << (digit-1)
        boxIndex = self.cellBox[cellIndex]
        rowIndex = self.cellRow[cellIndex]
        colIndex = self.cellCol[cellIndex]
        hTripletIndex = self.cellHTriplet[cellIndex]
        vTripletIndex = self.cellVTriplet[cellIndex]
        if not remove:
            self.boxBits[boxIndex] |= bit
            self.rowBits[rowIndex] |= bit
            self.colBits[colIndex] |= bit
            self.intraBoxPositions[digit -
                                   1] |= (1 << ((colIndex % 3) + ((rowIndex % 3)*3)))
            self.horizontalTripletsBits[hTripletIndex] |= bit
            self.verticalTripletsBits[vTripletIndex] |= bit
            self.cells[cellIndex] = digit
        else:
            self.boxBits[boxIndex] &= ~bit
            self.rowBits[rowIndex] &= ~bit
            self.colBits[colIndex] &= ~bit
            self.intraBoxPositions[digit -
                                   1] &= ~(1 << ((colIndex % 3) + ((rowIndex % 3)*3)))
            self.horizontalTripletsBits[hTripletIndex] &= ~bit
            self.verticalTripletsBits[vTripletIndex] &= ~bit
            self.cells[cellIndex] = 0

    def isDigitRepeated(self, cellIndex, digit):
        return not (self.digitsAvailable(cellIndex) & (1 << (digit-1)))

    def digitsAvailable(self, cellIndex):
        boxIndex = self.cellBox[cellIndex]
        rowIndex = self.cellRow[cellIndex]
        colIndex = self.cellCol[cellIndex]
        return ~(self.boxBits[boxIndex] | self.rowBits[rowIndex] | self.colBits[colIndex]) & 0b111111111

    def digitsBitsToList(self, digitsBits):
        if digitsBits > 0b111111111:
            raise ValueError("digitsBits out of range")
        digitsList = []
        while digitsBits:
            # Least Significant Bit
            lsb = digitsBits & ~(digitsBits-1)
            digit = lsb.bit_length()
            digitsList.append(digit)
            digitsBits &= (digitsBits-1)
        return digitsList

    def digitsListToBits(self, digitsList=[]):
        bits = 0
        for digit in digitsList:
            bits |= 1 << (digit-1)
        return bits

    @staticmethod
    def onlyOneBitSet(bits):
        return not (bits & (bits - 1))

    @staticmethod
    def listToString(list):
        return "".join(str(element) for element in list)

    def printGrid(self, sudokuString=None):
        if sudokuString == None:
            sudokuString = self.getSudokuString()
        print("-------------------")
        for i in range(9):
            if i % 3 == 0 and i != 0:
                print("| --------------- |")
            print(
                f"| {sudokuString[0+(9*i):3+(9*i)]} | {sudokuString[3+(9*i):6+(9*i)]} | {sudokuString[6+(9*i):9+(9*i)]} |")
        print("-------------------")

    def getSudokuString(self):
        return self.listToString(self.cells)

    def generateRandomGrids(self, numberOfGridsToGenerate):
        colBits = self.colBits.copy()
        rowBits = self.rowBits.copy()
        boxBits = self.boxBits.copy()
        hTripletsBits = self.horizontalTripletsBits.copy()
        vTripletsBits = self.verticalTripletsBits.copy()
        IBPositions = self.intraBoxPositions.copy()
        gridCells = self.cells.copy()
        isGridValid = self.isGridValid
        isGridComplete = self.isGridComplete
        for i in range(numberOfGridsToGenerate):
            self.resetGridData()
            self.randomGridGenerator()
        gridsGenerated = self.gridsGenerated.copy()
        self.gridsGenerated = []
        self.cells = gridCells
        self.colBits = colBits
        self.rowBits = rowBits
        self.boxBits = boxBits
        self.horizontalTripletsBits = hTripletsBits
        self.verticalTripletsBits = vTripletsBits
        self.intraBoxPositions = IBPositions
        self.isGridComplete = isGridComplete
        self.isGridValid = isGridValid
        return gridsGenerated

    def randomGridGenerator(self, cell=0):
        if cell == 81:
            self.gridsGenerated.append(self.listToString(self.cells.copy()))
            return True

        if self.cells[cell] != 0:
            return self.randomGridGenerator(cell + 1)

        availableDigits = self.digitsBitsToList(self.digitsAvailable(cell))
        random.shuffle(availableDigits)
        for randomDigit in availableDigits:
            self.addOrRemoveDigit(cell, randomDigit, remove=False)
            result = self.randomGridGenerator(cell+1)
            self.addOrRemoveDigit(cell, randomDigit, remove=True)
            if result:
                return True
        return False

    def analyzeTriplets(self, tripletGroup):
        if not self.isGridComplete or not self.isGridValid:
            return

        tripletDigitSetCount = {}
        repeatedTripletSets = 0

        for triplet in tripletGroup:
            key = 0
            for cellIndex in triplet:
                digit = self.cells[cellIndex]
                key |= 1 << (digit-1)
            if key in tripletDigitSetCount:
                tripletDigitSetCount[key] += 1
            else:
                tripletDigitSetCount[key] = 1

            if tripletDigitSetCount[key] == 2:
                repeatedTripletSets += 2
            elif tripletDigitSetCount[key] > 2:
                repeatedTripletSets += 1

        return [repeatedTripletSets, len(tripletDigitSetCount)]

    def analyzeIntraBoxPositions(self):
        if not self.isGridComplete or not self.isGridValid:
            return

        # 1 bitmask per digit. Length = 9 bits (1 per intra-box position)
        intraBoxPositions = [0, 0, 0, 0, 0, 0, 0, 0, 0]
        repeatedIBPositions = 0
        digitsInRepeatedIBPositions = {}

        # Band Intra-Box Positions
        bandIBPos = [{}, {}, {}, {}, {}, {}, {}, {}, {}]
        # Stack Intra-Box Positions
        stackIBPos = [{}, {}, {}, {}, {}, {}, {}, {}, {}]

        repeatedVerticalIBPositions = 0
        repeatedHorizontalIBPositions = 0

        for cellIndex in range(81):
            digit = self.cells[cellIndex]
            # Index to access arrays elements based on digit.
            digitIndex = digit-1
            verticalIBPosition = self.cellRow[cellIndex] % 3
            horizontalIBPosition = self.cellCol[cellIndex] % 3
            intraBoxPosition = horizontalIBPosition + (verticalIBPosition)*3

            # IBPA Analysis Logic
            bandDigitKey = (self.cellBand[cellIndex]
                            << 2) | horizontalIBPosition
            stackDigitKey = (
                self.cellStack[cellIndex] << 2) | verticalIBPosition

            if bandDigitKey in bandIBPos[digitIndex]:
                bandIBPos[digitIndex][bandDigitKey] += 1
            else:
                bandIBPos[digitIndex][bandDigitKey] = 1
            if stackDigitKey in stackIBPos[digitIndex]:
                stackIBPos[digitIndex][stackDigitKey] += 1
            else:
                stackIBPos[digitIndex][stackDigitKey] = 1

            if bandIBPos[digitIndex][bandDigitKey] == 2:
                repeatedHorizontalIBPositions += 2
            elif bandIBPos[digitIndex][bandDigitKey] > 2:
                repeatedHorizontalIBPositions += 1
            if stackIBPos[digitIndex][stackDigitKey] == 2:
                repeatedVerticalIBPositions += 2
            elif stackIBPos[digitIndex][stackDigitKey] > 2:
                repeatedVerticalIBPositions += 1

            # IBPU Analysis Logic
            if intraBoxPositions[digitIndex] & (1 << intraBoxPosition):
                digitIBPosKey = digit << 4 | intraBoxPosition
                if not (digitIBPosKey in digitsInRepeatedIBPositions):
                    # I don't remember what digitsInRepeatedIBPositions does exactly, but it seems to work
                    digitsInRepeatedIBPositions[digitIBPosKey] = True
                    repeatedIBPositions += 2
                else:
                    repeatedIBPositions += 1
            intraBoxPositions[digitIndex] |= (1 << intraBoxPosition)

        return [repeatedIBPositions, repeatedHorizontalIBPositions, repeatedVerticalIBPositions]

    def analyzeDAC(self):
        if not self.isGridComplete or not self.isGridValid:
            return

        # 4 bitmasks (up, right, down, left) per digit. Each bitmask stores digits 1 to 9.
        adjacentDigits = {1: [0, 0, 0, 0], 2: [0, 0, 0, 0], 3: [0, 0, 0, 0],
                          4: [0, 0, 0, 0], 5: [0, 0, 0, 0], 6: [0, 0, 0, 0],
                          7: [0, 0, 0, 0], 8: [0, 0, 0, 0], 9: [0, 0, 0, 0]}
        repeatedAdjacentDigits = 0
        uniqueAdjacentDigits = 0

        for box in self.boxes:
            for i in range(9):
                cellIndex = box[i]
                digit = self.cells[cellIndex]
                # 0 = up, 1 = right, 2 = down, 3 = left
                for direction in range(4):
                    adjacentIndex = None
                    match direction:
                        case 0: adjacentIndex = i-3
                        case 1: adjacentIndex = i+1
                        case 2: adjacentIndex = i+3
                        case 3: adjacentIndex = i-1

                    if adjacentIndex > 8 or adjacentIndex < 0:
                        continue

                    adjacentCellIndex = box[adjacentIndex]
                    cellCol = self.cellCol[cellIndex]
                    adjacentCellCol = self.cellCol[adjacentCellIndex]
                    cellRow = self.cellRow[cellIndex]
                    adjacentCellRow = self.cellRow[adjacentCellIndex]

                    if (cellCol != adjacentCellCol) and (cellRow != adjacentCellRow):
                        continue

                    adjacentDigit = self.cells[adjacentCellIndex]
                    if adjacentDigits[digit][direction] & (
                            1 << (adjacentDigit-1)):
                        repeatedAdjacentDigits += 1
                    adjacentDigits[digit][direction] |= (
                        1 << (adjacentDigit-1))

        for digit in range(1, 10):
            for direction in range(4):  # 0 = up, 1 = right, 2 = down, 3 = left
                uniqueAdjacentDigits += adjacentDigits[digit][direction].bit_count()

        # Maximum of 180 repeated adjacent digits. Don't know the minimum (it's equal to or higher than 0).
        # Minimum of 36 unique adjacent digits. Don't know the maximum, but it is equal to or lower than 324 (324 = 9 digits x 4 directions x 9 digits, as if each digit had 9 unique adjacent digits in each one of the 4 directions).
        return [repeatedAdjacentDigits, uniqueAdjacentDigits]

    def calculateDACPercentage(self, repeatedAdjacentDigits):
        return (100/180)*repeatedAdjacentDigits

    def calculateTDCPercentage(self, uniqueTripletSets, repeatedTripletSets):
        repeatedTripletSetsPercentage = 100*(repeatedTripletSets/54)
        uniqueTripletSetsPercentage = 100*((54-uniqueTripletSets)/48)
        return (uniqueTripletSetsPercentage+repeatedTripletSetsPercentage)/2

    def analysisReport(self):
        if not (self.isGridValid & self.isGridComplete):
            return

        IBPResults = self.analyzeIntraBoxPositions()
        TDCHorizontalResults = self.analyzeTriplets(self.horizontalTriplets)
        TDCVerticalResults = self.analyzeTriplets(self.verticalTriplets)
        DACResults = self.analyzeDAC()

        # Horizontal + Vertical
        uniqueTripletSets = TDCHorizontalResults[1] + TDCVerticalResults[1]
        repeatedTripletSets = TDCHorizontalResults[0] + TDCVerticalResults[0]

        report = {
            "IBPU": {
                "percentage": int((100-((100*IBPResults[0])/81))*100)/100,

                "metrics": [
                    # Repeated digits in intra-box positions
                    IBPResults[0]
                ]
            },
            "IBPA": {
                "percentage": int((100*((IBPResults[1]+IBPResults[2])/162))*100)/100,
                "metrics": [
                    # Repeated digits in horizontal intra-box positions along bands
                    IBPResults[1],
                    # Repeated digits in vertical intra-box positions along stacks
                    IBPResults[2]
                ]
            },
            "TDC": {
                "percentage": int(self.calculateTDCPercentage(uniqueTripletSets, repeatedTripletSets)*100)/100,
                "metrics": [
                    # Unique horizontal triplet sets
                    TDCHorizontalResults[1],
                    # Unique vertical triplet sets
                    TDCVerticalResults[1],
                    # Repeated horizontal triplet sets
                    TDCHorizontalResults[0],
                    # Repeated vertical triplet sets
                    TDCVerticalResults[0]
                ]
            },
            "DAC": {
                "percentage": int(self.calculateDACPercentage(DACResults[0])*100)/100,
                "metrics": [
                    # Repeated adjacent digits
                    DACResults[0],
                    # Unique adjacent digits
                    DACResults[1]
                ]
            }
        }
        return report

    def tripletTargetCells(self, tripletCellsIndices, digitPairBits):
        targetCells = []
        for cellIndex in tripletCellsIndices:
            digit = self.cells[cellIndex]
            if digitPairBits & (1 << (digit-1)):
                targetCells.append(cellIndex)
        return targetCells

    def twoBitsShared(self, bitmask1, bitmask2):
        return ((bitmask1 & bitmask2).bit_count() == 2)

    def getOrientationData(self, orientation="horizontal"):
        orientationData = {}
        if orientation == "horizontal":
            orientationData["boxTriplets"] = self.boxesHTriplets
            orientationData["tripletsBits"] = self.horizontalTripletsBits
            orientationData["tripletsCellsIndices"] = self.horizontalTriplets
            orientationData["bandOrStackBoxes"] = self.stackBoxes
        elif orientation == "vertical":
            orientationData["boxTriplets"] = self.boxesVTriplets
            orientationData["tripletsBits"] = self.verticalTripletsBits
            orientationData["tripletsCellsIndices"] = self.verticalTriplets
            orientationData["bandOrStackBoxes"] = self.bandBoxes
        return orientationData

    def tripletSwaps(self, targetBoxIndex, triplet0Index, orientationData):
        triplet0Bits = orientationData["tripletsBits"][triplet0Index]
        for triplet1Index in orientationData["boxTriplets"][targetBoxIndex]:
            triplet1Bits = orientationData["tripletsBits"][triplet1Index]
            if triplet0Bits == triplet1Bits:
                triplet0Cells = orientationData["tripletsCellsIndices"][triplet0Index]
                triplet1Cells = orientationData["tripletsCellsIndices"][triplet1Index]
                cellPair1 = [triplet0Cells[0], triplet1Cells[0]]
                cellPair2 = [triplet0Cells[1], triplet1Cells[1]]
                cellPair3 = [triplet0Cells[2], triplet1Cells[2]]
                self.transformations["tripletSwaps"].append(
                    [cellPair1, cellPair2, cellPair3])
                return triplet1Index
        return None

    def digitSwaps1(self, bandOrStackIndex, triplet0Index, orientationData):
        triplet0Bits = orientationData["tripletsBits"][triplet0Index]
        bandOrStackBoxes = orientationData["bandOrStackBoxes"][bandOrStackIndex]
        box1Index = bandOrStackBoxes[1]
        box2Index = bandOrStackBoxes[2]
        box1Triplets = orientationData["boxTriplets"][box1Index]
        box2Triplets = orientationData["boxTriplets"][box2Index]

        for triplet1Index in box1Triplets:
            triplet1Bits = orientationData["tripletsBits"][triplet1Index]
            sharedDigitsNumber = (triplet0Bits & triplet1Bits).bit_count()
            if not (sharedDigitsNumber >= 2):
                continue
            if sharedDigitsNumber == 3:
                for skippedCellIndex in range(3):
                    triplet0Copy = orientationData["tripletsCellsIndices"][triplet0Index][:]
                    triplet0Copy = triplet0Copy[:skippedCellIndex] + \
                        triplet0Copy[skippedCellIndex+1:]
                    triplet0Bits2 = self.digitsListToBits(
                        [self.cells[triplet0Copy[0]], self.cells[triplet0Copy[1]]])
                    skippedDigitBit = 1 << (
                        self.cells[orientationData["tripletsCellsIndices"][triplet0Index][skippedCellIndex]]-1)
                    digitPairBits2 = triplet0Bits2 & (
                        triplet1Bits-skippedDigitBit)

                    for triplet2Index in box2Triplets:
                        triplet2Bits = orientationData["tripletsBits"][triplet2Index]
                        if not self.twoBitsShared(digitPairBits2, triplet2Bits):
                            continue
                        triplet0Cells = self.tripletTargetCells(
                            orientationData["tripletsCellsIndices"][triplet0Index], digitPairBits2)
                        triplet1Cells = self.tripletTargetCells(
                            orientationData["tripletsCellsIndices"][triplet1Index], digitPairBits2)
                        triplet2Cells = self.tripletTargetCells(
                            orientationData["tripletsCellsIndices"][triplet2Index], digitPairBits2)

                        self.transformations["digitSwaps1"].append([
                            self.tripletTargetCells(
                                triplet0Cells, digitPairBits2),
                            self.tripletTargetCells(
                                triplet1Cells, digitPairBits2),
                            self.tripletTargetCells(
                                triplet2Cells, digitPairBits2)
                        ])
                continue

            digitPairBits = triplet0Bits & triplet1Bits
            for triplet2Index in box2Triplets:
                triplet2Bits = orientationData["tripletsBits"][triplet2Index]
                if self.twoBitsShared(digitPairBits, triplet2Bits):

                    triplet0Cells = self.tripletTargetCells(
                        orientationData["tripletsCellsIndices"][triplet0Index], digitPairBits)
                    triplet1Cells = self.tripletTargetCells(
                        orientationData["tripletsCellsIndices"][triplet1Index], digitPairBits)
                    triplet2Cells = self.tripletTargetCells(
                        orientationData["tripletsCellsIndices"][triplet2Index], digitPairBits)

                    self.transformations["digitSwaps1"].append([
                        self.tripletTargetCells(triplet0Cells, digitPairBits),
                        self.tripletTargetCells(triplet1Cells, digitPairBits),
                        self.tripletTargetCells(triplet2Cells, digitPairBits)
                    ])

                    if sharedDigitsNumber == 2:
                        return [triplet1Index, triplet2Index]
        return None

    def digitSwaps2(self, targetBoxIndex, triplet0Index, skippedCellIndex, orientationData):
        triplet0 = orientationData["tripletsCellsIndices"][triplet0Index]
        triplet0TargetCells = triplet0[:skippedCellIndex] + \
            triplet0[skippedCellIndex+1:]
        triplet0DigitPair = [self.cells[triplet0TargetCells[0]],
                             self.cells[triplet0TargetCells[1]]]
        triplet0Bits = self.digitsListToBits(triplet0DigitPair)
        for triplet1Index in orientationData["boxTriplets"][targetBoxIndex]:
            triplet1CellIndices = orientationData["tripletsCellsIndices"][triplet1Index]
            triplet1TargetCells = triplet1CellIndices[:skippedCellIndex] + \
                triplet1CellIndices[skippedCellIndex+1:]
            triplet1DigitPair = [self.cells[triplet1TargetCells[0]],
                                 self.cells[triplet1TargetCells[1]]]
            triplet1Bits = self.digitsListToBits(triplet1DigitPair)
            if triplet0Bits == triplet1Bits:
                self.transformations["digitSwaps2"].append(
                    [triplet0TargetCells, triplet1TargetCells])
                return triplet1Index
        return None

    def digitSwaps3(self, bandOrStackIndex, triplet0Index, skippedCellIndex, orientationData):
        triplet0 = orientationData["tripletsCellsIndices"][triplet0Index]
        triplet0TargetCells = triplet0[:skippedCellIndex] + \
            triplet0[skippedCellIndex+1:]
        triplet0DigitPair = [self.cells[triplet0TargetCells[0]],
                             self.cells[triplet0TargetCells[1]]]
        triplet0Bits = self.digitsListToBits(triplet0DigitPair)
        bandOrStackBoxes = orientationData["bandOrStackBoxes"][bandOrStackIndex]
        box1Index = bandOrStackBoxes[1]
        box2Index = bandOrStackBoxes[2]
        box1Triplets = orientationData["boxTriplets"][box1Index]
        box2Triplets = orientationData["boxTriplets"][box2Index]

        for triplet1Index in box1Triplets:
            triplet1 = orientationData["tripletsCellsIndices"][triplet1Index]
            triplet1TargetCells = triplet1[:skippedCellIndex] + \
                triplet1[skippedCellIndex+1:]
            triplet1DigitPair = [self.cells[triplet1TargetCells[0]],
                                 self.cells[triplet1TargetCells[1]]]
            triplet1Bits = self.digitsListToBits(triplet1DigitPair)
            if not ((triplet0Bits & triplet1Bits).bit_count() == 1):
                continue
            for triplet2Index in box2Triplets:
                triplet2 = orientationData["tripletsCellsIndices"][triplet2Index]
                triplet2TargetCells = triplet2[:skippedCellIndex] + \
                    triplet2[skippedCellIndex+1:]
                triplet2DigitPair = [self.cells[triplet2TargetCells[0]],
                                     self.cells[triplet2TargetCells[1]]]
                triplet2Bits = self.digitsListToBits(triplet2DigitPair)
                if (triplet0Bits ^ triplet1Bits) == triplet2Bits:

                    self.transformations["digitSwaps3"].append(
                        [triplet0TargetCells,
                         triplet1TargetCells,
                         triplet2TargetCells]
                    )

                    return [triplet1Index, triplet2Index]
        return None

    def findTransformations(self):
        self.transformations = {
            "tripletSwaps": [],
            "digitSwaps1": [],
            "digitSwaps2": [],
            "digitSwaps3": []}
        for orientation in ["horizontal", "vertical"]:
            orientationData = self.getOrientationData(orientation)
            for banOrStackIndex in range(3):
                for tripletBoxIndex in range(3):
                    bandOrStackBoxes = orientationData["bandOrStackBoxes"]
                    Box0Index = bandOrStackBoxes[banOrStackIndex][0]
                    Box1Index = bandOrStackBoxes[banOrStackIndex][1]

                    # Triplet Swaps Logic
                    triplet0Index = orientationData["boxTriplets"][Box0Index][tripletBoxIndex]
                    self.tripletSwaps(
                        bandOrStackBoxes[banOrStackIndex][1], triplet0Index, orientationData)
                    self.tripletSwaps(
                        bandOrStackBoxes[banOrStackIndex][2], triplet0Index, orientationData)
                    triplet0Index = orientationData["boxTriplets"][Box1Index][tripletBoxIndex]
                    self.tripletSwaps(
                        bandOrStackBoxes[banOrStackIndex][2], triplet0Index, orientationData)

                    # Digit Swaps 1 Logic
                    triplet0Index = orientationData["boxTriplets"][Box0Index][tripletBoxIndex]
                    self.digitSwaps1(banOrStackIndex,
                                     triplet0Index, orientationData)

                    for skippedCellIndex in range(3):
                        # Digit Swaps 2 Logic
                        self.digitSwaps2(
                            bandOrStackBoxes[banOrStackIndex][1], triplet0Index, skippedCellIndex, orientationData)
                        self.digitSwaps2(
                            bandOrStackBoxes[banOrStackIndex][2], triplet0Index, skippedCellIndex, orientationData)
                        triplet0Index = orientationData["boxTriplets"][Box1Index][tripletBoxIndex]
                        self.digitSwaps2(
                            bandOrStackBoxes[banOrStackIndex][2], triplet0Index, skippedCellIndex, orientationData)

                        # Digit Swaps 3 Logic
                        triplet0Index = orientationData["boxTriplets"][Box0Index][tripletBoxIndex]
                        self.digitSwaps3(
                            banOrStackIndex, triplet0Index, skippedCellIndex, orientationData)

    def printTransformationCellPairs(self, cellPairs):
        cellIndices = set()
        for cellPair in cellPairs:
            cellIndices.add(cellPair[0])
            cellIndices.add(cellPair[1])
        print("-------------")
        for i in range(81):
            if (i) % 3 == 0 and not ((i+1) % 9 == 0):
                print("|", end="")
            if i in cellIndices:
                print("O", end="")
            else:
                print("/", end="")

            if (i+1) % 9 == 0:
                print("|")
            if (i+1) % 27 == 0:
                print("-------------")
        print("")

    def applyTransformation(self, cellPairs):
        swappedCellPairsDigits = []
        for cellPair in cellPairs:
            cellDigit1 = self.cells[cellPair[0]]
            cellDigit2 = self.cells[cellPair[1]]
            swappedCellPairsDigits.append([cellDigit2, cellDigit1])
            self.addOrRemoveDigit(cellPair[0], cellDigit1, True)
            self.addOrRemoveDigit(cellPair[1], cellDigit2, True)
        for i, cellPair in enumerate(cellPairs):
            cellDigit1 = swappedCellPairsDigits[i][0]
            cellDigit2 = swappedCellPairsDigits[i][1]
            self.addOrRemoveDigit(cellPair[0], cellDigit1, False)
            self.addOrRemoveDigit(cellPair[1], cellDigit2, False)
