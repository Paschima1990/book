import { db, auth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "./firebase.js";
import { collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const form = document.getElementById('book-form');
const list = document.getElementById('book-list');
const fileInput = document.getElementById('file-input');
const exportBtn = document.getElementById('export-btn');

const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const userInfo = document.getElementById('user-info');

function toggleAuthUI(user) {
  const isLoggedIn = !!user;
  form.style.display = isLoggedIn ? 'block' : 'none';
  exportBtn.style.display = isLoggedIn ? 'inline-block' : 'none';
  fileInput.style.display = isLoggedIn ? 'inline-block' : 'none';
  logoutBtn.style.display = isLoggedIn ? 'inline-block' : 'none';
  loginBtn.style.display = isLoggedIn ? 'none' : 'inline-block';
  emailInput.style.display = isLoggedIn ? 'none' : 'inline-block';
  passInput.style.display = isLoggedIn ? 'none' : 'inline-block';
  userInfo.innerText = isLoggedIn ? `Logged in as ${user.email}` : '';
}

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

async function fetchBooks() {
  list.innerHTML = '';
  const snapshot = await getDocs(collection(db, 'books'));
  snapshot.forEach(doc => renderBook(doc));
}

window.deleteBook = async function(id) {
  await deleteDoc(doc(db, 'books', id));
  fetchBooks();
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const book = {
    name: form.name.value,
    author: form.author.value,
    quantity: parseInt(form.quantity.value),
    isbn: form.isbn.value,
    rack: form.rack.value,
    shelf: form.shelf.value
  };
  await addDoc(collection(db, 'books'), book);
  form.reset();
  fetchBooks();
});

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

// Export Excel
exportBtn.addEventListener('click', async () => {
  const snapshot = await getDocs(collection(db, 'books'));
  const books = snapshot.docs.map(doc => doc.data());
  const ws = XLSX.utils.json_to_sheet(books);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Books');
  XLSX.writeFile(wb, 'books.xlsx');
});

// Auth
loginBtn.addEventListener('click', () => {
  signInWithEmailAndPassword(auth, emailInput.value, passInput.value)
    .catch(err => alert('Login Failed: ' + err.message));
});

logoutBtn.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  toggleAuthUI(user);
  if (user) fetchBooks();
});
