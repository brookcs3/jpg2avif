# How to Use AVIFlip as a Template

This project can be used as a template to create new image conversion applications with different branding, colors, and conversion types.

## Creating a New Project from Template

### Step 1: Use the Template Script

Run the template script with your desired configuration:

```bash
./create-project-from-template.sh <project-directory> "<site-name>" "<primary-color>" "<conversion-mode>"
```

Example:
```bash
./create-project-from-template.sh webp-flip "WebPFlip" "#9333ea" "jpgToWebp"
```

This creates a new project with:
- Directory: `webp-flip`
- Name: "WebPFlip"
- Purple color scheme (#9333ea)
- Default conversion: JPG to WebP

### Step 2: Navigate to Your New Project

```bash
cd <project-directory>
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Start Development Server

```bash
npm run dev
```

## Available Color Schemes

The script includes preset color combinations for:

- **Blue**: `#3b82f6` (AVIFlip default)
- **Green**: `#10b981` (JPGFlip default)
- **Red**: `#dc2626`
- **Purple**: `#9333ea`
- **Orange**: `#f97316`

## Supported Conversion Modes

The template currently supports these conversion modes:

- `avifToJpg`: Convert AVIF images to JPG (AVIFlip default)
- `jpgToAvif`: Convert JPG images to AVIF (JPGFlip default)

## Customization

After creating your project, you can further customize:

1. **Add New Conversion Types**:
   - Extend the `ConversionMode` type in `client/src/config.ts`
   - Add the conversion logic in `client/src/workers/conversion.worker.ts`

2. **Modify the UI**:
   - Main interface: `client/src/components/DropConvert.tsx`
   - Header: `client/src/components/Header.tsx`
   - Footer: `client/src/components/Footer.tsx`

## Deployment

Each project can be deployed to Cloudflare Pages:

1. **Build settings**:
   - Build command: `npm run build`
   - Build output directory: `dist/public`
   - **IMPORTANT**: When uploading or deploying, be sure to select "Deploy to production" option to deploy to your main domain

2. **GitHub integration**:
   - You can create a GitHub repository for each project
   - Connect Cloudflare Pages to your GitHub repository

3. **Manual deployment**:
   - Use the provided deploy scripts as a reference
   - Create custom deployment scripts for your needs