import { SudokuLab } from "./sudokuLab.js"
import { Visualize } from "./visualize.js";


const canvas = document.getElementById("gridCanvas");
const sudokuGrid = document.getElementById("grid");
const inputField = document.getElementById("gridDigitsInput");
const inputButton = document.getElementById("inputButton");
const inputAlert = document.getElementById("inputAlert");
const visualizeAnalysisButton = document.getElementById("analyzeButton");
const analysisAlert = document.getElementById("analysisAlert");
const gridValidityParagraph = document.getElementById("validity");
const gridCompletenessParagraph = document.getElementById("completeness");

const transformationsList = document.getElementById("transformationsList");
const applyTransformationButton = document.getElementById("applyTransformationButton");

const showMetricsButton = document.getElementById("showMetricsButton");
const showMetricsText = document.getElementById("showMetricsText");
const showMetricsArrow = document.getElementById("showMetricsArrow");

const patternsMetricsPanel = document.getElementById("patternsMetrics");



const IBPUmetricsWrapper = document.getElementById("IBPUMetricsWrapper");
const IBPAmetricsWrapper = document.getElementById("IBPAMetricsWrapper");
const TDCmetricsWrapper = document.getElementById("TDCMetricsWrapper");
const DACmetricsWrapper = document.getElementById("DACMetricsWrapper");

const IBPUProgressBar = document.getElementById("IBPUBarProgress");
const IBPAProgressBar = document.getElementById("IBPABarProgress");
const TDCProgressBar = document.getElementById("TDCBarProgress");
const DACProgressBar = document.getElementById("DACBarProgress");

const IBPUpercentage = document.getElementById("IBPUPercentage");
const IBPApercentage = document.getElementById("IBPAPercentage");
const TDCpercentage = document.getElementById("TDCPercentage");
const DACpercentage = document.getElementById("DACPercentage");

const IBPUmetric1 = document.getElementById("IBPUMetric1");
const IBPAmetric1 = document.getElementById("IBPAMetric1");
const IBPAmetric2 = document.getElementById("IBPAMetric2");
const TDCmetric1 = document.getElementById("TDCMetric1");
const TDCmetric2 = document.getElementById("TDCMetric2");
const DACmetric1 = document.getElementById("DACMetric1");

canvas.width = sudokuGrid.offsetWidth-4;
canvas.height = sudokuGrid.offsetHeight-4;

for (let i1 = 0; i1 < 9; i1++) {
    const box = document.createElement("div");
    box.classList.add("box");
    box.id = ""+i1;
    for (let i2 = 0; i2 < 9; i2++) {
        const square = document.createElement("div");
        const paragraph = document.createElement("p");
        
        paragraph.id = "p"+(((Math.floor(i1/3)*3)+Math.floor(i2/3))*9 + (((i1%3)*3)+i2%3));

        square.appendChild(paragraph);
        square.id = "cell"+(((Math.floor(i1/3)*3)+Math.floor(i2/3))*9 + (((i1%3)*3)+i2%3));
        square.classList.add("cell");
        box.appendChild(square);
    }
    sudokuGrid.appendChild(box);
}

const cellWidth = document.getElementById("cell0").offsetWidth;
const visualizationTool = new Visualize(canvas, cellWidth-0.5, 2, 2, 1);
let visualizingAnalisis = false;
const sudokuLab = new SudokuLab(undefined,visualizationTool)



function processSudokuString(sudokuString) {

    const charToNum = {".":0,"0":0,"1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9};
    
    if (sudokuString.length !== 81) {
        inputField.style.borderColor = "rgba(145, 0, 0, 1)";
        inputField.style.backgroundColor = "rgba(255, 227, 227, 1)";
        inputAlert.innerText = "String must have 81 characters. Current number: "+sudokuString.length;
        inputAlert.style.display = "initial"
        return false
    }

    for (let i = 0; i < 81; i++) {
        if (charToNum[sudokuString[i]] !== 0 && !charToNum[sudokuString[i]]) {
            inputField.style.borderColor = "rgba(145, 0, 0, 1)";
            inputField.style.backgroundColor = "rgba(255, 227, 227, 1)";
            inputAlert.innerText = "String must have valid characters: .0123456789";
            inputAlert.style.display = "initial"
            return false
        }
    }

    sudokuLab.setNewGrid(sudokuString);
    return true
}

function determineCompletenessAndValidity() {
    let validAndComplete = true;
    if (sudokuLab.isGridValid) {
        gridValidityParagraph.innerText = "Valid - No repeated digits in columns, rows or boxes."
    } else {
        gridValidityParagraph.innerText = "Invalid - Repeated digits in columns, rows or boxes."
        validAndComplete = false;
    }

    if (sudokuLab.isGridComplete) {
        gridCompletenessParagraph.innerText = "Complete - There are no empty cells.";
    } else {
        gridCompletenessParagraph.innerText = "Incomplete - There are empty cells.";
        validAndComplete = false;
    }
    return validAndComplete
}

function displayDigits(sudokuString) {
    for (let i = 0; i < 81; i++) {
        const cellParagraph = document.getElementById("p"+i);
        let digit = ""+sudokuString[i]
        if (digit == "0" || digit == ".") {digit = ""}
        cellParagraph.innerText = digit;
    }
}

function renderGridDigits(sudokuString) {
    if (!processSudokuString(sudokuString)) {
        return false
    }
    determineCompletenessAndValidity();
    inputField.value = "";
    inputField.style.borderColor = "rgb(51, 53, 63)";
    inputField.style.backgroundColor = "white";
    inputAlert.style.display = "none";
    
    displayDigits(sudokuString);

    analyzePatterns();
    fillTransformationList();
    if (!(sudokuLab.isGridComplete && sudokuLab.isGridValid)) {
        resetPatternMetrics();
        clearTranformationsList();
    }
    return true
}

async function inputButtonPressed() {
    if (visualizingAnalisis) {return}
    const sudokuString = inputField.value;
    if (renderGridDigits(sudokuString)) {
        if (sudokuLab.isGridComplete) {
            gridCompletenessParagraph.style.color = "white";
    }
        if (sudokuLab.isGridValid) {
            gridValidityParagraph.style.color = "white";
        }  
    }
    if (sudokuLab.isGridComplete && sudokuLab.isGridValid) {
        analysisAlert.style.display = "none";
    }
}
inputButton.onclick = inputButtonPressed;

function getBarColor(percentage) {
    const number = (255/100)*percentage;
    const difference = Math.abs((2*number) - 255);
    return `rgb(${265-number},${10+number},${60+255-(difference/2)})`
}

function resetBarsColor() {
    IBPUProgressBar.style.backgroundColor = "rgb(243, 90, 105)"
    IBPAProgressBar.style.backgroundColor = "rgb(243, 90, 105)"
    TDCProgressBar.style.backgroundColor = "rgb(243, 90, 105)"
    DACProgressBar.style.backgroundColor = "rgb(243, 90, 105)"
}

function resetPatternMetrics() {
    IBPUpercentage.innerText = "-%";
    IBPApercentage.innerText = "-%";
    TDCpercentage.innerText = "-%";
    DACpercentage.innerText = "-%";

    IBPUmetric1.innerText = "---";
    IBPAmetric1.innerText = "---";
    IBPAmetric2.innerText = "---";
    TDCmetric1.innerText = "---";
    TDCmetric2.innerText = "---";
    DACmetric1.innerText = "---";

    IBPUProgressBar.style.width = `0%`;
    IBPAProgressBar.style.width = `0%`;
    TDCProgressBar.style.width = `0%`;
    DACProgressBar.style.width = `0%`;

    resetBarsColor();
}

async function analyzePatterns() {
    if (!sudokuLab.isGridComplete || !sudokuLab.isGridValid) {
        if (!sudokuLab.isGridComplete) {
            gridCompletenessParagraph.style.color = "rgba(255, 138, 138, 1)";
        }
        if (!sudokuLab.isGridValid) {
            gridValidityParagraph.style.color = "rgba(255, 138, 138, 1)";
        }
        analysisAlert.style.display = "initial";
        return
    }

    analysisAlert.style.display = "none";
    gridCompletenessParagraph.style.color = "white";
    gridValidityParagraph.style.color = "white";
    const analysisReport = await sudokuLab.analysisReport();

    IBPUProgressBar.style.width = `${analysisReport["IBPU"]["percentage"]}%`;
    IBPUProgressBar.style.backgroundColor = getBarColor(analysisReport["IBPU"]["percentage"]);
    IBPUpercentage.innerText = analysisReport["IBPU"]["percentage"]+"%";
    IBPAProgressBar.style.width = `${analysisReport["IBPA"]["percentage"]}%`;
    IBPAProgressBar.style.backgroundColor = getBarColor(analysisReport["IBPA"]["percentage"]);
    IBPApercentage.innerText = analysisReport["IBPA"]["percentage"]+"%";
    TDCProgressBar.style.width = `${analysisReport["TDC"]["percentage"]}%`;
    TDCProgressBar.style.backgroundColor = getBarColor(analysisReport["TDC"]["percentage"]);
    TDCpercentage.innerText = analysisReport["TDC"]["percentage"]+"%";
    DACProgressBar.style.width = `${analysisReport["DAC"]["percentage"]}%`;
    DACProgressBar.style.backgroundColor = getBarColor(analysisReport["DAC"]["percentage"]);
    DACpercentage.innerText = analysisReport["DAC"]["percentage"]+"%";

    IBPUmetric1.innerText = analysisReport["IBPU"]["metrics"][0];
    IBPAmetric1.innerText = analysisReport["IBPA"]["metrics"][0];
    IBPAmetric2.innerText = analysisReport["IBPA"]["metrics"][1];
    TDCmetric1.innerText = analysisReport["TDC"]["metrics"][0]+analysisReport["TDC"]["metrics"][1];
    TDCmetric2.innerText = analysisReport["TDC"]["metrics"][2]+analysisReport["TDC"]["metrics"][3];
    DACmetric1.innerText = analysisReport["DAC"]["metrics"][0];
}

function clearTranformationsList() {
    transformationsList.replaceChildren();
}

function fillTransformationList() {
    visualizationTool.clearCanvas();
    clearTranformationsList();
    sudokuLab.findTransformations();
    const transformations = sudokuLab.transformations;

    for (const transformationType of ["digitSwaps1","digitSwaps2","digitSwaps3","tripletSwaps"]) {
        for (const transformation of transformations[transformationType]) {
            createTransformationElement(transformationType,transformation);
        }
    }
}

function displayTransformation(transformationType,transformation) {
    if (visualizingAnalisis) {return}
    visualizationTool.clearCanvas();
    const colorMap = {
        "digitSwaps1":"rgba(0, 201, 167, 0.25)",
        "digitSwaps2":"rgba(4, 78, 238, 0.25)",
        "digitSwaps3":"rgba(105, 25, 219, 0.25)",
        "tripletSwaps":"rgba(212, 23, 67, 0.25)"};
    for (const cellPair of transformation) {
        for (const cellIndex of cellPair) {
            visualizationTool.drawCell(colorMap[transformationType],cellIndex);
        }
    }
}

visualizeAnalysisButton.onclick = async () => {
    visualizationTool.clearCanvas();
    if (visualizingAnalisis) {return}
    visualizingAnalisis = true;
    await sudokuLab.analysisReport(true)
    visualizingAnalisis = false;
}



showMetricsButton.onclick = showMetricsButtonPressed;
let showing = false
function showOrHideMetrics(show) {
    if (show) {
        IBPUmetricsWrapper.style.height = "0px";
        IBPUmetricsWrapper.style.opacity = "0%";
        IBPAmetricsWrapper.style.height = "0px";
        IBPAmetricsWrapper.style.opacity = "0%";
        TDCmetricsWrapper.style.height = "0px";
        TDCmetricsWrapper.style.opacity = "0%";
        DACmetricsWrapper.style.height = "0px";
        DACmetricsWrapper.style.opacity = "0%";
    } else {
        IBPUmetricsWrapper.style.height = IBPUmetricsWrapper.scrollHeight;
        IBPUmetricsWrapper.style.opacity = "100%";
        IBPAmetricsWrapper.style.height = IBPAmetricsWrapper.scrollHeight;
        IBPAmetricsWrapper.style.opacity = "100%";
        TDCmetricsWrapper.style.height = TDCmetricsWrapper.scrollHeight;
        TDCmetricsWrapper.style.opacity = "100%";
        DACmetricsWrapper.style.height = DACmetricsWrapper.scrollHeight;
        DACmetricsWrapper.style.opacity = "100%";
    }
}

function showMetricsButtonPressed() {
    if (showing) {
        showMetricsArrow.style.transform = "rotate(90deg)";
        showMetricsArrow.style.top = "0px"
        showOrHideMetrics(showing)
    } else {
        showMetricsArrow.style.transform = "rotate(-90deg)";
        showMetricsArrow.style.top = "-1px"
        showOrHideMetrics(showing)
    }
    showing = !showing;
}

function createTransformationElement(transformationType,cellPairsList) {
    const transformationElement = document.createElement("div");
    const transformationColor = document.createElement("div");
    const transformationCellPairs = document.createElement("p");

    transformationElement.classList.add("transformationElement");
    transformationColor.classList.add("transformationColor");
    transformationCellPairs.classList.add("transformationCells");

    let text = "| ";
    for (const cellPair of cellPairsList) {
        text += ` ${cellPair[0]} & ${cellPair[1]} |`
    }

    const colorMap = {
        "digitSwaps1":"rgba(76, 214, 191, 1)",
        "digitSwaps2":"rgba(77, 128, 237, 1)",
        "digitSwaps3":"rgba(162, 112, 231, 1)",
        "tripletSwaps":"rgba(212, 107, 132, 1)",}
    transformationCellPairs.innerText = text;
    transformationColor.style.backgroundColor = colorMap[transformationType];

    transformationElement.onclick = () => {
        trasnformationElementClicked(transformationElement,transformationType,cellPairsList);
    };
    transformationElement.appendChild(transformationColor);
    transformationElement.appendChild(transformationCellPairs);
    transformationsList.appendChild(transformationElement);
}

let previousTranformationElementClicked = null;
function trasnformationElementClicked(transformationElement,transformationType,cellPairsList) {
    if (transformationElement == previousTranformationElementClicked) {
        previousTranformationElementClicked.classList.add("transformationElement");
        previousTranformationElementClicked.classList.remove("transformationElementClicked");
        previousTranformationElementClicked = null;
        transformationSelected = null;
        if (!visualizingAnalisis) {
            visualizationTool.clearCanvas();
        }

        return
    }
    transformationElement.classList.add("transformationElementClicked");
    transformationElement.classList.remove("transformationElement");
    if (previousTranformationElementClicked) {
        previousTranformationElementClicked.classList.add("transformationElement");
        previousTranformationElementClicked.classList.remove("transformationElementClicked");
    }
    previousTranformationElementClicked = transformationElement;
    
    displayTransformation(transformationType,cellPairsList);
    transformationSelected = {"type":transformationType,"cells":cellPairsList};
}
let transformationSelected = null;

document.getElementById("randomGridButton").onclick = generateRandomGrid;
function generateRandomGrid() {
    if (visualizingAnalisis) {return}
    const newSudokuString = sudokuLab.generateRandomGrids(1)[0];
    sudokuLab.setNewGrid(newSudokuString);
    renderGridDigits(newSudokuString);
    if (sudokuLab.isGridComplete) {
        gridCompletenessParagraph.style.color = "white";
    }
    if (sudokuLab.isGridValid) {
        gridValidityParagraph.style.color = "white";
    }
    if (sudokuLab.isGridComplete && sudokuLab.isGridValid) {
        analysisAlert.style.display = "none";
    }
}


function applyTransformationClicked(cellPairs) {
    sudokuLab.applyTransformation(cellPairs);
    const sudokuString = sudokuLab.getSudokuString();
    displayDigits(sudokuString);
    analyzePatterns();
    fillTransformationList();
}
applyTransformationButton.onclick = () => {
    if (!transformationSelected || visualizingAnalisis) {return}
    applyTransformationClicked(transformationSelected["cells"]);
    transformationsSequence["sequence"].push(transformationSelected);
}

const transformationsSequence = {"sequence":[],"pointer":0};
