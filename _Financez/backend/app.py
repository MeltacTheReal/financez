from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from fastapi.staticfiles import StaticFiles
from supabase import create_client, Client
from fastapi import Depends, Header
from jose import jwt
import httpx

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

class LoginRequest(BaseModel):
    email: str
    password: str

class ResetPasswordRequest(BaseModel):
    email: str

class UpdatePasswordRequest(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    new_password: str

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
        if getattr(res, "error", None):
            raise HTTPException(status_code=500, detail=f"Categories error: {res.error}")
        return res.data or []

    def get(self, category_id: int):
        res = self.client.table("categories").select("*").eq("id", category_id).single().execute()
        if getattr(res, "error", None):
            raise HTTPException(status_code=500, detail=f"Category get error: {res.error}")
        return res.data

    def add(self, data: CategoryCreate):
        res = self.client.table("categories").insert({"name": data.name}).execute()
        if getattr(res, "error", None):
            raise HTTPException(status_code=500, detail=f"Category add error: {res.error}")
        return res.data[0]

    def update(self, category_id: int, data: CategoryCreate):
        res = self.client.table("categories").update({"name": data.name}).eq("id", category_id).execute()
        if getattr(res, "error", None):
            raise HTTPException(status_code=500, detail=f"Category update error: {res.error}")
        return res.data[0] if res.data else None

    def delete(self, category_id: int):
        res = self.client.table("categories").delete().eq("id", category_id).execute()
        if getattr(res, "error", None):
            raise HTTPException(status_code=500, detail=f"Category delete error: {res.error}")
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

# Supabase Auth / JWT verification
SUPABASE_PROJECT_REF = SUPABASE_URL.split("//")[1].split(".")[0]
AUTH_USER_URL = f"https://{SUPABASE_PROJECT_REF}.supabase.co/auth/v1/user"

async def verify_jwt_token(token: str):
    # Validate token by calling Supabase Auth /user endpoint
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(
                AUTH_USER_URL,
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": SUPABASE_KEY,
                },
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            data = resp.json()
            return data
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Token verification failed")

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization.split(" ", 1)[1]
    claims = await verify_jwt_token(token)
    try:
        # Ensure subsequent Supabase queries run under the user's identity (RLS-friendly)
        # For supabase-py, set the PostgREST bearer token
        supabase.postgrest.auth(token)
    except Exception:
        pass
    # Debug: print minimal claim info
    try:
        sub = claims.get('sub') if isinstance(claims, dict) else None
        print('Authenticated user:', sub)
    except Exception:
        pass
    return claims

print("THIS IS THE REAL APP.PY")
print("CWD:", os.getcwd())
#print("Static folder:", app.static_folder)
#print("Template folder:", app.template_folder)

@app.get("/", response_class=HTMLResponse)
def home():
    index_path = os.path.join(base_dir, 'templates', 'index.html')
    with open(index_path, 'r', encoding='utf-8') as f:
        return f.read()

# Seed categories if empty (to avoid empty UI on first run)
@app.on_event("startup")
async def seed_categories():
    try:
        res = supabase.table("categories").select("count", count='exact').execute()
        total = 0
        if isinstance(res.data, list) and res.data:
            # supabase-py returns list of rows; count accessible via res.count
            total = getattr(res, 'count', 0) or 0
        else:
            total = getattr(res, 'count', 0) or 0
        if (total or 0) == 0:
            defaults = [{"name": n} for n in ["Food", "Transport", "Utilities"]]
            supabase.table("categories").insert(defaults).execute()
    except Exception:
        # Non-fatal; continue without seeding
        pass

# CRUD Endpoints for expenses (protected)
@app.get('/expenses', response_model=List[Expense])
def list_expenses(user=Depends(get_current_user)):
    try:
        res = supabase.table("expenses").select("*").execute()
        if getattr(res, "error", None):
            print('Supabase expenses error:', res.error)
            raise HTTPException(status_code=500, detail=f"Expenses error: {res.error}")
        expenses = res.data or []
        return expenses
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print('Expenses exception:', repr(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/expenses', response_model=Expense, status_code=201)
def add_expense(expense: ExpenseCreate, user=Depends(get_current_user)):
    res = supabase.table("expenses").insert({
        "amount": expense.amount,
        "category_id": expense.category_id,
        "date": expense.date,
        "description": expense.description
    }).execute()
    return res.data[0]

@app.put('/expenses/{expense_id}', response_model=Expense)
def update_expense(expense_id: int, expense: ExpenseCreate, user=Depends(get_current_user)):
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
def delete_expense(expense_id: int, user=Depends(get_current_user)):
    res = supabase.table("expenses").delete().eq("id", expense_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail='Expense not found')
    return {"success": True}

@app.get('/ping')
def ping(user=Depends(get_current_user)):
    return {"message": "pong"}

# Categories (protected)
@app.get("/categories", response_model=List[Category])
def list_categories(user=Depends(get_current_user)):
    categories = category_repo.list()
    # print('categories:', categories)
    return categories

@app.post("/categories", response_model=Category, status_code=201)
def add_category(category: CategoryCreate, user=Depends(get_current_user)):
    created = category_repo.add(category)
    return created

@app.put("/categories/{category_id}", response_model=Category)
def update_category(category_id: int, category: CategoryCreate, user=Depends(get_current_user)):
    updated = category_repo.update(category_id, category)
    if not updated:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated

@app.delete("/categories/{category_id}")
def delete_category(category_id: int, user=Depends(get_current_user)):
    deleted = category_repo.delete(category_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True}

# Auth endpoints (open)
@app.post("/auth/signup")
def signup(body: LoginRequest):
    try:
        res = supabase.auth.sign_up({"email": body.email, "password": body.password})
        # If email confirmation is required, Supabase returns user without session
        if getattr(res, "user", None) and not getattr(res, "session", None):
            return {"message": "Signup successful. Please verify your email, then sign in."}
        if getattr(res, "user", None):
            return {"message": "Signup successful."}
        raise HTTPException(status_code=400, detail="Signup failed")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
def login(body: LoginRequest):
    try:
        res = supabase.auth.sign_in_with_password({"email": body.email, "password": body.password})
        if not getattr(res, "session", None) or not getattr(res.session, "access_token", None):
            raise HTTPException(status_code=401, detail="Invalid credentials or email not verified")
        return {"access_token": res.session.access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/auth/reset-password")
def reset_password(body: ResetPasswordRequest):
    try:
        res = supabase.auth.reset_password_email(body.email)
        return {"message": "Password reset email sent if the user exists."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/update-password")
def update_password(body: UpdatePasswordRequest):
    try:
        # Establish an auth session using recovery tokens, then update the password
        if hasattr(supabase.auth, "set_session"):
            supabase.auth.set_session(access_token=body.access_token, refresh_token=body.refresh_token or "")
        else:
            # Fallback: authorize postgrest for RLS-context (may still require session for update_user)
            supabase.postgrest.auth(body.access_token)
        res = supabase.auth.update_user({"password": body.new_password})
        return {"message": "Password updated"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# To run: uvicorn app:app --host 0.0.0.0 --port 8001