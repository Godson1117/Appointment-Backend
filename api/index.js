const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());


//Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected')).catch(err => console.error(err));


// Define Schema and Model
const appointmentSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String,
        enum: ['10am', '1pm', '3pm', '5pm'],
        required: true,
    },
    service: {
        type: String,
        enum: ['facial', 'massage', 'haircut', 'manicure'],
        required: true,
    },
    specialRequests: {
        type: String,
        trim: true,
    },
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

// CRUD APIs
app.get('/', (req, res) => {
    res.send('Welcome to the Beauty Parlour API');
})

app.get('/appointments/:phone', async (req, res) => {
    try {
        const appointment = await Appointment.findOne({ phone: req.params.phone });
        if (appointment) {
            res.json({ exists: true, appointment });
        } else {
            res.json({ exists: false });
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/appointments', async (req, res) => {
    try {
        console.log(req.body);
        const { name, email, phone, date, time, service, specialRequests } = req.body;

        // Validate the date format
        if (!date || isNaN(Date.parse(date))) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        // Ensure date is parsed correctly
        const parsedDate = new Date(date);

        // Check for required fields
        if (!name || !phone || !time || !service) {
            return res.status(400).json({ message: 'Name, phone, time, and service are required' });
        }

        const newAppointment = new Appointment({ name, email, phone, date: parsedDate, time, service, specialRequests });
        await newAppointment.save();
        res.status(201).json(newAppointment);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.put('/appointments/:phone', async (req, res) => {
    try {
        const { phone } = req.params;
        const updateFields = req.body;

        // Validate the date format if `date` is provided
        if (updateFields.date && isNaN(Date.parse(updateFields.date))) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        // Parse the date field if provided
        if (updateFields.date) {
            updateFields.date = new Date(updateFields.date);
        }

        // Perform the update
        const updatedAppointment = await Appointment.findOneAndUpdate(
            { phone },
            { $set: updateFields }, // Only update the provided fields
            { new: true } // Return the updated document
        );

        if (updatedAppointment) {
            res.json(updatedAppointment);
        } else {
            res.status(404).json({ message: 'Appointment not found' });
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.delete('/appointments/:phone', async (req, res) => {
    try {
        const deleted = await Appointment.findOneAndDelete({ phone: req.params.phone });
        if (deleted) {
            res.json(deleted);
        } else {
            res.status(404).json({ message: 'Appointment not found' });
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));



