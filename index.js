const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 8000;

//  MongoDB Connection
mongoose
    .connect('mongodb://127.0.0.1:27017/Week2')
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("Mongo Error", err));

//Schema
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    jobTitle: {
        type: String,
    },
    gender: {
        type: String,
    },
}, { timestamps: true }
);

const User = mongoose.model("user", userSchema);

// Middleware to handle URL-encoded data
app.use(express.urlencoded({ extended: false }));

// Route to display users in HTML format
app.get('/users', async (req, res) => {
    const allDbUsers = await User.find({});
    const html = `
    <ul>
        ${allDbUsers.map((user) => `<li>${user.firstName} - ${user.email}</li>`).join("")}
        </ul>
    `;
    res.send(html);
});

// API route to fetch all users
app.get('/api/users', async (req, res) => {
    const allDbUsers = await User.find({});
    res.json(allDbUsers);
});

// API route to handle user operations (GET, PATCH, DELETE)
app.route('/api/users/:id')
    .get(async (req, res) => {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        return res.json(user);
    })
    .patch(async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ error: "User not found" });

            const { first_name, last_name, email, gender, job_title } = req.body;
            if (!first_name || !last_name) {
                return res.status(400).json({ message: "First name and last name are required" });
            }
            // Update the user's details
            user.firstName = first_name;
            user.lastName = last_name;
            user.email = email || user.email;
            user.gender = gender || user.gender;
            user.jobTitle = job_title || user.jobTitle;

            // Save the updated user
            const updatedUser = await user.save();
            res.status(200).json({ status: "success", user: updatedUser });
        } catch (error) {
            res.status(500).jsonn({ error: "Error updaring usr" });
        }


    })
    .delete(async (req, res) => {
        try {
            const user = await User.findByIdAndDelete(req.params.id);
            if (!user) return res.status(404).json({ message: "User not found" });

            res.json({ status: "success", message: "user deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: "Error deleting user" });
        }

    });

// API route to create a new user
app.post('/api/users', async (req, res) => {
    const body = req.body;
    if (!body || !body.first_name || !body.last_name || !body.email || !body.gender || !body.job_title) {
        return res.status(400).json({ message: "All fiels are Required.." });
    }

    try {
        //Check if the email already exists
        const existingUser = await User.findOne ({email: body.email});
        if (existingUser) {
            return res.status(400).json({message: "Email already exists"});
        }
        // Create the new user
        const newUser = await User.create({
            firstName: body.first_name,
            lastName: body.last_name,
            email: body.email,
            gender: body.gender,
            jobTitle: body.job_title,
        });
    
        return res.status(201).json({ message: "success", user: newUser });
    } catch (error) {
        res.status(500).json({error: "Error creating user"});
    }

});

// Start the server
app.listen(PORT, () => console.log(`Server started on PORT: ${PORT}`));
