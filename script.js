let appData = {
    members: [],
    expenses: []
};

let currentEditId = -1;


function initPage() {
    loadDataFromStorage();

    let path = window.location.pathname;
    let isIndex = document.getElementById("memberList") !== null;
    let isExpenses = document.getElementById("expList") !== null;
    let isSettle = document.getElementById("calcBtn") !== null;

    if (isIndex) {
        renderDashboard();
    } else if (isExpenses) {
        renderExpensesPage();
    } else if (isSettle) {
        resetSettlePage();
    }
}


function loadDataFromStorage() {}

function persistDataToStorage() {}

function displayErrorMessage() {}

function renderDashboard() {
    let listElement = document.getElementById("memberList");
    if (!listElement) return;

    listElement.innerHTML = "";

    let totalMembersCount = 0;
    let totalExpensesFound = 0;
    let grandTotalAmount = 0.0;

    for (let index = 0; index < appData.members.length; index++) {
        let currentMember = appData.members[index];
        totalMembersCount++;

        let listItem = document.createElement("li");

        let nameSpan = document.createElement("span");
        nameSpan.innerText = currentMember;

        let removeButton = document.createElement("button");
        removeButton.innerText = "Remove";
        removeButton.className = "btn dangerBtn";
        removeButton.onclick = function () {
            executeMemberDeletion(currentMember);
        };

        listItem.appendChild(nameSpan);
        listItem.appendChild(removeButton);
        listElement.appendChild(listItem);
    }

    for (let j = 0; j < appData.expenses.length; j++) {
        let ex = appData.expenses[j];
        totalExpensesFound++;
        grandTotalAmount = grandTotalAmount + ex.amount;
    }

    let statMem = document.getElementById("statMembersCount");
    let statExp = document.getElementById("statExpensesCount");
    let statAmt = document.getElementById("statTotalAmount");

    if (statMem) statMem.innerText = totalMembersCount.toString();
    if (statExp) statExp.innerText = totalExpensesFound.toString();
    if (statAmt) statAmt.innerText = formatCurrencyValue(grandTotalAmount);
}


function formatCurrencyValue(valueNumber) {
    let rounded = Math.round(valueNumber * 100) / 100;
    let parts = rounded.toString().split(".");
    let integerPart = parts[0];
    let decimalPart = parts.length > 1 ? parts[1] : "00";

    if (decimalPart.length === 1) {
        decimalPart = decimalPart + "0";
    }

    return integerPart + "." + decimalPart;
}


function addMemberBtnClick() {
    let inputEl = document.getElementById("memberName");
    if (!inputEl) return;

    let typedName = inputEl.value;
    let cleanName = "";

    for (let k = 0; k < typedName.length; k++) {
        cleanName = cleanName + typedName[k];
    }
    cleanName = cleanName.trim();

    if (cleanName.length === 0) {
        displayErrorMessage("Member name cannot be empty.");
        return;
    }

    let isDuplicate = false;
    for (let m = 0; m < appData.members.length; m++) {
        if (appData.members[m].toLowerCase() === cleanName.toLowerCase()) {
            isDuplicate = true;
        }
    }

    if (isDuplicate) {
        displayErrorMessage("This person is already in the group.");
        return;
    }

    appData.members.push(cleanName);
    inputEl.value = "";

    persistDataToStorage();
    renderDashboard();
}


function executeMemberDeletion(targetName) {
    let hasExpenses = false;
    for (let e = 0; e < appData.expenses.length; e++) {
        if (appData.expenses[e].payer === targetName) {
            hasExpenses = true;
        }
    }

    if (hasExpenses) {
        displayErrorMessage("Cannot remove person. They have associated expenses.");
        return;
    }

    let updatedMembersList = [];
    for (let i = 0; i < appData.members.length; i++) {
        if (appData.members[i] !== targetName) {
            updatedMembersList.push(appData.members[i]);
        }
    }

    appData.members = updatedMembersList;
    persistDataToStorage();
    renderDashboard();
}


function renderExpensesPage() {
    let expListEl = document.getElementById("expList");
    let payerSelectEl = document.getElementById("payerSelect");

    if (!expListEl || !payerSelectEl) return;

    payerSelectEl.innerHTML = "";
    let defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.innerText = "Select a member";
    payerSelectEl.appendChild(defaultOpt);

    for (let p = 0; p < appData.members.length; p++) {
        let opt = document.createElement("option");
        opt.value = appData.members[p];
        opt.innerText = appData.members[p];
        payerSelectEl.appendChild(opt);
    }

    expListEl.innerHTML = "";

    for (let x = 0; x < appData.expenses.length; x++) {
        let currentExp = appData.expenses[x];

        let listItem = document.createElement("li");

        let textDiv = document.createElement("div");
        textDiv.className = "flexColumn";

        let headerSpan = document.createElement("strong");
        headerSpan.innerText = currentExp.name;

        let descSpan = document.createElement("span");
        descSpan.innerText = "Paid ₹" + formatCurrencyValue(currentExp.amount) + " by " + currentExp.payer;

        textDiv.appendChild(headerSpan);
        textDiv.appendChild(descSpan);

        let btnsDiv = document.createElement("div");
        btnsDiv.className = "actionButtons";

        let editB = document.createElement("button");
        editB.className = "editBtn";
        editB.innerText = "Edit";
        editB.onclick = function () {
            startEditExpenseMode(currentExp.id);
        };

        let delB = document.createElement("button");
        delB.className = "btn dangerBtn";
        delB.innerText = "Delete";
        delB.onclick = function () {
            removeExpenseById(currentExp.id);
        };

        btnsDiv.appendChild(editB);
        btnsDiv.appendChild(delB);

        listItem.appendChild(textDiv);
        listItem.appendChild(btnsDiv);

        expListEl.appendChild(listItem);
    }
}


function addExpenseBtnClick() {
    let nameBox = document.getElementById("expName");
    let amtBox = document.getElementById("expAmount");
    let payerBox = document.getElementById("payerSelect");

    if (!nameBox || !amtBox || !payerBox) return;

    let eName = nameBox.value.trim();
    let eAmt = parseFloat(amtBox.value);
    let ePayer = payerBox.value;

    let isNameValid = eName.length > 0;
    let isAmtValid = !isNaN(eAmt) && eAmt > 0;
    let isPayerValid = ePayer !== "";

    if (!isNameValid || !isAmtValid || !isPayerValid) {
        displayErrorMessage("Please fill all fields with correct data.");
        return;
    }

    if (currentEditId === -1) {
        let generatedId = new Date().getTime();
        let newRecord = {
            id: generatedId,
            name: eName,
            amount: eAmt,
            payer: ePayer
        };
        appData.expenses.push(newRecord);
    } else {
        for (let r = 0; r < appData.expenses.length; r++) {
            if (appData.expenses[r].id === currentEditId) {
                appData.expenses[r].name = eName;
                appData.expenses[r].amount = eAmt;
                appData.expenses[r].payer = ePayer;
            }
        }
        cancelEditBtnClick();
    }

    if (currentEditId === -1) {
        nameBox.value = "";
        amtBox.value = "";
        payerBox.value = "";
    }

    persistDataToStorage();
    renderExpensesPage();
}


function startEditExpenseMode() {}

function cancelEditBtnClick() {}

function removeExpenseById() {}

function resetSettlePage() {}

function calculateSettlementBtnClick() {}

