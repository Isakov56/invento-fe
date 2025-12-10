# Cloudinary Image Deletion Setup

## Frontend Changes ✅ COMPLETE

The frontend now handles image deletion with the following logic:

1. **When user removes an image**:
   - Image URL is cleared from the form
   - On save, the `deleteImage` endpoint is called with the image URL

2. **When user replaces an image**:
   - New image is uploaded to Cloudinary
   - Old image is automatically deleted from Cloudinary
   - Product is updated with new image URL

3. **When user saves without changes**:
   - No deletion occurs

## Backend Setup Required ⚠️

Your backend needs to implement the **`DELETE /upload/image/:imageUrl`** endpoint that can delete images from Cloudinary.

### Backend Implementation Steps:

#### 1. **Create a function to extract Cloudinary Public ID from URL**

```javascript
// utils/cloudinary.js (or similar)
function extractPublicIdFromUrl(url) {
  // Extract public ID from Cloudinary URL
  // Example: https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1234567890/products/filename.jpg
  // Should return: products/filename
  
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
  return match ? match[1] : null;
}
```

#### 2. **Create DELETE endpoint**

```javascript
// routes/upload.js
router.delete('/upload/image/:imageUrl(*)', async (req, res) => {
  try {
    const { imageUrl } = req.params;
    
    // Validate that it's a Cloudinary URL
    if (!imageUrl || !imageUrl.includes('res.cloudinary.com')) {
      return res.status(400).json({ error: 'Invalid image URL' });
    }

    // Extract public ID from URL
    const publicId = extractPublicIdFromUrl(imageUrl);
    if (!publicId) {
      return res.status(400).json({ error: 'Could not extract public ID from URL' });
    }

    // Delete from Cloudinary
    const result = await cloudinary.v2.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      return res.json({ data: { success: true, message: 'Image deleted successfully' } });
    } else {
      return res.status(400).json({ error: 'Failed to delete image from Cloudinary' });
    }
  } catch (error) {
    console.error('Image deletion error:', error);
    return res.status(500).json({ error: error.message });
  }
});
```

#### 3. **Important Notes**

- The endpoint receives the **full Cloudinary URL** (not just filename)
- You must extract the **public ID** from the URL to delete it
- The public ID is the part before the file extension: `products/filename`
- Handle errors gracefully - deletion failures shouldn't prevent product updates

### Testing the Setup

1. Upload a product with an image
2. Go to DevTools → Network tab
3. Remove the image and save the product
4. You should see a DELETE request to `/upload/image/{url}`
5. Check Cloudinary dashboard - image should be deleted

### Example Cloudinary Delete in Node.js

```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Delete image
await cloudinary.uploader.destroy(publicId);
```

## Frontend Flow Summary

```
User removes image from form
         ↓
User clicks Save
         ↓
Frontend checks if original image exists and is being removed
         ↓
Frontend calls DELETE /upload/image/{imageUrl}
         ↓
Backend extracts public ID from URL
         ↓
Backend calls cloudinary.uploader.destroy(publicId)
         ↓
Image deleted from Cloudinary + Product saved to DB
```

This ensures no orphaned images are left in Cloudinary storage!
