//Global selection and variables
const colorDivs = document.querySelectorAll('.color');
const generateBtn = document.querySelector('.generate');
const sliders = document.querySelectorAll('input[type="range"]');
const currentHexes = document.querySelectorAll('.color h2');
const popup = document.querySelector('.copy-container');
const adjustBtns = document.querySelectorAll('.adjust');
const lockBtns = document.querySelectorAll('.lock');
const closeAdjustments = document.querySelectorAll('.close-adjustment'); 
const sliderContainers = document.querySelectorAll('.sliders');
let initialColors;
// this is for local storage
let savedPalettes = [];

// Add event listener
sliders.forEach(slider => {
    slider.addEventListener('input', hslControl);
});

colorDivs.forEach((div, index) => {
    div.addEventListener('change', () => {
        updateTextUI(index);
    });
});

currentHexes.forEach(hex => {
    hex.addEventListener('click', () => {
        copyToClipboard(hex);
    });
});

popup.addEventListener('transitionend', () => {
    const popupBox = popup.children[0];
    popupBox.classList.remove('active');
    popup.classList.remove('active');

});

adjustBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        openAdjustmentPanel(index);
    });
});

lockBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        lockColor(index);
    });
});

closeAdjustments.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        closeAdjustmentPanel(index);
    });
});

generateBtn.addEventListener('click', randomColor);
// Functions
// Color Generator
function generateHex() {
    // using chroma libary to generate random color
    const hexColor = chroma.random();
    return hexColor;
}

function randomColor() {
    initialColors = [];
    colorDivs.forEach((div, index) => {
        // select h2
        const hexText = div.children[0];
        const randomColor = generateHex();
        
        if (div.classList.contains('locked')) {
            initialColors.push(hexText.innerText);
            return;
        } else {
            initialColors.push(chroma(randomColor).hex());
        }
      
        // change the backgound color of color div and give color code to h2
        div.style.backgroundColor = randomColor;
        hexText.innerText = randomColor;
        // Check if color is dark we use white text, if color is bright we use black text;
        checkTextContrast(randomColor, hexText);
        
        // Initial colorized sliders
        const color = chroma(randomColor);
        const sliders = div.querySelectorAll('.sliders input');
        // Selecting hue, brightness, and saturation
        const hue = sliders[0];
        const brightness = sliders[1];
        const saturation = sliders[2];
        // Colorize the slider
        colorizeSliders(color, hue, brightness, saturation);
    });
    // Reset input
    resetInput();
    // Check btn contrast
    adjustBtns.forEach((btn, index) => {
        checkTextContrast(initialColors[index], btn);
        checkTextContrast(initialColors[index], lockBtns[index]);
    });

}

function checkTextContrast(color, text) {
    let luminance = chroma(color).luminance();
    if (luminance > 0.5) {
        text.style.color = 'black';
    } else {
        text.style.color = 'white';
    }
}

function colorizeSliders(color, hue, brightness, saturation) {
    // Scale brigtness
    const midBright = color.set('hsl.l', 0.5)
    const scaleBright = chroma.scale(['black', midBright, 'white']);
    
    // Scale saturation from 0 to 1
    const noSat = color.set('hsl.s', 0);
    const fullSat = color.set('hsl.s', 1);
    const scaleSat = chroma.scale([noSat, color, fullSat]);
    
    // Change background of sliders based
    hue.style.backgroundImage = `linear-gradient(to right, rgb(204,75,75), rgb(204,204,75), rgb(75,204,75), rgb(75,204,204), rgb(75,75,204), rgb(204,75,204), rgb(204,75,75))`;
    brightness.style.backgroundImage = `linear-gradient(to right, ${scaleBright(0)}, ${scaleBright(0.5)}, ${scaleBright(1)})`;
    saturation.style.backgroundImage = `linear-gradient(to right, ${scaleSat(0)}, ${scaleSat(1)})`;
}

function hslControl(e) {
    const index = 
        e.target.getAttribute("data-bright") ||
        e.target.getAttribute("data-hue") ||
        e.target.getAttribute("data-sat");
    
    // Select parent element which is sliders div
    let sliders = e.target.parentElement.querySelectorAll('input[type="range"]');
    const hue = sliders[0];
    const brightness = sliders[1];
    const saturation = sliders[2];

    // Get the hex code based on what slider (hue, brightness, sat) we slide
    const bgcolor = initialColors[index];
    // set the color
    let color = chroma(bgcolor)
        .set('hsl.s', saturation.value)
        .set('hsl.l', brightness.value)
        .set('hsl.h', hue.value);
    
    colorDivs[index].style.backgroundColor = color;
    // colorize sliders/input
    colorizeSliders(color, hue, brightness, saturation);
}

function updateTextUI(index) {
    //grab the div the we make change on
    const activeDiv = colorDivs[index];
    // grab background color from that div and make a chroma object
    const color = chroma(activeDiv.style.backgroundColor);
    // update the h2 when we make change on slider
    const hexText = activeDiv.querySelector('h2');
    hexText.innerText = color.hex();
    checkTextContrast(color, hexText);
    // check the contrast and change icon color
    const icons = activeDiv.querySelectorAll('.controls button');
    for (icon of icons) {
        checkTextContrast(color, icon);
    }
}

function resetInput() {
    const sliders = document.querySelectorAll('.sliders input');
    sliders.forEach(slider => {
        // check which slider we slide
        if (slider.name === 'hue') {
            // get the index of that hue color so that we can use it to access
            // specific color from initialColors
            const hueColor = initialColors[slider.getAttribute('data-hue')]; 
            // select only the hue number
            const hueValue = chroma(hueColor).hsl()[0];
            // update the slider based on the value
            slider.value = Math.floor(hueValue);
        }
        if (slider.name === 'brightness') {
            // get the index of that brightness color so that we can use it to access
            // specific color from initialColors
            const brightColor = initialColors[slider.getAttribute('data-bright')]; 
            // select only the brightness number
            const brightValue = chroma(brightColor).hsl()[2];
            // update the slider based on the value
            slider.value = Math.floor(brightValue * 100) / 100;
        }
        if (slider.name === 'saturation') {
            // get the index of that saturation color so that we can use it to access
            // specific color from initialColors
            const satColor = initialColors[slider.getAttribute('data-sat')]; 
            // select only the brightness number
            const satValue = chroma(satColor).hsl()[1];
            // update the slider based on the value
            slider.value = Math.floor(satValue * 100) / 100;
        }
    });
}

function copyToClipboard(hex) {
    const el = document.createElement('textarea');
    el.value = hex.innerText;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    // Pop up animation
    const popupBox = popup.children[0];
    popupBox.classList.add('active');
    popup.classList.add('active');
}

function openAdjustmentPanel(index) {
    sliderContainers[index].classList.toggle('active');
}

function closeAdjustmentPanel(index) {
    sliderContainers[index].classList.remove('active');
}

function lockColor(index) {
    colorDivs[index].classList.toggle('locked');
    lockBtns[index].firstChild.classList.toggle('fa-lock');
    lockBtns[index].firstChild.classList.toggle('fa-lock-open');

}

// Implement save to pallete and local storage stuff
const saveBtn = document.querySelector(".save");
const submitSave = document.querySelector('.submit-save');
const closeSave = document.querySelector('.close-save');
const saveContainer = document.querySelector('.save-container');
const saveInput = document.querySelector('.save-container input');
const libraryContainer = document.querySelector('.library-container');
const libraryBtn = document.querySelector('.library');
const closeLibraryBtn = document.querySelector('.close-library')

saveBtn.addEventListener('click', openPalette);
closeSave.addEventListener('click', closePalette);
submitSave.addEventListener('click', savePalette);
libraryBtn.addEventListener('click', openLibrary);
closeLibraryBtn.addEventListener('click', closeLibrary);

function openPalette(e) {
    const popup = saveContainer.children[0];
    saveContainer.classList.add('active');
    popup.classList.add('active');
}

function closePalette(e) {
    const popup = saveContainer.children[0];
    saveContainer.classList.remove('active');
    popup.classList.remove('active');
}

function savePalette(e) {
    saveContainer.classList.remove('active');
    popup.classList.remove('active');
    const name = saveInput.value;
    const colors = [];
    currentHexes.forEach(hex => {
        colors.push(hex.innerText);
    });
    // Generate Object
    let paletteNr;
    const paletteObjects = JSON.parse(localStorage.getItem('palettes'));
    if (paletteObjects) {
        paletteNr = paletteObjects.length;
    } else {
        paletteNr = savedPalettes.length;
    }
    const paletteObj = {name, colors, nr: paletteNr};
    savedPalettes.push(paletteObj);
    // save to local Storage
    saveToLocal(paletteObj);
    saveInput.value = "";
    // Generate palettes for the library
    const palette = document.createElement('div');
    palette.classList.add('custom-palette');
    const title = document.createElement('h4');
    title.innerText = paletteObj.name;
    const preview = document.createElement('div');
    preview.classList.add('small-preview');
    paletteObj.colors.forEach(smallColor => {
         const smallDiv = document.createElement('div');
         smallDiv.style.backgroundColor = smallColor;
         preview.appendChild(smallDiv);
    });
    const paletteBtn = document.createElement('button');
    paletteBtn.classList.add('pick-palette-btn');
    paletteBtn.classList.add(paletteObj.nr);
    paletteBtn.innerText = 'Select';

    // Attach event to the btn
    paletteBtn.addEventListener('click', e => {
        closeLibrary();
        const paletteIndex = e.target.classList[1];
        initialColors = [];
        savedPalettes[paletteIndex].colors.forEach((color, index) => {
            initialColors.push(color);
            colorDivs[index].style.backgroundColor = color;
            updateTextUI(index);
            const text = colorDivs[index].children[0];
            checkTextContrast(color, text);
        });
        resetInput();
    });
    // Append to the libary
    palette.appendChild(title);
    palette.appendChild(preview);
    palette.appendChild(paletteBtn);
    libraryContainer.children[0].appendChild(palette);
}

function saveToLocal(paletteObj) {
    let localPalettes;
    if (localStorage.getItem('palettes') === null) {
        localPalettes = [];
    } else {
        localPalettes = JSON.parse(localStorage.getItem('palettes'));
    }
    localPalettes.push(paletteObj);
    localStorage.setItem('palettes', JSON.stringify(localPalettes));
}

function openLibrary() {
    const popup = libraryContainer.children[0];
    libraryContainer.classList.add('active');
    popup.classList.add('active');
}

function closeLibrary() {
    const popup = libraryContainer.children[0];
    libraryContainer.classList.remove('active');
    popup.classList.remove('active');
}

// not losing what we've saved when we refresh the page
function getLocal() {
    let localPalettes;
    if (localStorage.getItem('palettes') === null) {
        localPalettes = [];
    } else {
        const paletteObjects = JSON.parse(localStorage.getItem('palettes'));
        savedPalettes = [...paletteObjects];
        paletteObjects.forEach(paletteObj => {
            //Generate the palette for Library
            const palette = document.createElement("div");
            palette.classList.add("custom-palette");
            const title = document.createElement("h4");
            title.innerText = paletteObj.name;
            const preview = document.createElement("div");
            preview.classList.add("small-preview");
            paletteObj.colors.forEach(smallColor => {
              const smallDiv = document.createElement("div");
              smallDiv.style.backgroundColor = smallColor;
              preview.appendChild(smallDiv);
            });
            const paletteBtn = document.createElement("button");
            paletteBtn.classList.add("pick-palette-btn");
            paletteBtn.classList.add(paletteObj.nr);
            paletteBtn.innerText = "Select";
      
            //Attach event to the btn
            paletteBtn.addEventListener("click", e => {
              closeLibrary();
              const paletteIndex = e.target.classList[1];
              initialColors = [];
              paletteObjects[paletteIndex].colors.forEach((color, index) => {
                initialColors.push(color);
                colorDivs[index].style.backgroundColor = color;
                const text = colorDivs[index].children[0];
                checkTextContrast(color, text);
                updateTextUI(index);
              });
              resetInput();
            });
      
            //Append to Library
            palette.appendChild(title);
            palette.appendChild(preview);
            palette.appendChild(paletteBtn);
            libraryContainer.children[0].appendChild(palette);
        });
    }
}

getLocal();
randomColor();

