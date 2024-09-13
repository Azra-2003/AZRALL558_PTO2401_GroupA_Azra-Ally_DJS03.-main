// Import data
import { books, authors, genres, BOOKS_PER_PAGE } from './data.js';

// Create a Web Component for displaying book previews
class BookPreview extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['data-id', 'data-image', 'data-title', 'data-author'];
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        switch (attrName) {
            case 'data-id':
                this.id = newVal;
                break;
            case 'data-image':
                this.image = newVal;
                break;
            case 'data-title':
                this.title = newVal;
                break;
            case 'data-author':
                this.author = newVal;
                break;
        }
        this.render();
    }

    connectedCallback() {
        this.render();
        this.shadowRoot.querySelector('button').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('preview-click', {
                detail: { id: this.id },
                bubbles: true,
                composed: true
            }));
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .preview {
                    display: flex;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .preview:hover {
                    transform: scale(1.05);
                }
                .preview__image {
                    width: 100px;
                    height: 150px;
                    object-fit: cover;
                }
                .preview__info {
                    padding: 10px;
                }
                .preview__title {
                    font-size: 16px;
                    font-weight: bold;
                }
                .preview__author {
                    font-size: 14px;
                    color: #666;
                }
            </style>
            <button class="preview">
                <img class="preview__image" src="${this.image}" />
                <div class="preview__info">
                    <h3 class="preview__title">${this.title}</h3>
                    <div class="preview__author">${authors[this.author]}</div>
                </div>
            </button>
        `;
    }
}

// Register the BookPreview component
customElements.define('book-preview', BookPreview);

// State management variables
let page = 1;
let matches = books;

// Function to display book previews
function renderBookPreviews(booksToShow) {
    const fragment = document.createDocumentFragment();
    booksToShow.slice(0, BOOKS_PER_PAGE).forEach(book => {
        const previewElement = document.createElement('book-preview');
        previewElement.setAttribute('data-id', book.id);
        previewElement.setAttribute('data-image', book.image);
        previewElement.setAttribute('data-title', book.title);
        previewElement.setAttribute('data-author', book.author);
        fragment.appendChild(previewElement);
    });
    const listContainer = document.querySelector('[data-list-items]');
    listContainer.innerHTML = '';
    listContainer.appendChild(fragment);
}

// Function to generate genre options
function renderGenreOptions() {
    const fragment = document.createDocumentFragment();
    const defaultOption = document.createElement('option');
    defaultOption.value = 'any';
    defaultOption.innerText = 'All Genres';
    fragment.appendChild(defaultOption);

    Object.entries(genres).forEach(([id, name]) => {
        const genreOption = document.createElement('option');
        genreOption.value = id;
        genreOption.innerText = name;
        fragment.appendChild(genreOption);
    });

    document.querySelector('[data-search-genres]').appendChild(fragment);
}

// Function to create author options
function renderAuthorOptions() {
    const fragment = document.createDocumentFragment();
    const defaultOption = document.createElement('option');
    defaultOption.value = 'any';
    defaultOption.innerText = 'All Authors';
    fragment.appendChild(defaultOption);

    Object.entries(authors).forEach(([id, name]) => {
        const authorOption = document.createElement('option');
        authorOption.value = id;
        authorOption.innerText = name;
        fragment.appendChild(authorOption);
    });

    document.querySelector('[data-search-authors]').appendChild(fragment);
}

// Function to adjust the theme based on user selection
function updateTheme(selectedTheme) {
    if (selectedTheme === 'night') {
        document.documentElement.style.setProperty('--color-dark', '255, 255, 255');
        document.documentElement.style.setProperty('--color-light', '10, 10, 20');
    } else {
        document.documentElement.style.setProperty('--color-dark', '10, 10, 20');
        document.documentElement.style.setProperty('--color-light', '255, 255, 255');
    }
}

// Set up event listeners
document.querySelector('[data-search-cancel]').addEventListener('click', () => {
    document.querySelector('[data-search-overlay]').open = false;
});

document.querySelector('[data-settings-cancel]').addEventListener('click', () => {
    document.querySelector('[data-settings-overlay]').open = false;
});

document.querySelector('[data-header-search]').addEventListener('click', () => {
    document.querySelector('[data-search-overlay]').open = true;
    document.querySelector('[data-search-title]').focus();
});

document.querySelector('[data-header-settings]').addEventListener('click', () => {
    document.querySelector('[data-settings-overlay]').open = true;
});

document.querySelector('[data-list-close]').addEventListener('click', () => {
    document.querySelector('[data-list-active]').open = false;
});

document.querySelector('[data-settings-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const { theme } = Object.fromEntries(formData);
    updateTheme(theme);
    document.querySelector('[data-settings-overlay]').open = false;
});

document.querySelector('[data-search-form]').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const filters = Object.fromEntries(formData);
    const filteredResults = books.filter(book => {
        const genreMatch = filters.genre === 'any' || book.genres.includes(filters.genre);
        const titleMatch = filters.title.trim() === '' || book.title.toLowerCase().includes(filters.title.toLowerCase());
        const authorMatch = filters.author === 'any' || book.author === filters.author;
        return titleMatch && authorMatch && genreMatch;
    });

    page = 1;
    matches = filteredResults;
    renderBookPreviews(filteredResults);

    const listMessage = document.querySelector('[data-list-message]');
    listMessage.classList.toggle('list__message_show', filteredResults.length < 1);
    const listButton = document.querySelector('[data-list-button]');
    listButton.disabled = (matches.length - (page * BOOKS_PER_PAGE)) < 1;
    listButton.innerHTML = `
        <span>Show more</span>
        <span class="list__remaining"> (${(matches.length - (page * BOOKS_PER_PAGE)) > 0 ? (matches.length - (page * BOOKS_PER_PAGE)) : 0})</span>
    `;

    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('[data-search-overlay]').open = false;
});

document.querySelector('[data-list-button]').addEventListener('click', () => {
    const fragment = document.createDocumentFragment();
    matches.slice(page * BOOKS_PER_PAGE, (page + 1) * BOOKS_PER_PAGE).forEach(book => {
        const previewElement = document.createElement('book-preview');
        previewElement.setAttribute('data-id', book.id);
        previewElement.setAttribute('data-image', book.image);
        previewElement.setAttribute('data-title', book.title);
        previewElement.setAttribute('data-author', book.author);
        fragment.appendChild(previewElement);
    });
    document.querySelector('[data-list-items]').appendChild(fragment);
    page += 1;
});

document.querySelector('[data-list-items]').addEventListener('preview-click', (event) => {
    const selectedId = event.detail.id;
    const selectedBook = books.find(book => book.id === selectedId);
    if (selectedBook) {
        document.querySelector('[data-list-active]').open = true;
        document.querySelector('[data-list-blur]').src = selectedBook.image;
        document.querySelector('[data-list-image]').src = selectedBook.image;
        document.querySelector('[data-list-title]').innerText = selectedBook.title;
        document.querySelector('[data-list-subtitle]').innerText = `${authors[selectedBook.author]} (${new Date(selectedBook.published).getFullYear()})`;
        document.querySelector('[data-list-description]').innerText = selectedBook.description;
    }
});

// Initialise the app
function init() {
    renderBookPreviews(matches);
    renderGenreOptions();
    renderAuthorOptions();
    updateTheme(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day');
    
    const listButton = document.querySelector('[data-list-button]');
    listButton.innerHTML = `
        <span>Show more</span>
        <span class="list__remaining"> (${(matches.length - (page * BOOKS_PER_PAGE)) > 0 ? (matches.length - (page * BOOKS_PER_PAGE)) : 0})</span>
    `;
    listButton.disabled = (matches.length - (page * BOOKS_PER_PAGE)) < 1;
}

init();
