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

        self.fillLookUpTables()

        # Grid info
        self.isGridValid = True
        self.isGridComplete = True

        self.setNewGrid(sudokuString)
        self.gridsGenerated = []

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
        self.isGridValid = True
        self.isGridComplete = True

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
        if not remove:
            self.boxBits[boxIndex] |= bit
            self.rowBits[rowIndex] |= bit
            self.colBits[colIndex] |= bit
            self.intraBoxPositions[digit -
                                   1] |= (1 << ((colIndex % 3) + ((rowIndex % 3)*3)))
            self.cells[cellIndex] = digit
        else:
            self.boxBits[boxIndex] &= ~bit
            self.rowBits[rowIndex] &= ~bit
            self.colBits[colIndex] &= ~bit
            self.intraBoxPositions[digit -
                                   1] &= ~(1 << ((colIndex % 3) + ((rowIndex % 3)*3)))
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

    @staticmethod
    def onlyOneBitSet(bits):
        return not (bits & (bits - 1))

    @staticmethod
    def listToString(list):
        return "".join(str(element) for element in list)

    @staticmethod
    def printGrid(sudokuString):
        print("-------------------")
        for i in range(9):
            if i % 3 == 0 and i != 0:
                print("| --------------- |")
            print(
                f"| {sudokuString[0+(9*i):3+(9*i)]} | {sudokuString[3+(9*i):6+(9*i)]} | {sudokuString[6+(9*i):9+(9*i)]} |")
        print("-------------------")

    def generateRandomGrids(self, numberOfGridsToGenerate):
        colBits = self.colBits.copy()
        rowBits = self.rowBits.copy()
        boxBits = self.boxBits.copy()
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

        # Horizontal + Vertical
        uniqueTripletSets = TDCHorizontalResults[1] + TDCVerticalResults[1]
        repeatedTripletSets = TDCHorizontalResults[0] + TDCVerticalResults[0]

        report = {
            "IBPU": {
                "percentage": int((100-((100*IBPResults[0])/81))*100)/100,
                # Repeated digits in intra-box positions
                "metrics": [IBPResults[0]]
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
        }
        return report
