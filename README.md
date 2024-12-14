# Recipe Voice Memo App

This project is a web application that allows users to record, upload, and manage voice memos of recipes. The app uses React for the frontend and Node.js with Express for the backend. It also integrates with AssemblyAI for transcription services and Cohere for natural language processing.

## Features

- **Record and Upload Audio**: Users can record or upload audio files of recipes.
- **Transcription**: Audio files are transcribed into text using AssemblyAI.
- **Data Extraction**: Ingredients, masalas (spices), and steps are extracted from the transcription using Cohere.
- **CRUD Operations**: Users can add, edit, and delete ingredients, masalas, and steps.
- **Password Protection**: Sensitive operations like deleting or updating require a password.
- **Search Functionality**: Users can search recipes by ingredients.

## Technologies Used

- **Frontend**: React, Axios
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB
- **APIs**: AssemblyAI (for transcription), Cohere (for NLP)
- **Styling**: Tailwind CSS

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd recipe-voice-memo-app
   ```

2. **Install dependencies**:
   - For the backend:
     ```bash
     cd backend
     npm install
     ```
   - For the frontend:
     ```bash
     cd frontend
     npm install
     ```

3. **Environment Variables**:
   Create a `.env` file in the `backend` directory
   
## Usage

1. **Start the Backend Server**:
   ```bash
   cd backend
   node server.js
   ```

2. **Start the Frontend Development Server**:
   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000` to access the application.

## API Endpoints

- `GET /recipes`: Fetch all recipes.
- `POST /recipes`: Add a new recipe with an audio file.
- `PUT /recipes/:id/ingredients`: Add or update an ingredient in a recipe.
- `DELETE /recipes/:id/ingredients`: Delete an ingredient from a recipe.
- `PUT /recipes/:id/masalas`: Add or update a masala in a recipe.
- `DELETE /recipes/:id/masalas`: Delete a masala from a recipe.
- `PUT /recipes/:id/steps`: Add or update a step in a recipe.
- `DELETE /recipes/:id/steps`: Delete a step from a recipe.
- `PUT /recipes/:id/recording`: Update the voice recording for a recipe.

## Contributing

Contributions are welcome! Please fork this repository and submit pull requests for any improvements.

## License

This project is licensed under the MIT License.
