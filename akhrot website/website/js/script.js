console.log("akhrot  site loaded");

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.querySelector('.search-bar');
    const products = document.querySelectorAll('.product-card');

    const noResultsMsg = document.createElement('p');
    noResultsMsg.textContent = 'No results found';
    noResultsMsg.style.textAlign = 'center';
    noResultsMsg.style.color = '#666';
    noResultsMsg.style.display = 'none';

    const productsContainer = document.querySelector('.products-section');
    productsContainer.appendChild(noResultsMsg);

    searchInput.addEventListener('input', function () {
        const query = searchInput.value.toLowerCase();
        let matches = 0;

        products.forEach(product => {
            const title = product.querySelector('h3').textContent.toLowerCase();
            if (title.includes(query)) {
                product.style.display = 'block';
                matches++;
            } else {
                product.style.display = 'none';
            }
        });

        noResultsMsg.style.display = matches === 0 ? 'block' : 'none';
    });
});


