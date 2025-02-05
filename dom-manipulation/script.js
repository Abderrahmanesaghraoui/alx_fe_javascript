// Load quotes from local storage or initialize with default quotes
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Inspiration" },
  { text: "Do what you can, with what you have, where you are.", category: "Motivation" },
  { text: "The best way to predict the future is to invent it.", category: "Innovation" }
];

// Save quotes to local storage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Function to populate categories in the dropdown
function populateCategories() {
  const categoryFilter = document.getElementById('categoryFilter');
  const categories = [...new Set(quotes.map(quote => quote.category))]; // Extract unique categories
  categoryFilter.innerHTML = '<option value="all">All Categories</option>'; // Reset dropdown
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  // Restore the last selected filter from local storage
  const lastFilter = localStorage.getItem('lastFilter');
  if (lastFilter) {
    categoryFilter.value = lastFilter;
  }
}

// Function to filter quotes based on the selected category
function filterQuotes() {
  const selectedCategory = document.getElementById('categoryFilter').value;
  localStorage.setItem('lastFilter', selectedCategory); // Save the selected filter

  const filteredQuotes = selectedCategory === 'all'
    ? quotes
    : quotes.filter(quote => quote.category === selectedCategory);

  displayQuotes(filteredQuotes);
}

// Function to display quotes
function displayQuotes(quotesToDisplay) {
  const quoteDisplay = document.getElementById('quoteDisplay');
  quoteDisplay.innerHTML = quotesToDisplay.length > 0
    ? quotesToDisplay.map(quote => `<p><strong>${quote.text}</strong> <em>(${quote.category})</em></p>`).join('')
    : 'No quotes found for this category.';
}

// Function to display a random quote
function showRandomQuote() {
  const selectedCategory = document.getElementById('categoryFilter').value;
  const filteredQuotes = selectedCategory === 'all'
    ? quotes
    : quotes.filter(quote => quote.category === selectedCategory);

  if (filteredQuotes.length > 0) {
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const randomQuote = filteredQuotes[randomIndex];
    displayQuotes([randomQuote]);
  } else {
    displayQuotes([]);
  }
}

// Function to add a new quote
function addQuote() {
  const newQuoteText = document.getElementById('newQuoteText').value;
  const newQuoteCategory = document.getElementById('newQuoteCategory').value;

  if (newQuoteText && newQuoteCategory) {
    quotes.push({ text: newQuoteText, category: newQuoteCategory });
    saveQuotes(); // Save updated quotes to local storage
    populateCategories(); // Update the category dropdown
    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
    filterQuotes(); // Refresh the displayed quotes
    syncWithServer(); // Sync with the server after adding a new quote
  } else {
    alert('Please fill in both the quote and category fields.');
  }
}

// Function to export quotes to a JSON file
function exportToJson() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Function to import quotes from a JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      quotes.push(...importedQuotes);
      saveQuotes(); // Save updated quotes to local storage
      populateCategories(); // Update the category dropdown
      alert('Quotes imported successfully!');
      filterQuotes(); // Refresh the displayed quotes
      syncWithServer(); // Sync with the server after importing quotes
    } catch (error) {
      alert('Invalid JSON file. Please upload a valid JSON file.');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Function to simulate fetching quotes from the server
async function fetchQuotesFromServer() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    const serverQuotes = await response.json();
    return serverQuotes.map(post => ({ text: post.title, category: 'Server' })); // Map server data to quote format
  } catch (error) {
    console.error('Error fetching quotes from server:', error);
    return [];
  }
}

// Function to simulate posting quotes to the server
async function postQuotesToServer() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: JSON.stringify(quotes),
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    console.error('Error posting quotes to server:', error);
    return false;
  }
}

// Function to sync quotes with the server
async function syncWithServer() {
  const serverQuotes = await fetchQuotesFromServer();
  const localQuotes = quotes;

  // Merge server and local quotes (server data takes precedence)
  const mergedQuotes = [...localQuotes, ...serverQuotes].reduce((acc, quote) => {
    const existingQuote = acc.find(q => q.text === quote.text);
    if (!existingQuote) {
      acc.push(quote);
    }
    return acc;
  }, []);

  // Update local quotes and save to local storage
  quotes = mergedQuotes;
  saveQuotes();
  populateCategories();
  filterQuotes();

  // Notify the user
  showNotification('Quotes synced with the server.');
}

// Function to show a notification
function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

// Event listener for the "Show New Quote" button
document.getElementById('newQuote').addEventListener('click', showRandomQuote);

// Initial setup
populateCategories(); // Populate categories in the dropdown
filterQuotes(); // Display quotes based on the last selected filter

// Periodically sync with the server (e.g., every 30 seconds)
setInterval(syncWithServer, 30000);