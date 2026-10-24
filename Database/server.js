const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const nodemailer = require("nodemailer");
require("dotenv").config();

const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

const mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

app.use(express.json({ limit: "5mb" }));

app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: false, 
            maxAge: 1000 * 60 * 60
        }
    })
);


function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            message: "Please log in to access products."
        });
    }

    next();
}


function requireProductManagement(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            message: "Please log in to continue."
        });
    }

    const role = req.session.user.role;

    if (role !== "Administrator" && role !== "Manager") {
        return res.status(403).json({
            message: "You do not have permission to manage products."
        });
    }

    next();
}


function requireAdministrator(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            message: "Please log in to continue."
        });
    }

    if (req.session.user.role !== "Administrator") {
        return res.status(403).json({
            message: "Administrator permission is required."
        });
    }

    next();
}



function requireUserManagementView(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            message: "Please log in to continue."
        });
    }

    const role = req.session.user.role;

    if (role !== "Administrator" && role !== "Manager") {
        return res.status(403).json({
            message: "You do not have permission to view users."
        });
    }

    next();
}


app.get("/api/products", requireLogin, (req, res) => {

    const sql = `
        SELECT
            id,
            name,
            category,
            price,
            cost_price AS costPrice,
            stock,
            image_url AS image,
            description
        FROM products
        ORDER BY id DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error("Fetch products error:", error.message);

            return res.status(500).json({
                message: "Unable to load products."
            });
        }

        res.json(results);
    });
});


app.post("/api/products", requireProductManagement, (req, res) => {

    const {
        name,
        category,
        price,
        costPrice,
        stock,
        image,
        description
    } = req.body;

    if (
        typeof name !== "string" || !name.trim() ||
        typeof category !== "string" || !category.trim() ||
        price === undefined || price === "" ||
        !Number.isFinite(Number(price)) ||
        Number(price) < 0 ||
        !Number.isFinite(Number(costPrice)) ||
        Number(costPrice) < 0 ||
        !Number.isInteger(Number(stock)) ||
        Number(stock) < 0
    ) {
        return res.status(400).json({
            message: "Enter valid product details."
        });
    }

    const sql = `
        INSERT INTO products
            (name, category, price, cost_price, stock, image_url, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        name.trim(),
        category.trim(),
        Number(price),
        Number(costPrice),
        Number(stock),
        image || null,
        description || null
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            console.error("Add product error:", error.message);

            return res.status(500).json({
                message: "Unable to save the product."
            });
        }

        res.status(201).json({
            message: "Product added successfully.",
            id: result.insertId
        });
    });
});


app.put("/api/products/:id", requireProductManagement, (req, res) => {

    const productId = Number(req.params.id);

    const {
        name,
        category,
        price,
        costPrice,
        stock,
        image,
        description
    } = req.body;

    if (
        !Number.isSafeInteger(productId) || productId <= 0 ||
        typeof name !== "string" || !name.trim() ||
        typeof category !== "string" || !category.trim() ||
        !Number.isFinite(Number(price)) || Number(price) < 0 ||
        !Number.isFinite(Number(costPrice)) || Number(costPrice) < 0 ||
        !Number.isInteger(Number(stock)) || Number(stock) < 0
    ) {
        return res.status(400).json({
            message: "Enter valid product details."
        });
    }

    const sql = `
        UPDATE products
        SET
            name = ?,
            category = ?,
            price = ?,
            cost_price = ?,
            stock = ?,
            image_url = ?,
            description = ?
        WHERE id = ?
    `;

    const values = [
        name.trim(),
        category.trim(),
        Number(price),
        Number(costPrice),
        Number(stock),
        image || null,
        description || null,
        productId
    ];

    db.query(sql, values, (error, result) => {
        if (error) {
            console.error("Update product error:", error.message);

            return res.status(500).json({
                message: "Unable to update the product."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Product not found."
            });
        }

        res.json({
            message: "Product updated successfully."
        });
    });
});


app.delete("/api/products/:id", requireProductManagement, (req, res) => {
    const productId = Number(req.params.id);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
        return res.status(400).json({
            message: "Invalid product ID."
        });
    }

    db.query(
        "DELETE FROM products WHERE id = ?",
        [productId],
        (error, result) => {

            if (error) {
                console.error("Delete product error:", error.message);

                return res.status(500).json({
                    message: "Unable to delete the product."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Product not found."
                });
            }

            res.json({
                message: "Product deleted successfully."
            });
        }
    );
});



app.get("/api/orders", requireLogin, (req, res) => {

    const ordersSql = `
        SELECT
            id,
            customer,
            total,
            status,
            payment_method AS paymentMethod,
            stock_adjusted AS stockAdjusted,
            created_at AS date,
            created_by AS createdBy
        FROM orders
        ORDER BY created_at DESC, id DESC
    `;

    db.query(ordersSql, (error, orders) => {

        if (error) {
            console.error("Fetch orders error:", error.message);

            return res.status(500).json({
                message: "Unable to load orders."
            });
        }

        if (orders.length === 0) {
            return res.json([]);
        }

        const orderIds = orders.map(order => order.id);

        const placeholders = orderIds.map(() => "?").join(", ");

        const itemsSql = `
            SELECT
                id,
                order_id AS orderId,
                product_id AS productId,
                product_name AS productName,
                quantity,
                price,
                cost_price AS costPrice
            FROM order_items
            WHERE order_id IN (${placeholders})
            ORDER BY id ASC
        `;

        db.query(itemsSql, orderIds, (itemsError, items) => {

            if (itemsError) {
                console.error(
                    "Fetch order items error:",
                    itemsError.message
                );

                return res.status(500).json({
                    message: "Unable to load order items."
                });
            }

            const itemsByOrder = new Map();

            items.forEach(item => {
                const key = String(item.orderId);

                if (!itemsByOrder.has(key)) {
                    itemsByOrder.set(key, []);
                }

                itemsByOrder.get(key).push({
                    id: item.id,
                    productId: item.productId,
                    productName: item.productName,
                    quantity: Number(item.quantity),
                    price: Number(item.price),
                    costPrice: Number(item.costPrice)
                });
            });

            const formattedOrders = orders.map(order => ({
                id: order.id,
                customer: order.customer,
                total: Number(order.total),
                status: order.status,
                paymentMethod: order.paymentMethod,
                stockAdjusted: Boolean(order.stockAdjusted),
                date: order.date,
                createdBy: order.createdBy,
                items: itemsByOrder.get(String(order.id)) || []
            }));

            res.json(formattedOrders);
        });
    });
});





app.post("/api/orders", requireLogin, (req, res) => {
    const {
        customer,
        paymentMethod = "Cash",
        items,
        status = "Pending"
    } = req.body;

    const allowedPaymentMethods = [
        "Cash",
        "Mobile Money",
        "Card",
        "Bank Transfer"
    ];

    const allowedStatuses = [
        "Pending",
        "Processing",
        "Completed",
        "Cancelled"
    ];

    if (
        typeof customer !== "string" ||
        !customer.trim() ||
        customer.trim().length > 180
    ) {
        return res.status(400).json({
            message: "Enter a valid customer name."
        });
    }

    if (!allowedPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({
            message: "Invalid payment method."
        });
    }

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid order status."
        });
    }

    if (
        !Array.isArray(items) ||
        items.length === 0 ||
        items.length > 100
    ) {
        return res.status(400).json({
            message: "An order must contain between 1 and 100 items."
        });
    }

    const quantitiesByProduct = new Map();

    for (const item of items) {
        const productId = Number(item.productId);
        const quantity = Number(item.quantity);

        if (
            !Number.isSafeInteger(productId) ||
            productId <= 0 ||
            !Number.isSafeInteger(quantity) ||
            quantity <= 0
        ) {
            return res.status(400).json({
                message: "Each item must have a valid product ID and quantity."
            });
        }

        const combinedQuantity =
            (quantitiesByProduct.get(productId) || 0) + quantity;

        if (!Number.isSafeInteger(combinedQuantity)) {
            return res.status(400).json({
                message: "Invalid combined product quantity."
            });
        }

        quantitiesByProduct.set(productId, combinedQuantity);
    }

    const requestedItems = Array.from(
        quantitiesByProduct,
        ([productId, quantity]) => ({ productId, quantity })
    );

    db.getConnection((connectionError, connection) => {
        if (connectionError) {
            console.error(
                "Order connection error:",
                connectionError.message
            );

            return res.status(500).json({
                message: "Unable to connect to the database."
            });
        }

        const { promisify } = require("util");

        const query = promisify(connection.query).bind(connection);
        const beginTransaction =
            promisify(connection.beginTransaction).bind(connection);
        const commit =
            promisify(connection.commit).bind(connection);
        const rollback =
            promisify(connection.rollback).bind(connection);

        (async () => {
            let transactionStarted = false;

            try {
                await beginTransaction();
                transactionStarted = true;

                const productIds = requestedItems.map(
                    item => item.productId
                );

                const placeholders = productIds.map(() => "?").join(", ");

                const products = await query(
                    `
                    SELECT id, name, price, cost_price, stock
                    FROM products
                    WHERE id IN (${placeholders})
                    ORDER BY id
                    FOR UPDATE
                    `,
                    productIds
                );

                if (products.length !== requestedItems.length) {
                    const error = new Error(
                        "One or more products do not exist."
                    );
                    error.statusCode = 400;
                    throw error;
                }

                const productsById = new Map(
                    products.map(product => [
                        String(product.id),
                        product
                    ])
                );

                const effectiveStatus =
                    paymentMethod === "Mobile Money"
                        ? "Pending"
                        : status;

                const stockAdjusted =
                    effectiveStatus === "Completed";

                let totalCents = 0;

                const orderItems = requestedItems.map(item => {
                    const product = productsById.get(
                        String(item.productId)
                    );

                    if (
                        stockAdjusted &&
                        Number(product.stock) < item.quantity
                    ) {
                        const error = new Error(
                            `Insufficient stock for ${product.name}.`
                        );
                        error.statusCode = 409;
                        throw error;
                    }

                    const priceCents = Math.round(
                        Number(product.price) * 100
                    );

                    const costCents = Math.round(
                        Number(product.cost_price) * 100
                    );

                    totalCents += priceCents * item.quantity;

                    return {
                        productId: product.id,
                        productName: product.name,
                        quantity: item.quantity,
                        price: (priceCents / 100).toFixed(2),
                        costPrice: (costCents / 100).toFixed(2)
                    };
                });

                if (!Number.isSafeInteger(totalCents)) {
                    const error = new Error("Order total is too large.");
                    error.statusCode = 400;
                    throw error;
                }

                const total = (totalCents / 100).toFixed(2);

                const orderResult = await query(
                    `
                    INSERT INTO orders (
                        customer,
                        total,
                        status,
                        payment_method,
                        stock_adjusted,
                        created_by
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                    `,
                    [
                        customer.trim(),
                        total,
                        effectiveStatus,
                        paymentMethod,
                        stockAdjusted ? 1 : 0,
                        req.session.user.id
                    ]
                );

                const orderId = orderResult.insertId;

                for (const item of orderItems) {
                    await query(
                        `
                        INSERT INTO order_items (
                            order_id,
                            product_id,
                            product_name,
                            quantity,
                            price,
                            cost_price
                        )
                        VALUES (?, ?, ?, ?, ?, ?)
                        `,
                        [
                            orderId,
                            item.productId,
                            item.productName,
                            item.quantity,
                            item.price,
                            item.costPrice
                        ]
                    );

                    if (stockAdjusted) {
                        const stockResult = await query(
                            `
                            UPDATE products
                            SET stock = stock - ?
                            WHERE id = ?
                              AND stock >= ?
                            `,
                            [
                                item.quantity,
                                item.productId,
                                item.quantity
                            ]
                        );

                        if (stockResult.affectedRows !== 1) {
                            const error = new Error(
                                `Stock update failed for ${item.productName}.`
                            );
                            error.statusCode = 409;
                            throw error;
                        }
                    }
                }

                if (paymentMethod === "Mobile Money") {
                    await query(
                        `
                        INSERT INTO payments (
                            order_id,
                            payment_method,
                            amount,
                            transaction_reference,
                            status
                        )
                        VALUES (?, 'Mobile Money', ?, NULL, 'Pending')
                        `,
                        [orderId, total]
                    );
                }

                await commit();
                transactionStarted = false;

                return res.status(201).json({
                    message: paymentMethod === "Mobile Money"
                        ? "Order created. Mobile Money payment is pending."
                        : "Order created successfully.",
                    order: {
                        id: orderId,
                        customer: customer.trim(),
                        total: Number(total),
                        status: effectiveStatus,
                        paymentMethod,
                        stockAdjusted,
                        items: orderItems.map(item => ({
                            productId: item.productId,
                            productName: item.productName,
                            quantity: item.quantity,
                            price: Number(item.price),
                            costPrice: Number(item.costPrice)
                        }))
                    }
                });

            } catch (error) {
                if (transactionStarted) {
                    try {
                        await rollback();
                    } catch (rollbackError) {
                        console.error(
                            "Order rollback error:",
                            rollbackError.message
                        );
                    }
                }

                console.error("Create order error:", error.message);

                if (!res.headersSent) {
                    return res.status(error.statusCode || 500).json({
                        message: error.statusCode
                            ? error.message
                            : "Unable to create the order."
                    });
                }
            } finally {
                connection.release();
            }
        })();
    });
});


app.patch("/api/orders/:id/status", requireLogin, (req, res) => {
    const orderId = req.params.id;
    const { status: newStatus } = req.body;

    const allowedRoles = [
        "Administrator",
        "Manager",
        "Cashier"
    ];

    const allowedStatuses = [
        "Pending",
        "Processing",
        "Completed",
        "Cancelled"
    ];

    if (!allowedRoles.includes(req.session.user.role)) {
        return res.status(403).json({
            message: "You do not have permission to process orders."
        });
    }

    if (!/^[1-9]\d*$/.test(orderId)) {
        return res.status(400).json({
            message: "Invalid order ID."
        });
    }

    if (!allowedStatuses.includes(newStatus)) {
        return res.status(400).json({
            message: "Invalid order status."
        });
    }

    db.getConnection((connectionError, connection) => {
        if (connectionError) {
            console.error(
                "Order status connection error:",
                connectionError.message
            );

            return res.status(500).json({
                message: "Unable to connect to the database."
            });
        }

        const { promisify } = require("util");

        const query = promisify(connection.query).bind(connection);
        const beginTransaction =
            promisify(connection.beginTransaction).bind(connection);
        const commit =
            promisify(connection.commit).bind(connection);
        const rollback =
            promisify(connection.rollback).bind(connection);

        (async () => {
            let transactionStarted = false;

            try {
                await beginTransaction();
                transactionStarted = true;

                const orders = await query(
                    `
                    SELECT
                        id,
                        status,
                        payment_method AS paymentMethod,
                        stock_adjusted AS stockAdjusted
                    FROM orders
                    WHERE id = ?
                    FOR UPDATE
                    `,
                    [orderId]
                );

                if (orders.length === 0) {
                    const error = new Error("Order not found.");
                    error.statusCode = 404;
                    throw error;
                }

                const order = orders[0];
                const stockWasAdjusted = Boolean(order.stockAdjusted);

                if (
                    newStatus === "Completed" &&
                    order.paymentMethod === "Mobile Money"
                ) {
                    const successfulPayments = await query(
                        `
                        SELECT id
                        FROM payments
                        WHERE order_id = ?
                          AND payment_method = 'Mobile Money'
                          AND status = 'Successful'
                        LIMIT 1
                        FOR UPDATE
                        `,
                        [orderId]
                    );

                    if (successfulPayments.length === 0) {
                        const error = new Error(
                            "This Mobile Money order cannot be completed until payment is verified."
                        );
                        error.statusCode = 409;
                        throw error;
                    }
                }

                const stockShouldBeAdjusted =
                    newStatus === "Completed";

                if (
                    order.status === newStatus &&
                    stockWasAdjusted === stockShouldBeAdjusted
                ) {
                    await commit();
                    transactionStarted = false;

                    return res.json({
                        message: "Order status is already up to date.",
                        orderId: order.id,
                        status: order.status,
                        stockAdjusted: stockWasAdjusted
                    });
                }

                const items = await query(
                    `
                    SELECT
                        product_id AS productId,
                        quantity
                    FROM order_items
                    WHERE order_id = ?
                    ORDER BY product_id
                    FOR UPDATE
                    `,
                    [orderId]
                );

                if (
                    stockWasAdjusted !== stockShouldBeAdjusted &&
                    (
                        items.length === 0 ||
                        items.some(item => item.productId === null)
                    )
                ) {
                    const error = new Error(
                        "Order items are missing valid product references."
                    );
                    error.statusCode = 409;
                    throw error;
                }

                const quantitiesByProduct = new Map();

                for (const item of items) {
                    const productId = String(item.productId);
                    const quantity = Number(item.quantity);

                    const combinedQuantity =
                        (quantitiesByProduct.get(productId) || 0) +
                        quantity;

                    if (
                        !Number.isSafeInteger(quantity) ||
                        quantity <= 0 ||
                        !Number.isSafeInteger(combinedQuantity)
                    ) {
                        const error = new Error(
                            "Invalid quantity in the order."
                        );
                        error.statusCode = 409;
                        throw error;
                    }

                    quantitiesByProduct.set(
                        productId,
                        combinedQuantity
                    );
                }

                if (stockWasAdjusted !== stockShouldBeAdjusted) {
                    const productIds = Array.from(
                        quantitiesByProduct.keys()
                    );

                    const placeholders = productIds
                        .map(() => "?")
                        .join(", ");

                    const products = await query(
                        `
                        SELECT id, name, stock
                        FROM products
                        WHERE id IN (${placeholders})
                        ORDER BY id
                        FOR UPDATE
                        `,
                        productIds
                    );

                    if (products.length !== productIds.length) {
                        const error = new Error(
                            "One or more products no longer exist."
                        );
                        error.statusCode = 409;
                        throw error;
                    }

                    const productsById = new Map(
                        products.map(product => [
                            String(product.id),
                            product
                        ])
                    );

                    if (stockShouldBeAdjusted) {
                        for (const [productId, quantity]
                            of quantitiesByProduct) {
                            const product = productsById.get(productId);

                            if (Number(product.stock) < quantity) {
                                const error = new Error(
                                    `Insufficient stock for ${product.name}.`
                                );
                                error.statusCode = 409;
                                throw error;
                            }
                        }
                    }

                    for (const [productId, quantity]
                        of quantitiesByProduct) {
                        let stockResult;

                        if (stockShouldBeAdjusted) {
                            stockResult = await query(
                                `
                                UPDATE products
                                SET stock = stock - ?
                                WHERE id = ?
                                  AND stock >= ?
                                `,
                                [quantity, productId, quantity]
                            );
                        } else {
                            stockResult = await query(
                                `
                                UPDATE products
                                SET stock = stock + ?
                                WHERE id = ?
                                `,
                                [quantity, productId]
                            );
                        }

                        if (stockResult.affectedRows !== 1) {
                            const error = new Error(
                                "A stock update failed. No changes were saved."
                            );
                            error.statusCode = 409;
                            throw error;
                        }
                    }
                }

                await query(
                    `
                    UPDATE orders
                    SET status = ?,
                        stock_adjusted = ?
                    WHERE id = ?
                    `,
                    [
                        newStatus,
                        stockShouldBeAdjusted ? 1 : 0,
                        orderId
                    ]
                );

                await commit();
                transactionStarted = false;

                return res.json({
                    message: "Order status updated successfully.",
                    orderId: order.id,
                    previousStatus: order.status,
                    status: newStatus,
                    stockAdjusted: stockShouldBeAdjusted
                });

            } catch (error) {
                if (transactionStarted) {
                    try {
                        await rollback();
                    } catch (rollbackError) {
                        console.error(
                            "Status rollback error:",
                            rollbackError.message
                        );
                    }
                }

                console.error(
                    "Update order status error:",
                    error.message
                );

                if (!res.headersSent) {
                    return res.status(error.statusCode || 500).json({
                        message: error.statusCode
                            ? error.message
                            : "Unable to update the order status."
                    });
                }
            } finally {
                connection.release();
            }
        })();
    });
});


app.get(
    "/api/orders/:id/receipt",
    requireLogin,
    async (req, res) => {
        const orderId = Number(req.params.id);

        if (
            !Number.isSafeInteger(orderId) ||
            orderId <= 0
        ) {
            return res.status(400).json({
                message: "Invalid order number."
            });
        }

        try {
            const [orderRows] = await db.promise().query(
                `
                SELECT
                    o.id,
                    o.customer,
                    o.total,
                    o.status,
                    o.payment_method AS paymentMethod,
                    o.created_at AS date,
                    creator.full_name AS createdByName
                FROM orders o
                LEFT JOIN users creator
                    ON creator.id = o.created_by
                WHERE o.id = ?
                LIMIT 1
                `,
                [orderId]
            );

            if (orderRows.length === 0) {
                return res.status(404).json({
                    message: "Order not found in the database."
                });
            }

            const order = orderRows[0];

            const [items] = await db.promise().query(
                `
                SELECT
                    id,
                    product_id AS productId,
                    product_name AS productName,
                    quantity,
                    price
                FROM order_items
                WHERE order_id = ?
                ORDER BY id ASC
                `,
                [orderId]
            );

            order.items = items.map(item => ({
                ...item,
                quantity: Number(item.quantity),
                price: Number(item.price),
                lineTotal:
                    Number(item.quantity) * Number(item.price)
            }));

            order.total = Number(order.total);

            const [settingsRows] = await db.promise().query(
                `
                SELECT setting_value
                FROM app_settings
                WHERE setting_key = ?
                LIMIT 1
                `,
                ["storeSettings"]
            );

            let store = {};

            if (settingsRows.length > 0) {
                const savedValue = settingsRows[0].setting_value;

                try {
                    store =
                        typeof savedValue === "string"
                            ? JSON.parse(savedValue)
                            : savedValue || {};
                } catch (parseError) {
                    console.error(
                        "Unable to parse store settings:",
                        parseError.message
                    );
                }
            }

            const [paymentRows] = await db.promise().query(
                `
                SELECT
                    payment_method AS paymentMethod,
                    amount,
                    transaction_reference AS transactionReference,
                    status,
                    created_at AS date
                FROM payments
                WHERE order_id = ?
                ORDER BY id DESC
                LIMIT 1
                `,
                [orderId]
            );

            res.json({
                order,
                store,
                payment: paymentRows.length
                    ? paymentRows[0]
                    : null,
                printedBy: {
                    id: req.session.user.id,
                    fullName: req.session.user.fullName,
                    email: req.session.user.email,
                    role: req.session.user.role
                },
                printedAt: new Date().toISOString()
            });

        } catch (error) {
            console.error(
                "Receipt retrieval error:",
                error.message
            );

            res.status(500).json({
                message: "Unable to retrieve the receipt."
            });
        }
    }
);


const loginFolder = path.join(__dirname, "..", "POS login");
const dashboardFolder = path.join(__dirname, "..", "Updated Dashboard");

app.use(express.static(loginFolder));


app.get("/", (req, res) => {
    res.sendFile(path.join(loginFolder, "index.html"));
});


app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        
        if (
            typeof username !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Enter your username/email and password."
            });
        }

        db.query(
            `SELECT id, full_name, email, password_hash, role, status
             FROM users
             WHERE email = ? OR full_name = ?
             LIMIT 1`,
            [username.trim(), username.trim()],
            async (error, results) => {
                if (error) {
                    console.error("Login database error:", error.message);

                    return res.status(500).json({
                        message: "Unable to process login right now."
                    });
                }

                if (results.length === 0) {
                    return res.status(401).json({
                        message: "Invalid username/email or password."
                    });
                }

                const user = results[0];

                if (user.status !== "Active") {
                    return res.status(403).json({
                        message: "This account is inactive. Contact your administrator."
                    });
                }

                const passwordMatches = await bcrypt.compare(
                    password,
                    user.password_hash
                );

                if (!passwordMatches) {
                    return res.status(401).json({
                        message: "Invalid username/email or password."
                    });
                }

                req.session.regenerate((sessionError) => {
                    if (sessionError) {
                        console.error("Session error:", sessionError.message);

                        return res.status(500).json({
                            message: "Unable to start your session."
                        });
                    }

                    req.session.user = {
                        id: user.id,
                        fullName: user.full_name,
                        email: user.email,
                        role: user.role
                    };

                    req.session.save((saveError) => {
                        if (saveError) {
                            console.error("Session save error:", saveError.message);

                            return res.status(500).json({
                                message: "Unable to start your session."
                            });
                        }

                        return res.json({
                            message: "Login successful.",
                            redirect: "/dashboard/"
                        });
                    });
                });
            }
        );
    } catch (error) {
        console.error("Unexpected login error:", error.message);

        return res.status(500).json({
            message: "An unexpected error occurred."
        });
    }
});


app.get("/api/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            message: "You are not logged in."
        });
    }

    res.json({ user: req.session.user });
});

app.post("/api/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                message: "Unable to log out."
            });
        }

        res.clearCookie("connect.sid");

        res.json({ message: "Logged out successfully." });
    });
});


app.use("/dashboard", (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/");
    }

    next();
});

app.get(["/dashboard", "/dashboard/"], (req, res) => {
    const fs = require("fs");
    const dashboardFile = path.join(dashboardFolder, "index1.html");

    console.log("Dashboard folder:", dashboardFolder);
    console.log("Dashboard file:", dashboardFile);
    console.log("File exists:", fs.existsSync(dashboardFile));

    if (!fs.existsSync(dashboardFile)) {
        return res.status(404).send(
            "Dashboard file not found. Check the server terminal for its path."
        );
    }

    res.sendFile(dashboardFile, (error) => {
        if (error) {
            console.error("Dashboard loading error:", error.message);

            if (!res.headersSent) {
                res.status(error.statusCode || 500).send(
                    "Unable to load the dashboard. Check the server terminal."
                );
            }
        }
    });
});

app.use("/dashboard", express.static(dashboardFolder));


const allowedUserRoles = [
    "Administrator",
    "Manager",
    "Cashier"
];


function validateUserPassword(password) {
    if (typeof password !== "string") {
        return "Password is required.";
    }

    const requirements = [
        {
            valid: password.length >= 8,
            message: "at least 8 characters"
        },
        {
            valid: /[A-Z]/.test(password),
            message: "at least one uppercase letter (A-Z)"
        },
        {
            valid: /[a-z]/.test(password),
            message: "at least one lowercase letter (a-z)"
        },
        {
            valid: /[0-9]/.test(password),
            message: "at least one number (0-9)"
        },
        {
            valid: /[^A-Za-z0-9]/.test(password),
            message: "at least one special character"
        }
    ];

    const missing = requirements
        .filter(requirement => !requirement.valid)
        .map(requirement => requirement.message);

    if (missing.length > 0) {
        return "Password must contain " + missing.join(", ") + ".";
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
        return "Password must not exceed 72 bytes when encoded as UTF-8.";
    }

    return null;
}




app.post("/api/password-reset/request", async (req, res) => {
    const genericMessage =
        "If an account exists for that email, a password reset link will be sent.";

    const email =
        typeof req.body.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";

    if (
        !email ||
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address."
        });
    }

    if (!process.env.SMTP_USER ||
        !process.env.SMTP_PASS ||
        !process.env.APP_BASE_URL) {
        console.error("Password-reset email configuration is incomplete.");

        return res.status(500).json({
            success: false,
            message: "Password reset is temporarily unavailable. Please try again later."
        });
    }

    let tokenHash;

    try {
        const [users] = await db.promise().query(
            `SELECT id, full_name, email
             FROM users
             WHERE email = ? AND status = 'Active'
             LIMIT 1`,
            [email]
        );

        if (users.length === 0) {
            return res.status(200).json({
                success: true,
                message: genericMessage
            });
        }

        const user = users[0];

        const rawToken = crypto.randomBytes(32).toString("hex");

        tokenHash = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

        const connection = await db.promise().getConnection();

        try {
            await connection.beginTransaction();

            await connection.query(
                `UPDATE password_reset_tokens
                 SET used_at = NOW()
                 WHERE user_id = ? AND used_at IS NULL`,
                [user.id]
            );

            await connection.query(
                `INSERT INTO password_reset_tokens
                    (user_id, token_hash, expires_at, requested_ip)
                 VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 20 MINUTE), ?)`,
                [user.id, tokenHash, req.ip || null]
            );

            await connection.commit();
        } catch (databaseError) {
            await connection.rollback();
            throw databaseError;
        } finally {
            connection.release();
        }

        const baseUrl = process.env.APP_BASE_URL.replace(/\/+$/, "");
        const resetLink =
            `${baseUrl}/?token=${encodeURIComponent(rawToken)}`;

        try {
            await mailTransporter.sendMail({
                from: {
                    name: "Vendrex",
                    address: process.env.SMTP_USER
                },
                to: user.email,
                subject: "Reset your Vendrex password",
                text:
                    `Hello ${user.full_name},\n\n` +
                    "We received a request to reset your Vendrex password.\n\n" +
                    `Open this link to choose a new password:\n${resetLink}\n\n` +
                    "This link expires in 20 minutes and can only be used once.\n" +
                    "If you did not request this, you can ignore this email.",
                html: `
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#263238;">
                        <h2 style="color:#087f8c;">Vendrex Password Reset</h2>
                        <p>Hello,</p>
                        <p>We received a request to reset your Vendrex password.</p>
                        <p>
                            <a href="${resetLink}"
                               style="display:inline-block;background:#087f8c;color:#ffffff;padding:12px 20px;text-decoration:none;border-radius:6px;">
                                Reset Password
                            </a>
                        </p>
                        <p>This link expires in <strong>20 minutes</strong> and can only be used once.</p>
                        <p>If you did not request a password reset, you can ignore this email.</p>
                        <p style="color:#667085;font-size:12px;">Vendrex POS</p>
                    </div>
                `
            });
        } catch (emailError) {
            await db.promise().query(
                `UPDATE password_reset_tokens
                 SET used_at = NOW()
                 WHERE token_hash = ? AND used_at IS NULL`,
                [tokenHash]
            );

            throw emailError;
        }

        return res.status(200).json({
            success: true,
            message: genericMessage
        });
    } catch (error) {
        console.error(
            "Password-reset request failed:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Password reset is temporarily unavailable. Please try again later."
        });
    }
});


app.post("/api/password-reset/complete", async (req, res) => {
    const { token, newPassword } = req.body || {};

    if (
        typeof token !== "string" ||
        !/^[a-f0-9]{64}$/i.test(token)
    ) {
        return res.status(400).json({
            success: false,
            message: "This password reset link is invalid or expired."
        });
    }

    if (typeof newPassword !== "string") {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid new password."
        });
    }

    const passwordError = validateUserPassword(newPassword);

    if (passwordError) {
        return res.status(400).json({
            success: false,
            message: passwordError
        });
    }

    const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    let connection;

    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        const [tokens] = await connection.query(
            `SELECT prt.id, prt.user_id
             FROM password_reset_tokens AS prt
             INNER JOIN users AS u ON u.id = prt.user_id
             WHERE prt.token_hash = ?
               AND prt.used_at IS NULL
               AND prt.expires_at > NOW()
               AND u.status = 'Active'
             LIMIT 1
             FOR UPDATE`,
            [tokenHash]
        );

        if (tokens.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "This password reset link is invalid or expired. Please request a new one."
            });
        }

        const resetRecord = tokens[0];

        const passwordHash = await bcrypt.hash(newPassword, 12);

        await connection.query(
            `UPDATE users
             SET password_hash = ?
             WHERE id = ?`,
            [passwordHash, resetRecord.user_id]
        );

        await connection.query(
            `UPDATE password_reset_tokens
             SET used_at = NOW()
             WHERE id = ?`,
            [resetRecord.id]
        );

        await connection.query(
            `UPDATE password_reset_tokens
             SET used_at = NOW()
             WHERE user_id = ?
               AND used_at IS NULL`,
            [resetRecord.user_id]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Your password has been reset successfully. You can now log in with your new password."
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error(
            "Password-reset completion failed:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to reset your password right now. Please try again."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


function isValidUserId(id) {
    return /^[1-9]\d*$/.test(id);
}

function getPublicUser(user) {
    return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}



app.get("/api/users", requireUserManagementView, (req, res) => {
    const sql = `
        SELECT
            id,
            full_name AS fullName,
            email,
            role,
            status,
            profile_image_url AS profileImageUrl,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM users
        ORDER BY id DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error("Failed to fetch users:", error.message);

            return res.status(500).json({
                message: "Failed to load users."
            });
        }

        res.json(results.map(getPublicUser));
    });
});



app.post("/api/users", requireAdministrator, (req, res) => {
    let { fullName, email, password, role } = req.body;

    if (
        typeof fullName !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        typeof role !== "string"
    ) {
        return res.status(400).json({
            message: "Please provide all required user details."
        });
    }

    fullName = fullName.trim();
    email = email.trim().toLowerCase();

    if (!fullName || !email || !password || !role) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    if (fullName.length > 180 || email.length > 255) {
        return res.status(400).json({
            message: "The name or email address is too long."
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
            message: "Please enter a valid email address."
        });
    }

    const passwordError = validateUserPassword(password);

    if (passwordError) {
        return res.status(400).json({
            message: passwordError
        });
    }

    if (!allowedUserRoles.includes(role)) {
        return res.status(400).json({
            message: "Invalid user role."
        });
    }

    bcrypt.hash(password, 12, (hashError, passwordHash) => {
        if (hashError) {
            console.error("Password hashing failed:", hashError.message);

            return res.status(500).json({
                message: "Could not create the user."
            });
        }

        const sql = `
            INSERT INTO users
                (full_name, email, password_hash, role, status)
            VALUES (?, ?, ?, ?, 'Active')
        `;

        db.query(
            sql,
            [fullName, email, passwordHash, role],
            (error, result) => {
                if (error) {
                    if (error.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({
                            message: "A user with this email already exists."
                        });
                    }

                    console.error("Failed to create user:", error.message);

                    return res.status(500).json({
                        message: "Failed to create user."
                    });
                }

                res.status(201).json({
                    message: "User created successfully.",
                    id: result.insertId
                });
            }
        );
    });
});



app.put("/api/users/:id", requireAdministrator, (req, res) => {
    const id = req.params.id;
    let { fullName, email, role, password } = req.body;

    if (!isValidUserId(id)) {
        return res.status(400).json({
            message: "Invalid user ID."
        });
    }

    if (
        typeof fullName !== "string" ||
        typeof email !== "string" ||
        typeof role !== "string"
    ) {
        return res.status(400).json({
            message: "Name, email, and role are required."
        });
    }

    fullName = fullName.trim();
    email = email.trim().toLowerCase();

    if (!fullName || !email || !role) {
        return res.status(400).json({
            message: "Name, email, and role cannot be empty."
        });
    }

    if (fullName.length > 180 || email.length > 255) {
        return res.status(400).json({
            message: "The name or email address is too long."
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
            message: "Please enter a valid email address."
        });
    }

    if (!allowedUserRoles.includes(role)) {
        return res.status(400).json({
            message: "Invalid user role."
        });
    }

    if (password === undefined || password === null) {
        password = "";
    }

    if (typeof password !== "string") {
        return res.status(400).json({
            message: "Invalid password."
        });
    }

    if (password !== "") {
        const passwordError = validateUserPassword(password);

        if (passwordError) {
            return res.status(400).json({
                message: passwordError
            });
        }
    }

    db.query(
        "SELECT id, role FROM users WHERE id = ? LIMIT 1",
        [id],
        (findError, users) => {
            if (findError) {
                console.error("User lookup failed:", findError.message);

                return res.status(500).json({
                    message: "Could not find the user."
                });
            }

            if (users.length === 0) {
                return res.status(404).json({
                    message: "User not found."
                });
            }

            const existingUser = users[0];

            if (
                String(existingUser.id) === String(req.session.user.id) &&
                role !== "Administrator"
            ) {
                return res.status(400).json({
                    message: "You cannot remove your own Administrator role."
                });
            }

           
            if (
                existingUser.role === "Administrator" &&
                role !== "Administrator"
            ) {
                return res.status(400).json({
                    message: "Administrator accounts cannot be demoted here."
                });
            }

            function updateUser(passwordHash = null) {
                let sql;
                let values;

                if (passwordHash !== null) {
                    sql = `
                        UPDATE users
                        SET full_name = ?,
                            email = ?,
                            role = ?,
                            password_hash = ?
                        WHERE id = ?
                    `;

                    values = [
                        fullName,
                        email,
                        role,
                        passwordHash,
                        id
                    ];
                } else {
                    sql = `
                        UPDATE users
                        SET full_name = ?,
                            email = ?,
                            role = ?
                        WHERE id = ?
                    `;

                    values = [fullName, email, role, id];
                }

                db.query(sql, values, (updateError) => {
                    if (updateError) {
                        if (updateError.code === "ER_DUP_ENTRY") {
                            return res.status(409).json({
                                message:
                                    "A user with this email already exists."
                            });
                        }

                        console.error(
                            "Failed to update user:",
                            updateError.message
                        );

                        return res.status(500).json({
                            message: "Failed to update user."
                        });
                    }

                    res.json({
                        message: "User updated successfully."
                    });
                });
            }

            if (password !== "") {
                bcrypt.hash(password, 12, (hashError, passwordHash) => {
                    if (hashError) {
                        console.error(
                            "Password hashing failed:",
                            hashError.message
                        );

                        return res.status(500).json({
                            message: "Could not update the password."
                        });
                    }

                    updateUser(passwordHash);
                });
            } else {
                updateUser();
            }
        }
    );
});



app.patch(
    "/api/users/:id/status",
    requireAdministrator,
    (req, res) => {
        const id = req.params.id;
        const { status } = req.body;

        if (!isValidUserId(id)) {
            return res.status(400).json({
                message: "Invalid user ID."
            });
        }

        if (!["Active", "Inactive"].includes(status)) {
            return res.status(400).json({
                message: "Status must be Active or Inactive."
            });
        }

        db.query(
            "SELECT id, role FROM users WHERE id = ? LIMIT 1",
            [id],
            (findError, users) => {
                if (findError) {
                    console.error(
                        "User lookup failed:",
                        findError.message
                    );

                    return res.status(500).json({
                        message: "Could not find the user."
                    });
                }

                if (users.length === 0) {
                    return res.status(404).json({
                        message: "User not found."
                    });
                }

                const targetUser = users[0];


                if (
                    String(targetUser.id) ===
                    String(req.session.user.id) &&
                    status === "Inactive"
                ) {
                    return res.status(400).json({
                        message: "You cannot deactivate your own account."
                    });
                }


                if (
                    targetUser.role === "Administrator" &&
                    status === "Inactive"
                ) {
                    return res.status(400).json({
                        message: "Administrator accounts cannot be deactivated."
                    });
                }

                db.query(
                    "UPDATE users SET status = ? WHERE id = ?",
                    [status, id],
                    (updateError) => {
                        if (updateError) {
                            console.error(
                                "Failed to change user status:",
                                updateError.message
                            );

                            return res.status(500).json({
                                message: "Failed to change user status."
                            });
                        }
                        res.json({
                            message: `User ${status.toLowerCase()} successfully.`,
                            status
                        });
                    }
                );
            }
        );
    }
);

app.get("/api/notifications", requireLogin, async (req, res) => {
    const userId = req.session.user.id;
    const role = req.session.user.role;

    try {
        const [settingsRows] = await db.promise().query(
            `SELECT setting_value
             FROM app_settings
             WHERE setting_key = ?
             LIMIT 1`,
            ["orderSettings"]
        );

        let lowStockThreshold = 5;

        if (settingsRows.length > 0) {
            const saved = settingsRows[0].setting_value;

            const settings = typeof saved === "string"
                ? JSON.parse(saved)
                : saved;

            const threshold = Number(settings?.lowStockThreshold);

            if (Number.isInteger(threshold) && threshold >= 0) {
                lowStockThreshold = threshold;
            }
        }
        
        
        async function saveNotification(
            type,
            title,
            message,
            entityType,
            entityId,
            notificationKey
        ) {
            await db.promise().query(
                `INSERT INTO notifications (
                    user_id,
                    type,
                    title,
                    message,
                    entity_type,
                    entity_id,
                    notification_key
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    id = id`,
                [
                    userId,
                    type,
                    title,
                    message,
                    entityType,
                    entityId,
                    notificationKey
                ]
            );
        }


        const [openOrders] = await db.promise().query(
            `SELECT id, customer, total, status
             FROM orders
             WHERE status IN ('Pending', 'Processing')
             ORDER BY created_at DESC`,
        );

        for (const order of openOrders) {
            const isPending = order.status === "Pending";

            await saveNotification(
                isPending ? "Order Pending" : "Order Processing",
                `${order.status} order #${order.id}`,
                `${order.customer} — ${Number(order.total).toFixed(2)}`,
                "order",
                order.id,
                `order-${order.status.toLowerCase()}-${order.id}`
            );
        }

        const [stockProducts] = await db.promise().query(
            `SELECT id, name, stock
             FROM products
             WHERE stock = 0 OR stock <= ?
             ORDER BY stock ASC, name ASC`,
            [lowStockThreshold]
        );

        for (const product of stockProducts) {
            const outOfStock = Number(product.stock) === 0;

            await saveNotification(
                outOfStock ? "Out of Stock" : "Low Stock",
                outOfStock
                    ? `${product.name} is out of stock`
                    : `${product.name} has low stock`,
                outOfStock
                    ? "This product needs replenishment."
                    : `Only ${product.stock} unit(s) remain.`,
                "product",
                product.id,
                `stock-${outOfStock ? "out" : "low"}-${product.id}`
            );
        }

        const [completedOrders] = await db.promise().query(
            `SELECT id, customer, total, payment_method
             FROM orders
             WHERE status = 'Completed'
               AND created_at >= CURDATE()
               AND created_at < CURDATE() + INTERVAL 1 DAY
             ORDER BY created_at DESC`
        );

        for (const order of completedOrders) {
            await saveNotification(
                "Order Completed",
                `Order #${order.id} completed`,
                `${order.customer} — ${Number(order.total).toFixed(2)} via ${order.payment_method}`,
                "order",
                order.id,
                `order-completed-${order.id}`
            );
        }

        if (["Administrator", "Manager"].includes(role)) {
            const [inactiveUsers] = await db.promise().query(
                `SELECT id, full_name
                 FROM users
                 WHERE status = 'Inactive'
                 ORDER BY full_name`
            );

            for (const inactiveUser of inactiveUsers) {
                await saveNotification(
                    "User Inactive",
                    `${inactiveUser.full_name} is inactive`,
                    "This account is currently inactive.",
                    "user",
                    inactiveUser.id,
                    `user-inactive-${inactiveUser.id}`
                );
            }
        }

        const [notifications] = await db.promise().query(
            `SELECT
                id,
                type,
                title,
                message,
                entity_type AS entityType,
                entity_id AS entityId,
                is_read AS isRead,
                created_at AS date,
                read_at AS readAt
             FROM notifications
             WHERE user_id = ?
             ORDER BY created_at DESC, id DESC
             LIMIT 200`,
            [userId]
        );

        res.json({
            notifications: notifications.map(item => ({
                ...item,
                isRead: Boolean(item.isRead)
            })),
            unreadCount: notifications.filter(
                item => !item.isRead
            ).length
        });

    } catch (error) {
        console.error("Fetch notifications error:", error.message);

        res.status(500).json({
            message: "Unable to load notifications."
        });
    }
});



app.patch(
    "/api/notifications/:id/read",
    requireLogin,
    async (req, res) => {
        const notificationId = req.params.id;
        const userId = req.session.user.id;

        if (!/^[1-9]\d*$/.test(notificationId)) {
            return res.status(400).json({
                message: "Invalid notification ID."
            });
        }

        try {
            const [result] = await db.promise().query(
                `UPDATE notifications
                 SET is_read = TRUE,
                     read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
                 WHERE id = ?
                   AND user_id = ?`,
                [notificationId, userId]
            );

            if (result.affectedRows === 0) {
                const [rows] = await db.promise().query(
                    `SELECT id
                     FROM notifications
                     WHERE id = ? AND user_id = ?
                     LIMIT 1`,
                    [notificationId, userId]
                );

                if (rows.length === 0) {
                    return res.status(404).json({
                        message: "Notification not found."
                    });
                }
            }

            res.json({
                message: "Notification marked as read."
            });

        } catch (error) {
            console.error("Mark notification read error:", error.message);

            res.status(500).json({
                message: "Unable to update notification."
            });
        }
    }
);


app.patch("/api/notifications/read-all", requireLogin, async (req, res) => {
    const userId = req.session.user.id;

    try {
        await db.promise().query(
            `UPDATE notifications
             SET is_read = TRUE,
                 read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
             WHERE user_id = ?
               AND is_read = FALSE`,
            [userId]
        );

        res.json({
            message: "All notifications marked as read."
        });

    } catch (error) {
        console.error("Mark all notifications as read error:", error);

        res.status(500).json({
            message: "Unable to mark notifications as read."
        });
    }
});



const server = app.listen(PORT, () => {
    console.log("EXPRESS SERVER IS RUNNING");
    console.log(`Vendrex POS server running at http://localhost:${PORT}`);
});


server.on("error", (error) => {
    console.error("SERVER STARTUP ERROR:", error.message);
});
 


app.get("/api/settings", requireLogin, (req, res) => {
    const sql = `
        SELECT setting_key, setting_value
        FROM app_settings
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error("Error loading settings:", error.message);

            return res.status(500).json({
                message: "Failed to load settings."
            });
        }

        const settings = {};

        results.forEach((row) => {
            settings[row.setting_key] =
                typeof row.setting_value === "string"
                    ? JSON.parse(row.setting_value)
                    : row.setting_value;
        });

        res.json(settings);
    });
});


app.put("/api/settings", requireLogin, (req, res) => {
    const { settingKey, settingValue } = req.body;

    const allowedSettings = [
        "storeSettings",
        "orderSettings",
        "paymentSettings"
    ];

    if (
        !allowedSettings.includes(settingKey) ||
        settingValue === undefined ||
        settingValue === null ||
        typeof settingValue !== "object" ||
        Array.isArray(settingValue)
    ) {
        return res.status(400).json({
            message: "Invalid settings data."
        });
    }

    const sql = `
        INSERT INTO app_settings (setting_key, setting_value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
            setting_value = VALUES(setting_value)
    `;

    db.query(
        sql,
        [settingKey, JSON.stringify(settingValue)],
        (error) => {
            if (error) {
                console.error("Error saving settings:", error.message);

                return res.status(500).json({
                    message: "Failed to save settings."
                });
            }

            res.json({
                message: "Settings saved successfully.",
                settingKey
            });
        }
    );
});


const crypto = require("crypto");

const mtnConfig = {
    baseUrl: (
        process.env.MTN_BASE_URL ||
        "https://sandbox.momodeveloper.mtn.com"
    ).replace(/\/+$/, ""),
    targetEnv:
        process.env.MTN_TARGET_ENVIRONMENT ||
        process.env.MTN_TARGET_ENV ||
        "sandbox",
    subscriptionKey: process.env.MTN_SUBSCRIPTION_KEY,
    apiUser: process.env.MTN_API_USER,
    apiKey: process.env.MTN_API_KEY,
    currency: process.env.MTN_CURRENCY || "EUR",
    callbackUrl: process.env.MTN_CALLBACK_URL || "",
    countryCode: process.env.MTN_COUNTRY_CODE || "256"
};

class MomoError extends Error {
    constructor(message, httpStatus) {
        super(message);
        this.name = "MomoError";
        this.httpStatus = httpStatus || null;
    }
}

function mtnAssertConfigured() {
    const missing = [];

    if (!mtnConfig.subscriptionKey) missing.push("MTN_SUBSCRIPTION_KEY");
    if (!mtnConfig.apiUser) missing.push("MTN_API_USER");
    if (!mtnConfig.apiKey) missing.push("MTN_API_KEY");

    if (missing.length > 0) {
        throw new MomoError(
            "MTN is not configured. Missing in .env: " + missing.join(", ")
        );
    }
}

async function mtnFetch(path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
        return await fetch(mtnConfig.baseUrl + path, {
            ...options,
            signal: controller.signal
        });
    } catch (error) {
        if (error.name === "AbortError") {
            throw new MomoError("MTN did not respond in time.");
        }

        throw new MomoError("Could not reach MTN: " + error.message);
    } finally {
        clearTimeout(timer);
    }
}

async function mtnReadBody(response) {
    const text = await response.text();

    if (!text) return {};

    try {
        return JSON.parse(text);
    } catch {
        return { raw: text.slice(0, 300) };
    }
}

let mtnCachedToken = null;
let mtnTokenExpiresAt = 0;

async function mtnGetAccessToken() {
    mtnAssertConfigured();

    if (mtnCachedToken && Date.now() < mtnTokenExpiresAt) {
        return mtnCachedToken;
    }

    const basic = Buffer
        .from(mtnConfig.apiUser + ":" + mtnConfig.apiKey)
        .toString("base64");

    const response = await mtnFetch("/collection/token/", {
        method: "POST",
        headers: {
            Authorization: "Basic " + basic,
            "Ocp-Apim-Subscription-Key": mtnConfig.subscriptionKey
        }
    });

    const body = await mtnReadBody(response);

        if (!response.ok || !body.access_token) {
        throw new MomoError(
            "MTN token request failed (HTTP " + response.status + "): " +
            (body.message || body.error || body.raw || "no details"),
            response.status
        );
    }

    const lifetime = Number(body.expires_in) || 3600;

    mtnCachedToken = body.access_token;
    mtnTokenExpiresAt = Date.now() + Math.max(lifetime - 60, 30) * 1000;

    return mtnCachedToken;
}

function mtnNormalizePhone(input) {
    let digits = String(input || "").replace(/\D/g, "");

    if (digits.startsWith("00")) digits = digits.slice(2);

    if (digits.startsWith("0")) {
        digits = mtnConfig.countryCode + digits.slice(1);
    } else if (
        digits.length === 9 &&
        !digits.startsWith(mtnConfig.countryCode)
    ) {
        digits = mtnConfig.countryCode + digits;
    }

    if (digits.length < 10 || digits.length > 15) {
        throw new MomoError("Enter a valid mobile money number.");
    }

    return digits;
}

function mtnFormatAmount(amount) {
    const value = Number(amount);

    if (!Number.isFinite(value) || value <= 0) {
        throw new MomoError("The payment amount must be greater than zero.");
    }

    return mtnConfig.currency === "UGX"
        ? String(Math.round(value))
        : value.toFixed(2);
}

async function mtnRequestToPay({ amount, phone, orderId, referenceId }) {
    const token = await mtnGetAccessToken();

    const msisdn = mtnNormalizePhone(phone);
    const reference = referenceId || crypto.randomUUID();

    const headers = {
        Authorization: "Bearer " + token,
        "X-Reference-Id": reference,
        "X-Target-Environment": mtnConfig.targetEnv,
        "Ocp-Apim-Subscription-Key": mtnConfig.subscriptionKey,
        "Content-Type": "application/json"
    };

    if (mtnConfig.callbackUrl) {
        headers["X-Callback-Url"] = mtnConfig.callbackUrl;
    }

    const response = await mtnFetch("/collection/v1_0/requesttopay", {
        method: "POST",
        headers,
        body: JSON.stringify({
            amount: mtnFormatAmount(amount),
            currency: mtnConfig.currency,
            externalId: String(orderId),
            payer: { partyIdType: "MSISDN", partyId: msisdn },
            payerMessage: "Payment for order " + orderId,
            payeeNote: "Order " + orderId
        })
    });

    if (response.status !== 202) {
        const body = await mtnReadBody(response);

        throw new MomoError(
            "MTN rejected the payment request (HTTP " + response.status +
            "): " + (body.message || body.code || body.raw || "no details"),
            response.status
        );
    }

    return {
        referenceId: reference,
        phone: msisdn,
        currency: mtnConfig.currency
    };
}

function mtnDescribeReason(reason) {
    if (!reason) return null;

    if (typeof reason === "string") return reason.slice(0, 255);

    return String(reason.message || reason.code || "Payment failed")
        .slice(0, 255);
}

async function mtnGetStatus(referenceId) {
    const token = await mtnGetAccessToken();

    const response = await mtnFetch(
        "/collection/v1_0/requesttopay/" + encodeURIComponent(referenceId),
        {
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
                "X-Target-Environment": mtnConfig.targetEnv,
                "Ocp-Apim-Subscription-Key": mtnConfig.subscriptionKey
            }
        }
    );

    const body = await mtnReadBody(response);

    if (!response.ok) {
        throw new MomoError(
            "MTN status check failed (HTTP " + response.status + ").",
            response.status
        );
    }

    const providerStatus = String(body.status || "").toUpperCase();

    let status = "Pending";

    if (providerStatus === "SUCCESSFUL") status = "Successful";
    else if (providerStatus === "FAILED") status = "Failed";

    return {
        status,
        providerStatus,
        transactionId: body.financialTransactionId || null,
        reason: status === "Failed"
            ? mtnDescribeReason(body.reason) || "Payment was not approved."
            : null
    };
}



app.post(
    "/api/orders/:id/mtn-payment",
    requireLogin,
    async (req, res) => {
        const orderId = req.params.id;
        const { phone } = req.body;

        if (!/^[1-9]\d*$/.test(orderId)) {
            return res.status(400).json({
                message: "Invalid order ID."
            });
        }

        if (typeof phone !== "string" || !phone.trim()) {
            return res.status(400).json({
                message: "Enter the customer's mobile money number."
            });
        }

        let msisdn;

        try {
            msisdn = mtnNormalizePhone(phone);
        } catch (error) {
            return res.status(400).json({
                message: error.message
            });
        }

        let connection;

        try {
            connection = await db.promise().getConnection();

            await connection.beginTransaction();

            const [orders] = await connection.query(
                `
                SELECT id, total, status, payment_method AS paymentMethod
                FROM orders
                WHERE id = ?
                FOR UPDATE
                `,
                [orderId]
            );

            if (orders.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    message: "Order not found."
                });
            }

            const order = orders[0];

            if (order.paymentMethod !== "Mobile Money") {
                await connection.rollback();

                return res.status(400).json({
                    message: "This order is not a Mobile Money order."
                });
            }

            if (order.status !== "Pending") {
                await connection.rollback();

                return res.status(409).json({
                    message: "Only pending orders can start a payment request."
                });
            }

            const [payments] = await connection.query(
                `
                SELECT id, amount, status, transaction_reference AS reference
                FROM payments
                WHERE order_id = ?
                  AND payment_method = 'Mobile Money'
                ORDER BY id DESC
                LIMIT 1
                FOR UPDATE
                `,
                [orderId]
            );

            if (payments.length === 0) {
                await connection.rollback();

                return res.status(409).json({
                    message: "The order has no Mobile Money payment record."
                });
            }

            const payment = payments[0];

            if (payment.status === "Successful") {
                await connection.rollback();

                return res.status(409).json({
                    message: "This order has already been paid."
                });
            }

            if (payment.reference && payment.status === "Pending") {
                await connection.rollback();

                return res.status(409).json({
                    message: "A payment request already exists. Check its status before retrying.",
                    orderId: order.id,
                    referenceId: payment.reference
                });
            }

            const referenceId = crypto.randomUUID();

            await connection.query(
                `
                UPDATE payments
                SET transaction_reference = ?,
                    status = 'Pending',
                    amount = ?
                WHERE id = ?
                `,
                [
                    referenceId,
                    Number(order.total).toFixed(2),
                    payment.id
                ]
            );

            await connection.commit();

            const request = await mtnRequestToPay({
                amount: Number(order.total),
                phone: msisdn,
                orderId: order.id,
                referenceId
            });

            return res.status(202).json({
                message: "Payment request sent. Ask the customer to approve it on their phone.",
                orderId: order.id,
                amount: Number(order.total),
                currency: request.currency,
                phone: request.phone,
                referenceId: request.referenceId,
                paymentStatus: "Pending"
            });

        } catch (error) {
            if (connection) {
                try {
                    await connection.rollback();
                } catch {
                }
            }

            console.error(
                "MTN payment initiation error:",
                error.message
            );

            return res.status(error instanceof MomoError ? 502 : 500).json({
                message: "Unable to confirm that the MTN payment request was accepted. Check the payment status before trying again."
            });

        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
);


app.get(
    "/api/orders/:id/mtn-payment/status",
    requireLogin,
    async (req, res) => {
        const orderId = req.params.id;

        if (!/^[1-9]\d*$/.test(orderId)) {
            return res.status(400).json({
                message: "Invalid order ID."
            });
        }

        let connection;

        try {
            const [payments] = await db.promise().query(
                `
                SELECT
                    p.id,
                    p.order_id AS orderId,
                    p.amount,
                    p.transaction_reference AS referenceId,
                    p.status AS paymentStatus,
                    o.status AS orderStatus,
                    o.payment_method AS paymentMethod
                FROM payments p
                INNER JOIN orders o ON o.id = p.order_id
                WHERE p.order_id = ?
                  AND p.payment_method = 'Mobile Money'
                ORDER BY p.id DESC
                LIMIT 1
                `,
                [orderId]
            );

            if (payments.length === 0) {
                return res.status(404).json({
                    message: "No Mobile Money payment was found for this order."
                });
            }

            const payment = payments[0];

            if (payment.paymentMethod !== "Mobile Money") {
                return res.status(400).json({
                    message: "This order is not a Mobile Money order."
                });
            }

            if (!payment.referenceId) {
                return res.status(409).json({
                    message: "No MTN payment request has been initiated for this order."
                });
            }

            const providerResult = await mtnGetStatus(
                payment.referenceId
            );

            connection = await db.promise().getConnection();
            await connection.beginTransaction();

            const [lockedPayments] = await connection.query(
                `
                SELECT id, status
                FROM payments
                WHERE id = ?
                  AND order_id = ?
                  AND transaction_reference = ?
                FOR UPDATE
                `,
                [
                    payment.id,
                    orderId,
                    payment.referenceId
                ]
            );

            if (lockedPayments.length === 0) {
                await connection.rollback();

                return res.status(409).json({
                    message: "The payment record changed. Please check its status again."
                });
            }

            const currentStatus = lockedPayments[0].status;
            let finalStatus = currentStatus;

            if (currentStatus === "Successful") {
                finalStatus = "Successful";
            } else if (
                providerResult.status === "Successful" ||
                providerResult.status === "Failed"
            ) {
                finalStatus = providerResult.status;

                await connection.query(
                    `
                    UPDATE payments
                    SET status = ?
                    WHERE id = ?
                      AND order_id = ?
                      AND transaction_reference = ?
                    `,
                    [
                        finalStatus,
                        payment.id,
                        orderId,
                        payment.referenceId
                    ]
                );
            }

            await connection.commit();

            return res.json({
                message: finalStatus === "Successful"
                    ? "MTN has confirmed successful payment."
                    : finalStatus === "Failed"
                        ? "MTN reports that the payment failed."
                        : "Payment is still pending confirmation.",
                orderId: Number(orderId),
                paymentStatus: finalStatus,
                orderStatus: payment.orderStatus,
                referenceId: payment.referenceId,
                reason: finalStatus === "Failed"
                    ? providerResult.reason
                    : null
            });

        } catch (error) {
            if (connection) {
                try {
                    await connection.rollback();
                } catch {
                }
            }

            console.error(
                "MTN payment verification error:",
                error.message
            );

            return res.status(
                error instanceof MomoError ? 502 : 500
            ).json({
                message: "Unable to verify the payment with MTN. Please try again."
            });

        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
);


app.get("/api/mtn-test", requireAdministrator, async (req, res) => {
    try {
        const phone = req.query.phone;
        const amount = req.query.amount || "10";

        const request = await mtnRequestToPay({
            amount,
            phone,
            orderId: "TEST-" + Date.now()
        });

        let result = null;

        for (let attempt = 1; attempt <= 5; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 3000));

            result = await mtnGetStatus(request.referenceId);

            if (result.status !== "Pending") {
                break;
            }
        }

        res.json({ request, result });

    } catch (error) {
        console.error("MTN test error:", error.message);

        res.status(500).json({ message: error.message });
    }
});

app.get("/api/mtn-create-user", requireAdministrator, async (req, res) => {
    try {
        const newUser = crypto.randomUUID();

        const createResponse = await mtnFetch("/v1_0/apiuser", {
            method: "POST",
            headers: {
                "X-Reference-Id": newUser,
                "Ocp-Apim-Subscription-Key": mtnConfig.subscriptionKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ providerCallbackHost: "example.com" })
        });

        if (createResponse.status !== 201) {
            const body = await mtnReadBody(createResponse);

            return res.status(500).json({
                message: "Could not create API user (HTTP " +
                    createResponse.status + ")",
                details: body
            });
        }

        const keyResponse = await mtnFetch(
            "/v1_0/apiuser/" + newUser + "/apikey",
            {
                method: "POST",
                headers: {
                    "Ocp-Apim-Subscription-Key": mtnConfig.subscriptionKey
                }
            }
        );

        const keyBody = await mtnReadBody(keyResponse);

        if (!keyResponse.ok || !keyBody.apiKey) {
            return res.status(500).json({
                message: "Could not create API key (HTTP " +
                    keyResponse.status + ")",
                details: keyBody
            });
        }

        res.json({
            MTN_API_USER: newUser,
            MTN_API_KEY: keyBody.apiKey
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
