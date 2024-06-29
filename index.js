console.log("hello, world!")

import express from "express";
import session from "express-session";
import mysql from "mysql";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/views"));
app.use(express.static(__dirname + "/icons"));

app.set("view engine", "ejs")
// import connection from "./config/db";

const port = 3000;

const connection = mysql.createConnection({
    host : "localhost",
    user: "root",
    password: "",
    database: "event_database",
});

connection.connect((err) => {
    if (err) throw err;
    console.log("connection successfull")
});

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

app.get("/login", (req,res) => {
    res.sendFile(__dirname + "/public/login.html");

});

app.get("/register", (req, res) => {
    res.sendFile(__dirname + "/public/signup.html");
});

// app.get("/signup", () => {
//     res.render(__dirname + "/views/signup.ejs")
// });

//localhost:3000 link
app.get("/", requireLogin, (req, res) => {
    const eventDate = new Date(req.body.date);
    const sqlData = "select * from events where date >= CURDATE() order by date";

    connection.query(sqlData, (err, rows) => { // Execute the query
        if (err) {
            console.log(err);
            return res.status(500).send("Internal Server Error");
        }

        res.render(__dirname + "/views/home.ejs", { events: rows, eventDate: eventDate });
    });
    console.log(sqlData);
});

app.get("/department", requireLogin, (req, res) => {
   const dept = req.query.department;
   departmentSort(dept, res);
});

app.get("/history", requireLogin, (req, res) => {
   eventHistory(res);
});


app.get("/eventform", requireLogin, (req, res) => {
    console.log("in event form");
    res.sendFile(__dirname + "/public/eventForm.html");
});

app.get("/event", requireLogin, (req, res) => {
    const eventId = req.query.id;
    eventPage(eventId, res);
    console.log("in event");
    // res.render(__dirname + "/views/events.ejs");
});

app.post("/eventform", (req, res) => {
    console.log(req.body);
    const eventTitle = req.body.title;
    const eventDepartment = req.body.department;
    const eventVenue = req.body.venue;
    const eventCoordinator = req.body.coordinator;
    const eventDate = new Date(req.body.date);
    const eventInfo = req.body.information;


    try {
        console.log("submitted");
        connection.query("INSERT INTO events (title,department,date,venue,coordinator,info) VALUES(?,?,?,?,?,?)",
        [eventTitle, eventDepartment, eventDate, eventVenue, eventCoordinator, eventInfo],
        (err, rows) => {
            if (err) {
                console.log(err);
            } else {
                // res.render(__dirname + "/views/home.ejs", { rows });
                res.redirect("/");
            }
        })
    } catch (err) {
        console.log(err);
    }

});



app.get("/delete", requireLogin, (req, res) => {
    const eventId = req.query.id;
    deleteEvent(eventId, res);
});

app.get("/update", requireLogin, (req, res) => {
    const eventId = req.query.id;

    const eventDate = new Date(req.body.date);
    const eventData = `select * from events where id=${eventId}`;

    connection.query(eventData, (err, rows) => { // Execute the query
        if (err) {
            console.log(err);
            return res.status(500).send("Internal Server Error");
        }

        res.render(__dirname + "/views/updateForm.ejs", { events: rows, eventDate: eventDate });
    });
});

app.post("/update", (req, res) => {
    const eventId = req.body.id;
    const eventTitle = req.body.title;
    const eventDepartment = req.body.department;
    const eventVenue = req.body.venue;
    const eventCoordinator = req.body.coordinator;
    const eventDate = new Date(req.body.date);
    const eventInfo = req.body.information;

    console.log(eventTitle, eventDepartment, eventDate, eventVenue, eventCoordinator, eventInfo, eventId);

    try {
        console.log("submitted");
        connection.query(
            "UPDATE events SET title = ?, department = ?, date = ?, venue = ?, coordinator = ?, info = ? WHERE id = ?",
            [eventTitle, eventDepartment, eventDate, eventVenue, eventCoordinator, eventInfo, eventId],
            (err, rows) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Internal Server Error");
                } else {
                    console.log("Event updated successfully");
                    res.redirect(`/event?id=${eventId}`);
                    //
                }
            }
        );
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
});

function departmentSort(dept, res){
    const sqlQuery = `select * from events where department="${dept}" AND date >= CURDATE() order by date;`;
    connection.query(sqlQuery, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Internal Server Error");
        }
        res.render(__dirname + "/views/home.ejs", { events: rows});
    });
}

function eventHistory(res){
    const sqlQuery = `select * from events where date < curdate() order by date;`;
    connection.query(sqlQuery, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Internal Server Error");
        }
        res.render(__dirname + "/views/home grayscale.ejs", { events: rows});
    });
}


function eventPage(eventID, res){
    const eventData = `select * from events where id=${eventID}`;
    connection.query(eventData, (err, rows) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Internal Server Error");
        }
        res.render(__dirname + "/views/events.ejs", { events: rows});
    });
    console.log(eventData);
}

function deleteEvent(eventId, res){
    const deleteData = `delete from events WHERE id ="${eventId}";`
    console.log(deleteData);
    connection.query(deleteData, (err) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Internal Server Error");
        }
        console.log("Event Deleted");
        res.redirect("/");
    });
}


app.listen(port, () => {
    console.log(`server is running on port ${port}`)
});

//login signup


app.post("/register", (req, res) => {
    console.log(req.body);
    const userName = req.body.name;
    const userEmail = req.body.email;
    const userPassword = req.body.password;
    const userDepartment = req.body.department;
    const userYear = req.body.year;
    const userDivision = req.body.division;

    try {
        console.log("user Registered");
        connection.query("INSERT INTO users (name,email,password,department,year,division) VALUES(?,?,?,?,?,?)",
        [userName, userEmail, userPassword, userDepartment, userYear, userDivision],
        (err, rows) => {
            if (err) {
                console.log(err);
            } else {
                // res.render(__dirname + "/views/home.ejs", { rows });
                res.redirect("/login");
            }
        })
    } catch (err) {
        console.log(err);
    }

})

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.send('<script>alert("Email and password are required"); window.location.href="/login";</script>');
    }

    connection.query("SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, results) => {
        if (err) {
            console.log(err);
            return res.send('<script>alert("Internal server error"); window.location.href="/login";</script>');
        }

        if (results.length === 0) {
            return res.send('<script>alert("Invalid email or password"); window.location.href="/login";</script>');
        }

        req.session.isLoggedIn = true;

        // if(email === "aarya@admin.com") {
        //     return res.render('<script>window.location.href="/"; $(".createEvent").css("display", "block");</script>');
        // }

        res.redirect("/");
    });
});

function requireLogin(req, res, next) {
    if (req.session.isLoggedIn) {
        // User is authenticated, continue to the next middleware/route handler
        next();
    } else {
        // User is not authenticated, redirect to the login page
        res.redirect("/login");
    }
}

app.get("/logout", (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Internal server error");
        }
        res.redirect("/login");
    });
});
