import { db } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  fetchBooks();
});
// DOM Elements
const form = document.getElementById('book-form');
const list = document.getElementById('book-list');
const searchInput = document.getElementById('search-input');
const fileInput = document.getElementById('file-input');
const exportBtn = document.getElementById('export-btn');
const alphabetFilter = document.getElementById('alphabet-filter');
const bookTypeSelect = document.getElementById('book-type');

// Add Book
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const book = {
    type: bookTypeSelect.options[bookTypeSelect.selectedIndex].text,
    name: form.name.value.trim(),
    author: form.author.value.trim(),
    quantity: parseInt(form.quantity.value),
    isbn: form.isbn.value.trim(),
    rack: form.rack.value.trim(),
    shelf: form.shelf.value.trim()
  };

  await addDoc(collection(db, 'books'), book);
  form.reset();
  fetchBooks();
});

// Render Book
function renderBook(docSnapshot) {
  const data = docSnapshot.data();
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${data.type || ''}</td>
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

// Fetch Books
async function fetchBooks() {
  list.innerHTML = '';
  const snapshot = await getDocs(collection(db, 'books'));
  snapshot.forEach(doc => renderBook(doc));
}

// Delete Book
window.deleteBook = async function(id) {
  await deleteDoc(doc(db, 'books', id));
  fetchBooks();
};

// Excel Upload
fileInput.addEventListener('change', (e) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    for (const row of sheet) {
      await addDoc(collection(db, 'books'), row);
    }
    fetchBooks();
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

// Search by name, author, or ISBN
searchInput.addEventListener('input', async () => {
  const searchTerm = searchInput.value.toLowerCase().trim();
  list.innerHTML = ''; // Clear list

  const snapshot = await getDocs(collection(db, 'books'));

  snapshot.forEach(doc => {
    const data = doc.data();
    const combinedText = `${data.name} ${data.author} ${data.isbn}`.toLowerCase();

    if (combinedText.includes(searchTerm)) {
      renderBook(doc);
    }
  });
});


// Alphabetical Filter
alphabetFilter.addEventListener('change', () => {
  applyFilters();
});

// Filter by search or alphabet
async function applyFilters() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedAlphabet = alphabetFilter.value;

  list.innerHTML = '';
  const snapshot = await getDocs(collection(db, 'books'));

  snapshot.forEach(doc => {
    const data = doc.data();
    const bookName = data.name || '';
    const author = data.author || '';

    const matchesSearch = bookName.toLowerCase().includes(searchTerm) || author.toLowerCase().includes(searchTerm);
    const matchesAlphabet = selectedAlphabet ? bookName.startsWith(selectedAlphabet) : true;

    if (matchesSearch && matchesAlphabet) {
      renderBook(doc);
    }
  });
}

// Initial Load
fetchBooks();
