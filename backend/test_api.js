// Automated API Endpoint Verification Script for Lumina Luxe

const { spawn } = require('child_process');
const path = require('path');

const PORT = 3080;
let serverProcess = null;
let savedCookie = '';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Simple test assertion helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✓ PASS: ${message}`);
}

async function runTests() {
  console.log("\n==============================================");
  console.log("   LUMINA LUXE - AUTOMATED API TEST SUITE");
  console.log("==============================================\n");

  const baseUrl = `http://localhost:${PORT}`;

  try {
    // --------------------------------------------------
    // TEST 1: Fetch Products Catalog
    // --------------------------------------------------
    console.log("Test 1: Fetch products catalog list...");
    const productsRes = await fetch(`${baseUrl}/api/products`);
    assert(productsRes.status === 200, "Products listing returns 200 OK");
    
    const products = await productsRes.json();
    assert(Array.isArray(products) && products.length === 6, "Catalog contains exactly 6 products");
    assert(products[0].name === "Lumina SoundWave ANC", "First item is Lumina Headphones");
    
    // Test categories and sorting
    const searchRes = await fetch(`${baseUrl}/api/products?search=Keyboard`);
    const searchResult = await searchRes.json();
    assert(searchResult.length === 1 && searchResult[0].name === "AuraFlow Keyboard", "Product search query 'Keyboard' returns 1 item");

    const categoryRes = await fetch(`${baseUrl}/api/products?category=Lifestyle`);
    const categoryResult = await categoryRes.json();
    assert(categoryResult.length === 3, "Category filtering 'Lifestyle' returns exactly 3 products");

    // --------------------------------------------------
    // TEST 2: Fetch Single Product details
    // --------------------------------------------------
    console.log("\nTest 2: Fetch single product details...");
    const targetProduct = products[0];
    const detailsRes = await fetch(`${baseUrl}/api/products/${targetProduct.id}`);
    assert(detailsRes.status === 200, "Details endpoint returns 200 OK");
    
    const details = await detailsRes.json();
    assert(details.id === targetProduct.id, "Correct product details returned");
    assert(details.features.length > 0, "Product features list is populated");

    // --------------------------------------------------
    // TEST 3: Submit Order without Auth (Should fail)
    // --------------------------------------------------
    console.log("\nTest 3: Submit order without authorization (Should fail)...");
    const orderPayload = {
      items: [{ productId: targetProduct.id, quantity: 2 }],
      shippingAddress: {
        fullname: "John Doe",
        address: "123 Test St",
        city: "Testville",
        zipcode: "99999"
      },
      paymentDetails: {
        cardName: "John Doe",
        cardNumber: "4111222233334444",
        cardExpiry: "12/28",
        cardCvc: "123"
      }
    };

    const failOrderRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    assert(failOrderRes.status === 401, "Unauthenticated order submission blocked with 401 Unauthorized");

    // --------------------------------------------------
    // TEST 4: User Registration
    // --------------------------------------------------
    console.log("\nTest 4: Register a new customer...");
    const testEmail = `tester-${Date.now()}@luminaluxe.com`;
    const registerPayload = {
      name: "Automated Tester",
      email: testEmail,
      password: "testerpassword"
    };

    const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload)
    });
    assert(registerRes.status === 201, "Customer registration returns 201 Created");
    
    const registerData = await registerRes.json();
    assert(registerData.user.email === testEmail, "Registration email matches registration record");
    
    // Capture session cookie from headers
    const rawCookies = registerRes.headers.get('set-cookie');
    if (rawCookies) {
      savedCookie = rawCookies.split(';')[0];
    }
    assert(savedCookie.startsWith('token='), "Successfully saved user authentication session token cookie");

    // --------------------------------------------------
    // TEST 5: Verify Auth State (Me endpoint)
    // --------------------------------------------------
    console.log("\nTest 5: Verify user current state (Me endpoint)...");
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Cookie': savedCookie }
    });
    assert(meRes.status === 200, "Authenticated Me endpoint returns 200 OK");
    const meData = await meRes.json();
    assert(meData.user.name === "Automated Tester", "Authenticated profile name matches registered customer");

    // --------------------------------------------------
    // TEST 6: Submit Order with Auth (Should succeed)
    // --------------------------------------------------
    console.log("\nTest 6: Submit purchase order with authenticated session...");
    const orderRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': savedCookie
      },
      body: JSON.stringify(orderPayload)
    });
    assert(orderRes.status === 201, "Order successfully processed and created with 210 Created");
    const orderResult = await orderRes.json();
    assert(orderResult.order.status === 'Pending', "Order is successfully placed in 'Pending' status");
    assert(orderResult.order.items[0].quantity === 2, "Ordered item quantity is recorded correctly");
    
    // Double check inventory stock deduction
    const productCheckRes = await fetch(`${baseUrl}/api/products/${targetProduct.id}`);
    const productCheck = await productCheckRes.json();
    assert(productCheck.stock === targetProduct.stock - 2, "Product inventory stock level deducted correctly (-2)");

    // --------------------------------------------------
    // TEST 7: Customer Order History
    // --------------------------------------------------
    console.log("\nTest 7: Fetch customer's personal order history...");
    const historyRes = await fetch(`${baseUrl}/api/orders/my-orders`, {
      headers: { 'Cookie': savedCookie }
    });
    assert(historyRes.status === 200, "Order history endpoint returns 200 OK");
    const history = await historyRes.json();
    assert(history.length === 1, "Customer history contains exactly 1 order record");
    assert(history[0].id === orderResult.order.id, "History order ID matches purchased receipt");

    // --------------------------------------------------
    // TEST 8: Admin Privileges Access Controls
    // --------------------------------------------------
    console.log("\nTest 8: Test administrative route security blocks...");
    const adminFailRes = await fetch(`${baseUrl}/api/admin/orders`, {
      headers: { 'Cookie': savedCookie } // Normal user cookie
    });
    assert(adminFailRes.status === 403, "Access to administrative endpoints blocked for normal users with 403 Forbidden");

    // Now log in as predefined seeded Admin
    console.log("\nTest 9: Sign in as administrator and inspect system transactions...");
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "admin@luminaluxe.com",
        password: "adminpassword"
      })
    });
    assert(adminLoginRes.status === 200, "Admin login successful");
    
    const adminCookie = adminLoginRes.headers.get('set-cookie').split(';')[0];
    
    // Fetch all orders as admin
    const adminOrdersRes = await fetch(`${baseUrl}/api/admin/orders`, {
      headers: { 'Cookie': adminCookie }
    });
    assert(adminOrdersRes.status === 200, "Admin successfully fetches master order ledger");
    const adminOrders = await adminOrdersRes.json();
    assert(adminOrders.length > 0, "Master orders database contains submitted order");

    // Update order status as admin
    const targetOrderId = orderResult.order.id;
    console.log(`\nTest 10: Change delivery logistics status for Order #${targetOrderId} to Shipped...`);
    const statusUpdateRes = await fetch(`${baseUrl}/api/admin/orders/${targetOrderId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': adminCookie
      },
      body: JSON.stringify({ status: 'Shipped' })
    });
    assert(statusUpdateRes.status === 200, "Admin order status update returns 200 OK");
    const statusUpdate = await statusUpdateRes.json();
    assert(statusUpdate.order.status === 'Shipped', "Order status successfully updated to 'Shipped'");

    console.log("\n==============================================");
    console.log("   🎉 ALL 10 TEST CASES COMPLETED SUCCESSFULLY!");
    console.log("==============================================\n");
    shutdown(0);
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILED WITH AN ERROR:\n", err);
    shutdown(1);
  }
}

function shutdown(exitCode) {
  if (serverProcess) {
    console.log("Shutting down automated test server...");
    serverProcess.kill();
  }
  // Re-seed DB to clear test registrations and transactions, keeping catalog clean
  const { execSync } = require('child_process');
  try {
    console.log("Re-seeding database to restore clean state...");
    execSync('npm run seed', { stdio: 'ignore' });
  } catch (e) {
    console.error("Re-seed failed:", e);
  }
  process.exit(exitCode);
}

// Main logic launcher
async function main() {
  console.log("Launching test Express server on port 3080...");
  
  serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
    env: { ...process.env, PORT: PORT, JWT_SECRET: 'test-secret-key' },
    shell: true
  });

  serverProcess.stdout.on('data', (data) => {
    // console.log(`[Server]: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data}`);
  });

  // Wait for server to boot (give enough time for offline database timeouts to complete)
  await sleep(6000);

  // Run tests
  await runTests();
}

main();
