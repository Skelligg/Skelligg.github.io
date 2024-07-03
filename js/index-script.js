
const app_id = "e0854d27";
const app_key = "ecc8bdb05ddbd3dbe828f0ee73c8c791"

const addedFoodsDiv = document.querySelector(".added-foods")
let addedFoods = [];
let addedFoodID = 0;

const delay = ms => new Promise(res => setTimeout(res, ms));

getFoodsFromLocalStorage();

async function getFoodsFromLocalStorage(){
    let order = [];
    let keys = [];

    for(let i = 0; i < localStorage.length; i++){
        order[i] = localStorage.getItem(localStorage.key(i));
        keys[i] = localStorage.key(i);
    }

    for(let i = 0; i < order.length; i++){
        let index = Number(order[i].slice(-1));
        let value = order[i].slice(0,-1)

        let id = Number(keys[i].slice(-1))
        if( id > addedFoodID){
            addedFoodID = id
        }
        fetchSearchResults(value, index, "stored")
        await delay(500);
    }
}

let result = [];
let data;
let nutrientData;

let buttons = document.querySelectorAll(".close")
let wrappers = document.querySelectorAll(".wrapper")
const search = document.querySelector(".search-bar")
const resultBox = document.querySelector(".result-box")

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
}


function removeWrapper(e){
    let targetWrapperID = e.target.getAttribute("for")
    let targetWrapper = document.querySelector(`#${targetWrapperID}`)
    let index = addedFoods.indexOf(targetWrapper)
    addedFoods.splice(index,1);
    targetWrapper.remove();
    localStorage.removeItem(targetWrapperID);
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

async function fetchNutrients(fullName, searchInput, index, lS){
    const nutrientURL = "https://api.edamam.com/api/food-database/v2/nutrients?app_id=e0854d27&app_key=ecc8bdb05ddbd3dbe828f0ee73c8c791";

    const parserURL = `https://api.edamam.com/api/food-database/v2/parser?app_id=${app_id}&app_key=${app_key}&ingr=${fullName}`;
    
    const response = await fetch(parserURL)
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }

    data = await response.json();

    let foodName = data.hints[index].food.label;
    let foodID = data.hints[index].food.foodId;
    let measureURI = data.hints[index].measures[0].uri;

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
                        "foodId": `${foodID}`
                      }
                    ]
                  })
        
        })
        if(!response.ok){
            // add error on screen
            throw new Error('Network response was not ok ' + response.statusText);
        
          }

        nutrientData = await response.json();
        addFood(foodName, searchInput, index, lS);

    }
    catch(error){
        console.log(error)
    }
    
    
}

async function fetchSearchResults(foodItem, index, lS){
    const parserURL = `https://api.edamam.com/api/food-database/v2/parser?app_id=${app_id}&app_key=${app_key}&ingr=${foodItem}`;
    try{
        const response = await fetch(parserURL)

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
          }

        data = await response.json();

        result = [];

        if(foodItem){
            for(let i = 0; i < 10 && i < data.hints.length; i++){
                result[i] = data.hints[i].food.label;
            }
        }
        if(lS){
            fetchNutrients(result[index], foodItem, index, lS)
        }
        else{
            const content = result.map((list) =>{
                return "<li>" + list + "</li>"
            });
        
            resultBox.innerHTML = "<ul>" + content.join('') + "</ul>"
    
            let searchResults = document.querySelectorAll("li");
            for(let i = 0; i < searchResults.length; i++){
                searchResults[i].addEventListener("click",function() { fetchNutrients(search.value, foodItem, i)})
            }
        }    
    }
    catch(error){
        console.error(error)
    }

}

function addFood(name, searchInput, index, lS){

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
        let compareValue = searchInput + index
        for (let i = 0; i < localStorage.length; i++) {
            if(localStorage.getItem(localStorage.key(i)) == compareValue){
                wrapper.id = `${localStorage.key(i)}`;
                newFoodID = `${localStorage.key(i)}`;
            }
        }
    }
    else if(localStorage.getItem(`wrapper-${addedFoodID}`) != null){
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
    pGrams.innerHTML = "<p>g</p>"

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
    const costInput = document.createElement('input');
    costInput.type = 'number';
    costInput.className = 'cost';
    costInput.placeholder = 'cost';
    costInput.min = '0';
    costInput.max = '9999';

    // Append the cost input to the nutrition div
    nutritionDiv.appendChild(costInput);

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
        calculateTotal();
    });

    costInput.addEventListener('input', calculateTotal);

    if(!lS){
        localStorage.setItem(`wrapper-${addedFoodID}`, searchInput + index);
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
                const strongText = p.querySelector('strong').innerText;
                const numericValue = parseFloat(strongText.replace(/[^\d.-]/g, ''));
                return numericValue;
            }
            return 0;
        };

        const caloriesText = wrapper.querySelector('label p').innerText;
        const calories = parseFloat(caloriesText.replace(/[^\d.-]/g, ''));

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
