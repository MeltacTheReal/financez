const API_URL = 'http://127.0.0.1:8001/expenses';
const CATEGORY_API_URL = 'http://127.0.0.1:8001/categories';

const expensesTable = document.getElementById('expenses-table');
const expenseModal = document.getElementById('expense-modal');
const addExpenseBtn = document.getElementById('add-expense-btn');
const closeModalBtn = document.getElementById('close-modal');
const expenseForm = document.getElementById('expense-form');
const modalTitle = document.getElementById('modal-title');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const adminCategoriesBtn = document.getElementById('admin-categories-btn');
const categoryAdminModal = document.getElementById('category-admin-modal');
const closeCategoryAdminBtn = document.getElementById('close-category-admin');
const categoryList = document.getElementById('category-list');
const addCategoryForm = document.getElementById('add-category-form');
const newCategoryName = document.getElementById('new-category-name');

// Category modal elements
const editCategoryModal = document.getElementById('edit-category-modal');
const closeEditCategoryBtn = document.getElementById('close-edit-category');
const editCategoryForm = document.getElementById('edit-category-form');
const editCategoryNameInput = document.getElementById('edit-category-name');
let editingCategoryId = null;

const deleteCategoryModal = document.getElementById('delete-category-modal');
const deleteCategoryNameSpan = document.getElementById('delete-category-name');
const cancelDeleteCategoryBtn = document.getElementById('cancel-delete-category');
const confirmDeleteCategoryBtn = document.getElementById('confirm-delete-category');
let deletingCategoryId = null;

let editingId = null;
let deleteId = null;
let categories = [];
let categoryMap = {};

function fetchCategories() {
    return fetch(CATEGORY_API_URL)
        .then(res => res.json())
        .then(data => {
            categories = data;
            categoryMap = {};
            const select = document.getElementById('category');
            select.innerHTML = '';
            data.forEach(cat => {
                categoryMap[cat.id] = cat.name;
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        });
}

function openModal(isEdit = false, expense = null) {
    expenseModal.classList.remove('hidden');
    fetchCategories().then(() => {
        if (isEdit && expense) {
            modalTitle.textContent = 'Edit Expense';
            document.getElementById('amount').value = expense.amount;
            document.getElementById('category').value = expense.category_id;
            document.getElementById('date').value = expense.date;
            document.getElementById('description').value = expense.description;
        } else {
            modalTitle.textContent = 'Add Expense';
            expenseForm.reset();
        }
    });
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
            <td class="px-4 py-2 text-right">${categoryMap[exp.category_id] || exp.category_id}</td>
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
        category_id: parseInt(document.getElementById('category').value),
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

function openCategoryAdmin() {
    categoryAdminModal.classList.remove('hidden');
    renderCategoryList();
}

function closeCategoryAdmin() {
    categoryAdminModal.classList.add('hidden');
    addCategoryForm.reset();
}

adminCategoriesBtn.onclick = openCategoryAdmin;
closeCategoryAdminBtn.onclick = closeCategoryAdmin;
categoryAdminModal.addEventListener('click', function(e) {
    if (e.target === categoryAdminModal) closeCategoryAdmin();
});
document.addEventListener('keydown', function(e) {
    if (!categoryAdminModal.classList.contains('hidden') && e.key === 'Escape') closeCategoryAdmin();
});

function openEditCategoryModal(cat) {
    editingCategoryId = cat.id;
    editCategoryNameInput.value = cat.name;
    editCategoryModal.classList.remove('hidden');
    editCategoryNameInput.focus();
}
function closeEditCategoryModal() {
    editingCategoryId = null;
    editCategoryModal.classList.add('hidden');
    editCategoryForm.reset();
}
closeEditCategoryBtn.onclick = closeEditCategoryModal;
editCategoryModal.addEventListener('click', function(e) {
    if (e.target === editCategoryModal) closeEditCategoryModal();
});
document.addEventListener('keydown', function(e) {
    if (!editCategoryModal.classList.contains('hidden') && e.key === 'Escape') closeEditCategoryModal();
});
editCategoryForm.onsubmit = function(e) {
    e.preventDefault();
    const newName = editCategoryNameInput.value.trim();
    if (!newName || editingCategoryId === null) return;
    fetch(`${CATEGORY_API_URL}/${editingCategoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
    })
    .then(() => {
        closeEditCategoryModal();
        renderCategoryList();
        fetchCategories().then(fetchExpenses);
    });
};

function openDeleteCategoryModal(cat) {
    deletingCategoryId = cat.id;
    deleteCategoryNameSpan.textContent = cat.name;
    deleteCategoryModal.classList.remove('hidden');
}
function closeDeleteCategoryModal() {
    deletingCategoryId = null;
    deleteCategoryModal.classList.add('hidden');
}
cancelDeleteCategoryBtn.onclick = closeDeleteCategoryModal;
deleteCategoryModal.addEventListener('click', function(e) {
    if (e.target === deleteCategoryModal) closeDeleteCategoryModal();
});
document.addEventListener('keydown', function(e) {
    if (!deleteCategoryModal.classList.contains('hidden') && e.key === 'Escape') closeDeleteCategoryModal();
});
confirmDeleteCategoryBtn.onclick = function() {
    if (!deletingCategoryId) return;
    fetch(`${CATEGORY_API_URL}/${deletingCategoryId}`, { method: 'DELETE' })
    .then(() => {
        closeDeleteCategoryModal();
        renderCategoryList();
        fetchCategories().then(fetchExpenses);
    });
};

function renderCategoryList() {
    fetchCategories().then(() => {
        categoryList.innerHTML = '';
        categories.forEach(cat => {
            const li = document.createElement('li');
            li.className = 'flex items-center gap-2 mb-1';
            const nameSpan = document.createElement('span');
            nameSpan.textContent = cat.name;
            nameSpan.className = 'flex-1';
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.className = 'text-blue-600 hover:underline';
            editBtn.onclick = () => openEditCategoryModal(cat);
            // Delete button
            const delBtn = document.createElement('button');
            delBtn.textContent = '🗑️';
            delBtn.className = 'text-red-600 hover:underline';
            delBtn.onclick = () => openDeleteCategoryModal(cat);
            li.appendChild(nameSpan);
            li.appendChild(editBtn);
            li.appendChild(delBtn);
            categoryList.appendChild(li);
        });
    });
}

addCategoryForm.onsubmit = function(e) {
    e.preventDefault();
    const name = newCategoryName.value.trim();
    if (!name) return;
    fetch(CATEGORY_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    })
    .then(() => {
        addCategoryForm.reset();
        renderCategoryList();
        fetchCategories().then(fetchExpenses);
    });
};

fetchCategories().then(fetchExpenses); 