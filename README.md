# Divaksha - Referral E-commerce System Frontend

A complete React TypeScript frontend application for the Divaksha referral e-commerce system. This application provides a user interface for managing users, orders, sales, commission ledger, and referral shift history.

## Tech Stack

- **React 19.2.0** with **TypeScript**
- **React Router v6** for routing
- **Axios** for HTTP requests
- **React Bootstrap** (Bootstrap 5.3.2) for UI components
- **React Hook Form** for form validation
- **qrcode.react** for UPI QR code generation
- **Create React App** for build tooling

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Spring Boot backend running at `http://localhost:8080/api` (for development)

## Installation

1. Install dependencies:

```bash
npm install
```

## Environment Variables

Create environment variable files in the root directory:

### `.env.development`
```
REACT_APP_API_BASE_URL=http://localhost:8080/api
REACT_APP_UPI_ID=your-vpa@bank
REACT_APP_MERCHANT_NAME=Divaksha
```

### `.env.production`
```
REACT_APP_API_BASE_URL=/api
REACT_APP_UPI_ID=your-vpa@bank
REACT_APP_MERCHANT_NAME=Divaksha
```

**Note:** Replace `your-vpa@bank` with your actual UPI Virtual Payment Address (VPA).

## Available Scripts

### Development

```bash
npm start
```

Runs the app in development mode at [http://localhost:3000](http://localhost:3000). The page will reload automatically when you make changes.

### Build

```bash
npm run build
```

Builds the app for production to the `build` folder. The build is optimized and minified for best performance.

### Test

```bash
npm test
```

Launches the test runner in interactive watch mode.

## Application Structure

```
src/
├── api/                    # API service layer
│   ├── apiClient.ts       # Axios instance with base configuration
│   ├── userService.ts     # User-related API calls
│   ├── saleService.ts     # Sale-related API calls
│   ├── orderService.ts    # Order-related API calls
│   ├── ledgerService.ts   # Commission ledger API calls
│   └── shiftHistoryService.ts  # Shift history API calls
├── components/            # Reusable UI components
│   ├── Navbar/           # Navigation bar
│   ├── Loader/           # Loading spinner
│   ├── Alert/            # Alert/Toast component
│   └── ConfirmModal/     # Confirmation modal
├── pages/                # Page components
│   ├── Home/             # Home page (same as OrdersPage)
│   ├── UsersList/        # Users list page
│   ├── UserDetail/       # User detail page
│   ├── SalesList/        # Sales list page
│   ├── SaleCreate/       # Create sale page
│   ├── OrdersPage/       # Order placement page
│   ├── LedgerList/       # Commission ledger page
│   └── ShiftHistoryList/ # Shift history page
├── types/                # TypeScript interfaces
│   └── index.ts          # All type definitions
├── App.tsx               # Main app component with routing
└── index.tsx             # Application entry point
```

## Routes

- `/` - Home page (Order placement with UPI QR)
- `/users` - Users list with pagination
- `/users/:id` - User detail page
- `/sales` - Sales list with pagination
- `/sales/create` - Create new sale
- `/orders` - Order placement page
- `/ledger` - Commission ledger with pagination
- `/shift-history` - Referral shift history with pagination

## Features

### Users Management
- View paginated list of users with status badges
- View user details including parent relationships
- Activate/Deactivate users
- View direct children of a user

### Sales Management
- View paginated list of sales
- Create new sales (admin/testing)

### Order Placement
- Display product information (Health Supplement - ₹499)
- Generate UPI QR code for payment
- Place orders with Payment Proof
- Confirm orders to create sales and update ledger

### Commission Ledger
- View paginated commission ledger entries
- See beneficiary users, levels, percentages, and amounts

### Referral Shift History
- View paginated referral shift history
- Track when users were shifted due to inactive parents
- See reverted status

## API Integration

The application expects a Spring Boot REST API at the following endpoints:

### Base URL
- Development: `http://localhost:8080/api`
- Production: `/api` (relative path)

### Endpoints Used

- `GET /users` - List users (paginated)
- `GET /users/:id` - Get user by ID
- `POST /users/register` - Register new user
- `POST /admin/activate/:id` - Activate user
- `POST /admin/deactivate/:id` - Deactivate user
- `GET /sales` - List sales (paginated)
- `POST /sales` - Create sale
- `GET /orders` - List orders
- `POST /orders` - Create order
- `POST /orders/confirm/:id` - Confirm order
- `GET /admin/ledger` - Get commission ledger (paginated)
- `GET /admin/shift-history` - Get shift history (paginated)

## Building for Production

1. Build the application:

```bash
npm run build
```

2. Copy the `build` folder contents to your Spring Boot project:

### Option 1: Copy to `src/main/resources/static`

```bash
# Windows (PowerShell)
Copy-Item -Path "build\*" -Destination "..\spring-boot-project\src\main\resources\static\" -Recurse -Force

# Linux/Mac
cp -r build/* ../spring-boot-project/src/main/resources/static/
```

### Option 2: Copy to `src/main/webapp`

```bash
# Windows (PowerShell)
Copy-Item -Path "build\*" -Destination "..\spring-boot-project\src\main\webapp\" -Recurse -Force

# Linux/Mac
cp -r build/* ../spring-boot-project/src/main/webapp/
```

3. Package your Spring Boot application as WAR:

```bash
cd ../spring-boot-project
mvn clean package
```

## Deployment Notes

- The production build uses relative paths for API calls (`/api`), so it works when served from the Spring Boot application root.
- Ensure your Spring Boot application serves static files correctly.
- For client-side routing to work, configure Spring Boot to serve `index.html` for all routes (except API routes).

### Spring Boot Configuration Example

Add this to your Spring Boot configuration to handle client-side routing:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        return requestedResource.exists() && requestedResource.isReadable()
                                ? requestedResource
                                : new ClassPathResource("/static/index.html");
                    }
                });
    }
}
```

## Customization

### Changing UPI ID

1. Update the environment variables (`.env.development` and `.env.production`):
   ```
   REACT_APP_UPI_ID=your-new-vpa@bank
   REACT_APP_MERCHANT_NAME=Your Merchant Name
   ```

2. Rebuild the application:
   ```bash
   npm run build
   ```

3. Copy the new build to your Spring Boot project.

### Changing Product Details

Edit `src/pages/OrdersPage/OrdersPage.tsx` and update the `PRODUCT` constant:

```typescript
const PRODUCT = {
  productId: 1,
  name: 'Your Product Name',
  price: 999, // Price in rupees
};
```

## Troubleshooting

### API Connection Issues

- Ensure the Spring Boot backend is running
- Check the `REACT_APP_API_BASE_URL` in your environment variables
- Verify CORS is configured correctly in your Spring Boot backend

### Build Issues

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf build && npm run build`

### Routing Issues in Production

- Ensure Spring Boot is configured to serve `index.html` for all non-API routes
- Check that static files are being served from the correct location

## License

This project is part of the Divaksha referral e-commerce system.
