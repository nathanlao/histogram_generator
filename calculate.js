// Lower bounds initialization
const initialBounds = {
    "MAX": 100,
    "A+": 95,
    "A": 90,
    "A-": 85,
    "B+": 80,
    "B": 75,
    "B-": 70,
    "C+": 65,
    "C": 60,
    "C-": 55,
    "D": 50,
    "F": 0
}

// Global var for csv data
let gradesData;

const csvUploadBtn = document.getElementById('csv-input')
csvUploadBtn.addEventListener("change", (e) => {
    // Get the file from input
    const file = e.target.files[0]

    // File reader
    const reader = new FileReader()
    reader.onload = handleFileLoad
    
    // Read the file as text
    reader.readAsText(file)
})

function handleFileLoad(event) {
    const fileContent = event.target.result

    // Parse the CSV
    const lines = fileContent.trim().split("\n") // Split by lines
    const header = lines[0].split(",")
    gradesData = lines.slice(1).map(line => {
        const parts = line.split(",")
        const obj = {}
        obj[header[0].trim()] = parts[0].trim() // Name
        obj[header[1].trim()] = parseFloat(parts[1].trim()) // Percent
        return obj
    });

    hideUploadReminder()
    showHistogram()
    handleStatsCalculationAndDisplay(gradesData)
    handleHistogram(gradesData)
}

function handleStatsCalculationAndDisplay(gradesData) {
    // Only include those within the defined bounds.
    const filteredGradesData = gradesData.filter(grade => {
        return grade.Percent >= initialBounds["F"] && grade.Percent <= initialBounds["MAX"];
    });
    
    // Get the array of Percent
    const filteredGrades = filteredGradesData.map(grade => {
        return grade.Percent
    })

    if (filteredGrades.length === 0) {
        return
    }

    const highest = Math.max(...filteredGrades)
    const highestStudent = filteredGradesData.find(grade => {
        return grade.Percent === highest
    })

    const lowest = Math.min(...filteredGrades)
    const lowestStudent = filteredGradesData.find(grade => {
        return grade.Percent === lowest
    })

    const sumGrade = filteredGrades.reduce((acc, cur) => acc + cur, 0)
    const mean = parseFloat(sumGrade / filteredGrades.length || 0).toFixed(2)

    let median
    const mid = Math.floor(filteredGrades.length / 2)
    const sortedGrades = [...filteredGrades].sort((a, b) => a - b)
    if (filteredGrades.length % 2 === 0) {
        median = ((sortedGrades[mid - 1] + sortedGrades[mid]) / 2).toFixed(2)
    } else {
        median = (sortedGrades[mid]).toFixed(2)
    }

    const highestEle = document.getElementById('highest')
    const lowestEle = document.getElementById('lowest')
    const meanEle = document.getElementById('mean')
    const medianEle = document.getElementById('median')
    highestEle.textContent = `${highestStudent.Name}(${highest}%)`
    lowestEle.textContent = `${lowestStudent.Name}(${lowest}%)`
    meanEle.textContent = `${mean}%`
    medianEle.textContent = `${median}%`    
}

function handleHistogram(gradesData) {
    const histogramData = {}

    const boundsArr = Object.keys(initialBounds)
    boundsArr.forEach(bound => {
        histogramData[bound] = 0
    })
    
    // Count frequency
    gradesData.forEach(data => {
        const percent = data.Percent
        for (const grade in initialBounds) {
            if (percent >= initialBounds[grade]) {
                histogramData[grade]++
                break
            }
        }
    })

    // Update HTML
    Object.keys(histogramData).forEach(grade => {
        const barElement = document.getElementById(grade)
        if (barElement) {
            const frequency = histogramData[grade]
            barElement.style.setProperty('--height', `${frequency * 10}%`)
            barElement.querySelector('span').textContent = frequency
        }
    })
}

// Update the file name when uploaded
document.addEventListener('DOMContentLoaded', () => { 
    const fileInput = document.getElementById('csv-input')
    const fileLabel = document.querySelector('.custom-file-label')
    
    fileInput.addEventListener('change', (event) => {
        const fileName = event.target.files[0].name
        fileLabel.textContent = fileName
    })
})

let parentWidth = document.querySelector('.lower-bound-container').offsetWidth - 150;
const minWidth = 10

// Initialize bars
Object.keys(initialBounds).forEach((grade) => {
    let value = initialBounds[grade]
    let pixelWidth = ((value / 100) * parentWidth)

    // Ensure the bar is visible and not exceeding max width
    pixelWidth = Math.max(pixelWidth, minWidth)

    let barElement = document.querySelector(`.bounds-level[data-grade="${grade}"] .draggable-bar`)
    barElement.style.width = `${Math.round(pixelWidth)}px`
    let labelElement = barElement.nextElementSibling
    labelElement.textContent = value.toFixed(2)
});

/**
 * Handle dragging: 
 * Adapted from: https://codepen.io/mgmarlow/pen/bNmJKK
 */
var lastX
document.querySelectorAll('.draggable-bar').forEach((bar) => {
    bar.addEventListener('mousedown', function(event) {
        if (event.which !== 1) return
        lastX = event.pageX
        document.addEventListener('mousemove', moved)
        event.preventDefault()
    })

    function moved(event) {
        if (event.buttons === 0) {
            document.removeEventListener('mousemove', moved)
            return
        }
        let dist = event.pageX - lastX
        let newWidth = bar.offsetWidth + dist
        
        // Cap the new width between 0 and parentWidth
        newWidth = Math.min(Math.max(newWidth, 0), parentWidth)

        bar.style.width = newWidth + "px"
        lastX = event.pageX

        // Cap the value of the bar
        let newValue = (newWidth / parentWidth * 100).toFixed(2)
        let labelElement = bar.nextElementSibling
        labelElement.textContent = newValue

        // Get the grade of this bar
        const grade = bar.closest('.bounds-level').dataset.grade
        
        // Update the bounds
        initialBounds[grade] = newValue

        // Check for overlap
        if (checkForOverlap()) {
            document.getElementById('warning').style.display = 'block';
        } else {
            document.getElementById('warning').style.display = 'none';
        }
        
        // Re-calculate histogram and stats
        handleHistogram(gradesData)
        handleStatsCalculationAndDisplay(gradesData)
    }
})

function hideUploadReminder() {
    const reminderElement = document.getElementById('upload-reminder')
    reminderElement.style.display = 'none'
}

function showHistogram() {
    const histogramElement = document.getElementById('histogram')
    histogramElement.style.display = 'flex'
}

function checkForOverlap() {
    const gradeKeys = Object.keys(initialBounds).filter(key => key !== "MAX")
    for (let i = 1; i < gradeKeys.length; i++) {
        if (initialBounds[gradeKeys[i]] >= initialBounds[gradeKeys[i - 1]]) {
            return true // Overlap detected
        }
    }
    return false
}
