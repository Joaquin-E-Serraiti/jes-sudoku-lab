export class Visualize {

  constructor(canvas, cellWidth, gridBorder, boxBorder, cellBorder) {
    this.canvas = canvas;
    this.cellWidth = cellWidth;
    this.gridBorder = gridBorder;
    this.boxBorder = boxBorder;
    this.cellBorder = cellBorder;
    this.boxWidth = (3*this.cellWidth)+(2*this.cellBorder);
    this.ctx = canvas.getContext("2d");
  }

  drawTriplet(color, tripletIndex, orientation) {
    const {xPosition, yPosition} = this.getTripletPosition(tripletIndex,orientation);
    let height = this.cellWidth;
    let width = (this.cellWidth*3)+(this.cellBorder*2);
    if (orientation == "vertical") {
      height = (this.cellWidth*3)+(this.cellBorder*2);
      width = this.cellWidth;
    }

    this.ctx.fillStyle = color;
    this.ctx.fillRect(xPosition,yPosition,width+1,height+1)
  }

  drawCell(color, cellIndex) {
    const {xPosition,yPosition} = this.getCellPosition(cellIndex)
    this.ctx.fillStyle = color;
    this.ctx.fillRect(xPosition,yPosition,this.cellWidth+1,this.cellWidth+1);
  }

  drawBandOrStack(color, index, orientation) {
    let height = this.boxWidth;
    let width = (this.boxWidth*3) + (this.boxBorder*2);
    let xPos = 0;
    let yPos = (this.boxWidth+this.boxBorder)*index;

    if (orientation == "vertical") {
      height = (this.boxWidth*3) + (this.boxBorder*2);
      width = this.boxWidth;
      xPos = (this.boxWidth+this.boxBorder)*index;
      yPos = 0;
    }

    this.ctx.fillStyle = color;
    this.ctx.fillRect(xPos,yPos,width+1,height+1);
  }

  getIndecesFromCell(cellIndex) {
    const rowIndex = Math.floor(cellIndex/9);
    const columnIndex = cellIndex%9;
    const boxIndex = (Math.floor(rowIndex/3)*3) + Math.floor(columnIndex / 3);
    const bandIndex = Math.floor(boxIndex/3);
    const stackIndex = boxIndex%3;
    return {row:rowIndex,col:columnIndex,box:boxIndex,band:bandIndex,stack:stackIndex};
  }

  getCellPosition(cellIndex) {
    const {col, row, band, stack} = this.getIndecesFromCell(cellIndex);
    const xPosition = (stack*(this.boxWidth+this.boxBorder)) + 
    ((col%3)*this.cellWidth) + ((col%3)*this.cellBorder);
    const yPosition = (band*(this.boxWidth+this.boxBorder)) + 
    ((row%3)*this.cellWidth) + ((row%3)*this.cellBorder);

    return {xPosition:xPosition, yPosition:yPosition};
  }

  getTripletPosition(tripletIndex, orientation) {
    let row = undefined;
    let col = undefined;
    if (orientation == "horizontal") {
      row = Math.floor(tripletIndex/3);
      col = (tripletIndex%3)*3;
    } else {
      row = Math.floor(tripletIndex/9)*3;
      col = tripletIndex%9;
    }

    const {xPosition, yPosition} = this.getCellPosition((row*9) + col);
    return {xPosition:xPosition, yPosition:yPosition}
  }
  
  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
