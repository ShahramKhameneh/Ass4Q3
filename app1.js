var express  = require('express');
var mongoose = require('mongoose');
var app      = express();
var database = require('./config/database');
var bodyParser = require('body-parser');         // pull information from HTML POST (express4)
 
var port     = process.env.PORT || 8000;
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json

const { engine } = require('express-handlebars');
app.engine('handlebars', engine());

app.set('view engine', 'handlebars');



//mongoose.connect(database.url);


mongoose.connect(database.url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Successfully connected to MongoDB:', database.url);
    })
    .catch(err => {
        console.error('Connection error', err);
        process.exit();
    });

	// Define a test route
app.get('/', (req, res) => {
    res.send('API is working');
});

	
	var  Movie = require('./models/movie'); 
	// Connect to MongoDB
 

//Show All Movies

app.get('/movies', async (req, res) => {
    try {
        const movies = await Movie.find();
        console.log('Fetched movies:', movies); // Log retrieved movies
        res.json(movies);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving movies', error: err });
    }
});



// Get movie by Movie_ID    
app.get('/movies/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const movie = await Movie.findOne({ Movie_ID: Number(id) });
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        res.json(movie);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving movie', error: err });
    }
});

// Get movie by Title
app.get('/movies/title/:title', async (req, res) => {
    const { title } = req.params;

    try {
        const movie = await Movie.findOne({ Title: new RegExp(title, 'i') });
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        res.json(movie);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving movie', error: err });
    }
});


// Update movie by Movie_ID
app.put('/movies/:id', async (req, res) => {
    const { id } = req.params; // Extract Movie_ID from URL parameters
    const updateData = req.body; // Get the data to update from the request body

    try {
        // Convert id to a number to match the schema
        const movieId = Number(id);

        // Ensure id is a valid number
        if (isNaN(movieId)) {
            return res.status(400).json({ message: 'Invalid Movie_ID format' });
        }

        // Find and update the movie using Movie_ID
        const updatedMovie = await Movie.findOneAndUpdate(
            { Movie_ID: movieId }, // Search condition: Movie_ID matches
            updateData, // Data to update
            { new: true, runValidators: true } // Options: return updated doc & validate
        );

        // If no movie is found, return a 404 response
        if (!updatedMovie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // Success: Return the updated movie
        res.status(200).json({
            message: 'Movie updated successfully',
            data: updatedMovie,
        });
    } catch (err) {
        // Handle errors during update
        res.status(500).json({ message: 'Error updating movie', error: err.message });
    }
});




//Add  a New Movie
app.post('/movies', async (req, res) => {
    try {
        const movie = new Movie(req.body);
        await movie.save();
        res.status(201).json(movie);
    } catch (err) {
        res.status(400).json({ message: 'Error adding movie', error: err });
    }
});


//Delete A Movie

app.delete('/movies/:id', async (req, res) => {
    try {
        const result = await Movie.deleteOne({ Movie_ID: req.params.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        res.status(200).json({ message: 'Movie deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: 'Error deleting movie', error: err });
    }
});


app.listen(port);
console.log("App listening on port : " + port);
