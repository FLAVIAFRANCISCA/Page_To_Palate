document.addEventListener('DOMContentLoaded', () => {
    const addRecipeForm = document.getElementById('addRecipeForm');
    const imageInput = document.getElementById('recipeImageFile');
    const placeholderImage = 'https://via.placeholder.com/300x200';

    if (addRecipeForm) {
        addRecipeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const loggedInUser = localStorage.getItem('loggedInUser');
            if (!loggedInUser) {
                window.showNotification('You must be logged in to add a recipe.', 'error');
                return;
            }
            handleNewRecipeSubmission(loggedInUser);
        });
    }

    // Function to handle the form submission
    function handleNewRecipeSubmission(loggedInUser) {
        const title = document.getElementById('recipeTitle').value;
        const category = document.getElementById('recipeCategory').value;
        const instructions = document.getElementById('instructions').value;
        const ingredients = document.getElementById('ingredients').value.split('\n').filter(ingredient => ingredient.trim() !== '');
        const imageFile = imageInput.files[0];
        const isPrivate = document.getElementById('isPrivate').checked;

        // Check for duplicates in both private and public collections
        const privateCollection = JSON.parse(localStorage.getItem(`privateCollection-${loggedInUser}`)) || [];
        const publicRecipes = JSON.parse(localStorage.getItem('publicUserRecipes')) || [];

        const isDuplicateInPrivate = privateCollection.some(recipe => recipe.title.toLowerCase() === title.toLowerCase() && recipe.addedBy === loggedInUser);
        const isDuplicateInPublic = publicRecipes.some(recipe => recipe.title.toLowerCase() === title.toLowerCase() && recipe.addedBy === loggedInUser);

        if (isDuplicateInPrivate || isDuplicateInPublic) {
            window.showNotification('You have already added a recipe with this title.', 'error');
            return;
        }


        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageUrl = e.target.result;
                const newRecipe = createNewRecipeObject(title, category, imageUrl, ingredients, instructions, loggedInUser, isPrivate);
                addRecipe(newRecipe, isPrivate, loggedInUser);
            };
            reader.readAsDataURL(imageFile);
        } else {
            const newRecipe = createNewRecipeObject(title, category, placeholderImage, ingredients, instructions, loggedInUser, isPrivate);
            addRecipe(newRecipe, isPrivate, loggedInUser);
        }
    }

    function createNewRecipeObject(title, category, image, ingredients, instructions, user, isPrivate) {
        return {
            id: `user-${Date.now()}`,
            title: title,
            category: category,
            image: image,
            ingredients: ingredients,
            instructions: instructions,
            addedBy: user,
            isPrivate: isPrivate
        };
    }

    // Function to add a recipe to local storage
    function addRecipe(recipe, isPrivate, loggedInUser) {
        // Always add to the user's private collection
        const privateCollection = JSON.parse(localStorage.getItem(`privateCollection-${loggedInUser}`)) || [];
        privateCollection.push(recipe);
        localStorage.setItem(`privateCollection-${loggedInUser}`, JSON.stringify(privateCollection));

        // Only add to public recipes if it's not marked as private
        if (!isPrivate) {
            const publicRecipes = JSON.parse(localStorage.getItem('publicUserRecipes')) || [];
            publicRecipes.push(recipe);
            localStorage.setItem('publicUserRecipes', JSON.stringify(publicRecipes));
        }

        const message = isPrivate ? "You've successfully added a recipe to your private collection" : "You've successfully added a recipe";
        window.showNotification(message, 'success');
        document.getElementById('addRecipeForm').reset();
        window.location.href = 'recipes.html';
    }
});
