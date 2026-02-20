const members = [];

document.getElementById('add-member-btn').addEventListener('click', function() {
    const memberInput = document.getElementById('member-name');
    const memberList = document.getElementById('member-list');
    
    const name = memberInput.value;
    
    if (name === '') {
        alert('Please enter a member name');
        return;
    }
    
    members.push(name);
    
    const li = document.createElement('li');
    li.textContent = name;
    
    memberList.appendChild(li);
    
    memberInput.value = '';
});

document.getElementById('add-btn').addEventListener('click', function() {
    const nameInput = document.getElementById('expense-name');
    const amountInput = document.getElementById('expense-amount');
    const list = document.getElementById('expense-list');
    
    const name = nameInput.value;
    const amount = amountInput.value;
    
    if (name === '' || amount === '') {
        alert('Please enter both name and amount');
        return;
    }
    
    const li = document.createElement('li');
    li.textContent = name + ': ₹' + amount;
    
    list.appendChild(li);
    
    nameInput.value = '';
    amountInput.value = '';
});