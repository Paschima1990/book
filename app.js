import { db } from './firebase.js';
import { collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Elements from HTML
const form = document.getElementById('book-form');
const list = document.getElementById('book-list');
const fileInput = document.getElementById('file-input');
const exportBtn = document.getElementById('export-btn');

// Add a book
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Collect form data
  const book = {
    name: form.name.value,
    author: form.author.value,
    quantity: parseInt(form.quantity.value),
    isbn: form.isbn.value,
    rack: form.rack.value,
    shelf: form.shelf.value
  };

  // Add book to Firestore
  await addDoc(collection(db, 'books'), book);
  form.reset();

  // Fetch the updated list of books
  fetchBooks();
});

// Render a single book
function renderBook(docSnapshot) {
  const data = docSnapshot.data();
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${data.name}</td>
    <td>${data.author}</td>
    <td>${data.quantity}</td>
    <td>${data.isbn}</td>
    <td>${data.rack}</td>
    <td>${data.shelf}</td>
    <td><button onclick="deleteBook('${docSnapshot.id}')">Delete</button></td>
  `;
  list.appendChild(tr);
}

// Fetch all books from Firestore and display them
async function fetchBooks() {
  list.innerHTML = ''; // Clear the existing list
  const snapshot = await getDocs(collection(db, 'books'));
  snapshot.forEach(doc => renderBook(doc)); // Render each book
}

// Delete a book
window.deleteBook = async function(id) {
  await deleteDoc(doc(db, 'books', id)); // Delete book by ID
  fetchBooks(); // Re-fetch books to update the list
};

// Excel Upload
fileInput.addEventListener('change', (e) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    for (const row of sheet) {
      await addDoc(collection(db, 'books'), row); // Add each row to Firestore
    }
    fetchBooks(); // Re-fetch the list after upload
  };
  reader.readAsArrayBuffer(e.target.files[0]);
});

// Export to Excel
exportBtn.addEventListener('click', async () => {
  const snapshot = await getDocs(collection(db, 'books'));
  const books = snapshot.docs.map(doc => doc.data());
  const ws = XLSX.utils.json_to_sheet(books);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Books');
  XLSX.writeFile(wb, 'books.xlsx');
});

// Initial fetch when the page loads
fetchBooks();
