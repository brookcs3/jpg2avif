# Creating a New Replit Project for JPGFlip

Follow these steps to create a separate project for JPGFlip:

## Step 1: Create New Project
1. Go to [Replit](https://replit.com/~)
2. Click "Create Repl"
3. Select "Template" > "Node.js"
4. Name your project "JPGFlip"
5. Click "Create Repl"

## Step 2: Upload Files
1. In your new Repl, click on the three dots in the file tree
2. Select "Upload file"
3. Upload the `jpgflip-project.zip` file you downloaded from this project
4. After upload, click on the three dots in the file tree again
5. Select "Show hidden files" to see the `.replit` file

## Step 3: Extract Files
Run these commands in the Shell:
```bash
unzip jpgflip-project.zip
rm jpgflip-project.zip
```

## Step 4: Set Up Configuration
1. Replace the contents of the `.replit` file with:
```
run = "npm run dev"
hidden = [".config", "package-lock.json"]

[packager]
language = "nodejs"

[languages.javascript]
pattern = "**/*.{js,jsx,ts,tsx}"
syntax = "javascript"

[languages.javascript.languageServer]
start = [ "typescript-language-server", "--stdio" ]

[env]
XDG_CONFIG_HOME = "/home/runner/.config"
PATH = "/home/runner/$REPL_SLUG/.config/npm/node_global/bin:/home/runner/$REPL_SLUG/node_modules/.bin"
npm_config_prefix = "/home/runner/$REPL_SLUG/.config/npm/node_global"

[nix]
channel = "stable-22_11"

[gitHubImport]
requiredFiles = [".replit", "replit.nix", ".config"]
```

## Step 5: Install Dependencies
Run in the Shell:
```bash
npm install
```

## Step 6: Test the Project
1. Start the development server by clicking "Run"
2. Your JPGFlip application should now start up in the preview window

## Step 7: Set Up Github Repository (Optional)
1. Connect your Repl to GitHub by clicking on the "Version Control" icon in the sidebar
2. Follow the prompts to link to your GitHub repository

Now you have a separate Replit project for JPGFlip that you can manage independently!