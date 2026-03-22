const request = require("supertest");
const app = require("../app");
const Order = require("../models/Order");

// Mock the Order model - no real DB needed
jest.mock("../models/Order");

// Mock all 3 external service clients
jest.mock("../services/userServiceClient");
jest.mock("../services/productServiceClient");
jest.mock("../services/notificationServiceClient");

const { getUserById } = require("../services/userServiceClient");
const {
  getProductById,
  reduceStock,
} = require("../services/productServiceClient");
const {
  sendOrderNotification,
} = require("../services/notificationServiceClient");

// ─────────────────────────────────────────────────────────
// Sample test data
// ─────────────────────────────────────────────────────────
const sampleOrder = {
  _id: "64f1a2b3c4d5e6f7a8b9c0d1",
  userId: "64f1a2b3c4d5e6f7a8b9c0d2",
  userName: "Alice Fernando",
  userEmail: "alice@example.com",
  productId: "64f1a2b3c4d5e6f7a8b9c0d3",
  productName: "Wireless Headphones",
  quantity: 2,
  unitPrice: 4500,
  totalPrice: 9000,
  status: "confirmed",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const mockUser = {
  success: true,
  data: {
    _id: "64f1a2b3c4d5e6f7a8b9c0d2",
    name: "Alice Fernando",
    email: "alice@example.com",
  },
};

const mockProduct = {
  success: true,
  data: {
    _id: "64f1a2b3c4d5e6f7a8b9c0d3",
    name: "Wireless Headphones",
    price: 4500,
    stock: 50,
  },
};

const validOrderPayload = {
  userId: "64f1a2b3c4d5e6f7a8b9c0d2",
  productId: "64f1a2b3c4d5e6f7a8b9c0d3",
  quantity: 2,
};

// ─────────────────────────────────────────────────────────
// GET /health
// ─────────────────────────────────────────────────────────
describe("GET /health", () => {
  it("should return healthy status", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe("order-service");
    expect(res.body.status).toBe("healthy");
    expect(res.body.timestamp).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────
// GET /orders
// ─────────────────────────────────────────────────────────
describe("GET /orders", () => {
  it("should return all orders successfully", async () => {
    Order.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([sampleOrder]),
    });

    const res = await request(app).get("/orders");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.data).toHaveLength(1);
  });

  it("should return empty array when no orders exist", async () => {
    Order.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([]),
    });

    const res = await request(app).get("/orders");
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.data).toHaveLength(0);
  });

  it("should return 500 when database throws error", async () => {
    Order.find.mockReturnValue({
      sort: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    const res = await request(app).get("/orders");
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// GET /orders/:id
// ─────────────────────────────────────────────────────────
describe("GET /orders/:id", () => {
  it("should return a single order by ID", async () => {
    Order.findById.mockResolvedValue(sampleOrder);

    const res = await request(app).get("/orders/64f1a2b3c4d5e6f7a8b9c0d1");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe("64f1a2b3c4d5e6f7a8b9c0d1");
  });

  it("should return 404 when order is not found", async () => {
    Order.findById.mockResolvedValue(null);

    const res = await request(app).get("/orders/64f1a2b3c4d5e6f7a8b9c0d9");
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("should return 404 for invalid ObjectId format", async () => {
    const castError = new Error("Cast error");
    castError.name = "CastError";
    Order.findById.mockRejectedValue(castError);

    const res = await request(app).get("/orders/invalid-id");
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("should return 500 when database throws error", async () => {
    Order.findById.mockRejectedValue(new Error("DB error"));

    const res = await request(app).get("/orders/64f1a2b3c4d5e6f7a8b9c0d1");
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────
// POST /orders
// ─────────────────────────────────────────────────────────
describe("POST /orders", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    getUserById.mockResolvedValue(mockUser);
    getProductById.mockResolvedValue(mockProduct);
    reduceStock.mockResolvedValue({ success: true });
    sendOrderNotification.mockResolvedValue({ success: true });
    Order.create.mockResolvedValue(sampleOrder);
  });

  it("should create an order successfully", async () => {
    const res = await request(app).post("/orders").send(validOrderPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Order created successfully");
    expect(res.body.data.userId).toBe(sampleOrder.userId);
  });

  it("should return 400 when userId is missing", async () => {
    const res = await request(app)
      .post("/orders")
      .send({ productId: validOrderPayload.productId, quantity: 2 });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Please provide userId, productId, and quantity",
    );
  });

  it("should return 400 when productId is missing", async () => {
    const res = await request(app)
      .post("/orders")
      .send({ userId: validOrderPayload.userId, quantity: 2 });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 when quantity is missing", async () => {
    const res = await request(app)
      .post("/orders")
      .send({
        userId: validOrderPayload.userId,
        productId: validOrderPayload.productId,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 when quantity is zero or negative", async () => {
    const res = await request(app)
      .post("/orders")
      .send({ ...validOrderPayload, quantity: -1 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Quantity must be a positive number");
  });

  it("should return 404 when user is not found", async () => {
    getUserById.mockResolvedValue({
      success: false,
      message: "User not found",
    });

    const res = await request(app).post("/orders").send(validOrderPayload);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toContain("User not found");
  });

  it("should return 404 when product is not found", async () => {
    getProductById.mockResolvedValue({
      success: false,
      message: "Product not found",
    });

    const res = await request(app).post("/orders").send(validOrderPayload);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toContain("Product not found");
  });

  it("should return 400 when stock is insufficient", async () => {
    getProductById.mockResolvedValue({
      success: true,
      data: { ...mockProduct.data, stock: 1 },
    });

    const res = await request(app)
      .post("/orders")
      .send({ ...validOrderPayload, quantity: 5 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("Insufficient stock");
  });

  it("should return 500 when order DB save fails", async () => {
    Order.create.mockRejectedValue(new Error("DB write error"));

    const res = await request(app).post("/orders").send(validOrderPayload);

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it("should still succeed even if notification service fails", async () => {
    sendOrderNotification.mockResolvedValue({
      success: false,
      message: "Notification failed but order was created",
    });

    const res = await request(app).post("/orders").send(validOrderPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────
// Unknown routes
// ─────────────────────────────────────────────────────────
describe("Unknown routes", () => {
  it("should return 404 for unknown route", async () => {
    const res = await request(app).get("/unknown-route");
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Route not found");
  });
});
