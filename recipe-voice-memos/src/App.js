import React, { useState } from "react";
import AudioRecorder from "./components/AudioRecorder";
import axios from "axios";

const App = () => {
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentRecipeId, setCurrentRecipeId] = useState(null); // For update recording modal
  const [loading, setLoading] = useState(false); // Loading state

  // Fetch recipes on load
  React.useEffect(() => {
    axios.get("http://localhost:3001/recipes").then((response) => {
      setRecipes(response.data);
    });
  }, []);

  const handleAddRecipe = async (audioBlob, title) => {
    const formData = new FormData();
    formData.append("file", audioBlob);
    formData.append("title", title);

    try {
      setLoading(true);
      const response = await axios.post("http://localhost:3001/recipes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setRecipes([...recipes, response.data]);
      setShowModal(false);
    } catch (error) {
      console.error("Error uploading recipe:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = async (recipeId) => {
    const name = prompt("Enter ingredient name:");
    if (!name) return alert("Ingredient name is required.");

    const count = prompt("Enter count (leave blank for 'No Count'):");

    const password = prompt("Enter password:");

    try {
      const response = await axios.put(
        `http://localhost:3001/recipes/${recipeId}/ingredients`,
        {
          oldName: null,
          newIngredient: { name, count: count || null },
          password,
        }
      );

      setRecipes((prevRecipes) =>
        prevRecipes.map((recipe) =>
          recipe._id === recipeId ? response.data : recipe
        )
      );

    } catch (error) {
      console.error("Error adding ingredient:", error);
      alert("Failed to add ingredient. Incorrect password or server error.");
    }
  };

  const handleEditIngredient = async (recipeId, ingredientName, currentCount) => {
    const newName = prompt("Enter new ingredient name:", ingredientName);
    if (!newName) return alert("Ingredient name is required.");

    const newCount = prompt(
      "Enter new count (leave blank for 'No Count'):",
      currentCount || ""
    );
    const password = prompt("Enter password:");
    try {
      const response = await axios.put(
        `http://localhost:3001/recipes/${recipeId}/ingredients`,
        {
          oldName: ingredientName,
          newIngredient: { name: newName, count: newCount || null },
          password
        }
      );
      setRecipes((prevRecipes) =>
        prevRecipes.map((recipe) =>
          recipe._id === recipeId ? response.data : recipe
        )
      );
    } catch (error) {
      console.error("Error editing ingredient:", error);
      alert("Failed to edit ingredient.");
    }
  };

  const handleDeleteIngredient = async (recipeId, ingredientName) => {
    const password = prompt("Enter password:");

    try {
      const response = await axios.delete(
        `http://localhost:3001/recipes/${recipeId}/ingredients`,
        {
          data: { name: ingredientName, password },
        }
      );

      setRecipes((prevRecipes) =>
        prevRecipes.map((recipe) =>
          recipe._id === recipeId ? response.data : recipe
        )
      );

    } catch (error) {
      console.error("Error deleting ingredient:", error);
      alert("Failed to delete ingredient. Incorrect password or server error.");
    }
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.ingredients.some((ingredient) =>
      ingredient.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleDeleteRecipe = async (id) => {
    const password = prompt("Enter password to delete this recipe:");
    if (!password) return alert("Password is required to delete.");

    try {
      await axios.delete(`http://localhost:3001/recipes/${id}`, {
        data: { password },
      });
      setRecipes(recipes.filter((recipe) => recipe._id !== id));
    } catch (error) {
      console.error("Error deleting recipe:", error);
      alert("Failed to delete recipe. Incorrect password or server error.");
    }
  };

  // CRUD for Masalas
  const handleAddMasala = async (recipeId) => {
    const name = prompt("Enter masala name:");
    if (!name) return alert("Masala name is required.");

    const count = prompt("Enter count (leave blank for 'No Count'):");

    try {
      const response = await axios.put(
        `http://localhost:3001/recipes/${recipeId}/masalas`,
        { oldName: null, newMasala: { name, count: count || null } }
      );
      setRecipes((prevRecipes) =>
        prevRecipes.map((recipe) =>
          recipe._id === recipeId ? response.data : recipe
        )
      );
    } catch (error) {
      console.error("Error adding masala:", error);
      alert("Failed to add masala.");
    }
  };

  const handleEditMasala = async (recipeId, masalaName, currentCount) => {
    const newName = prompt("Enter new masala name:", masalaName);
    if (!newName) return alert("Masala name is required.");

    const newCount = prompt(
      "Enter new count (leave blank for 'No Count'):",
      currentCount || ""
    );

    try {
      const response = await axios.put(
        `http://localhost:3001/recipes/${recipeId}/masalas`,
        { oldName: masalaName, newMasala: { name: newName, count: newCount || null } }
      );
      setRecipes((prevRecipes) =>
        prevRecipes.map((recipe) =>
          recipe._id === recipeId ? response.data : recipe
        )
      );
    } catch (error) {
      console.error("Error editing masala:", error);
      alert("Failed to edit masala.");
    }
  };

  const handleDeleteMasala = async (recipeId, masalaName) => {
    try {
      const response = await axios.delete(
        `http://localhost:3001/recipes/${recipeId}/masalas`,
        { data: { name: masalaName } }
      );
      setRecipes((prevRecipes) =>
        prevRecipes.map((recipe) =>
          recipe._id === recipeId ? response.data : recipe
        )
      );
    } catch (error) {
      console.error("Error deleting masala:", error);
      alert("Failed to delete masala.");
    }
  };

  // CRUD for Steps
  const handleAddStep = async (recipeId) => {
    const stepText = prompt("Enter step:");
    if (!stepText) return alert("Step cannot be empty.");

    try {
      const response = await axios.put(
        `http://localhost:3001/recipes/${recipeId}/steps`,
        { stepIndex: null, newStep: stepText }
      );
      setRecipes((prevRecipes) =>
        prevRecipes.map((recipe) =>
          recipe._id === recipeId ? response.data : recipe
        )
      );
    } catch (error) {
      console.error("Error adding step:", error);
      alert("Failed to add step.");
    }
  };

  const handleEditStep = async (recipeId, stepIndex, currentStepText) => {
    const newStepText = prompt("Enter updated step:", currentStepText);
    if (!newStepText) return alert("Step cannot be empty.");

    try {
      const response = await axios.put(
        `http://localhost:3001/recipes/${recipeId}/steps`,
        { stepIndex, newStep: newStepText }
      );
      setRecipes((prevRecipes) =>
        prevRecipes.map((recipe) =>
          recipe._id === recipeId ? response.data : recipe
        )
      );
    } catch (error) {
      console.error("Error editing step:", error);
      alert("Failed to edit step.");
    }
  };

  const handleDeleteStep = async (recipeId, stepIndex) => {
    try {
      const response = await axios.delete(
        `http://localhost:3001/recipes/${recipeId}/steps`,
        { data: { stepIndex } }
      );
      setRecipes((prevRecipes) =>
        prevRecipes.map((recipe) =>
          recipe._id === recipeId ? response.data : recipe
        )
      );
    } catch (error) {
      console.error("Error deleting step:", error);
      alert("Failed to delete step.");
    }
  };

  const handleUpdateRecording = async (recipeId, audioBlob) => {
    const formData = new FormData();
    formData.append("file", audioBlob);

    const password = prompt("Enter password:");

    try {
      setLoading(true);
      formData.append("password", password); // Add password to FormData

      const response = await axios.put(
        `http://localhost:3001/recipes/${recipeId}/recording`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setRecipes((prevRecipes) =>
        prevRecipes.map((recipe) =>
          recipe._id === recipeId ? response.data : recipe
        )
      );

      setCurrentRecipeId(null); // Close modal

    } catch (error) {
      console.error("Error updating recording:", error);
      alert("Failed to update recording. Incorrect password or server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event, recipeId) => {
    const file = event.target.files[0];
    if (!file) return;

    if (recipeId) {
      // Update recording
      handleUpdateRecording(recipeId, file);
    } else {
      // Add new recipe
      handleAddRecipe(file, prompt("Enter Recipe Title"));
    }
  };

  const colors = [
    { bg: "bg-blue-200", text: "text-blue-700" },
    { bg: "bg-orange-200", text: "text-orange-700" },
    { bg: "bg-green-200", text: "text-green-700" },
    { bg: "bg-purple-200", text: "text-purple-700" },
    { bg: "bg-pink-200", text: "text-pink-700" },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">PakaMat</h1>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="flex flex-col items-center">
            <div className="loader border-t-transparent border-blue-500 border-solid rounded-full w-16 h-16 animate-spin"></div>
            <p className="mt-4 text-white">Keep Calm and say Cheen Tapak Dam Dam</p>
          </div>
        </div>
      )}
      <input
        type="text"
        placeholder="Search by ingredient..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border border-gray-300">Recipe Name</th>
            <th className="p-2 border border-gray-300">Audio</th>
            <th className="p-2 border border-gray-300">Ingredients</th>
            <th className="p-2 border border-gray-300">Masalas</th>
            <th className="p-2 border border-gray-300">Steps</th>
            <th className="p-2 border border-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecipes.map(({ _id, title, audioUrl, ingredients, masalas, steps }) => (
            <tr key={_id} className="hover:bg-gray-50">
              <td className="p-2 border border-gray-300">{title}</td>
              <td className="p-2 border border-gray-300">
                <audio src={audioUrl} controls />
              </td>
              <td className="p-2 border border-gray-300">
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ingredient, index) => {
                    const color =
                      colors[Math.floor(Math.random() * colors.length)];
                    return (
                      <div
                        key={index}
                        className={`flex items-center px-3 py-1 rounded-full ${color.bg} ${color.text} bg-opacity-20`}
                      >
                        <span className="text-sm font-medium">
                          {ingredient.name}
                          {ingredient.count ? ` (${ingredient.count})` : ""}
                        </span>
                        <div className="flex items-center space-x-2 ml-3">
                          <button
                            onClick={() =>
                              handleEditIngredient(
                                _id,
                                ingredient.name,
                                ingredient.count
                              )
                            }
                            className="text-xs underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteIngredient(_id, ingredient.name)
                            }
                            className="text-xs underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Add Ingredient Button */}
                <button
                  onClick={() => handleAddIngredient(_id)}
                  className="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                >
                  Add Ingredient
                </button>
              </td>
              {/* Masalas */}
              <td className="p-2 border border-gray-300">
                <div className="flex flex-wrap gap-2">
                  {masalas.map((masala, index) => {
                    const color =
                      colors[Math.floor(Math.random() * colors.length)];
                    return (
                      <div
                        key={index}
                        className={`flex items-center px-3 py-1 rounded-full ${color.bg} ${color.text} bg-opacity-20`}
                      >
                        <span className="text-sm font-medium">
                          {masala.name}
                          {masala.count ? ` (${masala.count})` : ""}
                        </span>
                        <div className="flex items-center space-x-2 ml-3">
                          <button
                            onClick={() =>
                              handleEditMasala(
                                _id,
                                masala.name,
                                masala.count
                              )
                            }
                            className="text-xs underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteMasala(_id, masala.name)
                            }
                            className="text-xs underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Add masala Button */}
                <button
                  onClick={() => handleAddMasala(_id)}
                  className="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                >
                  Add Masala
                </button>
              </td>
              {/* Steps */}
              <td className="p-2 border border-gray-300">
                <ol>
                  {steps.map((step, index) => (
                    <li key={index} className="flex items-center justify-between">
                      <span>{step}</span>
                      <div className="flex items-center space-x-2 ml-3">
                        {/* Edit Step Button */}
                        <button
                          onClick={() => handleEditStep(_id, index, step)}
                          className="text-xs underline text-blue-500 hover:text-blue-600"
                        >
                          Edit
                        </button>
                        {/* Delete Step Button */}
                        <button
                          onClick={() => handleDeleteStep(_id, index)}
                          className="text-xs underline text-red-500 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
                {/* Add Step Button */}
                <button
                  onClick={() => handleAddStep(_id)}
                  className="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                >
                  Add Step
                </button>
              </td>
              <td className="p-2 border border-gray-300">
                {/* Update Recording Button */}
                <button
                  onClick={() => setCurrentRecipeId(_id)}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 mr-2"
                >
                  Update Recording
                </button>
                {/* Delete Recipe Button */}
                <button
                  onClick={() => handleDeleteRecipe(_id)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  Delete Recipe
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-5 right-5 w-12 h-12 text-white bg-blue-500 rounded-full shadow-lg hover:bg-blue-600"
      >
        +
      </button>

      {/* Add Recipe Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Recipe</h2>
            {/* Record Audio */}
            <AudioRecorder
              onSave={(blob) =>
                handleAddRecipe(blob, prompt("Enter Recipe Title"))
              }
            />
            {/* Upload Audio */}
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => handleFileUpload(e)}
              className="mt-4"
            />
            {/* Close Modal */}
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Update Recording Modal */}
      {currentRecipeId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Update Recording</h2>
            {/* Record Audio */}
            <AudioRecorder
              onSave={(blob) => handleUpdateRecording(currentRecipeId, blob)}
            />
            {/* Upload Audio */}
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => handleFileUpload(e, currentRecipeId)}
              className="mt-4"
            />
            {/* Close Modal */}
            <button
              onClick={() => setCurrentRecipeId(null)}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;