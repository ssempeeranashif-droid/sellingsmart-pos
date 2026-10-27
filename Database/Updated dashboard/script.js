let products = [
    {
        id: 1,
        name: "Product One",
        category: "Clothing",
        price: 25,
        costPrice: 15,
        stock: 25,
        image: "images/product1.jpg"
    },

    {
        id: 2,
        name: "Product Two",
        category: "Shoes",
        price: 45,
        costPrice: 30,
        stock: 8,
        image: "images/product2.jpg"
    },

    {
        id: 3,
        name: "Product Three",
        category: "Accessories",
        price: 15,
        costPrice: 8,
        stock: 0,
        image: "images/product3.jpg"
    }
];


async function loadProductsFromDatabase() {
    try {
        const response = await fetch("/api/products", {
            method: "GET",
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("Unable to load products from MySQL.");
        }

        const databaseProducts = await response.json();

        products = databaseProducts.map(function(product) {
            return {
                id: Number(product.id),
                name: product.name,
                category: product.category,
                price: Number(product.price) || 0,

                costPrice: Number(
                    product.costPrice ?? product.cost_price
                ) || 0,

                stock: Number(product.stock) || 0,

                image: product.image ?? product.image_url ?? "",

                description: product.description || ""
            };
        });

        console.log("Products loaded from MySQL:", products);

        return true;

    } catch (error) {
        console.error("Product loading error:", error);
        alert("Could not load products from the database.");
        return false;
    }
}


async function loadOrdersFromDatabase() {

    try {

        const response = await fetch("/api/orders", {
            method: "GET",
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("Unable to load orders from MySQL.");
        }

        const responseData = await response.json();

        const databaseOrders = Array.isArray(responseData)
            ? responseData
            : responseData.orders;

        if (!Array.isArray(databaseOrders)) {
            throw new Error("The orders response is invalid.");
        }

        orders = databaseOrders.map(function(order) {

            const orderItems = Array.isArray(order.items)
                ? order.items
                : [];

            return {

                id: Number(order.id),

                customer: order.customer || "",

                total: Number(order.total) || 0,

                status: order.status,

                paymentMethod:
                    order.paymentMethod ||
                    order.payment_method ||
                    "",

                date:
                    order.date ||
                    order.created_at ||
                    order.createdAt,

                stockAdjusted: Boolean(
                    order.stockAdjusted ??
                    order.stock_adjusted
                ),

                items: orderItems.map(function(item) {

                    return {

                        productId: Number(
                            item.productId ??
                            item.product_id
                        ),

                        productName:
                            item.productName ||
                            item.product_name ||
                            "",

                        quantity: Number(item.quantity) || 0,

                        price: Number(item.price) || 0,

                        costPrice: Number(
                            item.costPrice ??
                            item.cost_price
                        ) || 0

                    };

                })

            };

        });

        console.log("Orders loaded from MySQL:", orders);

        console.log("Total orders:", orders.length);

        console.log(
            "Completed orders:",
            orders.filter(function(order) {
                return order.status === "Completed";
            }).length
        );

        console.log(
            "First order date:",
            orders.length > 0 ? orders[0].date : "No orders found"
        );

        console.log(
            "Today's sales:",
            getTodaySales()
        );

        console.log(
            "Weekly sales:",
            getWeeklySales()
        );

        console.log(
            "Monthly sales:",
            getMonthlySales()
        );

        return true;

    } catch (error) {

        console.error("Order loading error:", error);

        return false;

    }

}


let orderSettings = {
    defaultStatus: "Pending",
    lowStockThreshold: 5,
    automaticStockAdjustment: true
};

const savedOrderSettings =
    localStorage.getItem("orderSettings");

if (savedOrderSettings) {

    try {

        orderSettings =
            JSON.parse(savedOrderSettings);

    }
    catch (error) {

        console.error(
            "Unable to load order settings:",
            error
        );

    }

}

let orders = [
    {
        id: 1,
        customer: "Customer One",

        items: [
            {
                productId: 1,
                quantity: 2,
                price: 25,
                costPrice: 15
            },

            {
                productId: 2,
                quantity: 1,
                price: 45,
                costPrice: 30
            }
        ],

        total: 95,
        status: "Completed",
        paymentMethod: "Cash",
        date: new Date(),
        stockAdjusted: false
    },


    {
        id: 2,
        customer: "Customer Two",

        items: [
            {
                productId: 2,
                quantity: 1,
                price: 45,
                costPrice: 30
            }
        ],

        total: 45,
        status: "Completed",
        paymentMethod: "Mobile Money",
        date: new Date(),
        stockAdjusted: false
    },


    {
        id: 3,
        customer: "Customer Three",

        items: [
            {
                productId: 1,
                quantity: 1,
                price: 25,
                costPrice: 15
            }
        ],

        total: 25,
        status: orderSettings.defaultStatus,
        paymentMethod: "Card",
        date: new Date(),
        stockAdjusted: false
    }
];


let storeSettings = {
    name: "",
    email: "",
    phone: "",
    currency: "USD",
    address: ""
};


function formatCurrency(amount) {
    const currency = storeSettings.currency || "USD";

    return new Intl.NumberFormat("en-UG", {
        style: "currency",
        currency: currency
    }).format(Number(amount) || 0);
}

let paymentSettings = {
    cash: true,
    mobileMoney: true,
    card: true,
    BankTransfer: true,
    defaultPayment: "Cash"
};

const savedStoreSettings =
    localStorage.getItem("storeSettings");

if (savedStoreSettings) {

    storeSettings =
        JSON.parse(savedStoreSettings);

}

const savedPaymentSettings =
    localStorage.getItem("paymentSettings");

if (savedPaymentSettings) {

    try {

        paymentSettings =
            JSON.parse(savedPaymentSettings);

    }
    catch (error) {

        console.error(
            "Unable to load payment settings:",
            error
        );

    }

}



function updateDashboardProductCount() {

    const totalProductsCount =
        document.getElementById("total-products-count");

    if (totalProductsCount) {

        totalProductsCount.textContent =
            products.length;
    }
}



function updateDashboardTransactions() {

    const transactionsCount =
        document.getElementById("transactions-count");


    if (transactionsCount) {

        const completedTransactions =
            orders.filter(function(order) {

                return order.status === "Completed";

            }).length;


        transactionsCount.textContent =
            completedTransactions;
    }
}

function updateDashboardLowStock() {

    const lowStockCount =
        document.getElementById("low-stock-count");

    if (lowStockCount) {

        const lowStockProducts =
            products.filter(function(product) {
                return product.stock > 0 &&
                       product.stock <= orderSettings.lowStockThreshold;
            }).length;

        lowStockCount.textContent =
            lowStockProducts;
    }
}

function refreshDashboard() {

    updateDashboardTransactions();

    updateDashboardProductCount();

    updateDashboardLowStock();

    const todaySales =
        document.getElementById("today-sales");

    const weeklySales =
        document.getElementById("weekly-sales");

    const monthlySales =
        document.getElementById("monthly-sales");

    const grossProfit =
        document.getElementById("gross-profit");


    if (todaySales) {
        todaySales.textContent =
            formatCurrency(
                getTodaySales()
            );
    }

    if (weeklySales) {
        weeklySales.textContent =
            formatCurrency(
                getWeeklySales()
            );
    }

    if (monthlySales) {
        monthlySales.textContent =
            formatCurrency(
                getMonthlySales()
            );
    }

    if (grossProfit) {
        grossProfit.textContent =
            formatCurrency(
                getGrossProfit()
            );
    }
}
    function getTodaySales() {

        let total = 0;

        const today = new Date();

        orders.forEach(function(order) {

            if (order.status !== "Completed") {
                return;
            }

            const orderDate = new Date(order.date);

            const isToday =
                orderDate.getDate() === today.getDate() &&
                orderDate.getMonth() === today.getMonth() &&
                orderDate.getFullYear() === today.getFullYear();

            if (isToday) {
                total += Number(order.total);
            }

        });

        return total;
    }


    function getWeeklySales() {

        let total = 0;

        const today = new Date();

        const sevenDaysAgo = new Date(today);

        sevenDaysAgo.setDate(
            today.getDate() - 6
        );

        sevenDaysAgo.setHours(
            0, 0, 0, 0
        );

        const endOfToday = new Date(today);

        endOfToday.setHours(
            23, 59, 59, 999
        );


        orders.forEach(function(order) {

            if (order.status !== "Completed") {
                return;
            }

            const orderDate =
                new Date(order.date);

            if (
                orderDate >= sevenDaysAgo &&
                orderDate <= endOfToday
            ) {

                total += Number(order.total);

            }

        });

        return total;
    }


    function getMonthlySales() {

        let total = 0;

        const today = new Date();

        const currentMonth =
            today.getMonth();

        const currentYear =
            today.getFullYear();


        orders.forEach(function(order) {

            if (order.status !== "Completed") {
                return;
            }

            const orderDate =
                new Date(order.date);

            const isCurrentMonth =
                orderDate.getMonth() === currentMonth &&
                orderDate.getFullYear() === currentYear;

            if (isCurrentMonth) {

                total += Number(order.total);

            }

        });

        return total;
    }

function getLast7DaysSales() {

    const completedOrders = orders.filter(function(order) {
        return order.status === "Completed";
    });

    const today = new Date();

    const labels = [];
    const values = [];

    for (let i = 6; i >= 0; i--) {

        const date = new Date(today);

        date.setDate(today.getDate() - i);

        const label = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        });

        labels.push(label);

        let dailySales = 0;

        completedOrders.forEach(function(order) {

            const orderDate = new Date(order.date);

            if (
                orderDate.getDate() === date.getDate() &&
                orderDate.getMonth() === date.getMonth() &&
                orderDate.getFullYear() === date.getFullYear()
            ) {

                dailySales += Number(order.total);

            }

        });

        values.push(dailySales);
    }

    return {
        labels: labels,
        values: values
    };
}

function getPaymentMethodSales() {

    let cash = 0;
    let mobileMoney = 0;
    let card = 0;
    let BankTransfer = 0;

    const today = new Date();

    const currentMonth =
        today.getMonth();

    const currentYear =
        today.getFullYear();


    orders.forEach(function(order) {

        if (order.status !== "Completed") {
            return;
        }

        const orderDate =
            new Date(order.date);


        if (
            orderDate.getMonth() !== currentMonth ||
            orderDate.getFullYear() !== currentYear
        ) {
            return;
        }


        if (order.paymentMethod === "Cash") {

            cash += Number(order.total);

        }

        else if (
            order.paymentMethod === "Mobile Money"
        ) {

            mobileMoney += Number(order.total);

        }

        else if (
            order.paymentMethod === "Card"
        ) {

            card += Number(order.total);

        }
        else if (
            order.paymentMethod === "Bank Transfer"
        ){

            BankTransfer += Number(order.total);

        }

    });


    return {
        cash: cash,
        mobileMoney: mobileMoney,
        card: card,
        BankTransfer: BankTransfer
    };
}
function getBestSellingProducts() {
    const sales = {};

    orders.forEach(function(order) {

        if (order.status !== "Completed") {
            return;
        }

        order.items.forEach(function(item) {

            if (!sales[item.productId]) {
                sales[item.productId] = {
                    quantitySold: 0,
                    revenue: 0
                };
            }

            sales[item.productId].quantitySold += Number(item.quantity);

            sales[item.productId].revenue +=
                Number(item.price) * Number(item.quantity);
        });
    });

    const bestSellingProducts = products.map(function(product) {

        return {
            product: product,

            quantitySold: sales[product.id]
                ? sales[product.id].quantitySold
                : 0,

            revenue: sales[product.id]
                ? sales[product.id].revenue
                : 0
        };
    });

    bestSellingProducts.sort(function(a, b) {

        if (b.quantitySold !== a.quantitySold) {
            return b.quantitySold - a.quantitySold;
        }

        return b.revenue - a.revenue;
    });

    return bestSellingProducts;
}

function getGrossProfit() {

    let totalProfit = 0;


    orders.forEach(function(order) {

        if (order.status !== "Completed") {
            return;
        }


        order.items.forEach(function(item) {

            const sellingPrice =
                Number(item.price);

            const costPrice =
                Number(item.costPrice);


            const profitPerUnit =
                sellingPrice - costPrice;


            totalProfit +=
                profitPerUnit *
                Number(item.quantity);

        });

    });


    return totalProfit;
}

function updateProductStockForOrder(order, oldStatus, newStatus) {

    if (!orderSettings.automaticStockAdjustment) {
        return true;
    }

    if (
        oldStatus !== "Completed" &&
        newStatus === "Completed"
    ) {

        if (order.stockAdjusted === true) {
            return true;
        }

        for (let i = 0; i < order.items.length; i++) {

            const item = order.items[i];

            const product = products.find(function(product) {
                return product.id === item.productId;
            });

            if (!product) {

                alert("Product not found.");

                return false;
            }

            if (product.stock < item.quantity) {

                alert(
                    "Not enough stock for " +
                    product.name
                );

                return false;
            }
        }


        order.items.forEach(function(item) {

            const product = products.find(function(product) {
                return product.id === item.productId;
            });

            product.stock -= item.quantity;

        });


        order.stockAdjusted = true;

        return true;
    }


    if (
        oldStatus === "Completed" &&
        newStatus !== "Completed"
    ) {

        if (order.stockAdjusted !== true) {
            return true;
        }


        order.items.forEach(function(item) {

            const product = products.find(function(product) {
                return product.id === item.productId;
            });

            if (product) {

                product.stock += item.quantity;

            }

        });


        order.stockAdjusted = false;

        return true;
    }


    return true;
}

function refreshProductStockDisplay() {

    const productsTableBody =
        document.getElementById("products-table-body");

    if (!productsTableBody) {
        return;
    }

    const rows =
        productsTableBody.querySelectorAll("tr");

    rows.forEach(function(row) {

        const productId =
            Number(row.dataset.id);

        const product =
            products.find(function(product) {
                return product.id === productId;
            });

        if (!product) {
            return;
        }

        row.cells[4].textContent =
            product.stock;

        let status;
        let statusClass;

        if (product.stock === 0) {

            status = "Out of Stock";
            statusClass = "out-stock";

        }
        else if (product.stock <= 10) {

            status = "Low Stock";
            statusClass = "low-stock";

        }
        else {

            status = "In Stock";
            statusClass = "in-stock";
        }

        row.cells[5].innerHTML = `
            <span class="status ${statusClass}">
                ${status}
            </span>
        `;
    });
}


function updateOrderRow(row) {

    const productSelect =
        row.querySelector(".order-product");

    const quantityInput =
        row.querySelector(".order-quantity");

    const unitPrice =
        row.querySelector(".order-unit-price");

    const itemTotal =
        row.querySelector(".order-item-total");


    const productId =
        Number(productSelect.value);

    const product =
        products.find(function(product) {
            return product.id === productId;
        });


    if (!product) {

        unitPrice.textContent =
            formatCurrency(0);

        itemTotal.textContent =
            formatCurrency(0);

        updateOrderGrandTotal();

        return;
    }


    const quantity =
        Number(quantityInput.value) || 1;


    const total =
        product.price * quantity;


    unitPrice.textContent =
        formatCurrency(product.price);

    itemTotal.textContent =
        formatCurrency(total);


    updateOrderGrandTotal();
}

function updateOrderGrandTotal() {

    const rows =
        document.querySelectorAll(
            "#new-order-items tr"
        );

    let grandTotal = 0;


    rows.forEach(function(row) {

        const productSelect =
            row.querySelector(".order-product");

        const quantityInput =
            row.querySelector(".order-quantity");


        const productId =
            Number(productSelect.value);

        const product =
            products.find(function(product) {
                return product.id === productId;
            });


        if (product) {

            const quantity =
                Number(quantityInput.value) || 1;

            grandTotal +=
                product.price * quantity;
        }

    });


    const grandTotalElement =
        document.getElementById(
            "new-order-grand-total"
        );


    if (grandTotalElement) {

        grandTotalElement.textContent =
            formatCurrency(grandTotal);
    }
}

const contentDisplay =
    document.getElementById("content-display");
const navItems = document.querySelectorAll(".nav-item");

navItems.forEach(function(item) {

    item.addEventListener("click", function(event) {

        event.preventDefault();

        navItems.forEach(function(nav) {
            nav.classList.remove("active");
        });

        item.classList.add("active");

        const page = item.getAttribute("data-page");

        showPage(page);

    });

});
async function renderNewOrderPage() {

    try {

        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error("Unable to load products from the database.");
        }

        const latestProducts = await response.json();

        if (!Array.isArray(latestProducts)) {
            throw new Error("The products response is invalid.");
        }

        products = latestProducts.map(function(product) {
            return {
                ...product,
                price: Number(product.price) || 0,
                costPrice: Number(product.costPrice) || 0,
                stock: Number(product.stock) || 0
            };
        });

    } catch (error) {

        console.error("Loading products for New Order failed:", error);

        contentDisplay.innerHTML = `
            <div class="dashboard-content">
                <div class="welcome">
                    <h1>New Order</h1>
                    <p>
                        Unable to load products. Please check your
                        connection and try again.
                    </p>
                </div>
            </div>
        `;

        return;
    }


    const enabledPayments = [];

    if (paymentSettings.cash) {
        enabledPayments.push("Cash");
    }

    if (paymentSettings.mobileMoney) {
        enabledPayments.push("Mobile Money");
    }

    if (paymentSettings.card) {
        enabledPayments.push("Card");
    }

    if (paymentSettings.BankTransfer){
        enabledPayments.push("Bank Transfer");
    }

    const defaultPayment = enabledPayments.includes(
        paymentSettings.defaultPayment
    )
        ? paymentSettings.defaultPayment
        : enabledPayments[0] || "";

    contentDisplay.innerHTML = `
        <div class="dashboard-content">

            <div class="page-header">
                <div class="welcome">
                    <h1>New Order</h1>
                    <p>Create a new customer order.</p>
                </div>
            </div>

            <div class="page-card">

                <form id="new-order-form">

                    <div class="form-group">
                        <label for="new-order-customer">
                            Customer Name
                        </label>

                        <input
                            type="text"
                            id="new-order-customer"
                            placeholder="Enter customer name"
                            required
                        >
                    </div>

                    <h3>Order Items</h3>

                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Unit Price</th>
                                    <th>Item Total</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody id="new-order-items"></tbody>
                        </table>
                    </div>

                    <button
                        type="button"
                        id="add-order-product"
                        class="report-btn"
                    >
                        + Add Product
                    </button>

                    <div class="settings-form-grid">

                        <div class="form-group">
                            <label for="new-order-payment">
                                Payment Method
                            </label>

                            <select
                                id="new-order-payment"
                                required
                            >
                            
                            
                                ${enabledPayments.map(function(method) {
                                    return `
                                        <option
                                            value="${method}"
                                            ${method === defaultPayment ? "selected" : ""}
                                        >
                                            ${method}
                                        </option>
                                    `;
                                }).join("")}
                              
                                
                            </select>


                            ${enabledPayments.length === 0
                                ? `<small>No payment methods are enabled. Enable one in Settings.</small>`
                                : ""}
                        </div>

                        <div class="form-group">
                            <label for="new-order-status">
                                Order Status
                            </label>

                            <select
                                id="new-order-status"
                                required
                            >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                    </div>

                    <!-- Mobile Money provider selection -->
                    <div
                        id="mobile-money-details"
                        style="display: none;"
                    >
                        <h3 class="mobile-money-heading">
                            Choose Mobile Money Provider
                        </h3>

                        <div class="mobile-money-provider-grid">

                            <button
                                type="button"
                                class="mobile-money-provider mtn-provider"
                                data-provider="MTN"
                                aria-pressed="false"
                            >
                                <span class="provider-brand mtn-brand">MTN</span>
                                <span class="provider-name">Mobile Money</span>
                                <span class="provider-description">
                                    Pay with MTN MoMo
                                </span>
                            </button>

                            <button
                                type="button"
                                class="mobile-money-provider airtel-provider"
                                data-provider="Airtel"
                                aria-pressed="false"
                            >
                                <span class="provider-brand airtel-brand">airtel</span>
                                <span class="provider-name">Money</span>
                                <span class="provider-description">
                                    Pay with Airtel Money
                                </span>
                            </button>

                        </div>

                        <!-- Keeps the selected provider compatible with the existing JS -->
                        <select
                            id="new-order-mobile-money-provider"
                            disabled
                            aria-hidden="true"
                            tabindex="-1"
                            style="display: none;"
                        >
                            <option value="">Select Provider</option>
                            <option value="MTN">MTN</option>
                            <option value="Airtel">Airtel</option>
                        </select>

                        <!-- Phone entry panel: appears after selecting a provider -->
                        <div
                            id="mobile-money-phone-panel"
                            class="mobile-money-phone-panel"
                            style="display: none;"
                        >
                            <h4 id="mobile-money-phone-title">
                                Enter Phone Number
                            </h4>

                            <p id="mobile-money-phone-description">
                                Enter the phone number registered for Mobile Money.
                            </p>

                            <div class="mobile-money-phone-row">

                                <input
                                    type="tel"
                                    id="new-order-mobile-money-phone"
                                    placeholder="e.g. 0771234567"
                                    autocomplete="tel"
                                    inputmode="tel"
                                    disabled
                                >

                                <button
                                    type="button"
                                    id="mobile-money-phone-ok"
                                    class="mobile-money-ok-btn"
                                >
                                    OK
                                </button>

                            </div>

                            <p
                                id="mobile-money-phone-message"
                                class="mobile-money-phone-message"
                                aria-live="polite"
                            ></p>

                        </div>

                        <p
                            id="mobile-money-selection-status"
                            class="mobile-money-selection-status"
                            aria-live="polite"
                        ></p>

                        
                        <div
                            id="mobile-money-payment-status"
                            class="mobile-money-status-card"
                            style="display: none;"
                            aria-live="polite"
                        >
                            <div class="mobile-money-status-header">
                                <div class="mobile-money-status-icon" id="mobile-money-status-icon">
                                    <i class="fas fa-clock"></i>
                                </div>

                                <div class="mobile-money-status-heading">
                                    <span class="mobile-money-status-label">PAYMENT STATUS</span>
                                    <h4 id="mobile-money-payment-status-title">
                                        Frontend test: Waiting
                                    </h4>
                                </div>

                                <span class="mobile-money-status-badge" id="mobile-money-status-badge">
                                    Waiting
                                </span>
                            </div>

                            <p
                                id="mobile-money-payment-status-message"
                                class="mobile-money-status-message"
                            ></p>

                            <div
                                id="mobile-money-payment-status-details"
                                class="mobile-money-status-details"
                            ></div>

                            <div class="mobile-money-test-notice">
                                <i class="fas fa-info-circle"></i>
                                <span>
                                    Demonstration only. No real payment request has been sent,
                                    and payment has not been verified.
                                </span>
                            </div>

                            <div class="mobile-money-test-actions">
                                <button
                                    type="button"
                                    id="mobile-money-test-success"
                                    class="mobile-money-test-btn test-success-btn"
                                >
                                    <i class="fas fa-check-circle"></i> Test Success
                                </button>

                                <button
                                    type="button"
                                    id="mobile-money-test-failure"
                                    class="mobile-money-test-btn test-failure-btn"
                                >
                                    <i class="fas fa-times-circle"></i> Test Failure
                                </button>

                                <button
                                    type="button"
                                    id="mobile-money-test-pending"
                                    class="mobile-money-test-btn test-waiting-btn"
                                >
                                    <i class="fas fa-clock"></i> Test Waiting
                                </button>
                            </div>
                        </div>
                    </div>

                    
                    <!-- Bank Transfer Details -->
                    <div
                        id="bank-transfer-details"
                        class="bank-transfer-panel"
                        style="display: none;"
                    >
                        <div class="bank-transfer-heading">
                            <div class="bank-transfer-heading-icon">
                                <i class="fas fa-university"></i>
                            </div>

                            <div>
                                <h3>Bank Transfer</h3>
                                <p>Record the customer's bank transfer details.</p>
                            </div>
                        </div>

                        <div class="bank-transfer-notice">
                            <i class="fas fa-info-circle"></i>
                            <span>
                                Configure your business bank account details before using
                                this section for real customer transfers.
                            </span>
                        </div>

                        <div class="bank-transfer-account-card">
                            <h4>Business Bank Account</h4>

                            <div class="bank-transfer-account-row">
                                <span>Bank Name</span>
                                <strong>Not configured</strong>
                            </div>

                            <div class="bank-transfer-account-row">
                                <span>Account Name</span>
                                <strong>Not configured</strong>
                            </div>

                            <div class="bank-transfer-account-row">
                                <span>Account Number</span>
                                <strong>Not configured</strong>
                            </div>
                        </div>

                        <div class="bank-transfer-amount-card">
                            <span>Amount to Transfer</span>
                            <strong id="bank-transfer-amount">0</strong>
                        </div>

                        <div class="form-group bank-transfer-reference-group">
                            <label for="bank-transfer-reference">
                                Bank Transfer Reference Number
                            </label>

                            <input
                                type="text"
                                id="bank-transfer-reference"
                                placeholder="Enter the transfer reference"
                                maxlength="100"
                                autocomplete="off"
                            >

                            <small>
                                Enter the reference supplied by the customer or bank.
                            </small>
                        </div>

                        <div class="form-group">
                            <label for="bank-transfer-payer">
                                Account Holder / Sender Name
                            </label>

                            <input
                                type="text"
                                id="bank-transfer-payer"
                                placeholder="Enter the sender's name"
                                maxlength="180"
                                autocomplete="name"
                            >
                        </div>

                        <button
                            type="button"
                            id="bank-transfer-confirm"
                            class="bank-transfer-confirm-btn"
                        >
                            <i class="fas fa-check-circle"></i>
                            Confirm Transfer Details
                        </button>

                        <p
                            id="bank-transfer-message"
                            class="bank-transfer-message"
                            aria-live="polite"
                        ></p>

                        <!-- Frontend-only payment status preview -->
                        <div
                            id="bank-transfer-payment-status"
                            class="bank-transfer-status-card"
                            style="display: none;"
                            aria-live="polite"
                        >
                            <div class="bank-transfer-status-heading">
                                <div
                                    id="bank-transfer-status-icon"
                                    class="bank-transfer-status-icon"
                                >
                                    <i class="fas fa-clock"></i>
                                </div>

                                <div>
                                    <span class="bank-transfer-status-label">
                                        PAYMENT STATUS
                                    </span>

                                    <h4 id="bank-transfer-status-title">
                                        Frontend test: Waiting
                                    </h4>
                                </div>

                                <span
                                    id="bank-transfer-status-badge"
                                    class="bank-transfer-status-badge"
                                >
                                    Waiting
                                </span>
                            </div>

                            <p id="bank-transfer-status-description"></p>

                            <div
                                id="bank-transfer-status-details"
                                class="bank-transfer-status-details"
                            ></div>

                            <div class="bank-transfer-test-notice">
                                <i class="fas fa-info-circle"></i>
                                <span>
                                    Simulation only. No bank account has been checked
                                    and no payment has been verified.
                                </span>
                            </div>

                            <div class="bank-transfer-test-actions">
                                <button
                                    type="button"
                                    id="bank-transfer-test-success"
                                    class="bank-transfer-test-btn bank-test-success"
                                >
                                    <i class="fas fa-check-circle"></i>
                                    Test Success
                                </button>

                                <button
                                    type="button"
                                    id="bank-transfer-test-failure"
                                    class="bank-transfer-test-btn bank-test-failure"
                                >
                                    <i class="fas fa-times-circle"></i>
                                    Test Failure
                                </button>

                                <button
                                    type="button"
                                    id="bank-transfer-test-waiting"
                                    class="bank-transfer-test-btn bank-test-waiting"
                                >
                                    <i class="fas fa-clock"></i>
                                    Test Waiting
                                </button>
                            </div>
                        </div>
                    </div>
                    
                                        
                    <!-- CARD PAYMENT FRONTEND PANEL -->
                    <div id="card-payment-details" class="card-payment-panel" style="display: none;">

                        <div class="card-payment-heading">
                            <div class="card-payment-heading-icon">
                                <i class="fas fa-credit-card"></i>
                            </div>

                            <div>
                                <h3>Card Payment</h3>
                                <p>Accept payment using your card terminal or approved payment provider.</p>
                            </div>
                        </div>

                        <div class="card-payment-amount">
                            <span>Amount to collect</span>
                            <strong id="card-payment-amount">UGX 0</strong>
                        </div>

                        
                        <div class="card-payment-network-group">
                            <label class="card-payment-network-label">
                                Select Card Type
                            </label>

                            <div class="card-payment-options">

                                <button
                                    type="button"
                                    class="card-payment-option"
                                    data-card-type="Visa"
                                    aria-pressed="false"
                                >
                                    <span class="card-payment-brand card-payment-visa">
                                        <img src="images/visa%20card.jpg" alt="Visa">
                                    </span>
                                    <span class="card-payment-option-name">Visa</span>
                                    <span class="card-payment-option-check">
                                        <i class="fas fa-check-circle"></i>
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    class="card-payment-option"
                                    data-card-type="Mastercard"
                                    aria-pressed="false"
                                >
                                    <span class="card-payment-brand card-payment-mastercard">
                                        <img src="images/mastercard.webp" alt="Mastercard">
                                    </span>
                                    <span class="card-payment-option-name">Mastercard</span>
                                    <span class="card-payment-option-check">
                                        <i class="fas fa-check-circle"></i>
                                    </span>
                                </button>

                                                                
                                <button
                                    type="button"
                                    class="card-payment-option"
                                    data-card-type="Other"
                                    aria-pressed="false"
                                >
                                    <span class="card-payment-option-name">Other Card</span>

                                    <span class="card-payment-option-check">
                                        <i class="fas fa-check-circle"></i>
                                    </span>
                                </button>


                            </div>
                        </div>


                        <div class="card-payment-status" id="card-payment-status">
                            <div class="card-payment-status-icon">
                                <i class="fas fa-clock"></i>
                            </div>

                            <div class="card-payment-status-content">
                                <span>PAYMENT STATUS</span>
                                <h4 id="card-payment-status-title">Awaiting payment</h4>
                                <p id="card-payment-status-message">
                                    Process the payment using your secure card terminal or provider.
                                    This POS screen has not verified a payment.
                                </p>
                            </div>

                            <span class="card-payment-status-badge" id="card-payment-status-badge">
                                Pending
                            </span>
                        </div>

                        <p class="card-payment-notice">
                            <i class="fas fa-shield-alt"></i>
                            For security, enter card details only into your approved payment terminal
                            or provider. Do not enter card numbers, expiry dates, or CVV here.
                        </p>

                        <p id="card-payment-message" class="card-payment-message"></p>
                    </div>
                    <!-- END CARD PAYMENT FRONTEND PANEL -->


                    <div class="order-total">
                        <h3>
                            Grand Total:
                            <span id="new-order-grand-total">
                                ${formatCurrency(0)}
                            </span>
                        </h3>
                    </div>

                    <div class="settings-actions">

                        <button
                            type="button"
                            id="cancel-new-order"
                            class="report-btn"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            id="create-new-order"
                            class="save-settings-btn"
                            ${enabledPayments.length === 0 ? "disabled" : ""}
                        >
                            Create Order
                        </button>

                    </div>

                    <p id="new-order-message"></p>

                </form>

            </div>
        </div>
    `;

    const orderItemsContainer =
        document.getElementById("new-order-items");

    const orderForm =
        document.getElementById("new-order-form");

    
const statusSelect =
    document.getElementById("new-order-status");

const paymentSelect =
    document.getElementById("new-order-payment");

statusSelect.value = orderSettings.defaultStatus;

let previousPaymentMethod = paymentSelect.value;

function syncOrderStatusWithPaymentMethod() {

    const isMobileMoney =
        paymentSelect.value === "Mobile Money";

    const completedOption =
        statusSelect.querySelector(
            'option[value="Completed"]'
        );

        if (completedOption) {
            completedOption.disabled = isMobileMoney;
        }

        if (isMobileMoney) {

            statusSelect.value = "Pending";

        } else if (
            previousPaymentMethod === "Mobile Money"
        ) {

            statusSelect.value =
                orderSettings.defaultStatus;
        }

        previousPaymentMethod = paymentSelect.value;
    }

    syncOrderStatusWithPaymentMethod();

    paymentSelect.addEventListener(
        "change",
        syncOrderStatusWithPaymentMethod
    );


    const mobileMoneyDetails =
        document.getElementById("mobile-money-details");

    const mobileMoneyProvider =
        document.getElementById("new-order-mobile-money-provider");

    const mobileMoneyPhone =
        document.getElementById("new-order-mobile-money-phone");

    const mobileMoneyPhonePanel =
        document.getElementById("mobile-money-phone-panel");

    const mobileMoneyPhoneTitle =
        document.getElementById("mobile-money-phone-title");

    const mobileMoneyPhoneDescription =
        document.getElementById("mobile-money-phone-description");

    const mobileMoneyPhoneMessage =
        document.getElementById("mobile-money-phone-message");

    const mobileMoneySelectionStatus =
        document.getElementById("mobile-money-selection-status");

    const mobileMoneyPaymentStatus =
        document.getElementById("mobile-money-payment-status");

    const mobileMoneyPaymentStatusTitle =
        document.getElementById("mobile-money-payment-status-title");

    const mobileMoneyPaymentStatusMessage =
        document.getElementById("mobile-money-payment-status-message");

    const mobileMoneyPaymentStatusDetails =
        document.getElementById("mobile-money-payment-status-details");

    const mobileMoneyTestSuccess =
        document.getElementById("mobile-money-test-success");

    const mobileMoneyTestFailure =
        document.getElementById("mobile-money-test-failure");

    const mobileMoneyTestPending =
        document.getElementById("mobile-money-test-pending");

    const mobileMoneyOkButton =
        document.getElementById("mobile-money-phone-ok");
    const mobileMoneyProviderButtons =
        document.querySelectorAll(".mobile-money-provider");

    let mobileMoneyPhoneConfirmed = false;

    
        function showMobileMoneyTestStatus(status) {
            const provider = mobileMoneyProvider.value;
            const phone = mobileMoneyPhone.value.trim();

            const statusIcon = document.getElementById(
                "mobile-money-status-icon"
            );

            const statusBadge = document.getElementById(
                "mobile-money-status-badge"
            );

            mobileMoneyPaymentStatus.style.display = "block";

            mobileMoneyPaymentStatusTitle.textContent =
                "Frontend test: " + status;

            mobileMoneyPaymentStatusDetails.textContent =
                "Provider: " + provider + " | Phone: " + phone;

            statusIcon.style.background = "";
            statusIcon.style.color = "";
            statusBadge.style.background = "";
            statusBadge.style.color = "";

            if (status === "Waiting") {
                statusIcon.innerHTML = '<i class="fas fa-clock"></i>';
                statusIcon.style.background = "#fff7e6";
                statusIcon.style.color = "#b7791f";

                statusBadge.textContent = "Waiting";
                statusBadge.style.background = "#fff3d6";
                statusBadge.style.color = "#96610a";

                mobileMoneyPaymentStatusMessage.textContent =
                    "Waiting for the customer to approve the payment. " +
                    "This is a simulated screen; no payment request has been sent.";
            } else if (status === "Success") {
                statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
                statusIcon.style.background = "#e8f7ee";
                statusIcon.style.color = "#207344";

                statusBadge.textContent = "Test Success";
                statusBadge.style.background = "#e8f7ee";
                statusBadge.style.color = "#207344";

                mobileMoneyPaymentStatusMessage.textContent =
                    "Success-state preview only. No real payment has been received " +
                    "or verified. The order has not been marked as paid by this test.";
            } else if (status === "Failed") {
                statusIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
                statusIcon.style.background = "#fff0ef";
                statusIcon.style.color = "#b93832";

                statusBadge.textContent = "Test Failed";
                statusBadge.style.background = "#fff0ef";
                statusBadge.style.color = "#b93832";

                mobileMoneyPaymentStatusMessage.textContent =
                    "Failure-state preview only. No real payment was attempted. " +
                    "A real retry must be made through the payment provider.";
            }
        }



    function syncMobileMoneyFields() {

        const isMobileMoney =
            paymentSelect.value === "Mobile Money";

        mobileMoneyDetails.style.display =
            isMobileMoney ? "block" : "none";

        if (!isMobileMoney) {

            mobileMoneyProvider.value = "";
            mobileMoneyProvider.disabled = true;

            mobileMoneyPhone.value = "";
            mobileMoneyPhone.disabled = true;
            mobileMoneyPhone.required = false;

            mobileMoneyPhonePanel.style.display = "none";

            mobileMoneyPhoneMessage.textContent = "";
            mobileMoneyPaymentStatus.style.display = "none";
            mobileMoneySelectionStatus.textContent = "";

            mobileMoneyPhoneConfirmed = false;

            mobileMoneyProviderButtons.forEach(function(button) {
                button.classList.remove("selected");
                button.setAttribute("aria-pressed", "false");
            });
        }
    }


    mobileMoneyProviderButtons.forEach(function(button) {

        button.addEventListener("click", function() {

            if (paymentSelect.value !== "Mobile Money") {
                return;
            }

            const provider = button.dataset.provider;

            mobileMoneyProvider.value = provider;
            mobileMoneyProvider.disabled = false;

            mobileMoneyPhone.value = "";
            mobileMoneyPhone.disabled = false;
            mobileMoneyPhone.required = true;

            mobileMoneyPhoneConfirmed = false;

            mobileMoneyPhoneMessage.textContent = "";
            mobileMoneySelectionStatus.textContent = "";

            mobileMoneyProviderButtons.forEach(function(otherButton) {

                const isSelected = otherButton === button;

                otherButton.classList.toggle(
                    "selected",
                    isSelected
                );

                otherButton.setAttribute(
                    "aria-pressed",
                    String(isSelected)
                );
            });

            mobileMoneyPhoneTitle.textContent =
                provider === "MTN"
                    ? "MTN Mobile Money"
                    : "Airtel Money";

            mobileMoneyPhoneDescription.textContent =
                provider === "MTN"
                    ? "Enter the phone number registered with MTN MoMo."
                    : "Enter the phone number registered with Airtel Money.";

            mobileMoneyPhonePanel.style.display = "block";

            mobileMoneySelectionStatus.textContent =
                provider + " selected";

            mobileMoneyPhone.focus();
        });
    });


    mobileMoneyPhone.addEventListener("input", function() {

        mobileMoneyPhoneConfirmed = false;

        mobileMoneyPhoneMessage.textContent = "";

        mobileMoneyPaymentStatus.style.display = "none";

        mobileMoneySelectionStatus.textContent =
            mobileMoneyProvider.value
                ? mobileMoneyProvider.value +
                " selected — confirm the phone number."
                : "";
    });


    mobileMoneyOkButton.addEventListener("click", function() {

        const provider = mobileMoneyProvider.value;

        const phone = mobileMoneyPhone.value
            .trim()
            .replace(/[\s-]/g, "");

        if (!provider) {

            mobileMoneyPhoneMessage.textContent =
                "Please select MTN or Airtel first.";

            return;
        }

        const validUgandanPhone =
            /^(?:0\d{9}|\+256\d{9})$/.test(phone);

        if (!validUgandanPhone) {

            mobileMoneyPhoneConfirmed = false;

            mobileMoneyPhoneMessage.textContent =
                "Enter a valid Ugandan number, e.g. 0771234567 or +256771234567.";

            mobileMoneyPhone.focus();

            return;
        }

        mobileMoneyPhone.value = phone;

        mobileMoneyPhoneConfirmed = true;

        mobileMoneyPhoneMessage.textContent =
            "Phone number confirmed. Ready to create the order.";

        mobileMoneySelectionStatus.textContent =
            provider + " Mobile Money selected. " +
            "The payment request will be sent after you create the order.";

        mobileMoneyPaymentStatus.style.display = "none";
    });


    mobileMoneyTestSuccess.addEventListener("click", function() {
        if (!mobileMoneyPhoneConfirmed) {
            return;
        }

        showMobileMoneyTestStatus("Success");
    });

    mobileMoneyTestFailure.addEventListener("click", function() {
        if (!mobileMoneyPhoneConfirmed) {
            return;
        }

        showMobileMoneyTestStatus("Failed");
    });

    mobileMoneyTestPending.addEventListener("click", function() {
        if (!mobileMoneyPhoneConfirmed) {
            return;
        }

        showMobileMoneyTestStatus("Waiting");
    });

    paymentSelect.addEventListener(
        "change",
        syncMobileMoneyFields
    );


    syncMobileMoneyFields();

    

    const bankTransferDetails =
        document.getElementById("bank-transfer-details");

    const bankTransferReference =
        document.getElementById("bank-transfer-reference");

    const bankTransferPayer =
        document.getElementById("bank-transfer-payer");

    const bankTransferAmount =
        document.getElementById("bank-transfer-amount");

    const bankTransferConfirm =
        document.getElementById("bank-transfer-confirm");

    const bankTransferMessage =
        document.getElementById("bank-transfer-message");

    const bankTransferPaymentStatus =
        document.getElementById("bank-transfer-payment-status");

    const bankTransferStatusIcon =
        document.getElementById("bank-transfer-status-icon");

    const bankTransferStatusTitle =
        document.getElementById("bank-transfer-status-title");

    const bankTransferStatusBadge =
        document.getElementById("bank-transfer-status-badge");

    const bankTransferStatusDescription =
        document.getElementById("bank-transfer-status-description");

    const bankTransferStatusDetails =
        document.getElementById("bank-transfer-status-details");

    const bankTransferTestSuccess =
        document.getElementById("bank-transfer-test-success");

    const bankTransferTestFailure =
        document.getElementById("bank-transfer-test-failure");

    const bankTransferTestWaiting =
        document.getElementById("bank-transfer-test-waiting");

    let bankTransferDetailsConfirmed = false;

    let bankTransferTestState = "";


    function syncBankTransferFields() {
        const isBankTransfer =
            paymentSelect.value === "Bank Transfer";

        bankTransferDetails.style.display =
            isBankTransfer ? "block" : "none";

        if (isBankTransfer) {
            updateBankTransferAmount();
        } else {
            bankTransferDetailsConfirmed = false;
            bankTransferTestState = "";
            bankTransferMessage.textContent = "";
            bankTransferPaymentStatus.style.display = "none";
        }
    }


    function updateBankTransferAmount() {
        const grandTotalElement =
            document.getElementById("new-order-grand-total");

        bankTransferAmount.textContent =
            grandTotalElement.textContent.trim();
    }


    function showBankTransferTestStatus(status) {
        bankTransferTestState = status;

        bankTransferPaymentStatus.style.display = "block";

        bankTransferStatusTitle.textContent =
            "Frontend test: " + status;

        bankTransferStatusDetails.textContent =
            "Reference: " + bankTransferReference.value.trim() +
            " | Sender: " + bankTransferPayer.value.trim();

        if (status === "Waiting") {
            bankTransferStatusIcon.innerHTML =
                '<i class="fas fa-clock"></i>';

            bankTransferStatusIcon.style.background = "#fff3d6";
            bankTransferStatusIcon.style.color = "#96610a";

            bankTransferStatusBadge.textContent = "Waiting";
            bankTransferStatusBadge.style.background = "#fff3d6";
            bankTransferStatusBadge.style.color = "#96610a";

            bankTransferStatusDescription.textContent =
                "Transfer details have been recorded for this frontend " +
                "demonstration. The bank has not been contacted and " +
                "the payment has not been verified.";

        } else if (status === "Success") {
            bankTransferStatusIcon.innerHTML =
                '<i class="fas fa-check-circle"></i>';

            bankTransferStatusIcon.style.background = "#e8f7ee";
            bankTransferStatusIcon.style.color = "#207344";

            bankTransferStatusBadge.textContent = "Test Success";
            bankTransferStatusBadge.style.background = "#e8f7ee";
            bankTransferStatusBadge.style.color = "#207344";

            bankTransferStatusDescription.textContent =
                "This is a simulated success screen only. No funds have " +
                "been verified, and this test does not mark the order as paid.";

        } else if (status === "Failed") {
            bankTransferStatusIcon.innerHTML =
                '<i class="fas fa-times-circle"></i>';

            bankTransferStatusIcon.style.background = "#fff0ef";
            bankTransferStatusIcon.style.color = "#b93832";

            bankTransferStatusBadge.textContent = "Test Failed";
            bankTransferStatusBadge.style.background = "#fff0ef";
            bankTransferStatusBadge.style.color = "#b93832";

            bankTransferStatusDescription.textContent =
                "This is a simulated failure screen. No bank transaction " +
                "was attempted. Check the transfer details before retrying.";
        }
    }


    bankTransferConfirm.addEventListener("click", function() {
        const reference = bankTransferReference.value.trim();
        const payer = bankTransferPayer.value.trim();

        bankTransferMessage.textContent = "";
        bankTransferPaymentStatus.style.display = "none";
        bankTransferDetailsConfirmed = false;
        bankTransferTestState = "";

        if (!reference) {
            bankTransferMessage.textContent =
                "Please enter the bank transfer reference number.";

            bankTransferReference.focus();
            return;
        }

        if (!payer) {
            bankTransferMessage.textContent =
                "Please enter the account holder or sender name.";

            bankTransferPayer.focus();
            return;
        }

        bankTransferDetailsConfirmed = true;

        bankTransferMessage.textContent =
            "Transfer details entered and confirmed for frontend testing.";

        showBankTransferTestStatus("Waiting");
    });


    bankTransferTestSuccess.addEventListener("click", function() {
        if (!bankTransferDetailsConfirmed) return;
        showBankTransferTestStatus("Success");
    });

    bankTransferTestFailure.addEventListener("click", function() {
        if (!bankTransferDetailsConfirmed) return;
        showBankTransferTestStatus("Failed");
    });

    bankTransferTestWaiting.addEventListener("click", function() {
        if (!bankTransferDetailsConfirmed) return;
        showBankTransferTestStatus("Waiting");
    });


    [bankTransferReference, bankTransferPayer].forEach(function(input) {
        input.addEventListener("input", function() {
            bankTransferDetailsConfirmed = false;
            bankTransferTestState = "";

            bankTransferMessage.textContent = "";
            bankTransferPaymentStatus.style.display = "none";
        });
    });


    paymentSelect.addEventListener(
        "change",
        syncBankTransferFields
    );

    syncBankTransferFields();

    

    const cardPaymentDetails =
        document.getElementById("card-payment-details");

    const cardPaymentAmount =
        document.getElementById("card-payment-amount");

    const cardPaymentOptions =
        document.querySelectorAll(".card-payment-option");

    let selectedCardType = "";

    const cardPaymentStatus =
        document.getElementById("card-payment-status");

    const cardPaymentStatusTitle =
        document.getElementById("card-payment-status-title");

    const cardPaymentStatusMessage =
        document.getElementById("card-payment-status-message");

    const cardPaymentStatusBadge =
        document.getElementById("card-payment-status-badge");

    const cardPaymentMessage =
        document.getElementById("card-payment-message");


    function updateCardPaymentAmount() {
        const grandTotalElement =
            document.getElementById("new-order-grand-total");

        if (grandTotalElement && cardPaymentAmount) {
            cardPaymentAmount.textContent =
                grandTotalElement.textContent.trim();
        }
    }


    function syncCardPaymentFields() {
        const isCardPayment =
            paymentSelect.value === "Card";

        cardPaymentDetails.style.display =
            isCardPayment ? "block" : "none";

        if (isCardPayment) {
            updateCardPaymentAmount();

            cardPaymentStatusTitle.textContent =
                "Awaiting payment";

            cardPaymentStatusMessage.textContent =
                "Process the payment using your secure card terminal " +
                "or approved provider. Payment has not been verified.";

            cardPaymentStatusBadge.textContent = "Pending";

            cardPaymentMessage.textContent = "";
        } else {
            selectedCardType = "";

            cardPaymentOptions.forEach(function(option) {
                option.classList.remove("selected");
                option.setAttribute("aria-pressed", "false");
            });
            cardPaymentMessage.textContent = "";
        }
    }


    cardPaymentOptions.forEach(function(option) {

        option.addEventListener("click", function() {

            selectedCardType = option.dataset.cardType;

            cardPaymentOptions.forEach(function(cardOption) {

                const isSelected = cardOption === option;

                cardOption.classList.toggle("selected", isSelected);

                cardOption.setAttribute(
                    "aria-pressed",
                    String(isSelected)
                );

            });

            cardPaymentMessage.textContent =
                selectedCardType +
                " selected. Process payment using your secure card terminal.";

        });

    });

    paymentSelect.addEventListener(
        "change",
        syncCardPaymentFields
    );


    syncCardPaymentFields();


    function addOrderProductRow() {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <select class="order-product" required>
                    <option value="">Select Product</option>

                    ${products.map(function(product) {
                        return `
                            <option value="${product.id}">
                                ${product.name}
                                (Stock: ${product.stock})
                            </option>
                        `;
                    }).join("")}
                </select>
            </td>

            <td>
                <input
                    type="number"
                    class="order-quantity"
                    value="1"
                    min="1"
                    step="1"
                    required
                >
            </td>

            <td>
                <span class="order-unit-price">
                    ${formatCurrency(0)}
                </span>
            </td>

            <td>
                <span class="order-item-total">
                    ${formatCurrency(0)}
                </span>
            </td>

            <td>
                <button
                    type="button"
                    class="remove-order-item"
                >
                    Remove
                </button>
            </td>
        `;

        orderItemsContainer.appendChild(row);

        updateOrderRow(row);
    }

    function updateOrderRow(row) {

        const productSelect =
            row.querySelector(".order-product");

        const quantityInput =
            row.querySelector(".order-quantity");

        const unitPriceDisplay =
            row.querySelector(".order-unit-price");

        const itemTotalDisplay =
            row.querySelector(".order-item-total");

        const product = products.find(function(item) {
            return String(item.id) === productSelect.value;
        });

        const quantity = Number(quantityInput.value);

        const price = product
            ? Number(product.price)
            : 0;

        const validQuantity =
            Number.isInteger(quantity) && quantity > 0;

        const itemTotal = validQuantity
            ? price * quantity
            : 0;

        unitPriceDisplay.textContent =
            formatCurrency(price);

        itemTotalDisplay.textContent =
            formatCurrency(itemTotal);

        updateOrderGrandTotal();
    }

    function updateOrderGrandTotal() {

        let grandTotal = 0;

        orderItemsContainer
            .querySelectorAll("tr")
            .forEach(function(row) {

                const productSelect =
                    row.querySelector(".order-product");

                const quantity =
                    Number(
                        row.querySelector(".order-quantity").value
                    );

                const product = products.find(function(item) {
                    return String(item.id) === productSelect.value;
                });

                if (
                    product &&
                    Number.isInteger(quantity) &&
                    quantity > 0
                ) {
                    grandTotal +=
                        Number(product.price) * quantity;
                }
            });

        document.getElementById(
            "new-order-grand-total"
        ).textContent = formatCurrency(grandTotal);
        updateBankTransferAmount();
        updateCardPaymentAmount();
    }

    addOrderProductRow();

    document.getElementById(
        "add-order-product"
    ).addEventListener("click", function() {

        addOrderProductRow();

    });

    orderItemsContainer.addEventListener(
        "change",
        function(event) {

            if (
                event.target.matches(".order-product") ||
                event.target.matches(".order-quantity")
            ) {
                updateOrderRow(event.target.closest("tr"));
            }

        }
    );

    orderItemsContainer.addEventListener(
        "input",
        function(event) {

            if (
                event.target.matches(".order-quantity")
            ) {
                updateOrderRow(event.target.closest("tr"));
            }

        }
    );

    orderItemsContainer.addEventListener(
        "click",
        function(event) {

            const removeButton =
                event.target.closest(".remove-order-item");

            if (!removeButton) {
                return;
            }

            const row = removeButton.closest("tr");

            if (orderItemsContainer.rows.length > 1) {

                row.remove();

            } else {

                row.querySelector(".order-product").value = "";
                row.querySelector(".order-quantity").value = 1;

            }

            updateOrderRow(
                orderItemsContainer.querySelector("tr")
            );

            updateOrderGrandTotal();
        }
    );

    document.getElementById(
        "cancel-new-order"
    ).addEventListener("click", function() {

        showPage("dashboard");

    });

    
    orderForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const message =
                document.getElementById("new-order-message");

            const createButton =
                document.getElementById("create-new-order");

            message.textContent = "";

            const customer =
                document.getElementById(
                    "new-order-customer"
                ).value.trim();

            const paymentMethod =
                document.getElementById(
                    "new-order-payment"
                ).value;

            const statusSelect =
                document.getElementById("new-order-status");

            const selectedStatus = statusSelect.value;

            const effectiveStatus =
                paymentMethod === "Mobile Money" ||
                paymentMethod === "Bank Transfer" ||
                paymentMethod === "Card"
                    ? "Pending"
                    : selectedStatus;
            if (!customer) {
                message.textContent =
                    "Please enter the customer name.";
                return;
            }

            if (!enabledPayments.includes(paymentMethod)) {
                message.textContent =
                    "Please select an enabled payment method.";
                return;
            }

            let mobileMoneyProviderValue = "";
            let mobileMoneyPhoneValue = "";

            if (paymentMethod === "Mobile Money") {

                mobileMoneyProviderValue =
                    mobileMoneyProvider.value;

                mobileMoneyPhoneValue =
                    mobileMoneyPhone.value
                        .trim()
                        .replace(/[\s-]/g, "");

                if (
                    mobileMoneyProviderValue !== "MTN" &&
                    mobileMoneyProviderValue !== "Airtel"
                ) {
                    message.textContent =
                        "Please select MTN or Airtel.";
                    return;
                }

                const validUgandanPhone =
                    /^(?:0\d{9}|\+256\d{9})$/.test(
                        mobileMoneyPhoneValue
                    );

                if (!validUgandanPhone) {
                    message.textContent =
                        "Enter a valid Ugandan phone number, e.g. 0771234567 or +256771234567.";
                    return;
                }
                if (!mobileMoneyPhoneConfirmed) {
                    message.textContent =
                        "Please press OK to confirm the Mobile Money phone number first.";
                    mobileMoneyPhone.focus();
                    return;
                }
            }

                        
            if (paymentMethod === "Bank Transfer") {
                if (!bankTransferDetailsConfirmed) {
                    message.textContent =
                        "Enter the bank transfer reference and sender name, " +
                        "then press Confirm Transfer Details.";

                    bankTransferReference.focus();
                    return;
                }
            }


            const rows = Array.from(
                orderItemsContainer.querySelectorAll("tr")
            );

            const itemsByProduct = new Map();

            for (const row of rows) {

                const productId =
                    row.querySelector(".order-product").value;

                const quantity =
                    Number(
                        row.querySelector(".order-quantity").value
                    );

                if (!productId) {
                    message.textContent =
                        "Please select a product for every row.";
                    return;
                }

                if (
                    !Number.isSafeInteger(quantity) ||
                    quantity < 1
                ) {
                    message.textContent =
                        "Each quantity must be a whole number greater than zero.";
                    return;
                }

                const product = products.find(function(item) {
                    return String(item.id) === productId;
                });

                if (!product) {
                    message.textContent =
                        "One of the selected products could not be found.";
                    return;
                }

                const numericProductId = Number(productId);

                if (
                    !Number.isSafeInteger(numericProductId) ||
                    numericProductId < 1
                ) {
                    message.textContent =
                        "The selected product has an invalid database ID.";
                    return;
                }

                const existing =
                    itemsByProduct.get(numericProductId);

                if (existing) {

                    existing.quantity += quantity;

                    if (!Number.isSafeInteger(existing.quantity)) {
                        message.textContent =
                            "The combined product quantity is too large.";
                        return;
                    }

                } else {

                    itemsByProduct.set(numericProductId, {
                        productId: numericProductId,
                        quantity: quantity
                    });
                }
            }

            
            const items = Array.from(itemsByProduct.values());

            if (items.length === 0) {
                message.textContent =
                    "Add at least one product to the order.";
                return;
            }

            for (const item of items) {

                const product = products.find(function(product) {
                    return Number(product.id) === item.productId;
                });

                if (!product) {
                    message.textContent =
                        "A selected product could not be found.";
                    return;
                }

                if (item.quantity > product.stock) {
                    message.textContent =
                        `Insufficient stock for ${product.name}. ` +
                        `Available: ${product.stock}, requested: ${item.quantity}.`;
                    return;
                }
            }



            createButton.disabled = true;
            createButton.textContent = "Saving Order...";

            try {

                const response = await fetch("/api/orders", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        customer: customer,
                        paymentMethod: paymentMethod,
                        status: effectiveStatus,
                        items: items,

                        mobileMoneyProvider:
                            paymentMethod === "Mobile Money"
                                ? mobileMoneyProviderValue
                                : null,

                        mobileMoneyPhone:
                            paymentMethod === "Mobile Money"
                                ? mobileMoneyPhoneValue
                                : null
                    })

                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Unable to create the order."
                    );
                }

                console.log(
                    "Order saved successfully:",
                    result.order
                );

                message.textContent =
                    "Order saved successfully!";

                showPage("orders");

            } catch (error) {

                console.error("Create order error:", error);

                message.textContent = error.message;

            } finally {

                createButton.disabled = false;
                createButton.textContent = "Create Order";
            }
        }
    );

}

document
    .getElementById("new-order-btn")
    .addEventListener("click", function() {
        showPage("new-order");
    });

        

    const topProfile = document.querySelector(".top-profile");
    const profileDropdown = document.getElementById("profile-dropdown");
    const profileLogoutButton = document.getElementById("profile-logout-button");
    const profileLogoutMessage = document.getElementById("profile-logout-message");


    topProfile.addEventListener("click", function(event) {

        if (event.target.closest("#edit-profile-picture")) {
            return;
        }

        const isOpening = profileDropdown.hidden;

        profileDropdown.hidden = !isOpening;

        profileLogoutMessage.textContent = "";
    });


    document.addEventListener("click", function(event) {

        if (!topProfile.contains(event.target)) {
            profileDropdown.hidden = true;
        }
    });


    document.addEventListener("keydown", function(event) {

        if (event.key === "Escape") {
            profileDropdown.hidden = true;
        }
    });


    profileLogoutButton.addEventListener("click", async function(event) {

        event.stopPropagation();

        profileLogoutButton.disabled = true;
        profileLogoutMessage.textContent = "Logging out...";

        try {

            const response = await fetch("/api/logout", {
                method: "POST",
                credentials: "same-origin"
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Unable to log out.");
            }

            window.location.replace("/");

        } catch (error) {

            profileLogoutMessage.textContent =
                error.message || "Logout failed. Please try again.";

            profileLogoutButton.disabled = false;
        }
    });


async function showPage(page) {

    if (page === "dashboard") {

        try {

            const results = await Promise.all([
                loadProductsFromDatabase(),
                loadOrdersFromDatabase()
            ]);

            if (!results[0] || !results[1]) {

                contentDisplay.innerHTML = `
                    <section class="dashboard-content">
                        <div class="welcome">
                            <h1>Dashboard</h1>
                            <p>
                                Unable to load dashboard data.
                                Please check your connection and try again.
                            </p>
                        </div>
                    </section>
                `;

                return;
            }

            console.log("===== DASHBOARD DATABASE CHECK =====");

            console.log("Products loaded:", products.length);
            console.log("Orders loaded:", orders.length);

            console.log(
                "Completed orders:",
                orders.filter(function(order) {
                    return order.status === "Completed";
                })
            );

            console.log(
                "First database order:",
                orders.length > 0 ? orders[0] : "No orders returned"
            );

            console.log("Today's sales:", getTodaySales());
            console.log("Weekly sales:", getWeeklySales());
            console.log("Monthly sales:", getMonthlySales());
            console.log("Gross profit:", getGrossProfit());

            console.log("====================================");

        contentDisplay.innerHTML = `
            <section class="dashboard-content">

                <div class="welcome">

                    <h1 id="dashboard-greeting">Good morning, Admin</h1>

                    <p>
                        Here's what's happening today.
                    </p>

                </div>


                <div class="stats-grid">

                    <div class="stat-card">
                        <span>Today's Sales</span>
                        <strong>
                            ${formatCurrency(getTodaySales())}
                        </strong>                
                    </div>
                    <div class="stat-card">
                        <span>Weekly Sales</span>
                        <strong>
                            ${formatCurrency(getWeeklySales())}
                        </strong>                
                    </div>
                    <div class="stat-card">
                        <span>Monthly Sales</span>
                        <strong>
                            ${formatCurrency(getMonthlySales())}
                        </strong>                
                    </div>
                    <div class="stat-card">
                        <span>Transactions</span>
                        <strong id="transactions-count">
                            ${orders.filter(function(order) {
                                return order.status === "Completed";
                            }).length}
                        </strong>
                    </div>

                    <div class="stat-card">
                        <span>Total Products</span>
                        <strong id="total-products-count">${products.length}</strong>
                    </div>

                    <div class="stat-card">
                        <span>Low Stock</span>
                        <strong id="low-stock-count">${products.filter(function(product) {
                            return product.stock > 0 &&
                                product.stock <= orderSettings.lowStockThreshold;
                        }).length}</strong>
                    </div>
                    <div class="stat-card">
                        <span>Gross Profit</span>
                        <strong>
                            ${formatCurrency(getGrossProfit())}
                        </strong>                
                    </div>
                </div>


                <div class="charts-grid">

                    <div class="chart-card sales-chart">

                        <div class="card-header">

                            <h3>Sales Trend</h3>

                            <span>Last 7 days</span>

                        </div>

                        <div class="dashboard-chart-container">
                            <canvas id="dashboard-sales-chart"></canvas>
                        </div>

                    </div>

                    <div class="chart-card payment-chart">

                        <div class="card-header">
                            <h3>Payment Methods</h3>
                            <span>This month</span>
                        </div>

                        <div class="payment-chart-container">
                            <canvas id="payment-methods-chart"></canvas>
                        </div>

                    </div>
                </div>


                <div class="products-card">

                    <div class="card-header">

                        <h3>Best-Selling Products</h3>

                        <a href="#">
                            View all
                        </a>

                    </div>


                    <table>

                        <thead>

                            <tr>
                                <th>Product</th>
                                <th>Sold</th>
                                <th>Revenue</th>
                            </tr>

                        </thead>


                        <tbody id="best-selling-products">

                        </tbody>

                    </table>

                </div>

            </section>
        `;
        updateDashboardGreeting();
        
        updateDashboardProductCount();
        updateDashboardTransactions();
        updateDashboardLowStock();

        const dashboardSalesChart =
            document.getElementById("dashboard-sales-chart");

        const dashboardSalesData =
            getLast7DaysSales();

        new Chart(dashboardSalesChart, {

            type: "line",

            data: {

                labels: dashboardSalesData.labels,

                datasets: [{

                    label: "Sales",

                    data: dashboardSalesData.values,

                    tension: 0.3,

                    borderWidth: 2,

                    fill: true

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    }

                },

                scales: {

                    y: {

                        beginAtZero: true

                    }

                }

            }

        });


        const paymentMethodsChart =
            document.getElementById("payment-methods-chart");

        const paymentMethodData =
            getPaymentMethodSales();

        new Chart(paymentMethodsChart, {

            type: "doughnut",

            data: {

                labels: [
                    "Cash",
                    "Mobile Money",
                    "Card",
                    "Bank Transfer"

                ],

                datasets: [{

                    data: [
                        paymentMethodData.cash,
                        paymentMethodData.mobileMoney,
                        paymentMethodData.card,
                        paymentMethodData.BankTransfer
                    ],

                    borderWidth: 0

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        position: "bottom"
                    }

                }

            }

        });
        
        const bestSellingTable =
            document.getElementById("best-selling-products");

        const bestSellingProducts =
            getBestSellingProducts();

        bestSellingProducts.slice(0, 5).forEach(function(item) {

            const row =
                document.createElement("tr");

            const revenue =
                item.revenue;
            row.innerHTML = `

                <td>
                    ${item.product.name}
                </td>

                <td>
                    ${item.quantitySold}
                </td>

                <td>
                    ${formatCurrency(revenue)}
                </td>

            `;

            bestSellingTable.appendChild(row);

        });
        
        } catch (error) {

            console.error("Dashboard loading error:", error);

            contentDisplay.innerHTML = `
                <section class="dashboard-content">
                    <div class="welcome">
                        <h1>Dashboard</h1>
                        <p>Unable to load dashboard data.</p>
                    </div>
                </section>
            `;

        }

    }

else if (page === "new-order") {
    renderNewOrderPage();
}


else if (page === "products") {

    let currentRole = "";

    try {
        const userResponse = await fetch("/api/me", {
            credentials: "same-origin"
        });

        if (!userResponse.ok) {
            throw new Error("Could not identify the logged-in user.");
        }

        const userData = await userResponse.json();

        const currentUser = userData.user || userData;

        currentRole = currentUser.role || "";

    } catch (error) {
        console.error("Could not load user role:", error);
    }

    const canManageProducts =
        ["Administrator", "Manager"].includes(currentRole);

    const productsLoaded = await loadProductsFromDatabase();

    if (!productsLoaded) {
        return;
    }

    contentDisplay.innerHTML = `
        <div class="dashboard-content">

            <div class="page-header">
                <div class="welcome">
                    <h1>Products</h1>
                    <p>Manage your products here.</p>
                </div>

                ${canManageProducts ? `
                    <button class="add-product-btn" id="add-product-btn">
                        + Add Product
                    </button>
                ` : ""}
            </div>

            <div class="product-controls">
                <div class="product-search">
                    <input
                        type="text"
                        placeholder="Search products..."
                        id="product-search"
                    >
                </div>

                <select id="category-filter">
                    <option value="all">All Categories</option>
                    <option value="clothing">Clothing</option>
                    <option value="shoes">Shoes</option>
                    <option value="accessories">Accessories</option>
                </select>
            </div>

            <div class="products-card">
                <div class="card-header">
                    <h3>All Products</h3>
                    <span id="product-count">3 Products</span>
                </div>

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Cost Price</th>
                                <th>Selling Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                ${canManageProducts ? "<th>Actions</th>" : ""}
                            </tr>
                        </thead>

                        <tbody id="products-table-body"></tbody>
                    </table>
                </div>
            </div>

            <div class="product-form-container" id="product-form-container">
                <div class="product-form">

                    <div class="form-header">
                        <h2>Add Product</h2>

                        <button
                            type="button"
                            id="close-product-form"
                            class="close-form-btn"
                        >×</button>
                    </div>

                    <form id="product-form">

                        <div class="form-group">
                            <label for="product-name">Product Name</label>
                            <input
                                type="text"
                                id="product-name"
                                placeholder="Enter product name"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label for="product-category">Category</label>

                                                    
                        <input
                            type="text"
                            id="product-category"
                            list="product-category-options"
                            placeholder="Select or type a category"
                            required
                            autocomplete="off"
                        >

                        <datalist id="product-category-options">
                            <option value="Clothing">
                            <option value="Shoes">
                            <option value="Accessories">
                        </datalist>

                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="product-price">Selling Price</label>
                                <input
                                    type="number"
                                    id="product-price"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label for="product-cost-price">Cost Price</label>
                                <input
                                    type="number"
                                    id="product-cost-price"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    required
                                >
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="product-stock">Stock</label>
                            <input
                                type="number"
                                id="product-stock"
                                placeholder="0"
                                min="0"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label for="product-image">Product Image</label>
                            <input
                                type="file"
                                id="product-image"
                                accept="image/*"
                            >
                        </div>

                        <div class="form-group">
                            <label for="product-description">Description</label>
                            <textarea
                                id="product-description"
                                placeholder="Enter product description"
                                rows="4"
                            ></textarea>
                        </div>

                        <div class="form-buttons">
                            <button
                                type="button"
                                id="cancel-product"
                                class="cancel-btn"
                            >Cancel</button>

                            <button
                                type="submit"
                                class="save-product-btn"
                            >Save Product</button>
                        </div>

                    </form>
                </div>
            </div>

        </div>
    `;


    const productsTableBody =
        document.getElementById("products-table-body");

    const addProductBtn =
        document.getElementById("add-product-btn");

    const productFormContainer =
        document.getElementById("product-form-container");

    const closeProductForm =
        document.getElementById("close-product-form");

    const cancelProduct =
        document.getElementById("cancel-product");

    const productForm =
        document.getElementById("product-form");

    const productSearch =
        document.getElementById("product-search");

    const categoryFilter =
        document.getElementById("category-filter");


    function getProductStatus(stock) {

        if (Number(stock) === 0) {
            return {
                status: "Out of Stock",
                statusClass: "out-stock"
            };
        }

        if (Number(stock) <= 10) {
            return {
                status: "Low Stock",
                statusClass: "low-stock"
            };
        }

        return {
            status: "In Stock",
            statusClass: "in-stock"
        };
    }


    function renderProductRow(product) {

        const row = document.createElement("tr");
        row.dataset.id = product.id;

        const productInfo = document.createElement("div");
        productInfo.className = "product-info";

        if (product.image) {
            const img = document.createElement("img");
            img.src = product.image;
            img.alt = product.name;
            productInfo.appendChild(img);
        }

        const nameSpan = document.createElement("span");
        nameSpan.textContent = product.name;
        productInfo.appendChild(nameSpan);

        const productCell = document.createElement("td");
        productCell.appendChild(productInfo);

        const categoryCell = document.createElement("td");
        categoryCell.textContent = product.category;

        const costCell = document.createElement("td");
        costCell.textContent =
            formatCurrency(product.costPrice);

        const priceCell = document.createElement("td");
        priceCell.textContent =
            formatCurrency(product.price);
        const stockCell = document.createElement("td");
        stockCell.textContent = product.stock;

        const statusCell = document.createElement("td");
        const productStatus = getProductStatus(product.stock);

        statusCell.innerHTML = `
            <span class="status ${productStatus.statusClass}">
                ${productStatus.status}
            </span>
        `;

        const actionsCell = document.createElement("td");

        if (canManageProducts) {
            actionsCell.innerHTML = `
                <button type="button" class="edit-btn">Edit</button>
                <button type="button" class="delete-btn">Delete</button>
            `;
        } else {
            actionsCell.textContent = "View only";
        }

        row.append(
            productCell,
            categoryCell,
            costCell,
            priceCell,
            stockCell,
            statusCell,
            actionsCell
        );

        productsTableBody.appendChild(row);
    }


    function updateProductCount() {

        const productCount =
            document.getElementById("product-count");

        const totalProducts = products.length;

        productCount.textContent =
            `${totalProducts} ${totalProducts === 1 ? "Product" : "Products"}`;

        if (typeof updateDashboardProductCount === "function") {
            updateDashboardProductCount();
        }
    }


    
    function resetProductForm() {
        productForm.reset();

        delete productForm.editingProductId;

        document.querySelector(".form-header h2").textContent =
            "Add Product";

        document.querySelector(".save-product-btn").textContent =
            "Save Product";
    }



    products.forEach(function (product) {
        renderProductRow(product);
    });

    updateProductCount();


    addProductBtn.addEventListener("click", function () {
        resetProductForm();
        productFormContainer.style.display = "flex";
    });


    closeProductForm.addEventListener("click", function () {
        productFormContainer.style.display = "none";
        resetProductForm();
    });


    cancelProduct.addEventListener("click", function () {
        productFormContainer.style.display = "none";
        resetProductForm();
    });


    
    productForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("product-name").value.trim();
        const category = document.getElementById("product-category").value;
        const price = Number(document.getElementById("product-price").value);
        const costPrice = Number(document.getElementById("product-cost-price").value);
        const stock = Number(document.getElementById("product-stock").value);
        
        const description = document.getElementById("product-description").value.trim();

        const imageInput = document.getElementById("product-image");
        const imageFile = imageInput.files[0];

        const editingProductId = productForm.editingProductId;

        const existingProduct = editingProductId !== undefined
            ? products.find(function (item) {
                return Number(item.id) === Number(editingProductId);
            })
            : null;

        if (editingProductId !== undefined && !existingProduct) {
            alert("Product could not be found.");
            return;
        }

        
        let imageData = existingProduct
            ? existingProduct.image || ""
            : "";

        if (imageFile) {
            if (imageFile.size > 1024 * 1024) {
                alert("Please select an image smaller than 1 MB.");
                return;
            }

            try {
                imageData = await new Promise(function (resolve, reject) {
                    const reader = new FileReader();

                    reader.onload = function () {
                        resolve(reader.result);
                    };

                    reader.onerror = function () {
                        reject(new Error("Could not read the selected image."));
                    };

                    reader.readAsDataURL(imageFile);
                });
            } catch (error) {
                alert("Could not read the selected image.");
                return;
            }
        }


        const productData = {
            name: name,
            category: category,
            price: price,
            costPrice: costPrice,
            stock: stock,
            image: imageData,
            description: description
        };

        try {
            let response;

            if (editingProductId !== undefined) {
                response = await fetch(
                    `/api/products/${editingProductId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        credentials: "same-origin",
                        body: JSON.stringify(productData)
                    }
                );
            } else {
                response = await fetch("/api/products", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "same-origin",
                    body: JSON.stringify(productData)
                });
            }

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || "The server could not save the product.");
            }

            const productsLoaded = await loadProductsFromDatabase();

            if (!productsLoaded) {
                alert("The product was saved, but the product list could not be refreshed. Reload the Products page.");
                return;
            }

            productsTableBody.innerHTML = "";

            products.forEach(function (product) {
                renderProductRow(product);
            });

            updateProductCount();
            filterProducts();

            productFormContainer.style.display = "none";
            resetProductForm();

            alert(
                editingProductId !== undefined
                    ? "Product updated successfully!"
                    : "Product added successfully!"
            );

        } catch (error) {
            console.error("Product save error:", error);
            alert("Could not save the product. Check the server and browser console for details.");
        }
    });



    
    productsTableBody.addEventListener("click", async function (event) {

        const button = event.target.closest("button");

        if (!button) {
            return;
        }

        const row = button.closest("tr");

        if (!row) {
            return;
        }

        const productId = Number(row.dataset.id);

     
        if (button.classList.contains("delete-btn")) {

            const product = products.find(function (item) {
                return Number(item.id) === productId;
            });

            if (!product) {
                return;
            }

            const confirmDelete = confirm(
                `Are you sure you want to delete "${product.name}"?`
            );

            if (!confirmDelete) {
                return;
            }

            try {

                const response = await fetch(
                    `/api/products/${productId}`,
                    {
                        method: "DELETE",
                        credentials: "same-origin"
                    }
                );

                if (!response.ok) {
                    const errorMessage = await response.text();

                    throw new Error(
                        errorMessage || "The server could not delete the product."
                    );
                }

                products = products.filter(function (item) {
                    return Number(item.id) !== productId;
                });

                row.remove();

                updateProductCount();
                filterProducts();

                alert("Product deleted successfully!");

            } catch (error) {

                console.error("Product deletion error:", error);

                alert(
                    "Could not delete the product from MySQL. " +
                    "Check the browser console and server."
                );
            }

            return;
        }

    
        if (button.classList.contains("edit-btn")) {

            const product = products.find(function (item) {
                return Number(item.id) === productId;
            });

            if (!product) {
                return;
            }

            document.getElementById("product-name").value =
                product.name;

            document.getElementById("product-category").value =
                product.category;

            document.getElementById("product-price").value =
                product.price;

            document.getElementById("product-cost-price").value =
                product.costPrice;

            document.getElementById("product-stock").value =
                product.stock;

            document.getElementById("product-description").value =
                product.description || "";

            productForm.editingProductId = productId;

            productFormContainer.style.display = "flex";

            document.querySelector(".form-header h2").textContent =
                "Edit Product";

            document.querySelector(".save-product-btn").textContent =
                "Update Product";
        }

    });



    function filterProducts() {

        const searchText =
            productSearch.value.toLowerCase().trim();

        const selectedCategory =
            categoryFilter.value.toLowerCase();

        const rows =
            productsTableBody.querySelectorAll("tr");

        rows.forEach(function (row) {

            const productName =
                row.cells[0]
                    .querySelector(".product-info span")
                    .textContent
                    .toLowerCase();

            const category =
                row.cells[1].textContent.toLowerCase();

            const matchesSearch =
                productName.includes(searchText);

            const matchesCategory =
                selectedCategory === "all" ||
                category === selectedCategory;

            row.style.display =
                matchesSearch && matchesCategory ? "" : "none";
        });
    }


    productSearch.addEventListener("input", function () {
        filterProducts();
    });


    categoryFilter.addEventListener("change", function () {
        filterProducts();
    });

} 



else if (page === "sales") {

    contentDisplay.innerHTML = `
        <div class="dashboard-content">

            <div class="welcome">
                <h1>Sales</h1>
                <p>View and analyze your sales performance.</p>
            </div>

            <div class="sales-summary">

                <div class="sales-card">
                    <span>Today's Sales</span>
                    <strong>${formatCurrency(getTodaySales())}</strong>
                </div>

                <div class="sales-card">
                    <span>Weekly Sales</span>
                    <strong>${formatCurrency(getWeeklySales())}</strong>

                </div>

                <div class="sales-card">
                    <span>Monthly Sales</span>
                    <strong>${formatCurrency(getMonthlySales())}</strong>
                </div>

                <div class="sales-card">
                    <span>Completed Orders</span>
                    <strong>
                        ${orders.filter(function(order) {
                            return order.status === "Completed";
                        }).length}
                    </strong>
                </div>

            </div>

            <div class="page-card">

                <h2>Sales Overview</h2>

                <div class="sales-chart-container">
                    <canvas id="sales-chart"></canvas>
                </div>

                <div class="sales-table-container">

                    <table class="sales-table">

                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>

                        <tbody id="sales-table-body"></tbody>

                    </table>

                </div>

            </div>

        </div>
    `;
    async function loadOrdersFromDatabase() {
    const response = await fetch("/api/orders", {
        method: "GET",
        credentials: "same-origin"
    });

    if (!response.ok) {
        throw new Error("Failed to load orders from the backend.");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        throw new Error("The server returned an invalid orders response.");
    }

    orders.splice(
        0,
        orders.length,
        ...data.map(function(order) {
            return {
                ...order,
                total: Number(order.total) || 0,
                date: new Date(order.date)
            };
        })
    );
}
    const salesTableBody =
        document.getElementById("sales-table-body");

    const completedOrders =
        orders.filter(function(order) {
            return order.status === "Completed";
        });

        const salesChart =
    document.getElementById("sales-chart");

const today = new Date();

const salesLabels = [];
const salesValues = [];

for (let i = 6; i >= 0; i--) {

    const date = new Date(today);

    date.setDate(today.getDate() - i);

    const label =
        date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        });

    salesLabels.push(label);

    let dailySales = 0;

    completedOrders.forEach(function(order) {

        const orderDate = new Date(order.date);

        if (
            orderDate.getDate() === date.getDate() &&
            orderDate.getMonth() === date.getMonth() &&
            orderDate.getFullYear() === date.getFullYear()
        ) {
            dailySales += Number(order.total);
        }

    });

    salesValues.push(dailySales);
}

new Chart(salesChart, {

    type: "line",

    data: {
        labels: salesLabels,

        datasets: [{
            label: "Sales",
            data: salesValues,
            tension: 0.3
        }]
    },

    options: {
        responsive: true,

        plugins: {
            legend: {
                display: true
            }
        },

        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return formatCurrency(value);
                    }
                }
            }
        },

        plugins: {
            legend: {
                display: true
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${
                            formatCurrency(context.parsed.y)
                        }`;
                    }
                }
            }
        }
    }

});

    completedOrders.forEach(function(order) {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${order.customer}</td>
            <td>${formatCurrency(order.total)}</td>
            <td>
                <span class="status">
                    ${order.status}
                </span>
            </td>
            <td>${order.date.toLocaleDateString()}</td>
        `;

        salesTableBody.appendChild(row);
    });
}



else if (page === "orders") {

    contentDisplay.innerHTML = `
        <div class="dashboard-content">
            <div class="page-header">
                <div class="welcome">
                    <h1>Orders</h1>
                    <p>Manage customer orders and print receipts.</p>
                </div>
            </div>

            <div class="products-card">
                <div class="card-header">
                    <div>
                        <h3>Customer Orders</h3>
                        <span>Orders retrieved from the database</span>
                    </div>
                </div>

                <p id="orders-load-message" role="status"></p>

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="database-orders-body"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- View Order Popup -->
        <div class="order-details-overlay" id="order-details-overlay" hidden>
            <div
                class="order-details-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="order-details-title"
            >
                <div class="order-details-header">
                    <div>
                        <span class="order-details-eyebrow">ORDER MANAGEMENT</span>
                        <h2 id="order-details-title">Order Details</h2>
                        <p id="order-details-subtitle">Review order information</p>
                    </div>

                    <button
                        type="button"
                        class="order-details-close"
                        id="close-order-details"
                        aria-label="Close order details"
                    >&times;</button>
                </div>

                <div class="order-details-content">
                    <div class="order-details-summary">
                        <div class="order-summary-item">
                            <span>Order Number</span>
                            <strong id="detail-order-id">—</strong>
                        </div>

                        <div class="order-summary-item">
                            <span>Customer</span>
                            <strong id="detail-order-customer">—</strong>
                        </div>

                        <div class="order-summary-item">
                            <span>Order Date</span>
                            <strong id="detail-order-date">—</strong>
                        </div>

                        <div class="order-summary-item">
                            <span>Payment Method</span>
                            <strong id="detail-order-payment">—</strong>
                        </div>

                        <div class="order-summary-item order-summary-total">
                            <span>Total Amount</span>
                            <strong id="detail-order-total">—</strong>
                        </div>

                        <div class="order-summary-item">
                            <span>Payment Status</span>
                            <strong id="detail-payment-status">—</strong>
                        </div>
                    </div>
                    <div class="order-details-section">
                        <h3>Items Ordered</h3>

                        <div class="order-items-table-wrapper">
                            <table class="order-items-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Qty</th>
                                        <th>Price</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody id="detail-order-items">
                                    <tr>
                                        <td colspan="4">Loading order items...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="order-status-panel">
                        <div>
                            <h3>Order Status</h3>
                            <p>Update the status and save it to the database.</p>
                        </div>

                        <label for="detail-order-status">Status</label>
                        <select id="detail-order-status" class="order-status-select">
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>

                        <p
                            id="order-status-feedback"
                            class="order-status-feedback"
                            role="status"
                            aria-live="polite"
                        ></p>
                    </div>
                </div>

                <div class="order-details-footer">
                    <button
                        type="button"
                        class="order-modal-cancel"
                        id="cancel-order-details"
                    >Close</button>

                    <button
                        type="button"
                        class="order-modal-save"
                        id="save-order-status"
                    >Save Status</button>
                </div>
            </div>
        </div>
    `;

    const tableBody =
        document.getElementById("database-orders-body");
    
    const loadMessage =
        document.getElementById("orders-load-message");

    function escapeOrderText(value) {
        return String(value ?? "").replace(
            /[&<>"']/g,
            character => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[character]
        );
    }

    async function loadDatabaseOrders() {
        loadMessage.textContent = "Loading orders...";

        try {
            const response = await fetch("/api/orders", {
                credentials: "same-origin"
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to load orders."
                );
            }

            tableBody.innerHTML = "";

            if (!Array.isArray(result) || result.length === 0) {
                loadMessage.textContent = "No orders found.";
                return;
            }

            loadMessage.textContent = "";

            result.forEach(order => {
                const date = new Date(order.date);

                const dateText = Number.isNaN(date.getTime())
                    ? ""
                    : date.toLocaleString();

                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>#${escapeOrderText(order.id)}</td>
                    <td>${escapeOrderText(order.customer)}</td>
                    <td>${formatCurrency(order.total)}</td>
                    <td>${escapeOrderText(
                        order.paymentMethod || "—"
                    )}</td>
                    <td class="database-order-status">
                        ${escapeOrderText(order.status)}
                    </td>
                    <td>${escapeOrderText(dateText)}</td>
                    <td>
                        <button
                            type="button"
                            class="view-database-order"
                            data-order-id="${escapeOrderText(order.id)}"
                        >
                            View
                        </button>

                        <button
                            type="button"
                            class="print-database-receipt"
                            data-order-id="${escapeOrderText(order.id)}"
                        >
                            Receipt
                        </button>
                    </td>
                `;

                tableBody.appendChild(row);
            });

        } catch (error) {
            console.error("Load orders error:", error);
            loadMessage.textContent = error.message;
        }
    }


    const orderDetailsOverlay =
        document.getElementById("order-details-overlay");

    const closeOrderDetailsButton =
        document.getElementById("close-order-details");

    const cancelOrderDetailsButton =
        document.getElementById("cancel-order-details");

    const detailOrderStatus =
        document.getElementById("detail-order-status");

    const saveOrderStatusButton =
        document.getElementById("save-order-status");

    const orderStatusFeedback =
        document.getElementById("order-status-feedback");

    let selectedDatabaseOrderId = null;
    let originalDatabaseOrderStatus = null;


    function closeOrderDetails() {
        orderDetailsOverlay.hidden = true;
        selectedDatabaseOrderId = null;
        originalDatabaseOrderStatus = null;
        orderStatusFeedback.textContent = "";
        orderStatusFeedback.style.color = "";
        saveOrderStatusButton.disabled = false;
        saveOrderStatusButton.textContent = "Save Status";
    }

    closeOrderDetailsButton.addEventListener(
        "click",
        closeOrderDetails
    );

    cancelOrderDetailsButton.addEventListener(
        "click",
        closeOrderDetails
    );

    orderDetailsOverlay.addEventListener("click", function (event) {
        if (event.target === orderDetailsOverlay) {
            closeOrderDetails();
        }
    });


    function displayDatabaseOrderDetails(order, payment) {
        selectedDatabaseOrderId = order.id;
        originalDatabaseOrderStatus = order.status;

        document.getElementById("detail-order-id").textContent =
            `#${order.id}`;

        document.getElementById("detail-order-customer").textContent =
            order.customer || "Walk-in Customer";

        const orderDate = new Date(order.date);

        document.getElementById("detail-order-date").textContent =
            Number.isNaN(orderDate.getTime())
                ? "Not available"
                : orderDate.toLocaleString();

        document.getElementById("detail-order-payment").textContent =
            order.paymentMethod || "Not recorded";

        const paymentStatusElement =
            document.getElementById("detail-payment-status");

        if (paymentStatusElement) {
            paymentStatusElement.textContent =
                order.paymentStatus || "Not available";
        }

        document.getElementById("detail-order-total").textContent =
            formatCurrency(Number(order.total) || 0);

        document.getElementById("order-details-subtitle").textContent =
            `Review order #${order.id} and manage its status`;

        detailOrderStatus.value = order.status || "Pending";

        const itemsBody =
            document.getElementById("detail-order-items");

        if (!Array.isArray(order.items) || order.items.length === 0) {
            itemsBody.innerHTML = `
                <tr>
                    <td colspan="4">No items were found for this order.</td>
                </tr>
            `;
        } else {
            itemsBody.innerHTML = order.items.map(item => {
                const quantity = Number(item.quantity) || 0;
                const price = Number(item.price) || 0;

                const subtotal = quantity * price;

                return `
                    <tr>
                        <td>${escapeOrderText(item.productName || "Product")}</td>
                        <td>${quantity}</td>
                        <td>${formatCurrency(price)}</td>
                        <td>${formatCurrency(subtotal)}</td>
                    </tr>
                `;
            }).join("");
        }

        orderStatusFeedback.textContent = "";
        orderStatusFeedback.style.color = "";
        saveOrderStatusButton.disabled = false;
        saveOrderStatusButton.textContent = "Save Status";

        orderDetailsOverlay.hidden = false;
    }


    tableBody.addEventListener("click", async function (event) {

        const receiptButton =
            event.target.closest(".print-database-receipt");

        if (receiptButton) {
            const orderId = receiptButton.dataset.orderId;

            printOrderReceipt(orderId);
            return;
        }

        const viewButton =
            event.target.closest(".view-database-order");

        if (viewButton) {
            const orderId = viewButton.dataset.orderId;

            viewButton.disabled = true;
            viewButton.textContent = "Loading...";

            try {
                const response = await fetch(
                    `/api/orders/${encodeURIComponent(orderId)}/receipt`,
                    {
                        credentials: "same-origin"
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Unable to load order details."
                    );
                }

                displayDatabaseOrderDetails(
                    result.order,
                    result.payment
                );

            } catch (error) {
                console.error("View order error:", error);
                alert(error.message || "Unable to load order details.");

            } finally {
                viewButton.disabled = false;
                viewButton.textContent = "View";
            }

            return;
        }
    });


    saveOrderStatusButton.addEventListener("click", async function () {

        if (!selectedDatabaseOrderId) {
            orderStatusFeedback.textContent =
                "Please select an order first.";
            orderStatusFeedback.style.color = "#b42318";
            return;
        }

        const newStatus = detailOrderStatus.value;

        if (
            !["Pending", "Processing", "Completed", "Cancelled"]
                .includes(newStatus)
        ) {
            orderStatusFeedback.textContent =
                "Please select a valid order status.";
            orderStatusFeedback.style.color = "#b42318";
            return;
        }

        if (newStatus === originalDatabaseOrderStatus) {
            orderStatusFeedback.textContent =
                "The order already has this status.";
            orderStatusFeedback.style.color = "#536663";
            return;
        }

        saveOrderStatusButton.disabled = true;
        saveOrderStatusButton.textContent = "Saving...";

        orderStatusFeedback.textContent =
            "Saving order status...";
        orderStatusFeedback.style.color = "#536663";

        try {
            const response = await fetch(
                `/api/orders/${encodeURIComponent(selectedDatabaseOrderId)}/status`,
                {
                    method: "PATCH",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to save order status."
                );
            }

            const matchingRow = Array.from(tableBody.querySelectorAll("tr"))
                .find(row => {
                    const rowId = row.querySelector(
                        ".print-database-receipt"
                    )?.dataset.orderId;

                    return String(rowId) ===
                        String(selectedDatabaseOrderId);
                });

            if (matchingRow) {
                const statusCell = matchingRow.querySelector(
                    ".database-order-status"
                );

                if (statusCell) {
                    statusCell.textContent = result.status || newStatus;
                }
            }

            originalDatabaseOrderStatus = result.status || newStatus;
            detailOrderStatus.value = originalDatabaseOrderStatus;

            orderStatusFeedback.textContent =
                result.message || "Order status saved successfully.";

            orderStatusFeedback.style.color = "#067647";

            if (typeof refreshDashboard === "function") {
                refreshDashboard();
            }

            if (typeof refreshProductStockDisplay === "function") {
                refreshProductStockDisplay();
            }

        } catch (error) {
            console.error("Save order status error:", error);

            orderStatusFeedback.textContent =
                error.message || "Unable to save order status.";

            orderStatusFeedback.style.color = "#b42318";

        } finally {
            saveOrderStatusButton.disabled = false;
            saveOrderStatusButton.textContent = "Save Status";
        }
    });

    loadDatabaseOrders();
}


        
    else if (page === "inventory") {

        contentDisplay.innerHTML = `
            <div class="dashboard-content">
                <div class="welcome">
                    <h1>Inventory</h1>
                    <p>Loading the latest inventory from the database...</p>
                </div>
            </div>
        `;

        (async function() {

            try {

                const response = await fetch("/api/products");

                if (!response.ok) {
                    throw new Error("Failed to load products from the database.");
                }

                const data = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error("The products response is not valid.");
                }

                products = data.map(function(product) {

                    return {
                        ...product,
                        price: Number(product.price) || 0,
                        costPrice: Number(product.costPrice) || 0,
                        stock: Number(product.stock) || 0
                    };

                });


                const totalProducts = products.length;

                const lowStockProducts =
                    products.filter(function(product) {
                        return product.stock > 0 &&
                            product.stock <= orderSettings.lowStockThreshold;
                    });

                const outOfStockProducts =
                    products.filter(function(product) {
                        return product.stock === 0;
                    });


                let inventoryValue = 0;

                products.forEach(function(product) {

                    inventoryValue +=
                        product.costPrice * product.stock;

                });


                contentDisplay.innerHTML = `

                    <div class="dashboard-content">

                        <div class="welcome">

                            <h1>Inventory</h1>

                            <p>
                                Monitor your stock levels and inventory status.
                            </p>

                        </div>


                        <div class="stats-grid">

                            <div class="stat-card">
                                <div class="stat-info">
                                    <h3>Total Products</h3>
                                    <p>${totalProducts}</p>
                                </div>
                            </div>


                            <div class="stat-card">
                                <div class="stat-info">
                                    <h3>Low Stock</h3>
                                    <p>${lowStockProducts.length}</p>
                                </div>
                            </div>


                            <div class="stat-card">
                                <div class="stat-info">
                                    <h3>Out of Stock</h3>
                                    <p>${outOfStockProducts.length}</p>
                                </div>
                            </div>


                            <div class="stat-card">
                                <div class="stat-info">
                                    <h3>Inventory Value</h3>
                                    <p>${formatCurrency(inventoryValue)}</p>
                                </div>
                            </div>

                        </div>


                        <div class="page-card">

                            <div class="page-card-header">
                                <h2>Current Stock</h2>
                            </div>


                            <div class="table-container">

                                <table>

                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Category</th>
                                            <th>Cost Price</th>
                                            <th>Selling Price</th>
                                            <th>Stock</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>


                                    <tbody>

                                        ${
                                            products.length === 0

                                            ? `
                                                <tr>
                                                    <td colspan="6">
                                                        No products found in the database.
                                                    </td>
                                                </tr>
                                            `

                                            : products.map(function(product) {

                                                let status;
                                                let statusClass;

                                                if (product.stock === 0) {

                                                    status = "Out of Stock";
                                                    statusClass = "out-stock";

                                                } else if (
                                                    product.stock <=
                                                    orderSettings.lowStockThreshold
                                                ) {

                                                    status = "Low Stock";
                                                    statusClass = "low-stock";

                                                } else {

                                                    status = "In Stock";
                                                    statusClass = "in-stock";

                                                }

                                                return `

                                                    <tr>

                                                        <td>
                                                            <div class="product-info">

                                                                <img
                                                                    src="${product.image || ""}"
                                                                    alt="${product.name}"
                                                                >

                                                                <span>
                                                                    ${product.name}
                                                                </span>

                                                            </div>
                                                        </td>


                                                        <td>
                                                            ${product.category || ""}
                                                        </td>


                                                        <td>
                                                            ${formatCurrency(product.costPrice)}
                                                        </td>


                                                       <td>
                                                            ${formatCurrency(product.price)}
                                                       </td>


                                                        <td>
                                                            ${product.stock}
                                                        </td>


                                                        <td>
                                                            <span class="status ${statusClass}">
                                                                ${status}
                                                            </span>
                                                        </td>

                                                    </tr>

                                                `;

                                            }).join("")
                                        }

                                    </tbody>

                                </table>

                            </div>

                        </div>

                    </div>

                `;

            } catch (error) {

                console.error("Inventory loading error:", error);

                contentDisplay.innerHTML = `
                    <div class="dashboard-content">

                        <div class="welcome">
                            <h1>Inventory</h1>

                            <p>
                                Unable to load inventory from the database.
                                Please check your server connection and try again.
                            </p>
                        </div>

                    </div>
                `;

            }

        })();

    }


        else if (page === "reports") {

        contentDisplay.innerHTML = `

            <div class="dashboard-content">

                <div class="page-header">

                    <div class="welcome">
                        <h1>Reports</h1>

                        <p>
                            Analyze your sales, profit and business performance.
                        </p>
                    </div>

                    <div class="report-actions">

                        <select id="report-period">

                            <option value="today">
                                Today
                            </option>

                            <option value="7days" selected>
                                Last 7 Days
                            </option>

                            <option value="30days">
                                Last 30 Days
                            </option>

                            <option value="month">
                                This Month
                            </option>

                            <option value="all">
                                All Time
                            </option>

                        </select>

                        <button
                            class="report-btn"
                            id="print-report"
                        >
                            Print Report
                        </button>

                    </div>

                </div>

                <div class="stats-grid report-stats">

                    <div class="stat-card">

                        <span>
                            Total Revenue
                        </span>

                        <strong id="report-revenue">
                            ${formatCurrency(0)}
                        </strong>

                    </div>


                    <div class="stat-card">

                        <span>
                            Gross Profit
                        </span>

                        <strong id="report-profit">
                            $0.00
                        </strong>

                    </div>


                    <div class="stat-card">

                        <span>
                            Completed Orders
                        </span>

                        <strong id="report-orders">
                            0
                        </strong>

                    </div>


                    <div class="stat-card">

                        <span>
                            Items Sold
                        </span>

                        <strong id="report-items">
                            0
                        </strong>

                    </div>

                </div>


                <div class="chart-card report-chart-card">

                    <div class="card-header">

                        <div>
                            <h3>Sales Overview</h3>

                            <span>
                                Revenue generated during the selected period
                            </span>
                        </div>
                        <strong id="report-chart-revenue">
                            $0.00
                        </strong>

                    </div>


                    <div class="sales-chart-container">

                        <canvas id="report-sales-chart"></canvas>

                    </div>

                </div>


                <div class="reports-grid">


                    <div class="products-card">

                        <div class="card-header">

                            <div>
                                <h3>Top-Selling Products</h3>

                                <span>
                                    Products generating the most sales
                                </span>
                            </div>

                        </div>


                        <div class="table-container">

                            <table>

                                <thead>

                                    <tr>
                                        <th>Product</th>
                                        <th>Units Sold</th>
                                        <th>Revenue</th>
                                    </tr>

                                </thead>


                                <tbody id="report-products-table">

                                </tbody>

                            </table>

                        </div>

                    </div>

                    <div class="products-card">

                        <div class="card-header">

                            <div>
                                <h3>Payment Methods</h3>

                                <span>
                                    Revenue by payment method
                                </span>
                            </div>

                        </div>


                        <div class="report-payment-container">

                            <canvas id="report-payment-chart"></canvas>

                        </div>

                    </div>

                </div>


                <div class="products-card report-details-card">

                    <div class="card-header">

                        <div>

                            <h3>Sales Details</h3>

                            <span>
                                Completed transactions in the selected period
                            </span>

                        </div>

                        <span id="report-order-count">
                            0 Orders
                        </span>

                    </div>


                    <div class="table-container">

                        <table>

                            <thead>

                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Payment</th>
                                    <th>Amount</th>
                                    <th>Profit</th>
                                    <th>Date</th>
                                </tr>

                            </thead>


                            <tbody id="report-sales-table">

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        `;


        function getReportOrders(period) {

            const now = new Date();

            const startDate = new Date(now);

            startDate.setHours(0, 0, 0, 0);


            if (period === "today") {

            }

            else if (period === "7days") {

                startDate.setDate(
                    now.getDate() - 6
                );

            }

            else if (period === "30days") {

                startDate.setDate(
                    now.getDate() - 29
                );

            }

            else if (period === "month") {

                startDate.setDate(1);

            }

            else if (period === "all") {

                return orders.filter(function(order) {

                    return order.status === "Completed";

                });

            }


            return orders.filter(function(order) {

                if (order.status !== "Completed") {
                    return false;
                }

                const orderDate =
                    new Date(order.date);

                return orderDate >= startDate &&
                    orderDate <= now;

            });

        }


        function updateReport() {

            const now = new Date();

            const period =
                document.getElementById("report-period").value;


            const reportOrders =
                getReportOrders(period);


            let revenue = 0;

            reportOrders.forEach(function(order) {

                revenue += Number(order.total);

            });


            document.getElementById("report-revenue")
                .textContent = formatCurrency(revenue);

            const reportChartRevenue =
                document.getElementById("report-chart-revenue");

            if (reportChartRevenue) {

                reportChartRevenue.textContent =
                    formatCurrency(revenue);

            }

            let profit = 0;


            reportOrders.forEach(function(order) {

                order.items.forEach(function(item) {

                    const sellingPrice =
                        Number(item.price);

                    const costPrice =
                        Number(item.costPrice);

                    const quantity =
                        Number(item.quantity);


                    profit +=
                        (sellingPrice - costPrice) *
                        quantity;

                });

            });


            document.getElementById("report-profit")
                .textContent = formatCurrency(profit);


            document.getElementById("report-orders")
                .textContent =
                reportOrders.length;


            let itemsSold = 0;


            reportOrders.forEach(function(order) {

                order.items.forEach(function(item) {

                    itemsSold +=
                        Number(item.quantity);

                });

            });


            document.getElementById("report-items")
                .textContent =
                itemsSold;


            document.getElementById("report-order-count")
                .textContent =
                reportOrders.length +
                (
                    reportOrders.length === 1
                    ? " Order"
                    : " Orders"
                );

            const salesTable =
                document.getElementById(
                    "report-sales-table"
                );


            salesTable.innerHTML = "";


            reportOrders.forEach(function(order) {

                let orderProfit = 0;


                order.items.forEach(function(item) {

                    orderProfit +=
                        (
                            Number(item.price) -
                            Number(item.costPrice)
                        ) *
                        Number(item.quantity);

                });


                const row =
                    document.createElement("tr");


                row.innerHTML = `

                    <td>
                        #${order.id}
                    </td>

                    <td>
                        ${order.customer}
                    </td>

                    <td>
                        ${order.paymentMethod}
                    </td>

                    <td>
                        ${formatCurrency(Number(order.total))}
                    </td>

                    <td>
                        ${formatCurrency(orderProfit)}
                    </td>

                    <td>
                        ${new Date(order.date).toLocaleDateString()}
                    </td>

                `;


                salesTable.appendChild(row);

            });

            const productSales = {};


            reportOrders.forEach(function(order) {

                order.items.forEach(function(item) {

                    if (!productSales[item.productId]) {

                        productSales[item.productId] = {

                            quantitySold: 0,

                            revenue: 0

                        };

                    }


                    productSales[item.productId].quantitySold +=
                        Number(item.quantity);


                    productSales[item.productId].revenue +=
                        Number(item.price) *
                        Number(item.quantity);

                });

            });


            const reportProducts =
                products.map(function(product) {

                    return {

                        product: product,

                        quantitySold:
                            productSales[product.id]
                            ? productSales[product.id].quantitySold
                            : 0,

                        revenue:
                            productSales[product.id]
                            ? productSales[product.id].revenue
                            : 0

                    };

                });


            reportProducts.sort(function(a, b) {

                if (
                    b.quantitySold !==
                    a.quantitySold
                ) {

                    return b.quantitySold -
                        a.quantitySold;

                }

                return b.revenue -
                    a.revenue;

            });


            const productTable =
                document.getElementById(
                    "report-products-table"
                );


            productTable.innerHTML = "";


            reportProducts
                .slice(0, 5)
                .forEach(function(item) {

                    const row =
                        document.createElement("tr");


                    row.innerHTML = `

                        <td>
                            ${item.product.name}
                        </td>

                        <td>
                            ${item.quantitySold}
                        </td>

                        <td>
                            ${formatCurrency(item.revenue)}
                        </td>

                    `;


                    productTable.appendChild(row);

                });

            const salesCanvas =
                document.getElementById(
                    "report-sales-chart"
                );
            
            const labels = [];
            const values = [];

            let numberOfDays;
            let chartStart;

            if (period === "today") {
                numberOfDays = 1;

                chartStart = new Date(now);
                chartStart.setHours(0, 0, 0, 0);
            }
            else if (period === "7days") {
                numberOfDays = 7;

                chartStart = new Date(now);
                chartStart.setDate(
                    now.getDate() - 6
                );
                chartStart.setHours(0, 0, 0, 0);
            }
            else if (period === "30days") {
                numberOfDays = 30;

                chartStart = new Date(now);
                chartStart.setDate(
                    now.getDate() - 29
                );
                chartStart.setHours(0, 0, 0, 0);
            }
            else if (period === "month") {
                numberOfDays =
                    new Date(
                        now.getFullYear(),
                        now.getMonth() + 1,
                        0
                    ).getDate();

                chartStart =
                    new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        1
                    );
            }
            else if (period === "all") {

                if (reportOrders.length > 0) {

                    const earliestOrder =
                        new Date(
                            Math.min(
                                ...reportOrders.map(function(order) {
                                    return new Date(order.date).getTime();
                                })
                            )
                        );

                    earliestOrder.setHours(0, 0, 0, 0);

                    chartStart = earliestOrder;

                    numberOfDays =
                        Math.floor(
                            (now - chartStart) /
                            (1000 * 60 * 60 * 24)
                        ) + 1;

                }
                else {
                    chartStart = new Date(now);
                    chartStart.setHours(0, 0, 0, 0);

                    numberOfDays = 1;
                }
            }


            for (
                let i = 0;
                i < numberOfDays;
                i++
            ) {

                const date =
                    new Date(chartStart);

                date.setDate(
                    chartStart.getDate() + i
                );


                labels.push(
                    date.toLocaleDateString(
                        "en-US",
                        {
                            month: "short",
                            day: "numeric"
                        }
                    )
                );


                let dailySales = 0;


                reportOrders.forEach(function(order) {

                    const orderDate =
                        new Date(order.date);


                    if (
                        orderDate.getDate() ===
                            date.getDate() &&

                        orderDate.getMonth() ===
                            date.getMonth() &&

                        orderDate.getFullYear() ===
                            date.getFullYear()
                    ) {

                        dailySales +=
                            Number(order.total);

                    }

                });


                values.push(dailySales);

            }



            if (window.reportSalesChart) {

                window.reportSalesChart.destroy();

            }


            window.reportSalesChart =
                new Chart(
                    salesCanvas,
                    {

                        type: "line",

                        data: {

                            labels: labels,

                            datasets: [{

                                label: "Revenue",

                                data: values,

                                tension: 0.3,

                                borderWidth: 2,

                                fill: true

                            }]

                        },

                        options: {

                            responsive: true,

                            maintainAspectRatio: false,

                            plugins: {

                                legend: {
                                    display: false
                                },

                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return `${context.dataset.label}: ${
                                                formatCurrency(context.parsed.y)
                                            }`;
                                        }
                                    }
                                }

                            },

                            scales: {

                                x: {

                                    ticks: {

                                        maxTicksLimit:
                                            period === "today"
                                            ? 1
                                            : period === "7days"
                                            ? 7
                                            : period === "30days"
                                            ? 10
                                            : period === "month"
                                            ? 10
                                            : 12

                                    }

                                },

                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        callback: function(value) {
                                            return formatCurrency(value);
                                        }
                                    }
                                }
                            }

                        }

                    }
                );


            let cash = 0;
            let mobileMoney = 0;
            let card = 0;
            let BankTransfer = 0;


            reportOrders.forEach(function(order) {

                if (order.paymentMethod === "Cash") {

                    cash += Number(order.total);

                }

                else if (
                    order.paymentMethod === "Mobile Money"
                ) {

                    mobileMoney += Number(order.total);

                }

                else if (
                    order.paymentMethod === "Card"
                ) {

                    card += Number(order.total);

                }

                else if (
                    order.paymentMethod ==="Bank Transfer"
                ){

                    BankTransfer += Number(order.total);

                }

            });


            const paymentCanvas =
                document.getElementById(
                    "report-payment-chart"
                );


            if (window.reportPaymentChart) {

                window.reportPaymentChart.destroy();

            }


            const paymentLabels = [];
            const paymentValues = [];

            if (cash > 0) {

                paymentLabels.push(
                    `Cash - ${formatCurrency(cash)}`
                );

                paymentValues.push(cash);

            }

            if (mobileMoney > 0) {

                paymentLabels.push(
                    `Mobile Money - ${formatCurrency(mobileMoney)}`
                );

                paymentValues.push(mobileMoney);

            }

            if (card > 0) {

                paymentLabels.push(
                    `Card - ${formatCurrency(card)}`
                );
                paymentValues.push(card);

            }
            if (BankTransfer > 0){

                paymentLabels.push(
                    `Bank Transfer - ${formatCurrency(BankTransfer)}`
                );

                paymentValues.push(BankTransfer);

            }


            if (window.reportPaymentChart) {

                window.reportPaymentChart.destroy();

                window.reportPaymentChart = null;

            }


            if (paymentValues.length > 0) {

                window.reportPaymentChart =
                    new Chart(
                        paymentCanvas,
                        {

                            type: "doughnut",

                            data: {

                                labels: paymentLabels,

                                datasets: [{

                                    data: paymentValues,

                                    borderWidth: 0

                                }]

                            },

                            options: {

                                responsive: true,

                                maintainAspectRatio: false,

                                plugins: {

                                    legend: {
                                        position: "bottom"
                                    }

                                }

                            }

                        }
                    );

            }
            else {

                paymentCanvas.style.display = "none";

                const noPaymentMessage =
                    document.createElement("div");

                noPaymentMessage.id =
                    "no-payment-data";

                noPaymentMessage.textContent =
                    "No payment data available";

                noPaymentMessage.style.textAlign =
                    "center";

                noPaymentMessage.style.padding =
                    "100px 20px";

                noPaymentMessage.style.color =
                    "#888";

                paymentCanvas.parentElement
                    .appendChild(noPaymentMessage);

            }
        }

        
        async function initializeReportsPage() {

            const periodSelect =
                document.getElementById("report-period");

            const printButton =
                document.getElementById("print-report");

            try {

                const ordersLoaded =
                    await loadOrdersFromDatabase();

                if (!ordersLoaded) {
                    throw new Error(
                        "Could not load orders from the database."
                    );
                }

                const productsLoaded =
                    await loadProductsFromDatabase();

                if (!productsLoaded) {
                    throw new Error(
                        "Could not load products from the database."
                    );
                }

                periodSelect.addEventListener(
                    "change",
                    updateReport
                );

                printButton.addEventListener(
                    "click",
                    function() {
                        window.print();
                    }
                );

                updateReport();

            } catch (error) {

                console.error(
                    "Reports database connection error:",
                    error
                );

                document.getElementById(
                    "report-revenue"
                ).textContent = "Unavailable";

                document.getElementById(
                    "report-profit"
                ).textContent = "Unavailable";

                document.getElementById(
                    "report-products-table"
                ).innerHTML = `
                    <tr>
                        <td colspan="3">
                            Could not load report data.
                            Please check the server connection.
                        </td>
                    </tr>
                `;

            }

        }

        initializeReportsPage();


    }

        
        else if (page === "settings") {

            contentDisplay.innerHTML = `

                <div class="dashboard-content">


      
                    <div class="welcome">

                        <h1>Settings</h1>

                        <p>
                            Manage your dashboard settings.
                        </p>

                    </div>
                    <div class="settings-card page-card">

                        <div class="card-header">

                            <div>

                                <h3>Store Settings</h3>

                                <span>
                                    Update your store information
                                </span>

                            </div>

                        </div>


                        <form id="store-settings-form">

                            <div class="settings-form-grid">

                                <div class="form-group">

                                    <label for="store-name">
                                        Store Name
                                    </label>

                                    <input
                                        type="text"
                                        id="store-name"
                                        placeholder="Enter store name"
                                    >

                                </div>
                                <div class="form-group">

                                    <label for="store-email">
                                        Store Email
                                    </label>

                                    <input
                                        type="email"
                                        id="store-email"
                                        placeholder="Enter store email"
                                    >

                                </div>
                                <div class="form-group">

                                    <label for="store-phone">
                                        Phone Number
                                    </label>

                                    <input
                                        type="tel"
                                        id="store-phone"
                                        placeholder="Enter phone number"
                                    >

                                </div>
                                <div class="form-group">

                                    <label for="store-currency">
                                        Currency
                                    </label>

                                    <select id="store-currency">

                                        <option value="USD">
                                            USD - US Dollar
                                        </option>

                                        <option value="UGX">
                                            UGX - Ugandan Shilling
                                        </option>

                                        <option value="EUR">
                                            EUR - Euro
                                        </option>

                                        <option value="GBP">
                                            GBP - British Pound
                                        </option>

                                    </select>

                                </div>
                                <div class="form-group full-width">

                                    <label for="store-address">
                                        Store Address
                                    </label>

                                    <textarea
                                        id="store-address"
                                        rows="3"
                                        placeholder="Enter store address"
                                    ></textarea>

                                </div>

                            </div>

                            <div class="settings-actions">

                                <button
                                    type="submit"
                                    class="save-settings-btn"
                                >
                                    Save Changes
                                </button>

                            </div>

                            <p id="settings-save-message"></p>

                        </form>

                    </div>

                    <div class="settings-card page-card">

                        <div class="card-header">

                            <div>

                                <h3>Order Settings</h3>

                                <span>
                                    Control how orders are processed
                                </span>

                            </div>

                        </div>



                        <div class="settings-options">


                            <div class="setting-row">

                                <div class="setting-info">

                                    <h4>
                                        Default Order Status
                                    </h4>

                                    <p>
                                        Choose the status assigned
                                        to new orders.
                                    </p>

                                </div>


                                <select id="default-order-status">

                                    <option value="Pending">
                                        Pending
                                    </option>

                                    <option value="Processing">
                                        Processing
                                    </option>

                                    <option value="Completed">
                                        Completed
                                    </option>

                                </select>

                            </div>

                            <div class="setting-row">

                                <div class="setting-info">

                                    <h4>
                                        Low Stock Threshold
                                    </h4>

                                    <p>
                                        Products at or below this
                                        number will be considered
                                        low stock.
                                    </p>

                                </div>


                                <input
                                    type="number"
                                    id="low-stock-threshold"
                                    value="5"
                                    min="0"
                                >

                            </div>

                            <div class="setting-row">

                                <div class="setting-info">

                                    <h4>
                                        Automatic Stock Adjustment
                                    </h4>

                                    <p>
                                        Automatically reduce product
                                        stock when an order is completed.
                                    </p>

                                </div>


                                <label class="toggle-switch">

                                    <input
                                        type="checkbox"
                                        id="automatic-stock-adjustment"
                                        checked
                                    >

                                    <span class="toggle-slider"></span>

                                </label>

                            </div>


                        </div>

                        <div class="settings-actions">

                            <button
                                type="button"
                                class="save-settings-btn"
                                id="save-order-settings"
                            >
                                Save Order Settings
                            </button>

                        </div>

                        <p id="order-settings-message"></p>

                    </div>


                    <div class="settings-card page-card">

                        <div class="card-header">

                            <div>

                                <h3>Payment Settings</h3>

                                <span>
                                    Manage payment methods available for orders
                                </span>

                            </div>

                        </div>



                        <div class="settings-options">

                            <div class="setting-row">

                                <div class="setting-info">

                                    <h4>
                                        Cash
                                    </h4>

                                    <p>
                                        Allow customers to pay using cash.
                                    </p>

                                </div>


                                <label class="toggle-switch">

                                    <input
                                        type="checkbox"
                                        id="payment-cash"
                                        checked
                                    >

                                    <span class="toggle-slider"></span>

                                </label>

                            </div>

                            <div class="setting-row">

                                <div class="setting-info">

                                    <h4>
                                        Mobile Money
                                    </h4>

                                    <p>
                                        Allow customers to pay using mobile money.
                                    </p>

                                </div>


                                <label class="toggle-switch">

                                    <input
                                        type="checkbox"
                                        id="payment-mobile-money"
                                        checked
                                    >

                                    <span class="toggle-slider"></span>

                                </label>

                            </div>

                            <div class="setting-row">

                                <div class="setting-info">

                                    <h4>
                                        Card
                                    </h4>

                                    <p>
                                        Allow customers to pay using a debit
                                        or credit card.
                                    </p>

                                </div>


                                <label class="toggle-switch">

                                    <input
                                        type="checkbox"
                                        id="payment-card"
                                        checked
                                    >

                                    <span class="toggle-slider"></span>

                                </label>

                            </div>
                            <div class="setting-row">

                                <div class="setting-info">

                                    <h4>
                                        Bank Transfer
                                    </h4>

                                    <p>
                                        Allow customers to pay via BankTransfer
                                    </p>

                                </div>


                                <label class="toggle-switch">

                                    <input
                                        type="checkbox"
                                        id="payment-bank-transfer"
                                        checked
                                    >

                                    <span class="toggle-slider"></span>

                                </label>

                            </div>
                            <div class="setting-row">

                                <div class="setting-info">

                                    <h4>
                                        Default Payment Method
                                    </h4>

                                    <p>
                                        Choose the payment method selected
                                        by default for new orders.
                                    </p>

                                </div>


                                <select id="default-payment-method">

                                    <option value="Cash">
                                        Cash
                                    </option>

                                    <option value="Mobile Money">
                                        Mobile Money
                                    </option>

                                    <option value="Card">
                                        Card
                                    </option>
                                    <option value = "BankTransfer">
                                        Bank Transfer
                                    </option>

                                </select>

                            </div>


                        </div>
                        <div class="settings-actions">

                            <button
                                type="button"
                                class="save-settings-btn"
                                id="save-payment-settings"
                            >
                                Save Payment Settings
                            </button>

                        </div>

                        <p id="payment-settings-message"></p>

                    </div>


                </div>

            `;

            
            try {
                const response = await fetch("/api/settings", {
                    method: "GET",
                    credentials: "same-origin"
                });

                if (!response.ok) {
                    throw new Error("Unable to load settings.");
                }

                const savedSettings = await response.json();

                if (savedSettings.storeSettings) {
                    storeSettings = {
                        ...storeSettings,
                        ...savedSettings.storeSettings
                    };
                }

                if (savedSettings.orderSettings) {
                    orderSettings = {
                        ...orderSettings,
                        ...savedSettings.orderSettings
                    };
                }

                if (savedSettings.paymentSettings) {
                    paymentSettings = {
                        ...paymentSettings,
                        ...savedSettings.paymentSettings
                    };
                }

                console.log("Settings loaded from MySQL:", savedSettings);

            } catch (error) {
                console.error("Could not load settings from MySQL:", error);
            }


            document
                .getElementById("store-settings-form")
                .addEventListener(
                    "submit",
                    async function(event) {

                        event.preventDefault();

                        const storeName =
                            document.getElementById(
                                "store-name"
                            ).value.trim();


                        const storeEmail =
                            document.getElementById(
                                "store-email"
                            ).value.trim();


                        const storePhone =
                            document.getElementById(
                                "store-phone"
                            ).value.trim();


                        const storeCurrency =
                            document.getElementById(
                                "store-currency"
                            ).value;


                        const storeAddress =
                            document.getElementById(
                                "store-address"
                            ).value.trim();

                        storeSettings = {

                            name: storeName,

                            email: storeEmail,

                            phone: storePhone,

                            currency: storeCurrency,

                            address: storeAddress

                        };

                        localStorage.setItem(
                            "storeSettings",
                            JSON.stringify(
                                storeSettings
                            )
                        );

                        
                        const message = document.getElementById(
                            "settings-save-message"
                        );

                        try {
                            const response = await fetch("/api/settings", {
                                method: "PUT",
                                credentials: "same-origin",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    settingKey: "storeSettings",
                                    settingValue: storeSettings
                                })
                            });

                            const result = await response.json();

                            if (!response.ok) {
                                throw new Error(
                                    result.message || "Could not save store settings."
                                );
                            }

                            localStorage.setItem(
                                "storeSettings",
                                JSON.stringify(storeSettings)
                            );

                            message.textContent =
                                "Store settings saved to the database successfully.";

                        } catch (error) {
                            console.error("Store settings save error:", error);

                            message.textContent =
                                "Failed to save store settings. Check the server and try again.";
                        }

                        setTimeout(function() {
                            message.textContent = "";
                        }, 4000);

                    }
                );

                document.getElementById("store-name").value =
                    storeSettings.name;


                document.getElementById("store-email").value =
                    storeSettings.email;


                document.getElementById("store-phone").value =
                    storeSettings.phone;


                document.getElementById("store-currency").value =
                    storeSettings.currency;


                document.getElementById("store-address").value =
                    storeSettings.address;

            
                document
                    .getElementById("save-order-settings")
                    .addEventListener(
                        "click",
                        async function() {

                            const status = document.getElementById(
                                "default-order-status"
                            ).value;

                            const threshold = Number(
                                document.getElementById(
                                    "low-stock-threshold"
                                ).value
                            );

                            const automaticStock = document.getElementById(
                                "automatic-stock-adjustment"
                            ).checked;

                            orderSettings = {
                                defaultStatus: status,
                                lowStockThreshold: threshold,
                                automaticStockAdjustment: automaticStock
                            };

                            const message = document.getElementById(
                                "order-settings-message"
                            );

                            try {
                                const response = await fetch("/api/settings", {
                                    method: "PUT",
                                    credentials: "same-origin",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        settingKey: "orderSettings",
                                        settingValue: orderSettings
                                    })
                                });

                                const result = await response.json();

                                if (!response.ok) {
                                    throw new Error(
                                        result.message ||
                                        "Could not save order settings."
                                    );
                                }

                                localStorage.setItem(
                                    "orderSettings",
                                    JSON.stringify(orderSettings)
                                );

                                message.textContent =
                                    "Order settings saved to the database successfully.";

                            } catch (error) {
                                console.error(
                                    "Order settings save error:",
                                    error
                                );

                                message.textContent =
                                    "Failed to save order settings. Check the server and try again.";
                            }

                            setTimeout(function() {
                                message.textContent = "";
                            }, 4000);

                        }
                    );

                    

                document.getElementById(
                    "default-order-status"
                ).value =
                    orderSettings.defaultStatus;


                document.getElementById(
                    "low-stock-threshold"
                ).value =
                    orderSettings.lowStockThreshold;


                document.getElementById(
                    "automatic-stock-adjustment"
                ).checked =
                    orderSettings.automaticStockAdjustment;

            
                document
                    .getElementById("save-payment-settings")
                    .addEventListener(
                        "click",
                        async function() {

                            const cashEnabled = document.getElementById(
                                "payment-cash"
                            ).checked;

                            const mobileMoneyEnabled = document.getElementById(
                                "payment-mobile-money"
                            ).checked;

                            const cardEnabled = document.getElementById(
                                "payment-card"
                            ).checked;

                            const bankTransferEnabled = document.getElementById(
                                "payment-bank-transfer"
                            ).checked;

                            const defaultPayment = document.getElementById(
                                "default-payment-method"
                            ).value;

                            paymentSettings = {
                                cash: cashEnabled,
                                mobileMoney: mobileMoneyEnabled,
                                card: cardEnabled,
                                BankTransfer: bankTransferEnabled,
                                defaultPayment: defaultPayment
                            };

                            const message = document.getElementById(
                                "payment-settings-message"
                            );

                            try {
                                const response = await fetch("/api/settings", {
                                    method: "PUT",
                                    credentials: "same-origin",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        settingKey: "paymentSettings",
                                        settingValue: paymentSettings
                                    })
                                });

                                const result = await response.json();

                                if (!response.ok) {
                                    throw new Error(
                                        result.message ||
                                        "Could not save payment settings."
                                    );
                                }

                                localStorage.setItem(
                                    "paymentSettings",
                                    JSON.stringify(paymentSettings)
                                );

                                message.textContent =
                                    "Payment settings saved to the database successfully.";

                            } catch (error) {
                                console.error(
                                    "Payment settings save error:",
                                    error
                                );

                                message.textContent =
                                    "Failed to save payment settings. Check the server and try again.";
                            }

                            setTimeout(function() {
                                message.textContent = "";
                            }, 4000);

                        }
                    );

                
                document.getElementById("payment-cash").checked =
                    paymentSettings.cash;


                document.getElementById("payment-mobile-money").checked =
                    paymentSettings.mobileMoney;


                document.getElementById("payment-card").checked =
                    paymentSettings.card;

                document.getElementById("payment-bank-transfer").checked = 
                    paymentSettings.BankTransfer;

                document.getElementById("default-payment-method").value =
                    paymentSettings.defaultPayment;

                    }


        
        
        
else if (page === "user-management") {

    async function initializeUserManagement() {

        try {

            const umCurrentUserResponse = await fetch("/api/me", {
                credentials: "same-origin"
            });

            if (!umCurrentUserResponse.ok) {
                throw new Error(
                    "Your session has expired. Please log in again."
                );
            }

            const umCurrentUserData =
                await umCurrentUserResponse.json();

            const umCurrentUser =
                umCurrentUserData.user || umCurrentUserData;

            if (
                !umCurrentUser ||
                !["Administrator", "Manager"].includes(
                    umCurrentUser.role
                )
            ) {
                contentDisplay.innerHTML = `
                    <section class="um-panel">
                        <h2>Access Denied</h2>
                        <p>
                            You do not have permission to view User Management.
                        </p>
                    </section>
                `;
                return;
            }

            const umCanManageUsers =
                umCurrentUser.role === "Administrator";

                  
                contentDisplay.innerHTML = `
                    <div class="users-management-page">

                        <header class="um-header">
                            <div>
                                <h1>User Management</h1>
                                <p>Manage system accounts and user permissions.</p>
                            </div>
                            <span class="um-admin-badge">Administrator</span>
                        </header>

                        <section class="um-stats">
                            <article class="um-stat-card">
                                <p>Total Users</p>
                                <h2 id="um-total-users">0</h2>
                            </article>

                            <article class="um-stat-card">
                                <p>Active Users</p>
                                <h2 id="um-active-users">0</h2>
                            </article>

                            <article class="um-stat-card">
                                <p>Administrators</p>
                                <h2 id="um-admin-users">0</h2>
                            </article>
                        </section>

                        <section class="um-panel">
                            <div class="um-toolbar">
                                <div>
                                    <h2>System Users</h2>
                                    <p>View and manage registered accounts.</p>
                                </div>

                                ${umCanManageUsers ? `
                                    <button type="button" id="um-add-user-btn">
                                        + Add User
                                    </button>
                                ` : ""}
                            </div>

                            <input
                                type="search"
                                id="um-user-search"
                                placeholder="Search by name, email or role..."
                                aria-label="Search users"
                            >

                            <div class="um-table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            ${umCanManageUsers ? "<th>Action</th>" : ""}
                                        </tr>
                                    </thead>
                                    <tbody id="um-users-table"></tbody>
                                </table>
                            </div>
                        </section>

                        <section id="um-form-panel" class="um-panel" hidden>
                            <h2>Add New User</h2>

                            <form id="um-user-form">
                                <label for="um-full-name">Full Name</label>
                                <input id="um-full-name" type="text" required>

                                <label for="um-email">Email Address</label>
                                <input id="um-email" type="email" required>

                                <label for="um-password">Password</label>
                                <input
                                    id="um-password"
                                    type="password"
                                    minlength="8"
                                    autocomplete="new-password"
                                    placeholder="Enter password"
                                >

                                
                                <div id="um-password-strength" class="um-password-strength" aria-live="polite">
                                    <div class="um-password-strength-track">
                                        <div id="um-password-strength-bar" class="um-password-strength-bar"></div>
                                    </div>
                                    <p id="um-password-strength-label">Password strength: Not entered</p>
                                    <ul id="um-password-requirements">
                                        <li data-requirement="length">At least 8 characters</li>
                                        <li data-requirement="uppercase">One uppercase letter (A-Z)</li>
                                        <li data-requirement="lowercase">One lowercase letter (a-z)</li>
                                        <li data-requirement="number">One number (0-9)</li>
                                        <li data-requirement="special">One special character</li>
                                    </ul>
                                </div>


                                <p class="um-password-hint">
                                    Required for new users. Leave blank when editing
                                    to keep the current password.
                                </p>

                                <label for="um-role">Role</label>
                                <select id="um-role" required>
                                    <option value="">Select role</option>
                                    <option value="Administrator">Administrator</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Cashier">Cashier</option>
                                </select>

                                <div class="um-form-actions">
                                    <button type="submit">Create User</button>
                                    <button type="button" id="um-cancel-btn">
                                        Cancel
                                    </button>
                                </div>

                                <p id="um-message" role="status"></p>
                            </form>
                        </section>

                    </div>
                `;


                let umUsers = [];

                const umTable = document.getElementById("um-users-table");
                const umSearch = document.getElementById("um-user-search");
                const umFormPanel = document.getElementById("um-form-panel");
                const umForm = document.getElementById("um-user-form");
                const umMessage = document.getElementById("um-message");
                const umPassword = document.getElementById("um-password");
                                
                const umPasswordStrengthBar = document.getElementById(
                    "um-password-strength-bar"
                );

                const umPasswordStrengthLabel = document.getElementById(
                    "um-password-strength-label"
                );

                const umPasswordRequirements = document.getElementById(
                    "um-password-requirements"
                );

                function umUpdatePasswordStrength() {
                    const password = umPassword.value;

                    const checks = {
                        length: password.length >= 8,
                        uppercase: /[A-Z]/.test(password),
                        lowercase: /[a-z]/.test(password),
                        number: /[0-9]/.test(password),
                        special: /[^A-Za-z0-9]/.test(password)
                    };

                    Object.entries(checks).forEach(([name, passed]) => {
                        const item = umPasswordRequirements.querySelector(
                            `[data-requirement="${name}"]`
                        );

                        if (item) {
                            item.classList.toggle("um-requirement-met", passed);
                            item.classList.toggle("um-requirement-unmet", !passed);
                        }
                    });

                    const score = Object.values(checks).filter(Boolean).length;

                    const strength = !password
                        ? { label: "Password strength: Not entered", width: "0%" }
                        : score <= 2
                            ? { label: "Password strength: Weak", width: "25%" }
                            : score === 3
                                ? { label: "Password strength: Fair", width: "50%" }
                                : score === 4
                                    ? { label: "Password strength: Good", width: "75%" }
                                    : { label: "Password strength: Strong", width: "100%" };

                    umPasswordStrengthBar.style.width = strength.width;
                    umPasswordStrengthLabel.textContent = strength.label;

                    umPasswordStrengthBar.classList.remove(
                        "um-strength-weak",
                        "um-strength-fair",
                        "um-strength-good",
                        "um-strength-strong"
                    );

                    if (password && score > 0) {
                        const strengthClass = [
                            "",
                            "um-strength-weak",
                            "um-strength-weak",
                            "um-strength-fair",
                            "um-strength-good",
                            "um-strength-strong"
                        ][score];

                        umPasswordStrengthBar.classList.add(strengthClass);
                    }
                }

                umPassword.addEventListener("input", umUpdatePasswordStrength);

                const umName = document.getElementById("um-full-name");
                const umEmail = document.getElementById("um-email");
                const umRole = document.getElementById("um-role");
                const umSubmitButton = umForm.querySelector('[type="submit"]');

                async function umApiRequest(url, options = {}) {

                    const response = await fetch(url, {
                        ...options,
                        credentials: "same-origin",
                        headers: {
                            ...(options.body ? {
                                "Content-Type": "application/json"
                            } : {}),
                            ...options.headers
                        }
                    });

                    let result = {};

                    try {
                        result = await response.json();
                    } catch (error) {
                    }

                    if (!response.ok) {
                        throw new Error(
                            result.message || "The request could not be completed."
                        );
                    }

                    return result;
                }


                function umShowMessage(message, isError = false) {

                    umMessage.textContent = message;

                    umMessage.style.color = isError ? "#c62828" : "#087443";
                }


                function umCloseForm() {

                    umForm.reset();
                    umUpdatePasswordStrength();

                    delete umForm.dataset.editingUserId;

                    umPassword.required = true;

                    umFormPanel.hidden = true;

                    umFormPanel.querySelector("h2").textContent =
                        "Add New User";

                    umSubmitButton.textContent = "Create User";

                    umShowMessage("");
                }


                function umUpdateStats() {

                    document.getElementById("um-total-users").textContent =
                        umUsers.length;

                    document.getElementById("um-active-users").textContent =
                        umUsers.filter(user => user.status === "Active").length;

                    document.getElementById("um-admin-users").textContent =
                        umUsers.filter(
                            user => user.role === "Administrator"
                        ).length;
                }


                function renderUsers() {

                    umTable.innerHTML = "";

                    const query = umSearch.value.trim().toLowerCase();

                    const filteredUsers = umUsers.filter(user => {

                        const searchableText = [
                            user.fullName,
                            user.email,
                            user.role,
                            user.status
                        ].join(" ").toLowerCase();

                        return searchableText.includes(query);
                    });

                    if (filteredUsers.length === 0) {

                        const row = document.createElement("tr");
                        const cell = document.createElement("td");

                        cell.colSpan = 5;
                        cell.textContent = query
                            ? "No matching users found."
                            : "No users found in the database.";

                        row.appendChild(cell);
                        umTable.appendChild(row);
                    }

                    filteredUsers.forEach(user => {

                        const row = document.createElement("tr");

                        const nameCell = row.insertCell();
                        nameCell.textContent = user.fullName || "";

                        const emailCell = row.insertCell();
                        emailCell.textContent = user.email || "";

                        const roleCell = row.insertCell();
                        roleCell.textContent = user.role || "";

                        const statusCell = row.insertCell();
                        const statusBadge = document.createElement("span");

                        statusBadge.className =
                            user.status === "Active"
                                ? "um-status um-active-status"
                                : "um-status um-inactive-status";

                        statusBadge.textContent = user.status || "Unknown";
                        statusCell.appendChild(statusBadge);

                        if (umCanManageUsers) {
                            const actionCell = row.insertCell();

                            const toggleButton = document.createElement("button");

                            toggleButton.type = "button";
                            toggleButton.className = "um-toggle-status";
                            toggleButton.dataset.userId = String(user.id);

                            toggleButton.textContent =
                                user.status === "Active" ? "Deactivate" : "Activate";

                            if (
                                user.role === "Administrator" &&
                                user.status === "Active"
                            ) {
                                toggleButton.disabled = true;
                                toggleButton.title =
                                    "Administrator accounts cannot be deactivated.";
                            }

                            actionCell.appendChild(toggleButton);

                            const editButton = document.createElement("button");

                            editButton.type = "button";
                            editButton.className = "um-edit-user";
                            editButton.dataset.userId = String(user.id);
                            editButton.textContent = "Edit";

                            actionCell.appendChild(editButton);

                            umTable.appendChild(row);
                        }
                    });

                    umUpdateStats();
                }


                async function umLoadUsers() {

                    umTable.innerHTML = "";

                    const loadingRow = document.createElement("tr");
                    const loadingCell = document.createElement("td");

                    loadingCell.colSpan = 5;
                    loadingCell.textContent = "Loading users from the database...";

                    loadingRow.appendChild(loadingCell);
                    umTable.appendChild(loadingRow);

                    try {

                        const users = await umApiRequest("/api/users");

                        if (!Array.isArray(users)) {
                            throw new Error("The server returned an invalid user list.");
                        }

                        umUsers = users;
                        renderUsers();

                    } catch (error) {

                        console.error("Could not load users:", error);

                        umUsers = [];
                        umUpdateStats();

                        umTable.innerHTML = "";

                        const row = document.createElement("tr");
                        const cell = document.createElement("td");

                        cell.colSpan = umCanManageUsers ? 5 : 4;
                        cell.textContent = error.message;

                        row.appendChild(cell);
                        umTable.appendChild(row);
                    }
                }


                if (umCanManageUsers) {

                    document.getElementById("um-add-user-btn")
                        .addEventListener("click", () => {

                            umForm.reset();

                            delete umForm.dataset.editingUserId;

                            umPassword.required = true;

                            umFormPanel.hidden = false;

                            umFormPanel.querySelector("h2").textContent =
                                "Add New User";

                            umSubmitButton.textContent = "Create User";

                            umShowMessage("");

                            umFormPanel.scrollIntoView({
                                behavior: "smooth",
                                block: "start"
                            });
                        });

                }


                document.getElementById("um-cancel-btn")
                    .addEventListener("click", umCloseForm);


                umSearch.addEventListener("input", renderUsers);


                umForm.addEventListener("submit", async event => {

                    event.preventDefault();

                    const fullName = umName.value.trim();
                    const email = umEmail.value.trim();
                    const role = umRole.value;
                    const password = umPassword.value;
                    const editingId = umForm.dataset.editingUserId;

                    if (!fullName || !email || !role) {
                        umShowMessage(
                            "Please complete all the required fields.",
                            true
                        );
                        return;
                    }

                    if (!editingId && !password) {
                        umShowMessage(
                            "Please enter a password for the new user.",
                            true
                        );
                        umPassword.focus();
                        return;
                    }

                    
                    if (password) {
                        const passwordRequirements = [
                            {
                                test: password.length >= 8,
                                message: "at least 8 characters"
                            },
                            {
                                test: /[A-Z]/.test(password),
                                message: "at least one uppercase letter (A-Z)"
                            },
                            {
                                test: /[a-z]/.test(password),
                                message: "at least one lowercase letter (a-z)"
                            },
                            {
                                test: /[0-9]/.test(password),
                                message: "at least one number (0-9)"
                            },
                            {
                                test: /[^A-Za-z0-9]/.test(password),
                                message: "at least one special character (e.g. @, #, !)"
                            }
                        ];

                        const failedRequirements = passwordRequirements
                            .filter(requirement => !requirement.test)
                            .map(requirement => requirement.message);

                        if (failedRequirements.length > 0) {
                            umShowMessage(
                                "Password requirements not met: " +
                                failedRequirements.join(", ") +
                                ".",
                                true
                            );

                            umPassword.focus();
                            return;
                        }
                    }


                    const payload = {
                        fullName: fullName,
                        email: email,
                        role: role,
                        password: password
                    };

                    const originalButtonText = umSubmitButton.textContent;

                    umSubmitButton.disabled = true;
                    umSubmitButton.textContent = "Saving...";

                    try {

                        if (editingId) {

                            await umApiRequest(
                                "/api/users/" + encodeURIComponent(editingId),
                                {
                                    method: "PUT",
                                    body: JSON.stringify(payload)
                                }
                            );

                        } else {

                            await umApiRequest("/api/users", {
                                method: "POST",
                                body: JSON.stringify(payload)
                            });
                        }

                        await umLoadUsers();

                        umCloseForm();

                    } catch (error) {

                        console.error("Could not save user:", error);

                        umShowMessage(error.message, true);

                    } finally {

                        umSubmitButton.disabled = false;
                        umSubmitButton.textContent = originalButtonText;
                    }
                });


                umTable.addEventListener("click", async event => {

                    const button = event.target.closest(
                        ".um-toggle-status, .um-edit-user"
                    );

                    if (!button || button.disabled) {
                        return;
                    }

                    const userId = button.dataset.userId;

                    const user = umUsers.find(
                        item => String(item.id) === String(userId)
                    );

                    if (!user) {
                        alert("The user could not be found. Please reload the page.");
                        return;
                    }


                    if (button.classList.contains("um-edit-user")) {

                        umForm.reset();

                        umFormPanel.hidden = false;

                        umFormPanel.querySelector("h2").textContent = "Edit User";

                        umSubmitButton.textContent = "Save Changes";

                        umName.value = user.fullName || "";
                        umEmail.value = user.email || "";
                        umRole.value = user.role || "";

                        umPassword.value = "";
                        umPassword.required = false;

                        umForm.dataset.editingUserId = String(user.id);

                        umShowMessage("");

                        umFormPanel.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                        return;
                    }


                    const newStatus =
                        user.status === "Active" ? "Inactive" : "Active";

                    if (
                        user.role === "Administrator" &&
                        newStatus === "Inactive"
                    ) {
                        alert("Administrator accounts cannot be deactivated.");
                        return;
                    }

                    const actionText =
                        newStatus === "Inactive" ? "deactivate" : "activate";

                    if (!confirm(
                        `Are you sure you want to ${actionText} ${user.fullName}?`
                    )) {
                        return;
                    }

                    button.disabled = true;

                    try {

                        await umApiRequest(
                            "/api/users/" +
                                encodeURIComponent(String(user.id)) +
                                "/status",
                            {
                                method: "PATCH",
                                body: JSON.stringify({
                                    status: newStatus
                                })
                            }
                        );

                        await umLoadUsers();

                    } catch (error) {

                        console.error("Could not change user status:", error);

                        alert(error.message);

                    } finally {

                        button.disabled = false;
                    }
                });


                umLoadUsers();

                
                } catch (error) {

                    console.error(
                        "Could not verify Administrator access:",
                        error
                    );

                    contentDisplay.innerHTML = `
                        <section class="um-panel">
                            <h2>Unable to verify access</h2>
                            <p>
                                ${error.message}
                            </p>
                        </section>
                    `;
                }
            }

            initializeUserManagement();
        


        }
        else if (page === "help") {

            contentDisplay.innerHTML = `
                <div class="help-support-page">

                    <header class="hs-header">
                        <h1>Help &amp; Support</h1>
                        <p>Find answers and learn how to use your POS system.</p>
                    </header>

                    <section class="hs-banner">
                        <h2>How can we help you?</h2>
                        <p>Search common questions or browse the guides below.</p>

                        <input
                            type="search"
                            id="hs-help-search"
                            placeholder="Search for help..."
                            aria-label="Search frequently asked questions"
                        >
                    </section>

                    <section class="hs-section">
                        <h2>Frequently Asked Questions</h2>

                        <details class="hs-help-item">
                            <summary>How do I log in?</summary>
                            <p>Open the login page and enter your registered
                            credentials. Contact your administrator if you cannot
                            access your account.</p>
                        </details>

                        <details class="hs-help-item">
                            <summary>How do I add a new product?</summary>
                            <p>Open Products, select Add Product, enter the product
                            details, and save. Your account must have permission.</p>
                        </details>

                        <details class="hs-help-item">
                            <summary>How do I process a sale?</summary>
                            <p>Open New Order, add products, confirm quantities,
                            select a payment method, and complete the order.</p>
                        </details>

                        <details class="hs-help-item">
                            <summary>What should I do when stock is low?</summary>
                            <p>Open Inventory, check the low-stock products, and
                            notify the responsible manager.</p>
                        </details>

                        <details class="hs-help-item">
                            <summary>What if I forget my password?</summary>
                            <p>Use the Forgot Password link on the login page.
                            If password recovery is not connected, contact your
                            administrator.</p>
                        </details>

                        <details class="hs-help-item">
                            <summary>Why can't I access a page?</summary>
                            <p>Your account may not have permission to access the
                            page. Contact your administrator to review your access.</p>
                        </details>

                        <p id="hs-no-results" hidden>
                            No matching questions found.
                        </p>
                    </section>

                    
                    <section class="hs-section hs-contact-section">
                        <h2>Contact Support</h2>
                        <p>Need assistance with your Vendrex POS system? Get in touch with us.</p>

                        <div class="hs-contact-grid">

                            <div class="hs-contact-card">
                                <div class="hs-contact-icon">📞</div>
                                <h3>Call Us</h3>
                                <p>Speak directly with our support team.</p>
                                <a id="hs-store-phone" href="tel:">
                                    Loading phone number...
                                </a>
                            </div>

                            <div class="hs-contact-card">
                                <div class="hs-contact-icon">✉️</div>
                                <h3>Email Us</h3>
                                <p>Send us your questions or report a problem.</p>
                                <a id="hs-store-email" href="mailto:">
                                    Loading email address...
                                </a>
                            </div>

                            <div class="hs-contact-card">
                                <div class="hs-contact-icon">🕒</div>
                                <h3>Support Hours</h3>
                                <p>Monday – Saturday</p>
                                <strong>8:00 AM – 6:00 PM</strong>
                                <span>Sunday: Closed</span>
                            </div>

                        </div>
                    </section>


                </div>
            `;
            
            
            fetch("/api/settings", {
                method: "GET",
                credentials: "same-origin"
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Unable to load store settings.");
                    }

                    return response.json();
                })
                .then(settings => {
                    const store = settings.storeSettings || {};

                    const phoneLink =
                        document.getElementById("hs-store-phone");

                    const emailLink =
                        document.getElementById("hs-store-email");

                    if (phoneLink) {
                        const phone = String(store.phone || "").trim();

                        phoneLink.textContent =
                            phone || "Phone number not set";

                        phoneLink.href = phone
                            ? "tel:" + phone.replace(/[^\d+]/g, "")
                            : "#";
                    }

                    if (emailLink) {
                        const email = String(store.email || "").trim();

                        emailLink.textContent =
                            email || "Email address not set";

                        emailLink.href = email
                            ? "mailto:" + email
                            : "#";
                    }
                })
                .catch(error => {
                    console.error(
                        "Error loading Help contact details:",
                        error
                    );

                    const phoneLink =
                        document.getElementById("hs-store-phone");

                    const emailLink =
                        document.getElementById("hs-store-email");

                    if (phoneLink) {
                        phoneLink.textContent =
                            "Could not load phone number";
                    }

                    if (emailLink) {
                        emailLink.textContent =
                            "Could not load email address";
                    }
                });


            const hsSearch = document.getElementById("hs-help-search");
            const hsQuestions =
                document.querySelectorAll(".hs-help-item");
            const hsNoResults = document.getElementById("hs-no-results");

            hsSearch.addEventListener("input", () => {
                const query = hsSearch.value.trim().toLowerCase();
                let visibleCount = 0;

                hsQuestions.forEach(question => {
                    const matches = question.textContent
                        .toLowerCase()
                        .includes(query);

                    question.hidden = !matches;

                    if (matches) {
                        visibleCount++;
                    }
                });

                hsNoResults.hidden = visibleCount > 0;
            });

            document.getElementById("hs-support-form")
                .addEventListener("submit", event => {
                    event.preventDefault();

                    document.getElementById("hs-support-feedback")
                        .textContent =
                            "Your form is valid, but support requests are not yet connected to a server.";
                });
        }

        
}


function escapeReceiptHtml(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]
    );
}

function receiptMoney(amount, currency) {
    const safeCurrency =
        /^[A-Z]{3}$/.test(currency || "")
            ? currency
            : "USD";

    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: safeCurrency
        }).format(Number(amount) || 0);
    } catch {
        return (Number(amount) || 0).toFixed(2);
    }
}

async function printOrderReceipt(orderId) {
    const printWindow = window.open(
        "",
        "_blank",
        "width=480,height=760"
    );

    if (!printWindow) {
        alert(
            "The receipt window was blocked. Allow pop-ups for this POS site and try again."
        );
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Receipt</title>
        </head>
        <body style="font-family:Arial,sans-serif;padding:20px">
            Loading receipt...
        </body>
        </html>
    `);
    printWindow.document.close();

    try {
        const response = await fetch(
            `/api/orders/${encodeURIComponent(orderId)}/receipt`,
            {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to load receipt."
            );
        }

        const { order, store, payment, printedBy, printedAt } =
            result;

        const currency = store.currency || "USD";

        const safe = escapeReceiptHtml;

        const businessName =
            safe(store.name || "Business Name");

        const businessAddress =
            safe(store.address || "");

        const businessPhone =
            safe(store.phone || "");

        const businessEmail =
            safe(store.email || "");

        const orderDate = new Date(order.date);

        const dateText = Number.isNaN(orderDate.getTime())
            ? safe(order.date)
            : safe(orderDate.toLocaleString());

        const printDate = new Date(printedAt);

        const printedAtText =
            Number.isNaN(printDate.getTime())
                ? safe(printedAt)
                : safe(printDate.toLocaleString());

        const itemRows = (order.items || []).map(item => `
            <tr>
                <td class="product">
                    ${safe(item.productName)}
                </td>
                <td class="qty">
                    ${Number(item.quantity)}
                </td>
                <td class="money">
                    ${receiptMoney(item.price, currency)}
                </td>
                <td class="money">
                    ${receiptMoney(item.lineTotal, currency)}
                </td>
            </tr>
        `).join("");

        const paymentReference =
            payment && payment.transactionReference
                ? `
                    <p>
                        Reference:
                        ${safe(payment.transactionReference)}
                    </p>
                `
                : "";

        const paymentStatus =
            payment && payment.status
                ? payment.status
                : "Not recorded separately";

        const receiptHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport"
                      content="width=device-width, initial-scale=1">
                <title>Receipt #${safe(order.id)}</title>

                <style>
                    * {
                        box-sizing: border-box;
                    }

                    body {
                        margin: 0;
                        padding: 18px;
                        color: #111;
                        background: #fff;
                        font-family: Arial, Helvetica, sans-serif;
                        font-size: 12px;
                    }

                    .receipt {
                        width: 100%;
                        max-width: 380px;
                        margin: 0 auto;
                    }

                    .center {
                        text-align: center;
                    }

                    h1 {
                        margin: 0 0 8px;
                        font-size: 21px;
                        overflow-wrap: anywhere;
                    }

                    h2 {
                        margin: 14px 0;
                        font-size: 16px;
                        letter-spacing: 2px;
                    }

                    p {
                        margin: 4px 0;
                        overflow-wrap: anywhere;
                    }

                    .muted {
                        color: #555;
                    }

                    .rule {
                        border: 0;
                        border-top: 1px dashed #777;
                        margin: 12px 0;
                    }

                    .details {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 7px;
                    }

                    .details strong {
                        display: block;
                        margin-bottom: 3px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 12px 0;
                        table-layout: fixed;
                    }

                    th {
                        border-bottom: 1px solid #222;
                        padding: 7px 2px;
                        text-align: left;
                        font-size: 10px;
                    }

                    td {
                        padding: 7px 2px;
                        vertical-align: top;
                        overflow-wrap: anywhere;
                    }

                    .product {
                        width: 38%;
                    }

                    .qty {
                        width: 10%;
                        text-align: center;
                    }

                    .money {
                        width: 26%;
                        text-align: right;
                        white-space: normal;
                    }

                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        gap: 12px;
                        font-size: 16px;
                        font-weight: bold;
                    }

                    .staff {
                        line-height: 1.6;
                    }

                    .no-print {
                        display: flex;
                        justify-content: center;
                        margin-top: 20px;
                    }

                    .no-print button {
                        padding: 10px 18px;
                        border: 0;
                        border-radius: 6px;
                        background: #00403c;
                        color: white;
                        cursor: pointer;
                    }

                    @page {
                        size: 80mm auto;
                        margin: 4mm;
                    }

                    @media print {
                        body {
                            padding: 0;
                        }

                        .receipt {
                            max-width: none;
                        }

                        .no-print {
                            display: none !important;
                        }
                    }
                </style>
            </head>

            <body>
                <main class="receipt">
                    <header class="center">
                        <h1>${businessName}</h1>
                        ${businessAddress
                            ? `<p>${businessAddress}</p>`
                            : ""}
                        ${businessPhone
                            ? `<p>Tel: ${businessPhone}</p>`
                            : ""}
                        ${businessEmail
                            ? `<p>${businessEmail}</p>`
                            : ""}

                        <hr class="rule">

                        <h2>SALES RECEIPT</h2>
                        <p><strong>Receipt No:</strong>
                            #${safe(order.id)}</p>
                    </header>

                    <hr class="rule">

                    <section class="details">
                        <div>
                            <strong>Customer</strong>
                            <span>${safe(order.customer)}</span>
                        </div>

                        <div>
                            <strong>Order Date</strong>
                            <span>${dateText}</span>
                        </div>

                        <div>
                            <strong>Payment Method</strong>
                            <span>${safe(
                                order.paymentMethod || "Not specified"
                            )}</span>
                        </div>

                        <div>
                            <strong>Order Status</strong>
                            <span>${safe(order.status)}</span>
                        </div>
                    </section>

                    <hr class="rule">

                    <table>
                        <thead>
                            <tr>
                                <th class="product">Item</th>
                                <th class="qty">Qty</th>
                                <th class="money">Price</th>
                                <th class="money">Total</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${itemRows}
                        </tbody>
                    </table>

                    <hr class="rule">

                    <div class="total-row">
                        <span>TOTAL</span>
                        <span>
                            ${receiptMoney(order.total, currency)}
                        </span>
                    </div>

                    <hr class="rule">

                    <section class="staff">
                        <p>
                            <strong>Printed by:</strong>
                            ${safe(printedBy.fullName)}
                        </p>
                        <p>
                            <strong>Role:</strong>
                            ${safe(printedBy.role)}
                        </p>
                        <p>
                            <strong>Printed at:</strong>
                            ${printedAtText}
                        </p>
                        <p>
                            <strong>Payment record:</strong>
                            ${safe(paymentStatus)}
                        </p>
                        ${paymentReference}
                    </section>

                    <hr class="rule">

                    <footer class="center">
                        <p><strong>Thank you for your business!</strong></p>
                        <p class="muted">
                            Please keep this receipt for your records.
                        </p>
                    </footer>

                    <div class="no-print">
                        <button onclick="window.print()">
                            Print Receipt / Save as PDF
                        </button>
                    </div>
                </main>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(receiptHtml);
        printWindow.document.close();

        printWindow.focus();

    } catch (error) {
        console.error("Receipt error:", error);

        printWindow.document.body.innerHTML = `
            <p style="color:#b42318;font-family:Arial,sans-serif">
                ${escapeReceiptHtml(error.message)}
            </p>
            <button onclick="window.close()">Close</button>
        `;
    }
}


function updateDashboardGreeting() {
    const greetingElement =
        document.getElementById("dashboard-greeting");

    if (!greetingElement) {
        return;
    }

    const hour = new Date().getHours();

    let greeting;

    if (hour < 12) {
        greeting = "Good morning";
    } else if (hour < 17) {
        greeting = "Good afternoon";
    } else {
        greeting = "Good evening";
    }

    const roleElement =
        document.getElementById("logged-in-user-role");

    const role = roleElement
        ? roleElement.textContent.trim()
        : "";

    const formattedRole = role
        ? role.charAt(0).toUpperCase() + role.slice(1)
        : "User";

    greetingElement.textContent =
        `${greeting}, ${formattedRole}`;
}


const headerFeatureSearch = document.querySelector(
    'input[placeholder="Search features..."]'
);

if (headerFeatureSearch) {

    const searchContainer = headerFeatureSearch.parentElement;

    searchContainer.style.position = "relative";

    const featureSearchResults = document.createElement("div");

    featureSearchResults.id = "feature-search-results";
    featureSearchResults.hidden = true;

    searchContainer.appendChild(featureSearchResults);

    function searchDashboardFeatures() {

        const query = headerFeatureSearch.value
            .trim()
            .toLowerCase();

        featureSearchResults.innerHTML = "";

        if (query === "") {
            featureSearchResults.hidden = true;
            return;
        }

        const navigationItems = document.querySelectorAll(
            ".nav-item[data-page]"
        );

        const matchingFeatures = Array.from(navigationItems)
            .filter(function (item) {

                const featureName = item.textContent
                    .trim()
                    .toLowerCase();

                return featureName.includes(query);
            });

        if (matchingFeatures.length === 0) {

            const noResults = document.createElement("div");

            noResults.className = "feature-search-empty";
            noResults.textContent = "No matching features found.";

            featureSearchResults.appendChild(noResults);
            featureSearchResults.hidden = false;

            return;
        }

        matchingFeatures.forEach(function (item) {

            const resultButton = document.createElement("button");

            resultButton.type = "button";
            resultButton.className = "feature-search-result";
            resultButton.textContent = item.textContent.trim();

            resultButton.addEventListener("click", function () {

                item.click();

                headerFeatureSearch.value = "";
                featureSearchResults.hidden = true;
                headerFeatureSearch.blur();
            });

            featureSearchResults.appendChild(resultButton);
        });

        featureSearchResults.hidden = false;
    }

    headerFeatureSearch.addEventListener(
        "input",
        searchDashboardFeatures
    );

    headerFeatureSearch.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            const firstResult = featureSearchResults.querySelector(
                ".feature-search-result"
            );

            if (firstResult) {
                event.preventDefault();
                firstResult.click();
            }
        }

        if (event.key === "Escape") {
            featureSearchResults.hidden = true;
        }
    });

    document.addEventListener("click", function (event) {

        if (!searchContainer.contains(event.target)) {
            featureSearchResults.hidden = true;
        }
    });
}




const profilePicture = document.getElementById(
    "header-profile-picture"
);

const profilePictureButton = document.getElementById(
    "edit-profile-picture"
);

const profilePictureInput = document.getElementById(
    "profile-picture-upload"
);

let canEditOwnProfilePicture = true;

const currentProfileUser =
    localStorage.getItem("currentUserEmail") ||
    "demo-admin@example.com";

const profileStorageKey =
    "dashboardProfilePicture_" +
    currentProfileUser.trim().toLowerCase();

function updateProfilePicturePermission() {

    if (!profilePictureButton) return;

    profilePictureButton.hidden =
        !canEditOwnProfilePicture;
}

function loadProfilePicture() {

    if (!profilePicture) return;

    try {
        const savedPicture = localStorage.getItem(
            profileStorageKey
        );

        if (savedPicture) {
            profilePicture.src = savedPicture;
        }
    } catch (error) {
        console.error(
            "Could not load profile picture:",
            error
        );
    }
}

if (profilePictureButton && profilePictureInput) {

    profilePictureButton.addEventListener("click", function () {

        if (!canEditOwnProfilePicture) {
            alert("You do not have permission to change this picture.");
            return;
        }

        profilePictureInput.click();
    });

    profilePictureInput.addEventListener("change", function () {

        const file = profilePictureInput.files[0];

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            alert("Please select a JPG, PNG or WebP image.");
            profilePictureInput.value = "";
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert("Please choose an image smaller than 2 MB.");
            profilePictureInput.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = function () {

            const imageData = reader.result;

            if (typeof imageData !== "string") {
                alert("The selected image could not be read.");
                return;
            }

            try {
                localStorage.setItem(
                    profileStorageKey,
                    imageData
                );

                profilePicture.src = imageData;

            } catch (error) {
                alert(
                    "The image could not be saved. " +
                    "Try a smaller image."
                );

                console.error(
                    "Could not save profile picture:",
                    error
                );
            }

            profilePictureInput.value = "";
        };

        reader.onerror = function () {
            alert("An error occurred while reading the image.");
            profilePictureInput.value = "";
        };

        reader.readAsDataURL(file);
    });
}

updateProfilePicturePermission();
loadProfilePicture();




(function initializeVendrexNotifications() {
    const notificationButton =
        document.getElementById("notification-button");

    const notificationBadge =
        document.getElementById("notification-badge");

    if (!notificationButton || !notificationBadge) {
        console.warn(
            "Notification button or badge was not found."
        );
        return;
    }

    const notificationModal = document.createElement("div");

    notificationModal.className = "notification-modal";
    notificationModal.id = "notification-modal";
    notificationModal.hidden = true;

    
    notificationModal.innerHTML = `
        <div class="notification-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-title">

            <header class="notification-header">
                <div class="notification-heading">
                    <div class="notification-heading-icon"
                        aria-hidden="true">
                        <span>♧</span>
                    </div>

                    <div class="notification-heading-text">
                        <h2 id="notification-title">Notifications</h2>
                        <p id="notification-summary" aria-live="polite">
                            Loading notifications...
                        </p>
                    </div>
                </div>

                <button type="button"
                        id="notification-close"
                        class="notification-close"
                        aria-label="Close notifications">
                    &times;
                </button>
            </header>

            <div class="notification-toolbar">
                <span class="notification-toolbar-label">
                    Recent activity
                </span>

                <span class="notification-live-indicator">
                    <span class="notification-live-dot"></span>
                    Live data
                </span>
            </div>

            <div id="notification-list"
                class="notification-list"
                aria-live="polite"
                aria-busy="true">
                <div class="notification-loading">
                    <span class="notification-spinner"></span>
                    <p>Loading your notifications...</p>
                </div>
            </div>

            <footer class="notification-footer">
                <span>Vendrex Dashboard</span>
                <span class="notification-footer-status">
                    <span></span>
                    Connected to notifications
                </span>
            </footer>
        </div>
    `;

    document.body.appendChild(notificationModal);

    const notificationList =
        notificationModal.querySelector("#notification-list");

    const notificationSummary =
        notificationModal.querySelector("#notification-summary");

    const notificationClose =
        notificationModal.querySelector("#notification-close");

    function escapeNotificationText(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => {
            const replacements = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return replacements[character];
        });
    }

    async function notificationRequest(url, options = {}) {
        const response = await fetch(url, {
            credentials: "same-origin",
            ...options,
            headers: {
                Accept: "application/json",
                ...(options.headers || {})
            }
        });

        if (response.status === 401) {
            throw new Error(
                "Your session has expired. Please sign in again."
            );
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.message ||
                `Notification request failed (${response.status}).`
            );
        }

        return data;
    }

    let notificationGetQueue = Promise.resolve();

    function getNotificationData() {
        const request = () =>
            notificationRequest("/api/notifications");

        const result = notificationGetQueue.then(
            request,
            request
        );

        notificationGetQueue = result.then(
            () => undefined,
            () => undefined
        );

        return result;
    }

    async function markAllNotificationsAsRead() {
        await notificationRequest(
            "/api/notifications/read-all",
            {
                method: "PATCH"
            }
        );
    }

    async function markNotificationAsRead(id) {
        await notificationRequest(
            `/api/notifications/${encodeURIComponent(id)}/read`,
            {
                method: "PATCH"
            }
        );
    }

    function updateNotificationBadge(unreadCount) {
        const count = Math.max(
            0,
            Number(unreadCount) || 0
        );

        notificationBadge.textContent =
            count > 99 ? "99+" : String(count);

        notificationBadge.hidden = count === 0;
    }

    function formatNotificationDate(value) {
        if (!value) {
            return "Date unavailable";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }

        return date.toLocaleString();
    }

    function getNotificationIcon(type) {
        const icons = {
            "Order Pending": "🛒",
            "Order Processing": "📋",
            "Order Completed": "✅",
            "Low Stock": "📦",
            "Out of Stock": "⚠️",
            "User Inactive": "👤"
        };

        return icons[type] || "🔔";
    }

        
    function displayNotificationItems(notifications) {
        notificationList.setAttribute("aria-busy", "false");

        if (!notifications.length) {
            notificationList.innerHTML = `
                <div class="notification-empty">
                    <div class="notification-empty-icon"
                        aria-hidden="true">
                        <span>✓</span>
                    </div>

                    <h3>You're all caught up</h3>

                    <p>
                        There are no notifications to display right now.
                        New store activity will appear here.
                    </p>
                </div>
            `;
            return;
        }

        notificationList.innerHTML = notifications.map(item => {
            const id = escapeNotificationText(item.id);
            const title = escapeNotificationText(item.title);
            const message = escapeNotificationText(item.message);
            const date = escapeNotificationText(
                formatNotificationDate(item.date)
            );

            const isRead =
                item.isRead === true ||
                item.isRead === 1 ||
                item.isRead === "1";

            const icon = getNotificationIcon(item.type);

            const typeLabel = escapeNotificationText(
                item.type || "General"
            );

            return `
                <article class="notification-item
                                ${isRead ? "is-read" : "is-unread"}">

                    <div class="notification-icon"
                        aria-hidden="true">
                        ${icon}
                    </div>

                    <div class="notification-content">
                        <div class="notification-item-top">
                            <span class="notification-type">
                                ${typeLabel}
                            </span>

                            <span class="notification-status
                                        ${isRead ? "status-read" : "status-unread"}">
                                ${isRead ? "Read" : "Unread"}
                            </span>
                        </div>

                        <h3 class="notification-item-title">
                            ${title}
                        </h3>

                        <p class="notification-item-message">
                            ${message}
                        </p>

                        <div class="notification-item-bottom">
                            <span class="notification-date">
                                <span aria-hidden="true">◷</span>
                                ${date}
                            </span>

                            ${
                                isRead
                                    ? `<span class="notification-read-label">
                                        <span aria-hidden="true">✓</span>
                                        Read
                                    </span>`
                                    : `<button
                                        type="button"
                                        class="notification-mark-read"
                                        data-mark-read="${id}">
                                        Mark as read
                                    </button>`
                            }
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }


    let notificationRenderVersion = 0;

    async function renderNotifications() {
        const currentVersion = ++notificationRenderVersion;

        notificationSummary.textContent =
            "Loading notifications...";

        notificationList.innerHTML =
            "<p>Loading notifications...</p>";

        notificationList.setAttribute("aria-busy", "true");

        try {
            const data = await getNotificationData();

            if (currentVersion !== notificationRenderVersion) {
                return;
            }

            const notifications = Array.isArray(data.notifications)
                ? data.notifications
                : [];

            updateNotificationBadge(data.unreadCount);

            const unreadCount = Math.max(
                0,
                Number(data.unreadCount) || 0
            );

            notificationSummary.textContent =
                `${unreadCount} unread notification(s)`;

            displayNotificationItems(notifications);

        } catch (error) {
            if (currentVersion !== notificationRenderVersion) {
                return;
            }

            console.error(
                "Could not load notifications:",
                error
            );

            notificationSummary.textContent =
                "Unable to load notifications.";

            notificationList.innerHTML = `
                <div class="notification-error">
                    <p>
                        ${escapeNotificationText(error.message)}
                    </p>

                    <button type="button"
                            id="notification-retry">
                        Try again
                    </button>
                </div>
            `;
        }
    }

    async function openNotifications() {
        notificationModal.hidden = false;
        document.body.style.overflow = "hidden";

        notificationClose.focus();

        await renderNotifications();
    }


    function closeNotifications() {
        notificationModal.hidden = true;
        document.body.style.overflow = "";

        notificationButton.focus();
    }

    
    notificationList.addEventListener("click", async event => {
        const retryButton = event.target.closest(
            "#notification-retry"
        );

        if (retryButton) {
            await renderNotifications();
            return;
        }

        const notificationItem = event.target.closest(
            ".notification-item"
        );

        if (!notificationItem) {
            return;
        }

        if (notificationItem.classList.contains("is-read")) {
            return;
        }

        const readButton = notificationItem.querySelector(
            "[data-mark-read]"
        );

        if (!readButton) {
            return;
        }

        const notificationId = readButton.dataset.markRead;

        readButton.disabled = true;
        readButton.textContent = "Saving...";

        try {
            await markNotificationAsRead(notificationId);

            await renderNotifications();

        } catch (error) {
            console.error(
                "Could not mark notification as read:",
                error
            );

            readButton.disabled = false;
            readButton.textContent = "Mark as read";

            alert(
                error.message ||
                "Could not mark this notification as read."
            );
        }
    });


    notificationButton.addEventListener(
        "click",
        openNotifications
    );

    notificationClose.addEventListener(
        "click",
        closeNotifications
    );

    notificationModal.addEventListener("click", event => {
        if (event.target === notificationModal) {
            closeNotifications();
        }
    });

    document.addEventListener("keydown", event => {
        if (
            event.key === "Escape" &&
            !notificationModal.hidden
        ) {
            closeNotifications();
        }
    });

    renderNotifications();
})();




async function updateLoggedInUserProfile() {
    const userNameElement = document.getElementById("logged-in-user-name");
    const userRoleElement = document.getElementById("logged-in-user-role");

    try {
        const response = await fetch("/api/me", {
            method: "GET",
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("Could not retrieve the signed-in user.");
        }

        const result = await response.json();

        const user = result.user || result;

        if (!user) {
            throw new Error("No signed-in user was returned.");
        }

        if (userNameElement) {
            userNameElement.textContent = user.fullName || user.full_name || "User";
        }

        if (userRoleElement) {
            userRoleElement.textContent = user.role || "Staff";
        }
        updateDashboardGreeting();

    } catch (error) {
        console.error("Profile loading error:", error);

        if (userNameElement) {
            userNameElement.textContent = "Unable to load";
        }

        if (userRoleElement) {
            userRoleElement.textContent = "";
        }
    }
}



updateLoggedInUserProfile();


(function () {
    const editButton = document.getElementById("edit-profile-picture");
    const fileInput = document.getElementById("profile-picture-upload");
    const profileImage = document.getElementById("header-profile-picture");

    if (!editButton || !fileInput || !profileImage) {
        console.warn("Profile picture elements were not found.");
        return;
    }

    let cropper = null;
    let selectedImageUrl = null;

    const storageKey = "dashboardProfilePicture";

    const modal = document.createElement("div");
    modal.className = "profile-crop-modal";
    modal.hidden = true;

    modal.innerHTML = `
        <div
            class="profile-crop-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-crop-title"
        >
            <div class="profile-crop-header">
                <h2 id="profile-crop-title">Crop Profile Picture</h2>

                <button
                    type="button"
                    class="profile-crop-close"
                    aria-label="Close cropping window"
                >&times;</button>
            </div>

            <div class="profile-crop-image-container">
                <img id="profile-crop-image" alt="Image to crop">
            </div>

            <p class="profile-crop-hint">
                Drag the image to adjust its position and use the controls
                to zoom in or out.
            </p>

            <div class="profile-crop-actions">
                <button type="button" class="profile-crop-cancel">
                    Cancel
                </button>

                <button type="button" id="profile-crop-zoom-out">
                    −
                </button>

                <button type="button" id="profile-crop-zoom-in">
                    +
                </button>

                <button type="button" class="profile-crop-save">
                    Crop & Save
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const cropImage = modal.querySelector("#profile-crop-image");
    const closeButton = modal.querySelector(".profile-crop-close");
    const cancelButton = modal.querySelector(".profile-crop-cancel");
    const saveButton = modal.querySelector(".profile-crop-save");
    const zoomInButton = modal.querySelector("#profile-crop-zoom-in");
    const zoomOutButton = modal.querySelector("#profile-crop-zoom-out");

    function closeCropModal() {
        modal.hidden = true;

        if (cropper) {
            cropper.destroy();
            cropper = null;
        }

        if (selectedImageUrl) {
            URL.revokeObjectURL(selectedImageUrl);
            selectedImageUrl = null;
        }

        fileInput.value = "";
    }

    editButton.addEventListener("click", function () {
        fileInput.click();
    });

    fileInput.addEventListener("change", function () {
        const file = fileInput.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image.");
            fileInput.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert("Please select an image smaller than 10 MB.");
            fileInput.value = "";
            return;
        }

        if (typeof Cropper === "undefined") {
            alert("The cropping library could not load. Check your internet connection.");
            fileInput.value = "";
            return;
        }

        if (cropper) {
            cropper.destroy();
            cropper = null;
        }

        if (selectedImageUrl) {
            URL.revokeObjectURL(selectedImageUrl);
        }

        selectedImageUrl = URL.createObjectURL(file);
        cropImage.src = selectedImageUrl;
        modal.hidden = false;

        cropImage.onload = function () {
            cropper = new Cropper(cropImage, {
                aspectRatio: 1,
                viewMode: 1,
                dragMode: "move",
                autoCropArea: 0.85,
                responsive: true,
                background: false,
                guides: true,
                center: true,
                movable: true,
                zoomable: true,
                zoomOnWheel: true,
                rotatable: false,
                scalable: false
            });
        };
    });

    zoomInButton.addEventListener("click", function () {
        if (cropper) cropper.zoom(0.1);
    });

    zoomOutButton.addEventListener("click", function () {
        if (cropper) cropper.zoom(-0.1);
    });

    saveButton.addEventListener("click", function () {
        if (!cropper) {
            alert("Please select an image to crop.");
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        try {
            const canvas = cropper.getCroppedCanvas({
                width: 400,
                height: 400,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: "high"
            });

            if (!canvas) {
                throw new Error("The cropped image could not be created.");
            }

            canvas.toBlob(function (blob) {
                try {
                    if (!blob) {
                        throw new Error("Image conversion failed.");
                    }

                    const reader = new FileReader();

                    reader.onload = function () {
                        try {
                            const croppedImage = reader.result;

                            localStorage.setItem(storageKey, croppedImage);

                            profileImage.src = croppedImage;

                            closeCropModal();
                        } catch (error) {
                            console.error(error);
                            alert(
                                "The image could not be saved. " +
                                "Try a smaller picture."
                            );
                        } finally {
                            saveButton.disabled = false;
                            saveButton.textContent = "Crop & Save";
                        }
                    };

                    reader.onerror = function () {
                        saveButton.disabled = false;
                        saveButton.textContent = "Crop & Save";
                        alert("The cropped image could not be read.");
                    };

                    reader.readAsDataURL(blob);
                } catch (error) {
                    console.error(error);
                    saveButton.disabled = false;
                    saveButton.textContent = "Crop & Save";
                    alert("Could not crop the selected image.");
                }
            }, "image/jpeg", 0.85);
        } catch (error) {
            console.error(error);
            saveButton.disabled = false;
            saveButton.textContent = "Crop & Save";
            alert("Could not crop the selected image.");
        }
    });

    closeButton.addEventListener("click", closeCropModal);
    cancelButton.addEventListener("click", closeCropModal);

    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            closeCropModal();
        }
    });

    try {
        const savedPicture = localStorage.getItem(storageKey);

        if (savedPicture) {
            profileImage.src = savedPicture;
        }
    } catch (error) {
        console.warn("Could not load the saved profile picture.", error);
    }
})();


showPage("dashboard");

