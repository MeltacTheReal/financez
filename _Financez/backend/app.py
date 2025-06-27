from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from fastapi.staticfiles import StaticFiles

# Data models
class Category(BaseModel):
    id: int
    name: str

class CategoryCreate(BaseModel):
    name: str

class Expense(BaseModel):
    id: int
    amount: float
    category_id: int
    date: str
    description: Optional[str] = ""

class ExpenseCreate(BaseModel):
    amount: float
    category_id: int
    date: str
    description: Optional[str] = ""

# Data access abstraction
class CategoryRepository:
    def __init__(self):
        self.categories = [
            {"id": 1, "name": "Food"},
            {"id": 2, "name": "Transport"},
            {"id": 3, "name": "Utilities"},
        ]
        self.next_id = 4

    def list(self):
        return self.categories

    def get(self, category_id):
        return next((c for c in self.categories if c["id"] == category_id), None)

    def add(self, data):
        category = {"id": self.next_id, "name": data.name}
        self.categories.append(category)
        self.next_id += 1
        return category

class ExpenseRepository:
    def __init__(self):
        self.expenses = []
        self.next_id = 1

    def list(self):
        return self.expenses

    def get(self, expense_id):
        return next((e for e in self.expenses if e['id'] == expense_id), None)

    def add(self, data):
        expense = {
            'id': self.next_id,
            'amount': data.amount,
            'category_id': data.category_id,
            'date': data.date,
            'description': data.description or ''
        }
        self.expenses.append(expense)
        self.next_id += 1
        return expense

    def update(self, expense_id, data):
        expense = self.get(expense_id)
        if expense:
            expense.update({
                'amount': data.amount if data.amount is not None else expense['amount'],
                'category_id': data.category_id if data.category_id is not None else expense['category_id'],
                'date': data.date if data.date is not None else expense['date'],
                'description': data.description if data.description is not None else expense['description']
            })
        return expense

    def delete(self, expense_id):
        expense = self.get(expense_id)
        if expense:
            self.expenses.remove(expense)
        return expense

# FastAPI app
base_dir = os.path.abspath(os.path.dirname(__file__))
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=os.path.join(base_dir, "static")), name="static")

repo = ExpenseRepository()
category_repo = CategoryRepository()

print("THIS IS THE REAL APP.PY")
print("CWD:", os.getcwd())
#print("Static folder:", app.static_folder)
#print("Template folder:", app.template_folder)

@app.get("/", response_class=HTMLResponse)
def home():
    index_path = os.path.join(base_dir, 'templates', 'index.html')
    with open(index_path, 'r', encoding='utf-8') as f:
        return f.read()

# CRUD Endpoints for expenses
@app.get('/expenses', response_model=List[Expense])
def list_expenses():
    return repo.list()

@app.post('/expenses', response_model=Expense, status_code=201)
def add_expense(expense: ExpenseCreate):
    new_expense = repo.add(expense)
    return new_expense

@app.put('/expenses/{expense_id}', response_model=Expense)
def update_expense(expense_id: int, expense: ExpenseCreate):
    updated = repo.update(expense_id, expense)
    if updated:
        return updated
    else:
        raise HTTPException(status_code=404, detail='Expense not found')

@app.delete('/expenses/{expense_id}')
def delete_expense(expense_id: int):
    deleted = repo.delete(expense_id)
    if deleted:
        return {"success": True}
    else:
        raise HTTPException(status_code=404, detail='Expense not found')

@app.get('/ping')
def ping():
    return {"message": "pong"}

@app.get("/categories", response_model=List[Category])
def list_categories():
    return category_repo.list()

@app.post("/categories", response_model=Category, status_code=201)
def add_category(category: CategoryCreate):
    return category_repo.add(category)

@app.put("/categories/{category_id}", response_model=Category)
def update_category(category_id: int, category: CategoryCreate):
    cat = category_repo.get(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    cat["name"] = category.name
    return cat

@app.delete("/categories/{category_id}")
def delete_category(category_id: int):
    cat = category_repo.get(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    category_repo.categories.remove(cat)
    return {"success": True}

# To run: uvicorn app:app --host 0.0.0.0 --port 8001