const API_URL = 'http://127.0.0.1:8001/expenses';

const expensesTable = document.getElementById('expenses-table');
const expenseModal = document.getElementById('expense-modal');
const addExpenseBtn = document.getElementById('add-expense-btn');
const closeModalBtn = document.getElementById('close-modal');
const expenseForm = document.getElementById('expense-form');
const modalTitle = document.getElementById('modal-title');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');

let editingId = null;
let deleteId = null;

function openModal(isEdit = false, expense = null) {
    expenseModal.classList.remove('hidden');
    if (isEdit && expense) {
        modalTitle.textContent = 'Edit Expense';
        document.getElementById('amount').value = expense.amount;
        document.getElementById('category').value = expense.category;
        document.getElementById('date').value = expense.date;
        document.getElementById('description').value = expense.description;
    } else {
        modalTitle.textContent = 'Add Expense';
        expenseForm.reset();
    }
}

function closeModal() {
    expenseModal.classList.add('hidden');
    editingId = null;
    expenseForm.reset();
}

addExpenseBtn.onclick = function() {
    editingId = null;
    openModal(false);
};

closeModalBtn.onclick = function() {
    closeModal();
};

expenseModal.addEventListener('click', function(e) {
    if (e.target === expenseModal) closeModal();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
});

function fetchExpenses() {
    fetch(API_URL)
        .then(res => res.json())
        .then(renderExpenses)
        .catch(err => {
            expensesTable.innerHTML = `<tr><td colspan="5" class="text-red-600">Error loading expenses</td></tr>`;
        });
}

function renderExpenses(expenses) {
    if (!expenses.length) {
        expensesTable.innerHTML = `<tr><td colspan="5" class="text-gray-500">No expenses yet.</td></tr>`;
        return;
    }
    expensesTable.innerHTML = '';
    expenses.forEach(exp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-4 py-2 text-right">${exp.amount}</td>
            <td class="px-4 py-2 text-right">${exp.category}</td>
            <td class="px-4 py-2 text-right">${exp.date}</td>
            <td class="px-4 py-2 text-right">${exp.description || ''}</td>
            <td class="px-4 py-2 text-right">
                <button class="text-blue-600 mr-2" onclick="editExpense(${exp.id})">Edit</button>
                <button class="text-red-600" onclick="deleteExpense(${exp.id})">Delete</button>
            </td>
        `;
        expensesTable.appendChild(tr);
    });
}

expenseForm.onsubmit = function(e) {
    e.preventDefault();
    const data = {
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        date: document.getElementById('date').value,
        description: document.getElementById('description').value
    };
    if (editingId) {
        fetch(`${API_URL}/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(() => {
            closeModal();
            fetchExpenses();
        });
    } else {
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(() => {
            closeModal();
            fetchExpenses();
        });
    }
};

window.editExpense = function(id) {
    fetch(`${API_URL}`)
        .then(res => res.json())
        .then(expenses => {
            const exp = expenses.find(e => e.id === id);
            if (exp) {
                editingId = id;
                openModal(true, exp);
            }
        });
};

function openDeleteModal(id) {
    deleteId = id;
    deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
    deleteId = null;
    deleteModal.classList.add('hidden');
}

cancelDeleteBtn.onclick = function() {
    closeDeleteModal();
};

deleteModal.addEventListener('click', function(e) {
    if (e.target === deleteModal) closeDeleteModal();
});

document.addEventListener('keydown', function(e) {
    if (!deleteModal.classList.contains('hidden') && e.key === 'Escape') closeDeleteModal();
});

confirmDeleteBtn.onclick = function() {
    if (deleteId) {
        fetch(`${API_URL}/${deleteId}`, { method: 'DELETE' })
            .then(() => {
                if (editingId === deleteId) {
                    closeModal();
                }
                closeDeleteModal();
                fetchExpenses();
            });
    }
};

window.deleteExpense = function(id) {
    openDeleteModal(id);
};

fetchExpenses(); 