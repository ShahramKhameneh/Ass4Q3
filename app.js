var express = require('express');
var mongoose = require('mongoose');
var app = express();
var database = require('./config/database');
var bodyParser = require('body-parser');
const { engine } = require('express-handlebars');
var path = require('path');
require('dotenv').config();
//const token = process.env.TOKEN;


// Configure Handlebars
app.engine('handlebars', engine({
    defaultLayout: 'main', // Set the default layout to 'main'
    layoutsDir: path.join(__dirname, 'views/layouts'), // Path to layouts
    partialsDir: path.join(__dirname, 'views/partials'), // Path to partials
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views')); // Set the views directory

// Middleware
app.use(bodyParser.urlencoded({ extended: 'true' }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(express.static(path.join(__dirname, 'public')));


// MongoDB connection
mongoose.connect(database.url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Successfully connected to MongoDB:', database.url);
    })
    .catch(err => {
        console.error('Connection error', err);
        process.exit();
    });

// Static files (if needed, for serving CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
var Movie = require('./models/movie');

// Home route with Handlebars view
app.get('/', (req, res) => {
    res.render('index', { title: 'Home', message: 'Successfully connected to the database!' });
});


// Movies Routes
app.get('/movies', async (req, res) => {
    try {
        const movies = await Movie.find();
        // Convert Mongoose documents to plain objects
        const plainMovies = movies.map(movie => movie.toObject());
        res.render('movies', { movies: plainMovies }); // Pass plain objects to Handlebars
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving movies', error: err });
    }
});

//Adding new movie

app.get('/add-movie', async (req, res) => {
    try {
        const lastMovie = await Movie.findOne().sort({ Movie_ID: -1 }).exec();
        console.log('Last Movie:', lastMovie); // Log the last movie
        const nextMovieID = lastMovie ? lastMovie.Movie_ID + 1 : 1; // Default to 1 if no movies exist

        console.log('Next Movie_ID:', nextMovieID); // Log the calculated ID
        res.render('add-movie', { title: 'Add New Movie', nextMovieID });
    } catch (err) {
        console.error('Error fetching the next Movie_ID:', err.message);
        res.status(500).render('error', { message: 'Error fetching the next Movie_ID', error: err.message });
    }
});



app.post('/movies', async (req, res) => {
    try {
        const { Title, Year, Released, Genre, Director, Language, Production, Poster } = req.body;

        const lastMovie = await Movie.findOne().sort({ Movie_ID: -1 }).exec();
        console.log('Last Movie:', lastMovie); // Debugging
        const Movie_ID = lastMovie ? lastMovie.Movie_ID + 1 : 1;
        console.log('Assigned Movie_ID:', Movie_ID); // Debugging

        const movie = new Movie({ Movie_ID, Title, Year, Released, Genre, Director, Language, Production, Poster });
        await movie.save();

        console.log('New movie added:', movie);
        res.redirect('/movies');
    } catch (err) {
        console.error('Error adding movie:', err.message);
        res.status(400).render('add-movie', { 
            title: 'Add New Movie',
            error: 'Failed to add movie. Please ensure all fields are filled correctly.',
            nextMovieID: Movie_ID,
            movie: req.body
        });
    }
});






//deleting the movie-first fetching the data

app.get('/delete-movie/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const movie = await Movie.findOne({ Movie_ID: Number(id) });
        if (!movie) {
            console.log(`Movie with ID ${id} not found.`);
            return res.status(404).render('404', { message: 'Movie not found' });
        }
        res.render('delete-movie', { movie: movie.toObject() });
    } catch (err) {
        console.error('Error retrieving movie:', err.message);
        res.status(500).render('error', { message: 'Error retrieving movie', error: err.message });
    }
});
//remove the data
app.post('/delete-movie/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const movie = await Movie.findOneAndDelete({ Movie_ID: Number(id) });
        if (!movie) {
            console.log(`Movie with ID ${id} not found.`);
            return res.status(404).render('404', { message: 'Movie not found' });
        }
        console.log(`Movie with ID ${id} deleted successfully.`);
        res.redirect('/movies'); // Redirect to the movies list after deletion
    } catch (err) {
        console.error('Error deleting movie:', err.message);
        res.status(500).render('error', { message: 'Error deleting movie', error: err.message });
    }
});



// Add remaining movie-related routes
app.post('/movies', async (req, res) => {
    try {
        const movie = new Movie(req.body);
        await movie.save();
        res.redirect('/movies'); // Redirect to movies list
    } catch (err) {
        res.status(400).json({ message: 'Error adding movie', error: err });
    }

});

//Edit movie

app.get('/edit-movie/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const movie = await Movie.findOne({ Movie_ID: Number(id) });
        if (!movie) {
            console.log(`Movie with ID ${id} not found.`);
            return res.status(404).render('404', { message: 'Movie not found' });
        }
        console.log('Movie data:', movie);
        res.render('edit-movie', { movie: movie.toObject() });
    } catch (err) {
        console.error('Error retrieving movie:', err.message);
        res.status(500).render('error', { message: 'Error retrieving movie', error: err.message });
    }
});


//Save Edited movie
app.post('/edit-movie/:id', async (req, res) => {
    const { id } = req.params; // Ensure ID is parsed correctly
    console.log('ID Received:', id);
    const updatedData = req.body;
    console.log('Updated Data:', updatedData);

    try {
        const movie = await Movie.findOneAndUpdate({ Movie_ID: Number(id) }, updatedData, { new: true });
        if (!movie) {
            console.log('Movie not found for ID:', id);
            return res.status(404).json({ message: 'Movie not found' });
        }
        console.log('Movie Updated:', movie);
        res.redirect('/movies');
    } catch (err) {
        console.error('Error updating movie:', err);
        res.status(500).render('error', { message: 'Error updating movie', error: err.message });
    }
});


//search by ID or Title
app.get('/search', async (req, res) => {
    const { query } = req.query; // Extract the search query from the URL
    try {
        let movies;
        if (!isNaN(query)) {
            // If the query is a number, search by Movie_ID
            movies = await Movie.find({ Movie_ID: Number(query) });
        } else {
            // Otherwise, search by Title (case-insensitive)
            movies = await Movie.find({ Title: new RegExp(query, 'i') });
        }

        if (!movies || movies.length === 0) {
            return res.render('movies', { movies: [], message: 'No movies found.' });
        }

        // Render the results using the movies.handlebars template
        res.render('movies', { movies: movies.map(movie => movie.toObject()) });
    } catch (err) {
        console.error('Error searching for movies:', err.message);
        res.status(500).render('error', { message: 'Error searching for movies', error: err.message });
    }
});









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


// Error handling for missing pages
app.use((req, res) => {
    res.status(404).render('404', { layout: false });
});

// Server setup
var port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log("App listening on port: " + port);
});
