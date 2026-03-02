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

function loadDataFromStorage() {
    let rawMembers = localStorage.getItem("expenseSplitterMembersData");
    let rawExpenses = localStorage.getItem("expenseSplitterExpensesData");

    if (rawMembers !== null && rawMembers !== "") {
        appData.members = JSON.parse(rawMembers);
    }

    if (rawExpenses !== null && rawExpenses !== "") {
        appData.expenses = JSON.parse(rawExpenses);
    }
}

function persistDataToStorage() {
    let membersString = JSON.stringify(appData.members);
    let expensesString = JSON.stringify(appData.expenses);

    localStorage.setItem("expenseSplitterMembersData", membersString);
    localStorage.setItem("expenseSplitterExpensesData", expensesString);
}

function displayErrorMessage(msgText) {
    let errorContainer = document.getElementById("errorMsg");
    if (errorContainer) {
        errorContainer.innerText = msgText;
        errorContainer.style.display = "block";

        let timer = 3500;
        setTimeout(function () {
            errorContainer.style.display = "none";
            errorContainer.innerText = "";
        }, timer);
    }
}

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

function startEditExpenseMode(recordId) {
    currentEditId = recordId;

    let nameBox = document.getElementById("expName");
    let amtBox = document.getElementById("expAmount");
    let payerBox = document.getElementById("payerSelect");

    let specificRecord = null;
    for (let u = 0; u < appData.expenses.length; u++) {
        if (appData.expenses[u].id === recordId) {
            specificRecord = appData.expenses[u];
        }
    }

    if (specificRecord !== null) {
        nameBox.value = specificRecord.name;
        amtBox.value = specificRecord.amount;
        payerBox.value = specificRecord.payer;
    }

    let primaryB = document.getElementById("addExpBtn");
    let cancelB = document.getElementById("cancelEditBtn");

    if (primaryB) {
        primaryB.innerText = "Save Changes";
        primaryB.classList.remove("successBtn");
        primaryB.classList.add("warningBtn");
    }

    if (cancelB) {
        cancelB.classList.remove("hidden");
    }
}

function cancelEditBtnClick() {
    currentEditId = -1;

    let nameBox = document.getElementById("expName");
    let amtBox = document.getElementById("expAmount");
    let payerBox = document.getElementById("payerSelect");

    if (nameBox) nameBox.value = "";
    if (amtBox) amtBox.value = "";
    if (payerBox) payerBox.value = "";

    let primaryB = document.getElementById("addExpBtn");
    let cancelB = document.getElementById("cancelEditBtn");

    if (primaryB) {
        primaryB.innerText = "Save Expense";
        primaryB.classList.remove("warningBtn");
        primaryB.classList.add("successBtn");
    }

    if (cancelB) {
        cancelB.classList.add("hidden");
    }
}

function removeExpenseById(targetId) {
    let resultList = [];
    for (let y = 0; y < appData.expenses.length; y++) {
        if (appData.expenses[y].id !== targetId) {
            resultList.push(appData.expenses[y]);
        }
    }
    appData.expenses = resultList;
    persistDataToStorage();
    renderExpensesPage();
}

function resetSettlePage() {
    let resBox = document.getElementById("resultBox");
    if (resBox) {
        resBox.classList.add("hidden");
    }
}

function calculateSettlementBtnClick() {
    let resBox = document.getElementById("resultBox");
    let resList = document.getElementById("resultList");
    let sumText = document.getElementById("summaryText");

    if (!resBox || !resList || !sumText) return;

    resList.innerHTML = "";

    let membersCount = appData.members.length;
    let expensesCount = appData.expenses.length;

    if (membersCount === 0) {
        displayErrorMessage("Missing members data.");
        return;
    }

    if (expensesCount === 0) {
        displayErrorMessage("Missing expenses data.");
        return;
    }

    resBox.classList.remove("hidden");

    let totalSpend = 0;
    let ledger = {};

    for (let a = 0; a < membersCount; a++) {
        let n = appData.members[a];
        ledger[n] = 0;
    }

    for (let b = 0; b < expensesCount; b++) {
        let exAmt = appData.expenses[b].amount;
        let exPayer = appData.expenses[b].payer;

        totalSpend = totalSpend + exAmt;

        if (ledger[exPayer] !== undefined) {
            ledger[exPayer] = ledger[exPayer] + exAmt;
        }
    }

    let expectedShare = totalSpend / membersCount;

    sumText.innerHTML = "Total spent: <strong>₹" + formatCurrencyValue(totalSpend) + "</strong><br>";
    sumText.innerHTML += "Each person should pay: <strong>₹" + formatCurrencyValue(expectedShare) + "</strong>";

    let listGivers = [];
    let listReceivers = [];

    for (let c = 0; c < membersCount; c++) {
        let pName = appData.members[c];
        let diff = ledger[pName] - expectedShare;

        if (diff < -0.01) {
            let giverObj = {
                person: pName,
                value: Math.abs(diff)
            };
            listGivers.push(giverObj);
        } else if (diff > 0.01) {
            let receiverObj = {
                person: pName,
                value: diff
            };
            listReceivers.push(receiverObj);
        }
    }

    let counterMoves = 0;
    let ix = 0;
    let iy = 0;

    while (ix < listGivers.length && iy < listReceivers.length) {
        let gCurrent = listGivers[ix];
        let rCurrent = listReceivers[iy];

        let moveAmt = 0;
        if (gCurrent.value < rCurrent.value) {
            moveAmt = gCurrent.value;
        } else {
            moveAmt = rCurrent.value;
        }

        if (moveAmt > 0.01) {
            let lItem = document.createElement("li");
            lItem.innerHTML = "<span><strong>" + gCurrent.person + "</strong> pays <strong>₹" + formatCurrencyValue(moveAmt) + "</strong></span>";
            lItem.innerHTML += "<span>to <strong>" + rCurrent.person + "</strong></span>";
            resList.appendChild(lItem);
            counterMoves++;
        }

        gCurrent.value = gCurrent.value - moveAmt;
        rCurrent.value = rCurrent.value - moveAmt;

        if (gCurrent.value <= 0.01) {
            ix++;
        }
        if (rCurrent.value <= 0.01) {
            iy++;
        }
    }

    if (counterMoves === 0) {
        let perfectItem = document.createElement("li");
        perfectItem.innerText = "All debts are perfectly cleared!";
        perfectItem.style.color = "#27ae60";
        perfectItem.style.fontWeight = "600";
        perfectItem.style.justifyContent = "center";
        resList.appendChild(perfectItem);
    }
}