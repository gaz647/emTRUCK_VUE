<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import { deburr } from "lodash";
import axios from "axios";

// ------------------CENÍKY PŘEPRAV-------------------------------------------------
//

import prices_ceskaTrebova from "/src/assets/prices/prices_ceskaTrebova";
import prices_ostrava from "/src/assets/prices/prices_ostrava";
import prices_plzen from "/src/assets/prices/prices_plzen";
import prices_praha from "/src/assets/prices/prices_praha";
import prices_ustiNadLabem from "/src/assets/prices/prices_ustiNadLabem";
import prices_zlin from "/src/assets/prices/prices_zlin";

const authenticated = ref(false);
const userPasswordInput = ref(null);
const salamAzvejku = "em23";

let showNewVersionModal = ref(true);

function closeNewVersionModal() {
  showNewVersionModal.value = false;
}

// Proměnná držící hodnoty kurzu EUR / CZK
let eurCzkRate = ref(null);

function passwordValidation() {
  const passwordInputField = document.getElementById("passwordInputField");
  if (userPasswordInput.value === salamAzvejku) {
    authenticated.value = true;
    localStorage.setItem("authenticated", "true");
    getEurCzkRateFirstTime();
  } else {
    passwordInputField.value = "";
    alert("Nesprávné heslo!");
  }
}

onMounted(() => {
  if (localStorage.getItem("authenticated")) {
    authenticated.value = true;
    const eurCzkRateData = JSON.parse(localStorage.getItem("eurCzkRate"));
    const eurCzkRateInitializedData = JSON.parse(
      localStorage.getItem("eurCzkRateInitialized")
    );

    if (!eurCzkRateInitializedData) {
      // V případě že v local storage není hodnota eurCzkRateInitialized spustí se funkce která je získá a nastaví
      // tzn. že uživatel navštívil stárnku poprve
      // console.log(
      //   "Hodnota eurCzkRateInitialized v Local Storage nenalezena => uživatel poprvné navštívil stránku / dotaz na api z minulé návštěvy byl error => spuštěna funkce getEurCzkRateFirstTime() která se pokusí stáhnou kurz skrze API"
      // );
      getEurCzkRateFirstTime();
    } else {
      eurCzkRate.value = parseFloat(eurCzkRateData);
      // console.log(
      //   "Hodnota eurCzkRateInitialized v Local Storage nalezena => Kurz je: " +
      //     eurCzkRate.value
      // );
    }
  }
});

onMounted(() => {
  //   const eurCzkRateData = JSON.parse(localStorage.getItem("eurCzkRate"));
  //   const eurCzkRateInitializedData = JSON.parse(
  //     localStorage.getItem("eurCzkRateInitialized")
  //   );

  //   if (!eurCzkRateInitializedData) {
  //     // V případě že v local storage není hodnota eurCzkRateInitialized spustí se funkce která je získá a nastaví
  //     // tzn. že uživatel navštívil stárnku poprve
  //     console.log(
  //       "Hodnota eurCzkRateInitialized v Local Storage nenalezena => uživatel poprvné navštívil stránku / dotaz na api z minulé návštěvy byl error => spuštěna funkce getEurCzkRateFirstTime() která se pokusí stáhnou kurz skrze API"
  //     );
  //     getEurCzkRateFirstTime();
  //   } else {
  //     eurCzkRate.value = parseFloat(eurCzkRateData);
  //     console.log(
  //       "Hodnota eurCzkRateInitialized v Local Storage nalezena => Kurz je: " +
  //         eurCzkRate.value
  //     );
  //   }

  watch(
    eurCzkRate,
    (newValue) => {
      localStorage.setItem("eurCzkRate", JSON.stringify(newValue));
    },
    { deep: true }
  );
});

// Funkce pro získání kurzu EUR/CZK při pvní návštěvě / nebo při další návštěvě
// po předchozím neúspěšném získání kurzu
async function getEurCzkRateFirstTime() {
  const API_KEY = "82514d87dee3023eb8c649dc";
  const FROM_CURRENCY = "EUR";
  const TO_CURRENCY = "CZK";
  const AMOUNT = 1;

  try {
    const response = await axios.get(
      `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${FROM_CURRENCY}/${TO_CURRENCY}/${AMOUNT}`
    );
    eurCzkRate.value = response.data.conversion_rate;
    localStorage.setItem(
      "eurCzkRate",
      response.data.conversion_rate.toString()
    );
    localStorage.setItem("eurCzkRateInitialized", "true");
    // console.log(
    //   "Funkce getEurCzkRateFirstTime() stáhla z api kurz EUR/CZK: " +
    //     eurCzkRate.value +
    //     " a nastavila ho do proměnné a vytvořila item eurCzkRateIntitialized = true"
    // );
  } catch (error) {
    eurCzkRate.value = 23.6982;
    localStorage.setItem("eurCzkRate", "23.6982");
    console.log(error);
  }
}

const prices = {
  ceskaTrebova: prices_ceskaTrebova,
  ostrava: prices_ostrava,
  plzen: prices_plzen,
  praha: prices_praha,
  ustiNadLabem: prices_ustiNadLabem,
  zlin: prices_zlin,
};

let selectedTerminal = ref(prices.ceskaTrebova);

onMounted(() => {
  const selectedTerminalData = JSON.parse(
    localStorage.getItem("selectedTerminalOption")
  );
  if (selectedTerminalData === "ceskaTrebova") {
    selectedTerminal.value = prices.ceskaTrebova;
  } else if (selectedTerminalData === "ostrava") {
    selectedTerminal.value = prices.ostrava;
  } else if (selectedTerminalData === "plzen") {
    selectedTerminal.value = prices.plzen;
  } else if (selectedTerminalData === "praha") {
    selectedTerminal.value = prices.praha;
  } else if (selectedTerminalData === "ustiNadLabem") {
    selectedTerminal.value = prices.ustiNadLabem;
  } else if (selectedTerminalData === "zlin") {
    selectedTerminal.value = prices.zlin;
  }

  // watch(
  //   selectedTerminal,
  //   (newValue) => {
  //     localStorage.setItem("selectedTerminal", JSON.stringify(newValue));
  //   },
  //   { deep: true }
  // );
});

// ------------------Proměnná jejíž hodnota je to co uživatel píše do inputu------------------
let query = ref("");

// ------------------Pole s výsledky hledání na základě uživatelova vstupu------------------
let filteredCities = ref([]);

// ------------------Proměnná která zobrazuje / skrývá search results------------------
let showSearchResults = ref(true);

// ------------------Proměnná která zobrazuje / skrývá summary--------------------------
let showSummary = ref(true);

// ------------------Funkce která třídí proměnnou cities na základě vloženého inputut------------------
//

function filterByInput(arrayOfObjects, letter) {
  let result = [];
  if (letter !== "") {
    for (let i = 0; i < arrayOfObjects.length; i++) {
      if (
        arrayOfObjects[i].city
          .toLowerCase()
          .startsWith(letter.value.toLowerCase()) ||
        arrayOfObjects[i].zipcode.startsWith(letter.value)
      ) {
        result.push(arrayOfObjects[i]);
      } else if (
        arrayOfObjects[i].city
          .toLowerCase()
          .includes(letter.value.toLowerCase()) ||
        arrayOfObjects[i].zipcode.includes(letter.value)
      ) {
        result.push(arrayOfObjects[i]);
      }
    }
  } else {
    result = [];
  }

  result.sort((a, b) => {
    if (
      a.city.toLowerCase().startsWith(letter.value.toLowerCase()) &&
      !b.city.toLowerCase().startsWith(letter.value.toLowerCase())
    ) {
      return -1;
    } else if (
      b.city.toLowerCase().startsWith(letter.value.toLowerCase()) &&
      !a.city.toLowerCase().startsWith(letter.value.toLowerCase())
    ) {
      return 1;
    } else if (
      a.city.toLowerCase().includes(letter.value.toLowerCase()) &&
      !b.city.toLowerCase().includes(letter.value.toLowerCase())
    ) {
      return -1;
    } else if (
      b.city.toLowerCase().includes(letter.value.toLowerCase()) &&
      !a.city.toLowerCase().includes(letter.value.toLowerCase())
    ) {
      return 1;
    } else if (
      a.zipcode.startsWith(letter.value) &&
      !b.zipcode.startsWith(letter.value)
    ) {
      return -1;
    } else if (
      b.zipcode.startsWith(letter.value) &&
      !a.zipcode.startsWith(letter.value)
    ) {
      return 1;
    } else if (
      a.zipcode.includes(letter.value) &&
      !b.zipcode.includes(letter.value)
    ) {
      return -1;
    } else if (
      b.zipcode.includes(letter.value) &&
      !a.zipcode.includes(letter.value)
    ) {
      return 1;
    } else {
      return 0;
    }
  });

  return result;
}

// ------------------Funkce která hlídá změnu v inputu a při každé změně provádí funkci filteredByInput------------------
function valueChanged(context) {
  query.value = deburr(context.target.value);
  if (query.value === "") {
    showSummary.value = true;
    showDoneJobs.value = true;
    showArchiveJobsBtn.value = true;
    filteredCities.value = [];
  } else {
    showSummary.value = false;
    showDoneJobs.value = false;
    showArchiveJobsBtn.value = false;
    filteredCities.value = filterByInput(selectedTerminal.value, query);
  }
  return filteredCities;
}

// ------------------Funkce která vymaže vstup uživatele, query nastaví na "" a filteredCities na []------------------
function deleteUserInput() {
  showSummary.value = true;
  showDoneJobs.value = true;
  showArchiveJobsBtn.value = true;
  filteredCities.value = [];
  query.value = "";
  document.getElementById("input").value = "";
}

let eurTotal = ref(0);

onMounted(() => {
  const eurTotalData = JSON.parse(localStorage.getItem("eurTotal"));
  if (eurTotalData) {
    eurTotal.value = eurTotalData;
  }
  watch(
    eurTotal,
    (newValue) => {
      localStorage.setItem("eurTotal", JSON.stringify(newValue));
    },
    { deep: true }
  );
});

let percentage = ref(10);

onMounted(() => {
  const percentageData = JSON.parse(localStorage.getItem("percentage"));
  if (percentageData) {
    percentage.value = percentageData;
  }
  watch(
    percentage,
    (newValue) => {
      localStorage.setItem("percentage", JSON.stringify(newValue));
    },
    { deep: true }
  );
});

let czkTotal = ref(0);

onMounted(() => {
  const czkTotalData = JSON.parse(localStorage.getItem("czkTotal"));
  if (czkTotalData) {
    czkTotal.value = czkTotalData;
  }
  watch(
    czkTotal,
    (newValue) => {
      localStorage.setItem("czkTotal", JSON.stringify(newValue));
    },
    { deep: true }
  );
});

let payoutTotal = ref(0);

onMounted(() => {
  const payoutTotalData = JSON.parse(localStorage.getItem("payoutTotal"));
  if (payoutTotalData) {
    payoutTotal.value = payoutTotalData;
  }
  watch(
    payoutTotal,
    (newValue) => {
      localStorage.setItem("payoutTotal", JSON.stringify(newValue));
    },
    { deep: true }
  );
});

onMounted(() => {
  const payoutTotalData = JSON.parse(localStorage.getItem("payoutTotal"));
  if (payoutTotalData) {
    payoutTotal.value = payoutTotalData;
  }
  watch(
    payoutTotal,
    (newValue) => {
      localStorage.setItem("payoutTotal", JSON.stringify(newValue));
    },
    { deep: true }
  );
});

// ------------------Funkce která sčítá celkovou fakturaci a ukládá do proměnných eurTotal a czkTotal------------------
function sumDoneJobsPrices(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].hasOwnProperty("price")) {
      sum += arr[i].price;
    }
  }
  eurTotal.value = sum;
  czkTotal.value = parseInt(sum * eurCzkRate.value);
  payoutTotal.value = parseInt(czkTotal.value * (percentage.value / 100));
}

// ------------------Funkce která sčítá počet prací a ukládá do proměnné doneJobsTotal------------------
function sumDoneJobsCount(arr) {
  doneJobsTotal.value = arr.length;
}

// ------------------Funkce která sčítá druhé práce a ukládá do proměnné secondJobsTotal------------------
function sumDoneJobsSecondJobs(arr) {
  let accumulator = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].hasOwnProperty("isSecondJob")) {
      if (arr[i].isSecondJob === true) {
        accumulator++;
      }
    }
  }
  secondJobsTotal.value = accumulator;
}
// ------------------Funkce která sčítá čekačku a ukládá do proměnné waitingTotal------------------
function sumDoneJobsWaiting(arr) {
  let accumulator = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].hasOwnProperty("waiting")) {
      accumulator += parseInt(arr[i].waiting, 10);
    }
  }
  if (accumulator > 0) {
    waitingTotal.value = accumulator;
  } else {
    waitingTotal.value = 0;
  }
}

// ------------------Proměnné které drží hodnoty počet prací, počet druhých prací, počet čekačky------------------
let doneJobsTotal = ref(0);

onMounted(() => {
  const doneJobsTotalData = JSON.parse(localStorage.getItem("doneJobsTotal"));
  if (doneJobsTotalData) {
    doneJobsTotal.value = doneJobsTotalData;
  }
  watch(
    doneJobsTotal,
    (newValue) => {
      localStorage.setItem("doneJobsTotal", JSON.stringify(newValue));
    },
    { deep: true }
  );
});

let secondJobsTotal = ref(0);

onMounted(() => {
  const secondJobsTotalData = JSON.parse(
    localStorage.getItem("secondJobsTotal")
  );
  if (secondJobsTotalData) {
    secondJobsTotal.value = secondJobsTotalData;
  }
  watch(
    secondJobsTotal,
    (newValue) => {
      localStorage.setItem("secondJobsTotal", JSON.stringify(newValue));
    },
    { deep: true }
  );
});

let waitingTotal = ref(0);

onMounted(() => {
  const waitingTotalData = JSON.parse(localStorage.getItem("waitingTotal"));
  if (waitingTotalData) {
    waitingTotal.value = waitingTotalData;
  }
  watch(
    waitingTotal,
    (newValue) => {
      localStorage.setItem("waitingTotal", JSON.stringify(newValue));
    },
    { deep: true }
  );
});

// ------------------Proměnná do které se ukládají odjete práce------------------

const showDoneJobs = ref(true);

const showArchiveJobsBtn = ref(true);

let doneJobs = ref([]);

onMounted(() => {
  const doneJobsData = JSON.parse(localStorage.getItem("doneJobs"));
  if (doneJobsData) {
    doneJobs.value = doneJobsData;
  }
  watch(
    doneJobs,
    (newValue) => {
      localStorage.setItem("doneJobs", JSON.stringify(newValue));
    },
    { deep: true }
  );
});

// ------------------Funkce která vrací den v týdnu na základě vloženého data------------------
function getCurrentDayCZ(date) {
  const daysOfTheWeek = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
  return daysOfTheWeek[date.getDay()];
}

function getCurrentDateYYYYMMDD() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();

  const currentDate = yyyy + "-" + mm + "-" + dd;
  return currentDate;
}

// ------------------ADD DONE JOB-----------------------------------------------------
//

// ------------------Proměnná podle jejíž hodnoty se zobrazuje nebo skrývá modal pro přidání odjeté práce------------------
let showAddDoneJobModal = ref(false);

// ------------------Proměnné držící hodnoty aktuálně přidávané práce
let temporaryAddDoneJobIndex = ref(null);
let temporaryAddDoneJobObjIndex = ref(null);
let temporaryAddDoneJobCity = ref(null);
let temporaryAddDoneJobZipcode = ref(null);
let temporaryAddDoneJobPrice27t = ref(null);
let temporaryAddDoneJobPrice34t = ref(null);
let temporaryAddDoneJobTerminal = ref(null);

let temporaryAddDoneJobDayInput = ref(null);
let temporaryAddDoneJobDateInput = ref(null);
let temporaryAddDoneJobWeightInput = ref(null);
let temporaryAddDoneJobPriceInput = ref(null);
let temporaryAddDoneJobCmrInput = ref(null);
let temporaryAddDoneJobIsSecondJobInput = ref(null);
let temporaryAddDoneJobWaitingInput = ref(null);

// ------------------Funkce která resetuje proměnné držící hodnoty aktuálně přidávané práce------------------
function resetTemporaryAddDoneJobRefs() {
  temporaryAddDoneJobIndex.value = null;
  temporaryAddDoneJobObjIndex.value = null;
  temporaryAddDoneJobCity.value = null;
  temporaryAddDoneJobZipcode.value = null;
  temporaryAddDoneJobPrice27t.value = null;
  temporaryAddDoneJobPrice34t.value = null;
  temporaryAddDoneJobTerminal.value = null;

  temporaryAddDoneJobDayInput.value = null;
  temporaryAddDoneJobDateInput.value = null;
  temporaryAddDoneJobWeightInput.value = null;
  temporaryAddDoneJobPriceInput.value = null;
  temporaryAddDoneJobCmrInput.value = null;
  temporaryAddDoneJobIsSecondJobInput.value = null;
  temporaryAddDoneJobWaitingInput.value = null;
}

// ------------------Funkce která otevírá modal pro přidání odjeté práce------------------
function openAddDoneJobModal() {
  showAddDoneJobModal.value = true;
  overflowHidden();
  deleteUserInput();
}

// ------------------Funkce která zavírá modal pro přidání odjeté práce------------------
function closeAddDoneJobModal() {
  showAddDoneJobModal.value = false;
  overflowVisible();

  resetTemporaryAddDoneJobRefs();
  // deleteUserInput();
  // showSearchResults.value = true;
}

// ------------------Funkce spouštějící se po kliknutí na tlačítko + u vybrané práce která uloží do proměnných vybraná data------------------
function openAddDoneJobModalWithData(
  index,
  objIndex,
  city,
  zipcode,
  price27t,
  price34t,
  terminal
) {
  temporaryAddDoneJobIndex.value = index;
  temporaryAddDoneJobObjIndex.value = parseInt(objIndex);
  temporaryAddDoneJobCity.value = city;
  temporaryAddDoneJobZipcode.value = zipcode;
  temporaryAddDoneJobPrice27t.value = price27t;
  temporaryAddDoneJobPrice34t.value = price34t;
  temporaryAddDoneJobTerminal.value = terminal;
  temporaryAddDoneJobDateInput.value = getCurrentDateYYYYMMDD();
  temporaryAddDoneJobWeightInput.value = "weightTo27t";
  openAddDoneJobModal();
}

// ------------------Funkce která třídí Done Jobs podle datumu------------------
function sortJobs321(arr) {
  arr.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });
  return arr;
}

function hasSameValuesDoneJobs(obj1, obj2) {
  if (
    obj1.date === obj2.date &&
    obj1.isSecondJob === false &&
    obj2.isSecondJob === true
  ) {
    // console.log(obj1.city + " should be swapped with " + obj2.city);
    return true;
  }
}

function swapIfIsSecondJobDoneJobs(obj) {
  for (let i = 0; i < obj.length; i++) {
    if (i + 1 < obj.length) {
      if (hasSameValuesDoneJobs(obj[i], obj[i + 1])) {
        [obj[i], obj[i + 1]] = [obj[i + 1], obj[i]];
      }
    }
  }
  // console.log(doneJobsArchive.value);
  return obj;
}

// ------------------Funkce která přidá vybranou práci do proměnné doneJobs------------------
function addDoneJob() {
  if (new Date(temporaryAddDoneJobDateInput.value) < new Date("2023-01-01")) {
    alert("Vyberte správné datum!");
    return;
  }

  temporaryAddDoneJobDayInput.value = getCurrentDayCZ(
    new Date(temporaryAddDoneJobDateInput.value)
  );

  if (!temporaryAddDoneJobCmrInput.value) {
    alert("Vyplňte CMR");
    return;
  }

  if (temporaryAddDoneJobWeightInput.value === "weightTo27t") {
    temporaryAddDoneJobPriceInput.value = parseInt(
      temporaryAddDoneJobPrice27t.value
    );
  } else if (temporaryAddDoneJobWeightInput.value === "weightTo34t") {
    temporaryAddDoneJobPriceInput.value = parseInt(
      temporaryAddDoneJobPrice34t.value
    );
  }

  if (!temporaryAddDoneJobIsSecondJobInput.value) {
    temporaryAddDoneJobIsSecondJobInput.value = false;
  }

  if (!temporaryAddDoneJobWaitingInput.value) {
    temporaryAddDoneJobWaitingInput.value = 0;
  } else {
    temporaryAddDoneJobWaitingInput.value = parseInt(
      temporaryAddDoneJobWaitingInput.value
    );
  }

  class NewJob {
    constructor(
      day,
      date,
      city,
      zipcode,
      weight,
      price,
      cmr,
      isSecondJob,
      waiting,
      objIndex,
      terminal
    ) {
      this.day = day;
      this.date = date;
      this.city = city;
      this.zipcode = zipcode;
      this.weight = weight;
      this.price = price;
      this.cmr = cmr;
      this.isSecondJob = isSecondJob;
      this.waiting = waiting;
      this.objIndex = objIndex;
      this.terminal = terminal;
    }
  }

  const newJob = new NewJob(
    temporaryAddDoneJobDayInput.value,
    temporaryAddDoneJobDateInput.value,
    temporaryAddDoneJobCity.value,
    temporaryAddDoneJobZipcode.value,
    temporaryAddDoneJobWeightInput.value,
    temporaryAddDoneJobPriceInput.value,
    temporaryAddDoneJobCmrInput.value.toUpperCase(),
    temporaryAddDoneJobIsSecondJobInput.value,
    temporaryAddDoneJobWaitingInput.value,
    temporaryAddDoneJobObjIndex.value,
    temporaryAddDoneJobTerminal.value
  );

  doneJobs.value.unshift(newJob);
  sortJobs321(doneJobs.value);
  sumDoneJobsPrices(doneJobs.value);
  sumDoneJobsCount(doneJobs.value);
  sumDoneJobsSecondJobs(doneJobs.value);
  sumDoneJobsWaiting(doneJobs.value);
  deleteUserInput();
  resetTemporaryAddDoneJobRefs();
  swapIfIsSecondJobDoneJobs(doneJobs.value);
  // console.log(doneJobs.value);
  closeAddDoneJobModal();
}

// ------------------Funkce která zobrazí uživateli v přidané odjeté práci datum ve formátu DD.MM.YYYY------------------
//
function displayCZdateFormat(date) {
  return date.split("-").reverse().join(".");
}

// ------------------Funkce která zobrazí uživateli v přidané odjeté práci datum ve formátu DD.MM------------------
//
function displayCZdateFormatDDMM(date) {
  return date.split("-").reverse().join(".").substring(0, 6);
}

// ------------------Funkce která zobrazí uživateli v přidané odjeté práci váhu ve správném formátu------------------
//
function displayStandartWeightFormat(weight) {
  if (weight === "weightTo27t") {
    return "<27t";
  } else {
    return "<34t";
  }
}

// ------------------Proměnná zobrazující modální okno u info buttonu u Archivovat práce------------------
let showPopup = ref(false);

// ------------------DELETE DONE JOB---------------------------------------------------------------------
//
let temporaryDeleteDoneJobIndex = ref(null);

let showDeleteDoneJobModal = ref(false);

function openDeleteDoneJobModal() {
  showDeleteDoneJobModal.value = true;
  overflowHidden();
}

function closeDeleteDoneJobModal() {
  showDeleteDoneJobModal.value = false;
  overflowVisible();
}

function openDeleteDoneJobModalWithData(index) {
  temporaryDeleteDoneJobIndex.value = index;
  openDeleteDoneJobModal();
}

// ------------------Funkce která odstraní vybranou přidanou odjetou práci a provede sum funkce------------------
function deleteDoneJob() {
  doneJobs.value.splice(temporaryDeleteDoneJobIndex.value, 1);
  sumDoneJobsPrices(doneJobs.value);
  sumDoneJobsCount(doneJobs.value);
  sumDoneJobsSecondJobs(doneJobs.value);
  sumDoneJobsWaiting(doneJobs.value);
  closeDeleteDoneJobModal();
}

// ------------------Proměnná podle jejíž hodnoty se zobrazuje nebo skrývá modal pro úpravu procent z fakturace------------------
let showPercentageModal = ref(false);

// ------------------Funkce která otevírá modal pro úpravu procent z fakturace------------------
function openPercentageModal() {
  showPercentageModal.value = true;
  overflowHidden();
}

// ------------------Funkce která zavírá modal pro úpravu procent z fakturace------------------
function closePercentageModal() {
  showPercentageModal.value = false;
  overflowVisible();
}

// ------------------Funkce která nastaví procenta z fakturace na základě vstupu uživatele------------------
function setPercentage() {
  const value = document.getElementById("percentageInput").value;
  if (!value) {
    alert("Vyplňte číslo!");
    return;
  } else {
    percentage.value = parseInt(value);
  }
  sumDoneJobsPrices(doneJobs.value);
  closePercentageModal();
}

// ------------------EDIT DONE JOB--------------------------------------------------
//

// ------------------Funkce která určuje, jestli se otvře editDoneJobModal nebo editOwnDoneJobModal------------------
function openCorrectEditDoneJobModal(index) {
  if (doneJobs.value[index].objIndex < 50000) {
    openEditDoneJobModalWithData(index);
  } else {
    openEditOwnDoneJobModalWithData(index);
  }
}

// ------------------Proměnná podle jejíž hodnoty se zobrazuje nebo skrývá modal pro úpravu vybrané přidané odjeté práce------------------
let showEditDoneJobModal = ref(false);

let temporaryEditDoneJobIndex = ref(null);
let temporaryEditDoneJobObjIndex = ref(null);
let temporaryEditDoneJobCityInput = ref(null);
let temporaryEditDoneJobZipcode = ref(null);
let temporaryEditDoneJobDayInput = ref(null);
let temporaryEditDoneJobDateInput = ref(null);
let temporaryEditDoneJobWeightInput = ref(null);
let temporaryEditDoneJobPriceInput = ref(null);
let temporaryEditDoneJobCmrInput = ref(null);
let temporaryEditDoneJobIsSecondJobInput = ref(null);
let temporaryEditDoneJobWaitingInput = ref(null);

let temporaryEditDoneJobTerminal = ref(null);
let temporaryEditDoneJobPrices = ref(null);

// ------------------Funkce která resetuje proměnné držící hodnoty aktuálně přidávané práce------------------
function resetTemporaryEditDoneJobRefs() {
  temporaryEditDoneJobIndex.value = null;
  temporaryEditDoneJobObjIndex.value = null;
  temporaryEditDoneJobCityInput.value = null;
  temporaryEditDoneJobZipcode.value = null;
  temporaryEditDoneJobDayInput.value = null;
  temporaryEditDoneJobDateInput.value = null;
  temporaryEditDoneJobWeightInput.value = null;
  temporaryEditDoneJobPriceInput.value = null;
  temporaryEditDoneJobCmrInput.value = null;
  temporaryEditDoneJobIsSecondJobInput.value = null;
  temporaryEditDoneJobWaitingInput.value = null;

  temporaryEditDoneJobTerminal.value = null;
  temporaryEditDoneJobPrices.value = null;
}

function openEditDoneJobModal() {
  showEditDoneJobModal.value = true;
  overflowHidden();
}

function closeEditDoneJobModal() {
  showEditDoneJobModal.value = false;
  overflowVisible();
  resetTemporaryEditDoneJobRefs();
}

function openEditDoneJobModalWithData(index) {
  temporaryEditDoneJobIndex.value = index;

  temporaryEditDoneJobObjIndex.value = doneJobs.value[index].objIndex;

  temporaryEditDoneJobTerminal.value = doneJobs.value[index].terminal;

  temporaryEditDoneJobDateInput.value = doneJobs.value[index].date;

  temporaryEditDoneJobWeightInput.value = doneJobs.value[index].weight;

  temporaryEditDoneJobCmrInput.value = doneJobs.value[index].cmr;

  temporaryEditDoneJobIsSecondJobInput.value =
    doneJobs.value[index].isSecondJob;

  if (doneJobs.value[index].waiting === 0) {
    temporaryEditDoneJobWaitingInput.value = "";
  } else {
    temporaryEditDoneJobWaitingInput.value = doneJobs.value[index].waiting;
  }

  if (temporaryEditDoneJobTerminal.value === "Ceska Trebova") {
    temporaryEditDoneJobPrices.value = prices.ceskaTrebova;
  } else if (temporaryEditDoneJobTerminal.value === "Ostrava") {
    temporaryEditDoneJobPrices.value = prices.ostrava;
  } else if (temporaryEditDoneJobTerminal.value === "Plzen") {
    temporaryEditDoneJobPrices.value = prices.plzen;
  } else if (temporaryEditDoneJobTerminal.value === "Praha") {
    temporaryEditDoneJobPrices.value = prices.praha;
  } else if (temporaryEditDoneJobTerminal.value === "Usti nad Labem") {
    temporaryEditDoneJobPrices.value = prices.ustiNadLabem;
  } else if (temporaryEditDoneJobTerminal.value === "Zlin") {
    temporaryEditDoneJobPrices.value = prices.zlin;
  }

  openEditDoneJobModal();
}

//
function updateDoneJob() {
  if (new Date(temporaryEditDoneJobDateInput.value) < new Date("2023-01-01")) {
    alert("Vyberte správné datum!");
    return;
  }

  doneJobs.value[temporaryEditDoneJobIndex.value].day = getCurrentDayCZ(
    new Date(temporaryEditDoneJobDateInput.value)
  );

  doneJobs.value[temporaryEditDoneJobIndex.value].date =
    temporaryEditDoneJobDateInput.value;

  doneJobs.value[temporaryEditDoneJobIndex.value].cmr =
    temporaryEditDoneJobCmrInput.value.toUpperCase();

  if (!temporaryEditDoneJobCmrInput.value) {
    alert("Vyplňte CMR");
    return;
  }

  doneJobs.value[temporaryEditDoneJobIndex.value].weight =
    temporaryEditDoneJobWeightInput.value;

  doneJobs.value[temporaryEditDoneJobIndex.value].price = parseInt(
    temporaryEditDoneJobPrices.value[temporaryEditDoneJobObjIndex.value][
      temporaryEditDoneJobWeightInput.value
    ]
  );

  doneJobs.value[temporaryEditDoneJobIndex.value].isSecondJob =
    temporaryEditDoneJobIsSecondJobInput.value;

  if (temporaryEditDoneJobWaitingInput.value === "") {
    doneJobs.value[temporaryEditDoneJobIndex.value].waiting = 0;
  } else {
    doneJobs.value[temporaryEditDoneJobIndex.value].waiting = parseInt(
      temporaryEditDoneJobWaitingInput.value
    );
  }

  sortJobs321(doneJobs.value);
  sumDoneJobsPrices(doneJobs.value);
  sumDoneJobsCount(doneJobs.value);
  sumDoneJobsSecondJobs(doneJobs.value);
  sumDoneJobsWaiting(doneJobs.value);
  resetTemporaryEditDoneJobRefs();

  closeEditDoneJobModal();
}

// ------------------------------ADD OWN DONE JOB SECTION-------------------------
//

let showAddOwnDoneJobModal = ref(false);

let temporaryAddOwnDoneJobDateInput = ref(null);
let temporaryAddOwnDoneJobDayInput = ref(null);
let temporaryAddOwnDoneJobCityInput = ref(null);
let temporaryAddOwnDoneJobZipcodeInput = ref(null);
let temporaryAddOwnDoneJobPriceInput = ref(null);
let temporaryAddOwnDoneJobWeightInput = ref(null);
let temporaryAddOwnDoneJobIsSecondJobInput = ref(null);
let temporaryAddOwnDoneJobCmrInput = ref(null);
let temporaryAddOwnDoneJobWaitingInput = ref(null);

let temporaryAddOwnDoneJobObjIndex = ref(null);
let temporaryAddOwnDoneJobTerminalInput = ref(null);

// ------------------Funkce která resetuje proměnné držící hodnoty aktuálně vlastní přidávané práce------------------
function resetTemporaryAddOwnDoneJobRefs() {
  temporaryAddOwnDoneJobDateInput.value = null;
  temporaryAddOwnDoneJobDayInput.value = null;
  temporaryAddOwnDoneJobCityInput.value = null;
  temporaryAddOwnDoneJobZipcodeInput.value = null;
  temporaryAddOwnDoneJobPriceInput.value = null;
  temporaryAddOwnDoneJobWeightInput.value = null;
  temporaryAddOwnDoneJobIsSecondJobInput.value = null;
  temporaryAddOwnDoneJobCmrInput.value = null;
  temporaryAddOwnDoneJobWaitingInput.value = null;

  temporaryAddOwnDoneJobObjIndex.value = null;
  temporaryAddOwnDoneJobTerminalInput.value = null;
}

function addObjIndex() {
  let resultIndex = 50000;
  for (let i = 0; i < doneJobs.value.length; i++) {
    if (doneJobs.value[i].objIndex >= resultIndex) {
      resultIndex = doneJobs.value[i].objIndex + 1;
    }
  }
  return resultIndex;
}

function openAddOwnDoneJobModal() {
  showAddOwnDoneJobModal.value = true;
  overflowHidden();
  temporaryAddOwnDoneJobDateInput.value = getCurrentDateYYYYMMDD();
  temporaryAddOwnDoneJobWeightInput.value = "weightTo27t";
  temporaryAddOwnDoneJobObjIndex.value = addObjIndex();
}

function closeAddOwnDoneJobModal() {
  showAddOwnDoneJobModal.value = false;
  overflowVisible();
  resetTemporaryAddOwnDoneJobRefs();
}

function addOwnDoneJob() {
  if (
    new Date(temporaryAddOwnDoneJobDateInput.value) < new Date("2023-01-01")
  ) {
    alert("Vyberte správné datum!");
    return;
  }

  if (!temporaryAddOwnDoneJobCmrInput.value) {
    alert("Vyplňte CMR");
    return;
  }

  if (!temporaryAddOwnDoneJobCityInput.value) {
    alert("Vyplňte město");
    return;
  }

  if (!temporaryAddOwnDoneJobZipcodeInput.value) {
    alert("Vyplňte PSČ");
    return;
  }

  if (!temporaryAddOwnDoneJobTerminalInput.value) {
    alert("Vyplňte Terminál");
    return;
  }

  temporaryAddOwnDoneJobDayInput.value = getCurrentDayCZ(
    new Date(temporaryAddOwnDoneJobDateInput.value)
  );

  if (!temporaryAddOwnDoneJobPriceInput.value) {
    temporaryAddOwnDoneJobPriceInput.value = 0;
  }

  if (!temporaryAddOwnDoneJobIsSecondJobInput.value) {
    temporaryAddOwnDoneJobIsSecondJobInput.value = false;
  }

  if (!temporaryAddOwnDoneJobCmrInput.value) {
    temporaryAddOwnDoneJobCmrInput.value = "";
  }

  if (!temporaryAddOwnDoneJobWaitingInput.value) {
    temporaryAddOwnDoneJobWaitingInput.value = 0;
  } else {
    temporaryAddOwnDoneJobWaitingInput.value = parseInt(
      temporaryAddOwnDoneJobWaitingInput.value
    );
  }

  class NewJob {
    constructor(
      day,
      date,
      city,
      zipcode,
      weight,
      price,
      cmr,
      isSecondJob,
      waiting,
      objIndex,
      terminal
    ) {
      this.day = day;
      this.date = date;
      this.city = city;
      this.zipcode = zipcode;
      this.weight = weight;
      this.price = price;
      this.cmr = cmr;
      this.isSecondJob = isSecondJob;
      this.waiting = waiting;
      this.objIndex = objIndex;
      this.terminal = terminal;
    }
  }

  const newJob = new NewJob(
    temporaryAddOwnDoneJobDayInput.value,
    temporaryAddOwnDoneJobDateInput.value,
    temporaryAddOwnDoneJobCityInput.value,
    temporaryAddOwnDoneJobZipcodeInput.value,
    temporaryAddOwnDoneJobWeightInput.value,
    parseInt(temporaryAddOwnDoneJobPriceInput.value),
    temporaryAddOwnDoneJobCmrInput.value.toUpperCase(),
    temporaryAddOwnDoneJobIsSecondJobInput.value,
    temporaryAddOwnDoneJobWaitingInput.value,
    temporaryAddOwnDoneJobObjIndex.value,
    temporaryAddOwnDoneJobTerminalInput.value
  );

  doneJobs.value.unshift(newJob);
  sortJobs321(doneJobs.value);
  sumDoneJobsPrices(doneJobs.value);
  sumDoneJobsCount(doneJobs.value);
  sumDoneJobsSecondJobs(doneJobs.value);
  sumDoneJobsWaiting(doneJobs.value);
  deleteUserInput();
  resetTemporaryAddOwnDoneJobRefs();
  // console.log(doneJobs.value);
  closeAddOwnDoneJobModal();
}

//
//
// ------------------Proměnná podle jejíž hodnoty se zobrazuje nebo skrývá modal pro úpravu vybrané vlastní přidané odjeté práce------------------
let showEditOwnDoneJobModal = ref(false);

let temporaryEditOwnDoneJobIndex = ref(null);
let temporaryEditOwnDoneJobDateInput = ref(null);
let temporaryEditOwnDoneJobDayInput = ref(null);
let temporaryEditOwnDoneJobCityInput = ref(null);
let temporaryEditOwnDoneJobZipcodeInput = ref(null);
let temporaryEditOwnDoneJobPriceInput = ref(null);
let temporaryEditOwnDoneJobWeightInput = ref(null);
let temporaryEditOwnDoneJobIsSecondJobInput = ref(null);
let temporaryEditOwnDoneJobCmrInput = ref(null);
let temporaryEditOwnDoneJobWaitingInput = ref(null);

let temporaryEditOwnDoneJobObjIndex = ref(null);
let temporaryEditOwnDoneJobTerminalInput = ref(null);

// ------------------Funkce která resetuje proměnné držící hodnoty aktuálně přidávané vlastní práce------------------
function resetTemporaryEditOwnDoneJobRefs() {
  temporaryEditOwnDoneJobIndex.value = null;
  temporaryEditOwnDoneJobDateInput.value = null;
  temporaryEditOwnDoneJobDayInput.value = null;
  temporaryEditOwnDoneJobCityInput.value = null;
  temporaryEditOwnDoneJobZipcodeInput.value = null;
  temporaryEditOwnDoneJobPriceInput.value = null;
  temporaryEditOwnDoneJobWeightInput.value = null;
  temporaryEditOwnDoneJobIsSecondJobInput.value = null;
  temporaryEditOwnDoneJobCmrInput.value = null;
  temporaryEditOwnDoneJobWaitingInput.value = null;

  temporaryEditOwnDoneJobObjIndex.value = null;
  temporaryEditOwnDoneJobTerminalInput.value = null;
}

function openEditOwnDoneJobModal() {
  showEditOwnDoneJobModal.value = true;
  overflowHidden();
}

function closeEditOwnDoneJobModal() {
  showEditOwnDoneJobModal.value = false;
  overflowVisible();
  resetTemporaryEditDoneJobRefs();
}

function openEditOwnDoneJobModalWithData(index) {
  temporaryEditOwnDoneJobIndex.value = index;

  temporaryEditOwnDoneJobObjIndex.value = doneJobs.value[index].objIndex;

  temporaryEditOwnDoneJobDateInput.value = doneJobs.value[index].date;

  temporaryEditOwnDoneJobCityInput.value = doneJobs.value[index].city;

  temporaryEditOwnDoneJobZipcodeInput.value = doneJobs.value[index].zipcode;

  temporaryEditOwnDoneJobWeightInput.value = doneJobs.value[index].weight;

  temporaryEditOwnDoneJobTerminalInput.value = doneJobs.value[index].terminal;

  if (doneJobs.value[index].price === 0) {
    temporaryEditOwnDoneJobPriceInput.value = "";
  } else {
    temporaryEditOwnDoneJobPriceInput.value = doneJobs.value[index].price;
  }

  temporaryEditOwnDoneJobCmrInput.value = doneJobs.value[index].cmr;

  temporaryEditOwnDoneJobIsSecondJobInput.value =
    doneJobs.value[index].isSecondJob;

  if (doneJobs.value[index].waiting === 0) {
    temporaryEditOwnDoneJobWaitingInput.value = "";
  } else {
    temporaryEditOwnDoneJobWaitingInput.value = doneJobs.value[index].waiting;
  }
  openEditOwnDoneJobModal();
}

//
function updateOwnDoneJob() {
  if (
    new Date(temporaryEditOwnDoneJobDateInput.value) < new Date("2023-01-01")
  ) {
    alert("Vyberte správné datum!");
    return;
  }

  if (!temporaryEditOwnDoneJobCmrInput.value) {
    alert("Vyplňte CMR");
    return;
  }

  if (!temporaryEditOwnDoneJobCityInput.value) {
    alert("Vyplňte město");
    return;
  }

  if (!temporaryEditOwnDoneJobZipcodeInput.value) {
    alert("Vyplňte PSČ");
    return;
  }

  if (!temporaryEditOwnDoneJobTerminalInput.value) {
    alert("Vyplňte Terminál");
    return;
  }

  doneJobs.value[temporaryEditOwnDoneJobIndex.value].day = getCurrentDayCZ(
    new Date(temporaryEditOwnDoneJobDateInput.value)
  );

  doneJobs.value[temporaryEditOwnDoneJobIndex.value].date =
    temporaryEditOwnDoneJobDateInput.value;

  doneJobs.value[temporaryEditOwnDoneJobIndex.value].city =
    temporaryEditOwnDoneJobCityInput.value;

  doneJobs.value[temporaryEditOwnDoneJobIndex.value].zipcode =
    temporaryEditOwnDoneJobZipcodeInput.value;

  doneJobs.value[temporaryEditOwnDoneJobIndex.value].weight =
    temporaryEditOwnDoneJobWeightInput.value;

  doneJobs.value[temporaryEditOwnDoneJobIndex.value].terminal =
    temporaryEditOwnDoneJobTerminalInput.value;

  if (!temporaryEditOwnDoneJobPriceInput.value) {
    doneJobs.value[temporaryEditOwnDoneJobIndex.value].price = 0;
  } else {
    doneJobs.value[temporaryEditOwnDoneJobIndex.value].price = parseInt(
      temporaryEditOwnDoneJobPriceInput.value
    );
  }

  doneJobs.value[temporaryEditOwnDoneJobIndex.value].cmr =
    temporaryEditOwnDoneJobCmrInput.value.toUpperCase();

  doneJobs.value[temporaryEditOwnDoneJobIndex.value].isSecondJob =
    temporaryEditOwnDoneJobIsSecondJobInput.value;

  if (temporaryEditOwnDoneJobWaitingInput.value === "") {
    doneJobs.value[temporaryEditOwnDoneJobIndex.value].waiting = 0;
  } else {
    doneJobs.value[temporaryEditOwnDoneJobIndex.value].waiting = parseInt(
      temporaryEditOwnDoneJobWaitingInput.value
    );
  }

  sortJobs321(doneJobs.value);
  sumDoneJobsPrices(doneJobs.value);
  sumDoneJobsCount(doneJobs.value);
  sumDoneJobsSecondJobs(doneJobs.value);
  sumDoneJobsWaiting(doneJobs.value);
  resetTemporaryEditOwnDoneJobRefs();

  closeEditOwnDoneJobModal();
}

// ------------------------------TERMINAL SELECTOR-------------------------
//
function displayStandartTerminal(terminal) {
  if (terminal === "ceskaTrebova") {
    return "Česká Třebová";
  } else if (terminal === "ostrava") {
    return "Ostrava";
  } else if (terminal === "plzen") {
    return "Plzeň";
  } else if (terminal === "praha") {
    return "Praha";
  } else if (terminal === "ustiNadLabem") {
    return "Ústí nad Labem";
  } else if (terminal === "zlin") {
    return "Zlín";
  }
}

let showTerminalSelector = ref(false);

let selectedTerminalOptionByUser = ref(null);

let selectedTerminalOption = ref("ceskaTrebova");

onMounted(() => {
  const selectedTerminalOptionData = JSON.parse(
    localStorage.getItem("selectedTerminalOption")
  );
  if (selectedTerminalOptionData) {
    selectedTerminalOption.value = selectedTerminalOptionData;
  }
  watch(
    selectedTerminalOption,
    (newValue) => {
      localStorage.setItem("selectedTerminalOption", JSON.stringify(newValue));
    },
    { deep: true }
  );
});

function openTerminalSelector() {
  deleteUserInput();
  overflowHidden();
  selectedTerminalOptionByUser.value = selectedTerminalOption.value;
  showTerminalSelector.value = true;
}

function closeTerminalSelector() {
  overflowVisible();
  selectedTerminalOptionByUser.value = selectedTerminalOption.value;
  showTerminalSelector.value = false;
}

function setTerminal() {
  if (selectedTerminalOptionByUser.value === "ceskaTrebova") {
    selectedTerminalOption.value = "ceskaTrebova";
    selectedTerminal.value = prices.ceskaTrebova;
  } else if (selectedTerminalOptionByUser.value === "ostrava") {
    selectedTerminalOption.value = "ostrava";
    selectedTerminal.value = prices.ostrava;
  } else if (selectedTerminalOptionByUser.value === "plzen") {
    selectedTerminalOption.value = "plzen";
    selectedTerminal.value = prices.plzen;
  } else if (selectedTerminalOptionByUser.value === "praha") {
    selectedTerminalOption.value = "praha";
    selectedTerminal.value = prices.praha;
  } else if (selectedTerminalOptionByUser.value === "ustiNadLabem") {
    selectedTerminalOption.value = "ustiNadLabem";
    selectedTerminal.value = prices.ustiNadLabem;
  } else if (selectedTerminalOptionByUser.value === "zlin") {
    selectedTerminalOption.value = "zlin";
    selectedTerminal.value = prices.zlin;
  }

  closeTerminalSelector();
}

// ------------------------------MENU MODAL-------------------------
//
let showMenuModal = ref(false);

function openMenuModal() {
  showMenuModal.value = true;
  overflowHidden();
}

function closeMenuModal() {
  showMenuModal.value = false;
  overflowVisible();
}

// ------------------------------DONE JOBS ARCHIVE-------------------------
//
let doneJobsArchive = reactive({ value: [] });

onMounted(() => {
  const doneJobsArchiveData = JSON.parse(
    localStorage.getItem("doneJobsArchive")
  );
  if (doneJobsArchiveData) {
    doneJobsArchive.value = doneJobsArchiveData.value;
  }
  watch(
    doneJobsArchive,
    (newValue) => {
      localStorage.setItem("doneJobsArchive", JSON.stringify(newValue));
    },
    { deep: true }
  );
});

let archiveDoneJobsMonthYear = ref(null);
let archiveDoneJobsIndex = ref(null);
let archiveTotalJobs = ref(null);
let archiveTotalEur = ref(null);
let archiveTotalSecondJobs = ref(null);
let archiveTotalWaiting = ref(null);

function displayRoundCzk(number) {
  return Math.round(number);
}

function trimOver13months(objArray) {
  if (objArray.length > 13) {
    objArray.splice(13, objArray.length - 13);
  }
  return objArray;
}

// ------------------Proměnná podle jejíž hodnoty se zobrazuje nebo skrývá modal pro archivaci odjetých prací------------------
//

// Funkce který docílí toho, aby když jsou 2 práce v archivu se stejným
// datumem, tak aby byly v pořadí: provní práce, druhá práce
function hasSameValuesArchive(obj1, obj2) {
  if (
    obj1.date === obj2.date &&
    obj1.isSecondJob === true &&
    obj2.isSecondJob === false
  ) {
    // console.log(obj1.city + " should be swapped with " + obj2.city);
    return true;
  }
}

function swapIfIsSecondJobArchive(obj) {
  for (let i = 0; i < obj.length; i++) {
    for (let j = 0; j < obj[i].jobs.length; j++) {
      if (j + 1 < obj[i].jobs.length) {
        if (hasSameValuesArchive(obj[i].jobs[j], obj[i].jobs[j + 1])) {
          [obj[i].jobs[j], obj[i].jobs[j + 1]] = [
            obj[i].jobs[j + 1],
            obj[i].jobs[j],
          ];
        }
      }
    }
  }
  // console.log(doneJobsArchive.value);
  return obj;
}
//

let showArchiveDoneJobsModal = ref(false);

// Funkce která získá z api aktuální kruz EUR / CZK
function updateEurCzkRate() {
  const API_KEY = "82514d87dee3023eb8c649dc";
  const FROM_CURRENCY = "EUR";
  const TO_CURRENCY = "CZK";
  const AMOUNT = 1;

  axios
    .get(
      `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${FROM_CURRENCY}/${TO_CURRENCY}/${AMOUNT}`
    )
    .then((response) => {
      // console.log(
      //   "Z API získán nový kurz EUR/CZK: " + response.data.conversion_rate
      // );
      eurCzkRate.value = response.data.conversion_rate;
      // console.log(
      //   "Proběhla aktualizace kurzu EUR/CZK. Nová hodnota je: " +
      //     eurCzkRate.value
      // );
    })
    .catch((error) => {
      console.log(error);
    });
}
//
function openArchiveDoneJobsModal() {
  showArchiveDoneJobsModal.value = true;
  overflowHidden();
}

function closeArchiveDoneJobsModal() {
  showArchiveDoneJobsModal.value = false;
  overflowVisible();
}

// Funkce která z objektu doneJobs získá MM-YYYY z poslední práce
function getMMYYYYfromLastDoneJob(obj) {
  let month;
  if (String(new Date(obj[obj.length - 1].date).getMonth() + 1).length < 2) {
    month = "0" + String(new Date(obj[obj.length - 1].date).getMonth() + 1);
  } else {
    month = String(new Date(obj[obj.length - 1].date).getMonth() + 1);
  }

  let year = String(new Date(obj[obj.length - 1].date).getFullYear());

  let result = month + "-" + year;

  return result;
}

function getMMYYYYfromCurrentDoneJob(job) {
  let month;
  if (String(new Date(job).getMonth() + 1).length < 2) {
    month = "0" + String(new Date(job).getMonth() + 1);
  } else {
    month = String(new Date(job).getMonth() + 1);
  }

  let year = String(new Date(job).getFullYear());

  let result = month + "-" + year;

  return result;
}

// Funkce která získá index do kterého se budou vkládat doneJobs nebo,
// nebo vrátí 0 pro vytvoření nového objektu na pozici 0
function getIndex() {
  let result = false;
  archiveDoneJobsMonthYear.value = getMMYYYYfromLastDoneJob(doneJobs.value);

  if (doneJobsArchive.value.length > 0) {
    for (let i = 0; i < doneJobsArchive.value.length; i++) {
      if (doneJobsArchive.value[i].month === archiveDoneJobsMonthYear.value) {
        archiveDoneJobsIndex.value = i;

        result = true;
        break;
      } else {
        result = false;
      }
    }
  }
  return result;
}

function sortDoneJobsArchiveMonths(obj) {
  obj.sort((a, b) => {
    const dateA = new Date(a.month.split("-").reverse().join("-"));
    const dateB = new Date(b.month.split("-").reverse().join("-"));
    return dateB - dateA;
  });
  // console.log("sorted");
  // console.log(obj);
  return obj;
}

//
function archiveDoneJobs() {
  //
  // Vloží do archivu nový obejekt pro naplnění pracemi
  doneJobsArchive.value.unshift({
    month: archiveDoneJobsMonthYear.value,
    jobs: [],
    summary: {
      jobs: 0,
      eur: 0,
      czk: 0,
      secondJobs: 0,
      waiting: 0,
      eurCzkRate: 0,
      percentage: 0,
      payout: 0,
    },
  });
  //
  //
  // Prochází doneJobs a přidává adekvátní práce do archivu
  for (let i = 0; i < doneJobs.value.length; i++) {
    if (
      getMMYYYYfromCurrentDoneJob(doneJobs.value[i].date) ===
      archiveDoneJobsMonthYear.value
    ) {
      doneJobsArchive.value[0].jobs.unshift(doneJobs.value[i]);
    }
  }
  //
  //  Sčítá celkovou fakturaci €
  // archiveTotalEur.value = doneJobsArchive.value[0].jobs.reduce((acc, job) => {
  //   return acc + job.price;
  // }, 0);
  //
  // Přidává do objektu součet fakturace €
  doneJobsArchive.value[0].summary.eur = doneJobsArchive.value[0].jobs.reduce(
    (acc, job) => {
      return acc + job.price;
    },
    0
  );
  //
  //
  //
  //
  // Přidává do objektu součet fakturace Kč
  doneJobsArchive.value[0].summary.czk = parseInt(
    doneJobsArchive.value[0].summary.eur * eurCzkRate.value
  );
  //
  // Sčítá počet prací
  // archiveTotalJobs.value = doneJobsArchive.value[0].jobs.reduce((acc, job) => {
  //   if (job.city) {
  //     acc += 1;
  //   }
  //   return acc;
  // }, 0);
  //
  // Přidává do objektu součet prací
  doneJobsArchive.value[0].summary.jobs = doneJobsArchive.value[0].jobs.reduce(
    (acc, job) => {
      if (job.city) {
        acc += 1;
      }
      return acc;
    },
    0
  );
  //
  //
  //
  //
  // Sčítá počet dvojek
  // archiveTotalSecondJobs.value = doneJobsArchive.value[0].jobs.reduce(
  //   (acc, job) => {
  //     if (job.isSecondJob) {
  //       acc += 1;
  //     }
  //     return acc;
  //   },
  //   0
  // );
  //
  // Přidává do objektu součet dvojek
  doneJobsArchive.value[0].summary.secondJobs =
    doneJobsArchive.value[0].jobs.reduce((acc, job) => {
      if (job.isSecondJob) {
        acc += 1;
      }
      return acc;
    }, 0);
  //
  //
  //
  //
  // Sčítá počet čekačky
  // archiveTotalWaiting.value = doneJobsArchive.value[0].jobs.reduce(
  //   (acc, job) => {
  //     return acc + job.waiting;
  //   },
  //   0
  // );
  //
  // Přidává do objektu součet čekačky
  doneJobsArchive.value[0].summary.waiting =
    doneJobsArchive.value[0].jobs.reduce((acc, job) => {
      return acc + job.waiting;
    }, 0);
  //
  //
  // Přidává do objektu aktuální kurz EUR/CZK
  doneJobsArchive.value[0].summary.eurCzkRate = eurCzkRate.value;
  //
  // Přidává do objektu aktuální procenta z fakturace
  doneJobsArchive.value[0].summary.percentage = percentage.value;
  // Přidává do objektu výplatu
  doneJobsArchive.value[0].summary.payout = parseInt(
    doneJobsArchive.value[0].summary.czk * (percentage.value / 100)
  );
  //
  // Dosadí do doneJobs pouze nearchivované práce
  doneJobs.value = doneJobs.value.filter((job) => {
    const jobDate = new Date(job.date);
    return !(
      getMMYYYYfromCurrentDoneJob(jobDate) === archiveDoneJobsMonthYear.value
    );
  });
  // console.log(doneJobsArchive.value);
  sumDoneJobsPrices(doneJobs.value);
  sumDoneJobsCount(doneJobs.value);
  sumDoneJobsSecondJobs(doneJobs.value);
  sumDoneJobsWaiting(doneJobs.value);
  sortDoneJobsArchiveMonths(doneJobsArchive.value);
  trimOver13months(doneJobsArchive.value);
  updateEurCzkRate();
  swapIfIsSecondJobArchive(doneJobsArchive.value);
  closeArchiveDoneJobsModal();
}
//
function sortDoneJobsArchiveJobs(arr) {
  arr.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  });

  return arr;
}
//---------------------------------Update done job archive------------------------------------
//

function updateDoneJobsArchive() {
  for (let i = 0; i < doneJobs.value.length; i++) {
    if (
      getMMYYYYfromCurrentDoneJob(doneJobs.value[i].date) ===
      archiveDoneJobsMonthYear.value
    ) {
      doneJobsArchive.value[archiveDoneJobsIndex.value].jobs.push(
        doneJobs.value[i]
      );
      doneJobs.value.splice(i, 1);
      i--;
    }
  }
  sortDoneJobsArchiveJobs(
    doneJobsArchive.value[archiveDoneJobsIndex.value].jobs
  );
  //
  //  Sčítá celkovou fakturaci €
  // archiveTotalEur.value = doneJobsArchive.value[
  //   archiveDoneJobsIndex.value
  // ].jobs.reduce((acc, job) => {
  //   return acc + job.price;
  // }, 0);
  //
  // Přidává do objektu součet fakturace €
  doneJobsArchive.value[archiveDoneJobsIndex.value].summary.eur =
    doneJobsArchive.value[archiveDoneJobsIndex.value].jobs.reduce(
      (acc, job) => {
        return acc + job.price;
      },
      0
    );
  //
  //
  //
  //
  // Přidává do objektu součet fakturace Kč
  doneJobsArchive.value[archiveDoneJobsIndex.value].summary.czk = parseInt(
    doneJobsArchive.value[archiveDoneJobsIndex.value].summary.eur *
      doneJobsArchive.value[archiveDoneJobsIndex.value].summary.eurCzkRate
  );
  // console.log(
  //   `Aktualizováno doneJobsArchive.value[archiveDoneJobsIndex.value].summary.cz kpodle kurzu patřičného měsíce který je: ` +
  //     doneJobsArchive.value[archiveDoneJobsIndex.value].summary.eurCzkRate
  // );
  // Sčítá počet prací
  // archiveTotalJobs.value = doneJobsArchive.value[archiveDoneJobsIndex.value][
  //   "jobs"
  // ].reduce((acc, job) => {
  //   if (job.city) {
  //     acc += 1;
  //   }
  //   return acc;
  // }, 0);
  //
  // Přidává do objektu součet prací
  doneJobsArchive.value[archiveDoneJobsIndex.value].summary.jobs =
    doneJobsArchive.value[archiveDoneJobsIndex.value]["jobs"].reduce(
      (acc, job) => {
        if (job.city) {
          acc += 1;
        }
        return acc;
      },
      0
    );
  //
  //
  //
  //
  // Sčítá počet dvojek
  // archiveTotalSecondJobs.value = doneJobsArchive.value[
  //   archiveDoneJobsIndex.value
  // ].jobs.reduce((acc, job) => {
  //   if (job.isSecondJob) {
  //     acc += 1;
  //   }
  //   return acc;
  // }, 0);
  //
  // Přidává do objektu součet dvojek
  doneJobsArchive.value[archiveDoneJobsIndex.value].summary.secondJobs =
    doneJobsArchive.value[archiveDoneJobsIndex.value].jobs.reduce(
      (acc, job) => {
        if (job.isSecondJob) {
          acc += 1;
        }
        return acc;
      },
      0
    );
  //
  //
  //
  //
  // Sčítá počet čekačky
  // archiveTotalWaiting.value = doneJobsArchive.value[
  //   archiveDoneJobsIndex.value
  // ].jobs.reduce((acc, job) => {
  //   return acc + job.waiting;
  // }, 0);
  //
  // Přidává do objektu součet čekačky
  doneJobsArchive.value[archiveDoneJobsIndex.value].summary.waiting =
    doneJobsArchive.value[archiveDoneJobsIndex.value].jobs.reduce(
      (acc, job) => {
        return acc + job.waiting;
      },
      0
    );
  //
  // Přidává do objektu součet Payout
  doneJobsArchive.value[archiveDoneJobsIndex.value].summary.payout = parseInt(
    doneJobsArchive.value[archiveDoneJobsIndex.value].summary.czk *
      (doneJobsArchive.value[archiveDoneJobsIndex.value].summary.percentage /
        100)
  );
  //

  // console.log(doneJobsArchive.value);
  sumDoneJobsPrices(doneJobs.value);
  sumDoneJobsCount(doneJobs.value);
  sumDoneJobsSecondJobs(doneJobs.value);
  sumDoneJobsWaiting(doneJobs.value);
  swapIfIsSecondJob(doneJobsArchive.value);
  closeArchiveDoneJobsModal();
}
//

//
//
// Funkce která provede kontrolu a rozhodne kterou další funkci spustí
function checkBeforArchive() {
  if (getIndex() === false) {
    archiveDoneJobs();
  } else {
    updateDoneJobsArchive();
  }
}

let showArchive = ref(false);

function openArchiveModal() {
  showArchive.value = true;
  overflowHidden();
}

function closeArchiveModal() {
  showArchive.value = false;
  overflowVisible();
}

//---------------------------------Edit done job archive------------------------------------
//

function sortJobs123(arr) {
  arr.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  });
  return arr;
}

// ------------------------------ARCHIVE DELETE MONTH-----------------------
//
let showArchiveDeleteMonth = ref(false);

let temporaryDeleteMonthIndex = ref(null);

function openArchiveDeleteMonthModal() {
  showArchiveDeleteMonth.value = true;
  overflowHidden();
}

function closeArchiveDeleteMonthModal() {
  showArchiveDeleteMonth.value = false;
  overflowVisible();
}

function openArchiveDeleteMonthWithData(archiveIndex) {
  temporaryDeleteMonthIndex.value = archiveIndex;
  openArchiveDeleteMonthModal();
}

function deleteArchiveMonth() {
  doneJobsArchive.value.splice(temporaryDeleteMonthIndex.value, 1);
  closeArchiveDeleteMonthModal();
}

// ------------------------------ARCHIVE DELETE JOB-------------------------
//
let showArchiveDeleteJob = ref(false);

let temporaryDeleteArchiveIndex = ref(null);
let temporaryDeleteJobIndex = ref(null);

function openArchiveDeleteJobModal() {
  showArchiveDeleteJob.value = true;
  overflowHidden();
}

function closeArchiveDeleteJobModal() {
  showArchiveDeleteJob.value = false;
  overflowVisible();
  temporaryDeleteArchiveIndex.value = null;
  temporaryDeleteJobIndex.value = null;
}

function openArchiveDeleteJobWithData(archiveIndex, jobIndex) {
  temporaryDeleteArchiveIndex.value = archiveIndex;
  temporaryDeleteJobIndex.value = jobIndex;
  openArchiveDeleteJobModal();
}

function refreshSumEur(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].hasOwnProperty("price")) {
      sum += arr[i].price;
    }
  }
  return sum;
}

function refreshSumJobs(arr) {
  return arr.length;
}

function refreshSumSecondJobs(arr) {
  let accumulator = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].hasOwnProperty("isSecondJob")) {
      if (arr[i].isSecondJob === true) {
        accumulator++;
      }
    }
  }
  return accumulator;
}

function refreshSumWaiting(arr) {
  let accumulator = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].hasOwnProperty("waiting")) {
      accumulator += arr[i].waiting;
    }
  }
  return accumulator;
}

function deleteArchiveJob() {
  doneJobsArchive.value[temporaryDeleteArchiveIndex.value].jobs.splice(
    temporaryDeleteJobIndex.value,
    1
  );

  doneJobsArchive.value[temporaryDeleteArchiveIndex.value].summary.eur =
    refreshSumEur(
      doneJobsArchive.value[temporaryDeleteArchiveIndex.value].jobs
    );

  doneJobsArchive.value[temporaryDeleteArchiveIndex.value].summary.czk =
    parseInt(
      doneJobsArchive.value[temporaryDeleteArchiveIndex.value].summary.eur *
        doneJobsArchive.value[temporaryDeleteArchiveIndex.value].summary
          .eurCzkRate
    );

  doneJobsArchive.value[temporaryDeleteArchiveIndex.value].summary.payout =
    parseInt(
      doneJobsArchive.value[temporaryDeleteArchiveIndex.value].summary.czk *
        (doneJobsArchive.value[temporaryDeleteArchiveIndex.value].summary
          .percentage /
          100)
    );

  doneJobsArchive.value[temporaryDeleteArchiveIndex.value].summary.jobs =
    refreshSumJobs(
      doneJobsArchive.value[temporaryDeleteArchiveIndex.value].jobs
    );

  doneJobsArchive.value[temporaryDeleteArchiveIndex.value].summary.secondJobs =
    refreshSumSecondJobs(
      doneJobsArchive.value[temporaryDeleteArchiveIndex.value].jobs
    );

  doneJobsArchive.value[temporaryDeleteArchiveIndex.value].summary.waiting =
    refreshSumWaiting(
      doneJobsArchive.value[temporaryDeleteArchiveIndex.value].jobs
    );
  closeArchiveDeleteJobModal();
}

// ------------------------------MENU - Jak používat aplikaci-------------------------
//
let showMenuAppManual = ref(false);

function openMenuAppManual() {
  showMenuAppManual.value = true;
  overflowHidden();
}

function closeMenuAppManual() {
  showMenuAppManual.value = false;
  overflowVisible();
}

// -------------------------------------------------------------------------------------
//
let showCopyToClipboardPopup = ref(false);

function openCopyToClipboardPopup() {
  showCopyToClipboardPopup.value = true;
}

function closeCopyToClipboardPopup() {
  showCopyToClipboardPopup.value = false;
}

function copyJobDetails(date, cmr, city, zipcode, weight, price) {
  openCopyToClipboardPopup();

  // Vytvoření elementu textarea
  let textArea = document.createElement("textarea");
  // Nastavení hodnoty pro textarea
  textArea.value =
    displayCZdateFormat(date) +
    " " +
    cmr +
    " " +
    city +
    " " +
    zipcode +
    " " +
    displayStandartWeightFormat(weight) +
    " " +
    price +
    " €";
  // Přidání elementu na stránku
  document.body.appendChild(textArea);
  // Výběr textu v textarea
  textArea.select();
  // Kopírování do schránky
  document.execCommand("copy");
  // Odstranění textarea z dokumentu
  document.body.removeChild(textArea);

  setTimeout(function () {
    closeCopyToClipboardPopup();
  }, 1500);
}

// -------------------------------------------------------------------------------------
//
function sendDataByEmail(archiveIndex) {
  let archive = doneJobsArchive.value[archiveIndex];

  let archiveMonth = archive["month"];

  let archiveJobs = archive["jobs"];

  const archiveSummary = archive["summary"];

  const jobsData =
    archiveMonth +
    "\n\n" +
    archiveJobs
      .map(
        (job) =>
          `${displayCZdateFormatDDMM(job.date)}\u00A0\u00A0${
            job.cmr
          }\u00A0\u00A0${job.city}\u00A0\u00A0${
            job.zipcode
          }\u00A0\u00A0${displayStandartWeightFormat(job.weight)}\u00A0\u00A0${
            job.price
          }€`
      )
      .join("\n");

  const jobsSummary = `\n\nFakturace:\u00A0\u00A0${archiveSummary["eur"]} €\nPrací:\u00A0\u00A0${archiveSummary["jobs"]}\nDruhých prací:\u00A0\u00A0${archiveSummary["secondJobs"]}\nČekání:\u00A0\u00A0${archiveSummary["waiting"]}`;

  const encodedJobsData = encodeURIComponent(jobsData);

  const encodedJobsSummary = encodeURIComponent(jobsSummary);

  const subject = `Souhrn\u00A0prací\u00A0za\u00A0${archiveMonth}`;

  const mailto = `mailto:?subject=${subject}&body=${encodedJobsData}\n${encodedJobsSummary}`;

  window.location.href = mailto;
}

// -------------------------------------------------------------------------------------
//
let showMenuAddToHomeScreen = ref(false);

function openMenuAddToHomeScreen() {
  showMenuAddToHomeScreen.value = true;
  overflowHidden();
}

function closeMenuAddToHomeScreen() {
  showMenuAddToHomeScreen.value = false;
  overflowVisible();
}

// -------------------------------------------------------------------------------------
//
let showMenuDataCollection = ref(false);

function openMenuDataCollection() {
  showMenuDataCollection.value = true;
  overflowHidden();
}

function closeMenuDataCollection() {
  showMenuDataCollection.value = false;
  overflowVisible();
}

// -------------------------------------------------------------------------------------
//
let showMenuContact = ref(false);

function openMenuContact() {
  showMenuContact.value = true;
  overflowHidden();
}

function closeMenuContact() {
  showMenuContact.value = false;
  overflowVisible();
}

// Srcoll to top Archive Modal
//
const archiveModal = ref(null);
const showBackToTopButtonArchiveModal = ref(false);

function handleScrollArchiveModal() {
  if (archiveModal.value.scrollTop > 800) {
    showBackToTopButtonArchiveModal.value = true;
  } else {
    showBackToTopButtonArchiveModal.value = false;
  }
}

function scrollToTopArchiveModal() {
  archiveModal.value.scrollTo({
    top: 0,
    behaviour: "smooth",
  });
}

// Srcoll to top Menu app manual
//
const menuAppManualSrollRef = ref(null);
const showBackToTopButtonMenuAppManual = ref(false);

function handleSrollMenuAppManual() {
  if (menuAppManualSrollRef.value.scrollTop > 800) {
    showBackToTopButtonMenuAppManual.value = true;
  } else {
    showBackToTopButtonMenuAppManual.value = false;
  }
}

function scrollToTopMenuAppManual() {
  menuAppManualSrollRef.value.scrollTo({
    top: 0,
    behaviour: "smooth",
  });
}

// Srcoll to top Menu add to homescreen
//
const menuAddToHomescreenScrollRef = ref(null);
const showBackToTopButtonMenuAddToHomescreen = ref(false);

function handleScrollMenuAddToHomescreen() {
  if (menuAddToHomescreenScrollRef.value.scrollTop > 800) {
    showBackToTopButtonMenuAddToHomescreen.value = true;
  } else {
    showBackToTopButtonMenuAddToHomescreen.value = false;
  }
}

function scrollToTopMenuAddToHomescreen() {
  menuAddToHomescreenScrollRef.value.scrollTo({
    top: 0,
    behaviour: "smooth",
  });
}

function overflowHidden() {
  document.body.style.overflow = "hidden";
}

function overflowVisible() {
  document.body.style.overflow = "visible";
}
</script>

<template>
  <div id="app">
    <div v-if="authenticated">
      <div
        v-show="showNewVersioModal"
        class="new-version-message-container modal-main-container"
      >
        <div class="modal-inner-container">
          <div class="new-version-message-heading modal-text">
            Nová verze webové aplikace emTRUCK je na světě!
          </div>
          <ul class="new-version-ul">
            <li>Zaregistrujte se pomocí libovolného existujícího e-mailu.</li>
            <br />
            <li>
              Potvrďte registraci kliknutím na odkaz který Vám přijde do vaší
              e-mailové schránky.
            </li>
            <br />
            <li>A už se Vám nestane že by jste přišli o uložené práce!</li>
          </ul>
          <div class="modal-text">
            Novou verzi aplikace najdete na adrese:<span
              ><a class="modal-text" href="#">www.emTRUCK.net</a></span
            >
          </div>
          <div class="modal-text danger">
            Tato stará verze aplikace bude k dispozici do 31.11.2023
          </div>
          <div class="modal-text">
            <button @click="closeNewVersionModal">Zavřít toto okno</button>
          </div>
        </div>
      </div>
      <!----------------------------------------  Part 0 - Navbar  --------------------------------------------->
      <!--  -->
      <div class="navbar-container">
        <div class="navbar-terminal">
          <p class="terminal-text">terminál:&nbsp&nbsp</p>
          <p class="choosed-terminal">
            {{ displayStandartTerminal(selectedTerminalOption) }}
          </p>
          <img
            src="./assets/navbar_edit_icon2.svg"
            alt="edit-terminal-button"
            @click="openTerminalSelector"
          />
        </div>

        <div class="navbar-menu-line"></div>

        <div class="navbar-menu" @click="openMenuModal">
          <img src="./assets/navbar_menu_icon2.svg" alt="navbar-menu-icon" />
        </div>
      </div>
      <div class="main-container">
        <!----------------------------------------  Part 1 - Search bar  --------------------------------------->
        <!--  -->
        <div class="search-bar-container">
          <!--  -->

          <input
            id="input"
            @input="valueChanged"
            ref="input"
            placeholder="Obec / PSC"
            autofocus
          />

          <img
            @click="deleteUserInput"
            v-show="query !== ''"
            src="./assets/cross_button.svg"
            alt="clear-text-button"
          />
        </div>

        <div class="add-own-job-container" v-show="filteredCities.length === 0">
          <img
            src="./assets/add-button.svg"
            alt="add-own-done-job-button"
            @click="openAddOwnDoneJobModal"
          />
        </div>

        <!----------------------------------------  Part 2 - Search results  ----------------------------------->
        <!--  -->
        <ul v-show="showSearchResults">
          <li class="result-container" v-for="(city, index) in filteredCities">
            <div class="result-first-line">
              <div class="city-zipcode-container">
                <div class="city">{{ city.city }}</div>
                <div class="zipcode">{{ city.zipcode }}</div>
              </div>
            </div>

            <div class="result-second-line">
              <div class="result-second-line-item-left">
                <div class="result-second-line-item-upTo27t">
                  <p class="weight">&lt27t</p>
                  <p class="price">{{ city.weightTo27t + "€" }}</p>
                </div>
              </div>

              <div class="result-second-line-item-middle">
                <div
                  class="add-button"
                  @click="
                    openAddDoneJobModalWithData(
                      index,
                      city.objIndex,
                      city.city,
                      city.zipcode,
                      city.weightTo27t,
                      city.weightTo34t,
                      city.terminal
                    )
                  "
                >
                  <img
                    class="add-button-img"
                    src="./assets/add-button.svg"
                    alt="add-job-button"
                  />
                </div>
              </div>

              <div class="result-second-line-item-right">
                <div class="result-second-line-item-upTo34t">
                  <p class="weight">&lt34t</p>
                  <p class="price">{{ city.weightTo34t + "€" }}</p>
                </div>
              </div>
            </div>
          </li>
        </ul>

        <!----------------------------------------  Part 3 - Add done job modal  ------------------------------->
        <!--  -->
        <Transition name="scale">
          <div
            role="dialog"
            aria-modal="true"
            class="modal-main-container"
            v-if="showAddDoneJobModal"
          >
            <div class="modal-inner-container">
              <form class="done-job-form" @submit.prevent="addDoneJob">
                <div class="done-job-form-container-item">
                  <div class="done-job-input-field-date-container">
                    <label
                      for="date"
                      class="done-job-input-label done-job-input-label-required"
                      >Datum</label
                    >
                    <input
                      type="date"
                      class="done-job-input-field"
                      id="dateInput"
                      v-model="temporaryAddDoneJobDateInput"
                    />
                  </div>
                </div>

                <div class="done-job-form-container-item">
                  <label
                    for="text"
                    class="done-job-input-label done-job-input-label-required"
                    >CMR</label
                  >
                  <input
                    type="text"
                    class="done-job-input-field"
                    id="cmrInput"
                    maxlength="20"
                    v-model="temporaryAddDoneJobCmrInput"
                  />
                </div>

                <div class="done-job-form-container-item-radios">
                  <label
                    for="chooseWeight"
                    class="done-job-input-label done-job-input-label-required"
                    >Váha</label
                  >
                  <div class="done-job-input-field-radios-container">
                    <div class="done-job-input-field-radios-1">
                      <label for="chooseWeight">&lt27t</label>
                      <input
                        type="radio"
                        class="done-job-input-field-checkbox"
                        name="chooseWeight"
                        id="chooseWeightUpTo27"
                        value="weightTo27t"
                        v-model="temporaryAddDoneJobWeightInput"
                      />
                    </div>

                    <div class="done-job-input-field-radios-2">
                      <label for="chooseWeight">&lt34t</label>
                      <input
                        type="radio"
                        class="done-job-input-field-checkbox"
                        name="chooseWeight"
                        id="chooseWeightUpTo34"
                        value="weightTo34t"
                        v-model="temporaryAddDoneJobWeightInput"
                      />
                    </div>
                  </div>
                </div>

                <div class="done-job-form-container-item">
                  <div class="done-job-input-field-radios-container">
                    <label for="secondJob" class="done-job-input-label"
                      >Druhá práce</label
                    >
                    <input
                      type="checkbox"
                      class="done-job-input-field-checkbox"
                      name="secondJob"
                      id="secondJobInput"
                      v-model="temporaryAddDoneJobIsSecondJobInput"
                    />
                  </div>
                </div>

                <div class="done-job-form-container-item">
                  <label for="waiting" class="done-job-input-label"
                    >Čekání</label
                  >
                  <input
                    type="text"
                    inputmode="numeric"
                    class="done-job-input-field"
                    id="waitingInput"
                    maxlength="2"
                    v-model="temporaryAddDoneJobWaitingInput"
                  />
                </div>

                <div class="modal-buttons-container">
                  <button
                    class="submit-green modal-buttons"
                    type="submit"
                  ></button>
                  <button
                    class="decline-red modal-buttons"
                    type="button"
                    @click="closeAddDoneJobModal"
                  ></button>
                </div>
              </form>
            </div>
          </div>
        </Transition>

        <!----------------------------------------  Part 4 - Summary section  ---------------------------------->
        <!--  -->
        <div class="summary-container-main" v-if="showSummary">
          <div class="jobs-summary-container-left">
            <div class="jobs-summary-container-left-top">
              <div
                class="jobs-summary-price-eur"
                v-bind:textContent="eurTotal.toLocaleString() + ' €'"
              ></div>
              <div
                class="jobs-summary-price-czk"
                v-bind:textContent="czkTotal.toLocaleString() + ' Kč'"
              ></div>
            </div>
            <div class="jobs-summary-container-left-bottom">
              <div
                id="percentage-value"
                class="jobs-summary-invoicing-percentage-value"
                v-bind:textContent="percentage + '%'"
                @click="openPercentageModal"
              ></div>

              <div
                class="jobs-summary-invoicing-payout"
                v-bind:textContent="payoutTotal.toLocaleString() + ' Kč'"
              ></div>
            </div>
          </div>

          <div class="jobs-summary-container-right">
            <div class="jobs-summary-container-right-item">
              <div class="jobs-summary-container-right-key">
                <img
                  class="summary-icon"
                  src="./assets/doneJobs_icon.svg"
                  alt="done-jobs-icon"
                />
              </div>
              <div class="jobs-summary-container-right-value">
                {{ doneJobsTotal }}
              </div>
            </div>
            <div class="jobs-summary-container-right-item">
              <div class="jobs-summary-container-right-key">
                <img
                  class="summary-icon"
                  src="./assets/secondJobs_icon.svg"
                  alt="second-jobs-icon"
                />
              </div>
              <div class="jobs-summary-container-right-value">
                {{ secondJobsTotal }}
              </div>
            </div>
            <div
              class="jobs-summary-container-right-item jobs-sumarry-container-right-item-last"
            >
              <div class="jobs-summary-container-right-key">
                <img
                  class="summary-icon"
                  src="./assets/waiting_icon.svg"
                  alt="waiting-icon"
                />
              </div>
              <div class="jobs-summary-container-right-value">
                {{ waitingTotal }}
              </div>
            </div>
          </div>
        </div>

        <!----------------------------------------  Part 5 - Done jobs section  -------------------------------->
        <!--  -->
        <Transition name="slide-top-slow">
          <div v-if="showCopyToClipboardPopup" class="copy-to-clipboard-popup">
            <div>Zkopírováno do schránky</div>
          </div>
        </Transition>
        <ul v-show="showDoneJobs">
          <li class="done-jobs-container" v-for="(job, index) in doneJobs">
            <div class="done-jobs-first-line">
              <div class="done-jobs-item job-edit-date">
                <img
                  @click="openCorrectEditDoneJobModal(index)"
                  class="edit-job-button-img"
                  src="./assets/edit_button.svg"
                  alt="edit-button"
                />
              </div>
              <div
                class="done-jobs-day-date-container"
                @click="
                  copyJobDetails(
                    job.date,
                    job.cmr,
                    job.city,
                    job.zipcode,
                    job.weight,
                    job.price
                  )
                "
              >
                <div class="done-jobs-item job-day">{{ job.day }}</div>
                <div class="done-jobs-item job-date">
                  {{ displayCZdateFormat(job.date) }}
                </div>
              </div>

              <div class="done-jobs-item job-delete-job">
                <img
                  @click="openDeleteDoneJobModalWithData(index)"
                  class="delete-job-button-img"
                  src="./assets/delete_job.svg"
                  alt="delete-job-button"
                />
              </div>
            </div>

            <div class="done-jobs-job-line">
              <div class="done-jobs-item job-city">{{ job.city }}</div>
            </div>
            <div class="done-jobs-zipcode-line">
              <div class="done-jobs-item">{{ job.zipcode }}</div>
            </div>
            <div class="done-jobs-cmr-line">
              <div class="done-jobs-item job-cmr">{{ job.cmr }}</div>
            </div>
            <div class="done-jobs-last-line">
              <div class="second-job-sign-container" v-show="job.isSecondJob">
                <img
                  src="./assets/secondJobs_icon_done_job.svg"
                  alt="second-job-icon"
                />
              </div>
              <div class="done-jobs-item job-weight">
                {{ displayStandartWeightFormat(job.weight) }}
              </div>
              <div class="done-jobs-item job-price">{{ job.price + "€" }}</div>
              <div class="waiting-sign-container" v-show="job.waiting > 0">
                <img
                  src="./assets/waiting_icon_done_job.svg"
                  alt="waiting-icon"
                />
                <p v-bind:textContent="job.waiting"></p>
              </div>
            </div>
          </li>
        </ul>
        <div
          class="archive-jobs-button-container pos-relative"
          v-show="doneJobs.length > 0"
          v-if="showArchiveJobsBtn"
        >
          <button
            class="archive-jobs-btn pos-relative"
            @click="openArchiveDoneJobsModal"
          >
            Archivovat práce
          </button>
          <img
            src="./assets/i.svg"
            alt="info-icon"
            class="info-icon"
            @click="showPopup = true"
          />
        </div>

        <!----------------------------------------  Part 6 - Archive info-icon modal section  ------------------>
        <!--  -->
        <div
          role="dialog"
          aria-modal="true"
          class="modal-main-container"
          v-if="showPopup"
        >
          <div class="modal-inner-container pos-relative">
            <div class="modal-text">
              Kliknutím na tlačítko "Archivovat práce" přesunete práce z
              nejstaršího měsíce ve Vašem výpisu do Archivu.
            </div>

            <div class="modal-text">
              Před touto akcí si pečlivě překontrolujte správnost vyplněných
              údajú a až potom proveďte tuto akci!
            </div>
            <div @click="showPopup = false" class="modal-close-button"></div>
          </div>
        </div>

        <!----------------------------------------  Part 7 - Percentage modal section  ------------------------->
        <!--  -->
        <Transition name="slide-left">
          <div
            role="dialog"
            aria-modal="true"
            class="modal-main-container"
            v-if="showPercentageModal"
          >
            <div class="modal-inner-container">
              <form class="done-job-form" @submit.prevent="setPercentage">
                <div class="done-job-form-container-item">
                  <input
                    type="text"
                    inputmode="numeric"
                    class="done-job-input-field"
                    id="percentageInput"
                    maxlength="2"
                    placeholder="%"
                  />
                </div>

                <div class="modal-buttons-container">
                  <button
                    class="submit-green modal-buttons"
                    type="button"
                    @click="setPercentage"
                  ></button>
                  <button
                    class="decline-red modal-buttons"
                    type="button"
                    @click="closePercentageModal"
                  ></button>
                </div>
              </form>
            </div>
          </div>
        </Transition>

        <!----------------------------------------  Part 8 - Edit done job modal section  ---------------------->
        <!--  -->
        <Transition name="fade">
          <div
            role="dialog"
            aria-modal="true"
            class="modal-main-container"
            v-if="showEditDoneJobModal"
          >
            <div class="modal-inner-container">
              <form class="done-job-form" @submit.prevent="updateDoneJob">
                <div class="done-job-form-container-item">
                  <div class="done-job-input-field-date-container">
                    <label
                      for="date"
                      class="done-job-input-label done-job-input-label-required"
                      >Datum</label
                    >
                    <input
                      type="date"
                      class="done-job-input-field"
                      id="edit-done-job-dateInput"
                      v-model="temporaryEditDoneJobDateInput"
                    />
                  </div>
                </div>

                <div class="done-job-form-container-item">
                  <label
                    for="text"
                    class="done-job-input-label done-job-input-label-required"
                    >CMR</label
                  >
                  <input
                    type="text"
                    class="done-job-input-field"
                    id="edit-done-job-cmrInput"
                    maxlength="20"
                    v-model="temporaryEditDoneJobCmrInput"
                  />
                </div>

                <div class="done-job-form-container-item-radios">
                  <label
                    for="chooseWeight"
                    class="done-job-input-label done-job-input-label-required"
                    >Váha</label
                  >
                  <div class="done-job-input-field-radios-container">
                    <div class="done-job-input-field-radios-1">
                      <label for="chooseWeight">&lt27t</label>
                      <input
                        type="radio"
                        class="done-job-input-field-checkbox"
                        name="chooseWeight"
                        id="edit-done-job-chooseWeightUpTo27"
                        value="weightTo27t"
                        v-model="temporaryEditDoneJobWeightInput"
                      />
                    </div>

                    <div class="done-job-input-field-radios-2">
                      <label for="chooseWeight">&lt34t</label>
                      <input
                        type="radio"
                        class="done-job-input-field-checkbox"
                        name="chooseWeight"
                        id="edit-done-job-chooseWeightUpTo34"
                        value="weightTo34t"
                        v-model="temporaryEditDoneJobWeightInput"
                      />
                    </div>
                  </div>
                </div>

                <div class="done-job-form-container-item">
                  <div class="done-job-input-field-radios-container">
                    <label for="secondJob" class="done-job-input-label"
                      >Druhá práce</label
                    >
                    <input
                      type="checkbox"
                      class="done-job-input-field-checkbox"
                      name="secondJob"
                      id="edit-done-job-secondJobInput"
                      v-model="temporaryEditDoneJobIsSecondJobInput"
                    />
                  </div>
                </div>

                <div class="done-job-form-container-item">
                  <label for="waiting" class="done-job-input-label"
                    >Čekání</label
                  >
                  <input
                    type="text"
                    inputmode="numeric"
                    class="done-job-input-field"
                    id="edit-done-job-waitingInput"
                    maxlength="2"
                    v-model="temporaryEditDoneJobWaitingInput"
                  />
                </div>

                <div class="modal-buttons-container">
                  <button
                    class="submit-green modal-buttons"
                    type="submit"
                  ></button>
                  <button
                    class="decline-red modal-buttons"
                    type="button"
                    @click="closeEditDoneJobModal"
                  ></button>
                </div>
              </form>
            </div>
          </div>
        </Transition>

        <!----------------------------------------  Part 9 - Add own done job modal  --------------------------->
        <!--  -->
        <Transition name="scale">
          <div
            role="dialog"
            aria-modal="true"
            class="modal-main-container"
            v-if="showAddOwnDoneJobModal"
          >
            <div class="modal-inner-container">
              <form class="done-job-form" @submit.prevent="addOwnDoneJob">
                <div class="done-job-form-container-item">
                  <div class="done-job-input-field-date-container">
                    <label
                      for="date"
                      class="done-job-input-label done-job-input-label-required"
                      >Datum</label
                    >
                    <input
                      type="date"
                      class="done-job-input-field"
                      id="add-own-done-job-dateInput"
                      v-model="temporaryAddOwnDoneJobDateInput"
                    />
                  </div>
                </div>

                <div class="done-job-form-container-item">
                  <label
                    for="text"
                    class="done-job-input-label done-job-input-label-required"
                    >CMR</label
                  >
                  <input
                    type="text"
                    class="done-job-input-field"
                    id="add-own-done-job-cmrInput"
                    maxlength="20"
                    v-model="temporaryAddOwnDoneJobCmrInput"
                  />
                </div>

                <div class="done-job-form-container-item">
                  <label
                    for="city"
                    class="done-job-input-label done-job-input-label-required"
                    >Město</label
                  >
                  <input
                    type="text"
                    class="done-job-input-field"
                    id="add-own-done-job-cityInput"
                    v-model="temporaryAddOwnDoneJobCityInput"
                  />
                </div>

                <div class="done-job-form-container-item">
                  <label
                    for="zipcode"
                    class="done-job-input-label done-job-input-label-required"
                    >PSČ</label
                  >
                  <input
                    type="text"
                    class="done-job-input-field"
                    id="add-own-done-job-zipcodeInput"
                    v-model="temporaryAddOwnDoneJobZipcodeInput"
                  />
                </div>

                <div class="done-job-form-container-item-radios">
                  <label
                    for="chooseWeight"
                    class="done-job-input-label done-job-input-label-required"
                    >Váha</label
                  >
                  <div class="done-job-input-field-radios-container">
                    <div class="done-job-input-field-radios-1">
                      <label for="chooseWeight">&lt27t</label>
                      <input
                        type="radio"
                        class="done-job-input-field-checkbox"
                        name="chooseWeight"
                        id="add-own-done-job-chooseWeightUpTo27"
                        value="weightTo27t"
                        v-model="temporaryAddOwnDoneJobWeightInput"
                      />
                    </div>

                    <div class="done-job-input-field-radios-2">
                      <label for="chooseWeight">&lt34t</label>
                      <input
                        type="radio"
                        class="done-job-input-field-checkbox"
                        name="chooseWeight"
                        id="add-own-done-job-chooseWeightUpTo34"
                        value="weightTo34t"
                        v-model="temporaryAddOwnDoneJobWeightInput"
                      />
                    </div>
                  </div>
                </div>

                <div class="done-job-form-container-item">
                  <label
                    for="terminal"
                    class="done-job-input-label done-job-input-label-required"
                    >Terminál</label
                  >
                  <input
                    type="text"
                    class="done-job-input-field"
                    id="add-own-done-job-terminalInput"
                    v-model="temporaryAddOwnDoneJobTerminalInput"
                  />
                </div>

                <div class="done-job-form-container-item">
                  <label for="price" class="done-job-input-label"
                    >Cena (€)</label
                  >
                  <input
                    type="text"
                    inputmode="numeric"
                    class="done-job-input-field"
                    id="add-own-done-job-priceInput"
                    v-model="temporaryAddOwnDoneJobPriceInput"
                  />
                </div>

                <div class="done-job-form-container-item">
                  <div class="done-job-input-field-radios-container">
                    <label for="secondJob" class="done-job-input-label"
                      >Druhá práce</label
                    >
                    <input
                      type="checkbox"
                      class="done-job-input-field-checkbox"
                      name="secondJob"
                      id="add-own-done-job-secondJobInput"
                      v-model="temporaryAddOwnDoneJobIsSecondJobInput"
                    />
                  </div>
                </div>

                <div class="done-job-form-container-item">
                  <label for="waiting" class="done-job-input-label"
                    >Čekání</label
                  >
                  <input
                    type="text"
                    inputmode="numeric"
                    class="done-job-input-field"
                    id="add-own-done-job-waitingInput"
                    maxlength="2"
                    v-model="temporaryAddOwnDoneJobWaitingInput"
                  />
                </div>

                <div class="modal-buttons-container">
                  <button
                    class="submit-green modal-buttons"
                    type="submit"
                  ></button>
                  <button
                    class="decline-red modal-buttons"
                    type="button"
                    @click="closeAddOwnDoneJobModal"
                  ></button>
                </div>
              </form>
            </div>
          </div>
        </Transition>

        <!----------------------------------------  Part 10 - Edit own done job modal section  ----------------->
        <!--  -->
        <Transition name="fade">
          <div
            role="dialog"
            aria-modal="true"
            class="modal-main-container"
            v-if="showEditOwnDoneJobModal"
          >
            <div class="modal-inner-container">
              <form class="done-job-form" @submit.prevent="updateOwnDoneJob">
                <div class="done-job-form-container-item">
                  <div class="done-job-input-field-date-container">
                    <label
                      for="date"
                      class="done-job-input-label done-job-input-label-required"
                      >Datum</label
                    >
                    <input
                      type="date"
                      class="done-job-input-field"
                      id="add-own-done-job-dateInput"
                      v-model="temporaryEditOwnDoneJobDateInput"
                    />
                  </div>
                </div>

                <div class="done-job-form-container-item">
                  <label
                    for="text"
                    class="done-job-input-label done-job-input-label-required"
                    >CMR</label
                  >
                  <input
                    type="text"
                    class="done-job-input-field"
                    id="add-own-done-job-cmrInput"
                    maxlength="20"
                    v-model="temporaryEditOwnDoneJobCmrInput"
                  />
                </div>

                <div class="done-job-form-container-item">
                  <label
                    for="city"
                    class="done-job-input-label done-job-input-label-required"
                    >Město</label
                  >
                  <input
                    type="text"
                    class="done-job-input-field"
                    id="add-own-done-job-cityInput"
                    v-model="temporaryEditOwnDoneJobCityInput"
                  />
                </div>

                <div class="done-job-form-container-item">
                  <label
                    for="zipcode"
                    class="done-job-input-label done-job-input-label-required"
                    >PSČ</label
                  >
                  <input
                    type="text"
                    class="done-job-input-field"
                    id="add-own-done-job-zipcodeInput"
                    v-model="temporaryEditOwnDoneJobZipcodeInput"
                  />
                </div>

                <div class="done-job-form-container-item-radios">
                  <label
                    for="chooseWeight"
                    class="done-job-input-label done-job-input-label-required"
                    >Váha</label
                  >
                  <div class="done-job-input-field-radios-container">
                    <div class="done-job-input-field-radios-1">
                      <label for="chooseWeight">&lt27t</label>
                      <input
                        type="radio"
                        class="done-job-input-field-checkbox"
                        name="chooseWeight"
                        id="add-own-done-job-chooseWeightUpTo27"
                        value="weightTo27t"
                        v-model="temporaryEditOwnDoneJobWeightInput"
                      />
                    </div>

                    <div class="done-job-input-field-radios-2">
                      <label for="chooseWeight">&lt34t</label>
                      <input
                        type="radio"
                        class="done-job-input-field-checkbox"
                        name="chooseWeight"
                        id="add-own-done-job-chooseWeightUpTo34"
                        value="weightTo34t"
                        v-model="temporaryEditOwnDoneJobWeightInput"
                      />
                    </div>
                  </div>
                </div>

                <div class="done-job-form-container-item">
                  <label
                    for="terminal"
                    class="done-job-input-label done-job-input-label-required"
                    >Terminál</label
                  >
                  <input
                    type="text"
                    class="done-job-input-field"
                    id="add-own-done-job-terminalInput"
                    v-model="temporaryEditOwnDoneJobTerminalInput"
                  />
                </div>

                <div class="done-job-form-container-item">
                  <label for="price" class="done-job-input-label"
                    >Cena (€)</label
                  >
                  <input
                    type="text"
                    inputmode="numeric"
                    class="done-job-input-field"
                    id="add-own-done-job-priceInput"
                    v-model="temporaryEditOwnDoneJobPriceInput"
                  />
                </div>

                <div class="done-job-form-container-item">
                  <div class="done-job-input-field-radios-container">
                    <label for="secondJob" class="done-job-input-label"
                      >Druhá práce</label
                    >
                    <input
                      type="checkbox"
                      class="done-job-input-field-checkbox"
                      name="secondJob"
                      id="add-own-done-job-secondJobInput"
                      v-model="temporaryEditOwnDoneJobIsSecondJobInput"
                    />
                  </div>
                </div>

                <div class="done-job-form-container-item">
                  <label for="waiting" class="done-job-input-label"
                    >Čekání</label
                  >
                  <input
                    type="text"
                    inputmode="numeric"
                    class="done-job-input-field"
                    id="add-own-done-job-waitingInput"
                    maxlength="2"
                    v-model="temporaryEditOwnDoneJobWaitingInput"
                  />
                </div>

                <div class="modal-buttons-container">
                  <button
                    class="submit-green modal-buttons"
                    type="submit"
                  ></button>
                  <button
                    class="decline-red modal-buttons"
                    type="button"
                    @click="closeEditOwnDoneJobModal"
                  ></button>
                </div>
              </form>
            </div>
          </div>
        </Transition>

        <!----------------------------------------  Part 11 - Delete job ? modal  ------------------------------>
        <!--  -->
        <Transition name="scale">
          <div
            role="dialog"
            aria-modal="true"
            class="modal-main-container"
            v-if="showDeleteDoneJobModal"
          >
            <div class="modal-inner-container">
              <!--  -->
              <div class="modal-text">Odstranit vybranou práci?</div>

              <div class="modal-buttons-container">
                <button
                  class="submit-green modal-buttons"
                  type="button"
                  @click="deleteDoneJob"
                ></button>
                <button
                  class="decline-red modal-buttons"
                  type="button"
                  @click="closeDeleteDoneJobModal"
                ></button>
              </div>
            </div>
          </div>
        </Transition>

        <!----------------------------------------  Part 12 - Terminal selector modal section  ----------------->
        <!--  -->
        <Transition name="slide-top">
          <div
            role="dialog"
            aria-modal="true"
            class="modal-main-container"
            v-if="showTerminalSelector"
          >
            <div class="modal-inner-container">
              <form class="done-job-form" @submit.prevent="setTerminal">
                <div class="done-job-form-container-item">
                  <select
                    v-model="selectedTerminalOptionByUser"
                    name="terminal-selector"
                    class="done-job-input-field"
                  >
                    <option value="ceskaTrebova">Česká Třebová</option>
                    <option value="ostrava">Ostrava</option>
                    <option value="plzen">Plzeň</option>
                    <option value="praha">Praha</option>
                    <option value="ustiNadLabem">Ústí nad Labem</option>
                    <option value="zlin">Zlín</option>
                  </select>
                </div>

                <div class="modal-buttons-container">
                  <button
                    class="submit-green modal-buttons"
                    type="button"
                    @click="setTerminal"
                  ></button>
                  <button
                    class="decline-red modal-buttons"
                    type="button"
                    @click="closeTerminalSelector"
                  ></button>
                </div>
              </form>
            </div>
          </div>
        </Transition>

        <!----------------------------------------  Part 13 - Archive doneJobs ? modal section  ---------------->
        <!--  -->
        <Transition name="slide-bottom">
          <div
            role="dialog"
            aria-modal="true"
            class="modal-main-container"
            v-if="showArchiveDoneJobsModal"
          >
            <div class="modal-inner-container">
              <!--  -->
              <div class="modal-text">
                Archivovat práce z posledního měsíce ve Vašem výpisu?
              </div>

              <div class="modal-buttons-container">
                <button
                  class="submit-green modal-buttons"
                  type="button"
                  @click="checkBeforArchive"
                ></button>
                <button
                  class="decline-red modal-buttons"
                  type="button"
                  @click="closeArchiveDoneJobsModal"
                ></button>
              </div>
            </div>
          </div>
        </Transition>

        <!----------------------------------------  Part 14 - Menu modal section  ------------------------------>
        <!--  -->
        <Transition name="slide-right">
          <div
            role="dialog"
            aria-modal="true"
            class="modal-main-container"
            v-show="showMenuModal"
          >
            <div class="modal-inner-container pos-relative menu">
              <div @click="closeMenuModal" class="modal-close-button"></div>
              <div class="menu-buttons-container">
                <div
                  class="menu-buttons-container-item"
                  @click="openArchiveModal"
                >
                  Archiv prací
                </div>
                <div
                  class="menu-buttons-container-item"
                  @click="openMenuAppManual"
                >
                  Jak aplikaci používat
                </div>
                <div
                  class="menu-buttons-container-item"
                  @click="openMenuAddToHomeScreen"
                >
                  Přidat aplikaci na plochu
                </div>
                <div
                  class="menu-buttons-container-item"
                  @click="openMenuDataCollection"
                >
                  Nakládání s daty
                </div>
                <div
                  class="menu-buttons-container-item"
                  @click="openMenuContact"
                >
                  Kontakt
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <!----------------------------------------  Part 15 - Done jobs Archive modal section  ----------------->
        <!--  -->
        <Transition name="slide-right">
          <div
            role="dialog"
            aria-modal="true"
            class="modal-main-container"
            v-if="showArchive"
            ref="archiveModal"
            v-on:scroll="handleScrollArchiveModal"
          >
            <div class="modal-inner-container pos-relative">
              <div @click="closeArchiveModal" class="modal-back-button"></div>
              <h3 class="done-jobs-archive-h3">Archiv prací</h3>
              <div
                class="empty-archive-message"
                v-if="doneJobsArchive.value.length === 0"
              >
                Archiv je prázdný
              </div>
              <div
                class="done-jobs-archive-month-container"
                v-for="(archive, archiveIndex) in doneJobsArchive.value"
                :key="archive.month"
              >
                <div class="done-jobs-archive-month-year">
                  {{ archive.month }}
                  <div
                    class="done-jobs-archive-delete-month-button"
                    @click="openArchiveDeleteMonthWithData(archiveIndex)"
                  ></div>
                </div>

                <div
                  class="done-jobs-archive-job"
                  v-for="(job, jobIndex) in archive.jobs"
                  :key="job.date"
                >
                  <div class="done-jobs-archive-jobs-container">
                    <div class="done-jobs-archive-job-first-line">
                      <div class="done-jobs-archive-job-date-line">
                        {{ displayCZdateFormatDDMM(job.date) }}
                      </div>
                      <div class="done-jobs-archive-job-cmr-line">
                        {{ job.cmr }}
                      </div>
                      <div class="done-jobs-archive-job-delete-line">
                        <div
                          class="done-jobs-archive-delete-job-button"
                          @click="
                            openArchiveDeleteJobWithData(archiveIndex, jobIndex)
                          "
                        ></div>
                      </div>
                    </div>
                    <div class="done-jobs-archive-job-rest-lines-container">
                      <div class="done-jobs-archive-job--line">
                        {{ job.city }}
                      </div>
                      <div class="done-jobs-archive-job--line">
                        {{ job.zipcode }}
                      </div>
                      <div class="done-jobs-archive-job--line">
                        {{ displayStandartWeightFormat(job.weight) }}
                      </div>

                      <div class="done-jobs-archive-job-secondJob-waiting-line">
                        <div class="done-jobs-archive-job-secondJob-container">
                          <img
                            v-show="job.isSecondJob"
                            src="./assets/secondJobs_icon_done_job.svg"
                            alt="second-job-icon"
                          />
                        </div>

                        <div class="done-jobs-archive-job-waiting-container">
                          <img
                            v-show="job.waiting > 0"
                            src="./assets/waiting_icon_done_job.svg"
                            alt="waiting-icon"
                          />
                          <div v-show="job.waiting > 0">
                            {{ job.waiting }}
                          </div>
                        </div>
                      </div>
                      <div class="done-jobs-archive-job-price-line">
                        {{ job.price + "€" }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="done-jobs-archive-summary-main-container">
                  <div class="done-jobs-archive-summary-container">
                    <div class="done-jobs-archive-summary-item">
                      <div>Fakturace:</div>
                      <div>
                        {{ archive.summary.eur + " €&nbsp&nbsp" }}
                      </div>
                    </div>
                    <div class="done-jobs-archive-summary-item">
                      <div>&nbsp</div>
                      <div>{{ archive.summary.czk + " Kč" }}</div>
                    </div>
                    <div><br /></div>
                    <div class="done-jobs-archive-summary-item">
                      <div>Výplata ({{ archive.summary.percentage }}%):</div>
                      <div>
                        {{ archive.summary.payout + " Kč" }}
                      </div>
                    </div>
                    <div><br /></div>

                    <div class="done-jobs-archive-summary-item">
                      <div>Prací:</div>
                      <div>{{ archive.summary.jobs }}</div>
                    </div>

                    <div class="done-jobs-archive-summary-item">
                      <div>Druhých prací:</div>
                      <div>{{ archive.summary.secondJobs }}</div>
                    </div>
                    <div class="done-jobs-archive-summary-item">
                      <div>Čekání:</div>
                      <div>{{ archive.summary.waiting }}</div>
                    </div>
                  </div>
                  <a
                    class="send-data-by-email"
                    href="#"
                    @click.prevent="sendDataByEmail(archiveIndex)"
                    >Odeslat souhrn e-mailem</a
                  >
                </div>
              </div>
            </div>
            <img
              class="back-to-top-button"
              src="./assets/back-to-the-top-button.svg"
              alt="back-to-top-button-img"
              @click="scrollToTopArchiveModal"
              v-show="showBackToTopButtonArchiveModal"
            />
          </div>
        </Transition>

        <!----------------------------------------  Part - Delete month in Archive modal section  ------------->
        <!--  -->
        <Transition name="slide-right">
          <div
            role="dialog"
            aria-modal="true"
            class="modal-main-container"
            v-if="showArchiveDeleteMonth"
          >
            <div class="modal-inner-container pos-relative">
              <div class="modal-text">Odstranit vybraný měsíc z archivu?</div>
              <div class="modal-buttons-container">
                <button
                  class="submit-green modal-buttons"
                  type="button"
                  @click="deleteArchiveMonth"
                ></button>
                <button
                  class="decline-red modal-buttons"
                  type="button"
                  @click="closeArchiveDeleteMonthModal"
                ></button>
              </div>
            </div>
          </div>
        </Transition>

        <!----------------------------------------  Part 16 - Delete job in Archive modal section  ------------->
        <!--  -->
        <Transition name="slide-right">
          <div
            role="dialog"
            aria-modal="true"
            class="modal-main-container"
            v-if="showArchiveDeleteJob"
          >
            <div class="modal-inner-container pos-relative">
              <div class="modal-text">Odstranit vybranou práci z archivu?</div>
              <div class="modal-buttons-container">
                <button
                  class="submit-green modal-buttons"
                  type="button"
                  @click="deleteArchiveJob"
                ></button>
                <button
                  class="decline-red modal-buttons"
                  type="button"
                  @click="closeArchiveDeleteJobModal"
                ></button>
              </div>
            </div>
          </div>
        </Transition>

        <!----------------------------------------  Part 17 - MENU - App manual  -------------------->
        <!--  -->
        <Transition name="slide-right">
          <div
            role="dialog"
            aria-modal="true"
            class="modal-main-container"
            v-if="showMenuAppManual"
            ref="menuAppManualSrollRef"
            v-on:scroll="handleSrollMenuAppManual"
          >
            <div class="modal-inner-container pos-relative menu-app-manual">
              <div @click="closeMenuAppManual" class="modal-back-button"></div>
              <h3>Tato aplikace Vám umožní:</h3>
              <ul>
                <li>vyhledávat práce v ceníku</li>

                <li>přidávat práce z ceníku i mimo ceník do svého souhrnu</li>

                <li>
                  mít přehled o:
                  <br />- aktuální fakturaci <br />- předpokládané výplatě
                  <br />- počtu prací, druhých prací a čekání
                </li>

                <li>odesílat SMS s prací jednodušeji</li>

                <li>
                  ukládat své měsíční souhrny do archivu (historie max 13
                  měsíců)
                </li>

                <li>odesílat měsíční souhrn e-mailem</li>
              </ul>
              <h3>Jak aplikaci používat:</h3>
              <h4>Nastavení terminálu</h4>
              <ol>
                <li>Klikněte na tužku vedle názvu terminálu</li>
                <img
                  class="menu-app-manual-img"
                  src="./assets/menu-app-manual-imgs/01_terminal_1.png"
                  alt=""
                />
                <li>
                  Vyberte terminál v jehož ceníku chcete vyhledávat / přidávat
                  další práce do svého souhrnu
                </li>
                <img
                  class="menu-app-manual-img"
                  src="./assets/menu-app-manual-imgs/02_terminal_2.png"
                  alt=""
                />
              </ol>
              <h4>Nastavení procent z fakturace</h4>
              <ol>
                <li>Klikněte na %</li>
                <img
                  class="menu-app-manual-img"
                  src="./assets/menu-app-manual-imgs/03_percentage_1.png"
                  alt=""
                />
                <li>Vyplňte Vaše procenta z fakturace</li>
                <img
                  class="menu-app-manual-img"
                  src="./assets/menu-app-manual-imgs/04_percentage_2.png"
                  alt=""
                />
              </ol>
              <h4>Přidání práce z ceníku do svého výpisu</h4>
              <ol>
                <li>
                  Do vyhledávacího panelu napište
                  <span class="span-bold">název obce</span> nebo
                  <span class="span-bold">PSČ</span> s diakritikou nebo bez:
                </li>
                <img
                  class="menu-app-manual-img"
                  src="./assets/menu-app-manual-imgs/05_search-results.png"
                  alt=""
                />
                <li>Klikněte na zelené tlačítko přidat:</li>
                <img
                  class="menu-app-manual-img"
                  src="./assets/menu-app-manual-imgs/06_search-result_arrow.png"
                  alt=""
                />
                <li>Vyplňte údaje a klikněte na tlačítko potvrdit:</li>
                <img
                  class="menu-app-manual-img"
                  src="./assets/menu-app-manual-imgs/07_add-job.png"
                  alt=""
                />
              </ol>

              <h4>Přidání práce mimo ceník do svého výpisu</h4>
              <ol>
                <li>Na hlavní obrazovce klikněte na zelené tlačítko přidat:</li>
                <img
                  class="menu-app-manual-img"
                  src="./assets/menu-app-manual-imgs/08_add-own-job_1_arrow.png"
                  alt=""
                />
                <li>Vyplňte údaje a klikněte na tlačítko potvrdit:</li>
                <img
                  class="menu-app-manual-img"
                  src="./assets/menu-app-manual-imgs/09_add-own-job_2.png"
                  alt=""
                />
              </ol>
              <h4>Vysvětlivky hlavní obrazovky</h4>
              <img
                class="menu-app-manual-img"
                src="./assets/menu-app-manual-imgs/10_summary_map.png"
                alt=""
              />
              <ol>
                <li>vybraný terminál</li>
                <li>menu aplikace</li>
                <li>panel pro vyhledávání v ceníku</li>
                <li>tlačítko pro přidání práce mimo ceník</li>
                <li>aktuální fakturace (součet všech prací ve výpisu)</li>
                <li>Vaše procenta a odpovídající částka</li>
                <li>
                  celkový počet prací, druhých prací a čekání ve Vašem výpisu
                </li>
                <li>tlačítko pro úpravu přidané práce</li>
                <li>tlačítko pro odstranění přidané práce</li>
                <li>
                  tlačtíko které přesune práce z posledního měsíce ve Vašem
                  výpisu do <span class="span-bold">archivu </span> <br />
                  <span class="span-italic"
                    >(tuto akci provádějte vždy na konci měsíce, nebo na začátku
                    měsíce nového, tím docílite že budete mít ve výpisu vždy jen
                    práce pro aktuální měsíc)</span
                  >
                </li>
                <ul>
                  <li>
                    archivované práce se přesunou do archivu s kurzem EUR/CZK ze
                    začátku měsíce
                  </li>
                  <li>
                    výplata v archivu v danném měsíci se vypočítá podle aktuálně
                    nastavených procent v době kdy práce archivujete
                    <span class="span-italic"
                      >(nutno si připočítat příplatky za druhé práce a
                      čekání)</span
                    >
                  </li>
                </ul>
              </ol>
              <h4>Práce s archivem</h4>
              <ol>
                <li>tlačítko pro odstranění celého měsíce z archivu</li>
                <li>tlačítko pro odstranění konkrétní práce z archviu</li>
              </ol>
              <img
                class="menu-app-manual-img"
                src="./assets/menu-app-manual-imgs/14_archive.png"
                alt=""
              />
              <ul>
                <li>v arhcivu jsou práce rozdělené podle příslušných měsíců</li>
                <li>u každého měsíce je na konci celkový souhrn</li>
                <li>
                  v případě že máte některou z prací vyplněnou špatně, lze ji
                  pomocí křížku odstranit, a poté přidat opět na hlavní
                  obrazovce a znovu archivovat - stejně tak celý měsíc
                </li>
                <li>
                  souhrn celého měsíce lze odeslat e-mailem kliknutím na text
                  <span class="span-blue"> "Odeslat e-mailem"</span> po kterém
                  se Vám otevře e-mailová aplikace ve Vašem zařízení s již
                  vyplněnými daty
                </li>
              </ul>
              <h4>Posílání SMS s prací</h4>
              <ol>
                <li>
                  Klikněte na datum práce, kterou chcete odeslat pomocí SMS.
                </li>
                <li>Objeví se info "Zkopírováno do schránky".</li>
                <img
                  class="menu-app-manual-img"
                  src="./assets/menu-app-manual-imgs/11_sms_1_arrows.png"
                  alt=""
                />
                <li>
                  Otevřete SMS a 2x rychle za sebou klikněte / dlouze klikněte
                  na pole pro text.
                </li>
                <li>Poté klikněte na "Vložit".</li>
                <img
                  class="menu-app-manual-img"
                  src="./assets/menu-app-manual-imgs/12_sms_2_arrows.png"
                  alt=""
                />
                <li>Nyní stačí jen odeslat.</li>
                <img
                  class="menu-app-manual-img"
                  src="./assets/menu-app-manual-imgs/13_sms_3.png"
                  alt=""
                />
              </ol>
            </div>
            <img
              class="back-to-top-button"
              src="./assets/back-to-the-top-button.svg"
              alt="back-to-top-button-img"
              @click="scrollToTopMenuAppManual"
              v-show="showBackToTopButtonMenuAppManual"
            />
          </div>
        </Transition>

        <!----------------------------------------  Part 18 - MENU - Add to homescreen  ---------------->
        <!--  -->
        <Transition name="slide-right">
          <div
            role="dialog"
            aria-modal="true"
            class="modal-main-container"
            v-if="showMenuAddToHomeScreen"
            ref="menuAddToHomescreenScrollRef"
            v-on:scroll="handleScrollMenuAddToHomescreen"
          >
            <div class="modal-inner-container pos-relative menu-app-manual">
              <div
                @click="closeMenuAddToHomeScreen"
                class="modal-back-button"
              ></div>
              <h3>Přidat aplikaci na plochu</h3>
              <img
                class="app-logo"
                src="./assets/menu-app-add-to-home-screen/add-to-homescreen-app-icon.png"
                alt=""
              />
              <h4>Android</h4>
              <img
                class="menu-app-manual-img"
                src="./assets/menu-app-add-to-home-screen/add-to-homescreen-android_1.png"
                alt=""
              />
              <img
                class="menu-app-manual-img"
                src="./assets/menu-app-add-to-home-screen/add-to-homescreen-android_2.png"
                alt=""
              />
              <h4>iOS</h4>
              <p class="text-center">(pouze prohlížeč Safari)</p>
              <img
                class="menu-app-manual-img"
                src="./assets/menu-app-add-to-home-screen/add-to-homescreen-ios_1.png"
                alt=""
              />
              <img
                class="menu-app-manual-img"
                src="./assets/menu-app-add-to-home-screen/add-to-homescreen-ios_2.png"
                alt=""
              />
            </div>
            <img
              class="back-to-top-button"
              src="./assets/back-to-the-top-button.svg"
              alt="back-to-top-button-img"
              @click="scrollToTopMenuAddToHomescreen"
              v-show="showBackToTopButtonMenuAddToHomescreen"
            />
          </div>
        </Transition>

        <!----------------------------------------  Part 19 - MENU - Data collection  ---------------->
        <!--  -->
        <Transition name="slide-right">
          <div
            role="dialog"
            aria-modal="true"
            class="modal-main-container"
            v-if="showMenuDataCollection"
          >
            <div class="modal-inner-container pos-relative menu-app-manual">
              <div
                @click="closeMenuDataCollection"
                class="modal-back-button"
              ></div>
              <h3>Nakládání s daty</h3>
              <p>
                Veškerá osobní data a nastavení uživatele se ukládají do paměti
                webového prohlížeče, z tohoto důvodu je potřeba používat
                aplikaci jen na jednom zařízení a v jednom webovém prohlížeči.
              </p>
            </div>
          </div>
        </Transition>

        <!----------------------------------------  Part 20 - MENU - Contact  ---------------->
        <!--  -->
        <Transition name="slide-right">
          <div
            role="dialog"
            aria-modal="true"
            class="modal-main-container"
            v-if="showMenuContact"
          >
            <div class="modal-inner-container pos-relative menu-app-manual">
              <div @click="closeMenuContact" class="modal-back-button"></div>
              <h3>Kontakt</h3>
              <p>
                Máte-li dotaz, návrh na vylepšení, nebo chcete nahlásit nějkou
                chybu, kontaktujte mě na email:
                <span
                  ><a class="email" href="mailto:info@emtruck.eu"
                    >info@emtruck.eu</a
                  ></span
                >
              </p>
            </div>
          </div>
        </Transition>
      </div>
    </div>
    <div v-else class="password-input-field-button-container">
      <input
        v-model="userPasswordInput"
        id="passwordInputField"
        class="password-input-field"
        type="text"
        placeholder="heslo"
      />
      <div
        class="password-input-field-button-container-button"
        @click="passwordValidation"
      ></div>
    </div>
  </div>
</template>

<style>
[v-cloak] {
  display: none;
}

/*Hide scrollbar for Chrome,
Safari and Opera*/
.main-container::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.main-container {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  width: 92%;
  max-width: 450px;
  margin: 0 auto 0 auto;
}

html {
  /* min-height: 100vh; */
  min-height: 100%;
  min-height: --webkit-fill-available;
  background: rgb(0, 35, 105);
  background: linear-gradient(
    180deg,
    rgba(0, 35, 105, 1) 0%,
    rgb(237, 237, 237) 100%
  );
  touch-action: pan-y;
}

body {
  min-height: 100%;
  min-height: --webkit-fill-available;
  touch-action: pan-y;
}

.password-input-field-button-container {
  display: flex;
  margin: 40vh auto 0 auto;
  height: 2.5rem;
  width: 70%;
  max-width: 400px;
  border-radius: 10px;
  background-color: white;
}

.password-input-field-button-container input {
  height: 100%;
  width: 80%;
  padding: 1rem;
  border: none;
  text-align: center;
  background-color: transparent;
}

.password-input-field-button-container input:focus {
  outline: none;
}

.password-input-field-button-container-button {
  background-color: #00c94d;
  color: white;
  border: none;
  height: 100%;
  width: 20%;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  background-image: url(./assets/send_button.svg);
  background-size: 1.2rem;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
}

/* ----------------------------------------  Transition Fade  -------------------- */
/*  */
.fade-enter-from {
  opacity: 0;
}

.fade-enter-active {
  transition: 0.3s ease;
}

.fade-leave-to {
  opacity: 0;
}

.fade-leave-active {
  transition: 0.3s ease;
}

/* ----------------------------------------  TRANSITIONS  -------------------- */

/* ----------------------------------------  Transition Scale  -------------------- */
/*  */
.scale-enter-from {
  transform: scale(0);
}
.scale-enter-active {
  transition: transform 0.3s;
}
.scale-leave-to {
  transform: scale(0);
}
.scale-leave-active {
  transition: transform 0.3s;
}

/* ----------------------------------------   Transition Slide top  -------------------- */
/*  */
.slide-top-enter-from {
  transform: translateY(-100%);
}
.slide-top-enter-active {
  transition: transform 0.3s;
}
.slide-top-leave-to {
  transform: translateY(-100%);
}
.slide-top-leave-active {
  transition: transform 0.3s;
}

/* ----------------------------------------  Transition slide-top-slow  -------------------- */
/*  */
.slide-top-slow-enter-from {
  opacity: 0;
}

.slide-top-slow-enter-active {
  transition: transform 0.5s;
}

.slide-top-slow-leave-to {
  transform: translateY(-100%);
}

.slide-top-slow-leave-active {
  transition: transform 1s;
}

/* ----------------------------------------   Transition Slide bottom  -------------------- */
/*  */
.slide-bottom-enter-from {
  transform: translateY(100%);
}
.slide-bottom-enter-active {
  transition: transform 0.3s;
}
.slide-bottom-leave-to {
  transform: translateY(100%);
}
.slide-bottom-leave-active {
  transition: transform 0.3s;
}

/* ----------------------------------------   Transition Slide right  -------------------- */
/*  */
.slide-right-enter-from {
  transform: translateX(100%);
}
.slide-right-enter-active {
  transition: transform 0.3s;
}
.slide-right-leave-to {
  transform: translateX(100%);
}
.slide-right-leave-active {
  transition: transform 0.3s;
}

/* ----------------------------------------   Transition Slide left  -------------------- */
/*  */
.slide-left-enter-from {
  transform: translateX(-100%);
}
.slide-left-enter-active {
  transition: transform 0.3s;
}
.slide-left-leave-to {
  transform: translateX(-100%);
}
.slide-left-leave-active {
  transition: transform 0.3s;
}

/* ----------------------------------------  CSS styly pro modální okna  -------------------- */
/*  */

.modal-main-container {
  position: fixed;
  z-index: 999;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  overflow: auto;
  min-height: 100%;
  touch-action: pan-y;
}

.modal-inner-container {
  background-color: rgb(255, 255, 255);
  width: 92%;
  max-width: 450px;
  /* max-height: 70vh; */
  /* overflow: scroll; */
  border-radius: 5px;
  border: solid 1px rgb(203, 203, 203);
  margin: 1.5rem auto 1rem auto;
  padding: 0.7rem;
}

.pos-relative {
  position: relative;
}

/* Styl pro modální okna obsahující pouze text */
.modal-text {
  padding: 1rem 1rem 1.5rem 1rem;
  text-align: center;
  line-height: 1.5rem;
}

/* Styly pro modální okna s form */

.done-job-form {
  margin-top: 0.7rem;
}

.done-job-form-container-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  height: 2.5rem;
  width: 80%;
  max-width: 200px;
  margin: 0 auto 1.3rem auto;
  box-shadow: 0px 7px 7px -1px rgba(0, 0, 0, 0.09);
  -webkit-box-shadow: 0px 7px 7px -1px rgba(0, 0, 0, 0.09);
  -moz-box-shadow: 0px 7px 7px -1px rgba(0, 0, 0, 0.09);
}

.done-job-input-field {
  text-align: center;
  font-size: 0.8rem;
  border-radius: 5px;
  border: solid 1px lightgray;
  height: 100%;
  max-width: 100%;
  width: 100%;
  padding: 0 0.5rem;
  --moz-appearance: none;
  --webkit-appearance: none;
  appearance: none;
}

.done-job-input-label {
  font-size: 0.75rem;
  position: absolute;
  top: -0.5rem;
  left: 0.4rem;
  background-color: rgb(255, 255, 255);
  padding: 0 0.2rem;
}

.done-job-input-label-required::after {
  content: " *";
  color: red;
}

.done-job-input-field-date-container {
  width: 100%;
  height: 100%;
  border-radius: 5px;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.done-job-input-field-date-container input {
  background-color: transparent;
}

.done-job-form-container-item-radios {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  height: 2.5rem;
  width: 80%;
  max-width: 200px;
  margin: 0 auto 1.3rem auto;
  box-shadow: 0px 7px 7px -1px rgba(0, 0, 0, 0.09);
  -webkit-box-shadow: 0px 7px 7px -1px rgba(0, 0, 0, 0.09);
  -moz-box-shadow: 0px 7px 7px -1px rgba(0, 0, 0, 0.09);
}

.done-job-input-field-radios-container {
  width: 100%;
  height: 100%;
  border: 1px solid lightgray;
  border-radius: 5px;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.done-job-input-field-radios-1 label {
  margin-right: 0.4rem;
  font-size: 0.8rem;
}

.done-job-input-field-radios-2 label {
  margin-right: 0.4rem;
  font-size: 0.8rem;
}

.done-job-form-container-item-checkbox {
  display: flex;
  align-items: center;
  position: relative;
  height: 2.5rem;
  width: 80%;
  max-width: 200px;
  margin: 0 auto 0.8rem auto;
}

/* ----------------------------------------  CSS styly pro buttony v modálních oknech  -------------------- */
/*  */

.modal-close-button {
  position: absolute;
  top: -0.8rem;
  right: -0.25rem;
  z-index: 999;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  cursor: pointer;
  background-color: whitesmoke;
  background-image: url(./assets/close_button.svg);
  background-size: cover;
  background-repeat: no-repeat;
}

.modal-back-button {
  position: absolute;
  top: -0.8rem;
  right: -0.25rem;
  z-index: 999;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  cursor: pointer;
  background-color: whitesmoke;
  background-image: url(./assets/back_button.svg);
  background-size: cover;
  background-repeat: no-repeat;
}

.submit-green {
  background-color: #00c94d;
  color: white;
  border: none;
}

button.submit-green::before {
  content: "POTVRDIT";
  font-weight: bold;
}

.decline-red {
  background-color: #e64d66;
  color: white;
  border: none;
}

button.decline-red::before {
  content: "ZRUŠIT";
  font-weight: bold;
}

.modal-buttons-container {
  display: flex;
  justify-content: center;
  margin: 1rem 0 2rem 0;
}

.modal-buttons {
  margin: 0rem 0.7rem 0.4rem 0.7rem;
  padding: 0.5rem 0.7rem;
  border-radius: 5px;
  cursor: pointer;
}

/* ----------------------------------------  Back to top button  ----------------- */
/*  */
.back-to-top-button {
  background-color: whitesmoke;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  opacity: 60%;
  position: fixed;
  bottom: 40px;
  right: 30px;
  cursor: pointer;
}

.new-version-message-heading {
  font-weight: bold;
  font-size: 1.5rem;
}

.new-version-ul {
  margin-left: 2rem;
  list-style: disc;
}

.danger {
  color: red;
}

/* ----------------------------------------  Part 0 - Navbar  -------------------- */
/*  */

.navbar-container {
  max-width: 450px;
  height: 2rem;
  background-color: rgba(0, 35, 105, 1);
  border-left: 1px solid rgb(176, 176, 176);
  border-bottom: 1px solid rgb(176, 176, 176);
  display: flex;
  justify-content: center;
  margin: 0 auto;
}

.navbar-terminal {
  height: 100%;
  width: 85%;
  padding-left: 0.5rem;
  display: flex;
  /* justify-content: center; */
  align-items: center;
}

.terminal-text {
  font-size: 0.8rem;
  color: rgb(191, 190, 190);
}

.choosed-terminal {
  font-size: 0.9rem;
  font-weight: bold;
  color: rgb(218, 218, 218);
}

.navbar-terminal img {
  width: 0.85rem;
  margin-left: 0.3rem;
  cursor: pointer;
}

.navbar-menu-line {
  margin-top: 0.3rem;
  width: 1px;
  height: 1.3rem;
  background-color: rgb(176, 176, 176);
}

.navbar-menu {
  height: 100%;
  width: 15%;
  border-right: 1px solid rgb(176, 176, 176);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.navbar-menu img {
  width: 1.1rem;
}

/* ----------------------------------------  Part 1 - Search bar  -------------------- */
/*  */

.search-bar-container {
  position: relative;
  display: flex;
  width: 100%;
  max-width: 450px;
  height: 2.5rem;
  /* justify-content: space-between; */
  align-items: center;
  margin: 1rem auto 0.6rem auto;
}

.search-bar-container input {
  width: 100%;
  height: 2.5rem;
  text-align: center;
  border-radius: 5px;
  border: none;
  background-color: white;
  background-image: url("./assets/magnifying_glass.svg");
  background-repeat: no-repeat;
  background-origin: border-box;
  background-size: 30px 30px;
  background-position: left 5px center;
  padding: 0 2rem 0 2.2rem;
}
.search-bar-container input:focus {
  outline: none;
}

.search-bar-container img {
  position: absolute;
  height: 15px;
  right: 10px;
  cursor: pointer;
}

.add-own-job-container {
  display: flex;
  justify-content: center;
  margin-bottom: 0.6rem;
}

.add-own-job-container img {
  cursor: pointer;
  background-color: rgb(255, 255, 255);
  border-radius: 50%;
  border: none;
  width: 1.3rem;
}
/* ----------------------------------------  Part 2 - Search results  -------------------- */
/*  */

ul {
  list-style-type: none;
  font-size: 1rem;
}

.result-container {
  width: 100%;
  max-width: 450px;
  border: none;
  margin: 1rem auto;
  text-align: center;
  border-radius: 5px;
}

.result-first-line {
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  border-bottom: solid 1px rgb(218, 218, 218);
}

.city-zipcode-container {
  display: flex;
  flex-direction: column;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  background-color: rgb(214, 248, 253);
}

.city {
  font-size: 1rem;
  font-weight: bold;
  margin: 0.5rem auto 0.5rem auto;
}

.zipcode {
  font-size: 0.85rem;
  color: rgb(56, 56, 56);
  margin: 0 auto 0.5rem auto;
}

.result-second-line {
  display: flex;
  color: rgb(127, 118, 118);
  font-size: 0.8rem;
}

.result-second-line-item-left {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 43%;
  background-color: rgb(255, 255, 255);
  padding: 0.5rem;
  border-bottom-left-radius: 5px;
}

.result-second-line-item-middle {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 14%;
  background-color: rgb(255, 255, 255);
  padding: 0.5rem;
  border-right: 1px solid rgb(231, 231, 231);
  border-left: 1px solid rgb(231, 231, 231);
}

.add-button-img {
  cursor: pointer;
}

.result-second-line-item-right {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 43%;
  background-color: rgb(255, 255, 255);
  padding: 0.5rem;
  border: none;
  border-bottom-right-radius: 5px;
}

.weight {
  padding-bottom: 0.3rem;
}

.price {
  font-weight: bold;
  font-size: 0.9rem;
  color: rgb(62, 62, 62);
}

/* ----------------------------------------  Part 4 - Summary section  -------------------- */
/*  */

.summary-container-main {
  width: 100%;
  max-width: 450px;
  display: flex;
  justify-content: space-between;
  margin: 0 auto 1rem auto;
}

.jobs-summary-container-left {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 48%;
  max-width: 235px;
}

.jobs-summary-container-left-top {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 235px;
  border: solid gold 1px;
  background-color: rgb(255, 255, 255);
  border-radius: 5px;
}

.jobs-summary-price-eur {
  margin: 0.3rem auto 0 auto;
  font-size: 1.3rem;
  font-weight: bold;
  margin: 0.35rem auto;
}

.jobs-summary-price-czk {
  margin-bottom: 0.3rem;
  font-size: 0.75rem;
  margin: 0rem auto 0.3rem auto;
}

.jobs-summary-container-left-bottom {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 235px;
  border: solid gold 1px;
  background-color: rgb(255, 255, 255);
  border-radius: 5px;
}

.jobs-summary-invoicing-percentage-value {
  margin: 0.5rem 0.4rem 0.5rem 0;
  font-size: 0.8rem;
  font-weight: bold;
  color: blue;
  cursor: pointer;
}

.jobs-summary-invoicing-payout {
  font-weight: bold;
  font-size: 0.95rem;
}

.jobs-summary-container-right {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 48%;
  max-width: 235px;
  border: solid gold 1px;
  background-color: rgb(255, 255, 255);
  border-radius: 5px;
  padding: 0.4rem;
}

.jobs-summary-container-right-item {
  display: flex;
  padding: 0.2rem 0rem;
}

.jobs-summary-container-right-item-last {
  padding-bottom: 0;
}

.jobs-summary-container-right-key {
  flex: 0.5;
  text-align: left;
  padding: 0 0 0 1.3rem;
  font-size: 1.05rem;
}

.jobs-summary-container-right-value {
  flex: 0.5;
  text-align: right;
  padding: 0 1.3rem 0 0;
  font-size: 1.05rem;
}

.summary-icon {
  width: 1.2rem;
}

/* ----------------------------------------  Part 5 - Done jobs section  -------------------- */
/*  */

.copy-to-clipboard-popup {
  height: 2rem;
  position: absolute;
  top: 0rem;
  left: 0;
  right: 0;
  margin: 0 auto;
  background-color: #383838;
  color: whitesmoke;
  font-size: 0.8rem;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
}

.done-jobs-container {
  width: 100%;
  max-width: 450px;
  border: none;
  margin: 1rem auto;
  text-align: center;
  background-color: rgb(255, 255, 255);
  border-radius: 5px;
  position: relative;
}

.done-jobs-item {
  margin: 0.25rem;
}

.done-jobs-first-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  background: rgb(200, 200, 200);
  background: linear-gradient(
    180deg,
    rgb(189, 189, 189) 0%,
    rgba(255, 255, 255, 0.7903361173570991) 100%
  );
  border-radius: 5px;
}

.done-jobs-day-date-container {
  display: flex;
}

.edit-job-button-img {
  height: 21px;
  cursor: pointer;
  padding-left: 0.3rem;
}

.delete-job-button-img {
  height: 22px;
  cursor: pointer;
  padding-right: 0.3rem;
}

.done-jobs-job-line {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.95rem;
  font-weight: bold;
}

.done-jobs-zipcode-line {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1rem;
  font-size: 0.85rem;
}

.job-cmr {
  font-size: 0.7rem;
  color: rgb(127, 127, 127);
}

.done-jobs-last-line {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.85rem;
  padding-bottom: 0.3rem;
  color: rgb(84, 84, 84);
}

.second-job-sign-container {
  position: absolute;
  left: 0;
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
}

.second-job-sign-container img {
  width: 1.1rem;
}

.job-weight {
  font-size: 0.7rem;
  font-weight: bold;
}

.job-price {
  font-weight: bold;
}

.waiting-sign-container {
  position: absolute;
  right: 0;
  margin-right: 0.5rem;
  display: flex;
  align-items: center;
}

.waiting-sign-container img {
  width: 1.1rem;
  margin-right: 0.15rem;
}

.waiting-sign-container p {
  font-weight: bold;
  font-size: 0.9rem;
  color: red;
}

.archive-jobs-button-container {
  height: 2rem;
  width: 70%;
  max-width: 250px;
  max-width: 450px;
  margin: 1.5rem auto;
}

.archive-jobs-btn {
  width: 100%;
  height: 100%;
  background-color: rgb(247, 54, 54);
  color: rgb(233, 233, 233);

  border-radius: 5px;
  border: none;
  font-weight: bold;
  cursor: pointer;
}

.info-icon {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  position: absolute;
  top: 0.375rem;
  right: -2rem;
}

.info-icon-popup-text {
  font-size: 0.8rem;
  padding: 0 1rem;
}

/* ----------------------------------------  Part 7 - Percentage modal section  -------------------- */
/*  */
.percentage-input-field {
  margin: 1rem auto 1.5rem auto;
  display: block;
  border-radius: 5px;
  border: solid 1px lightgray;
  height: 2rem;
  text-align: center;
  width: 30%;
  max-width: 200px;
}

/* ----------------------------------------  Part 12 - Terminal selector modal section  -------------------- */
/*  */
.terminal-selector-input-field {
  margin: 1rem auto 1.5rem auto;
  padding: 0 0.5rem;
  display: block;
  border-radius: 5px;
  border: solid 1px lightgray;
  height: 2rem;
  text-align: center;
  max-width: 200px;
}

/* ----------------------------------------  Part 13 - Archive doneJobs modal section  -------------------- */
/*  */
.archive-done-jobs-info-text {
  margin: 1.5rem 1rem;
}

/* ----------------------------------------  Part 14 - MENU modal section  -------------------- */
/*  */
.menu-buttons-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0.7rem 0;
}

.menu-buttons-container-item {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 2.5rem;
  width: 85%;
  margin: 1rem 0;
  padding: 1.5rem;
  cursor: pointer;
  background-color: #002369;
  color: rgb(255, 255, 255);
  border-radius: 5px;
  text-align: center;
  box-shadow: 0px 5px 7px -1px rgba(0, 0, 0, 0.3);
  -webkit-box-shadow: 0px 5px 7px -1px rgba(0, 0, 0, 0.3);
  -moz-box-shadow: 0px 5px 7px -1px rgba(0, 0, 0, 0.3);
}

/* ----------------------------------------  Part 15 - DoneJobs ARCHIVE modal section  -------------------- */
/*  */
.done-jobs-archive-h3 {
  margin: 1rem 0;
  text-align: center;
  text-decoration: underline;
}

.empty-archive-message {
  color: rgb(172, 172, 172);
  font-style: italic;
  text-align: center;
  margin-bottom: 1rem;
}

.done-jobs-archive-month-container {
  margin-bottom: 3rem;
}

.done-jobs-archive-month-year {
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  /* position: relative; */
}

.done-jobs-archive-delete-month-button {
  margin-left: 0.3rem;

  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  cursor: pointer;
  background-color: whitesmoke;
  background-image: url(./assets/delete_job.svg);
  background-size: cover;
  background-repeat: no-repeat;
}

.done-jobs-archive-jobs-container {
  margin-bottom: 1rem;
}

.done-jobs-archive-job {
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  position: relative;
}

.done-jobs-archive-job-first-line {
  background-color: rgb(221, 221, 221);
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.2rem;
}

.done-jobs-archive-job-date-line {
  font-weight: bold;
}

.done-jobs-archive-job-cmr-line {
  font-weight: bold;
}

.done-jobs-archive-delete-job-button {
  width: 1rem;
  height: 1rem;
  /* margin-left: 0.5rem; */
  cursor: pointer;
  background-image: url(./assets/delete_job.svg);
  background-size: cover;
  background-repeat: no-repeat;
}

.done-jobs-archive-job-secondJob-waiting-line {
  position: absolute;
  top: 1.5rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: red;
}

.done-jobs-archive-job-secondJob-waiting-line img {
  width: 1rem;
}

.done-jobs-archive-job-secondJob-container {
  margin-right: 0.35rem;
}

.done-jobs-archive-job-waiting-container {
  display: flex;
  align-items: center;
}

.done-jobs-archive-job-price-line {
  font-weight: bold;
  /* text-align: center; */
}

.done-jobs-archive-summary-main-container {
  padding: 1rem;
  background-color: rgb(221, 221, 221);
}

.done-jobs-archive-summary-container {
  display: flex;
  flex-direction: column;
}

.done-jobs-archive-summary-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: bold;
}

.done-jobs-archive-button-container {
  display: flex;
  justify-content: center;
}

.done-jobs-archive-button-container button {
  margin: 0rem 0.7rem 0.4rem 0.7rem;
  height: 2rem;
  width: 4.5rem;
  border-radius: 5px;
  cursor: pointer;
}

.send-data-by-email {
  display: block;
  margin-top: 1rem;
  font-size: 0.8rem;
  text-align: center;
}

/* ----------------------------------------  Part 17 - MENU - Jak aplikaci používat  -------------------- */
/*  */
.menu-app-manual h3 {
  margin: 1rem 0;
  text-align: center;
  text-decoration: underline;
}

.menu-app-manual h4 {
  margin: 1rem 0;
  font-size: 0.95rem;
  text-align: center;
}

.menu-app-manual ul > li {
  list-style: disc;
  font-size: 0.9rem;
  margin: 0.5rem 1rem 0.5rem 3rem;
  line-height: 1.3rem;
}

.menu-app-manual ol > li {
  font-size: 0.9rem;
  margin: 0.5rem 1rem 0.5rem 3rem;
  line-height: 1.3rem;
}

.menu-app-manual p {
  font-size: 0.9rem;
  margin: 0.5rem 1rem;
  line-height: 1.3rem;
}

.text-center {
  text-align: center;
}

.span-bold {
  font-weight: bold;
}

.span-italic {
  font-style: italic;
  font-size: 0.85rem;
  background-color: rgb(241, 241, 241);
}

.span-blue {
  color: blue;
}

.menu-app-manual-img {
  width: 85%;
  display: block;
  margin: 1rem auto 1rem auto;
}

.app-logo {
  display: block;
  margin: 2rem auto 2rem auto;
  width: 30%;
  height: auto;
}

.email {
  font-size: 0.85rem;
  font-weight: bold;
  text-decoration: none;
}
</style>
