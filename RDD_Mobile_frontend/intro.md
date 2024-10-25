# Welcome to the mobile app guide 👋

## Basic operation flow

1. Login to the app
   This will invoke handleLoginRedirect() function in /app/index/jsx.
   After successful login, it will navigate to the photo upload screen.

2. (Option 1) Capture an image
   This will invoke uploadPhotoFromCamera() function in /app/PhotoUploadScreen.jsx.
   After successful upload, a 'Succussful Upload' alert message will pop up on screen.

   OR

   (Option 2) UPload image(s) directly from photo library
   This will invoke uploadSelectedPhotos() function in /app/PhotoUploadScreen.jsx.
   After successful upload, a 'Succussful Upload' alert message will pop up on screen.
