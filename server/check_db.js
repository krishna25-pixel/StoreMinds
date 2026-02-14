const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
    try {
        const db = await open({
            filename: './storeminds.db',
            driver: sqlite3.Database
        });

        console.log('Checking users table...');

        try {
            const users = await db.all('SELECT * FROM users');
            console.log('Users found:', users);
        } catch (e) {
            console.error('Error querying users table:', e.message);
        }

    } catch (err) {
        console.error('Error connecting to DB:', err);
    }
})();
