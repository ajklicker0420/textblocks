document.addEventListener('DOMContentLoaded', () => {
    const textBlocks = document.getElementById('text-blocks');
    const newTextArea = document.getElementById('new-text');
    const titleInput = document.getElementById('block-title');
    const addButton = document.getElementById('add-button');
    const exportButton = document.getElementById('export-button');
    const importButton = document.getElementById('import-button');
    const clearButton = document.getElementById('clear-button');
    const fileInput = document.getElementById('file-input');
    const copiedFeedback = document.querySelector('.copied-feedback');
    const layoutButton = document.getElementById('layout-button');
    const layoutDropdown = document.querySelector('.layout-dropdown');
    const layoutOptions = document.querySelectorAll('.layout-option');
    const colorButton = document.getElementById('color-button');
    const colorDropdown = document.querySelector('.color-dropdown');
    const colorOptions = document.querySelectorAll('.color-option');
    const colorDots = document.querySelectorAll('.color-dot');
let selectedColor = '#f8f8f8'; // Default color

colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
        colorDots.forEach(d => d.classList.remove('selected'));
        dot.classList.add('selected');
        selectedColor = dot.dataset.color;
    });
});

// Select default color dot initially
colorDots[0].classList.add('selected');

    colorButton.addEventListener('click', (e) => {
        e.stopPropagation();
        colorDropdown.classList.toggle('show');
    });

    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            const color = option.getAttribute('data-color');
            document.body.style.backgroundColor = color;
            localStorage.setItem('preferredColor', color);
            colorDropdown.classList.remove('show');
        });
    });

    // Load preferred color
    const preferredColor = localStorage.getItem('preferredColor');
    if (preferredColor) {
        document.body.style.backgroundColor = preferredColor;
    }
    layoutButton.addEventListener('click', (e) => {
        e.stopPropagation();
        layoutDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        layoutDropdown.classList.remove('show');
    });

    layoutOptions.forEach(option => {
        option.addEventListener('click', () => {
            const columns = option.getAttribute('data-columns');
            textBlocks.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
            localStorage.setItem('preferredColumns', columns);
            layoutDropdown.classList.remove('show');
        });
    });

    // Load preferred column layout
    const preferredColumns = localStorage.getItem('preferredColumns');
    if (preferredColumns) {
        textBlocks.style.gridTemplateColumns = `repeat(${preferredColumns}, 1fr)`;
    }
    loadTextBlocks();

    function showCopiedFeedback(e) {
        copiedFeedback.style.left = `${e.clientX}px`;
        copiedFeedback.style.top = `${e.clientY}px`;
        copiedFeedback.style.display = 'block';
        setTimeout(() => {
            copiedFeedback.style.display = 'none';
        }, 1000);
    }

    addButton.addEventListener('click', () => {
        const text = newTextArea.value.trim();
        const title = titleInput.value.trim() || 'Untitled';
        if (text) {
            addTextBlock(text, title);
            newTextArea.value = '';
            titleInput.value = '';
            saveTextBlocks();
        }
    });
    function copyToClipboard(textToCopy) {
        // Navigator clipboard api needs a secure context (https)
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy);
        } else {
            // Use the 'out of viewport hidden text area' trick
            const textArea = document.createElement("textarea");
            textArea.value = textToCopy;
                
            // Move textarea out of the viewport so it's not visible
            textArea.style.position = "absolute";
            textArea.style.left = "-999999px";
                
            document.body.prepend(textArea);
            textArea.select();
    
            try {
                document.execCommand('copy');
            } catch (error) {
                console.error(error);
            } finally {
                textArea.remove();
            }
        }
    }
    function addTextBlock(text, title, color = null) {  // Add color parameter with null default
        const block = document.createElement('div');
        block.className = 'text-block';
        block.draggable = true;
        block.style.backgroundColor = color || selectedColor;

        const titleDiv = document.createElement('div');
        titleDiv.className = 'block-title';
        titleDiv.textContent = title;

        const textContent = document.createElement('div');
        textContent.className = 'text-content';
        textContent.textContent = text;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = '×';

        block.addEventListener('click', (e) => {
            if (e.target !== deleteButton) {
                copyToClipboard(text);

                showCopiedFeedback(e);
            }
        });

        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            block.remove();
            saveTextBlocks();
        });

        block.addEventListener('dragstart', () => {
            block.classList.add('dragging');
        });

        block.addEventListener('dragend', () => {
            block.classList.remove('dragging');
            saveTextBlocks();
        });

        block.appendChild(titleDiv);
        block.appendChild(textContent);
        block.appendChild(deleteButton);
        textBlocks.appendChild(block);
    }

    textBlocks.addEventListener('dragover', (e) => {
        e.preventDefault();
        const draggingBlock = document.querySelector('.dragging');
        const siblings = [...textBlocks.querySelectorAll('.text-block:not(.dragging)')];
        const nextSibling = siblings.find(sibling => {
            const box = sibling.getBoundingClientRect();
            return e.clientY < (box.top + box.height / 2);
        });

        if (nextSibling) {
            textBlocks.insertBefore(draggingBlock, nextSibling);
        } else {
            textBlocks.appendChild(draggingBlock);
        }
    });

    function saveTextBlocks() {
        const blocks = Array.from(textBlocks.getElementsByClassName('text-block'))
            .map(block => ({
                title: block.querySelector('.block-title').textContent,
                text: block.querySelector('.text-content').textContent,
                color: block.style.backgroundColor
            }));
        localStorage.setItem('textBlocks', JSON.stringify(blocks));
    }

function loadTextBlocks() {
    const saved = localStorage.getItem('textBlocks');
    if (saved) {
        JSON.parse(saved).forEach(block => {
            addTextBlock(block.text, block.title);
            const newBlock = textBlocks.lastElementChild;
            if (block.color) {
                newBlock.style.backgroundColor = block.color;
            }
        });
    }
}

    exportButton.addEventListener('click', () => {
        const blocks = Array.from(textBlocks.getElementsByClassName('text-block'))
            .map(block => ({
                title: block.querySelector('.block-title').textContent,
                text: block.querySelector('.text-content').textContent
            }));

        const dataStr = JSON.stringify(blocks, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'text-blocks-backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    importButton.addEventListener('click', () => {
        fileInput.click();
    });

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const blocks = JSON.parse(e.target.result);
                localStorage.setItem('textBlocks', JSON.stringify(blocks));
                location.reload();  // Refresh the page
            } catch (error) {
                alert('Invalid backup file');
            }
        };
        reader.readAsText(file);
    }
});

    clearButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all text blocks? This cannot be undone.')) {
            textBlocks.innerHTML = '';
            localStorage.removeItem('textBlocks');
        }
    });
});
