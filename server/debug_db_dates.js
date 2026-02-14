const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
    try {
        const db = await open({
            filename: './storeminds.db',
            driver: sqlite3.Database
        });

        console.log('--- Transactions ---');
        const transactions = await db.all('SELECT id, total, payment_method, date, typeof(date) as type FROM transactions');
        console.log(JSON.stringify(transactions, null, 2));

        console.log('\n--- SQLite Date Checks ---');
        console.log("date('now'):", await db.get("SELECT date('now')"));
        console.log("datetime('now'):", await db.get("SELECT datetime('now')"));
        console.log("date('now', 'localtime'):", await db.get("SELECT date('now', 'localtime')"));

        if (transactions.length > 0) {
            const firstDate = transactions[0].date;
            console.log(`\nCheck match for first transaction [${firstDate}]:`);
            console.log("date(?):", await db.get("SELECT date(?) as d", firstDate));
            console.log("match UTC:", await db.get("SELECT date(?) = date('now') as match", firstDate));
            console.log("match Local:", await db.get("SELECT date(?, 'localtime') = date('now', 'localtime') as match", firstDate));
        }

    } catch (err) {
        console.error(err);
    }
})();
