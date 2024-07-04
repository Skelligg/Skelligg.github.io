
// left to do - add error div when max api calls reached

const app_id = "e0854d27";
const app_key = "ecc8bdb05ddbd3dbe828f0ee73c8c791"

const addedFoodsDiv = document.querySelector(".added-foods")
let addedFoods = [];
let addedFoodID = 0;

const delay = ms => new Promise(res => setTimeout(res, ms));
let canUseStorage = false;

try {
    let key = "test" + Date.now() + Math.random();
    localStorage.setItem(key, key);
    if (localStorage.getItem(key) == key) {
        canUseStorage = true;
        localStorage.removeItem(key);
    }
}
catch (e) {
    console.log(e)
}

if(canUseStorage){
    getFoodsFromLocalStorage();
}

async function getFoodsFromLocalStorage(){
    let keys = Object.keys(localStorage);
    let order = getValuesFromLocalStorageInOrder();

    for(let i = 0; i < order.length; i++){

        let values = order[i].split('-');

        let id = Number(keys[i].slice(-1))
        
        if( id > addedFoodID){
            addedFoodID = id
        }
        fetchNutrients(values[0], values[1], values[2], "stored")
    }
}

let result = [];
let idResult = [];
let data;
let nutrientData;

let buttons = document.querySelectorAll(".close")
let wrappers = document.querySelectorAll(".wrapper")
const search = document.querySelector(".search-bar")
const resultBox = document.querySelector(".result-box")
const showTableButton = document.querySelector(".show-table")
const downloadable = document.querySelector(".downloadable")

init()

function init(){
    calculateTotal();
    search.addEventListener("keypress", searchResults)
    document.addEventListener('mousemove', showButton)
    for(let button of buttons){
        button.addEventListener("click",removeWrapper);
    }
    document.querySelector("body").addEventListener("click", () => resultBox.innerHTML = "")
    document.addEventListener('DOMContentLoaded', calculateTotal);
    showTableButton.addEventListener("click", toggleTable)
}

    function toggleTable() {
        (this.innerHTML == "Show Table") ? this.innerHTML = "Hide Table" : this.innerHTML = "Show Table";
        (downloadable.style.display == "none") ? downloadable.style.display = "block" : downloadable.style.display = "none";
    }

function removeWrapper(e){
    let targetWrapperID = e.target.getAttribute("for")
    let targetWrapper = document.querySelector(`#${targetWrapperID}`)
    let index = addedFoods.indexOf(targetWrapper)
    addedFoods.splice(index,1);
    targetWrapper.remove();
    if(canUseStorage){
        localStorage.removeItem(targetWrapperID);
    }
    calculateTotal();
}

function showButton(event){
    for(let button of buttons){
        const rect = button.getBoundingClientRect();
        const proximityThreshold = 45; // Adjust this value as needed
    
        const isInProximity = 
            event.clientX > rect.left - proximityThreshold &&
            event.clientX < rect.right + proximityThreshold &&
            event.clientY > rect.top - proximityThreshold &&
            event.clientY < rect.bottom + proximityThreshold;
    
        if (isInProximity) {
            button.classList.add('visible');
        } else {
            button.classList.remove('visible');
        }
    }
}

function searchResults(e){
    if(e.key === "Enter"){
        let foodItem = e.target.value;
        fetchSearchResults(foodItem)
    }
}

async function fetchSearchResults(foodItem){
    const parserURL = `https://api.edamam.com/api/food-database/v2/parser?app_id=${app_id}&app_key=${app_key}&ingr=${foodItem}`;
    try{
        const response = await fetch(parserURL)

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
          }

        data = await response.json();

        result = [];
        idResult = [];

        if(foodItem){
            for(let i = 0; i < 10 && i < data.hints.length; i++){
                const obj = {
                    name: data.hints[i].food.label,
                    id : data.hints[i].food.foodId,
                    measureURI : data.hints[i].measures[0].uri
                }
                idResult[i] = obj;
                result[i] = data.hints[i].food.label;
                
            }
        }
        const content = result.map((list) =>{
            return "<li>" + list + "</li>"
        });
        (foodItem) ? content.push("<li><strong>Add Custom Food..</strong></li>") : null;


        resultBox.innerHTML = "<ul>" + content.join('') + "</ul>"
    
        let searchResults = document.querySelectorAll("li");
        for(let i = 0; i < searchResults.length; i++){
            if(searchResults[i].innerHTML != "<strong>Add Custom Food..</strong>"){
                searchResults[i].addEventListener("click",function() { 
                    fetchNutrients(idResult[i].name, idResult[i].id, idResult[i].measureURI)})
            }
            else{
                searchResults[i].addEventListener("click", function () {
                    addCustomFood(foodItem)})
            }
        }    
    }
    catch(error){
        console.error(error)
        apiError();
    }
}

async function fetchNutrients(name, APIfoodID, measureURI, lS){
    const nutrientURL = "https://api.edamam.com/api/food-database/v2/nutrients?app_id=e0854d27&app_key=ecc8bdb05ddbd3dbe828f0ee73c8c791";

    try{
        const response = await fetch(nutrientURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                    "ingredients": [
                      {
                        "quantity": 1,
                        "measureURI": `${measureURI}`,
                        "qualifiers": [
                          "https://api.edamam.com/api/food-database/v2/nutrients"
                        ],
                        "foodId": `${APIfoodID}`
                      }
                    ]
                  })
        
        })
        if(!response.ok){
            // add error on screen
            throw new Error('Network response was not ok ' + response.statusText);
        
          }

        nutrientData = await response.json();
        addFood(name, APIfoodID, measureURI, lS);

    }
    catch(error){
        console.log(error)
        apiError();
    }
}

function apiError() {
    const p = document.querySelector(".error")
    p.innerHTML = "<strong>API Error! Please try again later.</strong>"
    p.style.color = "rgb(207, 0, 0)";
}

function addFood(name, APIfoodID, measureURI, lS){

    let weight = nutrientData?.totalWeight ?? 0;
    let caloriesPer100g = Number((nutrientData?.totalNutrients?.ENERC_KCAL?.quantity?.toFixed(2) ?? 0) / weight * 100).toFixed(0);
    let carbsPer100g = ((nutrientData?.totalNutrients?.CHOCDF?.quantity?.toFixed(2) ?? 0) / weight * 100).toFixed(2);
    let fiberPer100g = ((nutrientData?.totalNutrients?.FIBTG?.quantity?.toFixed(2) ?? 0) / weight * 100).toFixed(2);
    let totalSugarsPer100g = ((nutrientData?.totalNutrients?.SUGAR?.quantity?.toFixed(2) ?? 0) / weight * 100).toFixed(2);
    let energyPer100g = (caloriesPer100g * 4.184).toFixed(2);
    let fatPer100g = ((nutrientData?.totalNutrients?.FAT?.quantity?.toFixed(2) ?? 0) / weight * 100).toFixed(2);
    let proteinPer100g = ((nutrientData?.totalNutrients?.PROCNT?.quantity?.toFixed(2) ?? 0) / weight * 100).toFixed(2);

    let newFoodID = "";

    // Create the wrapper div
    const wrapper = document.createElement('div');
    wrapper.className = 'wrapper';
    if(lS){
        for (let i = 0; i < localStorage.length; i++) {
            if(localStorage.getItem(localStorage.key(i)) == `${name}-${APIfoodID}-${measureURI}`){
                wrapper.id = `${localStorage.key(i)}`;
                newFoodID = `${localStorage.key(i)}`;
            }
        }
    }
    else if (canUseStorage){
        if(localStorage.getItem(`wrapper-${addedFoodID}`) != null){
            while(localStorage.getItem(`wrapper-${addedFoodID}`) != null){
                addedFoodID++;
            }
            wrapper.id = `wrapper-${addedFoodID}`; 
            newFoodID = `${addedFoodID}`   
        }
        else{
            wrapper.id = `wrapper-${addedFoodID}`; 
            newFoodID = `${addedFoodID}`  
        }
    }
    else{
        wrapper.id = `wrapper-${addedFoodID}`; 
            newFoodID = `${addedFoodID}`  
    }


    // Create the collapsible div
    const collapsible = document.createElement('div');
    collapsible.className = 'collapsible';

    // Create the input checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `food-${newFoodID}`;
    checkbox.style.display = "none";

    // Create the label
    const label = document.createElement('label');
    label.setAttribute('for', `food-${newFoodID}`);
    label.innerHTML = `${shortenName(name)} <p>${caloriesPer100g} kCal</p><img src="./resources/arrow.png">`;

    // Create the collapsible-text div
    const collapsibleText = document.createElement('div');
    collapsibleText.className = 'collapsible-text';

    // Create the weight div
    const weightDiv = document.createElement('div');
    weightDiv.className = 'weight';

    // Create the h3 element
    const nutritionHeader = document.createElement('h3');
    nutritionHeader.textContent = 'Nutrition';

    // Create the amount input
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.className = 'amount';
    amountInput.min = '0';
    amountInput.max = '9999';
    amountInput.value = 100;

    const pGrams = document.createElement('p');
    pGrams.innerHTML = "g"

    // Append the h3 and amount input to the weight div
    weightDiv.appendChild(nutritionHeader);
    weightDiv.appendChild(amountInput);
    weightDiv.appendChild(pGrams);

    // Create the nutrition div
    const nutritionDiv = document.createElement('div');
    nutritionDiv.className = 'nutrition';

    // Create the p elements for nutrition facts
    const nutritionFacts = {
        carbs: `Carbs: <strong>${carbsPer100g} g</strong>`,
        fiber: `Fiber: <strong>${fiberPer100g} g</strong>`,
        totalSugars: `Sugar: <strong>${totalSugarsPer100g} g</strong>`,
        energy: `Energy: <strong>${energyPer100g} kJ</strong>`,
        fat: `Fat: <strong>${fatPer100g} g</strong>`,
        protein: `Protein: <strong>${proteinPer100g} g</strong>`
    };

    const nutrientElements = {};
    for (const [key, fact] of Object.entries(nutritionFacts)) {
        const p = document.createElement('p');
        p.innerHTML = fact;
        nutritionDiv.appendChild(p);
        nutrientElements[key] = p;
    }

    // Create the cost input
    const costP = document.createElement('p');
    costP.innerHTML = 'Cost: '

    const costInput = document.createElement('input');
    costInput.type = 'number';
    costInput.className = 'cost';
    costInput.value = 0;

    // Append the cost input to the nutrition div
    costP.appendChild(costInput)
    nutritionDiv.appendChild(costP);

    // Append the weight div and nutrition div to the collapsible-text div
    collapsibleText.appendChild(weightDiv);
    collapsibleText.appendChild(nutritionDiv);

    // Append the input, label, and collapsible-text to the collapsible div
    collapsible.appendChild(checkbox);
    collapsible.appendChild(label);
    collapsible.appendChild(collapsibleText);

    // Create the close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close';
    closeButton.innerHTML = 'x';
    (lS) ? closeButton.setAttribute("for", `${newFoodID}`) : closeButton.setAttribute("for", `wrapper-${newFoodID}`);
    
    closeButton.addEventListener("click", removeWrapper);

    // Append the collapsible div and close button to the wrapper div
    wrapper.appendChild(collapsible);
    wrapper.appendChild(closeButton);

    // Append the wrapper div to the body or a specific container element
    addedFoodsDiv.appendChild(wrapper);

    const foodTableRow = document.createElement('tr');
    foodTableRow.id = `food-row-${newFoodID}`;
    const rowData = [
        name,
        `${caloriesPer100g} kCal`,
        `${amountInput.value} g`,
        `${carbsPer100g} g`,
        `${fiberPer100g} g`,
        `${totalSugarsPer100g} g`,
        `${energyPer100g} kJ`,
        `${fatPer100g} g`,
        `${proteinPer100g} g`,
        `0.00`
    ];
    
    rowData.forEach(data => {
        const td = document.createElement('td');
        td.innerHTML = data;
        foodTableRow.appendChild(td);
    });

    document.getElementById('food-table-body').appendChild(foodTableRow);

    // Update nutrients based on the amount input value
    amountInput.addEventListener('input', () => {
        const amount = amountInput.value;
        nutrientElements.carbs.innerHTML = `Carbs: <strong>${(carbsPer100g * amount / 100).toFixed(2)} g</strong>`;
        nutrientElements.fiber.innerHTML = `Fiber: <strong>${(fiberPer100g * amount / 100).toFixed(2)} g</strong>`;
        nutrientElements.totalSugars.innerHTML = `Sugar: <strong>${(totalSugarsPer100g * amount / 100).toFixed(2)} g</strong>`;
        nutrientElements.energy.innerHTML = `Energy: <strong>${(energyPer100g * amount / 100).toFixed(2)} kJ</strong>`;
        nutrientElements.fat.innerHTML = `Fat: <strong>${(fatPer100g * amount / 100).toFixed(2)} g</strong>`;
        nutrientElements.protein.innerHTML = `Protein: <strong>${(proteinPer100g * amount / 100).toFixed(2)} g</strong>`;
        label.innerHTML = `${name} <p>${(caloriesPer100g * amount / 100).toFixed(0)} kCal</p><img src="./resources/arrow.png">`;
        
        const foodTableRow = document.getElementById(`food-row-${newFoodID}`);
        foodTableRow.children[1].innerText = `${(caloriesPer100g * amount / 100).toFixed(0)} kCal`;
        foodTableRow.children[2].innerText = `${amountInput.value} g`;
        foodTableRow.children[3].innerHTML = `${(carbsPer100g * amount / 100).toFixed(2)} g`;
        foodTableRow.children[4].innerHTML = `${(fiberPer100g * amount / 100).toFixed(2)} g`;
        foodTableRow.children[5].innerHTML = `${(totalSugarsPer100g * amount / 100).toFixed(2)} g`;
        foodTableRow.children[6].innerHTML = `${(energyPer100g * amount / 100).toFixed(2)} kJ`;
        foodTableRow.children[7].innerHTML = `${(fatPer100g * amount / 100).toFixed(2)} g`;
        foodTableRow.children[8].innerHTML = `${(proteinPer100g * amount / 100).toFixed(2)} g`;

        calculateTotal();
    });

    costInput.addEventListener('input', () => {
        const foodTableRow = document.getElementById(`food-row-${newFoodID}`);
        foodTableRow.children[9].innerText = `${costInput.value} `;
        calculateTotal();
    });

    closeButton.addEventListener("click", () => {
        document.getElementById(`food-row-${newFoodID}`).remove();
        calculateTotal();
    });

    if(!lS && canUseStorage){
        localStorage.setItem(`wrapper-${addedFoodID}`, `${name}-${APIfoodID}-${measureURI}`);
        addedFoodID++;
    }
    
    addedFoods.push(wrapper);
    buttons = document.querySelectorAll(".close");
    calculateTotal();

}

function calculateTotal(){
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalFiber = 0;
    let totalSugars = 0;
    let totalEnergy = 0;
    let totalFat = 0;
    let totalProtein = 0;
    let totalWeight = 0;
    let totalCost = 0;

    addedFoods.forEach(wrapper => {
        const amount = parseFloat(wrapper.querySelector('.amount').value) || 100;

        const getValue = (label) => {
            const p = Array.from(wrapper.querySelectorAll('p')).find(p => p.innerText.includes(label));
            if (p) {
                const input = p.querySelector('input');
                
                if (input) {
                    return parseFloat(input.value) || 0;
                } else {
                    const strongText = p.querySelector('strong');
                    
                    if (strongText) {
                        return parseFloat(strongText.innerText.replace(/[^\d.-]/g, '')) || 0;
                    }
                }
            }
            return 0;
        };

        const calInput = wrapper.querySelector('.custom-cal');
        let calories;
        if (calInput) {
            calories = parseFloat(calInput.value) || 0;
        } else {
            const caloriesText = wrapper.querySelector('label p').innerText;
            calories = parseFloat(caloriesText.replace(/[^\d.-]/g, '')) || 0;
        }

        const carbs = getValue('Carbs');
        const fiber = getValue('Fiber');
        const sugars = getValue('Sugar');
        const energy = getValue('Energy');
        const fat = getValue('Fat');
        const protein = getValue('Protein');
        const cost = parseFloat(wrapper.querySelector('.cost').value) || 0;

        totalCalories += calories;
        totalCarbs += carbs;
        totalFiber += fiber;
        totalSugars += sugars;
        totalEnergy += energy;
        totalFat += fat;
        totalProtein += protein;
        totalWeight += amount;
        totalCost += cost;
    });

    document.getElementById('total-calories').innerText = `${totalCalories.toFixed(0)} kCal`;
    document.getElementById('total-carbs').innerHTML = `Carbs: <strong>${totalCarbs.toFixed(2)} g</strong>`;
    document.getElementById('total-fiber').innerHTML = `Fiber: <strong>${totalFiber.toFixed(2)} g</strong>`;
    document.getElementById('total-sugars').innerHTML = `Sugar: <strong>${totalSugars.toFixed(2)} g</strong>`;
    document.getElementById('total-energy').innerHTML = `Energy: <strong>${totalEnergy.toFixed(2)} kJ</strong>`;
    document.getElementById('total-fat').innerHTML = `Fat: <strong>${totalFat.toFixed(2)} g</strong>`;
    document.getElementById('total-protein').innerHTML = `Protein: <strong>${totalProtein.toFixed(2)} g</strong>`;
    document.getElementById('total-weight').innerHTML = `Weight: <strong>${totalWeight.toFixed(2)} g</strong>`;
    document.getElementById('total-cost').innerHTML = `Cost: <strong>${totalCost.toFixed(2)}</strong>`;

    const totalRow = document.getElementById('total-row');
    totalRow.children[1].innerText = `${totalCalories.toFixed(0)} kCal`;
    totalRow.children[2].innerText = `${totalWeight.toFixed(2)} g`;
    totalRow.children[3].innerHTML = `${totalCarbs.toFixed(2)} g`;
    totalRow.children[4].innerHTML = `${totalFiber.toFixed(2)} g`;
    totalRow.children[5].innerHTML = `${totalSugars.toFixed(2)} g`;
    totalRow.children[6].innerHTML = `${totalEnergy.toFixed(2)} kJ`;
    totalRow.children[7].innerHTML = `${totalFat.toFixed(2)} g`;
    totalRow.children[8].innerHTML = `${totalProtein.toFixed(2)} g`;
    totalRow.children[9].innerHTML = `${totalCost.toFixed(2)}`;
}


function shortenName(str) {
    // Ensure the string is at least 26 characters long
    if (str.length <= 26) {
        return str[0].toUpperCase() + str.slice(1);
    }

    // Find the last space before the 26th character
    const substring = str.slice(0, 26);
    const lastSpaceIndex = substring.lastIndexOf(' ');

    // If there's no space before the 26th character, return the entire string
    if (lastSpaceIndex === -1) {
        return str[0].toUpperCase() + str.slice(1);;
    }

    // Slice the string at the last space before the 26th character
    return str.slice(0, lastSpaceIndex);
}

const $ = document.querySelector.bind(document);
const $$ = (sel, con) => Array.prototype.slice.call((con || document).querySelectorAll(sel));
const DEG = Math.PI / 180;

function rotate({x, y}, a) {
  const { sin, cos } = Math;
  return {
    x: x * cos(a) - y * sin(a),
    y: x * sin(a) + y * cos(a)
  };
}

function translate({x, y}, tx, ty) {
  return {
    x: x + tx,
    y: y + ty
  }
}

$('.darkmode-checkbox').addEventListener('click', () => {
    const isDarkmode = document.body.classList.toggle('darkmode');
    const shadow = $('.moon-shadow');
    shadow.setAttribute('cx', isDarkmode ? '40' : '60');
    
    const text = document.querySelectorAll(".darkerblue, .lighterblue");
    text.forEach(t => {
        t.classList.toggle('darkerblue', !isDarkmode);
        t.classList.toggle('lighterblue', isDarkmode);
    });

    (isDarkmode) ? showTableButton.style.color = "#c6c6c6" : showTableButton.style.color = "#0000009c"
});


// I could not get the transforms in buggy safari to work
// Workaround: calculate the transformed coords to absolute ones:
const removeTransforms = true;

if (removeTransforms) {
  const rays = $$('.rays path');
  rays.map((ray, i) => {
    const p0 = translate(rotate({x: 0, y: -28}, i * 45 * DEG), 32, 32);
    const p1 = translate(rotate({x: 0, y: -16}, i * 45 * DEG), 32, 32);
    ray.removeAttribute('transform-origin');
    ray.removeAttribute('transform');
    ray.setAttribute('d', `M${p0.x} ${p0.y} L${p1.x} ${p1.y}`);
    
  });  
}

function getValuesFromLocalStorageInOrder() {
    let valuesArray = [];

    // Retrieve all keys from localStorage
    let keys = Object.keys(localStorage);

    // Filter keys to get only those starting with 'wrapper-'
    let numericKeys = keys.filter(key => key.startsWith('wrapper-'))
                          .map(key => Number(key.split('-')[1]));

    // Sort the numeric keys
    numericKeys.sort((a, b) => a - b);

    // Retrieve the values using the sorted keys and store them in an array
    for (let key of numericKeys) {
        valuesArray.push(localStorage.getItem('wrapper-' + key));
    }

    return valuesArray;
}

function addCustomFood(name){
    let newFoodID = "";

    // Create the wrapper div
    const wrapper = document.createElement('div');
    wrapper.className = 'wrapper';

    if(canUseStorage){
        if(localStorage.getItem(`wrapper-${addedFoodID}`) != null){
            while(localStorage.getItem(`wrapper-${addedFoodID}`) != null){
                addedFoodID++;
            }
            wrapper.id = `wrapper-${addedFoodID}`; 
            newFoodID = `${addedFoodID}`   
        }
        else{
            wrapper.id = `wrapper-${addedFoodID}`; 
            newFoodID = `${addedFoodID}`  
        }
    }
    else{
        wrapper.id = `wrapper-${addedFoodID}`; 
        newFoodID = `${addedFoodID}`  
    }

    // Create the collapsible div
    const collapsible = document.createElement('div');
    collapsible.className = 'collapsible';

    // Create the input checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `food-${newFoodID}`;
    checkbox.style.display = "none";

    // Create the collapsible-text div
    const collapsibleText = document.createElement('div');
    collapsibleText.className = 'collapsible-text';

    // Create the weight div
    const weightDiv = document.createElement('div');
    weightDiv.className = 'weight';

    // Create the h3 element
    const nutritionHeader = document.createElement('h3');
    nutritionHeader.textContent = 'Nutrition';

    // Create the amount input
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.className = 'amount';
    amountInput.value = 100;

    const pGrams = document.createElement('p');
    pGrams.innerHTML = "g"

    // Append the h3 and amount input to the weight div
    weightDiv.appendChild(nutritionHeader);
    weightDiv.appendChild(amountInput);
    weightDiv.appendChild(pGrams);

    // Create the nutrition div
    const nutritionDiv = document.createElement('div');
    nutritionDiv.className = 'nutrition';


    // Create the p elements for nutrition facts
    const nutritionFacts = [
        `Carbs: _ g`,
        `Fiber: _ g`,
        `Sugar: _ g`,
        `Energy: _ kJ`,
         `Fat: _ g`,
        `Protein: _ g`
    ];

    const customInputs = [];

    for (let i = 0; i < nutritionFacts.length; i++) {
        const p = document.createElement('p');
        p.innerHTML = nutritionFacts[i];
        const textParts = p.textContent.split('_');
        const beforeTextNode = document.createTextNode(textParts[0]);

        customInputs[i] = document.createElement("input");
        customInputs[i].type = "number"
        customInputs[i].className = "custom"

        const afterTextNode = document.createTextNode(textParts[1]);
        p.textContent = '';
        p.appendChild(beforeTextNode);
        p.appendChild(customInputs[i]);
        p.appendChild(afterTextNode);

        nutritionDiv.appendChild(p);
    }

    // Create the label
    const label = document.createElement('label');
    label.setAttribute('for', `food-${newFoodID}`);
    const afterText1 = ' kCal';
    const pElement = document.createElement('p');
    pElement.className = "customP"
    const afterTextNode1 = document.createTextNode(afterText1);
    const calInput = document.createElement('input');
    calInput.type = 'number';
    calInput.className = "custom-cal"
    const arrowsvg = document.createElement("img")
    arrowsvg.src = "./resources/arrow.png"
    pElement.appendChild(calInput);
    pElement.appendChild(afterTextNode1);

    label.innerHTML = `${shortenName(name)} `;
    label.appendChild(pElement)
    label.appendChild(arrowsvg)

    // Create the cost input
    const beforeText = 'Cost: ';
    const costP = document.createElement('p');
    const beforeTextNode = document.createTextNode(beforeText);
    const costInput = document.createElement('input');
    costInput.type = 'number';
    costInput.className = "cost"
    costP.appendChild(beforeTextNode);
    costP.appendChild(costInput)

    const warningText = document.createElement("p")
    warningText.innerHTML = "<strong>Warning!</strong> Custom foods are not saved on refresh."
    warningText.className = "warning"

    // Append the cost input to the nutrition div
    nutritionDiv.appendChild(costP);

    // Append the weight div and nutrition div to the collapsible-text div
    collapsibleText.appendChild(weightDiv);
    collapsibleText.appendChild(nutritionDiv);
    collapsibleText.appendChild(warningText)

    // Append the input, label, and collapsible-text to the collapsible div
    collapsible.appendChild(checkbox);
    collapsible.appendChild(label);
    collapsible.appendChild(collapsibleText);

    // Create the close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close';
    closeButton.innerHTML = 'x';
    closeButton.setAttribute("for", `wrapper-${newFoodID}`);
    
    closeButton.addEventListener("click", removeWrapper);

    // Append the collapsible div and close button to the wrapper div
    wrapper.appendChild(collapsible);
    wrapper.appendChild(closeButton);

    // Append the wrapper div to the body or a specific container element
    addedFoodsDiv.appendChild(wrapper);

    const foodTableRow = document.createElement('tr');
    foodTableRow.id = `food-row-${newFoodID}`;
    const rowData = [
        name,
        `0 kCal`,
        `0 g`,
        `0 g`,
        `0 g`,
        `0 g`,
        `0 kJ`,
        `0 g`,
        `0 g`,
        `0.00`
    ];
    
    rowData.forEach(data => {
        const td = document.createElement('td');
        td.innerHTML = data;
        foodTableRow.appendChild(td);
    });

    document.getElementById('food-table-body').appendChild(foodTableRow);

    addedFoods.push(wrapper);
    addedFoodID++;
    buttons = document.querySelectorAll(".close");

    closeButton.addEventListener("click", () => {
        document.getElementById(`food-row-${newFoodID}`).remove();
        calculateTotal();
    });

    // Add event listeners to all inputs
    calInput.addEventListener('input', () => updateFoodData(newFoodID, customInputs, amountInput, costInput, calInput))
    amountInput.addEventListener('input', () => updateFoodData(newFoodID, customInputs, amountInput, costInput, calInput));
    customInputs.forEach(input => {
        input.addEventListener('input', () => updateFoodData(newFoodID, customInputs, amountInput, costInput, calInput));
    });
    costInput.addEventListener('input', () => updateFoodData(newFoodID, customInputs, amountInput, costInput, calInput));
}

function updateFoodData(foodID, customInputs, amountInput, costInput, calInput) {
    const amount = parseFloat(amountInput.value) || 0;
    const cost = parseFloat(costInput.value) || 0;
    const calories = parseFloat(calInput.value) || 0;

    const nutritionValues = customInputs.map(input => parseFloat(input.value) || 0);

    const tableRow = document.getElementById(`food-row-${foodID}`);
    const rowData = [
        tableRow.children[0].innerText,
        `${calories.toFixed(0)} kCal`,
        `${amount.toFixed(2)} g`,
        `${nutritionValues[0].toFixed(2)} g`,
        `${nutritionValues[1].toFixed(2)} g`,
        `${nutritionValues[2].toFixed(2)} g`,
        `${nutritionValues[3].toFixed(2)} kJ`,
        `${nutritionValues[4].toFixed(2)} g`,
        `${nutritionValues[5].toFixed(2)} g`,
        `${cost.toFixed(2)}`
    ];

    rowData.forEach((data, index) => {
        tableRow.children[index].innerText = data;
    });

    calculateTotal();
}