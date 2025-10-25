// ===============================
// CUSTOMER ORDER FORM LOGIC
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const orderForm = document.getElementById("orderForm");
  const confirmation = document.getElementById("confirmationMessage");

  if (orderForm) {
    orderForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("customerName").value.trim();
      const phone = document.getElementById("customerPhone").value.trim();
      const address = document.getElementById("customerAddress").value.trim();
      const product = document.getElementById("product").value;
      const quantity = parseInt(document.getElementById("quantity").value);
      const price = parseFloat(document.getElementById("price").value);

      if (!name || !phone || !address || !product || !quantity || !price) {
        alert("Please fill all fields.");
        return;
      }

      const total = quantity * price;

      const newOrder = {
        orderId: Date.now(),
        name,
        phone,
        address,
        product,
        quantity,
        price,
        total,
        date: new Date().toLocaleString(),
        status: "Pending",
      };

      const orders = JSON.parse(localStorage.getItem("orders")) || [];
      orders.push(newOrder);
      localStorage.setItem("orders", JSON.stringify(orders));

      orderForm.reset();
      confirmation.textContent = `✅ Order placed successfully! Your Order ID: ${newOrder.orderId}`;
      confirmation.style.color = "green";
      setTimeout(() => (confirmation.textContent = ""), 5000);
    });
  }

  // ===============================
  // ADMIN DASHBOARD LOGIC
  // ===============================
  const tableBody = document.querySelector("#ordersTable tbody");
  const noOrdersMsg = document.getElementById("noOrders");
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const exportBtn = document.getElementById("exportBtn");
  const clearBtn = document.getElementById("clearBtn");
  const modal = document.getElementById("orderModal");
  const modalBody = document.getElementById("modalBody");
  const closeModal = document.getElementById("closeModal");

  if (tableBody) {
    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    let editIndex = null;

    function saveOrders() {
      localStorage.setItem("orders", JSON.stringify(orders));
    }

    function renderOrders(filteredOrders = orders) {
      tableBody.innerHTML = "";

      if (filteredOrders.length === 0) {
        noOrdersMsg.style.display = "block";
        return;
      } else {
        noOrdersMsg.style.display = "none";
      }

      filteredOrders.forEach((order, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${order.orderId}</td>
          <td>${order.name}<br><small>${order.phone}</small></td>
          <td>${order.product}</td>
          <td>${order.quantity}</td>
          <td>Rs. ${order.price.toFixed(2)}</td>
          <td><strong>Rs. ${order.total.toFixed(2)}</strong></td>
          <td>${order.date}</td>
          <td><span class="status ${order.status.toLowerCase()}">${order.status}</span></td>
          <td>
            <button class="action-btn view" onclick="viewOrderDetails(${index})">View</button>
            <button class="action-btn confirm" onclick="updateStatus(${index}, 'Confirmed')">Confirm</button>
            <button class="action-btn delivered" onclick="updateStatus(${index}, 'Delivered')">Deliver</button>
            <button class="action-btn edit" onclick="editOrder(${index})">Edit</button>
            <button class="action-btn delete" onclick="deleteOrder(${index})">Delete</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }

    renderOrders();

    // === Sorting ===
    let currentSort = { field: "", direction: "asc" };
    window.sortOrders = (field) => {
      if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
      } else {
        currentSort = { field, direction: "asc" };
      }

      orders.sort((a, b) => {
        let valA = a[field].toString().toLowerCase();
        let valB = b[field].toString().toLowerCase();

        if (field === "date") {
          return currentSort.direction === "asc"
            ? new Date(a.date) - new Date(b.date)
            : new Date(b.date) - new Date(a.date);
        }

        if (valA < valB) return currentSort.direction === "asc" ? -1 : 1;
        if (valA > valB) return currentSort.direction === "asc" ? 1 : -1;
        return 0;
      });

      renderOrders();
    };

    // === Search ===
    searchInput?.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      const filtered = orders.filter(
        (o) =>
          o.name.toLowerCase().includes(query) ||
          o.product.toLowerCase().includes(query) ||
          o.phone.includes(query)
      );
      renderOrders(filtered);
    });

    // === Filter ===
    statusFilter?.addEventListener("change", () => {
      const selected = statusFilter.value;
      if (selected === "All") renderOrders();
      else renderOrders(orders.filter((o) => o.status === selected));
    });

    // === Update / Delete ===
    window.updateStatus = (index, status) => {
      orders[index].status = status;
      saveOrders();
      renderOrders();
    };

    window.deleteOrder = (index) => {
      if (confirm("Are you sure you want to delete this order?")) {
        orders.splice(index, 1);
        saveOrders();
        renderOrders();
      }
    };

    // === View Order Details ===
    window.viewOrderDetails = (index) => {
      const order = orders[index];
      modalBody.innerHTML = `
        <p><strong>Order ID:</strong> ${order.orderId}</p>
        <p><strong>Name:</strong> ${order.name}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Address:</strong> ${order.address}</p>
        <p><strong>Product:</strong> ${order.product}</p>
        <p><strong>Quantity:</strong> ${order.quantity}</p>
        <p><strong>Price:</strong> Rs. ${order.price.toFixed(2)}</p>
        <p><strong>Total:</strong> Rs. ${order.total.toFixed(2)}</p>
        <p><strong>Date:</strong> ${order.date}</p>
        <p><strong>Status:</strong> ${order.status}</p>
      `;
      modal.style.display = "block";
    };

    closeModal.onclick = () => (modal.style.display = "none");
    window.onclick = (e) => {
      if (e.target === modal) modal.style.display = "none";
    };

    // === Export ===
    exportBtn.onclick = () => {
      if (!orders.length) return alert("No orders to export!");

      const csvContent = [
        "Order ID,Name,Phone,Product,Quantity,Price,Total,Date,Status",
        ...orders.map(
          (o) =>
            `${o.orderId},"${o.name}",${o.phone},"${o.product}",${o.quantity},${o.price},${o.total},"${o.date}",${o.status}`
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "orders.csv";
      link.click();
    };

    // === Clear All ===
    clearBtn.onclick = () => {
      if (confirm("⚠️ Delete all orders? This cannot be undone.")) {
        orders = [];
        saveOrders();
        renderOrders();
      }
    };

    // === Edit Order Popup ===
    window.editOrder = (index) => {
      const order = orders[index];
      editIndex = index;

      document.getElementById("editName").value = order.name;
      document.getElementById("editProduct").value = order.product;
      document.getElementById("editQty").value = order.quantity;
      document.getElementById("editPrice").value = order.price;

      document.getElementById("editPopup").style.display = "flex";
    };

    window.closePopup = () => {
      document.getElementById("editPopup").style.display = "none";
    };

    document
      .getElementById("editOrderForm")
      ?.addEventListener("submit", function (e) {
        e.preventDefault();

        const updatedName = document.getElementById("editName").value;
        const updatedProduct = document.getElementById("editProduct").value;
        const updatedQty = parseInt(document.getElementById("editQty").value);
        const updatedPrice = parseFloat(document.getElementById("editPrice").value);
        const updatedTotal = updatedQty * updatedPrice;

        orders[editIndex] = {
          ...orders[editIndex],
          name: updatedName,
          product: updatedProduct,
          quantity: updatedQty,
          price: updatedPrice,
          total: updatedTotal,
        };

        saveOrders();
        renderOrders();
        closePopup();
      });
  }
});
