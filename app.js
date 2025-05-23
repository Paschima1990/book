import { db } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// document.addEventListener('DOMContentLoaded', () => {
//   fetchBooks();
// });

document.addEventListener('DOMContentLoaded', () => {
  fetchBooks();

  document.getElementById('confirm-add').addEventListener('click', async () => {
    if (pendingBookData) {
      await addDoc(collection(db, 'books'), pendingBookData);
      form.reset();
      fetchBooks();
    }

    pendingBookData = null;
    document.getElementById('confirm-modal').classList.add('hidden');
  });

  document.getElementById('cancel-add').addEventListener('click', () => {
    pendingBookData = null;
    document.getElementById('confirm-modal').classList.add('hidden');
  });
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
let pendingBookData = null;

form.addEventListener('submit', (e) => {
  e.preventDefault();

  pendingBookData = {
    type: bookTypeSelect.options[bookTypeSelect.selectedIndex].text,
    name: form.name.value.trim(),
    author: form.author.value.trim(),
    quantity: parseInt(form.quantity.value),
    isbn: form.isbn.value.trim(),
    rack: form.rack.value.trim(),
    shelf: form.shelf.value.trim()
  };

  const detailsList = document.getElementById('confirm-details');
  detailsList.innerHTML = `
    <li><strong>Type:</strong> ${pendingBookData.type}</li>
    <li><strong>Name:</strong> ${pendingBookData.name}</li>
    <li><strong>Author:</strong> ${pendingBookData.author}</li>
    <li><strong>ISBN:</strong> ${pendingBookData.isbn}</li>
     <li><strong>Quantity:</strong> ${pendingBookData.quantity}</li>
    <li><strong>Rack:</strong> ${pendingBookData.rack}</li>
    <li><strong>Shelf:</strong> ${pendingBookData.shelf}</li>
  `;

  document.getElementById('confirm-modal').classList.remove('hidden');
});



// Render Book
function renderBook(docSnapshot) {
  const data = docSnapshot.data();
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td data-label="Type">${data.type || ''}</td>
    <td data-label="Book">${data.name}</td>
    <td data-label="Author">${data.author}</td>
    <td data-label="ISBN">${data.isbn}</td>
    <td data-label="Qty">${data.quantity}</td>
    
    <td data-label="Rack">${data.rack}</td>
    <td data-label="Shelf">${data.shelf}</td>
    <td data-label="Actions">
    
      <button onclick="deleteBook('${docSnapshot.id}', '${data.name.replace(/'/g, "\\'")}')">Delete</button>

    </td>
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

// Delete Book
window.deleteBook = async function(id) {
  await deleteDoc(doc(db, 'books', id));
  fetchBooks();
};

window.deleteBook = async function(id, name) {
  const shouldDelete = window.confirm(`Are you sure you want to delete the book "${name}"?`);
  if (!shouldDelete) return;

  try {
    await deleteDoc(doc(db, 'books', id));
    fetchBooks(); // Refresh book list
  } catch (error) {
    console.error("Error deleting book:", error);
    alert("Failed to delete the book.");
  }
};


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
