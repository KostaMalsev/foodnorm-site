<script>
// Use the household entered on the existing site and fill its result labels.
function renderResults() {
  let people;
  try {
    people = JSON.parse(localStorage.getItem('people'));
    if (!Array.isArray(people) || people.length === 0) throw new Error('Missing household');
    people = people.map(person => {
      if (person.age === null || person.age === undefined || String(person.age).trim() === '') throw new Error('Missing age');
      const age = Number(person.age);
      if (!Number.isInteger(age) || age < 0 || !['male', 'female'].includes(person.sex)) throw new Error('Invalid household member');
      return {age, sex:person.sex};
    });
  } catch (error) {
    // Match the original site's flow: collect the household before showing results.
    window.location.href = '/';
    return;
  }
  const results = getResults(people);
  const walker = document.createTreeWalker(document.body, 4); // SHOW_TEXT
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement.closest('script, style, noscript, textarea')) continue;
    node.nodeValue = node.nodeValue
      .replace(/תקציב\s+מינימלי\s+למזון/g, 'תקציב מינימלי לבטחון תזונתי')
      .replace(/סל\s+נמוך/g, 'סף נמוך (מינימום השרדותי)')
      .replace(/סל\s+גבוה/g, 'סף גבוה (מינימום מחיה בכבוד)');
    node.nodeValue = node.nodeValue.replace(/\[(foodNormActive|foodNormSed|basketsActive|basketsSed|lowActive|lowSed|highActive|highSed)\]/g, (match, key) => {
      return Math.round(results[key]).toLocaleString('en-US') + (key.startsWith('baskets') ? '' : ' ₪');
    });
  }
}

function getResults(people) {
  
  // find sum
  
  let sumActive = 0;
  let sumSed = 0;
  
  people.forEach(person => {
    
    if (person.age < 2) return;
    
    
    let ageGroups = monthlyCalorieIntake[person.sex];
    
    if (person.age <= monthlyCalorieIntake.child[0].age.max) {
      
      // children's sex does not affect their intake
      ageGroups = monthlyCalorieIntake.child;
      
    }
    
    
    let intake;
    
    for (let i = 0; i < ageGroups.length; i++) {
      
      // find the person's age group
      
      const ageGroup = ageGroups[i];
      
      let inAgeGroup = true;
      
      if ('min' in ageGroup.age) {
        
        if (ageGroup.age.min > person.age) {
          
          inAgeGroup = false;
          
        }
        
      }
      
      if ('max' in ageGroup.age) {
        
        if (ageGroup.age.max < person.age) {
          
          inAgeGroup = false;
          
        }
        
      }
      
      
      if (inAgeGroup) {
        
        intake = ageGroup.intake;
        
        break;
        
      }
      
    }
    
    
    sumActive += intake.active;
    sumSed += intake.sed;
    
  });
  
  
  const basketsActive = sumActive / caloriesPerBasket;
  const basketsSed = sumSed / caloriesPerBasket;
  
  const foodNormActive = basketsActive * minBasketPrice;
  const foodNormSed = basketsSed * minBasketPrice;
  
  
  return {
    foodNormActive,
    foodNormSed,
    basketsActive,
    basketsSed,
    ...getHouseholdThresholds(people, foodNormActive, foodNormSed)
  };
  
}



// Coefficients from KostaMalsev/economic_food run.py.
// Order: intercept, then min1 (male), min2 (female) for each age group.
// Regression age groups differ from the calorie-intake groups below.
const regressionAgeMaxima = [4, 9, 14, 17, 29, 49, Infinity];
const regressionWeights = {
  "active_zl_weights": [
    176.48275757,
    95.915244586,
    384.57825373,
    250.5918009,
    164.28296148,
    128.3428789,
    208.2338264,
    -3.135189142,
    290.79415036,
    56.66946114,
    285.05400747,
    152.25575431,
    775.23610083,
    41.297710151,
    616.66319822
  ],
  "active_zu_weights": [
    3097.0054841,
    1778.3197479,
    2605.5969925,
    3687.3931666,
    2312.422585,
    3060.8969612,
    2898.5661122,
    2341.0918063,
    4416.1657006,
    3508.5692799,
    4451.6304668,
    4202.0822921,
    5705.0959602,
    5361.6220116,
    4707.0973191
  ],
  "sedentary_zl_weights": [
    5.684342e-13,
    0,
    -124,
    -68.5,
    1342,
    0,
    0,
    283,
    979,
    -4.583e-13,
    206,
    124,
    0,
    0,
    0
  ],
  "sedentary_zu_weights": [
    3467.7127111,
    2060.1814015,
    2533.9932615,
    3205.0854474,
    1343.1611015,
    182.14885774,
    2834.3453616,
    5978.3193323,
    1850.2039152,
    2984.0997578,
    1980.4124585,
    4274.668595,
    6407.2484325,
    5433.0485529,
    3862.4569651
  ]
};

function getHouseholdThresholds(people, foodNormActive, foodNormSed) {
  const counts = Array(14).fill(0);
  people.forEach(({age, sex}) => {
    const numericAge = Number(age);
    if (!Number.isInteger(numericAge) || numericAge < 0 ||
        (sex !== 'male' && sex !== 'female')) {
      throw new Error('Household members need a non-negative integer age and male/female sex.');
    }
    const group = regressionAgeMaxima.findIndex(max => numericAge <= max);
    counts[group * 2 + (sex === 'female' ? 1 : 0)] += 1;
  });

  // Add the intercept once per household, not once per person.
  const predict = weights => counts.reduce(
    (total, count, index) => total + count * weights[index + 1], weights[0]
  );
  return {
    // Both lower regressions predict food spending, which must be converted to ZL.
    lowActive: 2 * foodNormActive - predict(regressionWeights.active_zl_weights),
    lowSed: 2 * foodNormSed - predict(regressionWeights.sedentary_zl_weights),
    highActive: predict(regressionWeights.active_zu_weights),
    highSed: predict(regressionWeights.sedentary_zu_weights)
  };
}

// monthlyCalorieIntakes (FDA data)
const monthlyCalorieIntake = {"child":[{"age":{"min":2,"max":3},"intake":{"sed":30417,"active":42583}}],"female":[{"age":{"min":4,"max":8},"intake":{"sed":36500,"active":54750}},{"age":{"min":9,"max":13},"intake":{"sed":48667,"active":66917}},{"age":{"min":14,"max":18},"intake":{"sed":54750,"active":73000}},{"age":{"min":19,"max":30},"intake":{"sed":60833,"active":73000}},{"age":{"min":31,"max":50},"intake":{"sed":54750,"active":66917}},{"age":{"min":51},"intake":{"sed":48667,"active":66917}}],"male":[{"age":{"min":4,"max":8},"intake":{"sed":42583,"active":60833}},{"age":{"min":9,"max":13},"intake":{"sed":54750,"active":79083}},{"age":{"min":14,"max":18},"intake":{"sed":66917,"active":97333}},{"age":{"min":19,"max":30},"intake":{"sed":73000,"active":91250}},{"age":{"min":31,"max":50},"intake":{"sed":73000,"active":91250}},{"age":{"min":51},"intake":{"sed":66917,"active":85167}}]};

const caloriesPerBasket = 53096.57;

const minBasketPrice = 692;



function roundTwoDecimals(num) {
  
  return (Math.round((num + Number.EPSILON) * 100) / 100);
  
}



if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderResults);
  else renderResults();
}
</script>
