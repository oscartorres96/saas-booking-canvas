# Quick Start Guide - Role-Based Dashboards

## 🚀 How to Test the New Features

### Prerequisites
1. Backend running on `http://localhost:3000`
2. Frontend running on `http://localhost:8080` (or your configured port)
3. Database with test users for each role

---

## 👤 User Roles & Access

### 1. OWNER (Superadmin)
**Login Credentials:** Use your owner account
**Auto-redirect:** `/admin`

**What you can do:**
- ✅ View all businesses in the platform
- ✅ See platform-wide statistics
- ✅ Access any business's dashboard
- ✅ Manage all businesses

**URLs to try:**
- `http://localhost:8080/admin` - Main admin dashboard
- `http://localhost:8080/business/{any-businessId}/dashboard` - Any business dashboard

---

### 2. BUSINESS (Business Owner/Admin)
**Login Credentials:** Use your business account
**Auto-redirect:** `/business/{your-businessId}/dashboard`

**What you can do:**
- ✅ View YOUR business dashboard only
- ✅ Create and manage services
- ✅ View and manage bookings
- ✅ See business statistics
- ❌ Cannot access other businesses

**URLs to try:**
- `http://localhost:8080/business/{your-businessId}/dashboard` - Your dashboard
- `http://localhost:8080/business/{other-businessId}/dashboard` - ⛔ Will redirect (blocked)

---

### 3. CLIENT (End User)
**Login Credentials:** Use your client account
**Auto-redirect:** `/business/{your-businessId}/booking`

**What you can do:**
- ✅ Browse services
- ✅ Create bookings
- ✅ View your bookings
- ❌ Cannot access business dashboards

**URLs to try:**
- `http://localhost:8080/business/{businessId}/booking` - Book appointments

---

## 🧪 Testing Scenarios

### Scenario 1: Owner Managing Multiple Businesses
```
1. Login as owner
2. You'll see /admin with all businesses
3. Click "View dashboard" on any business
4. You'll navigate to that business's dashboard
5. Create a service for that business
6. Go back to /admin
7. Repeat for another business
```

### Scenario 2: Business Owner Managing Services
```
1. Login as business user
2. You'll see /business/{your-id}/dashboard
3. Click "Create Service"
4. Fill in: Name, Description, Duration, Price
5. Submit
6. Service appears in the services table
7. View upcoming bookings section
```

### Scenario 3: Client Making a Booking
```
1. Login as client
2. You'll see /business/{business-id}/booking
3. Browse available services (cards)
4. Click on a service to select it
5. Fill booking form:
   - Select service from dropdown
   - Pick a date (calendar)
   - Choose time
   - Enter your details
6. Submit
7. See success message
8. Your booking appears in "My Bookings" section
```

### Scenario 4: Authorization Testing
```
1. Login as business user (businessId: "123")
2. Try to access /business/456/dashboard
3. You should be redirected to "/"
4. Only owner can access other businesses
```

---

## 🔑 API Endpoints Used

Make sure your backend has these endpoints:

### Businesses
- `GET /api/businesses` - List all (owner only)
- `GET /api/businesses/:id` - Get one
- `POST /api/businesses` - Create (future)

### Services
- `GET /api/services?businessId={id}` - List by business
- `POST /api/services` - Create new service

### Bookings
- `GET /api/bookings?businessId={id}` - List by business
- `GET /api/bookings?clientId={id}` - List by client
- `POST /api/bookings` - Create booking

### Users
- `GET /api/users` - List all (optional, for stats)
- `GET /api/auth/me` - Current user profile

---

## 🎨 UI Components Used

All pages use your existing design system:
- Shadcn/ui components
- Tailwind CSS classes
- Responsive layouts
- Form validation with Zod
- Toast notifications (Sonner)

---

## 📱 Responsive Design

All dashboards work on:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)

Test by resizing your browser or using DevTools device emulation.

---

## 🐛 Troubleshooting

### "No businesses found"
- Check backend is running
- Verify `/api/businesses` endpoint
- Check user has owner role

### "Business not found"
- Verify businessId in URL is correct
- Check business exists in database
- Ensure user has access (role + businessId match)

### "No services available"
- Business might not have created services yet
- Use "Create Service" button in business dashboard
- Check `/api/services?businessId={id}` returns data

### Redirected to login
- Token might be expired
- Check localStorage for access token
- Verify `/api/auth/me` returns user data

### Redirected to "/"
- User doesn't have required role
- Business user trying to access wrong businessId
- Check PrivateRoute authorization logic

---

## 🔄 Development Workflow

### Making Changes
```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run start:dev
```

### Building for Production
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

---

## 📊 Data Flow

```
User Login
    ↓
AuthContext stores user (role, businessId)
    ↓
Router checks role
    ↓
Redirect to appropriate dashboard
    ↓
Dashboard fetches data via API
    ↓
Display UI with data
```

---

## 🎯 Next Steps

1. **Test each role** with real backend data
2. **Create test users** for each role in your database
3. **Verify API endpoints** return expected data
4. **Test authorization** - try accessing restricted routes
5. **Mobile testing** - check responsive layouts
6. **Error scenarios** - test with network errors, missing data

---

## 💡 Tips

- Use browser DevTools Network tab to monitor API calls
- Check Console for any errors
- Use React DevTools to inspect component state
- Test logout and re-login flows
- Verify token refresh works correctly

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify backend logs
3. Confirm API responses match expected format
4. Review ROLE_BASED_DASHBOARDS.md for detailed docs

Happy testing! 🎉
