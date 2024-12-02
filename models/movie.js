const mongoose = require('mongoose');

// Define the movie schema
const movieSchema = new mongoose.Schema({
    Movie_ID: { type: Number, required: true, unique: true },
    Title: { type: String, required: true },
    Year: { type: Number, required: true },
    Rated: { type: String },
    Released: { type: Date }, // Change to Date type for better handling
    Runtime: { type: String },
    Genre: { type: String },
    Director: { type: String },
    Writer: { type: String },
    Actors: { type: String },
    Plot: { type: String },
    Language: { type: String },
    Country: { type: String },
    Awards: { type: String },
    Poster: { type: String },
    imdbRating: { type: Number },
    imdbVotes: { type: String },
    imdbID: { type: String }
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

// Export the model
const Movie = mongoose.model('Movie', movieSchema, 'Movies');

module.exports = Movie;
