const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

const bcrypt = require("bcrypt");
app.use(express.json());

let db = null;

const dbConnection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Database server is connected at http://localhost:3000 port");
    });
  } catch (err) {
    console.log(`Database error : ${err.message}`);
    process.exit(1);
  }
};

dbConnection();

// 1. REGISTER API

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const selectUser = `select * from user where username = "${username}";`;
  const hashedPassword = await bcrypt.hash(password, 10);
  const dbUser = await db.get(selectUser);

  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `insert into user (username, name, password, gender, location)
                                    values("${username}", "${name}", "${hashedPassword}", "${gender}", "${location}");`;

      await db.run(createUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// 2. LOGIN API

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUser = `select * from user where username = "${username}";`;
  const dbUser = await db.get(selectUser);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordCheck = await bcrypt.compare(password, dbUser.password);

    if (isPasswordCheck === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// 3. UPDATE PASSWORD API

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUser = `select * from user where username = "${username}";`;
  const dbUser = await db.get(selectUser);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );

    if (isPasswordMatched === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updateQuery = `update user set password = "${hashedPassword}" where username = "${username}";`;

        await db.run(updateQuery);

        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
