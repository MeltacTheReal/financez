import os
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS

# Data access abstraction
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
            'amount': data['amount'],
            'category': data['category'],
            'date': data['date'],
            'description': data.get('description', '')
        }
        self.expenses.append(expense)
        self.next_id += 1
        return expense

    def update(self, expense_id, data):
        expense = self.get(expense_id)
        if expense:
            expense.update({
                'amount': data.get('amount', expense['amount']),
                'category': data.get('category', expense['category']),
                'date': data.get('date', expense['date']),
                'description': data.get('description', expense['description'])
            })
        return expense

    def delete(self, expense_id):
        expense = self.get(expense_id)
        if expense:
            self.expenses.remove(expense)
        return expense

# Initialisiere die Flask-Anwendung
base_dir = os.path.abspath(os.path.dirname(__file__))
app = Flask(
    __name__,
    static_folder=os.path.join(base_dir, 'static'),
    template_folder=os.path.join(base_dir, 'templates')
)
CORS(app)

repo = ExpenseRepository()

print("THIS IS THE REAL APP.PY")
print("CWD:", os.getcwd())
print("Static folder:", app.static_folder)
print("Template folder:", app.template_folder)

@app.route('/')
def home():
    #return "Hello, Flask root is working!"
    return render_template('index.html')

# CRUD Endpoints for expenses
@app.route('/expenses', methods=['GET'])
def list_expenses():
    return jsonify(repo.list())

@app.route('/expenses', methods=['POST'])
def add_expense():
    data = request.json
    expense = repo.add(data)
    return jsonify(expense), 201

@app.route('/expenses/<int:expense_id>', methods=['PUT'])
def update_expense(expense_id):
    data = request.json
    expense = repo.update(expense_id, data)
    if expense:
        return jsonify(expense)
    else:
        return jsonify({'error': 'Expense not found'}), 404

@app.route('/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    expense = repo.delete(expense_id)
    if expense:
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Expense not found'}), 404

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({'message': 'pong'})

# Hauptprogramm: Flask-Server starten
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001, debug=False)