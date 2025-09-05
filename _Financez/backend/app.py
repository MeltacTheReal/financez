from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from fastapi.staticfiles import StaticFiles
from supabase import create_client, Client

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
class CategoryRepositoryBase:
    def list(self) -> List[Category]:
        raise NotImplementedError

    def get(self, category_id: int) -> Optional[Category]:
        raise NotImplementedError

    def add(self, data: CategoryCreate) -> Category:
        raise NotImplementedError

    def update(self, category_id: int, data: CategoryCreate) -> Category:
        raise NotImplementedError

    def delete(self, category_id: int) -> None:
        raise NotImplementedError

class InMemoryCategoryRepository(CategoryRepositoryBase):
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

    def update(self, category_id: int, data: CategoryCreate):
        category = self.get(category_id)
        if not category:
            return None
        category.update({"name": data.name})
        return category

    def delete(self, category_id: int):
        category = self.get(category_id)
        if category:
            self.categories.remove(category)
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

class SupabaseCategoryRepository(CategoryRepositoryBase):
    def __init__(self, client: Client):
        self.client = client

    def list(self):
        res = self.client.table("categories").select("*").execute()
        return res.data or []

    def get(self, category_id: int):
        res = self.client.table("categories").select("*").eq("id", category_id).single().execute()
        return res.data

    def add(self, data: CategoryCreate):
        res = self.client.table("categories").insert({"name": data.name}).execute()
        return res.data[0]

    def update(self, category_id: int, data: CategoryCreate):
        res = self.client.table("categories").update({"name": data.name}).eq("id", category_id).execute()
        return res.data[0] if res.data else None

    def delete(self, category_id: int):
        res = self.client.table("categories").delete().eq("id", category_id).execute()
        return res.data[0] if res.data else None

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

SUPABASE_URL = "https://dlyrlwdwwahychtofope.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRseXJsd2R3d2FoeWNodG9mb3BlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjU4NTksImV4cCI6MjA2MzUwMTg1OX0.sCaAmZ0S8pG0pLoQN3T5cK-t3UXRQYtMHaobt_kORzU"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
category_repo: CategoryRepositoryBase = SupabaseCategoryRepository(supabase)

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
    res = supabase.table("expenses").select("*", "categories(name)").execute()
    expenses = res.data or []
    return expenses

@app.post('/expenses', response_model=Expense, status_code=201)
def add_expense(expense: ExpenseCreate):
    res = supabase.table("expenses").insert({
        "amount": expense.amount,
        "category_id": expense.category_id,
        "date": expense.date,
        "description": expense.description
    }).execute()
    return res.data[0]

@app.put('/expenses/{expense_id}', response_model=Expense)
def update_expense(expense_id: int, expense: ExpenseCreate):
    res = supabase.table("expenses").update({
        "amount": expense.amount,
        "category_id": expense.category_id,
        "date": expense.date,
        "description": expense.description
    }).eq("id", expense_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail='Expense not found')
    return res.data[0]

@app.delete('/expenses/{expense_id}')
def delete_expense(expense_id: int):
    res = supabase.table("expenses").delete().eq("id", expense_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail='Expense not found')
    return {"success": True}

@app.get('/ping')
def ping():
    return {"message": "pong"}

@app.get("/categories", response_model=List[Category])
def list_categories():
    categories = category_repo.list()
    return categories

@app.post("/categories", response_model=Category, status_code=201)
def add_category(category: CategoryCreate):
    created = category_repo.add(category)
    return created

@app.put("/categories/{category_id}", response_model=Category)
def update_category(category_id: int, category: CategoryCreate):
    updated = category_repo.update(category_id, category)
    if not updated:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated

@app.delete("/categories/{category_id}")
def delete_category(category_id: int):
    deleted = category_repo.delete(category_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True}

# To run: uvicorn app:app --host 0.0.0.0 --port 8001