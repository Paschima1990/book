const form = document.getElementById('book-form');
const list = document.getElementById('book-list');
const fileInput = document.getElementById('file-input');
const exportBtn = document.getElementById('export-btn');

function renderBook(doc) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${doc.data().name}</td>
    <td>${doc.data().author}</td>
    <td>${doc.data().quantity}</td>
    <td>${doc.data().isbn}</td>
    <td>${doc.data().rack}</td>
    <td>${doc.data().shelf}</td>
    <td>
      <button onclick="deleteBook('${doc.id}')">Delete</button>
    </td>
  `;
  list.appendChild(tr);
}

function fetchBooks() {
  list.innerHTML = '';
  db.collection('books').get().then(snapshot => {
    snapshot.docs.forEach(doc => renderBook(doc));
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const book = {
    name: form.name.value,
    author: form.author.value,
    quantity: parseInt(form.quantity.value),
    isbn: form.isbn.value,
    rack: form.rack.value,
    shelf: form.shelf.value
  };
  db.collection('books').add(book).then(fetchBooks);
  form.reset();
});

function deleteBook(id) {
  db.collection('books').doc(id).delete().then(fetchBooks);
}

// Excel Upload
fileInput.addEventListener('change', (e) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    sheet.forEach(book => {
      db.collection('books').add(book);
    });
    setTimeout(fetchBooks, 1000);
  };
  reader.readAsArrayBuffer(e.target.files[0]);
});

// Export Excel
exportBtn.addEventListener('click', async () => {
  const snapshot = await db.collection('books').get();
  const books = snapshot.docs.map(doc => doc.data());
  const ws = XLSX.utils.json_to_sheet(books);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Books');
  XLSX.writeFile(wb, 'books.xlsx');
});

fetchBooks();
