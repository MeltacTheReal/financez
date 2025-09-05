function __initApp() {
const API_URL = 'http://127.0.0.1:8001/expenses';
const CATEGORY_API_URL = 'http://127.0.0.1:8001/categories';
const LOGIN_API_URL = 'http://127.0.0.1:8001/auth/login';
const SIGNUP_API_URL = 'http://127.0.0.1:8001/auth/signup';
const RESET_PWD_API_URL = 'http://127.0.0.1:8001/auth/reset-password';

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

// Auth elements/state
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const toggleAuthBtn = document.getElementById('toggle-auth');
const authTitle = document.getElementById('auth-title');
const authSubmit = document.getElementById('auth-submit');
const forgotPwdBtn = document.getElementById('forgot-password');
let isSignup = false;
let accessToken = localStorage.getItem('access_token') || null;

// Handle Supabase email redirect tokens in URL hash
(function handleEmailRedirect() {
    if (!window.location.hash) return;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const type = params.get('type');
    const token = params.get('access_token');
    const refresh = params.get('refresh_token');
    if (!type || !token) return;
    history.replaceState(null, '', window.location.pathname);
    if (type === 'signup') {
        localStorage.setItem('access_token', token);
        accessToken = token;
    } else if (type === 'recovery') {
        const newPwd = window.prompt('Enter new password:');
        if (newPwd) {
            fetch('http://127.0.0.1:8001/auth/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: token, refresh_token: refresh, new_password: newPwd })
            }).then(async res => {
                if (!res.ok) throw new Error(await res.text());
                alert('Password updated. Please login.');
            }).catch(err => alert('Password update failed: ' + err.message));
        }
    }
})();

function authHeader() {
    return accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};
}

function ensureAuthenticated() {
    if (!accessToken) {
        loginModal?.classList.remove('hidden');
        addExpenseBtn.disabled = true;
        adminCategoriesBtn.disabled = true;
    } else {
        loginModal?.classList.add('hidden');
        addExpenseBtn.disabled = false;
        adminCategoriesBtn.disabled = false;
        logoutBtn?.classList.remove('hidden');
    }
}

logoutBtn && (logoutBtn.onclick = function() {
    localStorage.removeItem('access_token');
    accessToken = null;
    ensureAuthenticated();
    expensesTable.innerHTML = '';
});

loginForm && loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    loginError?.classList.add('hidden');
    const body = { email: loginEmail.value, password: loginPassword.value };
    const url = isSignup ? SIGNUP_API_URL : LOGIN_API_URL;
    console.log(isSignup ? 'Attempting signup' : 'Attempting login', body.email);
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    .then(async res => {
        let payload = {};
        try { payload = await res.json(); } catch (_) {}
        if (!res.ok) {
            throw new Error(payload.detail || (isSignup ? 'Signup failed' : 'Login failed'));
        }
        if (isSignup) {
            // After signup, auto-switch to login mode with message
            isSignup = false;
            authTitle.textContent = 'Sign in';
            authSubmit.textContent = 'Login';
            toggleAuthBtn.textContent = 'Create account';
            loginError.textContent = 'Account created. Please sign in.';
            loginError.classList.remove('hidden');
            console.log('Signup successful for', body.email);
            return;
        }
        const token = payload.access_token;
        if (!token) throw new Error('No token returned');
        accessToken = token;
        localStorage.setItem('access_token', accessToken);
        loginModal?.classList.add('hidden');
        logoutBtn?.classList.remove('hidden');
        console.log('Login successful');
        fetchCategories().then(fetchExpenses);
    })
    .catch((err) => {
        console.error('Auth error:', err);
        loginError.textContent = err.message;
        loginError?.classList.remove('hidden');
    });
});

toggleAuthBtn && (toggleAuthBtn.onclick = function() {
    isSignup = !isSignup;
    if (isSignup) {
        authTitle.textContent = 'Create account';
        authSubmit.textContent = 'Sign up';
        toggleAuthBtn.textContent = 'Have an account? Sign in';
    } else {
        authTitle.textContent = 'Sign in';
        authSubmit.textContent = 'Login';
        toggleAuthBtn.textContent = 'Create account';
    }
    loginError.classList.add('hidden');
});

forgotPwdBtn && (forgotPwdBtn.onclick = function() {
    loginError.classList.add('hidden');
    const email = loginEmail.value.trim();
    if (!email) {
        loginError.textContent = 'Enter your email to reset password';
        loginError.classList.remove('hidden');
        return;
    }
    fetch(RESET_PWD_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    }).then(async res => {
        if (!res.ok) {
            const t = await res.text();
            throw new Error(t || 'Failed to send reset email');
        }
        loginError.textContent = 'Password reset email sent (check inbox).';
        loginError.classList.remove('hidden');
    }).catch(err => {
        loginError.textContent = err.message;
        loginError.classList.remove('hidden');
    });
});

let editingId = null;
let deleteId = null;
let categories = [];
let categoryMap = {};

function fetchCategories() {
    return fetch(CATEGORY_API_URL, { headers: { ...authHeader() } })
        .then(async res => {
            if (res.status === 401) {
                localStorage.removeItem('access_token');
                accessToken = null;
                ensureAuthenticated();
                throw new Error('Unauthorized');
            }
            if (!res.ok) {
                const t = await res.text();
                throw new Error('Categories load failed: ' + t);
            }
            return res.json();
        })
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
        })
        .catch(err => {
            console.error(err);
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
    fetch(API_URL, { headers: { ...authHeader() } })
        .then(async res => {
            if (res.status === 401) {
                localStorage.removeItem('access_token');
                accessToken = null;
                ensureAuthenticated();
                throw new Error('Unauthorized');
            }
            if (!res.ok) {
                const t = await res.text();
                throw new Error('Expenses load failed: ' + t);
            }
            return res.json();
        })
        .then(renderExpenses)
        .catch(err => {
            expensesTable.innerHTML = `<tr><td colspan="5" class="text-red-600">Error loading expenses</td></tr>`;
            console.error(err);
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
            headers: { 'Content-Type': 'application/json', ...authHeader() },
            body: JSON.stringify(data)
        })
        .then(() => {
            closeModal();
            fetchExpenses();
        });
    } else {
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader() },
            body: JSON.stringify(data)
        })
        .then(() => {
            closeModal();
            fetchExpenses();
        });
    }
};

window.editExpense = function(id) {
    fetch(`${API_URL}`, { headers: { ...authHeader() } })
        .then(async res => {
            if (!res.ok) throw new Error('Failed to load expenses');
            return res.json();
        })
        .then(expenses => {
            const exp = expenses.find(e => e.id === id);
            if (exp) {
                editingId = id;
                openModal(true, exp);
            }
        })
        .catch(err => {
            console.error(err);
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
        fetch(`${API_URL}/${deleteId}`, { method: 'DELETE', headers: { ...authHeader() } })
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
        headers: { 'Content-Type': 'application/json', ...authHeader() },
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
    fetch(`${CATEGORY_API_URL}/${deletingCategoryId}`, { method: 'DELETE', headers: { ...authHeader() } })
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
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ name })
    })
    .then(() => {
        addCategoryForm.reset();
        renderCategoryList();
        fetchCategories().then(fetchExpenses);
    });
};

ensureAuthenticated();
if (accessToken) {
    fetchCategories().then(fetchExpenses);
}
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', __initApp);
} else {
    __initApp();
}