// Modular UI Components for Lumina Luxe

const components = {
  /**
   * Generates a stunning product card with premium micro-interactions and stock badges.
   */
  productCard(product) {
    const isOutOfStock = product.stock <= 0;
    const isLowStock = product.stock > 0 && product.stock <= 5;
    
    let stockBadge = '';
    if (isOutOfStock) {
      stockBadge = `<span class="stock-badge out">Sold Out</span>`;
    } else if (isLowStock) {
      stockBadge = `<span class="stock-badge low">Only ${product.stock} left</span>`;
    } else {
      stockBadge = `<span class="stock-badge in">In Stock</span>`;
    }

    // Render stars rating
    const fullStars = Math.floor(product.rating);
    const halfStar = product.rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fas fa-star text-amber"></i>';
    if (halfStar) starsHtml += '<i class="fas fa-star-half-alt text-amber"></i>';
    for (let i = 0; i < emptyStars; i++) starsHtml += '<i class="far fa-star text-muted"></i>';

    return `
      <div class="product-card glass-panel" data-id="${product.id}">
        <div class="product-image-container">
          <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
          ${stockBadge}
          <div class="product-overlay">
            <button class="btn btn-secondary btn-icon view-details-btn" data-id="${product.id}" title="Quick View">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>
        <div class="product-info">
          <div class="product-meta">
            <span class="product-category">${product.category}</span>
            <div class="product-rating">
              ${starsHtml}
              <span class="rating-count">(${product.reviewCount})</span>
            </div>
          </div>
          <h3 class="product-title">${product.name}</h3>
          <p class="product-description">${product.description.slice(0, 80)}...</p>
          <div class="product-footer">
            <span class="product-price">$${product.price.toFixed(2)}</span>
            <button class="btn btn-primary add-to-cart-btn" data-id="${product.id}" ${isOutOfStock ? 'disabled' : ''}>
              <i class="fas fa-shopping-cart"></i> ${isOutOfStock ? 'Sold Out' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Generates a detailed product view container (Modal / Full View).
   */
  productDetails(product, currentStockInCart = 0) {
    const availableStock = product.stock - currentStockInCart;
    const isOutOfStock = availableStock <= 0;
    
    const fullStars = Math.floor(product.rating);
    const halfStar = product.rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fas fa-star text-amber"></i>';
    if (halfStar) starsHtml += '<i class="fas fa-star-half-alt text-amber"></i>';
    for (let i = 0; i < emptyStars; i++) starsHtml += '<i class="far fa-star text-muted"></i>';

    const featuresHtml = product.features.map(f => `<li><i class="fas fa-check-circle text-emerald"></i> ${f}</li>`).join('');

    return `
      <div class="product-details-container animate-fade-in">
        <button class="btn btn-secondary back-to-store-btn mb-4">
          <i class="fas fa-arrow-left"></i> Back to Store
        </button>
        <div class="product-details-grid">
          <div class="details-image-container glass-panel">
            <img src="${product.image}" alt="${product.name}" class="details-image">
          </div>
          <div class="details-info glass-panel">
            <span class="details-category">${product.category}</span>
            <h1 class="details-title">${product.name}</h1>
            <div class="details-rating mb-4">
              <div class="stars">${starsHtml}</div>
              <span class="rating-text">${product.rating} / 5.0 (${product.reviewCount} customer reviews)</span>
            </div>
            <div class="details-price">$${product.price.toFixed(2)}</div>
            <p class="details-description">${product.description}</p>
            
            <div class="details-features mb-6">
              <h3>Key Specifications</h3>
              <ul>${featuresHtml}</ul>
            </div>

            <div class="details-stock-status mb-6">
              Stock availability: 
              ${product.stock === 0 
                ? '<strong class="text-red">Out of Stock</strong>' 
                : `<strong>${product.stock} units available</strong>`
              }
              ${currentStockInCart > 0 
                ? `<span class="text-indigo block mt-1">(${currentStockInCart} currently in your cart)</span>` 
                : ''
              }
            </div>

            <div class="details-actions">
              ${isOutOfStock 
                ? `<button class="btn btn-primary w-full py-4" disabled>
                     <i class="fas fa-ban"></i> Out of Stock
                   </button>` 
                : `<button class="btn btn-primary btn-large w-full py-4 add-to-cart-btn-large" data-id="${product.id}">
                     <i class="fas fa-shopping-bag"></i> Add to Shopping Bag
                   </button>`
              }
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Generates a sleek, interactive shopping cart line item drawer row.
   */
  cartItem(item) {
    return `
      <div class="cart-item" data-id="${item.productId}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <h4 class="cart-item-title">${item.name}</h4>
          <span class="cart-item-price">$${item.price.toFixed(2)}</span>
          <div class="cart-item-qty">
            <button class="qty-btn dec-qty-btn" data-id="${item.productId}">
              <i class="fas fa-minus"></i>
            </button>
            <span class="qty-number">${item.quantity}</span>
            <button class="qty-btn inc-qty-btn" data-id="${item.productId}">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
        <button class="remove-cart-item-btn" data-id="${item.productId}" title="Remove Item">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;
  },

  /**
   * Generates a professional order row card for Order History.
   */
  orderRow(order, isAdmin = false) {
    const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let statusClass = '';
    if (order.status === 'Pending') statusClass = 'status-pending';
    else if (order.status === 'Shipped') statusClass = 'status-shipped';
    else if (order.status === 'Delivered') statusClass = 'status-delivered';

    const itemsSummary = order.items.map(item => `${item.name} (x${item.quantity})`).join(', ');

    let adminActionHtml = '';
    if (isAdmin) {
      adminActionHtml = `
        <div class="order-admin-actions mt-3">
          <label class="text-muted text-xs mr-2">Update Status:</label>
          <select class="admin-status-select glass-select" data-id="${order.id}">
            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          </select>
        </div>
      `;
    }

    return `
      <div class="order-card glass-panel mb-4 animate-fade-in">
        <div class="order-card-header">
          <div>
            <span class="order-id">Order ID: #${order.id}</span>
            <span class="order-date">${formattedDate}</span>
          </div>
          <span class="order-status-badge ${statusClass}">${order.status}</span>
        </div>
        <div class="order-card-body">
          <div class="order-details-info">
            <p><strong>Customer:</strong> ${order.customerName} (${order.customerEmail})</p>
            <p><strong>Shipping to:</strong> ${order.shippingAddress.fullname}, ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.zipcode}</p>
            <p><strong>Products:</strong> <span class="text-indigo font-medium">${itemsSummary}</span></p>
            <p><strong>Payment Method:</strong> ${order.paymentMasked.cardBrand} ending in *${order.paymentMasked.lastFour}</p>
          </div>
          <div class="order-financials">
            <div class="financial-row"><span>Subtotal:</span> <span>$${order.subtotal.toFixed(2)}</span></div>
            <div class="financial-row"><span>Tax (8%):</span> <span>$${order.tax.toFixed(2)}</span></div>
            ${order.discount > 0 ? `<div class="financial-row text-emerald"><span>Discount:</span> <span>-$${order.discount.toFixed(2)}</span></div>` : ''}
            <div class="financial-row total"><span>Total:</span> <span>$${order.total.toFixed(2)}</span></div>
          </div>
        </div>
        ${adminActionHtml}
      </div>
    `;
  }
};
