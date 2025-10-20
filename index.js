const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// POST request માંથી ડેટા વાંચવા માટે
app.use(express.urlencoded({ extended: true }));

// મુખ્ય પેજ (GET request)
app.get('/', (req, res) => {
    res.send(`
    <h1>User Data Exchange</h1>
    <form action="/submit" method="POST">
      <label for="userdata">Enter your text:</label><br>
      <input type="text" id="userdata" name="userdata" size="50"><br><br>
      <input type="submit" value="Submit">
    </form>
  `);
});

// ફોર્મ સબમિટ થયા પછી (POST request)
app.post('/submit', (req, res) => {
    const userInput = req.body.userdata;
    res.send(`
    <h1>Data Received</h1>
    <p>You entered: <strong>${userInput}</strong></p>
    <a href="/">Go back</a>
  `);
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});