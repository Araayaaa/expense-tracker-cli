#!/usr/bin/env node
const { program } = require('commander');
const path = require('path');
const fs = require('fs');

// storing data to json
const FILE_PATH = path.join(__dirname, 'datas.json');
const FILE_PATH_SUMMARY = path.join(__dirname, 'month.json');

function readSummary() {
    if (!fs.existsSync(FILE_PATH_SUMMARY)) {
        fs.writeFileSync(FILE_PATH_SUMMARY, "[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]");
    }

    const summary = fs.readFileSync(FILE_PATH_SUMMARY);
    return JSON.parse(summary);
}

function writeSummary(month, amount) {
    let months = readSummary();
    months[month] += parseInt(amount);

    fs.writeFileSync(FILE_PATH_SUMMARY, JSON.stringify(months));
}

function readData() {
    if (!fs.existsSync(FILE_PATH)) {
        fs.writeFileSync(FILE_PATH, "[]");
    }

    const expenses = fs.readFileSync(FILE_PATH);
    return JSON.parse(expenses);
}

function writeData(expenses) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(expenses, null, 4));
}

function addExpense(expense, amount) {
    if (amount < 0) {
        console.log('Failed to add (Amount must be positive number)');
        return;
    }
    let expenses = readData();
    let month = new Date().getMonth();
    const newExpense = {
        id: expenses.length === 0 ? 1 : (expenses.length + 1),
        expense,
        amount,
        createdAt: new Date().toISOString().substring(0, 10),
        updatedAt: new Date().toISOString().substring(0, 10)
    };

    expenses.push(newExpense);
    writeData(expenses);
    writeSummary(month, parseInt(amount));
    console.log(`Expense added successfully (ID: ${newExpense.id})`);
}

function listExpenses() {
    let expenses = readData();
    console.log("ID\tDate\t\tDescription\tAmount")
    expenses.forEach(expense => {
        console.log(`${expense.id}\t${expense.createdAt}\t${expense.expense}\t\t$${expense.amount}`)
    });
}

function summaryExpenses(command) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let month = readSummary();
    if (command[1] == '--month' && command[2] != undefined) {
        console.log(`Total Expenses for ${months[command[2] - 1]}: $${month[command[2] - 1]}`);
    }
    else {
        let totalExpenses = 0;
        month.forEach(monthlyExpense => {
            totalExpenses = totalExpenses + monthlyExpense
        });
        console.log(`Total Expenses: $${totalExpenses}`);
    }
}

function deleteExpense(targetId) {
    let expenses = readData();
    let summary = readSummary();
    let expense = expenses.filter(e => e.id !== targetId);

    let targetExpense = expenses.filter(e => e.id === targetId);
    targetExpense.forEach(t => {
        summary[Number(t.createdAt.substring(5, 7)) - 1] = summary[Number(t.createdAt.substring(5, 7)) - 1] - t.amount;
        fs.writeFileSync(FILE_PATH_SUMMARY, JSON.stringify(summary));
    });

    if (expense.length === expenses.length) {
        console.log('ID not found.');
        return;
    }

    writeData(expense);
    console.log('Expense deleted successfully');
    return;
}

function updateExpense(targetId, newDescription, newAmount) {
    if (newAmount < 0) {
        console.log('Failed to add (Amount must be positive number)');
        return;
    }
    let expenses = readData();
    let expense = expenses.filter(e => e.id === targetId);
    let summary = readSummary();

    if (expense.length === 0) {
        console.log('Expense not found.')
        return;
    }

    if (newDescription) {
        expense.forEach(e => {
            e.expense = newDescription;
        })
    }

    if (newAmount) {
        expense.forEach(e => {
            summary[Number(e.createdAt.substring(5, 7)) - 1] = summary[Number(e.createdAt.substring(5, 7)) - 1] - e.amount;
            fs.writeFileSync(FILE_PATH_SUMMARY, JSON.stringify(summary));

            e.amount = newAmount;

            summary[Number(e.createdAt.substring(5, 7)) - 1] = summary[Number(e.createdAt.substring(5, 7)) - 1] + Number(e.amount);
            fs.writeFileSync(FILE_PATH_SUMMARY, JSON.stringify(summary));
        })
    }

    expense.forEach(e => {
        e.updatedAt = new Date().toISOString().substring(0, 10);
    })

    writeData(expenses);
    console.log('Expense successfully updated.');
    return;
}

// command parser
program
    .command('add')
    .requiredOption('--description <description>', 'description')
    .requiredOption('--amount <amount>', 'expense amount')
    .action((options) => {
        addExpense(options.description, Number(options.amount));
    });

program
    .command('list')
    .action(() => {
        listExpenses();
    });

program
    .command('summary')
    .option('--month [month]', 'Month Summary')
    .action(() => {
        summaryExpenses(program.args)
    });

program
    .command('delete')
    .requiredOption('--id', 'id')
    .argument('<id>')
    .action((id) => {
        deleteExpense(Number(id));
    });

program
    .command('update')
    .requiredOption('--id <id>', 'id')
    .option('--description [description]', 'description', '')
    .option('--amount [amount]', 'amount', 0)
    .action((options) => {
        updateExpense(Number(options.id), options.description, options.amount);
    });

program.parse();