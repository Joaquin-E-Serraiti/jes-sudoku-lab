# Sudoku Lab

Sudoku Lab is a tool to experiment with sudoku configurations.

It has features for analysis of patterns, generation of configurations, visualization and more.

It can be used through an API, or through a graphical user interface to visualize some of its features.

![ScreenshotSudokuTool](https://github.com/user-attachments/assets/60e7eced-bb6d-4f93-9721-77e33f8a5876)


Try the graphical user interface in your browser: [Sudoku Lab GUI](https://joaquin-e-serraiti.github.io/jes-sudoku-lab/)

## How to use the graphical user interface

1. Input a Sudoku configuration as a string of 81 characters. The valid characters are 1,2,3,4,5,6,7,8,9 and 0 or . for empty cells.
2. Press the “Analyze Patterns” button to see pattern metrics displayed. Only complete and valid configurations can be analyzed.
3. To visualize the analysis process, check the "Visualize analysis" box before pressing the "Analize Patterns" button.

### Sudoku strings to try

- 123456789456789123789123456234567891567891234891234567345678912678912345912345678
- 478921653132657498965843712349278165256319847781564239817495326524736981693182574
- 123456789456789123789123456312645978645978312978312645231564897564897231897231564

The analysis and the patterns are based on this article: [Classification of Sudoku Patterns and Transformations](/Classification%20of%20Sudoku%20Patterns%20and%20Transformations.pdf). I recommend reading it to understand the patterns analyzed and the analysis process.

**Note:** the terminology I use isn't very rigorous and may differ from Sudoku conventions.

## How to use the API to analyze configurations
> [!NOTE]
> The following steps are for using the Python version of the API, but the JavaScript version works the same.

1. Download the `sudokuLab.py` file.
2. Import the `SudokuLab` class.
3. Initialize an instance of the `SudokuLab` class:
   ```py
   sudokuLab = SudokuLab()
   ```
4. Set a grid (the default grid is empty):
   ```py
   sudokuString = "478921653132657498965843712349278165256319847781564239817495326524736981693182574"
   sudokuLab.setNewGrid(sudokuString)
   ```
5. Call the `analysisReport()` method:
   
   ```py
   analysisReport = sudokuLab.analysisReport();
   ```
6. It will return a dictionary with the following data:

   ```py
       {
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
   ```

## How the patterns are analyzed

> [!NOTE]
> I recommend reading the [Classification of Sudoku Patterns and Transformations](/Classification%20of%20Sudoku%20Patterns%20and%20Transformations.pdf) article before reading this section.

The program doesn’t analyze patterns in a binary way, as in “present” or “not present” in the configuration. Instead, it uses something I call “proximity metrics”, which indicate how close is a given configuration to having a certain pattern present.

### How IBPU (Intra-Box Positional Uniqueness) is analyzed:

The pattern is present when each digit doesn’t appear more than once in each intra-box position.

The program analyzes this pattern based on repeated digits in intra-box positions (that’s its proximity metric). The more repeated digits in the same intra-box positions, the “less present” the IBPU pattern is. Because there are 81 digits, there can be 81 repeated digits in the same intra-box positions. So, 0 repeated digits in the same intra-box positions indicate 100% proximity to the pattern (meaning that the pattern is present), and 81 indicates 0% proximity.

### How IBPA (Intra-Box Positional Alignment) is analyzed:

The pattern is present when each digit has the same horizontal intra-box position along bands and the same vertical intra-box position along stacks.

The program analyzes this pattern based on 2 metrics: repeated digits in horizontal intra-box positions along bands, and repeated digits in vertical intra-box positions along stacks. In this case, in contrast with the IBPU proximity metric, the more repeated digits, the more present the pattern is. The results can range from 0 (0%) to 162 (100%): 81 repeated digits in horizontal intra-box positions along bands, and 81 vertical intra-box positions along stacks digits).

### How TDC (Triplet Digit Consistency) is analyzed:

Each triplet has a set of 3 digits. The pattern is present when there are only 3 unique horizontal triplet sets and 3 unique vertical triplet sets, repeated in every 3x3 box.

The program analyzes this pattern based on 2 metrics: amount of unique triplet sets and amount of repeated triplet sets. In valid and complete configurations, the amount of unique triplet sets can range from 6 to 54: 27 vertical triplets and 27 horizontal triplets. Amount of repeated triplet sets can range from 0 to 54. Proximity to TDC pattern is at 100% when the amount of unique triplet sets is 6 and the amount of repeated triplet sets is 54.
