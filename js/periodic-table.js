// js/periodic-table.js
let periodicTableBooted = false;
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('periodic-table-button');
  const navLeft = document.querySelector('.nav-left');
  if (!btn && navLeft) {
    const periodicTableLi = document.createElement('li');
    const periodicTableButton = document.createElement('button');
    periodicTableButton.id = 'periodic-table-button';
    periodicTableButton.className = 'periodic-table-button';
    periodicTableButton.textContent = 'Periodic Table';
    periodicTableLi.appendChild(periodicTableButton);
    navLeft.appendChild(periodicTableLi);
  }
  const finalBtn = document.getElementById('periodic-table-button');
  if (!finalBtn) return;
  finalBtn.addEventListener('click', () => {
    if (periodicTableBooted) return;
    periodicTableBooted = true;
    bootPeriodicTable();
    openPeriodicTableModal();
  }, { once: true });
});

function bootPeriodicTable() {
  // Create modal elements
  createPeriodicTableModal();
  
  // Initialize periodic table
  initializePeriodicTable();

  // Re-bind open handler for subsequent clicks
  const btn = document.getElementById('periodic-table-button');
  if (btn && !btn.dataset.ptBound) {
    btn.dataset.ptBound = '1';
    btn.addEventListener('click', openPeriodicTableModal);
  }
}

// Element data
const elementData = [
  { number: 1, symbol: 'H', name: 'Hydrogen', category: 'nonmetal', electrons: [1], meltingPoint: 14.01, boilingPoint: 20.28 },
  { number: 2, symbol: 'He', name: 'Helium', category: 'noble-gas', electrons: [2], meltingPoint: 0.95, boilingPoint: 4.22 },
  { number: 3, symbol: 'Li', name: 'Lithium', category: 'alkali-metal', electrons: [2, 1], meltingPoint: 453.65, boilingPoint: 1615 },
  { number: 4, symbol: 'Be', name: 'Beryllium', category: 'alkaline-earth', electrons: [2, 2], meltingPoint: 1560, boilingPoint: 2742 },
  { number: 5, symbol: 'B', name: 'Boron', category: 'metalloid', electrons: [2, 3], meltingPoint: 2349, boilingPoint: 4200 },
  { number: 6, symbol: 'C', name: 'Carbon', category: 'nonmetal', electrons: [2, 4], meltingPoint: 3823, boilingPoint: 4300 },
  { number: 7, symbol: 'N', name: 'Nitrogen', category: 'nonmetal', electrons: [2, 5], meltingPoint: 63.15, boilingPoint: 77.36 },
  { number: 8, symbol: 'O', name: 'Oxygen', category: 'nonmetal', electrons: [2, 6], meltingPoint: 54.36, boilingPoint: 90.20 },
  { number: 9, symbol: 'F', name: 'Fluorine', category: 'nonmetal', electrons: [2, 7], meltingPoint: 53.53, boilingPoint: 85.03 },
  { number: 10, symbol: 'Ne', name: 'Neon', category: 'noble-gas', electrons: [2, 8], meltingPoint: 24.56, boilingPoint: 27.07 },
  { number: 11, symbol: 'Na', name: 'Sodium', category: 'alkali-metal', electrons: [2, 8, 1], meltingPoint: 370.87, boilingPoint: 1156 },
  { number: 12, symbol: 'Mg', name: 'Magnesium', category: 'alkaline-earth', electrons: [2, 8, 2], meltingPoint: 923, boilingPoint: 1363 },
  { number: 13, symbol: 'Al', name: 'Aluminum', category: 'post-transition', electrons: [2, 8, 3], meltingPoint: 933.47, boilingPoint: 2743 },
  { number: 14, symbol: 'Si', name: 'Silicon', category: 'metalloid', electrons: [2, 8, 4], meltingPoint: 1687, boilingPoint: 3538 },
  { number: 15, symbol: 'P', name: 'Phosphorus', category: 'nonmetal', electrons: [2, 8, 5], meltingPoint: 317, boilingPoint: 553 },
  { number: 16, symbol: 'S', name: 'Sulfur', category: 'nonmetal', electrons: [2, 8, 6], meltingPoint: 388.36, boilingPoint: 717.8 },
  { number: 17, symbol: 'Cl', name: 'Chlorine', category: 'nonmetal', electrons: [2, 8, 7], meltingPoint: 172.15, boilingPoint: 239.11 },
  { number: 18, symbol: 'Ar', name: 'Argon', category: 'noble-gas', electrons: [2, 8, 8], meltingPoint: 83.80, boilingPoint: 87.30 },
  { number: 19, symbol: 'K', name: 'Potassium', category: 'alkali-metal', electrons: [2, 8, 8, 1], meltingPoint: 336.7, boilingPoint: 1032 },
  { number: 20, symbol: 'Ca', name: 'Calcium', category: 'alkaline-earth', electrons: [2, 8, 8, 2], meltingPoint: 1115, boilingPoint: 1757 },
  { number: 21, symbol: 'Sc', name: 'Scandium', category: 'transition-metal', electrons: [2, 8, 9, 2], meltingPoint: 1814, boilingPoint: 3109 },
  { number: 22, symbol: 'Ti', name: 'Titanium', category: 'transition-metal', electrons: [2, 8, 10, 2], meltingPoint: 1941, boilingPoint: 3560 },
  { number: 23, symbol: 'V', name: 'Vanadium', category: 'transition-metal', electrons: [2, 8, 11, 2], meltingPoint: 2183, boilingPoint: 3680 },
  { number: 24, symbol: 'Cr', name: 'Chromium', category: 'transition-metal', electrons: [2, 8, 13, 1], meltingPoint: 2180, boilingPoint: 2944 },
  { number: 25, symbol: 'Mn', name: 'Manganese', category: 'transition-metal', electrons: [2, 8, 13, 2], meltingPoint: 1519, boilingPoint: 2334 },
  { number: 26, symbol: 'Fe', name: 'Iron', category: 'transition-metal', electrons: [2, 8, 14, 2], meltingPoint: 1811, boilingPoint: 3134 },
  { number: 27, symbol: 'Co', name: 'Cobalt', category: 'transition-metal', electrons: [2, 8, 15, 2], meltingPoint: 1768, boilingPoint: 3200 },
  { number: 28, symbol: 'Ni', name: 'Nickel', category: 'transition-metal', electrons: [2, 8, 16, 2], meltingPoint: 1728, boilingPoint: 3186 },
  { number: 29, symbol: 'Cu', name: 'Copper', category: 'transition-metal', electrons: [2, 8, 18, 1], meltingPoint: 1357.77, boilingPoint: 2835 },
  { number: 30, symbol: 'Zn', name: 'Zinc', category: 'transition-metal', electrons: [2, 8, 18, 2], meltingPoint: 692.68, boilingPoint: 1180 },
  { number: 31, symbol: 'Ga', name: 'Gallium', category: 'post-transition', electrons: [2, 8, 18, 3], meltingPoint: 302.91, boilingPoint: 2673 },
  { number: 32, symbol: 'Ge', name: 'Germanium', category: 'metalloid', electrons: [2, 8, 18, 4], meltingPoint: 1211.4, boilingPoint: 3106 },
  { number: 33, symbol: 'As', name: 'Arsenic', category: 'metalloid', electrons: [2, 8, 18, 5], meltingPoint: 887, boilingPoint: 887 },
  { number: 34, symbol: 'Se', name: 'Selenium', category: 'nonmetal', electrons: [2, 8, 18, 6], meltingPoint: 494, boilingPoint: 958 },
  { number: 35, symbol: 'Br', name: 'Bromine', category: 'nonmetal', electrons: [2, 8, 18, 7], meltingPoint: 265.8, boilingPoint: 332.0 },
  { number: 36, symbol: 'Kr', name: 'Krypton', category: 'noble-gas', electrons: [2, 8, 18, 8], meltingPoint: 115.79, boilingPoint: 119.93 },
  { number: 37, symbol: 'Rb', name: 'Rubidium', category: 'alkali-metal', electrons: [2, 8, 18, 8, 1], meltingPoint: 312.46, boilingPoint: 961 },
  { number: 38, symbol: 'Sr', name: 'Strontium', category: 'alkaline-earth', electrons: [2, 8, 18, 8, 2], meltingPoint: 1050, boilingPoint: 1655 },
  { number: 39, symbol: 'Y', name: 'Yttrium', category: 'transition-metal', electrons: [2, 8, 18, 9, 2], meltingPoint: 1799, boilingPoint: 3203 },
  { number: 40, symbol: 'Zr', name: 'Zirconium', category: 'transition-metal', electrons: [2, 8, 18, 10, 2], meltingPoint: 2128, boilingPoint: 4682 },
  { number: 41, symbol: 'Nb', name: 'Niobium', category: 'transition-metal', electrons: [2, 8, 18, 12, 1], meltingPoint: 2750, boilingPoint: 5017 },
  { number: 42, symbol: 'Mo', name: 'Molybdenum', category: 'transition-metal', electrons: [2, 8, 18, 13, 1], meltingPoint: 2896, boilingPoint: 4912 },
  { number: 43, symbol: 'Tc', name: 'Technetium', category: 'transition-metal', electrons: [2, 8, 18, 13, 2], meltingPoint: 2430, boilingPoint: 4538 },
  { number: 44, symbol: 'Ru', name: 'Ruthenium', category: 'transition-metal', electrons: [2, 8, 18, 15, 1], meltingPoint: 2607, boilingPoint: 4423 },
  { number: 45, symbol: 'Rh', name: 'Rhodium', category: 'transition-metal', electrons: [2, 8, 18, 16, 1], meltingPoint: 2237, boilingPoint: 3968 },
  { number: 46, symbol: 'Pd', name: 'Palladium', category: 'transition-metal', electrons: [2, 8, 18, 18], meltingPoint: 1828.05, boilingPoint: 3236 },
  { number: 47, symbol: 'Ag', name: 'Silver', category: 'transition-metal', electrons: [2, 8, 18, 18, 1], meltingPoint: 1234.93, boilingPoint: 2435 },
  { number: 48, symbol: 'Cd', name: 'Cadmium', category: 'transition-metal', electrons: [2, 8, 18, 18, 2], meltingPoint: 594.22, boilingPoint: 1040 },
  { number: 49, symbol: 'In', name: 'Indium', category: 'post-transition', electrons: [2, 8, 18, 18, 3], meltingPoint: 429.75, boilingPoint: 2345 },
  { number: 50, symbol: 'Sn', name: 'Tin', category: 'post-transition', electrons: [2, 8, 18, 18, 4], meltingPoint: 505.08, boilingPoint: 2875 },
  { number: 51, symbol: 'Sb', name: 'Antimony', category: 'metalloid', electrons: [2, 8, 18, 18, 5], meltingPoint: 903.78, boilingPoint: 1860 },
  { number: 52, symbol: 'Te', name: 'Tellurium', category: 'metalloid', electrons: [2, 8, 18, 18, 6], meltingPoint: 722.66, boilingPoint: 1261 },
  { number: 53, symbol: 'I', name: 'Iodine', category: 'nonmetal', electrons: [2, 8, 18, 18, 7], meltingPoint: 386.85, boilingPoint: 457.4 },
  { number: 54, symbol: 'Xe', name: 'Xenon', category: 'noble-gas', electrons: [2, 8, 18, 18, 8], meltingPoint: 161.4, boilingPoint: 165.03 },
  { number: 55, symbol: 'Cs', name: 'Cesium', category: 'alkali-metal', electrons: [2, 8, 18, 18, 8, 1], meltingPoint: 301.59, boilingPoint: 944 },
  { number: 56, symbol: 'Ba', name: 'Barium', category: 'alkaline-earth', electrons: [2, 8, 18, 18, 8, 2], meltingPoint: 1000, boilingPoint: 2173 },
  { number: 57, symbol: 'La', name: 'Lanthanum', category: 'lanthanide', electrons: [2, 8, 18, 18, 9, 2], meltingPoint: 1191, boilingPoint: 3737 },
  { number: 58, symbol: 'Ce', name: 'Cerium', category: 'lanthanide', electrons: [2, 8, 18, 19, 9, 2], meltingPoint: 1071, boilingPoint: 3697 },
  { number: 59, symbol: 'Pr', name: 'Praseodymium', category: 'lanthanide', electrons: [2, 8, 18, 21, 8, 2], meltingPoint: 1208, boilingPoint: 3793 },
  { number: 60, symbol: 'Nd', name: 'Neodymium', category: 'lanthanide', electrons: [2, 8, 18, 22, 8, 2], meltingPoint: 1024, boilingPoint: 3347 },
  { number: 61, symbol: 'Pm', name: 'Promethium', category: 'lanthanide', electrons: [2, 8, 18, 23, 8, 2], meltingPoint: 1310, boilingPoint: 3273 },
  { number: 62, symbol: 'Sm', name: 'Samarium', category: 'lanthanide', electrons: [2, 8, 18, 24, 8, 2], meltingPoint: 1345, boilingPoint: 2067 },
  { number: 63, symbol: 'Eu', name: 'Europium', category: 'lanthanide', electrons: [2, 8, 18, 25, 8, 2], meltingPoint: 1099, boilingPoint: 1802 },
  { number: 64, symbol: 'Gd', name: 'Gadolinium', category: 'lanthanide', electrons: [2, 8, 18, 25, 9, 2], meltingPoint: 1585, boilingPoint: 3546 },
  { number: 65, symbol: 'Tb', name: 'Terbium', category: 'lanthanide', electrons: [2, 8, 18, 27, 8, 2], meltingPoint: 1629, boilingPoint: 3503 },
  { number: 66, symbol: 'Dy', name: 'Dysprosium', category: 'lanthanide', electrons: [2, 8, 18, 28, 8, 2], meltingPoint: 1680, boilingPoint: 2840 },
  { number: 67, symbol: 'Ho', name: 'Holmium', category: 'lanthanide', electrons: [2, 8, 18, 29, 8, 2], meltingPoint: 1747, boilingPoint: 2993 },
  { number: 68, symbol: 'Er', name: 'Erbium', category: 'lanthanide', electrons: [2, 8, 18, 30, 8, 2], meltingPoint: 1802, boilingPoint: 3141 },
  { number: 69, symbol: 'Tm', name: 'Thulium', category: 'lanthanide', electrons: [2, 8, 18, 31, 8, 2], meltingPoint: 1818, boilingPoint: 2223 },
  { number: 70, symbol: 'Yb', name: 'Ytterbium', category: 'lanthanide', electrons: [2, 8, 18, 32, 8, 2], meltingPoint: 1097, boilingPoint: 1469 },
  { number: 71, symbol: 'Lu', name: 'Lutetium', category: 'lanthanide', electrons: [2, 8, 18, 32, 9, 2], meltingPoint: 1925, boilingPoint: 3675 },
  { number: 72, symbol: 'Hf', name: 'Hafnium', category: 'transition-metal', electrons: [2, 8, 18, 32, 10, 2], meltingPoint: 2506, boilingPoint: 4876 },
  { number: 73, symbol: 'Ta', name: 'Tantalum', category: 'transition-metal', electrons: [2, 8, 18, 32, 11, 2], meltingPoint: 3290, boilingPoint: 5731 },
  { number: 74, symbol: 'W', name: 'Tungsten', category: 'transition-metal', electrons: [2, 8, 18, 32, 12, 2], meltingPoint: 3695, boilingPoint: 5828 },
  { number: 75, symbol: 'Re', name: 'Rhenium', category: 'transition-metal', electrons: [2, 8, 18, 32, 13, 2], meltingPoint: 3459, boilingPoint: 5869 },
  { number: 76, symbol: 'Os', name: 'Osmium', category: 'transition-metal', electrons: [2, 8, 18, 32, 14, 2], meltingPoint: 3306, boilingPoint: 5285 },
  { number: 77, symbol: 'Ir', name: 'Iridium', category: 'transition-metal', electrons: [2, 8, 18, 32, 15, 2], meltingPoint: 2719, boilingPoint: 4701 },
  { number: 78, symbol: 'Pt', name: 'Platinum', category: 'transition-metal', electrons: [2, 8, 18, 32, 17, 1], meltingPoint: 2041.55, boilingPoint: 4098 },
  { number: 79, symbol: 'Au', name: 'Gold', category: 'transition-metal', electrons: [2, 8, 18, 32, 18, 1], meltingPoint: 1337.33, boilingPoint: 3129 },
  { number: 80, symbol: 'Hg', name: 'Mercury', category: 'transition-metal', electrons: [2, 8, 18, 32, 18, 2], meltingPoint: 234.32, boilingPoint: 629.88 },
  { number: 81, symbol: 'Tl', name: 'Thallium', category: 'post-transition', electrons: [2, 8, 18, 32, 18, 3], meltingPoint: 577, boilingPoint: 1746 },
  { number: 82, symbol: 'Pb', name: 'Lead', category: 'post-transition', electrons: [2, 8, 18, 32, 18, 4], meltingPoint: 600.61, boilingPoint: 2022 },
  { number: 83, symbol: 'Bi', name: 'Bismuth', category: 'post-transition', electrons: [2, 8, 18, 32, 18, 5], meltingPoint: 544.7, boilingPoint: 1837 },
  { number: 84, symbol: 'Po', name: 'Polonium', category: 'post-transition', electrons: [2, 8, 18, 32, 18, 6], meltingPoint: 527, boilingPoint: 1235 },
  { number: 85, symbol: 'At', name: 'Astatine', category: 'metalloid', electrons: [2, 8, 18, 32, 18, 7], meltingPoint: 575, boilingPoint: 610 },
  { number: 86, symbol: 'Rn', name: 'Radon', category: 'noble-gas', electrons: [2, 8, 18, 32, 18, 8], meltingPoint: 202, boilingPoint: 211.45 },
  { number: 87, symbol: 'Fr', name: 'Francium', category: 'alkali-metal', electrons: [2, 8, 18, 32, 18, 8, 1], meltingPoint: 300, boilingPoint: 950 },
  { number: 88, symbol: 'Ra', name: 'Radium', category: 'alkaline-earth', electrons: [2, 8, 18, 32, 18, 8, 2], meltingPoint: 973, boilingPoint: 1413 },
  { number: 89, symbol: 'Ac', name: 'Actinium', category: 'actinide', electrons: [2, 8, 18, 32, 18, 9, 2], meltingPoint: 1324, boilingPoint: 3471 },
  { number: 90, symbol: 'Th', name: 'Thorium', category: 'actinide', electrons: [2, 8, 18, 32, 18, 10, 2], meltingPoint: 2023, boilingPoint: 5061 },
  { number: 91, symbol: 'Pa', name: 'Protactinium', category: 'actinide', electrons: [2, 8, 18, 32, 20, 9, 2], meltingPoint: 1841, boilingPoint: 4300 },
  { number: 92, symbol: 'U', name: 'Uranium', category: 'actinide', electrons: [2, 8, 18, 32, 21, 9, 2], meltingPoint: 1405.3, boilingPoint: 4404 },
  { number: 93, symbol: 'Np', name: 'Neptunium', category: 'actinide', electrons: [2, 8, 18, 32, 22, 9, 2] },
  { number: 94, symbol: 'Pu', name: 'Plutonium', category: 'actinide', electrons: [2, 8, 18, 32, 24, 8, 2] },
  { number: 95, symbol: 'Am', name: 'Americium', category: 'actinide', electrons: [2, 8, 18, 32, 25, 8, 2] },
  { number: 96, symbol: 'Cm', name: 'Curium', category: 'actinide', electrons: [2, 8, 18, 32, 25, 9, 2] },
  { number: 97, symbol: 'Bk', name: 'Berkelium', category: 'actinide', electrons: [2, 8, 18, 32, 27, 8, 2] },
  { number: 98, symbol: 'Cf', name: 'Californium', category: 'actinide', electrons: [2, 8, 18, 32, 28, 8, 2] },
  { number: 99, symbol: 'Es', name: 'Einsteinium', category: 'actinide', electrons: [2, 8, 18, 32, 29, 8, 2] },
  { number: 100, symbol: 'Fm', name: 'Fermium', category: 'actinide', electrons: [2, 8, 18, 32, 30, 8, 2] },
  { number: 101, symbol: 'Md', name: 'Mendelevium', category: 'actinide', electrons: [2, 8, 18, 32, 31, 8, 2] },
  { number: 102, symbol: 'No', name: 'Nobelium', category: 'actinide', electrons: [2, 8, 18, 32, 32, 8, 2] },
  { number: 103, symbol: 'Lr', name: 'Lawrencium', category: 'actinide', electrons: [2, 8, 18, 32, 32, 9, 2] },
  { number: 104, symbol: 'Rf', name: 'Rutherfordium', category: 'transition-metal', electrons: [2, 8, 18, 32, 32, 10, 2] },
  { number: 105, symbol: 'Db', name: 'Dubnium', category: 'transition-metal', electrons: [2, 8, 18, 32, 32, 11, 2] },
  { number: 106, symbol: 'Sg', name: 'Seaborgium', category: 'transition-metal', electrons: [2, 8, 18, 32, 32, 12, 2] },
  { number: 107, symbol: 'Bh', name: 'Bohrium', category: 'transition-metal', electrons: [2, 8, 18, 32, 32, 13, 2] },
  { number: 108, symbol: 'Hs', name: 'Hassium', category: 'transition-metal', electrons: [2, 8, 18, 32, 32, 14, 2] },
  { number: 109, symbol: 'Mt', name: 'Meitnerium', category: 'unknown', electrons: [2, 8, 18, 32, 32, 15, 2] },
  { number: 110, symbol: 'Ds', name: 'Darmstadtium', category: 'unknown', electrons: [2, 8, 18, 32, 32, 17, 1] },
  { number: 111, symbol: 'Rg', name: 'Roentgenium', category: 'unknown', electrons: [2, 8, 18, 32, 32, 18, 1] },
  { number: 112, symbol: 'Cn', name: 'Copernicium', category: 'unknown', electrons: [2, 8, 18, 32, 32, 18, 2] },
  { number: 113, symbol: 'Nh', name: 'Nihonium', category: 'unknown', electrons: [2, 8, 18, 32, 32, 18, 3] },
  { number: 114, symbol: 'Fl', name: 'Flerovium', category: 'unknown', electrons: [2, 8, 18, 32, 32, 18, 4] },
  { number: 115, symbol: 'Mc', name: 'Moscovium', category: 'unknown', electrons: [2, 8, 18, 32, 32, 18, 5] },
  { number: 116, symbol: 'Lv', name: 'Livermorium', category: 'unknown', electrons: [2, 8, 18, 32, 32, 18, 6] },
  { number: 117, symbol: 'Ts', name: 'Tennessine', category: 'unknown', electrons: [2, 8, 18, 32, 32, 18, 7] },
  { number: 118, symbol: 'Og', name: 'Oganesson', category: 'unknown', electrons: [2, 8, 18, 32, 32, 18, 8] }
];

// Category labels for the legend
const categories = [
  { name: 'Alkali Metals', class: 'alkali-metal' },
  { name: 'Alkaline Earth Metals', class: 'alkaline-earth' },
  { name: 'Transition Metals', class: 'transition-metal' },
  { name: 'Post-transition Metals', class: 'post-transition' },
  { name: 'Metalloids', class: 'metalloid' },
  { name: 'Nonmetals', class: 'nonmetal' },
  { name: 'Noble Gases', class: 'noble-gas' },
  { name: 'Lanthanides', class: 'lanthanide' },
  { name: 'Actinides', class: 'actinide' },
  { name: 'Unknown Properties', class: 'unknown' }
];

// Create the periodic table modal in the DOM
function createPeriodicTableModal() {
  const body = document.querySelector('body');
  
  // Create the modal container
  const modalElement = document.createElement('div');
  modalElement.className = 'periodic-table-modal';
  modalElement.id = 'periodic-table-modal';
  
  // Create the content container
  const modalContent = document.createElement('div');
  modalContent.className = 'periodic-table-container';
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.className = 'modal-close-button';
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', closePeriodicTableModal);
  modalContent.appendChild(closeButton);
  
  // Add title
  const title = document.createElement('h2');
  title.textContent = 'Periodic Table';
  modalContent.appendChild(title);
  
  // Add legend for element categories
  const legend = document.createElement('div');
  legend.className = 'legend';
  
  categories.forEach(category => {
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    
    const colorBox = document.createElement('div');
    colorBox.className = `legend-color ${category.class}`;
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = category.name;
    
    legendItem.appendChild(colorBox);
    legendItem.appendChild(nameSpan);
    legend.appendChild(legendItem);
    
    // Add click event listener to make elements of this category glow
    legendItem.addEventListener('click', () => {
      highlightElementsByCategory(category.class);
    });
  });
  
  modalContent.appendChild(legend);
  
  // Create periodic table grid container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'periodic-table';
  tableContainer.id = 'periodic-table-grid';
  modalContent.appendChild(tableContainer);
  
  // Add atom modal
  const atomModal = document.createElement('div');
  atomModal.className = 'atom-modal';
  atomModal.id = 'atom-modal';
  
  const atomCloseButton = document.createElement('button');
  atomCloseButton.className = 'atom-close-button';
  atomCloseButton.innerHTML = '&times;';
  atomCloseButton.addEventListener('click', closeAtomModal);
  atomModal.appendChild(atomCloseButton);
  
  const atomContainer = document.createElement('div');
  atomContainer.className = 'atom-container';
  atomContainer.id = 'atom-container';
  atomModal.appendChild(atomContainer);
  
  const atomInfo = document.createElement('div');
  atomInfo.className = 'atom-info';
  atomInfo.id = 'atom-info';
  atomModal.appendChild(atomInfo);
  
  // Append all elements to the DOM
  modalContent.appendChild(atomModal);
  modalElement.appendChild(modalContent);
  body.appendChild(modalElement);
}

// Initialize the periodic table with elements
function initializePeriodicTable() {
  const tableContainer = document.getElementById('periodic-table-grid');
  if (!tableContainer) return;
  
  // Clear previous content
  tableContainer.innerHTML = '';
  
  // Define periodic table layout
  const layout = [
    // Row 1
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    // Row 2
    [3, 4, 'temp-control', 'temp-control', 'temp-control', 'temp-control', 'temp-control', 'temp-control', 'temp-control', 'temp-control', 'temp-control', 'temp-control', 5, 6, 7, 8, 9, 10],
    // Row 3
    [11, 12, 'temp-control', 'temp-control', 'temp-control', 'temp-control', 'temp-control', 'temp-control', 'temp-control', 'temp-control', 'temp-control', 'temp-control', 13, 14, 15, 16, 17, 18],
    // Row 4
    [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    // Row 5
    [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54],
    // Row 6
    [55, 56, 'La', 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86],
    // Row 7
    [87, 88, 'Ac', 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118],
    // Separator for Lanthanides and Actinides
    ['lanthanide-row'],
    // Lanthanide row
    [0, 0, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 0],
    // Actinide row
    [0, 0, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 0]
  ];
  
  // Flag to create temperature control only once
  let tempControlCreated = false;
  
  // Generate elements based on layout
  layout.forEach((row, rowIndex) => {
    row.forEach((item, colIndex) => {
      const cell = document.createElement('div');
      
      if (item === 0) {
        // Empty cell
        cell.className = 'placeholder';
        tableContainer.appendChild(cell);
      } else if (item === 'lanthanide-row' || item === 'actinide-row') {
        // Row separator for lanthanides/actinides
        cell.className = item;
        tableContainer.appendChild(cell);
      } else if (item === 'temp-control') {
        // Temperature control area
        if (!tempControlCreated && rowIndex === 1 && colIndex === 2) {
          // Create the temperature control panel
          cell.className = 'temperature-control-cell';
          
          // Create temperature control panel only on the first temp-control cell
          const temperatureControl = document.createElement('div');
          temperatureControl.className = 'temperature-control';
          
          // Create a temperature toggle using the calculator's RAD/DEG style
          const temperatureToggle = document.createElement('div');
          temperatureToggle.className = 'temperature-toggle';
          
          // Container for the angle mode buttons (similar to calculator's angle-mode-toggle)
          const angleToggleContainer = document.createElement('div');
          angleToggleContainer.className = 'temp-mode-toggle';
          
          // Create OFF button
          const offButton = document.createElement('button');
          offButton.className = 'temp-mode-btn active';
          offButton.setAttribute('data-mode', 'off');
          offButton.textContent = 'OFF';
          
          // Create ON button
          const onButton = document.createElement('button');
          onButton.className = 'temp-mode-btn';
          onButton.setAttribute('data-mode', 'on');
          onButton.textContent = 'ON';
          
          // Add buttons to the toggle container
          angleToggleContainer.appendChild(offButton);
          angleToggleContainer.appendChild(onButton);
          temperatureToggle.appendChild(angleToggleContainer);
          
          // Create a container for the toggle and value to be side by side
          const temperatureHeader = document.createElement('div');
          temperatureHeader.className = 'temperature-header';
          temperatureHeader.appendChild(temperatureToggle);
          
          // Temperature slider container - always present but initially hidden
          const sliderContainer = document.createElement('div');
          sliderContainer.className = 'temperature-slider-container';
          
          const temperatureValue = document.createElement('div');
          temperatureValue.className = 'temperature-value disabled';
          temperatureValue.textContent = '300 K';
          temperatureValue.id = 'temperature-value';
          
          // Add the value to the header instead of the slider container
          const temperatureValueContainer = document.createElement('div');
          temperatureValueContainer.className = 'temperature-value-container';
          
          temperatureValueContainer.appendChild(temperatureValue);
          temperatureHeader.appendChild(temperatureValueContainer);
          temperatureControl.appendChild(temperatureHeader);
          
          const temperatureSlider = document.createElement('input');
          temperatureSlider.type = 'range';
          temperatureSlider.min = '0';
          temperatureSlider.max = '6000';
          temperatureSlider.step = '10';
          temperatureSlider.value = '300';
          temperatureSlider.className = 'temperature-slider';
          temperatureSlider.id = 'temperature-slider';
          sliderContainer.appendChild(temperatureSlider);
          
          // Compact phase legend
          const phaseLegend = document.createElement('div');
          phaseLegend.className = 'phase-legend';
          
          const phases = [
            { name: 'Solid', class: 'solid' },
            { name: 'Liquid', class: 'liquid' },
            { name: 'Gas', class: 'gas' },
            { name: 'Unknown', class: 'unknown-phase' }
          ];
          
          phases.forEach(phase => {
            const phaseItem = document.createElement('div');
            phaseItem.className = 'phase-legend-item';
            
            const phaseIndicator = document.createElement('div');
            phaseIndicator.className = `phase-indicator ${phase.class}`;
            
            const phaseName = document.createElement('span');
            phaseName.textContent = phase.name;
            phaseName.style.color = 'white';
            
            phaseItem.appendChild(phaseIndicator);
            phaseItem.appendChild(phaseName);
            phaseLegend.appendChild(phaseItem);
          });
          
          sliderContainer.appendChild(phaseLegend);
          temperatureControl.appendChild(sliderContainer);
          
          // Show slider container by default, but disable it initially
          sliderContainer.style.display = 'flex';
          sliderContainer.classList.add('disabled');
          temperatureSlider.disabled = true;
          
          // Add event listeners for toggle buttons
          const tempModeButtons = [offButton, onButton];
          tempModeButtons.forEach(button => {
            button.addEventListener('click', function() {
              // Remove active class from all buttons
              tempModeButtons.forEach(btn => btn.classList.remove('active'));
              
              // Add active class to clicked button
              this.classList.add('active');
              
              // Get all legend items
              const legendItems = document.querySelectorAll('.legend-item');
              
              // Enable or disable temperature slider based on mode
              if (this.getAttribute('data-mode') === 'on') {
                sliderContainer.classList.remove('disabled');
                temperatureSlider.disabled = false;
                temperatureValue.classList.remove('disabled');
                updateElementPhases(temperatureSlider.value);
                
                // Disable legend items
                legendItems.forEach(item => {
                  item.classList.add('disabled');
                });
              } else {
                sliderContainer.classList.add('disabled');
                temperatureSlider.disabled = true;
                temperatureValue.classList.add('disabled');
                resetElementCategories();
                
                // Enable legend items
                legendItems.forEach(item => {
                  item.classList.remove('disabled');
                });
              }
            });
          });
          
          temperatureSlider.addEventListener('input', function() {
            temperatureValue.textContent = `${this.value} K`;
            updateElementPhases(this.value);
          });
          
          cell.appendChild(temperatureControl);
          tableContainer.appendChild(cell);
          tempControlCreated = true;
        } else if (!tempControlCreated) {
          // Empty placeholder for other cells in temperature control area
          cell.className = 'placeholder';
          tableContainer.appendChild(cell);
        }
      } else if (item === 'La' || item === 'Ac') {
        // Special cells for lanthanide/actinide indicators
        const element = elementData.find(el => el.symbol === item);
        cell.className = `element ${element.category}`;
        cell.innerHTML = `
          <span class="atomic-number">${element.number}</span>
          <p class="symbol">${element.symbol}</p>
          <span class="name">${element.name}</span>
        `;
        cell.addEventListener('click', () => showAtomVisualization(element));
        tableContainer.appendChild(cell);
      } else {
        // Regular element
        const element = elementData.find(el => el.number === item);
        if (element) {
          cell.className = `element ${element.category}`;
          cell.innerHTML = `
            <span class="atomic-number">${element.number}</span>
            <p class="symbol">${element.symbol}</p>
            <span class="name">${element.name}</span>
          `;
          cell.addEventListener('click', () => showAtomVisualization(element));
          tableContainer.appendChild(cell);
        }
      }
    });
  });
}

// Show/hide modal functions
function openPeriodicTableModal() {
  const modal = document.getElementById('periodic-table-modal');
  const periodicTableButton = document.getElementById('periodic-table-button');
  
  if (modal && periodicTableButton) {
    // Remove any closing animation class first
    modal.classList.remove('closing');
    
    // Get button position relative to the viewport
    const buttonRect = periodicTableButton.getBoundingClientRect();
    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top + buttonRect.height / 2;
    
    // Set transform origin for the modal based on button position
    modal.style.transformOrigin = `${buttonCenterX}px ${buttonCenterY}px`;
    
    // Find the periodic table container and set its transform origin
    const periodicTableContainer = modal.querySelector('.periodic-table-container');
    if (periodicTableContainer) {
      // Calculate the position relative to the content
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Convert button position to percentage of viewport
      const originX = (buttonCenterX / viewportWidth) * 100;
      const originY = (buttonCenterY / viewportHeight) * 100;
      
      periodicTableContainer.style.transformOrigin = `${originX}% ${originY}%`;
    }
    
    // Add visible class to show the modal
    modal.classList.add('visible');
    
    // Add event listener to close the modal when clicking outside
    modal.addEventListener('click', function(event) {
      // Check if the click was directly on the modal background (not on its children)
      if (event.target === modal) {
        closePeriodicTableModal();
      }
    });
  }
}

function closePeriodicTableModal() {
  const modal = document.getElementById('periodic-table-modal');
  const periodicTableButton = document.getElementById('periodic-table-button');
  
  if (modal) {
    // Add closing class for animation
    modal.classList.add('closing');
    
    // Get button position for closing animation
    if (periodicTableButton) {
      const buttonRect = periodicTableButton.getBoundingClientRect();
      const buttonCenterX = buttonRect.left + buttonRect.width / 2;
      const buttonCenterY = buttonRect.top + buttonRect.height / 2;
      
      // Set transform origin for the modal based on button position
      modal.style.transformOrigin = `${buttonCenterX}px ${buttonCenterY}px`;
      
      // Find the periodic table container and set its transform origin
      const periodicTableContainer = modal.querySelector('.periodic-table-container');
      if (periodicTableContainer) {
        // Calculate the position relative to the content
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Convert button position to percentage of viewport
        const originX = (buttonCenterX / viewportWidth) * 100;
        const originY = (buttonCenterY / viewportHeight) * 100;
        
        periodicTableContainer.style.transformOrigin = `${originX}% ${originY}%`;
      }
    }
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
      modal.classList.remove('visible');
      modal.classList.remove('closing');
      closeAtomModal();
    }, 300); // Match animation duration (0.3s)
  }
}

function closeAtomModal() {
  const atomModal = document.getElementById('atom-modal');
  if (atomModal) {
    if (atomModal._outsideClickHandler) {
      document.removeEventListener('mousedown', atomModal._outsideClickHandler);
      document.removeEventListener('touchstart', atomModal._outsideClickHandler);
      atomModal._outsideClickHandler = null;
    }
    // Add closing animation class
    atomModal.classList.add('closing');
    
    // Stop the animation
    if (window.atomAnimationFrame) {
      cancelAnimationFrame(window.atomAnimationFrame);
      window.atomAnimationFrame = null;
    }
    
    // Wait for animation to complete before removing visible class
    setTimeout(() => {
      atomModal.classList.remove('visible');
      atomModal.classList.remove('closing');
    }, 300); // Match animation duration (0.3s)
  }
}

// Update element phases based on temperature
function updateElementPhases(temperature) {
  const elements = document.querySelectorAll('.element');
  
  elements.forEach(elementDiv => {
    const symbol = elementDiv.querySelector('.symbol').textContent;
    const element = elementData.find(el => el.symbol === symbol);
    
    if (element) {
      // Store original category
      if (!elementDiv.dataset.originalCategory) {
        elementDiv.dataset.originalCategory = element.category;
      }
      
      // Remove all category classes
      elementDiv.className = 'element';
      
      // Determine phase state based on temperature
      if (element.meltingPoint && element.boilingPoint) {
        if (temperature < element.meltingPoint) {
          elementDiv.classList.add('solid');
        } else if (temperature >= element.meltingPoint && temperature < element.boilingPoint) {
          elementDiv.classList.add('liquid');
        } else {
          elementDiv.classList.add('gas');
        }
      } else {
        elementDiv.classList.add('unknown-phase');
      }
    }
  });
}

// Reset element categories to their original values
function resetElementCategories() {
  const elements = document.querySelectorAll('.element');
  
  elements.forEach(elementDiv => {
    // Remove phase classes
    elementDiv.classList.remove('solid', 'liquid', 'gas', 'unknown-phase');
    
    // Restore original category
    if (elementDiv.dataset.originalCategory) {
      elementDiv.classList.add(elementDiv.dataset.originalCategory);
    }
  });
}

// Show atom visualization with temperature phase information if applicable
function showAtomVisualization(element) {
  const atomModal = document.getElementById('atom-modal');
  const atomContainer = document.getElementById('atom-container');
  const atomInfo = document.getElementById('atom-info');
  
  if (!atomModal || !atomContainer || !atomInfo) return;
  
  // Clear previous content
  atomContainer.innerHTML = '';
  atomInfo.innerHTML = '';
  
  // Check if temperature mode is active
  const hasMelting = typeof element.meltingPoint === 'number';
  const hasBoiling = typeof element.boilingPoint === 'number';
  const solidValue = hasMelting ? `Below ${element.meltingPoint} K` : 'Not available';
  const liquidValue = hasMelting && hasBoiling ? `${element.meltingPoint} – ${element.boilingPoint} K` : 'Not available';
  const gasValue = hasBoiling ? `Above ${element.boilingPoint} K` : 'Not available';
  
  // Add element info with icons in a modern layout
  atomInfo.innerHTML = `
    <div class="atom-title">
      <i class="atom-icon fas fa-atom"></i>
      <h3>${element.name} (${element.symbol})</h3>
    </div>
    <div class="atom-info-grid">
      <div class="info-item">
        <div class="info-icon"><i class="fas fa-hashtag"></i></div>
        <div class="info-content">
          <span class="info-label">Atomic Number</span>
          <span class="info-value">${element.number}</span>
        </div>
      </div>
      <div class="info-item">
        <div class="info-icon"><i class="fas fa-icicles"></i></div>
        <div class="info-content">
          <span class="info-label">Solid state</span>
          <span class="info-value">${solidValue}</span>
        </div>
      </div>
      <div class="info-item">
        <div class="info-icon"><i class="fas fa-layer-group"></i></div>
        <div class="info-content">
          <span class="info-label">Category</span>
          <span class="info-value">${formatCategory(element.category)}</span>
        </div>
      </div>
      <div class="info-item">
        <div class="info-icon"><i class="fas fa-water"></i></div>
        <div class="info-content">
          <span class="info-label">Liquid state</span>
          <span class="info-value">${liquidValue}</span>
        </div>
      </div>
      <div class="info-item">
        <div class="info-icon"><i class="fas fa-circle-nodes"></i></div>
        <div class="info-content">
          <span class="info-label">Electron Configuration</span>
          <span class="info-value">${element.electrons.join('-')}</span>
        </div>
      </div>
      <div class="info-item">
        <div class="info-icon"><i class="fas fa-fire"></i></div>
        <div class="info-content">
          <span class="info-label">Gas state</span>
          <span class="info-value">${gasValue}</span>
        </div>
      </div>
    </div>
  `;
  
  // Create nucleus
  const nucleus = document.createElement('div');
  nucleus.className = 'nucleus';
  nucleus.textContent = element.symbol;
  nucleus.style.cursor = 'pointer';
  
  // Add hover events for nucleus tooltip
  nucleus.addEventListener('mouseenter', function(event) {
    // Calculate estimated neutron count (similar to how it's done in showNucleusStructure)
    const protonCount = element.number;
    const neutronCount = element.number === 1 ? 0 : (element.number <= 20 ? Math.round(element.number * 1.2) : Math.round(element.number * 1.5));
    
    showParticleTooltip(event, 'nucleus', 'Nucleus', `${protonCount} protons, ~${neutronCount} neutrons`);
  });
  
  nucleus.addEventListener('mouseleave', function() {
    removeParticleTooltip();
  });
  
  nucleus.addEventListener('mousemove', function(event) {
    updateParticleTooltipPosition(event);
  });
  
  // Add click event to nucleus to show protons and neutrons
  nucleus.addEventListener('click', function() {
    // Immediately disable hover events for electron shells
    const shellElements = atomContainer.querySelectorAll('.electron-shell-with-electrons');
    shellElements.forEach(shell => {
      shell.removeEventListener('mouseenter', handleShellMouseEnter);
      shell.removeEventListener('mouseleave', handleShellMouseLeave);
      shell.removeEventListener('mousemove', handleShellMouseMove);
      shell.style.pointerEvents = 'none';
    });
    
    // Remove any existing tooltip that might be stuck
    const existingTooltip = document.getElementById('orbital-tooltip');
    if (existingTooltip) existingTooltip.remove();
    
    const particleTooltip = document.getElementById('particle-tooltip');
    if (particleTooltip) particleTooltip.remove();
    
    showNucleusStructure(element, atomContainer);
  });
  
  atomContainer.appendChild(nucleus);
  
  // Create electron shells with fixed dots
  const shellRadii = [40, 60, 80, 100, 120, 140, 160];
  const shellNames = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
  
  // Create and store all shells in reverse order (inner shells last)
  const shellsToAdd = [];
  
  element.electrons.forEach((shellElectrons, shellIndex) => {
    if (shellIndex >= shellRadii.length) return; // Skip if too many shells
    
    // Create shell with electrons directly on it
    const shellWithElectrons = document.createElement('div');
    shellWithElectrons.className = 'electron-shell-with-electrons';
    shellWithElectrons.style.width = `${shellRadii[shellIndex] * 2}px`;
    shellWithElectrons.style.height = `${shellRadii[shellIndex] * 2}px`;
    shellWithElectrons.dataset.shellName = shellNames[shellIndex];
    shellWithElectrons.dataset.electrons = shellElectrons;
    
    // Set a higher z-index for inner shells so they're on top for hover events
    shellWithElectrons.style.zIndex = element.electrons.length - shellIndex;
    
    // Add electron dots directly to the shell
    for (let i = 0; i < shellElectrons; i++) {
      const electronDot = document.createElement('div');
      electronDot.className = 'electron-dot';
      
      // Calculate position for electron dot around the shell
      const angle = (i / shellElectrons) * 2 * Math.PI;
      const radius = shellRadii[shellIndex];
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      electronDot.style.left = `${radius + x - 5}px`;
      electronDot.style.top = `${radius + y - 5}px`;
      
      shellWithElectrons.appendChild(electronDot);
    }
    
    // Add mouse events to each shell
    shellWithElectrons.addEventListener('mouseenter', handleShellMouseEnter);
    shellWithElectrons.addEventListener('mouseleave', handleShellMouseLeave);
    shellWithElectrons.addEventListener('mousemove', handleShellMouseMove);
    
    // Add shell to the array (so we can add them in reverse order)
    shellsToAdd.push(shellWithElectrons);
  });
  
  // Add shells to container in reverse order (innermost last so it's on top)
  shellsToAdd.forEach(shell => {
    atomContainer.appendChild(shell);
  });
  
  // Show atom modal
  atomModal.classList.add('visible');

  const outsideClickHandler = function(event) {
    if (event.target.closest('.element')) {
      return;
    }
    if (!atomModal.contains(event.target)) {
      closeAtomModal();
    }
  };
  setTimeout(() => {
    document.addEventListener('mousedown', outsideClickHandler);
    document.addEventListener('touchstart', outsideClickHandler);
  }, 0);
  atomModal._outsideClickHandler = outsideClickHandler;
  
  // Start simple rotation of the shells
  startShellRotation();
}

// Handle mouse enter on shell
function handleShellMouseEnter(e) {
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'orbital-tooltip';
  tooltip.id = 'orbital-tooltip';
  
  // Ensure the electron count is properly formatted
  const shellName = this.dataset.shellName;
  const electronCount = parseInt(this.dataset.electrons, 10);
  
  tooltip.innerHTML = `
    <div class="orbital-name">${shellName} Shell</div>
    <div class="orbital-electrons">${electronCount} electrons</div>
  `;
  document.body.appendChild(tooltip);
  
  // Position tooltip
  updateTooltipPosition(e);
  
  // Highlight shell
  this.classList.add('highlight-shell');
}

// Handle mouse leave on shell
function handleShellMouseLeave() {
  // Remove tooltip
  const tooltip = document.getElementById('orbital-tooltip');
  if (tooltip) tooltip.remove();
  
  // Remove highlight
  this.classList.remove('highlight-shell');
}

// Handle mouse move on shell
function handleShellMouseMove(e) {
  updateTooltipPosition(e);
}

// Simple rotation of the shells (as a whole with their dots)
function startShellRotation() {
  // Cancel any existing animation
  if (window.atomAnimationFrame) {
    cancelAnimationFrame(window.atomAnimationFrame);
    window.atomAnimationFrame = null;
  }
  
  const shells = document.querySelectorAll('.electron-shell-with-electrons');
  let rotationAngles = Array.from(shells).map((_, i) => ({ 
    angle: 0, 
    speed: 0.01 - (0.001 * i) // Outer shells rotate slower
  }));
  
  function rotateShells() {
    shells.forEach((shell, i) => {
      // Update rotation angle
      rotationAngles[i].angle += rotationAngles[i].speed;
      
      // Apply rotation to the entire shell (with its electron dots)
      // Use transform-origin to keep the shell centered and preserve hover areas
      shell.style.transform = `translate(-50%, -50%) rotate(${rotationAngles[i].angle}rad)`;
      shell.style.transformOrigin = 'center center';
    });
    
    // Continue animation
    window.atomAnimationFrame = requestAnimationFrame(rotateShells);
  }
  
  // Start rotation
  window.atomAnimationFrame = requestAnimationFrame(rotateShells);
}

// Update tooltip position
function updateTooltipPosition(e) {
  const tooltip = document.getElementById('orbital-tooltip');
  if (tooltip) {
    const x = e.clientX + 15;
    const y = e.clientY + 15;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  }
}

// Format category for display
function formatCategory(category) {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Function to show nucleus structure (protons and neutrons)
function showNucleusStructure(element, container) {
  // Calculate neutron count (atomic mass - proton count)
  // For simplicity, use rough approximation: atomic mass ~= 2 * atomic number for most elements
  // This is just an approximation, as actual neutron counts vary in the periodic table
  const protonCount = element.number;
  // Special case for hydrogen which has 0 neutrons
  const neutronCount = element.number === 1 ? 0 : (element.number <= 20 ? Math.round(element.number * 1.2) : Math.round(element.number * 1.5));
  
  // Get position of the nucleus for the animation
  const nucleus = container.querySelector('.nucleus');
  if (!nucleus) return;
  
  // Clone the nucleus for the zoom animation
  const nucleusClone = nucleus.cloneNode(true);
  nucleusClone.id = 'nucleus-clone';
  nucleusClone.style.cursor = 'default';
  nucleusClone.style.zIndex = '1000';
  container.appendChild(nucleusClone);
  
  // Hide original nucleus during animation and disable its clickability
  nucleus.style.opacity = '0';
  nucleus.style.pointerEvents = 'none';
  // Additionally, remove any click event listeners
  const newNucleus = nucleus.cloneNode(true);
  nucleus.parentNode.replaceChild(newNucleus, nucleus);
  
  // Store original elements to hide during animation
  const shellsToHide = container.querySelectorAll('.electron-shell-with-electrons');
  
  // Create a zoom out button (add it now but make it invisible until animation completes)
  const zoomOutButton = document.createElement('button');
  zoomOutButton.className = 'nucleus-back-button';
  zoomOutButton.textContent = 'Back to Atom';
  zoomOutButton.style.opacity = '0';
  zoomOutButton.style.pointerEvents = 'auto'; // Make sure the button can receive clicks
  zoomOutButton.style.zIndex = '5000'; // Ensure button is above all other elements
  zoomOutButton.addEventListener('click', function() {
    // Stop animation before going back
    if (window.nucleusAnimationFrame) {
      cancelAnimationFrame(window.nucleusAnimationFrame);
      window.nucleusAnimationFrame = null;
    }
    
    // Get references to elements needed for the reverse animation
    const enlargedNucleus = container.querySelector('.enlarged-nucleus');
    const nucleusLegend = container.querySelector('.nucleus-legend');
    const nuclearParticles = container.querySelectorAll('.nuclear-particle');
    
    // Make the zoom out button invisible immediately
    zoomOutButton.style.opacity = '0';
    nucleusLegend.style.opacity = '0';
    
    // Remove all nuclear particles with a fade-out effect
    nuclearParticles.forEach(particle => {
      particle.style.transition = 'opacity 0.3s ease';
      particle.style.opacity = '0';
    });
    
    // After particles fade out, start the reverse zoom animation
    setTimeout(() => {
      // Remove all particles
      nuclearParticles.forEach(particle => particle.remove());
      
      // Create a new nucleus clone for the reverse animation
      const reverseNucleusClone = document.createElement('div');
      reverseNucleusClone.id = 'nucleus-clone';
      reverseNucleusClone.style.position = 'absolute';
      reverseNucleusClone.style.top = '50%';
      reverseNucleusClone.style.left = '50%';
      reverseNucleusClone.style.width = '40px';
      reverseNucleusClone.style.height = '40px';
      reverseNucleusClone.style.background = '#b700ff';
      reverseNucleusClone.style.borderRadius = '50%';
      reverseNucleusClone.style.zIndex = '1000';
      reverseNucleusClone.style.transform = 'translate(-50%, -50%) scale(6.25)';
      reverseNucleusClone.style.opacity = '0';
      reverseNucleusClone.style.boxShadow = '0 0 30px rgba(171, 45, 255, 0.5)';
      container.appendChild(reverseNucleusClone);
      
      // Reverse animation parameters
      const animationDuration = 1200; // 1.2 seconds
      const startTime = performance.now();
      
      // Start the reverse animation
      function animateReverseZoom(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        // Use easing function for smoother animation (reverse progress)
        const easedProgress = easeInOutCubic(progress);
        const reverseProgress = 1 - easedProgress;
        
        // Animate nucleus clone scaling down and fading in
        const scaleValue = 1 + (5.25 * reverseProgress); // Scale from 6.25x to 1x
        reverseNucleusClone.style.transform = `translate(-50%, -50%) scale(${scaleValue})`;
        reverseNucleusClone.style.opacity = `${easedProgress}`; // Fade in
        
        // Fade out enlarged nucleus gradually
        enlargedNucleus.style.opacity = reverseProgress;
        enlargedNucleus.style.width = `${40 + (210 * reverseProgress)}px`; // 250px to 40px
        enlargedNucleus.style.height = `${40 + (210 * reverseProgress)}px`; // 250px to 40px
        
        // Gradually bring back electron shells
        shellsToHide.forEach(shell => {
          // Only make them visible, don't re-add them yet
          shell.style.opacity = easedProgress;
        });
        
        if (progress < 1) {
          requestAnimationFrame(animateReverseZoom);
        } else {
          // Animation complete
          
          // Remove temporary elements
          reverseNucleusClone.remove();
          enlargedNucleus.remove();
          nucleusLegend.remove();
          zoomOutButton.remove();
          
          // Completely remove the original nucleus to prevent any possible interactions
          const originalNucleus = container.querySelector('.nucleus');
          if (originalNucleus) {
            originalNucleus.remove();
          }
          
          // Recreate the atom visualization after reverse animation completes
          showAtomVisualization(element);
        }
      }
      
      // Start reverse animation
      requestAnimationFrame(animateReverseZoom);
    }, 400);
  });
  container.appendChild(zoomOutButton);
  
  // Create enlarged nucleus container but set it to start small and invisible
  const enlargedNucleus = document.createElement('div');
  enlargedNucleus.className = 'enlarged-nucleus';
  enlargedNucleus.style.width = '40px';
  enlargedNucleus.style.height = '40px';
  enlargedNucleus.style.opacity = '0';
  enlargedNucleus.style.pointerEvents = 'none'; // Prevent it from blocking clicks on the button
  container.appendChild(enlargedNucleus);
  
  // Create a legend div but hide it initially
  const nucleusLegend = document.createElement('div');
  nucleusLegend.className = 'nucleus-legend';
  nucleusLegend.style.opacity = '0';
  nucleusLegend.innerHTML = `
    <div class="nucleus-legend-item">
      <div class="nucleus-legend-circle proton"></div>
      <span>Proton (+)</span>
    </div>
    <div class="nucleus-legend-item">
      <div class="nucleus-legend-circle neutron"></div>
      <span>Neutron (0)</span>
    </div>
  `;
  container.appendChild(nucleusLegend);
  
  // Animation parameters
  const animationDuration = 1200; // 1.2 seconds
  const startTime = performance.now();
  
  // Start the zoom-in animation
  function animateZoom(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / animationDuration, 1);
    
    // Use easing function for smoother animation
    const easedProgress = easeInOutCubic(progress);
    
    // Animate nucleus clone scaling up and fading out completely
    const scaleValue = 1 + (5.25 * easedProgress); // Scale from 1x to 6.25x (40px to 250px)
    nucleusClone.style.transform = `translate(-50%, -50%) scale(${scaleValue})`;
    nucleusClone.style.opacity = `${1 - easedProgress}`; // Fully fade out
    
    // Fade out electron shells gradually
    shellsToHide.forEach(shell => {
      shell.style.opacity = 1 - easedProgress;
    });
    
    // Fade in enlarged nucleus as we go
    enlargedNucleus.style.opacity = easedProgress;
    enlargedNucleus.style.width = `${40 + (210 * easedProgress)}px`; // 40px to 250px
    enlargedNucleus.style.height = `${40 + (210 * easedProgress)}px`; // 40px to 250px
    
    if (progress < 1) {
      requestAnimationFrame(animateZoom);
    } else {
      // Animation complete - finalize transition
      
      // Show the UI elements with a slight delay
      setTimeout(() => {
        zoomOutButton.style.opacity = '1';
        nucleusLegend.style.opacity = '1';
      }, 150);
      
      // Remove the nucleus clone
      nucleusClone.remove();
      
      // Completely remove the original nucleus to prevent any possible interactions
      const originalNucleus = container.querySelector('.nucleus');
      if (originalNucleus) {
        originalNucleus.remove();
      }
      
      // Clear the rest of the container elements
      shellsToHide.forEach(shell => shell.remove());
      
      // Calculate available space for particles
      const containerSize = 300; // The atom container size
      const nucleusSize = 250; // Enlarged nucleus size
      const particleSize = 14; // Size of protons and neutrons - larger size
      
      // Create a mixed array of protons and neutrons
      const particleTypes = [];
      for (let i = 0; i < protonCount; i++) {
        particleTypes.push('proton');
      }
      for (let i = 0; i < neutronCount; i++) {
        particleTypes.push('neutron');
      }
      
      // Shuffle the array to mix protons and neutrons
      for (let i = particleTypes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [particleTypes[i], particleTypes[j]] = [particleTypes[j], particleTypes[i]];
      }
      
      // Store all particle states for animation
      const particles = [];
      
      // Small delay before creating particles
      setTimeout(() => {
        // Create particles in random order
        particleTypes.forEach(type => {
          const particleState = createNuclearParticle(enlargedNucleus, type, particleSize, null, nucleusSize, element.number);
          particles.push(particleState);
        });
        
        // Store particle data globally for potential restart
        window.currentNucleusParticles = particles;
        window.currentNucleusSize = nucleusSize;
        
        // Start the animation of particles
        startNucleusAnimation(particles, nucleusSize);
      }, 200);
    }
  }
  
  // Easing function for smoother animation
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  // Start animation
  requestAnimationFrame(animateZoom);
}

// Function to create a nuclear particle (proton or neutron)
function createNuclearParticle(container, type, size, particlesPerRow, containerSize, atomicNumber = 1) {
  const particle = document.createElement('div');
  particle.className = `nuclear-particle ${type}`;
  
  // Calculate center position
  const centerX = containerSize / 2;
  const centerY = containerSize / 2;
  
  // Calculate the radius based on atomic number - scales from 0.01 for hydrogen to 0.11 for larger elements
  const minRadius = 0.05; // For hydrogen (atomic number 1)
  const maxRadius = 0.11; // For element 118
  const radiusFactor = minRadius + ((maxRadius - minRadius) * (atomicNumber - 1) / 117);
  const particleMaxRadius = containerSize * radiusFactor;
  
  // Use an extremely strong center-biased distribution
  // Get a super-strong center-biased distance with square root for clustering
  const r = Math.random();
  // Use a quartic function (r^4) for even stronger center bias
  const distance = particleMaxRadius * Math.pow(r, 4);
  
  // Random angle for position around center
  const angle = Math.random() * 2 * Math.PI;
  
  // Calculate position with strong center bias
  const x = centerX + Math.cos(angle) * distance;
  const y = centerY + Math.sin(angle) * distance;
  
  // Set size and position - size slightly larger to make them touching
  const actualSize = size * 1.2; // Make particles larger so they touch
  particle.style.width = `${actualSize}px`;
  particle.style.height = `${actualSize}px`;
  particle.style.left = `${x - (actualSize/2)}px`;
  particle.style.top = `${y - (actualSize/2)}px`;
  
  // Add fancy tooltip for particles
  if (type === 'proton') {
    particle.addEventListener('mouseenter', function(event) {
      showParticleTooltip(event, 'proton', 'Proton', 'Positive charge (+)');
    });
    
    particle.addEventListener('mouseleave', function() {
      removeParticleTooltip();
    });
    
    particle.addEventListener('mousemove', function(event) {
      updateParticleTooltipPosition(event);
    });
  } else {
    particle.addEventListener('mouseenter', function(event) {
      showParticleTooltip(event, 'neutron', 'Neutron', 'Neutral charge (0)');
    });
    
    particle.addEventListener('mouseleave', function() {
      removeParticleTooltip();
    });
    
    particle.addEventListener('mousemove', function(event) {
      updateParticleTooltipPosition(event);
    });
  }
  
  // Add a small random z-index to create overlapping effect
  particle.style.zIndex = Math.floor(Math.random() * 5);
  
  // Add click event listener to zoom into quark view
  particle.addEventListener('click', function(event) {
    event.stopPropagation(); // Prevent triggering parent click events
    
    // Get the parent container (atom-container)
    const atomContainer = container.closest('.atom-container');
    if (atomContainer) {
      // Pass the clicked particle itself and the container
      showQuarkStructure(type, atomContainer, event.currentTarget);
    } else {
      console.error('Could not find atom-container for particle click');
    }
  });
  
  // Start with opacity 0 for fade-in effect
  particle.style.opacity = '0';
  
  container.appendChild(particle);
  
  // Return particle state for animation
  return {
    element: particle,
    type: type,
    x: x,
    y: y,
    baseX: x,
    baseY: y,
    size: actualSize,
    angle: Math.random() * Math.PI * 2, // Random direction for movement
    speed: 0.2 + Math.random() * 0.3,   // Random base speed
    phaseOffset: Math.random() * Math.PI * 2 // Random phase offset for jitter
  };
}

// Function to animate nuclear particles
function startNucleusAnimation(particles, containerSize) {
  // Cancel any existing animation
  if (window.nucleusAnimationFrame) {
    cancelAnimationFrame(window.nucleusAnimationFrame);
    window.nucleusAnimationFrame = null;
  }
  
  // ===== CONFIGURABLE PARAMETERS =====
  // Edit these values directly to change particle behavior
  const JITTER_SPEED = 50.0;    // How fast particles vibrate (0-5)
  const MOVEMENT_SPEED = 0.5;  // How fast particles move around (0-5)
  const BOUND_RADIUS = 0.4;    // How far particles can move from center (0.1-1.0)
  const JITTER_AMOUNT = 1.5;   // How much particles vibrate in place
  const DRIFT_FACTOR = 0.15;    // How much particles drift
  // ==================================
  
  // Center of the container
  const centerX = containerSize / 2;
  const centerY = containerSize / 2;
  const maxRadius = containerSize * 0.35; // Maximum distance particles can move from center
  
  let time = 0;
  
  // Fade in particles with a slight delay for each one
  particles.forEach((particle) => {
    particle.element.style.transition = 'opacity 0.5s ease';
    particle.element.style.opacity = '0.95';
  });
  
  function animateParticles() {
    time += 0.016; // Approximate time step (assuming 60fps)
    
    particles.forEach(particle => {
      // Calculate jitter (small random-like movement)
      const jitterX = Math.sin(time * 5 * particle.speed * JITTER_SPEED + particle.phaseOffset) * JITTER_AMOUNT;
      const jitterY = Math.cos(time * 6 * particle.speed * JITTER_SPEED + particle.phaseOffset * 2) * JITTER_AMOUNT;
      
      // Calculate drift (larger movement over time)
      particle.angle += (0.01 + Math.random() * 0.02) * MOVEMENT_SPEED;
      const driftRadius = maxRadius * BOUND_RADIUS;
      const driftX = Math.cos(particle.angle) * driftRadius * DRIFT_FACTOR * MOVEMENT_SPEED;
      const driftY = Math.sin(particle.angle) * driftRadius * DRIFT_FACTOR * MOVEMENT_SPEED;
      
      // Bound check - if particle goes too far from center, pull it back
      const distanceFromBaseX = particle.baseX + driftX - centerX;
      const distanceFromBaseY = particle.baseY + driftY - centerY;
      const distanceFromBase = Math.sqrt(distanceFromBaseX * distanceFromBaseX + distanceFromBaseY * distanceFromBaseY);
      
      let newDriftX = driftX;
      let newDriftY = driftY;
      
      if (distanceFromBase > driftRadius) {
        // Pull particle back toward center if it's going too far
        const pullFactor = 0.95;
        newDriftX = distanceFromBaseX * pullFactor;
        newDriftY = distanceFromBaseY * pullFactor;
        
        // Update base position to stay within bounds
        particle.baseX = centerX + newDriftX;
        particle.baseY = centerY + newDriftY;
      } else {
        // Slightly update base position over time for natural drift
        particle.baseX += driftX * 0.01;
        particle.baseY += driftY * 0.01;
      }
      
      // Keep particles inside the nucleus boundary
      const maxDistanceFromCenter = maxRadius * BOUND_RADIUS;
      const currentDistanceX = particle.baseX - centerX;
      const currentDistanceY = particle.baseY - centerY;
      const currentDistance = Math.sqrt(currentDistanceX * currentDistanceX + currentDistanceY * currentDistanceY);
      
      if (currentDistance > maxDistanceFromCenter) {
        // Scale back to stay within bounds
        const scale = maxDistanceFromCenter / currentDistance;
        particle.baseX = centerX + currentDistanceX * scale;
        particle.baseY = centerY + currentDistanceY * scale;
      }
      
      // Update position with jitter
      const newX = particle.baseX + jitterX;
      const newY = particle.baseY + jitterY;
      
      // Apply new position to the element
      particle.element.style.left = `${newX - particle.size/2}px`;
      particle.element.style.top = `${newY - particle.size/2}px`;
      
      // Update stored position
      particle.x = newX;
      particle.y = newY;
    });
    
    // Continue animation
    window.nucleusAnimationFrame = requestAnimationFrame(animateParticles);
  }
  
  // Start animation
  window.nucleusAnimationFrame = requestAnimationFrame(animateParticles);
}

// Function to show quark structure (up/down quarks) inside a proton or neutron
function showQuarkStructure(particleType, atomContainer, clickedParticle) {
  console.log(`Zooming into ${particleType} quark structure...`);
  
  // Stop existing nucleus animation
  if (window.nucleusAnimationFrame) {
    cancelAnimationFrame(window.nucleusAnimationFrame);
    window.nucleusAnimationFrame = null;
  }

  // Check if a valid particle was provided
  if (!clickedParticle || !clickedParticle.classList.contains('nuclear-particle')) {
    console.error('Invalid particle element for zoom animation');
    return;
  }

  // Store nuclear view elements for later
  const nucleusViewElements = atomContainer.querySelectorAll(
    '.enlarged-nucleus, .nucleus-legend, .nucleus-back-button, .nuclear-particle'
  );
  window.lastNucleusViewElements = Array.from(nucleusViewElements);

  // Get the position of the clicked particle
  const particleRect = clickedParticle.getBoundingClientRect();
  const containerRect = atomContainer.getBoundingClientRect();
  
  // Calculate the center of the container
  const containerCenterX = containerRect.width / 2;
  const containerCenterY = containerRect.height / 2;
  
  // Calculate position relative to the container
  const relativeLeft = particleRect.left - containerRect.left + (particleRect.width / 2);
  const relativeTop = particleRect.top - containerRect.top + (particleRect.height / 2);
  
  // Create the particle clone for zoom animation
  const particleClone = document.createElement('div');
  particleClone.id = 'particle-clone';
  particleClone.style.zIndex = '1000';
  particleClone.style.cursor = 'default';
  particleClone.style.pointerEvents = 'none';
  particleClone.style.position = 'absolute';
  particleClone.style.width = '34px';
  particleClone.style.height = '34px';
  particleClone.style.background = particleType === 'proton' ? '#ff2a6d' : '#05d9e8';
  particleClone.style.boxShadow = particleType === 'proton' 
    ? '0 0 8px rgba(255, 42, 109, 0.7)' 
    : '0 0 8px rgba(5, 217, 232, 0.7)';
  particleClone.style.borderRadius = '50%';
  particleClone.style.border = '1px solid rgba(255, 255, 255, 0.2)';
  
  // Start position of the particle clone
  particleClone.style.left = `${relativeLeft}px`;
  particleClone.style.top = `${relativeTop}px`;
  particleClone.style.transform = 'translate(-50%, -50%)';
  
  atomContainer.appendChild(particleClone);

  // Hide original particle during animation
  clickedParticle.style.opacity = '0';
  clickedParticle.style.pointerEvents = 'none';

  // Hide other nuclear particles gradually
  const otherParticles = atomContainer.querySelectorAll('.nuclear-particle:not(#particle-clone)');
  otherParticles.forEach(particle => {
    if (particle !== clickedParticle) {
      particle.style.transition = 'opacity 0.3s ease';
      particle.style.opacity = '0';
      particle.style.pointerEvents = 'none';
    }
  });

  // Create quark container but keep it invisible during animation
  const quarkContainer = document.createElement('div');
  quarkContainer.className = 'quark-container';
  quarkContainer.style.opacity = '0';
  atomContainer.appendChild(quarkContainer);

  const probabilitySphere = document.createElement('div');
  probabilitySphere.className = 'probability-sphere';
  quarkContainer.appendChild(probabilitySphere);
  
  // Create an inner group for quarks and gluons to rotate together
  const quarkAndGluonGroup = document.createElement('div');
  quarkAndGluonGroup.style.position = 'absolute';
  quarkAndGluonGroup.style.width = '100%';
  quarkAndGluonGroup.style.height = '100%';
  quarkAndGluonGroup.style.top = '0';
  quarkAndGluonGroup.style.left = '0';
  quarkAndGluonGroup.style.transformOrigin = 'center center';
  quarkContainer.appendChild(quarkAndGluonGroup);
  
  // Create zoom out button (invisible until animation completes)
  const zoomOutButton = document.createElement('button');
  zoomOutButton.className = 'quark-back-button nucleus-back-button';
  zoomOutButton.textContent = 'Back to Nucleus';
  zoomOutButton.style.opacity = '0';
  zoomOutButton.style.pointerEvents = 'auto';
  zoomOutButton.style.zIndex = '6000';
  atomContainer.appendChild(zoomOutButton);

  // Create quark legend (invisible until animation completes)
  const quarkLegend = document.createElement('div');
  quarkLegend.className = 'quark-legend';
  quarkLegend.style.opacity = '0';
  quarkLegend.innerHTML = `
    <div class="quark-legend-item">
      <div class="quark-legend-circle up-quark"></div>
      <span>Up Quark</span>
    </div>
    <div class="quark-legend-item">
      <div class="quark-legend-circle down-quark"></div>
      <span>Down Quark</span>
    </div>
    <div class="quark-legend-item">
      <div class="quark-legend-circle gluon-legend"></div> 
      <span>Gluon</span>
    </div>
  `;
  atomContainer.appendChild(quarkLegend);

  // Animation parameters
  const animationDuration = 1200; // 1.2 seconds
  const startTime = performance.now();
  
  // Start the zoom-in animation
  function animateZoom(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / animationDuration, 1);
    
    // Use easing function for smoother animation
    const easedProgress = easeInOutCubic(progress);
    
    // Calculate how far the particle needs to move to reach center
    const moveTowardsCenterX = (containerCenterX - relativeLeft) * easedProgress;
    const moveTowardsCenterY = (containerCenterY - relativeTop) * easedProgress;
    
    // Animate particle clone scaling up, moving to center, and fading out
    const scaleValue = 1 + (5.25 * easedProgress); // Scale from 1x to 6.25x
    particleClone.style.transform = `translate(-50%, -50%) scale(${scaleValue})`;
    particleClone.style.left = `${relativeLeft + moveTowardsCenterX}px`;
    particleClone.style.top = `${relativeTop + moveTowardsCenterY}px`;
    
    // Adjust box-shadow to scale with the element for better visual quality
    const shadowBlur = 8 + (42 * easedProgress);
    const shadowColor = particleType === 'proton' 
      ? `rgba(255, 42, 109, ${0.7 * (1 - easedProgress * 0.5)})` 
      : `rgba(5, 217, 232, ${0.7 * (1 - easedProgress * 0.5)})`;
    particleClone.style.boxShadow = `0 0 ${shadowBlur}px ${shadowColor}`;
    particleClone.style.opacity = `${1 - easedProgress}`; // Fully fade out
    
    // Fade in quark container as we go
    quarkContainer.style.opacity = easedProgress;
    
    // Hide other nucleus view elements gradually
    nucleusViewElements.forEach(el => {
      if (el !== clickedParticle && !el.classList.contains('nuclear-particle')) {
        el.style.opacity = 1 - easedProgress;
      }
    });
    
    if (progress < 1) {
      requestAnimationFrame(animateZoom);
    } else {
      // Animation complete - finalize transition
      
      // Show the UI elements with a slight delay
      setTimeout(() => {
        zoomOutButton.style.opacity = '1';
        quarkLegend.style.opacity = '1';
      }, 150);
      
      // Remove the particle clone
      particleClone.remove();
      
      // Hide nucleus view elements
      nucleusViewElements.forEach(el => {
        if (el !== clickedParticle) {
          el.style.display = 'none';
        }
      });
      
      // Set up quark structure
      setupQuarkStructure();
    }
  }
  
  // Helper function for setting up quark structure
  function setupQuarkStructure() {
    const quarkTypes = particleType === 'proton'
      ? ['up', 'up', 'down'] 
      : ['up', 'down', 'down'];
    const quarkColors = { up: '#ff3a3a', down: '#3a8cff' };
    const quarkLabels = { up: 'U', down: 'D' };
    const quarkRadius = 120;
    const quarkSize = 30;

    quarkTypes.forEach((type, index) => {
      const quark = document.createElement('div');
      quark.className = `quark ${type}-quark`;
      quark.style.backgroundColor = quarkColors[type];
      
      const angle = (index / quarkTypes.length) * 2 * Math.PI - (Math.PI / 2); 
      const x = Math.cos(angle) * quarkRadius * 0.6;
      const y = Math.sin(angle) * quarkRadius * 0.6;
      
      quark.style.width = `${quarkSize}px`;
      quark.style.height = `${quarkSize}px`;
      quark.style.left = `calc(50% + ${x}px - ${quarkSize / 2}px)`;
      quark.style.top = `calc(50% + ${y}px - ${quarkSize / 2}px)`;
      
      // Add tooltips for quarks
      if (type === 'up') {
        quark.addEventListener('mouseenter', function(event) {
          showParticleTooltip(event, 'up-quark', 'Up Quark', 'Charge: +2/3');
        });
        
        quark.addEventListener('mouseleave', function() {
          removeParticleTooltip();
        });
        
        quark.addEventListener('mousemove', function(event) {
          updateParticleTooltipPosition(event);
        });
      } else {
        quark.addEventListener('mouseenter', function(event) {
          showParticleTooltip(event, 'down-quark', 'Down Quark', 'Charge: -1/3');
        });
        
        quark.addEventListener('mouseleave', function() {
          removeParticleTooltip();
        });
        
        quark.addEventListener('mousemove', function(event) {
          updateParticleTooltipPosition(event);
        });
      }
      
      quarkAndGluonGroup.appendChild(quark);
    });

    const gluonContainer = document.createElement('div');
    gluonContainer.className = 'gluon-container';
    quarkAndGluonGroup.appendChild(gluonContainer);
    
    const quarkElements = quarkAndGluonGroup.querySelectorAll('.quark');
    const gluons = createGluons(gluonContainer, 30);
    animateQuarksAndGluons(gluons, quarkElements, quarkAndGluonGroup);
  }

  // Easing function for smoother animation
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  // Handle zooming back to nucleus view
  zoomOutButton.addEventListener('click', function() {
    // Stop animation before going back
    if (window.quarkViewAnimationFrame) {
      cancelAnimationFrame(window.quarkViewAnimationFrame);
      window.quarkViewAnimationFrame = null;
    }
    
    // Get references to elements for reverse animation
    const quarksContainer = atomContainer.querySelector('.quark-container');
    
    // Make UI elements invisible
    zoomOutButton.style.opacity = '0';
    quarkLegend.style.opacity = '0';
    
    // Create a new particle clone for the reverse animation
    const reverseParticleClone = document.createElement('div');
    reverseParticleClone.id = 'particle-clone';
    
    // Position at the center of container
    reverseParticleClone.style.position = 'absolute';
    reverseParticleClone.style.left = `${containerCenterX}px`;
    reverseParticleClone.style.top = `${containerCenterY}px`;
    
    reverseParticleClone.style.width = '34px';
    reverseParticleClone.style.height = '34px';
    reverseParticleClone.style.borderRadius = '50%';
    reverseParticleClone.style.background = particleType === 'proton' ? '#ff2a6d' : '#05d9e8';
    reverseParticleClone.style.boxShadow = particleType === 'proton' 
      ? '0 0 48px rgba(255, 42, 109, 0.35)' 
      : '0 0 48px rgba(5, 217, 232, 0.35)';
    reverseParticleClone.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    reverseParticleClone.style.zIndex = '1000';
    reverseParticleClone.style.transform = 'translate(-50%, -50%) scale(6.25)';
    reverseParticleClone.style.opacity = '0';
    atomContainer.appendChild(reverseParticleClone);
    
    // Reverse animation parameters
    const animationDuration = 1200; // 1.2 seconds
    const startTime = performance.now();
    
    // Start the reverse animation
    function animateReverseZoom(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Use easing function for smoother animation
      const easedProgress = easeInOutCubic(progress);
      const reverseProgress = 1 - easedProgress;
      
      // Calculate movement from center back to original position
      const moveFromCenterX = (relativeLeft - containerCenterX) * easedProgress;
      const moveFromCenterY = (relativeTop - containerCenterY) * easedProgress;
      
      // Animate particle clone scaling down, moving from center to original position, and fading in
      const scaleValue = 1 + (5.25 * reverseProgress); // Scale from 6.25x to 1x
      reverseParticleClone.style.transform = `translate(-50%, -50%) scale(${scaleValue})`;
      reverseParticleClone.style.left = `${containerCenterX + moveFromCenterX}px`;
      reverseParticleClone.style.top = `${containerCenterY + moveFromCenterY}px`;
      
      // Adjust shadow to match scale for better quality
      const shadowBlur = 8 + (40 * reverseProgress);
      const shadowColor = particleType === 'proton' 
        ? `rgba(255, 42, 109, ${0.7 * (easedProgress * 0.5 + 0.5)})` 
        : `rgba(5, 217, 232, ${0.7 * (easedProgress * 0.5 + 0.5)})`;
      reverseParticleClone.style.boxShadow = `0 0 ${shadowBlur}px ${shadowColor}`;
      
      reverseParticleClone.style.opacity = `${easedProgress}`; // Fade in
      
      // Fade out quark container gradually
      quarksContainer.style.opacity = reverseProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animateReverseZoom);
      } else {
        // Animation complete
        
        // Remove temporary elements
        reverseParticleClone.remove();
        quarksContainer.remove();
        quarkLegend.remove();
        zoomOutButton.remove();
        
        // Restore nucleus view elements
        window.lastNucleusViewElements.forEach(el => {
          if (el) {
            el.style.display = '';
            el.style.opacity = '1';
            if (el.classList.contains('nuclear-particle')) {
              el.style.pointerEvents = 'auto';
            }
          }
        });
        
        // Restart nucleus animation
        if (window.currentNucleusParticles && window.currentNucleusSize !== undefined) {
          startNucleusAnimation(window.currentNucleusParticles, window.currentNucleusSize);
        } else {
          console.warn('Could not restart nucleus animation: particle data missing.');
        }
      }
    }
    
    // Start reverse animation
    requestAnimationFrame(animateReverseZoom);
  });
  
  // Start zoom animation
  requestAnimationFrame(animateZoom);
}

// Function to create gluon particles
function createGluons(container, count) {
  const gluons = [];
  const gluonColor = '#ffff00'; // Set color to yellow
  for (let i = 0; i < count; i++) {
    const gluon = document.createElement('div');
    gluon.className = 'gluon';
    gluon.style.backgroundColor = gluonColor; // Assign yellow directly
    
    // Initial random position within the container (approx)
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * 80; // Within inner area
    const x = 125 + Math.cos(angle) * radius;
    const y = 125 + Math.sin(angle) * radius;
    
    gluon.style.left = `${x}px`;
    gluon.style.top = `${y}px`;
    
    // Add tooltip for gluons
    gluon.addEventListener('mouseenter', function(event) {
      showParticleTooltip(event, 'gluon', 'Gluon', 'Strong force carrier');
    });
    
    gluon.addEventListener('mouseleave', function() {
      removeParticleTooltip();
    });
    
    gluon.addEventListener('mousemove', function(event) {
      updateParticleTooltipPosition(event);
    });
    
    container.appendChild(gluon);
    
    gluons.push({
      element: gluon,
      x: x,
      y: y,
      targetX: x,
      targetY: y,
      // speed: 1.5 + Math.random() * 2.0, // Previous speed
      speed: 15.0 + Math.random() * 3.0, // Increased speed range significantly
      updateTargetTimer: Math.random() * 100 // Timer to change target
    });
  }
  return gluons;
}

// Function to animate gluons moving between quarks and animate quarks themselves
function animateQuarksAndGluons(gluons, quarkElements, quarkAndGluonGroup) { 
  const quarkStates = Array.from(quarkElements).map(q => ({
    element: q,
    initialBaseX: q.offsetLeft, // Store initial position for drift reference
    initialBaseY: q.offsetTop,
    baseX: q.offsetLeft, 
    baseY: q.offsetTop,
    x: q.offsetLeft,
    y: q.offsetTop,
    angle: Math.random() * Math.PI * 2, // Angle for jitter
    speed: 2.8 + Math.random() * 0.4, // Quark jitter speed
    phaseOffset: Math.random() * Math.PI * 2, // Jitter phase
    driftAngle: Math.random() * Math.PI * 2, // Angle for position drift
    driftSpeed: 50.1 + Math.random() * 0.2  // Speed for position drift
  }));
  
  // Get quark positions relative to the group for gluon targeting
  const quarkTargetPositions = quarkStates.map(q => ({ 
    x: q.baseX + q.element.offsetWidth / 2,
    y: q.baseY + q.element.offsetHeight / 2
  }));
  
  // Remove containerWidth/Height as they aren't used directly in animation loop
  // const containerWidth = quarkAndGluonGroup.offsetWidth;
  // const containerHeight = quarkAndGluonGroup.offsetHeight;
  
  let time = 0; // Time for animations
  let containerRotation = 0;
  const baseRotationSpeed = 0.005 * 5; // Increased base speed
  let currentRotationSpeed = baseRotationSpeed * (Math.random() > 0.5 ? 1 : -1); // Start random direction
  let rotationChangeTimer = 1 + Math.random() * 20; // Timer to potentially change rotation direction (60 frames ~ 1 second)
  
  const JITTER_AMOUNT = 6.8;   
  const QUARK_DRIFT_AMOUNT = 9; // How much quarks drift
  const MAX_DRIFT_RADIUS = 25; // Max distance quark base can drift from initial position

  function animationLoop() {
    time += 0.016; // Approximate time step

    // --- Rotation Logic ---
    rotationChangeTimer -= 1; // Decrement timer
    if (rotationChangeTimer <= 0) {
        currentRotationSpeed = baseRotationSpeed * (Math.random() > 0.5 ? 1 : -1); // Flip direction randomly
        rotationChangeTimer = 150 + Math.random() * 300; // Reset timer (e.g., 2.5 - 5 seconds)
    }
    containerRotation += currentRotationSpeed; // Apply current speed and direction
    
    // Apply rotation to the inner group
    quarkAndGluonGroup.style.transform = `rotate(${containerRotation}rad)`;

    // Animate Quarks (Drift + Jitter)
    quarkStates.forEach(quark => {
      // --- Quark Drift ---
      quark.driftAngle += (0.005 + Math.random() * 0.01) * quark.driftSpeed;
      const driftX = Math.cos(quark.driftAngle) * QUARK_DRIFT_AMOUNT;
      const driftY = Math.sin(quark.driftAngle) * QUARK_DRIFT_AMOUNT;
      
      // Tentative new base position
      let nextBaseX = quark.baseX + driftX;
      let nextBaseY = quark.baseY + driftY;

      // Check distance from initial position
      const distFromInitialX = nextBaseX - quark.initialBaseX;
      const distFromInitialY = nextBaseY - quark.initialBaseY;
      const distFromInitial = Math.sqrt(distFromInitialX*distFromInitialX + distFromInitialY*distFromInitialY);
      
      // If too far, constrain back towards initial position
      if (distFromInitial > MAX_DRIFT_RADIUS) {
          const scale = MAX_DRIFT_RADIUS / distFromInitial;
          nextBaseX = quark.initialBaseX + distFromInitialX * scale;
          nextBaseY = quark.initialBaseY + distFromInitialY * scale;
          // Optionally reverse drift direction slightly when hitting boundary
          quark.driftAngle += Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
      }
      
      // Update base position
      quark.baseX = nextBaseX;
      quark.baseY = nextBaseY;

      // --- Quark Jitter (applied ON TOP of drifted base position) ---
      const jitterX = Math.sin(time * 15 * quark.speed + quark.phaseOffset) * JITTER_AMOUNT;
      const jitterY = Math.cos(time * 18 * quark.speed + quark.phaseOffset * 1.5) * JITTER_AMOUNT;
      
      // Update final position including drift and jitter
      quark.x = quark.baseX + jitterX;
      quark.y = quark.baseY + jitterY;
      
      // Apply position
      quark.element.style.left = `${quark.x}px`;
      quark.element.style.top = `${quark.y}px`;
      
      // Update target position for gluons (needs current center)
      const targetIndex = quarkStates.findIndex(qs => qs === quark);
      if(targetIndex !== -1) {
          quarkTargetPositions[targetIndex].x = quark.x + quark.element.offsetWidth / 2;
          quarkTargetPositions[targetIndex].y = quark.y + quark.element.offsetHeight / 2;
      }
    });
    
    // Animate Gluons (targeting drifting/jittering quark positions)
    gluons.forEach(gluon => {
      gluon.updateTargetTimer -= 16; // Decrement timer (approx ms per frame)

      if (gluon.updateTargetTimer <= 0) {
        // Pick a random quark target
        const targetQuarkIndex = Math.floor(Math.random() * quarkTargetPositions.length); // Use target positions
        const targetQuarkPos = quarkTargetPositions[targetQuarkIndex];
        
        // Target a point near the quark's edge (relative to group)
        const angleToQuark = Math.atan2(targetQuarkPos.y - gluon.y, targetQuarkPos.x - gluon.x);
        const distToTarget = 20 + Math.random() * 15; 
        
        gluon.targetX = targetQuarkPos.x + Math.cos(angleToQuark + Math.PI) * distToTarget;
        gluon.targetY = targetQuarkPos.y + Math.sin(angleToQuark + Math.PI) * distToTarget;

        gluon.updateTargetTimer = 80 + Math.random() * 250; // Slightly faster target change
      }

      // Move towards target
      const dx = gluon.targetX - gluon.x;
      const dy = gluon.targetY - gluon.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > gluon.speed) { // Move full speed if distance allows
        gluon.x += (dx / dist) * gluon.speed;
        gluon.y += (dy / dist) * gluon.speed;
      } else {
          // Arrived or very close
          gluon.x = gluon.targetX;
          gluon.y = gluon.targetY;
          gluon.updateTargetTimer = Math.min(gluon.updateTargetTimer, 10); // Trigger next target update sooner
      }
      
      // Apply position
      gluon.element.style.left = `${gluon.x - 2.5}px`; 
      gluon.element.style.top = `${gluon.y - 2.5}px`;
    });

    // Use a different name for the animation frame handle
    window.quarkViewAnimationFrame = requestAnimationFrame(animationLoop); // Changed name
  }

  // Start animation, using the new handle name
  window.quarkViewAnimationFrame = requestAnimationFrame(animationLoop); // Changed name
}

// Add event listener for ESC key to close modals
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closePeriodicTableModal();
  }
}); 

// Add after resetElementCategories function or in an appropriate location
// Function to make elements of a specific category glow
function highlightElementsByCategory(categoryClass) {
  // Check if temperature mode is active
  const tempModeButtons = document.querySelectorAll('.temp-mode-btn');
  const isTemperatureActive = Array.from(tempModeButtons).some(btn => 
    btn.getAttribute('data-mode') === 'on' && btn.classList.contains('active')
  );
  
  // If temperature mode is active, don't highlight categories
  if (isTemperatureActive) {
    return;
  }
  
  const allElements = document.querySelectorAll('.element');
  const categoryElements = document.querySelectorAll(`.element.${categoryClass}`);
  
  // Remove any existing highlight/dim classes
  allElements.forEach(el => {
    el.classList.remove('element-highlighted', 'element-dimmed');
  });
  
  // Dim all elements
  allElements.forEach(element => {
    element.classList.add('element-dimmed');
  });
  
  // Highlight elements of the selected category
  categoryElements.forEach(element => {
    element.classList.remove('element-dimmed');
    element.classList.add('element-highlighted');
  });
  
  // Set a timeout to remove the highlighting after a short delay (1 second)
  setTimeout(() => {
    allElements.forEach(el => {
      el.classList.remove('element-highlighted', 'element-dimmed');
    });
  }, 1000);
}

// Add after the updateTooltipPosition function
// Function to create and show particle tooltip
function showParticleTooltip(event, type, name, description) {
  // Remove any existing tooltip
  removeParticleTooltip();
  
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'orbital-tooltip';
  tooltip.id = 'particle-tooltip';
  
  tooltip.innerHTML = `
    <div class="orbital-name">${name}</div>
    <div class="orbital-electrons">${description}</div>
  `;
  document.body.appendChild(tooltip);
  
  // Position tooltip
  const x = event.clientX + 15;
  const y = event.clientY + 15;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

// Function to remove particle tooltip
function removeParticleTooltip() {
  const tooltip = document.getElementById('particle-tooltip');
  if (tooltip) tooltip.remove();
}

// Function to update particle tooltip position
function updateParticleTooltipPosition(event) {
  const tooltip = document.getElementById('particle-tooltip');
  if (tooltip) {
    const x = event.clientX + 15;
    const y = event.clientY + 15;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  }
}
