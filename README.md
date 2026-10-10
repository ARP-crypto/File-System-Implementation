# File System Lab

An interactive, client-side **File System Implementation** website for an Operating Systems mini-project.

## Features

- Create files
- Write file data
- Read file contents
- Delete files
- Directory structure/table
- 100-block virtual disk
- Free/used block visualization
- Contiguous allocation
- Linked allocation
- Indexed allocation
- Block inspection and file highlighting
- Disk reset
- Responsive layout

## Run locally

No build step and no backend are required.

1. Download or clone the repository.
2. Open `index.html` in a modern browser.

For a local server, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Project structure

```text
file-system-website/
├── index.html
├── style.css
├── app.js
├── README.md
└── LICENSE
```

## Implementation notes

The website is an educational simulation. The disk is represented by 100 virtual blocks, and each block stores ownership and allocation metadata in JavaScript state.

Each block can store up to 50 characters in this demo. Files are kept in an in-memory directory using a JavaScript `Map`.

### Contiguous allocation

Searches for a consecutive run of free blocks.

### Linked allocation

Allocates free blocks and stores a `next` pointer for the logical file order.

### Indexed allocation

Reserves one index block and allocates the remaining blocks as data blocks.

## Limitations

- Data is stored in memory only and is cleared on refresh.
- The project is a simulation and does not write to the user's physical disk.
- It does not implement authentication, permissions, journaling, or a real operating-system file system driver.

## Suggested project screenshots

1. Main File System Lab dashboard
2. Create-file result
3. Write/read operation
4. Contiguous allocation
5. Linked allocation
6. Indexed allocation
7. Delete/reallocation

## License

MIT
