const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();
const { CohereClientV2 } = require('cohere-ai');



const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once("open", () => console.log("Connected to MongoDB"));
// Schema and Model
const recipeSchema = new mongoose.Schema({
    title: String,
    audioUrl: String,
    ingredients: [
        {
            name: String,
            count: Number, // Optional count field
        },
    ],
    masalas: [
        {
            name: String,
            count: Number, // Optional count field
        },
    ],
    steps: [String], // Array of strings for steps
});

const Recipe = mongoose.model("Recipe", recipeSchema);

// File Upload Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// Middleware for Password Validation
const validatePassword = (req, res, next) => {
    const { password } = req.body;
    const correctPassword = process.env.DELETE_PASSWORD;

    if (password !== correctPassword) {
        return res.status(403).json({ error: "Incorrect password" });
    }
    next();
};

const cohere = new CohereClientV2({
    token: process.env.COHERE_API_KEY,
});

// Get all recipes
app.get("/recipes", async (req, res) => {
    try {
        const recipes = await Recipe.find();
        res.json(recipes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch recipes" });
    }
});

// Initialize OpenAI API
const processTextWithCohere = async (text) => {
    try {
        const response = await cohere.generate({
            model: "command-xlarge",
            prompt: `
            Convert the input to proper steps in this format: ["Step 1: XYZ", "Step 2: ABC"]
            Input Recipe Text: ${text}
            The output should be properly formatted as a list only without any new lines or anything.
            `,
            max_tokens: 500,
            temperature: 0.7,
        });
        console.log(response);
        return response.generations[0].text.trim();
    } catch (error) {
        console.error("Error using Cohere:", error);
        throw error;
    }
};
// Add a new recipe with audio file
app.post("/recipes", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
        // Step 1: Upload the audio file to AssemblyAI
        const audioFilePath = `./uploads/${req.file.filename}`;
        const audioData = fs.readFileSync(audioFilePath);

        const uploadResponse = await axios.post(
            "https://api.assemblyai.com/v2/upload",
            audioData,
            {
                headers: {
                    "authorization": process.env.ASSEMBLY_AI_API_KEY,
                    "content-type": "application/octet-stream",
                },
            }
        );

        const audioUrl = uploadResponse.data.upload_url;

        // Step 2: Request transcription

        // const transcriptResponse = await axios.post(
        //     "https://api.assemblyai.com/v2/transcript",
        //     {
        //         audio_url: audioUrl,
        //     },
        //     {
        //         headers: {
        //             authorization: process.env.ASSEMBLY_AI_API_KEY,
        //         },
        //     }
        // );

        // const transcriptId = transcriptResponse.data.id;

        // // Step 3: Poll for transcription results
        // let transcriptionResult;
        // while (true) {
        //     const pollingResponse = await axios.get(
        //         `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        //         {
        //             headers: {
        //                 authorization: process.env.ASSEMBLY_AI_API_KEY,
        //             },
        //         }
        //     );

        //     if (pollingResponse.data.status === "completed") {
        //         transcriptionResult = pollingResponse.data.text;
        //         break;
        //     } else if (pollingResponse.data.status === "failed") {
        //         throw new Error("Transcription failed");
        //     }

        //     // Wait for a few seconds before polling again
        //     await new Promise((resolve) => setTimeout(resolve, 5000));
        // }

        const transcriptionResult = `This is a recipe for cauliflower. Remove all the petals and the leaves of cauliflower and keep a certain length of stem on the cauliflower. Cut it into even size piece or else they won't cook properly and thoroughly. Then wash them in a utensil, soak them in water and keep there for five minutes so that if any germs or bacteria are there they can be removed. Then take your utensil, add oil, hing and jeera. After the jeera starts popping you can add your flower. Add salt immediately so the salt penetrates through the flower. Cover the utensil with a lid and add water on top of the lid. Let it cook for two to three minutes and come on check on it and then just make sure that it does not burn and stick to the utensil. Cook. Let it cook for another 10 minutes. Once the flower is cooked thoroughly you can add your other masala which is turmeric, coriander, cumin powder, red chili powder and just wait for the powder masalas to be cooked and then you are done.`
        console.log(`Transcription Result: ${transcriptionResult}`);

        // // Step 4: Use OpenAI to extract structured data
        // const aiResponse = await openai.chat.completions.create({
        //     model: "gpt-3.5-turbo",
        //     messages: [
        //         {
        //             role: "system",
        //             content: `You are an assistant that extracts structured data from text.`,
        //         },
        //         {
        //             role: "user",
        //             content: `
        //           Extract the following details from the text:
        //           - Ingredients (Number - Name comma-separated)
        //           - Masalas (Spices and powders) (Count - Name comma-separated)
        //           - Steps as an array of instructions

        //           Text:
        //           "${transcriptionResult}"

        //           Output format:
        //           Ingredients: [Number - Name]
        //           Masalas: [Count - Name]
        //           Steps: ["This is step 1 based on the text", "Step 2", ...]
        //         `,
        //         },
        //     ],
        // });

        // const structuredData = aiResponse.choices[0].message.content.trim();
        // const structuredData = await processTextWithCohere(transcriptionResult);
        const masalas = [];
        const list_of_masalas = [
            "salt", "sugar", "dhana jeera", "red chilli powder", "tumeric",
            "hing", "rye", "jeera", "garam masala", "chole masala",
            "pav bhaji masala", "kitchen king masala", "biryani masala",
            "missal masala", "chaat masala"
        ];
        const ingredients = [];

        // Split the text into words and categorize
        list_of_masalas.forEach(masal => {
            if (transcriptionResult.toLowerCase().includes(masal.toLowerCase())) {
                masalas.push({ count: null, name: masal });
            }
        });

        // List of common ingredients (can be extended based on more needs)
        const common_ingredients = [
            // Vegetables
            "Cauliflower", "Gobi",
            "Cabbage", "Patta Gobi",
            "Moong Dal", "Sabut Moong",
            "Toor Dal", "Arhar Dal",
            "Chana Dal", "Bengal Gram",
            "Masoor Dal", "Red Lentils",
            "Lentils", "Dal",
            "Spinach", "Palak",
            "Tomato", "Tamatar",
            "Onion", "Pyaz",
            "Garlic", "Lehsun",
            "Ginger", "Adrak",
            "Carrot", "Gajar",
            "Peas", "Matar",
            "Potato", "Aloo",
            "Bell Pepper", "Shimla Mirch",
            "Zucchini", "Turai",
            "Broccoli", "Broccoli",
            "Eggplant", "Baingan",
            "Pumpkin", "Kaddu",
            "Cucumber", "Kheera",
            "Beans", "Phali",
            "Green Beans", "Hari Phali",
            "Sweet Potato", "Shakarkandi",
            "Beetroot", "Chukandar",
            "Okra", "Bhindi",
            "Leeks", "Cheera",
            "Mushrooms", "Khumb",
            "Asparagus", "Shatavari",
            "Avocado", "Butter Fruit",
            "Kale", "Kale",
            "Lettuce", "Salad Patta",
            "Chard", "Chard",

            // Fruits
            "Lemon", "Nimbu",
            "Lime", "Nimbu",
            "Chili", "Lal Mirch",
            "Green Chili", "Hari Mirch",
            "Dates", "Khajoor",
            "Raisins", "Kishmish",
            "Saffron", "Kesar",
            "Chocolate", "Chocolate",
            "Honey", "Shahad",
            "Maple Syrup", "Maple Syrup",
            "Vanilla", "Vanilla",

            // Dairy
            "Cheese", "Paneer",
            "Yogurt", "Dahi",
            "Milk", "Doodh",
            "Cream", "Malai",
            "Butter", "Makhan",
            "Ghee", "Ghee",
            "Cottage Cheese", "Chhena",

            // Grains & Legumes
            "Rice", "Chawal",
            "Basmati Rice", "Basmati Chawal",
            "Quinoa", "Quinoa",
            "Chickpeas", "Chole",
            "Kidney Beans", "Rajma",
            "Black Beans", "Kala Rajma",
            "Green Beans", "Hari Phali",
            "Corn", "Makka",
            "Coconut", "Nariyal",
            "Soy Sauce", "Soy Sauce",
            "Cornstarch", "Cornflour",
            "Flour", "Atta",
            "Wheat", "Gehun",
            "Barley", "Jau",

            // Seeds & Nuts
            "Sesame Seeds", "Til",
            "Sunflower Seeds", "Surajmukhi Ke Beej",
            "Pumpkin Seeds", "Kaddu Ke Beej",
            "Almonds", "Badam",
            "Cashews", "Kaju",
            "Peanuts", "Moongfali",
            "Walnuts", "Akhrot",
            "Pistachios", "Pista",
            "Chia Seeds", "Chia Beej",
            "Flax Seeds", "Alsi Beej",

            // Sweeteners
            "Sugar", "Cheeni",
            "Honey", "Shahad",
            "Maple Syrup", "Maple Syrup",
            "Jaggery", "Gur",
            "Stevia", "Stevia",

            // Oils & Fats
            "Olive Oil", "Olive Tel",
            "Sunflower Oil", "Surajmukhi Tel",
            "Mustard Oil", "Sarson Tel",
            "Coconut Oil", "Nariyal Tel",
            "Vegetable Oil", "Sabzi Tel",
            "Ghee", "Ghee",
            "Butter", "Makhan",

            // Other Staples
            "Vinegar", "Sirka",
            "Soy Sauce", "Soy Sauce",
            "Tomato Paste", "Tamatar Ka Paste",
            "Cornstarch", "Cornflour",
            "Baking Powder", "Baking Powder",
            "Baking Soda", "Baking Soda",
            "Coconut Milk", "Nariyal Ka Doodh",
            "Tapioca", "Sabudana"
        ];


        // Check for ingredients
        common_ingredients.forEach(ingredient => {
            if (transcriptionResult.toLowerCase().includes(ingredient.toLowerCase())) {
                ingredients.push({ count: null, name: ingredient });
            }
        });
        const ai_response = await processTextWithCohere(transcriptionResult);
        const steps = JSON.parse(ai_response)
        // console.log(`AI Response:\n${structuredData}`);

        // Save recipe to database
        const recipe = new Recipe({
            title: req.body.title,
            audioUrl: `http://localhost:3001/uploads/${req.file.filename}`,
            ingredients,
            masalas,
            steps,
        });

        await recipe.save();
        res.status(201).json(recipe);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to transcribe and save recipe" });
    }
});

// Delete a recipe by ID with password protection
app.delete("/recipes/:id", validatePassword, async (req, res) => {
    try {
        await Recipe.findByIdAndDelete(req.params.id);
        res.json({ message: "Recipe deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete recipe" });
    }
});

// Add or update an ingredient in a recipe with password protection
app.put("/recipes/:id/ingredients", validatePassword, async (req, res) => {
    const { oldName, newIngredient } = req.body;

    try {
        const recipe = await Recipe.findById(req.params.id);

        if (!oldName) {
            // Add new ingredient
            recipe.ingredients.push(newIngredient);
        } else {
            // Update existing ingredient
            const ingredientIndex = recipe.ingredients.findIndex(
                (ing) => ing.name === oldName
            );
            if (ingredientIndex !== -1) {
                recipe.ingredients[ingredientIndex] = newIngredient;
            }
        }

        await recipe.save();
        res.json(recipe);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update ingredients" });
    }
});

// Delete an ingredient from a recipe with password protection
app.delete("/recipes/:id/ingredients", validatePassword, async (req, res) => {
    const { name } = req.body;

    try {
        const recipe = await Recipe.findById(req.params.id);

        // Filter out the ingredient to delete it
        recipe.ingredients = recipe.ingredients.filter(
            (ingredient) => ingredient.name !== name
        );

        await recipe.save();
        res.json(recipe);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete ingredient" });
    }
});

// Add or update a masala in a recipe with password protection
app.put("/recipes/:id/masalas", validatePassword, async (req, res) => {
    const { oldName, newMasala } = req.body;

    try {
        const recipe = await Recipe.findById(req.params.id);

        if (!oldName) {
            recipe.masalas.push(newMasala);
        } else {
            const masalaIndex = recipe.masalas.findIndex((m) => m.name === oldName);
            if (masalaIndex !== -1) {
                recipe.masalas[masalaIndex] = newMasala;
            }
        }

        await recipe.save();
        res.json(recipe);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update masalas" });
    }
});

// Delete a masala from a recipe with password protection
app.delete("/recipes/:id/masalas", validatePassword, async (req, res) => {
    const { name } = req.body;

    try {
        const recipe = await Recipe.findById(req.params.id);

        recipe.masalas = recipe.masalas.filter((m) => m.name !== name);

        await recipe.save();
        res.json(recipe);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete masala" });
    }
});

// Add or edit a step in a recipe with password protection
app.put("/recipes/:id/steps", validatePassword, async (req, res) => {
    const { stepIndex, newStep } = req.body;

    try {
        const recipe = await Recipe.findById(req.params.id);

        if (!recipe.steps[stepIndex]) return res.status(404).json({ error: "Step not found" });

        recipe.steps[stepIndex] = newStep;

        await recipe.save();
        res.json(recipe);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update step" });
    }
});

// Delete a step from a recipe with password protection
app.delete("/recipes/:id/steps", validatePassword, async (req, res) => {
    const { stepIndex } = req.body;

    try {
        const recipe = await Recipe.findById(req.params.id);

        if (!recipe.steps[stepIndex]) return res.status(404).json({ error: "Step not found" });

        recipe.steps.splice(stepIndex, 1);

        await recipe.save();
        res.json(recipe);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete step" });
    }
});

// Update the voice recording for a recipe with password protection
app.put("/recipes/:id/recording", upload.single("file"), validatePassword, async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) return res.status(404).json({ error: "Recipe not found" });

        // Step 1: Upload the new audio file to AssemblyAI
        const audioFilePath = `./uploads/${req.file.filename}`;
        const audioData = fs.readFileSync(audioFilePath);

        const uploadResponse = await axios.post(
            "https://api.assemblyai.com/v2/upload",
            audioData,
            {
                headers: {
                    "authorization": process.env.ASSEMBLY_AI_API_KEY,
                    "content-type": "application/octet-stream",
                },
            }
        );

        const audioUrl = uploadResponse.data.upload_url;

        // Step 2: Request transcription
        const transcriptResponse = await axios.post(
            "https://api.assemblyai.com/v2/transcript",
            {
                audio_url: audioUrl,
            },
            {
                headers: {
                    authorization: process.env.ASSEMBLY_AI_API_KEY,
                },
            }
        );

        const transcriptId = transcriptResponse.data.id;

        // Step 3: Poll for transcription results
        let transcriptionResult;
        while (true) {
            const pollingResponse = await axios.get(
                `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
                {
                    headers: {
                        authorization: process.env.ASSEMBLY_AI_API_KEY,
                    },
                }
            );

            if (pollingResponse.data.status === "completed") {
                transcriptionResult = pollingResponse.data.text;
                break;
            } else if (pollingResponse.data.status === "failed") {
                throw new Error("Transcription failed");
            }

            // Wait for a few seconds before polling again
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        console.log(`Transcription Result: ${transcriptionResult}`);

        // Step 4: Extract ingredients from transcription
        const ingredientsMock = transcriptionResult.split(",").map((item) => ({
            name: item.trim(),
            count: null,
        }));

        // Step 5: Update recipe in database
        recipe.audioUrl = `http://localhost:3001/uploads/${req.file.filename}`;
        recipe.ingredients = ingredientsMock; // Replace old ingredients with new ones

        await recipe.save();
        res.json(recipe);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update recording and ingredients" });
    }
});

// Start Server
app.listen(3001, () => console.log("Server running on http://localhost:3001"));