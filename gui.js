import { SudokuLab } from "./sudokuGrid.js"
import { Visualize } from "./visualize.js";


const canvas = document.getElementById("gridCanvas");
const sudokuGrid = document.getElementById("grid");
const inputField = document.getElementById("gridDigitsInput");
const inputButton = document.getElementById("inputButton");
const inputAlert = document.getElementById("inputAlert");
const analyzeButton = document.getElementById("analyzeButton");
const analysisAlert = document.getElementById("analysisAlert");
const visualizeCheckBox = document.getElementById("visualizationToggle");
const gridValidityParagraph = document.getElementById("validity");
const gridCompletenessParagraph = document.getElementById("completeness");

const IBPUmetricsWrapper = document.getElementById("IBPUMetricsWrapper");
const IBPAmetricsWrapper = document.getElementById("IBPAMetricsWrapper");
const TDCmetricsWrapper = document.getElementById("TDCMetricsWrapper");

const IBPUProgressBar = document.getElementById("IBPUBarProgress");
const IBPAProgressBar = document.getElementById("IBPABarProgress");
const TDCProgressBar = document.getElementById("TDCBarProgress");

const IBPUpercentage = document.getElementById("IBPUPercentage");
const IBPApercentage = document.getElementById("IBPAPercentage");
const TDCpercentage = document.getElementById("TDCPercentage");

const IBPUmetric1 = document.getElementById("IBPUMetric1");
const IBPAmetric1 = document.getElementById("IBPAMetric1");
const IBPAmetric2 = document.getElementById("IBPAMetric2");
const TDCmetric1 = document.getElementById("TDCMetric1");
const TDCmetric2 = document.getElementById("TDCMetric2");

canvas.width = sudokuGrid.offsetWidth-2;
canvas.height = sudokuGrid.offsetHeight-2;

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
const visualizationTool = new Visualize(canvas, cellWidth, 2, 2, 1);

let isSudokuStringProcessed = false;
let gridData = undefined;

function processSudokuString(sudokuString) {

    const charToNum = {".":0,"0":0,"1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9};
    
    if (sudokuString.length !== 81) {
        inputField.style.borderColor = "rgba(145, 0, 0, 1)";
        inputField.style.backgroundColor = "rgb(255, 239, 239)";
        inputAlert.innerText = "String must have 81 characters. Current number of characters: "+sudokuString.length;
        inputAlert.style.display = "initial"
        return false;
    }

    for (let i = 0; i < 81; i++) {
        if (charToNum[sudokuString[i]] !== 0 && !charToNum[sudokuString[i]]) {
            inputField.style.borderColor = "rgba(145, 0, 0, 1)";
            inputField.style.backgroundColor = "rgb(255, 239, 239)";
            inputAlert.innerText = "String must have valid characters: .0123456789";
            inputAlert.style.display = "initial"
            return false;
        }
    }

    isSudokuStringProcessed = true
    gridData = new sudokuLab(sudokuString, visualizationTool);

    if (gridData.isGridValid) {
        gridValidityParagraph.innerText = "Valid - No repeated digits in columns, rows or boxes."
    } else {
        gridValidityParagraph.innerText = "Invalid - Repeated digits in columns, rows or boxes."
    }

    if (gridData.isGridComplete) {
        gridCompletenessParagraph.innerText = "Complete - There are no empty cells.";
    } else {
        gridCompletenessParagraph.innerText = "Incomplete - There are empty cells.";
    }
    return true
}

function renderGridDigits(sudokuString) {
    processSudokuString(sudokuString);
    if (!isSudokuStringProcessed) {
        return
    }
    inputField.value = "";
    inputField.style.borderColor = "rgb(51, 53, 63)";
    inputField.style.backgroundColor = "white";
    inputAlert.style.display = "none";
    for (let i = 0; i < 81; i++) {
        const cellParagraph = document.getElementById("p"+i);
        let digit = ""+sudokuString[i]
        if (digit == "0" || digit == ".") {digit = ""}
        cellParagraph.innerText = digit;
    }
}

async function inputButtonPressed() {
    const sudokuString = inputField.value;
    isSudokuStringProcessed = false;
    renderGridDigits(sudokuString);

    gridCompletenessParagraph.style.color = "black";
    gridValidityParagraph.style.color = "black";
    analysisAlert.style.display = "none";

    IBPUmetricsWrapper.style.height = "0px";
    IBPUmetricsWrapper.style.opacity = "0%";
    IBPAmetricsWrapper.style.height = "0px";
    IBPAmetricsWrapper.style.opacity = "0%";
    TDCmetricsWrapper.style.height = "0px";
    TDCmetricsWrapper.style.opacity = "0%";

    IBPUProgressBar.style.width = `0%`;
    IBPAProgressBar.style.width = `0%`;
    TDCProgressBar.style.width = `0%`;

    IBPUpercentage.innerText = "-%";
    IBPApercentage.innerText = "-%";
    TDCpercentage.innerText = "-%";

    IBPUmetric1.innerText = "-";
    IBPAmetric1.innerText = "-";
    IBPAmetric2.innerText = "-";
    TDCmetric1.innerText = "-";
    TDCmetric2.innerText = "-";
}
inputButton.onclick = inputButtonPressed;

function getBarColor(percentage) {
    const number = (255/100)*percentage;
    const difference = Math.abs((2*number) - 255);
    return `rgb(${255-number},${number},${60+255-difference})`
}

async function analyzeButtonPressed() {
    if (!gridData) {return}
    if (!gridData.isGridComplete || !gridData.isGridValid) {
        if (!gridData.isGridComplete) {
            gridCompletenessParagraph.style.color = "rgba(230, 5, 5, 1)";
        }
        if (!gridData.isGridValid) {
            gridValidityParagraph.style.color = "rgba(230, 5, 5, 1)";
        }
        analysisAlert.style.display = "initial";
        return
    }

    analysisAlert.style.display = "none";
    gridCompletenessParagraph.style.color = "black";
    const analysisReport = await gridData.analysisReport(visualizeCheckBox.checked);

    IBPUmetricsWrapper.style.height = "23px";
    IBPUmetricsWrapper.style.opacity = "100%";
    IBPAmetricsWrapper.style.height = "76px";
    IBPAmetricsWrapper.style.opacity = "100%";
    TDCmetricsWrapper.style.height = "45px";
    TDCmetricsWrapper.style.opacity = "100%";

    IBPUProgressBar.style.width = `${analysisReport["IBPU"]["percentage"]}%`;
    IBPUProgressBar.style.backgroundColor = getBarColor(analysisReport["IBPU"]["percentage"]);
    IBPUpercentage.innerText = analysisReport["IBPU"]["percentage"]+"%";
    IBPAProgressBar.style.width = `${analysisReport["IBPA"]["percentage"]}%`;
    IBPAProgressBar.style.backgroundColor = getBarColor(analysisReport["IBPA"]["percentage"]);
    IBPApercentage.innerText = analysisReport["IBPA"]["percentage"]+"%";
    TDCProgressBar.style.width = `${analysisReport["TDC"]["percentage"]}%`;
    TDCProgressBar.style.backgroundColor = getBarColor(analysisReport["TDC"]["percentage"]);
    TDCpercentage.innerText = analysisReport["TDC"]["percentage"]+"%";

    IBPUmetric1.innerText = analysisReport["IBPU"]["metrics"][0];
    IBPAmetric1.innerText = analysisReport["IBPA"]["metrics"][0];
    IBPAmetric2.innerText = analysisReport["IBPA"]["metrics"][1];
    TDCmetric1.innerText = analysisReport["TDC"]["metrics"][0]+analysisReport["TDC"]["metrics"][1];
    TDCmetric2.innerText = analysisReport["TDC"]["metrics"][2]+analysisReport["TDC"]["metrics"][3];

}
analyzeButton.onclick = analyzeButtonPressed;




