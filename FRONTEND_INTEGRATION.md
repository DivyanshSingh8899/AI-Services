# Frontend-Backend Integration Guide

## 🚀 Backend API Endpoints

The backend is running on `http://localhost:5000` with the following endpoints:

### Contact Form
- **POST** `/api/contact` - Submit contact form
- **GET** `/api/contact` - Get all contacts (admin)
- **GET** `/api/contact/stats` - Get contact statistics

### Demo Booking
- **POST** `/api/demo/book` - Book a demo session
- **GET** `/api/demo/availability` - Check available demo slots
- **GET** `/api/demo/slots` - Get all demo slots

### AI Bot
- **POST** `/api/ai-bot` - Create AI bot
- **POST** `/api/ai-bot/:id/chat` - Chat with AI bot
- **GET** `/api/ai-bot/:id/performance` - Get bot performance

### Analytics
- **POST** `/api/analytics/activity` - Log activity
- **GET** `/api/analytics/stats` - Get analytics stats

## 🔧 Frontend Integration

### 1. Contact Form Integration

Update your contact form in `src/app/contact/page.tsx`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const response = await fetch('http://localhost:5000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    const result = await response.json();
    
    if (result.error) {
      // Handle error
      console.error('Submission failed:', result.message);
    } else {
      // Handle success
      console.log('Form submitted successfully:', result);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

### 2. Demo Booking Integration

Update your demo booking form:

```typescript
const handleDemoBooking = async (demoData: any) => {
  try {
    const response = await fetch('http://localhost:5000/api/demo/book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(demoData),
    });
    
    const result = await response.json();
    
    if (result.error) {
      // Handle error
      console.error('Demo booking failed:', result.message);
    } else {
      // Handle success
      console.log('Demo booked successfully:', result);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

### 3. Environment Configuration

Create `.env.local` in your frontend root:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_ENVIRONMENT=development
```

## 🧪 Testing the Integration

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Start Frontend
```bash
npm run dev
```

### 3. Test API Endpoints
```bash
cd backend
node test-api.js
```

## 📱 Form Data Structure

### Contact Form
```typescript
interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  businessName: string;
  businessType: 'retail' | 'clinic' | 'restaurant' | 'gym' | 'ecommerce' | 'service' | 'other';
  inquiryType: 'demo' | 'pricing' | 'custom' | 'support' | 'other';
  message?: string;
}
```

### Demo Booking
```typescript
interface DemoBooking {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: string;
  preferredDate: string; // ISO date string
  preferredTime: '09:00' | '10:00' | '11:00' | '14:00' | '15:00' | '16:00' | '17:00';
  demoType: 'ai-support-bot' | 'ai-automation' | 'ai-analytics' | 'custom';
  teamSize?: number;
  currentChallenges?: string;
}
```

## 🚨 Error Handling

The backend returns consistent error responses:

```typescript
// Success Response
{
  error: false,
  message: "Success message",
  data: { ... }
}

// Error Response
{
  error: true,
  message: "Error message",
  details?: [ ... ] // Validation errors
}
```

## 🔒 CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (Frontend dev server)
- `http://localhost:3001` (Alternative frontend port)

## 📊 Monitoring

Check backend health at: `http://localhost:5000/health`

Response includes:
- Server status
- Database connection status
- Timestamp
- Environment info
